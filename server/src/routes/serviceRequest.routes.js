const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequest.controller');
const reviewController = require('../controllers/review.controller');
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
  try {
    const Area = require('../models/core/Area.model');
    const cities = await City.find().sort({ nameAr: 1 }).lean();
    const areas = await Area.find({ isActive: true }).lean();
    
    const citiesWithAreas = cities.map(city => ({
      ...city,
      areas: areas.filter(area => area.cityId.toString() === city._id.toString())
    }));

    res.status(200).json({ status: 'success', data: { cities: citiesWithAreas } });
  } catch (error) {
    console.error('❌ Lookup Cities Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * --- Client Protected Routes ---
 */
router.post('/analyze', verifyToken, isAuthenticated, isClient, serviceRequestController.analyzeProblem);
router.post('/upload-image', verifyToken, isAuthenticated, upload.single('image'), serviceRequestController.uploadImage);

router.post('/', 
  verifyToken, 
  isAuthenticated, 
  isClient, 
  serviceRequestUpload.array('images', 5), 
  serviceRequestController.createServiceRequest
);

router.get('/my-requests', verifyToken, isAuthenticated, isClient, serviceRequestController.getMyServiceRequests);
router.get('/technicians/discover', verifyToken, isAuthenticated, isClient, serviceRequestController.discoverTechnicians);
router.get('/technicians/:techId/profile', verifyToken, isAuthenticated, serviceRequestController.getTechnicianPublicProfile);
router.get('/technicians/:techId/unavailable-slots', verifyToken, isAuthenticated, serviceRequestController.getUnavailableSlots);
router.post('/:id/review', verifyToken, isAuthenticated, isClient, reviewController.submitReview);
router.post('/:id/authorize-completion', verifyToken, isAuthenticated, isClient, serviceRequestController.authorizeCompletion);

/**
 * --- Technician Protected Routes ---
 */
router.get('/technician/active', verifyToken, isAuthenticated, isTechnician, serviceRequestController.getTechnicianActiveJobs);
router.get('/technician/history', verifyToken, isAuthenticated, isTechnician, serviceRequestController.getTechnicianJobHistory);
router.patch('/:id/accept', verifyToken, isAuthenticated, isTechnician, serviceRequestController.acceptJob);
router.patch('/:id/reject', verifyToken, isAuthenticated, isTechnician, serviceRequestController.rejectJob);
router.patch('/:id/status', verifyToken, isAuthenticated, isTechnician, serviceRequestController.updateJobStatus);
router.patch('/:id/complete', verifyToken, isAuthenticated, isTechnician, serviceRequestController.completeJob);
router.delete('/:id/cancel', verifyToken, isAuthenticated, isTechnician, serviceRequestController.cancelJob);

/**
 * --- Shared Protected Routes ---
 */
router.get('/:id', verifyToken, isAuthenticated, serviceRequestController.getServiceRequestById);
router.patch('/:id/reset-technician', verifyToken, isAuthenticated, isClient, serviceRequestController.resetTechnician);
router.delete('/:id', verifyToken, isAuthenticated, isClient, serviceRequestController.deleteRequest);

module.exports = router;