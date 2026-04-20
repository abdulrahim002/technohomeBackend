const User = require('../models/User.model');
const TechnicianProfile = require('../models/TechnicianProfile.model');
const ServiceRequest = require('../models/ServiceRequest.model');
const ApplianceType = require('../models/ApplianceType.model');
const Brand = require('../models/Brand.model');
const City = require('../models/core/City.model');

// ==========================================
// 1. إدارة المستخدمين والفنيين
// ==========================================

/**
 * الحصول على كافة المستخدمين
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, search } = req.query;
    let query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(query).select('-password').populate('city', 'nameAr').sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: { count: users.length, users } });
  } catch (error) { next(error); }
};

/**
 * جلب قائمة الفنيين الذين ينتظرون التوثيق
 */
exports.getPendingTechnicians = async (req, res, next) => {
  try {
    const technicians = await TechnicianProfile.find({ isVerified: false })
      .populate('user', 'firstName lastName phone city profileImage')
      .populate('specialties', 'nameAr')
      .populate('brands', 'nameAr');

    res.status(200).json({ status: 'success', data: { count: technicians.length, technicians } });
  } catch (error) { next(error); }
};

/**
 * توثيق فني (Admin Approval)
 */
exports.verifyTechnician = async (req, res, next) => {
  try {
    const techProfile = await TechnicianProfile.findById(req.params.id);
    if (!techProfile) return res.status(404).json({ status: 'fail', message: 'بروفايل الفني غير موجود' });

    techProfile.isVerified = true;
    await techProfile.save();

    res.status(200).json({ status: 'success', message: 'تم توثيق الفني بنجاح' });
  } catch (error) { next(error); }
};

/**
 * تعطيل أو تفعيل حساب مستخدم
 */
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ status: 'success', message: 'تم تغيير حالة الحساب' });
  } catch (error) { next(error); }
};

// ==========================================
// 2. إدارة المحتوى (الأجهزة)
// ==========================================

exports.createApplianceType = async (req, res, next) => {
  try {
    const { nameAr, nameEn } = req.body;
    
    // التحقق من عدم التكرار (بسيط)
    const existing = await ApplianceType.findOne({ $or: [{ nameAr }, { nameEn }] });
    if (existing) {
      return res.status(400).json({ status: 'fail', message: 'هذا الجهاز (بالعربي أو الإنجليزي) مسجل مسبقاً' });
    }

    const type = await ApplianceType.create({ name: `${nameAr}-${nameEn}`, nameAr, nameEn });
    res.status(201).json({ status: 'success', data: { applianceType: type } });
  } catch (error) { next(error); }
};

exports.getAllApplianceTypes = async (req, res, next) => {
  try {
    const types = await ApplianceType.find().sort({ nameAr: 1 }).lean();
    res.status(200).json({ status: 'success', data: { applianceTypes: types } });
  } catch (error) { next(error); }
};

exports.updateApplianceType = async (req, res, next) => {
  try {
    const type = await ApplianceType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ status: 'success', data: { applianceType: type } });
  } catch (error) { next(error); }
};

exports.deleteApplianceType = async (req, res, next) => {
  try {
    await ApplianceType.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: 'success', message: 'تم الحذف بنجاح' });
  } catch (error) { next(error); }
};

// ==========================================
// 3. إدارة الماركات (Brands)
// ==========================================

exports.createBrand = async (req, res, next) => {
  try {
    const { nameAr, nameEn, applianceTypes } = req.body;

    // التحقق من عدم التكرار لهذه الماركة (عالمي)
    const existing = await Brand.findOne({ $or: [{ nameAr }, { nameEn }] });
    if (existing) {
      return res.status(400).json({ status: 'fail', message: 'هذه الماركة مسجلة مسبقاً في النظام' });
    }

    const brand = await Brand.create({ 
      name: `${nameAr}-${nameEn}`, 
      nameAr, 
      nameEn, 
      applianceTypes // مصفوفة من الـ IDs
    });
    res.status(201).json({ status: 'success', data: { brand } });
  } catch (error) { next(error); }
};

exports.getAllBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find()
      .populate('applianceTypes', 'nameAr nameEn') // جلب بيانات كل الأجهزة المرتبطة
      .sort({ nameAr: 1 })
      .lean();
    res.status(200).json({ status: 'success', data: { brands } });
  } catch (error) { next(error); }
};

exports.updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    res.status(200).json({ status: 'success', data: { brand } });
  } catch (error) { next(error); }
};

exports.deleteBrand = async (req, res, next) => {
  try {
    await Brand.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: 'success', message: 'تم حذف الماركة بنجاح' });
  } catch (error) { next(error); }
};

// ==========================================
// 4. الإحصائيات
// ==========================================

exports.getStatistics = async (req, res, next) => {
  try {
    const [u, t, r, c] = await Promise.all([
      User.countDocuments(), 
      User.countDocuments({ role: 'technician' }),
      ServiceRequest.countDocuments(), 
      ServiceRequest.countDocuments({ status: 'completed' })
    ]);
    res.status(200).json({ 
      status: 'success', 
      data: { 
        users: { total: u, technicians: t }, 
        requests: { total: r, completed: c } 
      } 
    });
  } catch (error) { next(error); }
};