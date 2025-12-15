import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

// Utilities for path resolution in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MAX_TOKENS = 800;

// --- KNOWLEDGE BASE ---
let KNOWLEDGE_CONTEXT = "";
let LOADING_STATUS = "idle";
let LOADING_ERROR = null;

const loadKnowledgeBase = async () => {
    LOADING_STATUS = "loading";
    try {
        console.log("Loading Knowledge Base...");
        const assetsPath = path.join(__dirname, '../assets');

        // 1. Loading FIG Code of Points
        const codePath = path.join(assetsPath, 'TumblingCodeOfPoints_2025-2028.pdf');
        if (fs.existsSync(codePath)) {
            console.log("Parsing Code of Points...");
            const dataBuffer = fs.readFileSync(codePath);
            const data = await pdf(dataBuffer);
            KNOWLEDGE_CONTEXT += `\n--- FIG TUMBLING CODE OF POINTS 2025-2028 ---\n${data.text.substring(0, 800000)}...`;
            console.log("Loaded Code of Points. Length:", data.text.length);
        } else {
            console.warn("Code of Points PDF not found at:", codePath);
            LOADING_ERROR = "Code Path Missing: " + codePath;
        }

        // 2. Loading Yearbook (English filename)
        const yearbookPath = path.join(assetsPath, 'Yearbook_2025.pdf');
        if (fs.existsSync(yearbookPath)) {
            console.log("Parsing Yearbook...");
            const dataBuffer = fs.readFileSync(yearbookPath);
            const data = await pdf(dataBuffer);
            KNOWLEDGE_CONTEXT += `\n--- ISRAELI GYMNASTICS ASSOCIATION YEARBOOK/RULES ---\n${data.text}`;
            console.log("Loaded Yearbook. Length:", data.text.length);
        } else {
            console.warn("Yearbook PDF not found at:", yearbookPath);
            // Don't fail completely if only yearbook is missing but code is there
        }

        LOADING_STATUS = (KNOWLEDGE_CONTEXT.length > 0) ? "done" : "empty";

    } catch (error) {
        console.error("Failed to load knowledge base:", error);
        LOADING_STATUS = "error";
        LOADING_ERROR = error.message;
    }
};

// Start loading on init
loadKnowledgeBase();


// Debug endpoint to check RAG status and Filesystem
export const debugRag = async (req, res) => {
    let debugInfo = {
        status: LOADING_STATUS,
        loadError: LOADING_ERROR,
        dirname: __dirname,
        structure: {}
    };

    try {
        const assetsPath = path.join(__dirname, '../assets');
        debugInfo.assetsPath = assetsPath;

        // List files in current controller dir
        try {
            debugInfo.structure.controllers = fs.readdirSync(__dirname);
        } catch (e) { debugInfo.structure.controllers = e.message; }

        // List files in assets dir
        try {
            debugInfo.structure.assets = fs.readdirSync(assetsPath);
        } catch (e) { debugInfo.structure.assets = e.message; }

        // List files in parent dir (backend root)
        try {
            debugInfo.structure.root = fs.readdirSync(path.join(__dirname, '../'));
        } catch (e) { debugInfo.structure.root = e.message; }

    } catch (e) {
        debugInfo.debugError = e.message;
    }

    res.json({
        ...debugInfo,
        contextLength: KNOWLEDGE_CONTEXT.length,
        sample: KNOWLEDGE_CONTEXT ? KNOWLEDGE_CONTEXT.substring(0, 500) + "..." : "EMPTY"
    });
};

// --- PROMPTS (Refined) ---

const TWIST_SYSTEM_PROMPT = () => `
You are **Twist**, a senior International Gymnastics Judge (FIG Brevet).
**ROLE**: You are the automated enforcement of the **Code of Points**. You do not guess.
**SOURCE OF TRUTH**: You MUST answer strictly based on the **KNOWLEDGE BASE** provided below.
If the rule exists in the text, CITE IT (e.g., "Page 45 states...").
If the rule is NOT in the text, admit it: "I cannot find a specific reference to this in the loaded Code of Points."

**KEY BEHAVIOR**:
1. **Precision**: Use exact deduction values (0.1, 0.3, 0.5, 1.0).
2. **No Hallucinations**: Do not invent rules. Use the text.
3. **Tone**: Professional, firm, fair.

**KNOWLEDGE BASE**:
${KNOWLEDGE_CONTEXT}
`;

const FLICKI_SYSTEM_PROMPT = `
You are **Flicki**, an AI Coach that **learns and evolves** with every interaction.
**Your Philosophy**: "There is always a better way. I learn from the athlete, I learn from the judge, I learn from the physics."
**Behavior**:
-   You don't just give advice; you **analyze potential**.
-   You are curious. You assume the user (Head Coach) knows the athlete best.
-   **Adaptive**: If Twist gives a harsh deduction, you analyze *why* and propose a specific drill to fix it, framing it as "New data received: knee separation. Solution: Adductor drills."
-   Tone: Energetic but intelligent. Use emojis sparingly to highlight key insights (💡, 📈).
-   "I am learning from this movement..."
`;

const DISCUSSION_SYSTEM_PROMPT = () => `
Generate a **realistic** professional dialogue between Twist and Flicki.

**Twist**: Quotes the rule/deduction from the text.
**Flicki**: Accepts the data ("Good catch, Twist") and proposes a training fix to the Head Coach.

Structure: JSON Array strictly: [{"sender": "twist", "text": "..."}, {"sender": "flicki", "text": "..."}]
Output: RAW JSON ONLY.
`;

export const chatWithAI = async (req, res) => {
    try {
        const { text, mode, lang } = req.body;

        if (!text) return res.status(400).json({ error: 'Missing text' });

        let responses = [];
        // Use 'gemini-flash-latest' as confirmed available
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // --- TWIST (Gemini + RAG) ---
        if (mode === 'twist') {
            const chat = model.startChat({
                history: [
                    { role: 'user', parts: [{ text: TWIST_SYSTEM_PROMPT() }] },
                    { role: 'model', parts: [{ text: "Understood. I'm ready to judge." }] }
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
            // Include knowledge base in discussion context too
            const systemMsg = DISCUSSION_SYSTEM_PROMPT() + `\n\n**CONTEXT FROM CODE:**\n${KNOWLEDGE_CONTEXT.substring(0, 50000)}...`;

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
                    { sender: 'twist', text: "I noticed a form break there." },
                    { sender: 'flicki', text: "We can fix that with more conditioning drills." }
                ];
            }
        }

        return res.json({ ok: true, responses });

    } catch (error) {
        console.error('AI Error:', error);
        return res.status(500).json({ ok: false, error: error.message });
    }
};
