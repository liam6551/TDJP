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
        console.log("--- DEBUG GEMINI KEY ---");
        console.log("Key Value (First 5):", key.substring(0, 5));
        console.log("Key Length:", key.length);
        console.log("Start Char Code:", key.charCodeAt(0));
        console.log("End Char Code:", key.charCodeAt(key.length - 1));
        console.log("------------------------");
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
**ROLE**: Professional, organized, and precise.

**CORE DIRECTIVES**:
1. **SYNTHESIS (CRITICAL)**: Do NOT copy/paste or translate 1-to-1. Read the rules, understand them, and write a **structured explanation** in your own words.
2. **STRUCTURE**:
    - Use clear paragraphs.
    - Use Bullet Points for lists.
    - Add new lines between sections.
3. **FORMATTING**:
    - **NO ASTERISKS (*)** or **HASHES (#)** or **MARKDOWN**.
    - Use **Standard Text** only.

**VISUAL STYLE (GENERIC EMOJIS ONLY)**:
Use ONLY these common, recognizable emojis to structure the text:
🔴 = Major Deduction / Error
🟡 = Minor Deduction / Info
🔵 = General Point / Fact
⚠️ = Important Warning / Exception
✅ = Correct / Good Example
❌ = Incorrect / Bad Example

**EXAMPLE OUTPUT**:
🔵 Regarding the landing shape:
🟡 There is a small deduction (0.1) if feet are slightly apart.
🔴 However, deep squat or fall is a major deduction (1.0).

⚠️ Note: Always keep the chest up to avoid balance deduction.

**KNOWLEDGE BASE**:
${KNOWLEDGE_CONTEXT}
`;

const FLICKI_SYSTEM_PROMPT = () => `
You are **Flicki**, an AI Coach specializing in Tumbling.
**ROLE**: Energetic but organized. Focus on potential and fixing errors.

**CORE DIRECTIVES**:
1. **SYNTHESIS**: Don't quote the book. Give practical coaching advice in your own words.
2. **STRUCTURE**: Organize into clear points.
3. **FORMATTING**:
    - **NO ASTERISKS (*)** or **MARKDOWN**.
    - Standard Text only.

**VISUAL STYLE (COOL & COMMON EMOJIS)**:
Use these to add specific flavor without being random:
😎 = Pro Tip / Cool Fact
🔥 = Power / Energy
⚠️ = Correction / Watch Out
🔵 = General Drill / Point
✅ = Good Technique

**EXAMPLE OUTPUT**:
🔥 Push hard from the shoulders to get maximum height.
⚠️ Watch out for the head position!
🔵 Try this drill: Stand against the wall and practice the shape.
😎 Keep working hard!

**KNOWLEDGE BASE**:
${KNOWLEDGE_CONTEXT}
`;

const DISCUSSION_SYSTEM_PROMPT = () => `
Generate a **realistic** professional dialogue between Twist(Judge) and Flicki(Coach).

**Twist**: Uses judging emojis (🔴, 🟡, 📏).
**Flicki**: Uses coaching emojis (🚀, 🧬, 🧱).

**STRICT RULES**:
- **NO ASTERISKS (*)** or markdown in the text fields.
- **NO HASHES (#)**.
- Text must be plain strings with emojis.

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
            // Parse JSON
            let messages = [];
            try {
                // Cleaning the raw text before parsing just in case, though safer to parse first then clean properties
                const cleanedRaw = content.replace(/```json/g, '').replace(/```/g, '').trim();
                messages = JSON.parse(cleanedRaw);

                // Scrubber for Discussion messages
                messages = messages.map(m => ({
                    ...m,
                    text: m.text
                        .replace(/\*\*/g, '')
                        .replace(/###/g, '')
                        .replace(/##/g, '')
                        .replace(/^#\s/gm, '')
                        .replace(/`/g, '')
                        .trim()
                }));
                responses = messages; // Assign the cleaned messages to responses

            } catch (e) {
                console.error("JSON Parse Error (Gemini):", e);
                // If JSON parsing fails, provide a fallback and clean its text
                let fallbackText = "Verification needed on that element. Let's review the video.";
                // 4. Force-Clean Response (The "Scrubber")
                // Remove all markdown bold (**), headers (###, ##, #), and italics (*) to strictly enforce "Plain Text + Emojis"
                fallbackText = fallbackText
                    .replace(/\*\*/g, '')   // Remove **
                    .replace(/###/g, '')    // Remove ###
                    .replace(/##/g, '')     // Remove ##
                    .replace(/^#\s/gm, '')  // Remove single # at start of line
                    .replace(/`/g, '')      // Remove backticks
                    .trim();

                responses = [
                    { sender: 'twist', text: fallbackText }
                ];
            }
        }

        // Apply cleaning to all response texts before returning
        responses = responses.map(response => {
            if (response.text) {
                response.text = response.text
                    .replace(/\*\*/g, '')   // Remove **
                    .replace(/###/g, '')    // Remove ###
                    .replace(/##/g, '')     // Remove ##
                    .replace(/^#\s/gm, '')  // Remove single # at start of line
                    .replace(/`/g, '')      // Remove backticks
                    .trim();
            }
            return response;
        });

        return res.json({ ok: true, responses });

    } catch (error) {
        console.error('AI Error:', error);
        return res.status(500).json({ ok: false, error: error.message });
    }
};
