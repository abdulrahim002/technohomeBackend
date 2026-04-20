const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Verify JWT Token
 * التحقق من بطاقة الدخول
 */
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'لا توجد بطاقة دخول. الرجاء تسجيل الدخول'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: error.name === 'TokenExpiredError' ? 'انتهت صلاحية البطاقة' : 'بطاقة دخول غير صحيحة'
    });
  }
};

/**
 * Check if user is authenticated
 * التحقق من هوية المستخدم
 */
const isAuthenticated = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'المستخدم غير موجود أو معطل'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطأ في التحقق من المستخدم'
    });
  }
};

/**
 * Check if user has specific role
 * التحقق من صلاحيات المستخدم
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // التحقق من الدور من التوكن أو من كائن المستخدم المرفق
    const currentRole = req.user?.role || req.userRole;
    
    if (!roles.includes(currentRole)) {
      return res.status(403).json({
        status: 'fail',
        message: 'ليس لديك صلاحيات كافية للقيام بهذا الإجراء'
      });
    }
    next();
  };
};

/**
 * Check if user is client
 */
const isClient = authorize('client');

/**
 * Check if user is technician
 */
const isTechnician = authorize('technician');

/**
 * Check if user is admin
 */
const isAdmin = authorize('admin');

module.exports = {
  verifyToken,
  isAuthenticated,
  authorize,
  isClient,
  isTechnician,
  isAdmin
}