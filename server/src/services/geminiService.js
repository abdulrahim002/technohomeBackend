const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

/**
 * Generate an expert diagnosis for a home appliance problem
 * @param {string} problemDescription - User's description of the problem
 * @param {string} deviceType - Type of appliance (e.g., Fridge, Washing Machine)
 * @returns {Promise<string>} - AI generated response
 */
exports.generateDiagnosis = async (problemDescription, deviceType) => {
  try {
    const prompt = `
      أنت خبير صيانة أجهزة منزلية متخصص في منصة "تكنو هوم".
      مهمتك هي تقديم تشخيص احترافي ودقيق لمشكلة في جهاز: (${deviceType}).
      
      وصف المشكلة المقدم من العميل:
      "${problemDescription}"
      
      التعليمات المتبعة في الرد:
      1. كن ودوداً واحترافياً.
      2. حدد الأسباب المحتملة للمشكلة بشكل نقاط واضحة.
      3. اقترح خطوات أولية للتحقق يمكن للعميل القيام بها (إجراءات السلامة أولاً).
      4. وضح متى يكون من الضروري استدعاء فني متخصص.
      5. اجعل الرد باللغة العربية بلهجة مهذبة ومبسطة.
      6. إذا كان الوصف غير كافٍ، اطلب من العميل مزيداً من التفاصيل حول (أصوات، روائح، رموز خطأ).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('فشل الاتصال بنظام الذكاء الاصطناعي المتطور، جاري التحويل للنظام المحلي...');
  }
};
