const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequest.controller');
const { verifyToken, isAuthenticated, isClient } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const serviceRequestUpload = require('../middlewares/serviceRequestUpload.middleware');
const City = require('../models/core/City.model');
const ApplianceType = require('../models/ApplianceType.model');
const Brand = require('../models/Brand.model');

// مسار فحص الاتصال للتأكد من وصول طلبات الـ POST
router.post('/ping', (req, res) => {
  console.log('--- [DEBUG SERVER] PING RECEIVED ---', req.body);
  res.status(200).json({ status: 'success', message: 'pong', body: req.body });
});

/**
 * Lookups (Public Access: Used for Signup and General Reference)
 */

// جلب قائمة الماركات المتوفرة (Samsung, LG, etc.)
router.get('/lookups/brands', async (req, res) => {
  const brands = await Brand.find({ isActive: true }).sort({ nameAr: 1 });
  res.status(200).json({ status: 'success', data: { brands } });
});

// جلب قائمة الأجهزة المتوفرة والماركات
router.get('/lookups/appliances', async (req, res) => {
  const types = await ApplianceType.find().sort({ nameAr: 1 });
  res.status(200).json({ status: 'success', data: { applianceTypes: types } });
});

// جلب قائمة المدن والمنطقة
router.get('/lookups/cities', async (req, res) => {
  const cities = await City.find().sort({ nameAr: 1 });
  res.status(200).json({ status: 'success', data: { cities } });
});

/**
 * Client Protected Routes (For creating and managing requests)
 */

// تشخيص المشكلة فقط (JSON - بدون حجز، نظام السباق الذكي 20ث)
router.post('/analyze', verifyToken, isAuthenticated, isClient, serviceRequestController.analyzeProblem);

// إنشاء طلب صيانة جديد (حجز + تشخيص AI + صور)
router.post('/', 
  verifyToken, 
  isAuthenticated, 
  isClient, 
  serviceRequestUpload.array('images', 5), 
  serviceRequestController.createServiceRequest
);

// رفع صور الأعطال للطلب الحالي
router.post('/upload-image', verifyToken, isAuthenticated, isClient, upload.single('image'), serviceRequestController.uploadImage);

// جلب قائمة طلباتي (السجل)
router.get('/my-requests', verifyToken, isAuthenticated, isClient, serviceRequestController.getMyServiceRequests);

// اكتشاف الفنيين المناسبين للطلب الحالي
router.get('/technicians/discover', verifyToken, isAuthenticated, isClient, serviceRequestController.discoverTechnicians);

/**
 * Shared Access Routes
 */

// عرض تفاصيل طلب معين بالمعرف
router.get('/:id', verifyToken, isAuthenticated, serviceRequestController.getServiceRequestById);

// إلغاء حجز الفني (إعادة الطلب لحالة التشخيص فقط)
router.patch('/:id/reset-technician', verifyToken, isAuthenticated, isClient, serviceRequestController.resetTechnician);

// حذف الطلب
router.delete('/:id', verifyToken, isAuthenticated, isClient, serviceRequestController.deleteRequest);

module.exports = router;