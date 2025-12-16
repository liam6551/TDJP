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
// Initialize Gemini Client Lazily
let genAI = null;
const getGenAI = () => {
    if (!genAI) {
        const key = process.env.GEMINI_API_KEY;
        if (!key) {
            console.error("CRITICAL: GEMINI_API_KEY is missing from process.env when initializing client.");
            // Fallback or throw? better to throw to see the error explicitly
            throw new Error("GEMINI_API_KEY is missing");
        }
        genAI = new GoogleGenerativeAI(key);
    }
    return genAI;
};

import pool from '../db.js';

// ... (previous imports)

// CONSTANT: Target Structure for Classification (The "Schema" for the AI)
const FLICKI_STRUCTURE = {
    "Tumbling Principles": [],
    "Sequences": [],
    "Exits": [],
    "Power Hurdle": [],
    "Breakdowns": [],
    "Templates": [],
    "Fitness": {
        "Hypertrophy": [],
        "Explosive Power": [],
        "Plyometrics": [],
        "Maintenance": [],
        "Tapering": []
    },
    "Stretching": [],
    "Other": []
};

// --- KNOWLEDGE BASE ---
let KNOWLEDGE_CONTEXT = "";
let FLICKI_KNOWLEDGE = JSON.parse(JSON.stringify(FLICKI_STRUCTURE)); // Init with structure
let LOADING_STATUS = "idle";
let LOADING_DETAILS = {
    code: "pending",
    yearbook: "pending",
    summary: "pending",
    flicki_db: "pending",
    program: "pending"
};

const loadKnowledgeBase = async () => {
    LOADING_STATUS = "loading";
    let contextParts = [];

    // Reset Knowledge to clean structure
    FLICKI_KNOWLEDGE = JSON.parse(JSON.stringify(FLICKI_STRUCTURE));

    try {
        console.log("Loading Knowledge Base (TXT/DOCX + DB)...");
        const assetsPath = path.join(__dirname, '../assets');

        // ... (Existing loaders 1-6 remain unchanged)

        // 1. Loading FIG Code of Points (TXT)
        const codePath = path.join(assetsPath, 'TRACoP2025-2028.txt');
        if (fs.existsSync(codePath)) {
            const text = fs.readFileSync(codePath, 'utf-8');
            contextParts.push(`\n--- FIG TUMBLING CODE OF POINTS 2025-2028 ---\n${text}`);
            LOADING_DETAILS.code = "success (" + text.length + " chars)";
        }

        // 2. Age Levels
        const agePath = path.join(assetsPath, 'AgeLevels.txt');
        if (fs.existsSync(agePath)) {
            const text = fs.readFileSync(agePath, 'utf-8');
            contextParts.push(`\n--- COMPETITION AGE LEVELS & RULES ---\n${text}`);
            LOADING_DETAILS.yearbook = "success (" + text.length + " chars)";
        }

        // 3. Judging Summary
        const summaryPath = path.join(assetsPath, 'TumblingJudgingSummery.docx');
        if (fs.existsSync(summaryPath)) {
            try {
                const buffer = fs.readFileSync(summaryPath);
                const result = await mammoth.convertToHtml({ buffer: buffer });
                const html = result.value;
                const text = html.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n');
                contextParts.push(`\n--- JUDGING SUMMARY TABLE & NOTES ---\n${text}`);
                LOADING_DETAILS.summary = "success (" + text.length + " chars)";
            } catch (e) { console.error(e); }
        }

        // 4. Memory (File) - KEEPING for legacy, but DB is preferred

        // 5. App Elements & 6. Logic (Static)
        const appElementsPath = path.join(assetsPath, 'app_elements.txt');
        if (fs.existsSync(appElementsPath)) contextParts.push(fs.readFileSync(appElementsPath, 'utf-8'));

        const logicPath = path.join(assetsPath, 'tumbling_symbol_logic.txt');
        if (fs.existsSync(logicPath)) contextParts.push(fs.readFileSync(logicPath, 'utf-8'));

        // 6.5 Professional Program 2025-2026
        const progPath = path.join(assetsPath, 'Professional program 2025-2026.txt');
        if (fs.existsSync(progPath)) {
            const text = fs.readFileSync(progPath, 'utf-8');
            contextParts.push(`\n--- ISRAELI PROFESSIONAL PROGRAM 2025-2026 ---\n${text}`);
            LOADING_DETAILS.program = "success (" + text.length + " chars)";
        }


        // 7. Loading Flicki Knowledge (DATABASE)
        try {
            const result = await pool.query(`SELECT category, subcategory, rule_text FROM flicki_rules ORDER BY category, subcategory, created_at`);

            // Populate FLICKI_KNOWLEDGE (Runtime Cache)
            result.rows.forEach(row => {
                const cat = row.category;
                const sub = row.subcategory;

                // Ensure category exists (if new category added via DB manually)
                if (!FLICKI_KNOWLEDGE[cat]) FLICKI_KNOWLEDGE[cat] = [];

                if (sub) {
                    // Start of complex object handling (like Fitness)
                    if (!FLICKI_KNOWLEDGE[cat][sub]) {
                        // If it was an array, convert to object? rare case. Assume schema holds.
                        if (Array.isArray(FLICKI_KNOWLEDGE[cat])) {
                            // It was array, but now needs subkeys. 
                            // To avoid breaking schema, we might force sub into title?
                            // adhering to FLICKI_STRUCTURE is safer.
                        } else {
                            FLICKI_KNOWLEDGE[cat][sub] = [];
                        }
                    }
                    if (FLICKI_KNOWLEDGE[cat][sub] && Array.isArray(FLICKI_KNOWLEDGE[cat][sub])) {
                        FLICKI_KNOWLEDGE[cat][sub].push(row.rule_text);
                    }
                } else {
                    // Top level item
                    if (Array.isArray(FLICKI_KNOWLEDGE[cat])) {
                        FLICKI_KNOWLEDGE[cat].push(row.rule_text);
                    } else {
                        // It's an object (like Fitness) but got a top-level rule?
                        // Put in 'General' or ignore?
                        // Let's create a 'General' key if needed, or just push if it supports mixed (it doesn't usually)
                    }
                }
            });

            // Generate Context String from FLICKI_KNOWLEDGE
            let flickiText = "\n--- FLICKI'S SECRET COACHING NOTES (STRUCTURED - DB) ---\n";
            for (const [cat, items] of Object.entries(FLICKI_KNOWLEDGE)) {
                if (Array.isArray(items) && items.length > 0) {
                    flickiText += `\n[${cat.toUpperCase()}]\n`;
                    items.forEach(r => flickiText += `- ${r}\n`);
                } else if (typeof items === 'object' && !Array.isArray(items)) {
                    flickiText += `\n[${cat.toUpperCase()}]\n`;
                    for (const [sub, rules] of Object.entries(items)) {
                        if (rules.length > 0) {
                            flickiText += `  -- ${sub.toUpperCase()} --\n`;
                            rules.forEach(r => flickiText += `- ${r}\n`);
                        }
                    }
                }
            }

            contextParts.push(flickiText);
            LOADING_DETAILS.flicki_db = `success (${result.rowCount} rules)`;
            console.log("Loaded Flicki Knowledge (DB):", result.rowCount, "rules");

        } catch (e) {
            console.error("Error loading flicki DB:", e);
            LOADING_DETAILS.flicki_db = "error";
        }

        KNOWLEDGE_CONTEXT = contextParts.join("\n\n");
        LOADING_STATUS = (KNOWLEDGE_CONTEXT.length > 0) ? "done" : "empty";

    } catch (error) {
        console.error("Failed to load knowledge base:", error);
        LOADING_STATUS = "error";
    }
};

