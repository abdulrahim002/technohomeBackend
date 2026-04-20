const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, isAuthenticated, isTechnician, isAdmin } = require('../middlewares/auth.middleware');

// ==========================================
// User (All Roles)
// ==========================================
router.get('/profile',          verifyToken, isAuthenticated, userController.getUserProfile);
router.patch('/profile',        verifyToken, isAuthenticated, userController.updateUserProfile);
router.patch('/location',       verifyToken, isAuthenticated, userController.updateLocation);
router.patch('/fcm-token',      verifyToken, isAuthenticated, userController.updateFcmToken);

// البحث عن الفنيين (للعملاء)
router.get('/technicians',      verifyToken, isAuthenticated, userController.listTechniciansForBooking);

// ==========================================
// Technician
// ==========================================
router.get('/technician-profile',  verifyToken, isAuthenticated, isTechnician, userController.getTechnicianProfile);
router.post('/onboarding',         verifyToken, isAuthenticated, isTechnician, userController.completeTechnicianOnboarding);

// ==========================================
// Admin
// ==========================================
router.get('/admin/:userId',    verifyToken, isAuthenticated, isAdmin, userController.getUserById);

module.exports = router;
