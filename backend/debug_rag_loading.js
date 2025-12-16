import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const debug = async () => {
    const summaryPath = path.join(__dirname, 'assets', 'TumblingJudgingSummery.docx');
    console.log(`Checking path: ${summaryPath}`);

    if (fs.existsSync(summaryPath)) {
        console.log("✅ File exists.");
        try {
            const buffer = fs.readFileSync(summaryPath);
            // Try HTML conversion but strip images/tags to see content
            const result = await mammoth.convertToHtml({ buffer: buffer });
            const html = result.value;

            // Simple HTML to Text (Markdown-ish)
            const textContent = html
                .replace(/<img[^>]*>/g, '[IMAGE]\n') // Replace images with marker
                .replace(/<\/p>/g, '\n') // Paragraphs to newlines
                .replace(/<br\s*\/?>/g, '\n') // Breaks
                .replace(/<\/td>/g, ' | ') // Table cells
                .replace(/<\/tr>/g, '\n') // Table rows
                .replace(/<[^>]+>/g, '') // Strip remaining tags
                .replace(/\n\s*\n/g, '\n\n'); // Normalize spacing

            console.log(`✅ Converted HTML->Text successfully! Length: ${textContent.length} chars`);
            console.log("--- START PROCESSED CONTENT ---");
            console.log(textContent.substring(0, 1000));
            console.log("--- END PROCESSED CONTENT ---");

            if (result.messages && result.messages.length > 0) {
                console.log("⚠️ Mammoth Messages:", result.messages);
            }
        } catch (err) {
            console.error("❌ Error parsing DOCX:", err);
        }
    } else {
        console.error("❌ File NOT FOUND at path.");
        // List directory to see what IS there
        const dir = path.dirname(summaryPath);
        console.log(`Contents of ${dir}:`);
        fs.readdirSync(dir).forEach(file => console.log(` - ${file}`));
    }
};

debug();
