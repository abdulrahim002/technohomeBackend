const ErrorCode = require('../models/ErrorCode.model');
const ApplianceType = require('../models/ApplianceType.model');
const Brand = require('../models/Brand.model');

/**
 * وحدة تحكم أكواد الأعطال
 * Separation of Concerns: فصل المنطق عن البيانات.
 */

// --- الأدمن (Admin CRUD) ---

// 1. إضافة كود عطل جديد
exports.createErrorCode = async (req, res) => {
  try {
    const { code, description, deviceId, brandId, actionStep } = req.body;

    const newErrorCode = await ErrorCode.create({
      code,
      description,
      deviceId,
      brandId,
      actionStep
    });

    res.status(201).json({
      status: 'success',
      data: { errorCode: newErrorCode }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'هذا الكود مضاف مسبقاً لهذا الجهاز والماركة'
      });
    }
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// 2. جلب جميع الأكواد (للبحث في لوحة التحكم)
exports.getAllErrorCodes = async (req, res) => {
  try {
    const errorCodes = await ErrorCode.find()
      .populate('deviceId', 'nameAr nameEn')
      .populate('brandId', 'nameAr nameEn')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: errorCodes.length,
      data: { errorCodes }
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// 3. تعديل كود عطل
exports.updateErrorCode = async (req, res) => {
  try {
    const errorCode = await ErrorCode.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!errorCode) {
      return res.status(404).json({ status: 'fail', message: 'الكود غير موجود' });
    }

    res.status(200).json({
      status: 'success',
      data: { errorCode }
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// 4. حذف كود عطل
exports.deleteErrorCode = async (req, res) => {
  try {
    const errorCode = await ErrorCode.findByIdAndDelete(req.params.id);
    if (!errorCode) {
      return res.status(404).json({ status: 'fail', message: 'الكود غير موجود' });
    }
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// --- المستخدم (User Search) ---

// 5. البحث عن عطل محدد
exports.searchErrorCode = async (req, res) => {
  try {
    const { deviceId, brandId, code } = req.query;

    if (!deviceId || !brandId || !code) {
      return res.status(400).json({
        status: 'fail',
        message: 'يرجى توفير نوع الجهاز والماركة والكود'
      });
    }

    const errorCode = await ErrorCode.findOne({
      deviceId,
      brandId,
      code: code.toUpperCase(),
      isActive: true
    }).populate('deviceId brandId', 'nameAr');

    if (!errorCode) {
      return res.status(404).json({
        status: 'fail',
        message: 'عذراً، لم نجد شرح لهذا الكود حالياً. يمكنك طلب فني للمساعدة.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { errorCode }
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};
