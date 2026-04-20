const express = require('express');
const router = express.Router();
const errorCodeController = require('../controllers/errorCode.controller');
const { verifyToken, isAuthenticated, isAdmin } = require('../middlewares/auth.middleware');

/**
 * مسارات أكواد الأعطال (ErrorCode Routes)
 */

// مسار البحث (متاح لجميع المستخدمين المسجلين)
router.get('/search', verifyToken, isAuthenticated, errorCodeController.searchErrorCode);

// مسارات التحكم (للحماية: Admin فقط)
router.use(verifyToken, isAuthenticated, isAdmin);

router.post('/', errorCodeController.createErrorCode);
router.get('/', errorCodeController.getAllErrorCodes);
router.patch('/:id', errorCodeController.updateErrorCode);
router.delete('/:id', errorCodeController.deleteErrorCode);

module.exports = router;
