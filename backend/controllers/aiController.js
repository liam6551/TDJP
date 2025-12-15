import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { fileURLToPath } from 'url';

// Utilities for path resolution in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MAX_TOKENS = 800;

// --- KNOWLEDGE BASE ---
let KNOWLEDGE_CONTEXT = "";

const loadKnowledgeBase = async () => {
    try {
        console.log("Loading Knowledge Base...");
        // Path to assets relative to backend folder
        const assetsPath = path.join(__dirname, '../../assets');

        // 1. Loading FIG Code of Points
        const codePath = path.join(assetsPath, 'TumblingCodeOfPoints_2025-2028.pdf');
        if (fs.existsSync(codePath)) {
            const dataBuffer = fs.readFileSync(codePath);
            const data = await pdf(dataBuffer);
            // Limit context if huge, but typically FIG code fits in Gemini's context
            KNOWLEDGE_CONTEXT += `\n--- FIG TUMBLING CODE OF POINTS 2025-2028 ---\n${data.text.substring(0, 800000)}...`;
            console.log("Loaded Code of Points");
        } else {
            console.warn("Code of Points PDF not found at:", codePath);
        }

        // 2. Loading Hebrew Yearbook/Additions
        const yearbookPath = path.join(assetsPath, 'שנתונים 2025-2026.pdf');
        if (fs.existsSync(yearbookPath)) {
            const dataBuffer = fs.readFileSync(yearbookPath);
            const data = await pdf(dataBuffer);
            KNOWLEDGE_CONTEXT += `\n--- ISRAELI GYMNASTICS ASSOCIATION YEARBOOK/RULES ---\n${data.text}`;
            console.log("Loaded Yearbook");
        } else {
            console.warn("Yearbook PDF not found at:", yearbookPath);
        }

    } catch (error) {
        console.error("Failed to load knowledge base:", error);
    }
};

// Start loading on init
loadKnowledgeBase();


// --- PROMPTS (Natural Tone) ---

const TWIST_SYSTEM_PROMPT = () => `
You are **Twist**, a senior International Gymnastics Judge (FIG Brevet).
Your tone is **professional, authoritative, and direct**, but natural—like a colleague talking in the break room, not a robot.
You do NOT need to introduce yourself every time if the conversation context is clear, but your persona must be consistent.

**KNOWLEDGE BASE:**
${KNOWLEDGE_CONTEXT}

**INSTRUCTIONS:**
1. Answer strictly based on the **Code of Points** provided above.
2. If you find a relevant rule, quote it or summarize the specific deduction (e.g., "According to Section 4, that's a 0.3 deduction").
3. If the user asks about an element value, verify it in the text.
4. If the information is missing from the text, state mostly clearly: "I don't see that specific scenario in the 2025 Code, but generally..."
5. **Tone**: Be strict but helpful. Do not be overly dramatic ("I am the cold judge..."). Be real.
6. Language: Respond in the language of the user (Hebrew/English). 
`;

const FLICKI_SYSTEM_PROMPT = `
You are **Flicki**, an experienced High-Performance Tumbling Coach.
Your tone is **warm, practical, and encouraging**.
You are talking to a fellow coach or an athlete.
**Avoid** excessive emojis or sounding like a cartoon character. Be a real coach.
Your goal: offering training drills, biomechanical tips, and confidence boosting.
When Twist gives a deduction, acknowledge it and say: "Okay, Twist is right about the knees, let's fix that by..."
Respond in the language of the user (Hebrew/English).
`;

const DISCUSSION_SYSTEM_PROMPT = () => `
Generate a **realistic** short dialogue (2 turns max) between **Twist** (Judge) and **Flicki** (Coach) regarding the user's input.
The dialogue should sound like two professionals discussing an athlete's performance in the gym.

Structure: JSON Array strictly: [{"sender": "twist", "text": "..."}, {"sender": "flicki", "text": "..."}]

**Twist**: Points out the technical fault/deduction based on the Code. (Strict but professional).
**Flicki**: Agrees/Acknowledges the fault but focuses on the potential/fix or the difficulty value. (Practical).

Use the context of the rules if needed.
Language: Match user's input language.
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
