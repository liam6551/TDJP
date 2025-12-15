const apiKey = "AIzaSyDNCXHTfJ4zEbq0I0F_escg3f_MNeypka0";
// Try v1beta as it's the most common endpoint
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
    console.log("Fetching list of models from Google API...");
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("❌ API ERROR:", JSON.stringify(data.error, null, 2));
            return;
        }

        if (!data.models) {
            console.log("❌ NO MODELS FOUND. Full response:", JSON.stringify(data, null, 2));
            return;
        }

        console.log("\n✅ AVAILABLE MODELS (That support generateContent):");
        let found = false;
        data.models.forEach(m => {
            // We only care about models that can generate text
            if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`Model: ${m.name}`); // e.g. models/gemini-pro
                found = true;
            }
        });

        if (!found) console.log("No models found that support generateContent.");

    } catch (error) {
        console.error("❌ NETWORK ERROR:", error);
    }
}

listModels();
