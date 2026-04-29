const mongoose = require('mongoose');
const User = require('../models/User.model');
const TechnicianProfile = require('../models/TechnicianProfile.model');
const ServiceRequest = require('../models/ServiceRequest.model');
const ApplianceType = require('../models/ApplianceType.model');
const transactionService = require('../services/transactionService');
const reportExportService = require('../services/reportExportService');

// ==========================================
// Profile
// ==========================================

exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) { next(error); }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, city } = req.body;
    const update = {};
    if (firstName) update.firstName = firstName;
    if (lastName) update.lastName = lastName;
    if (city) update['address.city'] = city;

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) { next(error); }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const { longitude, latitude } = req.body;
    await User.findByIdAndUpdate(req.userId, {
      location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] }
    });
    res.status(200).json({ status: 'success' });
  } catch (error) { next(error); }
};

exports.updateFcmToken = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.userId, { fcmToken: req.body.fcmToken });
    res.status(200).json({ status: 'success' });
  } catch (error) { next(error); }
};

// ==========================================
// Technician Profile
// ==========================================

exports.getTechnicianProfile = async (req, res, next) => {
  try {
    const profile = await TechnicianProfile.findOne({ user: req.userId }).populate('user specialties');
    res.status(200).json({ status: 'success', data: { profile } });
  } catch (error) { next(error); }
};

exports.toggleAvailability = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    const profile = await TechnicianProfile.findOneAndUpdate(
      { user: req.userId },
      { isAvailable },
      { new: true }
    );
    if (!profile) return res.status(404).json({ status: 'fail', message: 'ملف الفني غير موجود' });
    res.status(200).json({ status: 'success', message: 'تم تحديث حالة التواجد بنجاح', data: { isAvailable: profile.isAvailable } });
  } catch (error) { next(error); }
};

/**
 * إكمال بيانات الفني (Onboarding)
 * يستقبل: specialties[] (ApplianceType IDs), experienceYears, city, profileImage
 */
exports.completeTechnicianOnboarding = async (req, res, next) => {
  try {
    const { specialties, experienceYears, city, profileImage } = req.body;

    // تحديث بيانات المستخدم
    await User.findByIdAndUpdate(req.userId, {
      ...(city && { 'address.city': city }),
      ...(profileImage && { profileImage }),
    });

    // تحديث ملف الفني مع التخصصات الجديدة (IDs)
    await TechnicianProfile.findOneAndUpdate(
      { user: req.userId },
      {
        specialties: specialties || [],
        experienceYears: Number(experienceYears) || 0,
        isVerified: false,
        ...(city && { serviceAreas: [{ city }] }),
      },
      { new: true }
    );

    res.status(200).json({ status: 'success', message: 'تم حفظ البيانات، يرجى انتظار موافقة الإدارة' });
  } catch (error) { next(error); }
};

// ==========================================
// Technician Search (للعملاء)
// ==========================================

/**
 * البحث عن فنيين معتمدين حسب المدينة والتخصص (ApplianceType ID)
 * GET /api/users/technicians?city=طرابلس&specialty=65abc...
 */
exports.listTechniciansForBooking = async (req, res, next) => {
  try {
    const { city, specialty } = req.query;

    console.log(`[TechSearch] city="${city}" specialty="${specialty}"`);

    // 1. جلب المستخدمين من نفس المدينة (فنيين نشطين)
    const userQuery = {
      role: 'technician',
      isActive: true,
      'address.city': city ? city.trim() : { $exists: true },
    };
    const techUsers = await User.find(userQuery).select('_id');
    const userIds = techUsers.map(u => u._id);

    // 2. جلب البروفايلات الموثقة فقط والمتاحة
    const profileQuery = {
      user: { $in: userIds },
      isVerified: true,
      isAvailable: true,
    };

    // إضافة فلتر التخصص (ApplianceType ID)
    if (specialty && mongoose.Types.ObjectId.isValid(specialty)) {
      profileQuery.specialties = specialty;
    }

    const profiles = await TechnicianProfile.find(profileQuery)
      .populate('user', '-password')
      .populate('specialties');

    // 3. تجهيز الاستجابة للعميل
    const technicians = profiles.map(profile => ({
      _id: profile.user._id,
      firstName: profile.user.firstName,
      lastName: profile.user.lastName,
      phone: profile.user.phone,
      profileImage: profile.user.profileImage,
      isOnline: profile.user.isOnline,
      city: profile.user.address?.city,
      specialties: profile.specialties,
      experienceYears: profile.experienceYears,
      rating: profile.rating,
      profileId: profile._id,
    }));

    res.status(200).json({ status: 'success', data: { count: technicians.length, technicians } });
  } catch (error) { next(error); }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId || req.params.id);
    if (!user) return res.status(404).json({ status: 'fail', message: 'المستخدم غير موجود' });
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) { next(error); }
};

/**
 * الحصول على سجل المعاملات المالية
 */
exports.getWalletHistory = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const history = await transactionService.getUserHistory(req.userId, page, limit);
    res.status(200).json({ status: 'success', data: history });
  } catch (error) { next(error); }
};

/**
 * تصدير سجل المحفظة الخاص بي (Excel)
 */
exports.exportMyWallet = async (req, res, next) => {
  try {
    const workbook = await reportExportService.exportWalletToExcel(req.userId);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=my_wallet_statement.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) { next(error); }
};
