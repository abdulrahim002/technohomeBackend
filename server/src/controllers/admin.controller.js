const User = require('../models/User.model');
const TechnicianProfile = require('../models/TechnicianProfile.model');
const ServiceRequest = require('../models/ServiceRequest.model');
const ApplianceType = require('../models/ApplianceType.model');
const Brand = require('../models/Brand.model');
const City = require('../models/core/City.model');
const Area = require('../models/core/Area.model');
const locationSyncService = require('../services/locationSyncService');
const transactionService = require('../services/transactionService');
const reportExportService = require('../services/reportExportService');
const notificationService = require('../services/notificationService');
const fs = require('fs');   // [+] لحذف الشعارات القديمة من القرص عند التحديث
const path = require('path'); // [+] لبناء مسارات الملفات المطلقة

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

exports.getPendingTechnicians = async (req, res, next) => {
  try {
    const technicians = await TechnicianProfile.find({ isVerified: false })
      .populate({
        path: 'user',
        select: 'firstName lastName phone city profileImage',
        populate: { path: 'city', select: 'nameAr' }
      })
      .populate('specialties', 'nameAr')
      .populate('brands', 'nameAr');

    res.status(200).json({ status: 'success', data: { count: technicians.length, technicians } });
  } catch (error) { next(error); }
};

/**
 * جلب قائمة الفنيين المعتمدين (كامل البيانات)
 */
exports.getVerifiedTechnicians = async (req, res, next) => {
  try {
    const technicians = await TechnicianProfile.find({ isVerified: true })
      .populate({
        path: 'user',
        select: 'firstName lastName phone city profileImage walletBalance',
        populate: { path: 'city', select: 'nameAr' }
      })
      .populate('specialties', 'nameAr')
      .populate('brands', 'nameAr')
      .sort({ createdAt: -1 });

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

    // تحديث حالة المستخدم أيضاً لضمان إمكانية الدخول أو التوثيق الكامل
    await User.findByIdAndUpdate(techProfile.user, { isVerified: true });

    // إرسال إشعار للفني بالتوثيق
    await notificationService.createNotification({
      recipientId: techProfile.user,
      title: 'تهانينا! تم توثيق حسابك 🎉',
      message: 'لقد تمت مراجعة بياناتك وتوثيق حسابك رسمياً. يمكنك الآن استقبال طلبات الصيانة وزيادة دخلك.',
      type: 'system'
    });

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

/**
 * شحن محفظة فني
 */
exports.chargeTechnicianWallet = async (req, res, next) => {
  try {
    const { techId, amount } = req.body;
    const transaction = await transactionService.chargeWallet(req.userId, techId, amount);

    res.status(200).json({ status: 'success', message: 'تم شحن المحفظة بنجاح', data: { transaction } });
  } catch (error) { next(error); }
};

// ==========================================
// 2. إدارة المحتوى (الأجهزة)
// ==========================================

exports.createApplianceType = async (req, res, next) => {
  try {
    const { nameAr, nameEn } = req.body;

    // التحقق من عدم التكرار
    const existing = await ApplianceType.findOne({ $or: [{ nameAr }, { nameEn }] });
    if (existing) {
      return res.status(400).json({ status: 'fail', message: 'هذا الجهاز (بالعربي أو الإنجليزي) مسجل مسبقاً' });
    }

    // [+] استخراج مسار الشعار النسبي إن تم رفع ملف
    const logoUrl = req.file ? `/uploads/logos/${req.file.filename}` : null;

    const type = await ApplianceType.create({
      name: `${nameAr}-${nameEn}`,
      nameAr,
      nameEn,
      logoUrl // [+]
    });
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
    // [+] بناء كائن التحديث
    const updateData = { ...req.body };

    if (req.file) {
      // [+] حذف الشعار القديم من القرص إن وُجد (تنظيف آمن)
      const existing = await ApplianceType.findById(req.params.id).select('logoUrl').lean();
      if (existing?.logoUrl) {
        const oldPath = path.join(__dirname, '../../', existing.logoUrl);
        fs.unlink(oldPath, (err) => {
          // نتجاهل الخطأ إن لم يكن الملف موجوداً (defensive)
          if (err && err.code !== 'ENOENT') {
            console.warn('[uploadLogo] فشل حذف الشعار القديم:', err.message);
          }
        });
      }
      updateData.logoUrl = `/uploads/logos/${req.file.filename}`; // [+]
    }

    const type = await ApplianceType.findByIdAndUpdate(req.params.id, updateData, { new: true });
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

    // [+] استخراج مسار الشعار النسبي إن تم رفع ملف
    const logoUrl = req.file ? `/uploads/logos/${req.file.filename}` : null;

    const brand = await Brand.create({
      name: `${nameAr}-${nameEn}`,
      nameAr,
      nameEn,
      applianceTypes, // مصفوفة من الـ IDs
      logoUrl         // [+]
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
    // [+] بناء كائن التحديث
    const updateData = { ...req.body };

    if (req.file) {
      // [+] حذف الشعار القديم من القرص إن وُجد (تنظيف آمن)
      const existingBrand = await Brand.findById(req.params.id).select('logoUrl').lean();
      if (existingBrand?.logoUrl) {
        const oldPath = path.join(__dirname, '../../', existingBrand.logoUrl);
        fs.unlink(oldPath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.warn('[uploadLogo] فشل حذف شعار الماركة القديم:', err.message);
          }
        });
      }
      updateData.logoUrl = `/uploads/logos/${req.file.filename}`; // [+]
    }

    const brand = await Brand.findByIdAndUpdate(req.params.id, updateData, { new: true }).lean();
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
    const [u, t, r, c, rev] = await Promise.all([
      User.countDocuments(), 
      User.countDocuments({ role: 'technician' }),
      ServiceRequest.countDocuments(), 
      ServiceRequest.countDocuments({ status: 'completed' }),
      ServiceRequest.aggregate([
        { $group: { _id: null, total: { $sum: "$commissionDeducted" } } }
      ])
    ]);
    
    // Get recent transactions total
    const systemLiquidity = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$walletBalance" } } }
    ]);

    res.status(200).json({ 
      status: 'success', 
      data: { 
        users: { total: u, technicians: t }, 
        serviceRequests: { total: r, completed: c },
        financials: {
          totalRevenue: rev[0]?.total || 0,
          systemLiquidity: systemLiquidity[0]?.total || 0
        },
        system: {
          brands: await Brand.countDocuments(),
          applianceTypes: await ApplianceType.countDocuments()
        }
      } 
    });
  } catch (error) { next(error); }
};

