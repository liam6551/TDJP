import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const mammoth = require('mammoth');

// Utilities for path resolution in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MAX_TOKENS = 800;

// --- KNOWLEDGE BASE ---
let KNOWLEDGE_CONTEXT = "";
let LOADING_STATUS = "idle";
let LOADING_DETAILS = {
    code: "pending",
    yearbook: "pending",
    summary: "pending"
};

const loadKnowledgeBase = async () => {
    LOADING_STATUS = "loading";
    let contextParts = [];

    try {
        console.log("Loading Knowledge Base (TXT/DOCX)...");
        const assetsPath = path.join(__dirname, '../assets');

        // 1. Loading FIG Code of Points (TXT)
        const codePath = path.join(assetsPath, 'TRACoP2025-2028.txt');
        if (fs.existsSync(codePath)) {
            const text = fs.readFileSync(codePath, 'utf-8');
            contextParts.push(`\n--- FIG TUMBLING CODE OF POINTS 2025-2028 ---\n${text}`);
            LOADING_DETAILS.code = "success (" + text.length + " chars)";
            console.log("Loaded Code of Points (TXT)");
        } else {
            console.warn("Code (TXT) not found:", codePath);
            LOADING_DETAILS.code = "missing";
        }

        // 2. Loading Age Levels / Yearbook (TXT)
        const agePath = path.join(assetsPath, 'AgeLevels.txt');
        if (fs.existsSync(agePath)) {
            const text = fs.readFileSync(agePath, 'utf-8');
            contextParts.push(`\n--- COMPETITION AGE LEVELS & RULES ---\n${text}`);
            LOADING_DETAILS.yearbook = "success (" + text.length + " chars)";
            console.log("Loaded Age Levels (TXT)");
        } else {
            console.warn("Age Levels (TXT) not found:", agePath);
            LOADING_DETAILS.yearbook = "missing";
        }

        // 3. Loading Judging Summary (DOCX)
        const summaryPath = path.join(assetsPath, 'TumblingJudgingSummery.docx');
        if (fs.existsSync(summaryPath)) {
            try {
                const buffer = fs.readFileSync(summaryPath);
                const result = await mammoth.extractRawText({ buffer: buffer });
                const text = result.value;
                contextParts.push(`\n--- JUDGING SUMMARY TABLE & NOTES ---\n${text}`);
                LOADING_DETAILS.summary = "success (" + text.length + " chars)";
                console.log("Loaded Judging Summary (DOCX)");
            } catch (err) {
                console.error("Error parsing DOCX:", err);
                LOADING_DETAILS.summary = "error: " + err.message;
            }
        } else {
            console.warn("Summary (DOCX) not found:", summaryPath);
            LOADING_DETAILS.summary = "missing";
        }

        KNOWLEDGE_CONTEXT = contextParts.join("\n\n");
        LOADING_STATUS = (KNOWLEDGE_CONTEXT.length > 0) ? "done" : "empty";

    } catch (error) {
        console.error("Failed to load knowledge base:", error);
        LOADING_STATUS = "error";
        LOADING_DETAILS.globalError = error.message;
    }
};

// Start loading on init
loadKnowledgeBase();


// Debug endpoint
export const debugRag = async (req, res) => {
    res.json({
        status: LOADING_STATUS,
        details: LOADING_DETAILS,
        assetsPath: path.join(__dirname, '../assets'),
        contextLength: KNOWLEDGE_CONTEXT.length,
        sample: KNOWLEDGE_CONTEXT ? KNOWLEDGE_CONTEXT.substring(0, 500) + "..." : "EMPTY"
    });
};

// --- PROMPTS (Refined) ---

