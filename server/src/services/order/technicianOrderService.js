const ServiceRequest = require('../../models/ServiceRequest.model');
const User = require('../../models/User.model');
const TechnicianProfile = require('../../models/TechnicianProfile.model');
const OrderStateMachine = require('../orderStateMachine');
const notificationService = require('../notificationService');
const transactionService = require('../transactionService');
const schedulingValidator = require('./schedulingValidator');

class TechnicianOrderService {
  /**
   * جلب الطلبات النشطة للفني
   */
  async getTechnicianActiveJobs(techId) {
    const requests = await ServiceRequest.find({ 
      technician: techId, 
      status: { $in: ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress'] } 
    })
    .populate('customer', 'firstName lastName phone')
    .populate('applianceType', 'nameAr')
    .populate('serviceAddress.cityId', 'nameAr')
    .sort({ scheduledDate: 1 })
    .lean();

    // Privacy Filter: إخفاء بيانات العميل إذا لم يتم القبول
    return requests.map(req => {
      if (req.status === 'pending') {
        if (req.customer) req.customer.phone = 'مخفي حتى القبول';
        if (req.serviceAddress) {
          req.serviceAddress.location = undefined;
          req.serviceAddress.building = 'مخفي';
          req.serviceAddress.apartment = 'مخفي';
        }
      }
      return req;
    });
  }

  /**
   * جلب سجل المهام المكتملة والملغاة للفني
   */
  async getTechnicianJobHistory(techId) {
    const requests = await ServiceRequest.find({ 
      technician: techId, 
      status: { $in: ['completed', 'cancelled'] } 
    })
    .populate('customer', 'firstName lastName')
    .populate('applianceType', 'nameAr')
    .sort({ completedAt: -1, updatedAt: -1 })
    .lean();

    return requests;
  }

  /**
   * جلب تفاصيل الطلب للفني (يتحقق من الملكية)
   */
  async getTechnicianJobDetails(requestId, techId) {
    const request = await ServiceRequest.findOne({ _id: requestId, technician: techId })
      .populate('customer', 'firstName lastName phone')
      .populate('applianceType', 'nameAr')
      .populate('serviceAddress.cityId', 'nameAr')
      .lean();

    if (!request) throw { status: 404, message: 'المهمة غير موجودة أو لم تعد مسندة إليك' };

    // Privacy Filter
    if (request.status === 'pending') {
      if (request.customer) request.customer.phone = 'مخفي حتى القبول';
      if (request.serviceAddress) {
        request.serviceAddress.location = undefined;
        request.serviceAddress.building = 'مخفي';
        request.serviceAddress.apartment = 'مخفي';
      }
    }
    return request;
  }

  /**
   * قبول طلب موجه للفني
   */
  async acceptRequest(requestId, techId) {
    const request = await ServiceRequest.findOne({ _id: requestId, technician: techId });
    if (!request) throw { status: 404, message: 'الطلب غير موجود' };
    
    // التحقق بواسطة State Machine
    OrderStateMachine.transition(request, 'accepted');

    // خصم العمولة باستخدام نظام السجلات المالية (Ledger)
    const commission = Number(process.env.COMMISSION_AMOUNT || 10);
    await transactionService.deductCommission(techId, requestId, commission);

    // إنشاء رمز OTP للإغلاق
    const closingOTP = Math.floor(1000 + Math.random() * 9000).toString();

    // تحديث الطلب
    request.commissionDeducted = commission;
    request.closingOTP = closingOTP;
    request.acceptedAt = Date.now();
    await request.save();

    // إرسال إشعار للعميل بقبول الطلب
    await notificationService.createNotification({
      recipientId: request.customer,
      title: 'تم قبول طلبك',
      message: `تم قبول طلب الصيانة الخاص بك من قبل الفني. رمز إغلاق الطلب (OTP) هو: ${closingOTP}`,
      type: 'order',
      relatedId: request._id
    });

    // -----------------------------------------------------
    // الخطوة السحرية: Auto-Reject للمواعيد المتعارضة (Conflict Resolution)
    // -----------------------------------------------------
    if (request.scheduledDate && request.timeSlot) {
      await schedulingValidator.autoRejectConflictingRequests(request);
    }

    return request;
  }

  /**
   * رفض طلب موجه للفني (قبل القبول)
   */
  async rejectRequest(requestId, techId) {
    const request = await ServiceRequest.findOne({ _id: requestId, technician: techId });
    if (!request) throw { status: 404, message: 'الطلب غير موجود' };
    
    if (request.status !== 'pending') {
      throw { status: 400, message: 'يمكنك فقط رفض الطلبات التي لا تزال قيد الانتظار' };
    }

    request.status = 'rejected';
    request.cancelReason = 'rejected_by_technician';
    await request.save();

    // إرسال إشعار للعميل برفض الطلب
    await notificationService.createNotification({
      recipientId: request.customer,
      title: 'تم رفض طلبك',
      message: 'نعتذر، لقد قام الفني برفض طلبك الحالي. يمكنك البحث عن فني آخر أو تعديل بيانات الطلب.',
      type: 'order_rejected',
      relatedId: request._id
    });

    return request;
  }

  /**
   * تحديث الحالة (وصل)
   */
  async updateJobStatus(requestId, techId, status, techLocation) {
    // إذا كانت الحالة 'arrived'، نتحقق من المسافة باستخدام $near
    if (status === 'arrived') {
      if (!techLocation || !techLocation.lat || !techLocation.lng) {
        throw { status: 400, message: 'إحداثيات الفني مطلوبة لتأكيد الوصول' };
      }

      // البحث عن الطلب والتأكد من أن الفني ضمن نطاق 200 متر
      const isNearby = await ServiceRequest.findOne({
        _id: requestId,
        technician: techId,
        'serviceAddress.location': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [techLocation.lng, techLocation.lat]
            },
            $maxDistance: 1000 // 1000 متر (1 كم) كحد أقصى لتأكيد الوصول
          }
        }
      });

