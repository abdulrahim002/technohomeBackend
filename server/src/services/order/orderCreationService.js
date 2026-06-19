const ServiceRequest = require('../../models/ServiceRequest.model');
const ApplianceType = require('../../models/ApplianceType.model');
const User = require('../../models/User.model');
const GeminiService = require('../ai/gemini.service');
const mongoose = require('mongoose');
const notificationService = require('../notificationService');
const schedulingValidator = require('./schedulingValidator');

class OrderCreationService {
  /**
   * إنشاء طلب صيانة هجين (حفظ سريع + تشخيص ذكي بمهلة زمنية)
   */
  async createRequest(payload, userId) {
    const { id, applianceType, brand, problemDescription, serviceAddress, images, technicianId, timeSlot, diagnosisType } = payload;
    let { scheduledDate } = payload;

    // توحيد تنسيق التاريخ إلى YYYY-MM-DD بتوقيت ليبيا لتجنب تضارب التوقيت العالمي (UTC)
    if (scheduledDate) {
      try {
        const parsedDate = new Date(scheduledDate);
        if (!isNaN(parsedDate.getTime())) {
          const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Africa/Tripoli',
            year: 'numeric', month: '2-digit', day: '2-digit'
          });
          scheduledDate = formatter.format(parsedDate);
        }
      } catch (e) {
        console.warn('Failed to normalize scheduledDate:', e.message);
      }
    }

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
    } else if (diagnosisType === 'manual' || diagnosisType === 'none') {
      console.log('[SERVICE] Manual/None flow detected, skipping AI.');
      aiDiagnosis = { 
        diagnosis: problemDescription, 
        steps: ['يرجى انتظار الفني للمعاينة الميدانية.'] 
      };
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

    // ✅ جدار حماية Backend: التحقق من تعارض المواعيد والتضارب وصحة التاريخ والوقت
    if (scheduledDate && timeSlot) {
      // 1. التحقق من تعارض مواعيد العميل (إذا كان لديه حجز مؤكد ومقبول في نفس التوقيت)
      const isCustomerBusy = await schedulingValidator.isCustomerBusy(userId, scheduledDate, timeSlot, id);
      if (isCustomerBusy) {
        throw { status: 400, message: 'لديك حجز مؤكد ونشط بالفعل في نفس هذا اليوم والتوقيت. يرجى اختيار موعد آخر.' };
      }

      if (technicianId) {
        const BOOKING_LEAD_TIME_HOURS = 4; // مهلة التحضير الأدنى بالساعات

        // استخدام Intl API للحصول على التاريخ والوقت الدقيق بتوقيت ليبيا
        const getLibyaDateTime = () => {
          const now = new Date();
          const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Africa/Tripoli',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false
          });
          const parts = formatter.formatToParts(now);
          const get = (type) => parts.find(p => p.type === type)?.value || '0';
          const todayStr = `${get('year')}-${get('month')}-${get('day')}`;
          const currentDecimalHour = parseInt(get('hour'), 10) + parseInt(get('minute'), 10) / 60;
          return { todayStr, currentDecimalHour };
        };

        const { todayStr, currentDecimalHour } = getLibyaDateTime();

        // جدار 1: منع الحجز في تواريخ ماضية
        if (scheduledDate < todayStr) {
          throw { status: 400, message: 'لا يمكن الحجز في تواريخ ماضية.' };
        }

        // جدار 2: للحجز في نفس اليوم، التحقق من هامش الأمان (4 ساعات)
        if (scheduledDate === todayStr) {
          const slotStartHour = parseInt(timeSlot.split('-')[0].split(':')[0], 10);
          const hoursUntilSlot = slotStartHour - currentDecimalHour;

          if (hoursUntilSlot < BOOKING_LEAD_TIME_HOURS) {
            const slotLabel = timeSlot.replace('-', ' - ');
            throw {
              status: 400,
              message: `لا يمكن الحجز للفترة (${slotLabel}). يلزم ${BOOKING_LEAD_TIME_HOURS} ساعات على الأقل قبل بدء الفترة الزمنية.`
            };
          }
        }

        // 2. التحقق من انشغال الفني المختار بموعد نشط آخر
        const isTechBusy = await schedulingValidator.isTechnicianBusy(technicianId, scheduledDate, timeSlot, id);
        if (isTechBusy) {
          throw { status: 400, message: 'عذراً، الفني ملتزم بموعد مقبول آخر في نفس هذه الفترة الزمنية. يرجى اختيار موعد أو فني آخر.' };
        }

        // 3. منع التكرار والسبام (إذا كان هناك طلب معلق بالفعل لنفس الفني في نفس اليوم)
        if (!id) { // فقط عند إنشاء طلب جديد وليس عند التحديث
          const hasSpam = await schedulingValidator.hasDuplicatePendingRequest(userId, technicianId, scheduledDate);
          if (hasSpam) {
            throw { status: 400, message: 'لقد أرسلت بالفعل طلباً معلقاً لهذا الفني في هذا اليوم. يرجى انتظار رده على طلبك الحالي.' };
          }

          // 4. منع تكرار الحجز المؤكد لنفس الفني ونفس العميل في نفس اليوم (بعد القبول)
          const hasActiveSameDay = await schedulingValidator.hasActiveBookingOnSameDay(userId, technicianId, scheduledDate);
          if (hasActiveSameDay) {
            throw { status: 400, message: 'لديك بالفعل حجز مؤكد ونشط مع هذا الفني في هذا اليوم. يمكنك التواصل معه مباشرة للتنسيق.' };
          }
        }
      }
    }

    const requestData = {
      customer: userId,
      applianceType,
      brand,
      problemDescription,
      scheduledDate,
      timeSlot,
      technician: (technicianId && mongoose.Types.ObjectId.isValid(technicianId)) ? technicianId : undefined,
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

    // إرسال إشعار للفني إذا تم تعيينه
    if (request.technician && request.status === 'pending') {
      notificationService.createNotification({
        recipientId: request.technician,
        senderId: userId,
        title: 'طلب صيانة جديد 🛠️',
        message: `لديك طلب جديد لصيانة (${applianceName}). يرجى المراجعة والقبول.`,
        type: 'order',
        relatedId: request._id
      }).catch(err => console.error('[NOTIFICATION_ERROR] Failed to notify tech:', err.message));
    }

    return request;
  }

  /**
   * تشخيص فقط (بدون حفظ - للعرض الفوري قبل قرار الحجز)
   */
  async analyzeOnly(data, userId, audioFile = null) {
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
          problemDescription,
          audioFile
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
