const ServiceRequest = require('../../models/ServiceRequest.model');
const User = require('../../models/User.model');
const TechnicianProfile = require('../../models/TechnicianProfile.model');
const OrderStateMachine = require('../orderStateMachine');
const notificationService = require('../notificationService');
const transactionService = require('../transactionService');

class TechnicianOrderService {
  /**
   * جلب الطلبات النشطة للفني
   */
  async getTechnicianActiveJobs(techId) {
    const requests = await ServiceRequest.find({ 
      technician: techId, 
      status: { $in: ['pending', 'accepted', 'arrived'] } 
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
            $maxDistance: 200 // 200 متر كحد أقصى
          }
        }
      });

      if (!isNearby) {
        // الطلب موجود ولكن الفني بعيد
        const requestExists = await ServiceRequest.findOne({ _id: requestId, technician: techId });
        if (!requestExists) throw { status: 404, message: 'المهمة غير موجودة' };
        
        throw { status: 403, message: 'لا يمكنك تأكيد الوصول. يجب أن تكون ضمن مسافة 200 متر من موقع العميل.' };
      }
    }

    const request = await ServiceRequest.findOne({ _id: requestId, technician: techId });
    if (!request) throw { status: 404, message: 'المهمة غير موجودة' };

    // التحقق بواسطة State Machine
    OrderStateMachine.transition(request, status);

    await request.save();

    // إرسال إشعار إذا كانت الحالة arrived
    if (status === 'arrived') {
      await notificationService.createNotification({
        recipientId: request.customer,
        title: 'الفني وصل للموقع',
        message: 'الفني متواجد الآن في موقعك. يرجى استقباله وتجهيز رمز الإغلاق (OTP) عند انتهاء العمل.',
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

    // التحقق من الـ OTP
    if (!otp || request.closingOTP !== otp.toString()) {
      throw { status: 400, message: 'رمز التحقق (OTP) غير صحيح. يرجى طلبه من العميل لإنهاء المهمة.' };
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

    // تطبيق العقوبة: خصم 5 نقاط من نقاط الموثوقية
    const profile = await TechnicianProfile.findOne({ user: techId });
    if (profile) {
      profile.reliabilityScore = Math.max(0, profile.reliabilityScore - 5);
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
