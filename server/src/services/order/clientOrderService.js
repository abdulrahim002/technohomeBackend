const ServiceRequest = require('../../models/ServiceRequest.model');
const Review = require('../../models/Review.model');

class ClientOrderService {
  /**
   * جلب طلبات العميل
   */
  async getMyRequests(userId) {
    const requests = await ServiceRequest.find({ 
      customer: userId,
      hiddenByCustomer: { $ne: true } // استثناء الطلبات التي أخفاها العميل
    })
      .populate('applianceType', 'nameAr')
      .populate('technician', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .lean();

    // إضافة علامة isRated للطلبات المكتملة
    const completedIds = requests.filter(r => r.status === 'completed').map(r => r._id);
    const reviews = await Review.find({ serviceRequest: { $in: completedIds } }).select('serviceRequest').lean();
    const ratedSet = new Set(reviews.map(r => r.serviceRequest.toString()));

    return requests.map(req => ({
      ...req,
      isRated: ratedSet.has(req._id.toString())
    }));
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
    
    // إرفاق التقييم إذا وجد
    const review = await Review.findOne({ serviceRequest: requestId });
    
    const requestObj = request.toObject();
    requestObj.review = review;
    
    return requestObj;
  }

  /**
   * إلغاء حجز الفني مع الحفاظ على التشخيص
   */
  async resetTechnician(requestId, userId) {
    const request = await ServiceRequest.findOne({ _id: requestId, customer: userId });
    
    if (!request) throw { status: 404, message: 'الطلب غير موجود' };
    
    if (request.status !== 'pending') {
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
    
    // إذا كان الطلب مكتملاً أو ملغياً أو مرفوضاً، نقوم بإخفائه فقط (Soft Delete)
    if (['completed', 'cancelled', 'rejected', 'expired'].includes(request.status)) {
      request.hiddenByCustomer = true;
      await request.save();
      return { success: true, message: 'تم إخفاء الطلب من السجل' };
    }

    // الطلبات الأخرى (مثل المسودات أو التي لم تبدأ) يمكن حذفها نهائياً
    await ServiceRequest.deleteOne({ _id: requestId });
    return { success: true, message: 'تم حذف الطلب نهائياً' };
  }

  /**
   * إرسال رمز الـ OTP رقمياً للفني (بدون إدخال يدوي)
   */
  async authorizeCompletion(requestId, userId) {
    const request = await ServiceRequest.findOne({ _id: requestId, customer: userId });
    
    if (!request) throw { status: 404, message: 'الطلب غير موجود' };
    if (!request.closingOTP) throw { status: 400, message: 'لم يتم إنشاء رمز إغلاق لهذا الطلب بعد' };
    if (!request.technician) throw { status: 400, message: 'لا يوجد فني مرتبط بهذا الطلب' };

    // إرسال عبر السوكت للفني فوراً
    const { getIO } = require('../socketService');
    try {
      const io = getIO();
      io.to(request.technician.toString()).emit('otpReceived', {
        requestId: request._id,
        otp: request.closingOTP
      });
    } catch (e) {
      console.warn('Socket not initialized, could not send real-time OTP');
    }

    return { success: true, message: 'تم إرسال رمز التأكيد للفني بنجاح' };
  }
}

module.exports = new ClientOrderService();
