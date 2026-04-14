const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

/**
 * Public/Customer Routes for Appliances
 */

// Get all appliance types (Public/Customer)
router.get('/', adminController.getAllApplianceTypes);

module.exports = router;
