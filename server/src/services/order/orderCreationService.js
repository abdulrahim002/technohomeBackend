const ServiceRequest = require('../../models/ServiceRequest.model');
const ApplianceType = require('../../models/ApplianceType.model');
const User = require('../../models/User.model');
const GeminiService = require('../ai/gemini.service');
const mongoose = require('mongoose');

class OrderCreationService {
  /**
   * إنشاء طلب صيانة هجين (حفظ سريع + تشخيص ذكي بمهلة زمنية)
   */
  async createRequest(payload, userId) {
    const { id, applianceType, brand, problemDescription, serviceAddress, images, technicianId, scheduledDate, diagnosisType } = payload;

    console.log('--- [SERVICE] STARTING UNIFIED HYBRID REQUEST ---');

    let applianceName = 'جهاز غير معروف';
    try {
      const typeDoc = await ApplianceType.findById(applianceType);
      if (typeDoc) applianceName = typeDoc.nameAr;
    } catch (e) {
      applianceName = applianceType;
    }

    let brandName = brand;
    try {
      const Brand = require('../../models/Brand.model');
      if (brand && mongoose.Types.ObjectId.isValid(brand)) {
        const brandDoc = await Brand.findById(brand);
        if (brandDoc) brandName = brandDoc.nameAr;
      }
    } catch (e) {
      brandName = brand;
    }

    let aiDiagnosis = null;
    if (payload.preComputedDiagnosis) {
      console.log('[SERVICE] Using pre-computed diagnosis from client.');
      aiDiagnosis = payload.preComputedDiagnosis;
    } else {
      try {
        const quota = await GeminiService.checkQuota(userId);
        if (quota.hasCredits) {
          console.log('[SERVICE] Requesting Gemini Diagnosis (30s limit)...');
          const raceResult = await Promise.race([
            GeminiService.analyzeProblem({
              applianceType: applianceName,
              brand: brandName || 'غير محددة',
              problemDescription: problemDescription
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), 30000))
          ]);
          if (raceResult && raceResult.success) {
            aiDiagnosis = raceResult.data?.aiDiagnosis;
            await GeminiService.deductCredits(userId);
            console.log('[SERVICE] Gemini Diagnosis Success.');
          }
        }
      } catch (error) {
        console.warn('[SERVICE] AI Diagnosis skipped or timed out:', error.message);
      }
    }

    let finalServiceAddress = serviceAddress || {};
    const user = await User.findById(userId);
    
    if (!finalServiceAddress.cityId && user && user.city) {
      finalServiceAddress.cityId = user.city;
    }

    // Fix for Validation Error: coordinates are required
    if (!finalServiceAddress.location || !finalServiceAddress.location.coordinates) {
      finalServiceAddress.location = {
        type: 'Point',
        coordinates: (user && user.location && user.location.coordinates) 
          ? user.location.coordinates 
          : [0, 0]
      };
    }

    const requestData = {
      customer: userId,
      applianceType,
      brand,
      problemDescription,
      scheduledDate,
      technician: technicianId || undefined,
      serviceAddress: finalServiceAddress,
      images: images && images.length > 0 ? images : undefined,
      diagnosisType: diagnosisType || 'none',
      aiDiagnosis: aiDiagnosis || undefined,
      status: technicianId 
        ? 'pending' 
        : (aiDiagnosis ? 'diagnosed_only' : 'pending')
    };

    let request;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      console.log(`[SERVICE] Updating existing request: ${id}`);
      request = await ServiceRequest.findOneAndUpdate(
        { _id: id, customer: userId },
        { $set: requestData },
        { new: true }
      );
      if (!request) throw { status: 404, message: 'الطلب المراد تحديثه غير موجود' };
    } else {
      console.log('[SERVICE] Creating new request.');
      if (!requestData.aiDiagnosis) {
        requestData.aiDiagnosis = { 
          diagnosis: 'التشخيص الذكي قيد المعالجة وسيظهر لك لاحقاً.', 
          steps: ['يرجى انتظار الفني للمعاينة الميدانية.', 'تأكد من فصل الكهرباء عن الجهاز حالياً.'] 
        };
      }
      request = await ServiceRequest.create(requestData);
    }

    console.log('--- [SERVICE] HYBRID REQUEST SAVED SUCCESSFULLY! ---');
    return request;
  }

  /**
   * تشخيص فقط (بدون حفظ - للعرض الفوري قبل قرار الحجز)
   */
  async analyzeOnly(data, userId) {
    const { applianceType, brand, problemDescription } = data;

    let applianceName = applianceType;
    try {
      const typeDoc = await ApplianceType.findById(applianceType);
      if (typeDoc) applianceName = typeDoc.nameAr;
    } catch (e) { /* نستمر بالقيمة الأصلية */ }

    let brandName = brand;
    try {
      const Brand = require('../../models/Brand.model');
      if (brand && mongoose.Types.ObjectId.isValid(brand)) {
        const brandDoc = await Brand.findById(brand);
        if (brandDoc) brandName = brandDoc.nameAr;
      }
    } catch (e) {}

    const quota = await GeminiService.checkQuota(userId);
    if (!quota.hasCredits) {
      return {
        success: false,
        limitReached: true,
        message: 'نفذ رصيدك من التشخيص الذكي اليوم. يمكنك الحجز مباشرة مع الفني.'
      };
    }

    console.log('[SERVICE] analyzeOnly: Racing Gemini (20s limit)...');
    let aiResult = null;
    try {
      aiResult = await Promise.race([
        GeminiService.analyzeProblem({
          applianceType: applianceName,
          brand: brandName || 'غير محددة',
          problemDescription
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), 20000))
      ]);
    } catch (err) {
      console.warn('[SERVICE] analyzeOnly timed out or failed:', err.message);
      return {
        success: true,
        timedOut: true,
        data: {
          aiDiagnosis: {
            diagnosis: 'لم نتمكن من إتمام التشخيص الآن. يُنصح بحجز فني للمعاينة الميدانية.',
            steps: ['تحقق من مصدر الطاقة الكهربائي.', 'لا تحاول فك الجهاز قبل وصول الفني.']
          }
        }
      };
    }

    if (!aiResult || !aiResult.success) {
      return {
        success: true,
        timedOut: true,
        data: {
          aiDiagnosis: {
            diagnosis: 'خدمة الذكاء الاصطناعي غير متاحة مؤقتاً. يُنصح بحجز فني للمعاينة.',
            steps: ['تحقق من مصدر الطاقة الكهربائي.', 'لا تحاول فك الجهاز قبل وصول الفني.']
          }
        }
      };
    }

    await GeminiService.deductCredits(userId);
    console.log('[SERVICE] analyzeOnly: Success!');
    return { success: true, data: aiResult.data };
  }
}

module.exports = new OrderCreationService();
