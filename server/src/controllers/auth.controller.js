const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User.model');
const TechnicianProfile = require('../models/TechnicianProfile.model');
const notificationService = require('../services/notificationService');

/**
 * Generate JWT Token
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

/**
 * Register new user
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, role, city } = req.body;

    // Validate input (email is optional)
    if (!firstName || !lastName || !phone || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'الرجاء ملء جميع الحقول المطلوبة (الاسم، الهاتف، كلمة المرور)'
      });
    }

    // Check if user already exists by phone
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'رقم الهاتف مستخدم بالفعل'
      });
    }

    // Optional: Also check email if provided
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          status: 'fail',
          message: 'البريد الإلكتروني مستخدم بالفعل'
        });
      }
    }

    // Create new user
    // تحديد الرتب المسموح بها في التسجيل العام فقط
    const allowedRoles = ['customer', 'technician'];
    const finalRole = allowedRoles.includes(role) ? role : 'customer';

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: finalRole,
      address: {
        city: city || 'طرابلس' // Default to Tripoli if missing
      }
    });

    // Handle profile image if uploaded
    if (req.file) {
      user.profileImage = `/uploads/users/${req.file.filename}`;
      await user.save();
    }

    // If registering as technician, create technician profile
    if (role === 'technician') {
      const { specialties, experienceYears } = req.body;
      
      // Parse specialties if it's a string (from FormData)
      let parsedSpecialties = specialties;
      if (typeof specialties === 'string') {
        try {
          parsedSpecialties = JSON.parse(specialties);
        } catch (e) {
          parsedSpecialties = specialties.split(',').map(s => s.trim());
        }
      }

      // Mapping for Arabic names
      const specialtyMap = {
        refrigeration: 'تبريد',
        air_conditioning: 'تكييف',
        washing_machines: 'غسالات',
        dishwashers: 'جلايات صحون',
        ovens: 'أفران',
        microwaves: 'مايكروويف',
        tv_electronics: 'تلفزيون وإلكترونيات',
        small_appliances: 'أجهزة صغيرة',
        general: 'عام'
      };

      const specialtiesAr = (parsedSpecialties && Array.isArray(parsedSpecialties)) 
        ? parsedSpecialties.map(s => specialtyMap[s] || s) 
        : ['عام'];

      await TechnicianProfile.create({
        user: user._id,
        specialties: parsedSpecialties || ['general'],
        specialtiesAr,
        experienceYears: experienceYears || 0,
        verificationStatus: 'pending'
      });
      
      // Set user as not verified initially
      user.isVerified = false;
      await user.save();
    }

    // إرسال إشعار للإدارة بوجود تسجيل جديد
    await notificationService.notifyAdmins({
      title: 'مستخدم جديد',
      message: `تم تسجيل عضو جديد في التطبيق باسم: ${user.fullName || user.firstName} (${role === 'technician' ? 'فني' : 'عميل'})`,
      type: 'system',
      relatedId: user._id
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      status: 'success',
      message: 'تم تسجيل المستخدم بنجاح',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    console.log('Login Request Body:', req.body); // سطر للتحقق من البيانات الواصلة للملف
    const { phone, password } = req.body;

    // Validate input
    if (!phone || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'الرجاء إدخال رقم الهاتف وكلمة المرور'
      });
    }

    // Check if user exists and get password
    const user = await User.findOne({ phone }).select('+password');
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'رقم الهاتف أو كلمة المرور غير صحيحة'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'حسابك معطل. الرجاء التواصل مع الدعم'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'fail',
        message: 'رقم الهاتف أو كلمة المرور غير صحيحة'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      status: 'success',
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'المستخدم غير موجود'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token
 * POST /api/auth/refresh-token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'المستخدم غير موجود أو معطل'
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      status: 'success',
      message: 'تم تحديث البطاقة بنجاح',
      data: {
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * POST /api/auth/change-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'الرجاء إدخال كلمة المرور القديمة والجديدة'
      });
    }

    const user = await User.findById(req.userId).select('+password');

    // Verify old password
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'fail',
        message: 'كلمة المرور القديمة غير صحيحة'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      console.log('Forgot Password Request Body:', req.body);
      return res.status(400).json({
        status: 'fail',
        message: 'الرجاء إدخال رقم الهاتف'
      });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'لا يوجد مستخدم مسجل بهذا الرقم'
      });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send reset token (Simulation: log to console as SMS OTP)
    // في الواجهة سيظهر للمستخدم حقل لإدخال الـ 6 أرقام
    console.log('--- PASSWORD RESET SMS OTP SIMULATION ---');
    console.log(`To: ${phone}`);
    console.log(`OTP Code: ${resetToken}`); 
    console.log('-----------------------------------------');

    res.status(200).json({
      status: 'success',
      message: 'تم إرسال رمز التحقق (OTP) إلى هاتفك عبر رسالة SMS (تمت المحاكاة)',
      // نشارك الرمز فقط في بيئة التطوير للتسهيل على المستخدم المبرمج
      otp: process.env.NODE_ENV === 'production' ? undefined : resetToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * PATCH /api/auth/reset-password/:token
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        status: 'fail',
        message: 'الرجاء إدخال كلمة المرور الجديدة'
      });
    }

    // Hash the token from URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user with matching token and expiry > now
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'التوكن غير صالح أو انتهت صلاحيته'
      });
    }

    // Update password and clear reset fields
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate new JWT
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      status: 'success',
      message: 'تم تغيير كلمة المرور بنجاح',
      data: {
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password via OTP
 * POST /api/auth/reset-password-otp
 */
exports.resetPasswordOTP = async (req, res, next) => {
  try {
    const { phone, otp, password } = req.body;

    if (!phone || !otp || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'الرجاء إدخال رقم الهاتف، رمز التحقق، وكلمة المرور الجديدة'
      });
    }

    // Hash the OTP from request to compare with DB
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Find user with matching phone, hashed token and expiry > now
    const user = await User.findOne({
      phone,
      passwordResetToken: hashedOTP,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'رمز التحقق غير صحيح أو انتهت صلاحيته'
      });
    }

    // Update password and clear reset fields
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate new JWT
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      status: 'success',
      message: 'تم تغيير كلمة المرور بنجاح',
      data: {
        token
      }
    });
  } catch (error) {
    next(error);
  }
};


