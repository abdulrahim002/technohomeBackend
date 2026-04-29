const Review = require('../models/Review.model');
const ServiceRequest = require('../models/ServiceRequest.model');

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

    const review = await Review.create({
      customer: customerId,
      technician: request.technician,
      serviceRequest: requestId,
      rating,
      comment
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
