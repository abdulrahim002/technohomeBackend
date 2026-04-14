const express = require('express');
const router = express.Router();
const troubleshootController = require('../controllers/troubleshoot.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const quotaMiddleware = require('../middlewares/checkAiQuota');

// User Routes
// وظائف المستخدم
router.get('/search', troubleshootController.searchTroubleshoot);
router.get('/description-search', troubleshootController.searchByDescription);

// AI Advanced Diagnosis (Protected)
// وظيفة التشخيص المتقدم
router.post('/advanced-diagnosis', 
  authMiddleware.verifyToken, 
  authMiddleware.isAuthenticated, 
  quotaMiddleware.checkAiQuota, 
  troubleshootController.advancedDiagnosis
);

// Admin Routes: Manage Troubleshoot Articles
// وظائف الادمن
// Require Authentication and Admin Roles


router.use(authMiddleware.verifyToken, authMiddleware.isAuthenticated);

router.post('/', authMiddleware.isAdmin, troubleshootController.createTroubleshoot);
router.get('/', authMiddleware.isAdmin, troubleshootController.getAllTroubleshoots);
router.patch('/:id', authMiddleware.isAdmin, troubleshootController.updateTroubleshoot);
router.delete('/:id', authMiddleware.isAdmin, troubleshootController.deleteTroubleshoot);

module.exports = router;
