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
                // Use convertToHtml -> Text for better content preservation than extractRawText
                const result = await mammoth.convertToHtml({ buffer: buffer });
                const html = result.value;
                const text = html
                    .replace(/<img[^>]*>/g, '') // Remove images
                    .replace(/<\/p>/g, '\n')
                    .replace(/<br\s*\/?>/g, '\n')
                    .replace(/<\/td>/g, ' | ')
                    .replace(/<\/tr>/g, '\n')
                    .replace(/<[^>]+>/g, '') // Strip remaining tags
                    .replace(/\n\s*\n/g, '\n\n'); // Normalize spacing

                contextParts.push(`\n--- JUDGING SUMMARY TABLE & NOTES ---\n${text}`);
                LOADING_DETAILS.summary = "success (" + text.length + " chars)";
                console.log("Loaded Judging Summary (DOCX) via HTML conversion");
            } catch (err) {
                console.error("Error parsing DOCX:", err);
                LOADING_DETAILS.summary = "error: " + err.message;
            }
        } else {
            console.warn("Summary (DOCX) not found:", summaryPath);
            LOADING_DETAILS.summary = "missing";
        }

        // 4. Loading Learned Rules (Memory)
        const memoryPath = path.join(assetsPath, 'learned_rules.txt');
        if (fs.existsSync(memoryPath)) {
            const memoryText = fs.readFileSync(memoryPath, 'utf-8');
            if (memoryText.trim().length > 0) {
                // Prepend to ensure high priority
                contextParts.unshift(`\n${memoryText}\n`);
                console.log("Loaded Learned Rules (Memory)");
            }
        }

        // 5. Loading App Elements (Official Data)
        const appElementsPath = path.join(assetsPath, 'app_elements.txt');
        if (fs.existsSync(appElementsPath)) {
            const elementsText = fs.readFileSync(appElementsPath, 'utf-8');
            contextParts.push(`\n${elementsText}\n`);
            console.log("Loaded App Elements Data");
        }

        // 6. Loading Symbol Logic (Grammar)
        const logicPath = path.join(assetsPath, 'tumbling_symbol_logic.txt');
        if (fs.existsSync(logicPath)) {
            const logicText = fs.readFileSync(logicPath, 'utf-8');
            contextParts.push(`\n${logicText}\n`);
            console.log("Loaded Symbol Logic");
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

**CORE DIRECTIVE: "THE VETERAN ISRAELI COACH"**
- **DIGEST & REWRITE**: Do NOT translate English text word-for-word.
- **SUMMARIZE**: Read the rule, understand the *concept*, and explain it in **Short, Natural Hebrew sentences**.
- **NO FLUFF**: Get straight to the point.

**STRICT VISUAL STYLE - THE "MALA MALA" EMOJI LEGEND**:
You MUST use these specific emojis for every concept. Use them frequently to categorize your output visually.

**🚫 FORBIDDEN CHARACTERS**:
- ❌ **NEVER USE ASTERISKS (*)**.
- ❌ Do NOT use \`**bold**\` or \`*italic*\` with asterisks.
- ✅ To emphasize, use **BACKTICKS** (\`concept\`) or **EMOJIS**.

**🎯 JUDGING & SCORING:**
- 🔴 = Major Error / Fall / 1.0 Deduction
- 🟠 = Medium Error / 0.3 - 0.5 Deduction
- 🟡 = Small Error / 0.1 Deduction
- 📏 = Shape / Body Position (Pike/Tuck)
- 🦶 = Landing / Feet
- ⏱️ = Timing / Tempo
- 📐 = Angle / Degree
- 🚫 = Invalid Element / Zero Score
- 🛡️ = Safety / Spotting
- 📝 = Code of Points Reference (Rule #)

**🤸 ELEMENTS & VALUES:**
- 💎 = High Value Element (Double/Triple)
- 🌀 = Twist / Rotation
- 🛫 = Takeoff / Rebound
- ⛰️ = Height / Elevation
- 🛤️ = Tumbling Track / Boundary

**✍️ FORMATTING RULES:**
1. **NO STANDARD BULLETS**: Never use \`-\`.
2. **USE EMOJI BULLETS**: Start EVERY line with one of the icons above.
3. **PLAIN TEXT ONLY**: Do NOT use backticks (\` \`), bold (** **), or italics (* *). Write technical terms naturally in the sentence.

**BAD VS GOOD EXAMPLES**:
❌ **BAD**: "לפי החוקה יורד **0.3** על רגליים."
❌ **BAD**: "הורדה של \`0.3\` על \`Flexed Feet\`."
✅ **GOOD**:
🟡 הורדה של 0.3 על Flexed Feet.
🦶 הקפד על מתיחת רגליים בנחיתה.
📐 זווית נחיתה נמוכה מדי תגרום לצעד.

**NEGATIVE CONSTRAINTS**:
- 🛑 NO Russian/Arabic/French. Hebrew ONLY.
- 🛑 NO Long paragraphs.
- 🛑 NO "According to the code".
- 🛑 **NO ASTERISKS (*) OR BACKTICKS (\`).**

** KNOWLEDGE BASE(SOURCE MATERIAL - ENGLISH) **:
${KNOWLEDGE_CONTEXT}
`;

const FLICKI_SYSTEM_PROMPT = `
You are ** Flicki **, an AI Coach that ** learns and evolves **.
** Philosophy **: "There is always a better way."
    ** Behavior **:
-   Analyze potential and physics.
- Be curious.Respect the Head Coach(user).
-   ** Adaptive **: If Twist gives a deduction, you analyze * why * (biomechanics) and propose a drill.

**🚫 FORBIDDEN CHARACTERS **:
- ❌ ** NEVER USE ASTERISKS(*) OR BACKTICKS(\`)**.
- ❌ Do NOT use bold or italics.ALL TEXT MUST BE UNIFORM.
- ✅ Use ** EMOJIS ** to add visual interest instead of formatting.

**🧪 FLICKI'S TOOLKIT - EMOJI LEGEND:**
Use these to show your coaching energy!

    **🔬 PHYSICS & BIOMECHANICS:**
        - 🚀 = Power / Speed / Momentum
            - 🧬 = Technique / Form
                - ⚖️ = Balance / Center of Gravity
                    - ⏭️ = Transition / Connection
                        - 🔋 = Energy Conservation

                            **💪 TRAINING & DRILLS:**
                                - 🧱 = Foundation / Basics
                                    - 🏋️ = Strength / Conditioning
                                        - 🛠️ = Drill / Exercise
                                            - 🆙 = Level Up / Progression
                                                - 🧠 = Mental Tip / Focus

                                                    **🎌 MOOD:**
                                                        - 💡 = Idea / Insight
                                                            - 🔥 = Motivation / Hype
                                                                - 🤯 = Mind Blown / Advanced Tip
                                                                    - 🤝 = Teamwork / Spotting
                                                                        - 🏆 = Goal / Podium

                                                                            ** OUTPUT STYLE **:
- Use emojis liberally to make the text "pop".
- Keep it fun but professional.
- Always explain * how * to fix it scientifically.
`;

const DISCUSSION_SYSTEM_PROMPT = () => `
Generate a ** realistic ** professional dialogue between Twist(Judge) and Flicki(Coach).

** Twist **: Uses strict judging emojis(🔴, 🟡, 📏).Quotes the rule.
** Flicki **: Uses coaching emojis(🚀, 💡, 🛠️).Proposes a fix.

** CRITICAL RULE **: Do NOT use asterisks(*) or backticks in the output text inside the JSON.

    Structure: JSON Array strictly: [{ "sender": "twist", "text": "..." }, { "sender": "flicki", "text": "..." }]
Output: RAW JSON ONLY.
`;

// --- RETRY LOGIC HELPER (AGGRESSIVE) ---
const callGeminiWithRetry = async (fn, retries = 5, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0 && (error.message.includes('429') || error.message.includes('503'))) {
            console.warn(`Gemini API Error(${error.message}).Retrying in ${delay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            // Exp Backoff but cap at 8 seconds to prevent infinite hanging
            const nextDelay = Math.min(delay * 2, 8000);
            return callGeminiWithRetry(fn, retries - 1, nextDelay);
        }
        throw error;
    }
};

export const chatWithAI = async (req, res) => {
    try {
        const { text, mode, lang, history = [] } = req.body;

        if (!text) return res.status(400).json({ error: 'Missing text' });

        // --- LEARNING TRIGGER ---
        // Check if user is teaching a new rule
        const isCorrection = text.trim().match(/^(תיקון:|Learn:|Correction:)\s*(.+)/i);

        if (isCorrection) {
            const newRule = isCorrection[2]; // The actual rule text
            const memoryPath = path.join(__dirname, '../assets/learned_rules.txt');

            // Append to file
            const entry = `\n[Learned at ${new Date().toISOString()}] ${newRule} `;
            fs.appendFileSync(memoryPath, entry);

            // Reload context immediately
            await loadKnowledgeBase();

            return res.json({
                ok: true,
                responses: [
                    { sender: 'twist', text: `הבנתי.עדכנתי את הזיכרון שלי עם החוק החדש: \n"${newRule}"\nאזכור זאת להבא.` }
                ]
            });
        }

        let responses = [];
        // Using 'gemini-flash-latest' (Auto-updates to latest stable Flash version)
        // 'gemini-1.5-flash' returned 404 for this API key/region.
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: {
                maxOutputTokens: 8192, // Increased significantly to ensuring NO cutoff
                temperature: 0.7
            }
        });

        // Helper to Convert Frontend History to Gemini History
        const formatHistory = (frontendHistory, systemPrompt) => {
            const historyParts = [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: "Understood." }] }
            ];

            // Map last 6 messages for context (prevent token overflow)
            const recent = frontendHistory.slice(-6);

            recent.forEach(msg => {
                const role = msg.sender === 'user' ? 'user' : 'model';
                // Filter out empty or system metadata messages if any
                if (msg.text) {
                    historyParts.push({ role, parts: [{ text: msg.text }] });
                }
            });

            return historyParts;
        };

        // --- TWIST (Gemini + RAG) ---
        if (mode === 'twist') {
            const chat = model.startChat({
                history: formatHistory(history, TWIST_SYSTEM_PROMPT())
            });

            const result = await callGeminiWithRetry(() => chat.sendMessage(text));
            responses.push({ sender: 'twist', text: result.response.text() });
        }

        // --- FLICKI (Gemini) ---
        else if (mode === 'flicki') {
            const chat = model.startChat({
                history: formatHistory(history, FLICKI_SYSTEM_PROMPT)
            });
            const result = await callGeminiWithRetry(() => chat.sendMessage(text));
            responses.push({ sender: 'flicki', text: result.response.text() });
        }

        // --- DISCUSSION (Gemini Orchestrator) ---
        else if (mode === 'discussion') {
            const systemMsg = DISCUSSION_SYSTEM_PROMPT() + `\n\n ** CONTEXT:**\n${KNOWLEDGE_CONTEXT.substring(0, 50000)}...`;

            const result = await callGeminiWithRetry(() => model.generateContent({
                contents: [
                    { role: 'user', parts: [{ text: systemMsg + "\n\nUser Input: " + text }] }
                ],
                generationConfig: { responseMimeType: "application/json" }
            }));

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