// ==========================================
// 5. إدارة المدن (Cities)
// ==========================================

exports.createCity = async (req, res, next) => {
  try {
    const { name, nameAr, nameEn, latitude, longitude } = req.body;
    
    // التحقق من عدم التكرار
    const existing = await City.findOne({ $or: [{ name }, { nameAr }, { nameEn }] });
    if (existing) {
      return res.status(400).json({ status: 'fail', message: 'هذه المدينة مسجلة مسبقاً' });
    }

    const city = await City.create({ name, nameAr, nameEn, latitude, longitude });
    res.status(201).json({ status: 'success', data: { city } });
  } catch (error) { next(error); }
};

exports.getAllCities = async (req, res, next) => {
  try {
    // جلب المدن مع تضمين المناطق التابعة لها تلقائياً
    const cities = await City.find().sort({ nameAr: 1 }).lean();
    
    // جلب المناطق ودمجها برمجياً أو عبر populate إذا كان هناك علاقة (يفضل برمجياً هنا للسرعة)
    const areas = await Area.find({ isActive: true }).lean();
    
    const citiesWithAreas = cities.map(city => ({
      ...city,
      areas: areas.filter(area => area.cityId.toString() === city._id.toString())
    }));

    res.status(200).json({ status: 'success', data: { cities: citiesWithAreas } });
  } catch (error) { next(error); }
};

/**
 * تنفيذ عملية المزامنة مع ملف الـ JSON
 */
exports.syncLocations = async (req, res, next) => {
  try {
    await locationSyncService.syncAll();
    res.status(200).json({ status: 'success', message: 'تمت المزامنة بنجاح مع قاعدة البيانات' });
  } catch (error) { next(error); }
};

exports.updateCity = async (req, res, next) => {
  try {
    const city = await City.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    res.status(200).json({ status: 'success', data: { city } });
  } catch (error) { next(error); }
};

exports.deleteCity = async (req, res, next) => {
  try {
    await City.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: 'success', message: 'تم حذف المدينة بنجاح' });
  } catch (error) { next(error); }
};

/**
 * جلب قائمة أفضل الفنيين حسب التقييم والموثوقية
 */
exports.getTopTechnicians = async (req, res, next) => {
  try {
    const topTechs = await TechnicianProfile.find({ isVerified: true })
      .populate('user', 'firstName lastName phone profileImage')
      .sort({ rating: -1, reliabilityScore: -1 })
      .limit(10)
      .lean();

    res.status(200).json({ status: 'success', data: { technicians: topTechs } });
  } catch (error) { next(error); }
};

/**
 * تصدير كشف حساب مالي لفني (Excel)
 */
exports.exportTechnicianWallet = async (req, res, next) => {
  try {
    const { techId } = req.params;
    const workbook = await reportExportService.exportWalletToExcel(techId);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=wallet_statement_${techId}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) { next(error); }
};