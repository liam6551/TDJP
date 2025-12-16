const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDNCXHTfJ4zEbq0I0F_escg3f_MNeypka0"; // Fallback for local test if env missing

const candidates = [
    "gemini-1.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash"
];

async function testCandidate(modelName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: "Hello" }] }]
    };

    console.log(`\nTesting: ${modelName}...`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(`❌ FAILED (${response.status}): ${JSON.stringify(data.error?.message || data)}`);
            return false;
        }

        console.log(`✅ SUCCESS! Response:`, data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().substring(0, 20) + "...");
        return true;

    } catch (error) {
        console.log(`❌ NETWORK ERROR: ${error.message}`);
        return false;
    }
}

async function findWorkingModel() {
    console.log("🔍 PROBING GEMINI MODELS...");

    for (const model of candidates) {
        const works = await testCandidate(model);
        if (works) {
            console.log(`\n🎉 FOUND WORKING MODEL: ${model}`);
            console.log("Recommend updating aiController.js to use this model.");
            return;
        }
    }
    console.log("\n💀 ALL MODELS FAILED.");
}

findWorkingModel();