const TWIST_SYSTEM_PROMPT = () => `
You are **Twist**, a senior International Gymnastics Judge (FIG Brevet).
**Your Goal**: Provide clear, simple, and professional answers about **Tumbling (TUM)**.

**STRICT FORMATTING RULES (DO NOT IGNORE):**
1. **NO BOLDING**: Do NOT use asterisks (*) or double asterisks (**). usage.
   - BAD: The value is **0.3**.
   - GOOD: The value is 0.3.
2. **NO MARKDOWN BOLD**: Plain text only. Use emojis for separate sections instead.
   - Example: 🛑 Deduction: 0.1
3. **LANGUAGE PURITY**:
   - If writing in Hebrew: Write **100% Hebrew**. Do NOT insert English words mid-sentence.
   - Use English ONLY for official element codes (e.g. "Run", "Whip") if necessary, but keep the sentence Hebrew.
   - BAD: זה עושה landing לא טוב.
   - GOOD: הנחיתה לא הייתה טובה.

**BEHAVIOR**:
1. **Priority**: Look for **TUMBLING (TUM)** rules first. Ignore Trampoline (TRA) rules.
2. **Simple Explanation**: Don't quote the law. **Explain it** like you are talking to a coach in the gym. Short lines.
3. **Silent Citations**: Never say "According to the code...". Just say the rule.
4. **Structure**:
   - Use Bullet points (-) for lists.
   - Use Emojis (🔹, 🔸, ⚠️, ✅) to start lines.

**KNOWLEDGE BASE**:
${KNOWLEDGE_CONTEXT}
`;

const FLICKI_SYSTEM_PROMPT = `
You are **Flicki**, an AI Coach that **learns and evolves**.
**Philosophy**: "There is always a better way."
**Behavior**:
-   Analyze potential and physics.
-   Be curious. Respect the Head Coach (user).
-   **Adaptive**: If Twist gives a deduction, you analyze *why* (biomechanics) and propose a drill.
-   Tone: Energetic but intelligent (💡, 📈).
-   "I see what Twist is saying, let's look at the takeoff..."
`;

const DISCUSSION_SYSTEM_PROMPT = () => `
Generate a **realistic** professional dialogue between Twist (Judge) and Flicki (Coach).

**Twist**: Quotes the rule/deduction strictly from the text.
**Flicki**: Accepts the data and proposes a biomechanical/training fix.

Structure: JSON Array strictly: [{"sender": "twist", "text": "..."}, {"sender": "flicki", "text": "..."}]
Output: RAW JSON ONLY.
`;

export const chatWithAI = async (req, res) => {
    try {
        const { text, mode, lang } = req.body;

        if (!text) return res.status(400).json({ error: 'Missing text' });

        let responses = [];
        // Using 'gemini-2.0-flash' with the new paid API Key.
        // This should provide high performance without rate limits.
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // --- TWIST (Gemini + RAG) ---
        if (mode === 'twist') {
            const chat = model.startChat({
                history: [
                    { role: 'user', parts: [{ text: TWIST_SYSTEM_PROMPT() }] },
                    { role: 'model', parts: [{ text: "Understood. I am ready to judge based on the text." }] }
                ]
            });
            const result = await chat.sendMessage(text);
            responses.push({ sender: 'twist', text: result.response.text() });
        }

        // --- FLICKI (Gemini) ---
        else if (mode === 'flicki') {
            const chat = model.startChat({
                history: [
                    { role: 'user', parts: [{ text: FLICKI_SYSTEM_PROMPT }] },
                    { role: 'model', parts: [{ text: "Got it. Ready to coach." }] }
                ]
            });
            const result = await chat.sendMessage(text);
            responses.push({ sender: 'flicki', text: result.response.text() });
        }

        // --- DISCUSSION (Gemini Orchestrator) ---
        else if (mode === 'discussion') {
            const systemMsg = DISCUSSION_SYSTEM_PROMPT() + `\n\n**CONTEXT:**\n${KNOWLEDGE_CONTEXT.substring(0, 50000)}...`;

            const result = await model.generateContent({
                contents: [
                    { role: 'user', parts: [{ text: systemMsg + "\n\nUser Input: " + text }] }
                ],
                generationConfig: { responseMimeType: "application/json" }
            });

            const content = result.response.text();
            let parsed = [];
            try {
                const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
                parsed = JSON.parse(cleanJson);

                if (Array.isArray(parsed)) responses = parsed;
                else if (parsed.dialogue) responses = parsed.dialogue;
                else responses = parsed;
            } catch (e) {
                console.error("JSON Parse Error (Gemini):", e);
                responses = [
                    { sender: 'twist', text: "Verification needed on that element." },
                    { sender: 'flicki', text: "Let's review the video." }
                ];
            }
        }

        return res.json({ ok: true, responses });

    } catch (error) {
        console.error('AI Error:', error);
        return res.status(500).json({ ok: false, error: error.message });
    }
};
