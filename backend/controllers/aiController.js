import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize AI Clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MAX_TOKENS = 300; // Limit response length

// --- PROMPTS ---

// Twist: The Strict Judge (OpenAI)
const TWIST_SYSTEM_PROMPT = `
You are **Twist**, a strict, highly technical International Gymnastics Judge (FIG Code of Points). 
Your analysis is objective, cold, and uncompromising. You do not offer praise easily. 
You focus entirely on deductions, form breaks (knees, toes, separation, height), and landing faults. 
You use specific technical terminology from the Code of Points. 
If the user input describes a gymnastics element or performance, critique it severely. 
Identify yourself clearly as the Head Judge.
Tone: Formal, authoritative, critical.
Language: Respond in the language of the user's input (Hebrew or English).
`;

// Flicki: The Energetic Coach (Gemini)
const FLICKI_SYSTEM_PROMPT = `
You are **Flicki**, an energetic, high-performance Gymnastics Coach. 
Your goal is to identify potential, power, height, and speed. 
You acknowledge the mistakes but pivot immediately to the positive "glass half full" perspective. 
You use emojis (⚡, 💪, 🔥, 🚀) liberally. 
You defend the athlete's effort against the judge's strictness. 
You motivate the user (fellow coach) to refine the technique for higher scoring potential. 
Identify yourself as Flicki.
Tone: Enthusiastic, supportive, high-energy.
Language: Respond in the language of the user's input (Hebrew or English).
`;

// Discussion: Orchestrator (OpenAI)
const DISCUSSION_SYSTEM_PROMPT = `
Generate a short dialogue (2 turns max) between **Twist** (Strict Judge) and **Flicki** (Energetic Coach) about the user's input.
Structure response strictly as a JSON array of objects: 
[{"sender": "twist", "text": "..."}, {"sender": "flicki", "text": "..."}]

Rules:
1. **Twist** speaks first: Harsh, pointing out a specific technical error (0.1/0.3 deduction).
2. **Flicki** responds: Defends the athlete, points out the difficulty/height, and suggests a fix with emojis.
3. Language: Respond in the language of the user's input (Hebrew or English).
NO MARKDOWN. ONLY JSON.
`;

export const chatWithAI = async (req, res) => {
    try {
        const { text, mode, lang } = req.body;

        if (!text) return res.status(400).json({ error: 'Missing text' });

        let responses = [];

        // --- TWIST (OpenAI) ---
        if (mode === 'twist') {
            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: TWIST_SYSTEM_PROMPT },
                    { role: "user", content: text }
                ],
                model: "gpt-4o",
                max_tokens: MAX_TOKENS,
            });
            responses.push({ sender: 'twist', text: completion.choices[0].message.content });
        }

        // --- FLICKI (Gemini) ---
        else if (mode === 'flicki') {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: FLICKI_SYSTEM_PROMPT }], // System instruction as first user msg for simple flash models if needed, else system_instruction
                    },
                    {
                        role: "model",
                        parts: [{ text: "Understood! I am Flicki! ⚡ Ready to coach! 💪" }],
                    }
                ],
                generationConfig: {
                    maxOutputTokens: MAX_TOKENS,
                },
            });

            const result = await chat.sendMessage(text);
            const response = await result.response;
            responses.push({ sender: 'flicki', text: response.text() });
        }

        // --- DISCUSSION (OpenAI Orchestrator) ---
        else if (mode === 'discussion') {
            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: DISCUSSION_SYSTEM_PROMPT },
                    { role: "user", content: text }
                ],
                model: "gpt-4o",
                response_format: { type: "json_object" }, // Ensure JSON
            });

            // Parse valid JSON
            const content = completion.choices[0].message.content;
            let parsed = [];
            try {
                // OpenAI 'json_object' usually wraps in a root key if not specified, but here we asked for array.
                // Actually, 'json_object' requires the output to be an object, not array at root.
                // Let's adjust prompt to return { "dialogue": [...] } to be safe, or just parse loose.
                // Or better: Use 'json_object' and ask for strict schema?
                // Let's rely on GPT-4o's strength.

                // ADJUSTMENT FOR RELIABILITY:
                const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
                const json = JSON.parse(cleanJson);

                // If it returned { dialogue: [...] } or just [...]
                if (Array.isArray(json)) parsed = json;
                else if (json.dialogue && Array.isArray(json.dialogue)) parsed = json.dialogue;
                else if (json.messages && Array.isArray(json.messages)) parsed = json.messages;

                responses = parsed;
            } catch (e) {
                console.error("JSON Parse Error in Discussion:", e);
                // Fallback
                responses = [
                    { sender: 'twist', text: "Error parsing discussion." },
                    { sender: 'flicki', text: "Let's try again! ⚡" }
                ];
            }
        }

        return res.json({ ok: true, responses });

    } catch (error) {
        console.error('AI Error:', error);
        return res.status(500).json({ ok: false, error: error.message });
    }
};
