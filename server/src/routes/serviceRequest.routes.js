const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequest.controller');
const { verifyToken, isAuthenticated, isCustomer , isTechnician } = require('../middlewares/auth.middleware');

/**
 * Public Routes
 * راوتات العامة
 */

// Find nearby technicians (Geo-filtering)
// وظيفة البحث عن الفنيين القريبين
router.get('/find-technicians', serviceRequestController.findNearbyTechnicians);

/**
 * Customer Protected Routes
 * راوتات العميل المحمية 
 */

// Create new service request
// وظيفة إنشاء طلب صيانة جديد
router.post('/', verifyToken, isAuthenticated, isCustomer, serviceRequestController.createServiceRequest);

// Get my service requests
// وظيفة الحصول على طلبات الصيانة الخاصة بي
router.get('/my-requests', verifyToken, isAuthenticated, isCustomer, serviceRequestController.getMyServiceRequests);

// Get service request by ID
// وظيفة الحصول على طلب صيانة معين
router.get('/:id', verifyToken, isAuthenticated, serviceRequestController.getServiceRequestById);

// Update service request
// وظيفة تحديث طلب صيانة
router.patch('/:id', verifyToken, isAuthenticated, isCustomer, serviceRequestController.updateServiceRequest);

// Cancel service request
// وظيفة إلغاء طلب صيانة
router.post('/:id/cancel', verifyToken, isAuthenticated, isCustomer, serviceRequestController.cancelServiceRequest);

// Rate service request
// وظيفة تقييم طلب صيانة
router.post('/:id/rate', verifyToken, isAuthenticated, isCustomer, serviceRequestController.rateServiceRequest);

// Mark expert system (DIY) as complete
// وظيفة إكمال نظام الصيانة الذاتية
router.patch('/:id/expert-complete', verifyToken, isAuthenticated, isCustomer, serviceRequestController.completeExpertSystem);

/**
 * Technician Protected Routes
 * راوتات الفني المحمية 
 */

// Accept service request
// وظيفة قبول طلب صيانة
router.patch('/:id/accept', verifyToken, isAuthenticated, isTechnician, serviceRequestController.acceptRequest);

// Start trip to customer
// وظيفة بدء الرحلة إلى العميل
router.patch('/:id/start-trip', verifyToken, isAuthenticated, isTechnician, serviceRequestController.startTrip);

// Mark arrival at location
// وظيفة تحديد الوصول إلى الموقع
router.patch('/:id/arrive', verifyToken, isAuthenticated, isTechnician, serviceRequestController.arriveAtLocation);

module.exports = router;