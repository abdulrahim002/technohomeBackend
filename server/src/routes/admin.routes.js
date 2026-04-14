const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, isAuthenticated, isAdmin } = require('../middlewares/auth.middleware');

/**
 * Admin Protected Routes
 * راوتات الادمن المحمية 
 */

// Apply admin middleware to all routes
// تطبيق ميثود الادمن على جميع الراوتات
router.use(verifyToken, isAuthenticated, isAdmin);

/**
 * User Management
 * إدارة المستخدمين
 */

// Get all users
// وظيفة الحصول على جميع المستخدمين
router.get('/users', adminController.getAllUsers);

// Toggle user status (suspend/unsuspend)
// وظيفة تعطيل/تفعيل المستخدم
router.post('/users/:userId/toggle-status', adminController.toggleUserStatus);

// Verify user identity
// وظيفة التحقق من هوية المستخدم
router.post('/users/:userId/verify', adminController.verifyUser);

// Reject/Un-verify user identity
// وظيفة رفض هوية المستخدم
router.post('/users/:userId/reject', adminController.rejectUser);

// Manual Top-up for technician
// وظيفة شحن رصيد الفني
router.post('/users/:userId/top-up', adminController.manualTopUp);

/**
 * Technician Management
 * إدارة الفنيين
 */

// Get pending technician applications
// وظيفة الحصول على طلبات الفنيين المعلقة
router.get('/technicians/pending', adminController.getPendingTechnicians);

// Approve technician
// وظيفة الموافقة على الفني
router.post('/technicians/:technicianId/approve', adminController.approveTechnician);

// Reject technician
// وظيفة رفض الفني
router.post('/technicians/:technicianId/reject', adminController.rejectTechnician);

/**
 * Service Request Management
 * إدارة طلبات الصيانة
 */

// Get all service requests
// وظيفة الحصول على جميع طلبات الصيانة
router.get('/service-requests', adminController.getAllServiceRequests);

/**
 * System Statistics
 * إحصائيات النظام
 */

// Get system statistics
// وظيفة الحصول على إحصائيات النظام
router.get('/statistics', adminController.getStatistics);

/**
 * Report Generation
 * إصدار التقارير
 */

// Export Service Requests Report
router.get('/reports/service-requests', adminController.exportServiceRequestsReport);

// Export Financial Report
router.get('/reports/financial', adminController.exportFinancialReport);

/**
 * Appliance Types Management
 * إدارة أنواع الأجهزة
 */

// Create appliance type
// إنشاء نوع جهاز جديد
router.post('/appliance-types', adminController.createApplianceType);

// Get all appliance types
// عرض جميع أنواع الأجهزة
router.get('/appliance-types', adminController.getAllApplianceTypes);

// Update appliance type
// تحديث نوع جهاز
router.patch('/appliance-types/:id', adminController.updateApplianceType);

// Delete appliance type
// حذف نوع جهاز
router.delete('/appliance-types/:id', adminController.deleteApplianceType);

module.exports = router;