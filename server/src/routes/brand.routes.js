const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');
const { verifyToken, isAuthenticated, isAdmin } = require('../middlewares/auth.middleware');

/**
 * Public Routes
 */

// Get all brands
router.get('/', brandController.getAllBrands);

// Get brand by ID
router.get('/:id', brandController.getBrandById);

/**
 * Admin Protected Routes
 */

// Create new brand
router.post('/', verifyToken, isAuthenticated, isAdmin, brandController.createBrand);

// Update brand
router.patch('/:id', verifyToken, isAuthenticated, isAdmin, brandController.updateBrand);

// Delete brand
router.delete('/:id', verifyToken, isAuthenticated, isAdmin, brandController.deleteBrand);

module.exports = router;