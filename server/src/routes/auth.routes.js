const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const upload = require('../middlewares/upload.middleware');
const { verifyToken, isAuthenticated } = require('../middlewares/auth.middleware');

/**
 * Public Routes
 */

// Register with optional profile image
router.post('/register', upload.single('profileImage'), authController.register);

// Login user
router.post('/login', authController.login);

// Forgot password (OTP)
router.post('/forgot-password', authController.forgotPassword);

// Reset password via OTP (New)
router.post('/reset-password-otp', authController.resetPasswordOTP);

/**
 * Protected Routes
 */

// Get current user profile
router.get('/me', verifyToken, isAuthenticated, authController.getMe);

// Refresh token
router.post('/refresh-token', verifyToken, isAuthenticated, authController.refreshToken);

// Change password
router.post('/change-password', verifyToken, isAuthenticated, authController.changePassword);

module.exports = router;