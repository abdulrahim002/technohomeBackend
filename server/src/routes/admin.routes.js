const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, isAuthenticated, isAdmin } = require('../middlewares/auth.middleware');

/**
 * Admin Protected Routes
 * جميع هذه المسارات محمية ولا يمكن الوصول إليها إلا بصلاحية Admin
 */
router.use(verifyToken, isAuthenticated, isAdmin);

// إدارة المستخدمين والمحافظ
router.get('/users', adminController.getAllUsers);
router.post('/users/:userId/toggle-status', adminController.toggleUserStatus);
router.post('/wallet/charge', adminController.chargeTechnicianWallet);

// جلب الفنيين الذين ينتظرون التوثيق
router.get('/technicians/pending', adminController.getPendingTechnicians);
// توثيق فني معين (يتوافق مع الفرونت آند)
router.post('/technicians/:id/approve', adminController.verifyTechnician);
router.patch('/verify-technician/:id', adminController.verifyTechnician);

// إحصائيات النظام والتقارير المتقدمة
router.get('/statistics', adminController.getStatistics);
router.get('/insights/top-technicians', adminController.getTopTechnicians);
router.get('/export/wallet/:techId', adminController.exportTechnicianWallet);

// إدارة أنواع الأجهزة
router.get('/appliance-types', adminController.getAllApplianceTypes);
router.post('/appliance-types', adminController.createApplianceType);
router.patch('/appliance-types/:id', adminController.updateApplianceType);
router.delete('/appliance-types/:id', adminController.deleteApplianceType);

// إدارة الماركات (Brands)
router.get('/brands', adminController.getAllBrands);
router.post('/brands', adminController.createBrand);
router.patch('/brands/:id', adminController.updateBrand);
router.delete('/brands/:id', adminController.deleteBrand);

module.exports = router;