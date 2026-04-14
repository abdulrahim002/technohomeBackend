const Troubleshoot = require('../models/Troubleshoot.model');
const User = require('../models/User.model');
const geminiService = require('../services/geminiService');

/**
 * @desc    Search for a troubleshoot solution (Input-Based Diagnostic)
 * @route   GET /api/troubleshoots/search
 * @access  Public / Private
 */
exports.searchTroubleshoot = async (req, res, next) => {
  try {
    const { errorCode, deviceType } = req.query;

    if (!errorCode || !deviceType) {
      return res.status(400).json({
        status: 'fail',
        message: 'الرجاء إدخال رمز العطل ونوع الجهاز للبحث',
      });
    }

    const troubleshoot = await Troubleshoot.findOne({
      errorCode: errorCode.toUpperCase(),
      deviceType: deviceType,
      isActive: true
    }).populate('deviceType');

    if (!troubleshoot || !troubleshoot.diagnosticSteps || troubleshoot.diagnosticSteps.length === 0) {
      return res.status(404).json({
        status: 'fail',
        statusMessage: 'لم يتم العثور على تشخيص كامل لهذا الرمز.',
        message: 'لم نتمكن من التعرف على العطل بالكامل، يرجى طلب فني صيانة.'
      });
    }

    // إرجاع أول خطوة تشخيصية (Root Question) للبدء بالجلسة التفاعلية
    const firstStep = troubleshoot.diagnosticSteps[0]; // Assuming index 0 is the starting point

    res.status(200).json({
      status: 'success',
      statusMessage: `تم التعرف بنجاح على العطل، لنبدأ بالتشخيص التفاعلي.`,
      data: {
        troubleshootId: troubleshoot._id,
        initialQuestion: firstStep,
        diagnosticTree: troubleshoot.diagnosticSteps // Returning the entire tree for front-end traversal
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search for troubleshoots by free text description (NLP-like Text Search)
 * @route   GET /api/troubleshoots/description-search
 * @access  Public
 */
exports.searchByDescription = async (req, res, next) => {
  try {
    const { description } = req.query;

    if (!description) {
      return res.status(400).json({
        status: 'fail',
        message: 'الرجاء إدخال وصف للمشكلة للبحث',
      });
    }

    // إزالة أحرف الجر والكلمات الشائعة (Stop Words) لدقة أكبر
    const stopWords = ['انا', 'هناك', 'مشكلة', 'في', 'من', 'هل', 'كيف', 'متى', 'لماذا', 'عندي', 'الجهاز', 'الغسالة', 'المكيف'];
    let keywords = description.split(' ').filter(word => !stopWords.includes(word) && word.length > 2);

    if (keywords.length === 0) keywords = [description]; // fallback if everything was filtered out

    const searchQuery = keywords.join(' ');

    // البحث في النصوص (Text Search)
    const troubleshoots = await Troubleshoot.find(
      { $text: { $search: searchQuery }, isActive: true },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .populate('deviceType', 'name')
    .limit(5); // Return top 5 matches

    if (!troubleshoots || troubleshoots.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'لم نتمكن من العثور على أعطال مطابقة للوصف، الرجاء طلب فني.'
      });
    }

    // Return the list for the user to choose
    res.status(200).json({
      status: 'success',
      count: troubleshoots.length,
      message: 'تم العثور على بعض الأعطال المقاربة، يرجى اختيار الأنسب لتبدأ جلسة التشخيص:',
      data: {
        matches: troubleshoots.map(t => ({
          troubleshootId: t._id,
          title: t.title,
          deviceType: t.deviceType?.name || 'عام',
          errorCode: t.errorCode
        }))
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new troubleshoot article (Admin only)
 * @route   POST /api/troubleshoots
 * @access  Private (Admin)
 */
exports.createTroubleshoot = async (req, res, next) => {
  try {
    const troubleshoot = await Troubleshoot.create(req.body);
    res.status(201).json({
      status: 'success',
      data: { troubleshoot }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all troubleshoot articles (Admin only)
 * @route   GET /api/troubleshoots
 * @access  Private (Admin)
 */
exports.getAllTroubleshoots = async (req, res, next) => {
  try {
    const troubleshoots = await Troubleshoot.find().populate('deviceType').populate('brand');
    res.status(200).json({
      status: 'success',
      count: troubleshoots.length,
      data: { troubleshoots }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update troubleshoot article (Admin only)
 * @route   PATCH /api/troubleshoots/:id
 * @access  Private (Admin)
 */
exports.updateTroubleshoot = async (req, res, next) => {
  try {
    const troubleshoot = await Troubleshoot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!troubleshoot) return res.status(404).json({ status: 'fail', message: 'المقال غير موجود' });

    res.status(200).json({
      status: 'success',
      data: { troubleshoot }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete troubleshoot article (Admin only)
 * @route   DELETE /api/troubleshoots/:id
 * @access  Private (Admin)
 */
exports.deleteTroubleshoot = async (req, res, next) => {
  try {
    const troubleshoot = await Troubleshoot.findByIdAndDelete(req.params.id);
    if (!troubleshoot) return res.status(404).json({ status: 'fail', message: 'المقال غير موجود' });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Advanced Diagnosis using Hybrid AI (Gemini + Local Fallback)
 * @route   POST /api/troubleshoots/advanced-diagnosis
 * @access  Private
 */
exports.advancedDiagnosis = async (req, res, next) => {
  const { description, deviceType } = req.body;
  const userId = req.user.id;

  try {
    if (!description || !deviceType) {
      return res.status(400).json({
        status: 'fail',
        message: 'الرجاء إدخال وصف المشكلة ونوع الجهاز'
      });
    }

    // Attempting Advanced Diagnosis with Gemini
    const aiResponse = await geminiService.generateDiagnosis(description, deviceType);

    // Deduct credit atomically if AI succeeds
    await User.findByIdAndUpdate(userId, { $inc: { aiCredits: -1 } });

    res.status(200).json({
      status: 'success',
      type: 'advanced',
      message: 'تم توليد التشخيص بنجاح بواسطة الذكاء الاصطناعي المتطور.',
      data: {
        diagnosis: aiResponse,
        remainingCredits: req.fullUser.aiCredits - 1
      }
    });

  } catch (error) {
    console.error('Advanced Diagnosis Failed, falling back to Expert System:', error.message);

    // FALLBACK: Use local Expert System logic (Decision Tree search)
    try {
      // Search by description (NLP-like) as fallback
      const stopWords = ['انا', 'هناك', 'مشكلة', 'في', 'من', 'هل', 'كيف', 'متى', 'لماذا', 'عندي', 'الجهاز', 'الغسالة', 'المكيف'];
      let keywords = description.split(' ').filter(word => !stopWords.includes(word) && word.length > 2);
      if (keywords.length === 0) keywords = [description];
      
      const searchQuery = keywords.join(' ');

      const localMatches = await Troubleshoot.find(
        { $text: { $search: searchQuery }, isActive: true },
        { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" } })
      .populate('deviceType', 'name')
      .limit(3);

      res.status(200).json({
        status: 'success',
        type: 'fallback',
        message: 'تم تحويلك للنظام المحلي نظراً لتعذر الوصول للذكاء الاصطناعي أو نفاد الرصيد.',
        data: {
          matches: localMatches.map(t => ({
            troubleshootId: t._id,
            title: t.title,
            deviceType: t.deviceType?.name || 'عام'
          }))
        }
      });

    } catch (fallbackError) {
      next(fallbackError);
    }
  }
};
