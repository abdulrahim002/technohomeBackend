const authService = require('../services/authService');

/**
 * Middleware: التحقق من بيانات التسجيل
 * يتحقق من وجود جميع الحقول المطلوبة ويوحد صيغة رقم الهاتف
 */
exports.validateRegister = (req, res, next) => {
  const { firstName, lastName, phone, password } = req.body;

  // التحقق من الحقول المطلوبة
  if (!firstName || !lastName || !phone || !password) {
    return res.status(400).json({
      status: 'fail',
      message: 'الرجاء ملء جميع الحقول المطلوبة (الاسم، رقم الهاتف، كلمة المرور)'
    });
  }

  // توحيد صيغة رقم الهاتف
  const normalizedPhone = authService.normalizePhone(phone);

  // التحقق من صحة الرقم
  if (!authService.validatePhone(normalizedPhone)) {
    return res.status(400).json({
      status: 'fail',
      message: 'رقم الهاتف غير صالح. يجب أن يكون رقم ليبي صحيح (مثال: 091xxxxxxx)'
    });
  }

  // التحقق من طول كلمة المرور
  if (password.length < 6) {
    return res.status(400).json({
      status: 'fail',
      message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
    });
  }

  // تحديث الرقم في الـ body بالصيغة الموحدة
  req.body.phone = normalizedPhone;

  next();
};

/**
 * Middleware: التحقق من بيانات تسجيل الدخول
 */
exports.validateLogin = (req, res, next) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({
      status: 'fail',
      message: 'الرجاء إدخال رقم الهاتف وكلمة المرور'
    });
  }

  // توحيد صيغة رقم الهاتف
  const normalizedPhone = authService.normalizePhone(phone);

  if (!authService.validatePhone(normalizedPhone)) {
    return res.status(400).json({
      status: 'fail',
      message: 'رقم الهاتف غير صالح'
    });
  }

  req.body.phone = normalizedPhone;

  next();
};

/**
 * Middleware: التحقق من رقم الهاتف فقط (لطلب إعادة تعيين كلمة المرور)
 */
exports.validatePhone = (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      status: 'fail',
      message: 'الرجاء إدخال رقم الهاتف'
    });
  }

  const normalizedPhone = authService.normalizePhone(phone);

  if (!authService.validatePhone(normalizedPhone)) {
    return res.status(400).json({
      status: 'fail',
      message: 'رقم الهاتف غير صالح'
    });
  }

  req.body.phone = normalizedPhone;

  next();
};
