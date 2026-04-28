const ServiceRequest = require('../models/ServiceRequest.model');
const ApplianceType = require('../models/ApplianceType.model');
const GeminiService = require('./ai/gemini.service');
const mongoose = require('mongoose');

class ServiceRequestService {
  /**
   * إنشاء طلب صيانة هجين (حفظ سريع + تشخيص ذكي بمهلة زمنية)
   * الدور: استقبال البيانات والصور، محاولة التشخيص، وحفظ الطلب نهائياً.
   */
  async createRequest(payload, userId) {
    const { id, applianceType, brand, problemDescription, serviceAddress, images, technicianId, scheduledDate, diagnosisType } = payload;

    console.log('--- [SERVICE] STARTING UNIFIED HYBRID REQUEST ---');

    // 1. استخلاص التخصص بالعربية للذكاء الاصطناعي
    let applianceName = 'جهاز غير معروف';
    try {
      const typeDoc = await ApplianceType.findById(applianceType);
      if (typeDoc) applianceName = typeDoc.nameAr;
    } catch (e) {
      applianceName = applianceType;
    }

    // 2. محاولة الحصول على التشخيص الذكي
    // إذا أرسل الموبايل تشخيصًا مسبقًا، نستخدمه مباشرةً ولا نستدعي Gemini مرة ثانية
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
              brand: brand || 'غير محددة',
              problemDescription: problemDescription
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), 30000))
          ]);
          if (raceResult && raceResult.success) {
            // استخراج { diagnosis, steps } من البنية الموحدة { aiDiagnosis: {...} }
            aiDiagnosis = raceResult.data?.aiDiagnosis;
            await GeminiService.deductCredits(userId);
            console.log('[SERVICE] Gemini Diagnosis Success.');
          }
        }
      } catch (error) {
        console.warn('[SERVICE] AI Diagnosis skipped or timed out:', error.message);
      }
    }

    // 3. تأمين العنوان (مدينة المستخدم الافتراضية)
    let finalServiceAddress = serviceAddress || {};
    if (!finalServiceAddress.cityId) {
      const User = require('../models/User.model');
      const user = await User.findById(userId);
      if (user && user.city) finalServiceAddress.cityId = user.city;
    }

    // 4. حفظ أو تحديث الطلب في قاعدة البيانات
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
        ? 'waiting_for_confirmation' 
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
      // القيم الافتراضية للتشخيص إن لم يتوفر
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
   * مع مهلة زمنية 20 ثانية لضمان عدم التعليق.
   */
  async analyzeOnly(data, userId) {
    const { applianceType, brand, problemDescription } = data;

    // 1. استخلاص اسم الجهاز بالعربية
    let applianceName = applianceType;
    try {
      const typeDoc = await ApplianceType.findById(applianceType);
      if (typeDoc) applianceName = typeDoc.nameAr;
    } catch (e) { /* نستمر بالقيمة الأصلية */ }

    // 2. فحص الرصيد
    const quota = await GeminiService.checkQuota(userId);
    if (!quota.hasCredits) {
      // حتى عند نفاذ الرصيد، نعطي استجابة منطقية بدلاً من رفض الطلب
      return {
        success: false,
        limitReached: true,
        message: 'نفذ رصيدك من التشخيص الذكي اليوم. يمكنك الحجز مباشرة مع الفني.'
      };
    }

    // 3. سباق الذكاء الاصطناعي مع مهلة 20 ثانية
    console.log('[SERVICE] analyzeOnly: Racing Gemini (20s limit)...');
    let aiResult = null;
    try {
      aiResult = await Promise.race([
        GeminiService.analyzeProblem({
          applianceType: applianceName,
          brand: brand || 'غير محددة',
          problemDescription
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), 20000))
      ]);
    } catch (err) {
      console.warn('[SERVICE] analyzeOnly timed out or failed:', err.message);
      // عودة بنتيجة احتياطية بدلاً من التعليق
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

    // 4. خصم رصيد عند النجاح فقط
    await GeminiService.deductCredits(userId);
    console.log('[SERVICE] analyzeOnly: Success!');
    return { success: true, data: aiResult.data };
  }

  /**
   * جلب طلبات العميل
   */
  async getMyRequests(userId) {
    return await ServiceRequest.find({ customer: userId })
      .populate('applianceType', 'nameAr')
      .populate('technician', 'profile')
      .sort({ createdAt: -1 });
  }

  /**
   * جلب تفاصيل طلب محدد
   */
  async getRequestDetails(requestId, userId) {
    const request = await ServiceRequest.findOne({ _id: requestId, customer: userId })
      .populate('applianceType', 'nameAr')
      .populate({
        path: 'technician',
        select: 'firstName lastName phone city profileImage'
      })
      .populate('serviceAddress.cityId', 'nameAr');

    if (!request) throw { status: 404, message: 'الطلب غير موجود' };
    return request;
  }

  /**
   * إلغاء حجز الفني مع الحفاظ على التشخيص (الحل للغز)
   */
  async resetTechnician(requestId, userId) {
    const request = await ServiceRequest.findOne({ _id: requestId, customer: userId });
    
    if (!request) throw { status: 404, message: 'الطلب غير موجود' };
    
    // يسمح بالإلغاء فقط إذا كان في حالة الانتظار
    if (request.status !== 'waiting_for_confirmation') {
      throw { status: 400, message: 'لا يمكن إلغاء الحجز في هذه المرحلة' };
    }

    request.technician = undefined;
    request.scheduledDate = undefined;
    request.status = request.aiDiagnosis ? 'diagnosed_only' : 'pending';
    
    await request.save();
    return request;
  }

  /**
   * حذف الطلب نهائياً
   */
  async deleteRequest(requestId, userId) {
    const request = await ServiceRequest.findOne({ _id: requestId, customer: userId });
    
    if (!request) throw { status: 404, message: 'الطلب غير موجود' };
    
    // لا يسمح بحذف الطلبات المكتملة لضمان سجل العمليات
    if (request.status === 'completed') {
      throw { status: 400, message: 'لا يمكن حذف طلب مكتمل' };
    }

    await ServiceRequest.deleteOne({ _id: requestId });
    return { success: true };
  }

  /**
   * --- Technician Methods ---
   */

  /**
   * جلب الطلبات النشطة للفني
   */
  async getTechnicianActiveJobs(techId) {
    return await ServiceRequest.find({ 
      technician: techId, 
      status: { $in: ['waiting_for_confirmation', 'accepted', 'on_the_way', 'arrived', 'in_progress'] } 
    })
    .populate('customer', 'firstName lastName phone')
    .populate('applianceType', 'nameAr')
    .populate('serviceAddress.cityId', 'nameAr')
    .sort({ scheduledDate: 1 });
  }

  /**
   * جلب تفاصيل الطلب للفني (يتحقق من الملكية)
   */
  async getTechnicianJobDetails(requestId, techId) {
    const request = await ServiceRequest.findOne({ _id: requestId, technician: techId })
      .populate('customer', 'firstName lastName phone')
      .populate('applianceType', 'nameAr')
      .populate('serviceAddress.cityId', 'nameAr');

    if (!request) throw { status: 404, message: 'المهمة غير موجودة أو لم تعد مسندة إليك' };
    return request;
  }

  /**
   * قبول طلب موجه للفني
   */
  async acceptRequest(requestId, techId) {
    const request = await ServiceRequest.findOne({ _id: requestId, technician: techId });
    if (!request) throw { status: 404, message: 'الطلب غير موجود' };
    if (request.status !== 'waiting_for_confirmation') {
      throw { status: 400, message: 'لا يمكن قبول الطلب في حالته الحالية' };
    }

    request.status = 'accepted';
    request.acceptedAt = Date.now();
    await request.save();
    return request;
  }

  /**
   * تحديث الحالة (في الطريق، وصل، جاري العمل)
   */
  async updateJobStatus(requestId, techId, status) {
    const allowedStatuses = ['on_the_way', 'arrived', 'in_progress'];
    if (!allowedStatuses.includes(status)) throw { status: 400, message: 'حالة غير صالحة' };

    const request = await ServiceRequest.findOne({ _id: requestId, technician: techId });
    if (!request) throw { status: 404, message: 'المهمة غير موجودة' };

    request.status = status;
    await request.save();
    return request;
  }

  /**
   * إتمام الصيانة
   */
  async completeJob(requestId, techId, finalPrice, notes) {
    const request = await ServiceRequest.findOne({ _id: requestId, technician: techId });
    if (!request) throw { status: 404, message: 'المهمة غير موجودة' };

    request.status = 'completed';
    request.completedAt = Date.now();
    request.finalPrice = finalPrice;
    request.technicianNotes = notes;
    
    await request.save();
    return request;
  }
}

module.exports = new ServiceRequestService();