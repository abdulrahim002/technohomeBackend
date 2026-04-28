const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequest.controller');
const { verifyToken, isAuthenticated, isClient, isTechnician } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const serviceRequestUpload = require('../middlewares/serviceRequestUpload.middleware');
const Brand = require('../models/Brand.model');
const ApplianceType = require('../models/ApplianceType.model');
const City = require('../models/core/City.model');

/**
 * --- Shared / Public Routes ---
 */
router.get('/lookups/brands', async (req, res) => {
  const brands = await Brand.find({ isActive: true }).sort({ nameAr: 1 });
  res.status(200).json({ status: 'success', data: { brands } });
});

router.get('/lookups/appliances', async (req, res) => {
  const types = await ApplianceType.find().sort({ nameAr: 1 });
  res.status(200).json({ status: 'success', data: { applianceTypes: types } });
});

router.get('/lookups/cities', async (req, res) => {
  const cities = await City.find().sort({ nameAr: 1 });
  res.status(200).json({ status: 'success', data: { cities } });
});

/**
 * --- Client Protected Routes ---
 */
router.post('/analyze', verifyToken, isAuthenticated, isClient, serviceRequestController.analyzeProblem);

router.post('/', 
  verifyToken, 
  isAuthenticated, 
  isClient, 
  serviceRequestUpload.array('images', 5), 
  serviceRequestController.createServiceRequest
);

router.get('/my-requests', verifyToken, isAuthenticated, isClient, serviceRequestController.getMyServiceRequests);
router.get('/technicians/discover', verifyToken, isAuthenticated, isClient, serviceRequestController.discoverTechnicians);

/**
 * --- Technician Protected Routes ---
 */
router.get('/technician/active', verifyToken, isAuthenticated, isTechnician, serviceRequestController.getTechnicianActiveJobs);
router.patch('/:id/accept', verifyToken, isAuthenticated, isTechnician, serviceRequestController.acceptJob);
router.patch('/:id/status', verifyToken, isAuthenticated, isTechnician, serviceRequestController.updateJobStatus);
router.patch('/:id/complete', verifyToken, isAuthenticated, isTechnician, serviceRequestController.completeJob);

/**
 * --- Shared Protected Routes ---
 */
router.get('/:id', verifyToken, isAuthenticated, serviceRequestController.getServiceRequestById);
router.patch('/:id/reset-technician', verifyToken, isAuthenticated, isClient, serviceRequestController.resetTechnician);
router.delete('/:id', verifyToken, isAuthenticated, isClient, serviceRequestController.deleteRequest);

module.exports = router;