require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // There is no direct listModels on genAI, we use the method from the SDK
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    console.log('Testing gemini-flash-latest...');
    const result = await model.generateContent('أهلاً، هل أنت جاهز للعمل كفني صيانة؟');
    console.log('AI Response:', result.response.text());
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listModels();
