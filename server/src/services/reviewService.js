const Review = require('../models/Review.model');
const ServiceRequest = require('../models/ServiceRequest.model');
const TechnicianProfile = require('../models/TechnicianProfile.model');
const notificationService = require('./notificationService');

class ReviewService {
  async submitReview(customerId, requestId, { rating, comment }) {
    const request = await ServiceRequest.findById(requestId);
    
    if (!request) throw { status: 404, message: 'طلب الصيانة غير موجود' };
    if (request.customer.toString() !== customerId.toString()) {
      throw { status: 403, message: 'لا يمكنك تقييم طلب لا يخصك' };
    }
    if (request.status !== 'completed') {
      throw { status: 400, message: 'يمكنك تقييم الطلبات المكتملة فقط' };
    }

    // منع التقييم المزدوج
    const existingReview = await Review.findOne({ serviceRequest: requestId });
    if (existingReview) throw { status: 400, message: 'تم تقييم هذا الطلب مسبقاً' };

    const review = await Review.create({
      customer: customerId,
      technician: request.technician,
      serviceRequest: requestId,
      rating,
      comment
    });

    // تحديث التقييم العام للفني تلقائياً
    const allReviews = await Review.find({ technician: request.technician });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await TechnicianProfile.findOneAndUpdate(
      { user: request.technician },
      { rating: Math.round(avgRating * 10) / 10, reviewCount: allReviews.length }
    );

    // إرسال إشعار للفني بالتقييم الجديد
    await notificationService.createNotification({
      recipientId: request.technician,
      title: 'حصلت على تقييم جديد ⭐',
      message: `قام العميل بتقييمك بـ ${rating} نجوم. " ${comment || 'بدون تعليق'} "`,
      type: 'system',
      relatedId: requestId
    });

    return review;
  }

  async getTechnicianReviews(techId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const reviews = await Review.find({ technician: techId })
      .populate('customer', 'firstName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return reviews;
  }
}

module.exports = new ReviewService();
