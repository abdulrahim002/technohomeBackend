const User = require('../models/User.model');

/**
 * Middleware to check and manage AI credits quota
 */
exports.checkAiQuota = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'المستخدم غير موجود'
      });
    }

    const now = new Date();
    const lastReset = new Date(user.lastCreditReset);
    const hoursPassed = (now - lastReset) / (1000 * 60 * 60);

    // Reset credits if 24 hours have passed
    //وقت تجديد الباقة  
    if (hoursPassed >= 24) {
      user.aiCredits = 5;
      user.lastCreditReset = now;
      await user.save();
    }

    // Check if credits are available
    //التحقق من وجود رصيد
    if (user.aiCredits <= 0) {
      return res.status(403).json({
        status: 'fail',
        message: 'لقد استنفدت باقتك المجانية اليوم، يرجى استخدام نظام التشخيص الذاتي أو المحاولة غداً'
      });
    }

    // Pass user to the next handler to avoid refetching
    //تمرير المستخدم إلى المعالج التالي لتجنب إعادة جلبه
    req.fullUser = user;
    next();
  } catch (error) {
    next(error);
  }
};
