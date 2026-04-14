const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, isAuthenticated, isAdmin, isTechnician } = require('../middlewares/auth.middleware');

/**
 * Protected Routes (All authenticated users)
 * وظائف المستخدم المحمية
 */

// Get user profile
// وظيفة الحصول على ملف المستخدم
router.get('/profile', verifyToken, isAuthenticated, userController.getUserProfile);
router.get('/technicians', verifyToken, isAuthenticated, userController.listTechnicians);

// Update user profile
// وظيفة تحديث ملف المستخدم
router.patch('/profile', verifyToken, isAuthenticated, userController.updateUserProfile);

// Update user location
// وظيفة تحديث موقع المستخدم
router.patch('/location', verifyToken, isAuthenticated, userController.updateLocation);

// Update FCM Token
// وظيفة تحديث رمز FCM
router.patch('/fcm-token', verifyToken, isAuthenticated, userController.updateFcmToken);

/**
 * Technician Routes
 * وظائف الفني المحمية
 */

// Get technician profile
// وظيفة الحصول على ملف الفني
router.get('/technician-profile', verifyToken, isAuthenticated, isTechnician, userController.getTechnicianProfile);

// Update technician profile
// وظيفة تحديث ملف الفني
router.patch('/technician-profile', verifyToken, isAuthenticated, isTechnician, userController.updateTechnicianProfile);

// Upload verification documents
// وظيفة رفع مستندات التحقق
router.post('/upload-documents', verifyToken, isAuthenticated, isTechnician, userController.uploadVerificationDocuments);

/**
 * Admin Routes
 * وظائف الادمن المحمية
 */

// Get user by ID
//وظيفة الحصول على مستخدم معين

router.get('/admin/:userId', verifyToken, isAuthenticated, isAdmin, userController.getUserById);

module.exports = router;