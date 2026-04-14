const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { verifyToken, isAuthenticated } = require('../middlewares/auth.middleware');

/**
 * Protected Routes (Customer & Admin)
 */

// Get all devices for current user
router.get('/', verifyToken, isAuthenticated, deviceController.getMyDevices);

// Get device by ID
router.get('/:id', verifyToken, isAuthenticated, deviceController.getDeviceById);

// Create new device
router.post('/', verifyToken, isAuthenticated, deviceController.createDevice);

// Update device
router.patch('/:id', verifyToken, isAuthenticated, deviceController.updateDevice);

// Delete device
router.delete('/:id', verifyToken, isAuthenticated, deviceController.deleteDevice);

module.exports = router;