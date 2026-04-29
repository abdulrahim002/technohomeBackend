const ServiceRequest = require('../../models/ServiceRequest.model');

class ClientOrderService {
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
    
    if (request.status === 'completed') {
      throw { status: 400, message: 'لا يمكن حذف طلب مكتمل' };
    }

    await ServiceRequest.deleteOne({ _id: requestId });
    return { success: true };
  }
}

module.exports = new ClientOrderService();
