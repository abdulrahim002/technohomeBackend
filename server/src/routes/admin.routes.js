const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, isAuthenticated, isAdmin } = require('../middlewares/auth.middleware');
const { uploadLogo } = require('../middlewares/upload.middleware'); // [+] middleware الشعارات

/**
 * Admin Protected Routes
 * جميع هذه المسارات محمية ولا يمكن الوصول إليها إلا بصلاحية Admin
 */
router.use(verifyToken, isAuthenticated, isAdmin);

// إدارة المستخدمين والمحافظ
router.get('/users', adminController.getAllUsers);
router.post('/users/:userId/toggle-status', adminController.toggleUserStatus);
router.post('/wallet/charge', adminController.chargeTechnicianWallet);

// جلب الفنيين حسب الحالة
router.get('/technicians/pending', adminController.getPendingTechnicians);
router.get('/technicians/verified', adminController.getVerifiedTechnicians);
// توثيق فني معين (يتوافق مع الفرونت آند)
router.post('/technicians/:id/approve', adminController.verifyTechnician);
router.patch('/verify-technician/:id', adminController.verifyTechnician);

// إحصائيات النظام والتقارير المتقدمة
router.get('/statistics', adminController.getStatistics);
router.get('/insights/top-technicians', adminController.getTopTechnicians);
router.get('/export/wallet/:techId', adminController.exportTechnicianWallet);

// إدارة أنواع الأجهزة — [+] uploadLogo.single('logo') لقبول ملف الشعار
router.get('/appliance-types', adminController.getAllApplianceTypes);
router.post('/appliance-types', uploadLogo.single('logo'), adminController.createApplianceType);
router.patch('/appliance-types/:id', uploadLogo.single('logo'), adminController.updateApplianceType);
router.delete('/appliance-types/:id', adminController.deleteApplianceType);

// إدارة الماركات (Brands) — [+] uploadLogo.single('logo') لقبول ملف الشعار
router.get('/brands', adminController.getAllBrands);
router.post('/brands', uploadLogo.single('logo'), adminController.createBrand);
router.patch('/brands/:id', uploadLogo.single('logo'), adminController.updateBrand);
router.delete('/brands/:id', adminController.deleteBrand);

// إدارة المدن (Cities)
router.get('/cities', adminController.getAllCities);
router.post('/cities/sync', adminController.syncLocations);
router.post('/cities', adminController.createCity);
router.patch('/cities/:id', adminController.updateCity);
router.delete('/cities/:id', adminController.deleteCity);

module.exports = router;