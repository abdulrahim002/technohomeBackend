const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function findSurvivor() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    if (!data.models) {
      console.log("No models found:", data);
      return;
    }

    console.log(`Found ${data.models.length} models. Scanning for survivals...`);
    
    for (const m of data.models) {
      const name = m.name.replace('models/', '');
      if (!m.supportedGenerationMethods.includes('generateContent')) continue;
      
      try {
        const model = genAI.getGenerativeModel({ model: name });
        const result = await model.generateContent({
           contents: [{ role: 'user', parts: [{ text: "Say OK" }] }],
           generationConfig: { maxOutputTokens: 5 }
        });
        const text = result.response.text();
        console.log(`✅ [WORKING] ${name}: ${text}`);
      } catch (e) {
        // Skip 503/404/429
        if (e.message.includes('503')) {
           console.log(`⚠️  [BUSY] ${name}`);
        }
      }
    }
  } catch (err) {
    console.error("Scan failed:", err.message);
  }
}

findSurvivor();