// ...

// Helper: Smart Classify & Save (DB Version) - LOGIC V3 (Multi-Rule)
const classifyAndSaveRule = async (newRule) => {
    try {
        const model = getGenAI().getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: { responseMimeType: "application/json" }
        });

        // Use the constant structure for the prompt
        const prompt = `
        You are an expert gymnastics data organizer.
        Task: Analyze this coaching input (which may contain multiple points) and break it down into distinct, generalized coaching rules.
        
        Input Text: "${newRule}"
        
        Target Schema: ${JSON.stringify(FLICKI_STRUCTURE, null, 2)}
        
        INSTRUCTIONS:
        1. **DECONSTRUCT**: If the text contains multiple tips/rules, split them up.
        2. **GENERALIZE**: Convert each point into a universal coaching principle (e.g. "Bent legs" -> "Maintain extension").
        3. **REFINE**: Write each rule in **professional, short, and clear Hebrew**.
        4. **CATEGORIZE**: Assign each rule to the most fitting Category/Subcategory from the schema.
        
        Output strictly a JSON ARRAY of objects: 
        [
          { "category": "...", "subcategory": "..." (or null), "refined_text": "..." },
          ...
        ]
        `;

        const result = await model.generateContent(prompt);
        const data = JSON.parse(result.response.text()); // Expecting Array

        // Normalize to array if single object returned by mistake
        const rulesToSave = Array.isArray(data) ? data : [data];
        const savedResults = [];

        for (const rule of rulesToSave) {
            let savedCategory = rule.category || "Other";
            let savedSub = rule.subcategory || null;

            // DB Insert
            try {
                await pool.query(
                    `INSERT INTO flicki_rules (category, subcategory, rule_text) VALUES ($1, $2, $3)`,
                    [savedCategory, savedSub, rule.refined_text]
                );
                savedResults.push({ category: savedCategory, subcategory: savedSub, refined_text: rule.refined_text });
            } catch (dbErr) {
                console.error("DB Insert Error for rule:", rule, dbErr);
                // Continue to next rule
            }
        }

        return savedResults;

    } catch (e) {
        console.error("Classification Error:", e);
        // Fallback save to Other
        try {
            await pool.query(
                `INSERT INTO flicki_rules (category, subcategory, rule_text) VALUES ($1, $2, $3)`,
                ['Other', null, `(Error Save): ${newRule}`]
            );
            return [{ category: 'Other', refined_text: newRule }];
        } catch (dbErr) {
            console.error("Critical DB Error during fallback:", dbErr);
            return [];
        }
    }
};