      if (!isNearby) {
        // الطلب موجود ولكن الفني بعيد
        const requestExists = await ServiceRequest.findOne({ _id: requestId, technician: techId });
        if (!requestExists) throw { status: 404, message: 'المهمة غير موجودة' };
        
        throw { status: 403, message: 'لا يمكنك تأكيد الوصول. يجب أن تكون ضمن مسافة 1 كم من موقع العميل.' };
      }
    }

    const request = await ServiceRequest.findOne({ _id: requestId, technician: techId });
    if (!request) throw { status: 404, message: 'المهمة غير موجودة' };

    // ✅ جدار الحماية: منع بدء التحرك قبل هامش ساعتين من موعد الفترة الزمنية
    if (status === 'on_the_way') {
      // استخدام Intl API للحصول على الوقت الدقيق بتوقيت ليبيا (أكثر موثوقية من الحسابات اليدوية)
      const getLibyaDateTime = () => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Africa/Tripoli',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false
        });
        const parts = formatter.formatToParts(now);
        const get = (type) => parts.find(p => p.type === type)?.value || '0';
        const todayDate = `${get('year')}-${get('month')}-${get('day')}`;
        const currentDecimalHour = parseInt(get('hour'), 10) + parseInt(get('minute'), 10) / 60;
        return { todayDate, currentDecimalHour };
      };

      const { todayDate, currentDecimalHour } = getLibyaDateTime();
      const scheduledDate = request.scheduledDate;
      const timeSlot = request.timeSlot;

      // شرط 1: يجب أن يكون تاريخ اليوم هو نفس تاريخ الموعد
      if (scheduledDate && todayDate < scheduledDate) {
        throw {
          status: 403,
          message: `لا يمكنك بدء التحرك قبل يوم الموعد المجدول (${scheduledDate}).`
        };
      }
      if (scheduledDate && todayDate > scheduledDate) {
        throw {
          status: 403,
          message: `انتهى موعد هذا الطلب (${scheduledDate}). يرجى التواصل مع العميل.`
        };
      }

      // شرط 2: الساعة الحالية يجب ألا تكون قبل (ساعة البداية - ساعتين)
      if (timeSlot) {
        const slotStartHour = parseInt(timeSlot.split('-')[0].split(':')[0], 10);
        const earliestAllowedDecimalHour = slotStartHour - 2;

        if (currentDecimalHour < earliestAllowedDecimalHour) {
          const earliestStr = `${String(slotStartHour - 2).padStart(2, '0')}:00`;
          throw {
            status: 403,
            message: `لا يمكنك بدء التحرك قبل الساعة ${earliestStr} (ساعتان قبل موعد الفترة ${timeSlot}).`
          };
        }
      }
    }

    // التحقق بواسطة State Machine
    OrderStateMachine.transition(request, status);

    await request.save();

    // إرسال إشعار عند الوصول أو التحرك للموقع
    if (status === 'arrived') {
      await notificationService.createNotification({
        recipientId: request.customer,
        title: 'الفني وصل للموقع',
        message: 'الفني متواجد الآن في موقعك. يرجى استقباله وتجهيز رمز الإغلاق (OTP) عند انتهاء العمل.',
        type: 'order',
        relatedId: request._id
      });
    } else if (status === 'on_the_way') {
      await notificationService.createNotification({
        recipientId: request.customer,
        title: 'الفني في الطريق إليك',
        message: 'لقد بدأ الفني بالتحرك نحو موقعك الآن، ترقّب وصوله قريباً.',
        type: 'order',
        relatedId: request._id
      });
    }

    return request;
  }

  /**
   * إتمام الصيانة
   */
  async completeJob(requestId, techId, finalPrice, notes, otp) {
    const request = await ServiceRequest.findOne({ _id: requestId, technician: techId });
    if (!request) throw { status: 404, message: 'المهمة غير موجودة' };

    // التحقق من الـ OTP (تحويل لنصوص وتنظيف المسافات لضمان التطابق)
    console.log(`[DEBUG] Validating OTP for Request ${requestId}:`);
    console.log(` - Stored OTP: "${request.closingOTP}"`);
    console.log(` - Received OTP: "${otp}"`);

    if (!otp || String(request.closingOTP).trim() !== String(otp).trim()) {
      console.error(' [ERROR] OTP Mismatch!');
      throw { status: 400, message: 'رمز التحقق (OTP) غير صحيح. يرجى التأكد من الرمز المستلم من العميل.' };
    }

    // التحقق بواسطة State Machine
    OrderStateMachine.transition(request, 'completed');

    request.completedAt = Date.now();
    request.finalPrice = finalPrice;
    request.technicianNotes = notes;
    
    await request.save();

    // إرسال إشعار للعميل باكتمال العمل
    await notificationService.createNotification({
      recipientId: request.customer,
      title: 'اكتملت الصيانة بنجاح',
      message: 'شكراً لاستخدامك خدماتنا! تم إغلاق الطلب بنجاح.',
      type: 'order',
      relatedId: request._id
    });

    // -------------------------------------------------------
    // نظام المكافآت: نقاط الموثوقية وسلسلة النجاح (Streak)
    // -------------------------------------------------------
    const profile = await TechnicianProfile.findOne({ user: techId });
    if (profile) {
      // +2 نقطة لكل إتمام ناجح
      let newScore = profile.reliabilityScore + 2;
      
      // زيادة سلسلة النجاح
      profile.consecutiveCompletedJobs = (profile.consecutiveCompletedJobs || 0) + 1;

      // مكافأة إضافية +5 عند كل 5 طلبات متتالية (Streak Bonus)
      if (profile.consecutiveCompletedJobs % 5 === 0) {
        newScore += 5;
        console.log(`[STREAK] 🔥 الفني ${techId} حقق سلسلة ${profile.consecutiveCompletedJobs} إتمام! مكافأة +5 نقاط.`);
      }

      // الحد الأقصى 100 نقطة (Ceiling)
      profile.reliabilityScore = Math.min(100, newScore);
      await profile.save();
    }

    return request;
  }

  /**
   * إلغاء الطلب من قبل الفني (تطبيق العقوبة)
   */
  async cancelJob(requestId, techId) {
    const request = await ServiceRequest.findOne({ _id: requestId, technician: techId });
    if (!request) throw { status: 404, message: 'المهمة غير موجودة' };

    if (request.status === 'completed' || request.status === 'cancelled') {
      throw { status: 400, message: 'لا يمكن إلغاء هذه المهمة في حالتها الحالية' };
    }

    request.technician = undefined;
    request.scheduledDate = undefined;
    request.status = 'pending'; // دائماً ترجع للانتظار لكي تظهر لفنيين آخرين
    request.acceptedAt = undefined;
    request.commissionDeducted = 0;
    request.closingOTP = undefined;
    await request.save();

    // تطبيق العقوبة: خصم 5 نقاط من نقاط الموثوقية + كسر سلسلة النجاح
    const profile = await TechnicianProfile.findOne({ user: techId });
    if (profile) {
      profile.reliabilityScore = Math.max(0, profile.reliabilityScore - 5);
      profile.consecutiveCompletedJobs = 0; // كسر سلسلة النجاح
      await profile.save();
    }

    // إرسال إشعار للعميل باعتذار الفني
    await notificationService.createNotification({
      recipientId: request.customer,
      title: 'اعتذار الفني',
      message: 'نعتذر، لقد اضطر الفني لإلغاء الموعد. طلبك الآن متاح لفنيين آخرين وسنقوم بتوفير بديل في أسرع وقت.',
      type: 'system',
      relatedId: request._id
    });

    return request;
  }
}

module.exports = new TechnicianOrderService();
