const reviewService = require('../services/reviewService');

exports.submitReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const review = await reviewService.submitReview(req.userId, req.params.id, { rating, comment });
    res.status(201).json({ status: 'success', message: 'شكراً لك على تقييمك!', data: { review } });
  } catch (error) { next(error); }
};

exports.getTechnicianReviews = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const reviews = await reviewService.getTechnicianReviews(req.params.techId, page, limit);
    res.status(200).json({ status: 'success', data: { reviews } });
  } catch (error) { next(error); }
};
