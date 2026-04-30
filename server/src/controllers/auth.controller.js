const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User.model');
const TechnicianProfile = require('../models/TechnicianProfile.model');
const ApplianceType = require('../models/ApplianceType.model');
const Brand = require('../models/Brand.model');
const City = require('../models/core/City.model');



// ==========================================
// Helpers
// ==========================================

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// ==========================================
// Register
// ==========================================

exports.register = async (req, res, next) => {
  try {
    let { firstName, lastName, phone, password, role, city, specialties, brands, yearsOfExperience } = req.body;
    const profileImage = req.file ? `uploads/${req.file.filename}` : '';

    // 1. معالجة البيانات القادمة كمصفوفات نصية (بسبب FormData في الموبايل)
    try {
      if (typeof specialties === 'string') specialties = JSON.parse(specialties);
      if (typeof brands === 'string') brands = JSON.parse(brands);
    } catch (e) {
      console.log('Error parsing arrays from body', e);
    }

    // 2. التحقق من البيانات الأساسية
    if (!firstName || !lastName || !phone || !password || !city) {
      return res.status(400).json({ status: 'fail', message: 'الرجاء إدخال كافة البيانات المطلوبة والمدينة' });
    }

    // 2. التحقق من عدم التكرار
    const exists = await User.findOne({ phone });
    if (exists) {
      return res.status(400).json({ status: 'fail', message: 'رقم الهاتف مسجل بالفعل' });
    }

    // 3. تحديد الدور (client هو الافتراضي)
    const userRole = role === 'technician' ? 'technician' : 'client';

    // 4. إنشاء المستخدم
    const user = await User.create({
      firstName,
      lastName,
      phone,
      password,
      role: userRole,
      city,
      profileImage
    });

    // 5. إنشاء ملف الفني فوراً مع التحقق من صحة البيانات
    if (userRole === 'technician') {
      // التحقق من صحة الـ IDs (المصدر الوحيد للحقيقة)
      if (specialties && specialties.length > 0) {
        const validSpecialties = await ApplianceType.find({ _id: { $in: specialties } });
        if (validSpecialties.length !== specialties.length) {
          return res.status(400).json({ status: 'fail', message: 'بعض تخصصات الأجهزة غير موجودة في النظام' });
        }
      }

      if (brands && brands.length > 0) {
        const validBrands = await Brand.find({ _id: { $in: brands } });
        if (validBrands.length !== brands.length) {
          return res.status(400).json({ status: 'fail', message: 'بعض الماركات المختارة غير موجودة في النظام' });
        }
      }

      await TechnicianProfile.create({
        user: user._id,
        specialties: specialties || [],
        brands: brands || [], 
        yearsOfExperience: Number(yearsOfExperience) || 0,
        isVerified: false
      });
    }

    const token = generateToken(user._id, user.role);
    res.status(201).json({ status: 'success', data: { user, token } });

  } catch (error) { next(error); }
};

// ==========================================
// Login
// ==========================================

exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ status: 'fail', message: 'يرجى إدخال الهاتف وكلمة المرور' });
    }

    // جلب المستخدم مع المدينة
    const user = await User.findOne({ phone }).select('+password').populate('city', 'nameAr');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ status: 'fail', message: 'بيانات الدخول غير صحيحة' });
    }

    if (!user.isActive) {
      return res.status(401).json({ status: 'fail', message: 'الحساب معطل' });
    }

    user.lastLogin = Date.now();
    await user.save();

    // جلب بروفايل الفني مع التخصصات والماركات (عمق Populate)
    let techProfile = null;
    if (user.role === 'technician') {
      techProfile = await TechnicianProfile.findOne({ user: user._id })
        .populate('specialties', 'nameAr nameEn')
        .populate('brands', 'nameAr nameEn')
        .lean();
    }

    const token = generateToken(user._id, user.role);
    res.status(200).json({ status: 'success', data: { user, token, techProfile } });

  } catch (error) { next(error); }
};

// ==========================================
// Get Current User
// ==========================================

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate('city', 'nameAr');
    
    let techProfile = null;
    if (user.role === 'technician') {
      techProfile = await TechnicianProfile.findOne({ user: user._id })
        .populate('specialties', 'nameAr nameEn')
        .populate('brands', 'nameAr nameEn')
        .lean();
    }

    res.status(200).json({ status: 'success', data: { user, techProfile } });
  } catch (error) { next(error); }
};

// ==========================================
// Refresh Token
// ==========================================

exports.refreshToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ status: 'fail', message: 'المستخدم غير موجود' });
    const token = generateToken(user._id, user.role);
    res.status(200).json({ status: 'success', data: { token } });
  } catch (error) { next(error); }
};

// ==========================================
// Change Password
// ==========================================

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.userId).select('+password');

    if (!(await user.comparePassword(oldPassword))) {
      return res.status(401).json({ status: 'fail', message: 'كلمة المرور القديمة خاطئة' });
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({ status: 'success', message: 'تم تغيير كلمة المرور' });
  } catch (error) { next(error); }
};

// ==========================================
// Update Profile
// ==========================================

exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, city } = req.body;
    
    // منع تغيير الحقول الحساسة
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (city) updateData.city = city;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('city', 'nameAr');

    if (!user) return res.status(404).json({ status: 'fail', message: 'المستخدم غير موجود' });

    res.status(200).json({ status: 'success', data: user });
  } catch (error) { next(error); }
};

// ==========================================
// Forgot Password (OTP)
// ==========================================

exports.forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ status: 'fail', message: 'الرقم غير مسجل' });

    const otp = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    console.log(`[OTP] Phone: ${phone} | Code: ${otp}`);

    res.status(200).json({
      status: 'success',
      message: 'تم إرسال رمز التحقق',
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) { next(error); }
};

// ==========================================
// Reset Password (OTP)
// ==========================================

exports.resetPasswordOTP = async (req, res, next) => {
  try {
    const { phone, otp, password } = req.body;
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      phone,
      passwordResetToken: hashedOTP,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ status: 'fail', message: 'الرمز غير صحيح أو انتهت صلاحيته' });

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = generateToken(user._id, user.role);
    res.status(200).json({ status: 'success', data: { token } });
  } catch (error) { next(error); }
};
