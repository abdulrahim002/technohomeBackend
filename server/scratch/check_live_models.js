const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkDeadModels() {
  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-3.1-flash-image-preview",
    "gemini-2.0-flash-exp"
  ];

  console.log("--- Checking Live Models ---");
  for (const m of models) {
    try {
      console.log(`Testing ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Say OK");
      console.log(`✅ ${m}: ${result.response.text()}`);
    } catch (e) {
      console.log(`❌ ${m}: ${e.message}`);
    }
  }
}

checkDeadModels();