// Export the loader so index.js can call it after DB is ready
export { loadKnowledgeBase };



// Debug endpoint
export const debugRag = async (req, res) => {
    res.json({
        status: LOADING_STATUS,
        details: LOADING_DETAILS,
        flickiKnowledge: FLICKI_KNOWLEDGE, // Show full content
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

const FLICKI_SYSTEM_PROMPT = () => `
You are **Flicki**, an AI Coach specializing in Tumbling.
**CORE PHILOSOPHY**: "Short, Sharp, Surgical."
**GOAL**: Deliver the solution immediately. Zero fluff. Zero chitchat.

**🧠 CURIOSITY PROTOCOL (NEW):**
If the user's question is vague (missing Age Group, Element, or Phase), DO NOT GUESS.
Instead, ask a **Specific, Practical Question** to narrow it down.
- ❌ BAD: "Can you elaborate?" or "What do you mean?"
- ✅ GOOD: "Is this for Age 11-12 or Senior?"
- ✅ GOOD: "Whip or Flic-Flac?"
- ✅ GOOD: "Landing phase or Takeoff?"

**BEHAVIOR**:
1. **ANALYZE**: Identify the fault OR the missing context.
2. **SOLVE/ASK**: If clear -> Solve. If vague -> Ask strict practical question.
3. **STOP**: No polite closings.

**🚫 FORBIDDEN**:
- ❌ NO Asterisks (*) or Backticks (\`).
- ❌ NO bold/italic formatting.
- ❌ NO long paragraphs.
- ❌ NO "Hi", "Hello".

**VISUAL STYLE (MANDATORY)**:
Use these emojis to categorize your bullets.

**🧪 TOOLKIT**:
🚀 = Power / Speed
🧬 = Technique / Form
⚖️ = Balance
🧠 = Mental Cue
🧱 = Foundation / Drill
💡 = Key Insight
❓ = Clarification Needed (Use this when asking)

**OUTPUT FORMAT EXAMPLE (ANSWER)**:
🚀 דחוף חזק מהכתפיים בחסימה.
🧬 שמור על גוף ישר, אל תקרוס בגב.

**OUTPUT FORMAT EXAMPLE (QUESTION)**:
❓ מדובר על נחיתה מדאבל או בורג?
❓ זה עבור מתחרים בגילאי 11-12 או בוגרים?

**KNOWLEDGE BASE**:
${KNOWLEDGE_CONTEXT}
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

        // --- LEARNING TRIGGER (SMART) ---
        // Relaxed regex: Matches "תיקון", "Learn", "Correction" followed by optional colon/dash and space
        const isCorrection = text.trim().match(/^(תיקון|Learn|Correction)[:\-\s]*\s+(.+)/i);

        if (isCorrection) {
            const newRuleRaw = isCorrection[2];
            console.log("Processing Smart Learning for:", newRuleRaw);

            const savedDataArray = await classifyAndSaveRule(newRuleRaw);

            // Reload knowledge
            loadKnowledgeBase();

            let responseText = "תודה, שמרתי את המידע.";

            if (savedDataArray && savedDataArray.length > 0) {
                responseText = `תודה! למדתי ${savedDataArray.length} דברים חדשים:\n`;
                savedDataArray.forEach(item => {
                    responseText += `\n✅ **${item.category}** ${item.subcategory ? `(${item.subcategory})` : ''}: "${item.refined_text}"`;
                });
            }

            return res.json({
                ok: true,
                responses: [
                    { sender: 'flicki', text: responseText }
                ]
            });
        }


        let responses = [];
        // Using 'gemini-flash-latest' (Auto-updates to latest stable Flash version)
        // 'gemini-1.5-flash' returned 404 for this API key/region.
        const model = getGenAI().getGenerativeModel({
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
                history: formatHistory(history, FLICKI_SYSTEM_PROMPT())
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
