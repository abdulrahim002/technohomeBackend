const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    // Verified model names for v1beta API - ordered by priority
    // قائمة الموديلات المرتبة حسب استقرار الحصة المجانية والسرعة
    // الموديلات الموثق عملها لحساب العميل (بناءً على فحص API)
    this.modelOptions = [
      "models/gemini-2.0-flash",       // خيار أول (سريع جداً)
      "models/gemini-flash-latest",    // البديل المستقر لـ 1.5 Flash
      "models/gemini-pro-latest",      // البديل لـ 1.5 Pro
      "models/gemini-2.0-flash-lite",  // خيار احتياطي إضافي
    ];
  }

  /**
   * تحليل مشكلة الجهاز وإرجاع رد JSON مبني
   * البنية دائماً: { aiDiagnosis: { diagnosis, steps } }
   */
  async analyzeProblem(data) {
    const applianceType = data.applianceType;
    const brand = data.brand;
    const problemDescription = data.description || data.problemDescription;

    if (!applianceType || !brand || !problemDescription) {
      throw new Error('جميع البيانات (الجهاز، الماركة، الوصف) مطلوبة');
    }

    const prompt = `
      أنت خبير صيانة أجهزة منزلية. 
      قم بتشخيص المشكلة التالية بدقة واحترافية:
      الجهاز: ${applianceType}
      الماركة: ${brand}
      وصف المشكلة: ${problemDescription}

      يجب أن يكون الرد بتنسيق JSON حصراً كالتالي:
      {
        "diagnosis": "شرح مفصل ومبسط للسبب المحتمل للمشكلة باللغة العربية",
        "steps": [
          "تأكد من ...",
          "قم بفحص ...",
          "..."
        ]
      }
      ملاحظة: لا تضف أي نصوص أو علامات خارج الـ JSON.
    `;

    for (const modelName of this.modelOptions) {
      try {
        console.log(`[Gemini] Attempting with model: ${modelName}...`);
        
        const model = this.genAI.getGenerativeModel({ model: modelName });
        
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, reject) => setTimeout(() => reject(new Error('ModelTimeout')), 12000))
        ]);

        const response = await result.response;
        let text = response.text();

        // Clean and parse JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(text);

        console.log(`[Gemini] SUCCESS with model: ${modelName}`);
        
        // IMPORTANT: Always return data wrapped in { aiDiagnosis } for consistent UI rendering
        return {
          success: true,
          data: { aiDiagnosis: parsedData },
          message: 'تم التشخيص بنجاح'
        };

      } catch (error) {
        const isQuota = error.message?.includes('429');
        const isNotFound = error.message?.includes('404');
        
        let errorType = 'ERROR';
        if (isQuota) errorType = 'QUOTA_EXHAUSTED (الحصة منتهية)';
        if (isNotFound) errorType = 'MODEL_NOT_FOUND (موديل غير موجود)';

        console.warn(`[Gemini] Model ${modelName} failed | Reason: ${errorType} | Details: ${error.message?.slice(0, 50)}`);
        continue;
      }
    }

    // All models failed
    return {
      success: false,
      data: null,
      message: 'خدمة الذكاء الاصطناعي غير متوفرة حالياً. سيظهر التشخيص لاحقاً.'
    };
  }

  /**
   * التحقق من رصيد الـ AI للمستخدم (حصص يومية)
   */
  async checkQuota(userId) {
    const User = require('../../models/User.model');
    const user = await User.findById(userId);

    if (!user) throw new Error('المستخدم غير موجود');

    const now = new Date();
    const lastReset = user.lastCreditReset || new Date(0);
    const hoursPassed = (now - lastReset) / (1000 * 60 * 60);

    // إعادة تعيين الرصيد إذا مر 24 ساعة (5 محاولات يومية مجانية)
    if (hoursPassed >= 24) {
      user.aiCredits = 5;
      user.lastCreditReset = now;
      await user.save();
    }

    return {
      hasCredits: user.aiCredits > 0,
      credits: user.aiCredits
    };
  }

  /**
   * خصم محاولة من رصيد الـ AI
   */
  async deductCredits(userId) {
    const User = require('../../models/User.model');
    const user = await User.findById(userId);

    if (user && user.aiCredits > 0) {
      user.aiCredits -= 1;
      await user.save();
    }
  }
}

module.exports = new GeminiService();