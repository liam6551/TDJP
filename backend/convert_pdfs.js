import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const convert = async () => {
    const assetsDir = path.join(__dirname, 'assets');
    const files = [
        'TumblingCodeOfPoints_2025-2028.pdf',
        'Yearbook_2025.pdf'
    ];

    for (const file of files) {
        const inputPath = path.join(assetsDir, file);
        const outputPath = inputPath.replace('.pdf', '.txt');

        if (fs.existsSync(inputPath)) {
            console.log(`Converting ${file}...`);
            const buffer = fs.readFileSync(inputPath);
            try {
                const data = await pdf(buffer);
                fs.writeFileSync(outputPath, data.text);
                console.log(`✅ Saved to: ${outputPath}`);
            } catch (e) {
                console.error(`❌ Failed to convert ${file}:`, e.message);
            }
        } else {
            console.warn(`⚠️ File not found: ${inputPath}`);
        }
    }
};

convert();
