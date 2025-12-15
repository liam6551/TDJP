import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MAX_TOKENS = 400;

// --- PROMPTS ---

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

const DISCUSSION_SYSTEM_PROMPT = `
Generate a short dialogue (2 turns max) between **Twist** (Strict Judge) and **Flicki** (Energetic Coach) about the user's input.
Structure response strictly as a JSON array of objects: 
[{"sender": "twist", "text": "..."}, {"sender": "flicki", "text": "..."}]

Rules:
1. **Twist** speaks first: Harsh, pointing out a specific technical error (0.1/0.3 deduction).
2. **Flicki** responds: Defends the athlete, points out the difficulty/height, and suggests a fix with emojis.
3. Language: Respond in the language of the user's input (Hebrew or English).
4. Output RAW JSON ONLY. No markdown ticks.
`;

export const chatWithAI = async (req, res) => {
    try {
        const { text, mode, lang } = req.body;

        if (!text) return res.status(400).json({ error: 'Missing text' });

        let responses = [];
        // Fallback to the most stable model 'gemini-pro'
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // --- TWIST (Gemini) ---
        if (mode === 'twist') {
            const chat = model.startChat({
                history: [
                    { role: 'user', parts: [{ text: TWIST_SYSTEM_PROMPT }] },
                    { role: 'model', parts: [{ text: "Understood. I am Twist. Proceed." }] }
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
                    { role: 'model', parts: [{ text: "Understood! I am Flicki! ⚡ Ready to coach! 💪" }] }
                ]
            });
            const result = await chat.sendMessage(text);
            responses.push({ sender: 'flicki', text: result.response.text() });
        }

        // --- DISCUSSION (Gemini Orchestrator) ---
        else if (mode === 'discussion') {
            const result = await model.generateContent({
                contents: [
                    { role: 'user', parts: [{ text: DISCUSSION_SYSTEM_PROMPT + "\n\nUser Input: " + text }] }
                ],
                generationConfig: { responseMimeType: "application/json" }
            });

            const content = result.response.text();
            let parsed = [];
            try {
                // Clean markdown if present (Gemini sometimes adds it even in JSON mode)
                const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
                parsed = JSON.parse(cleanJson);

                if (Array.isArray(parsed)) responses = parsed;
                else if (parsed.dialogue) responses = parsed.dialogue;
                else responses = parsed; // Hope structure matches
            } catch (e) {
                console.error("JSON Parse Error (Gemini):", e);
                responses = [
                    { sender: 'twist', text: "Error generating dialogue." },
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
