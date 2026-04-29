const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken, isAuthenticated, isTechnician, isAdmin } = require('../middlewares/auth.middleware');

// الفني يرسل بلاغ
router.post('/submit', verifyToken, isAuthenticated, isTechnician, reportController.submitReport);

// الأدمن يعالج البلاغ
router.patch('/:id/resolve', verifyToken, isAuthenticated, isAdmin, reportController.resolveReport);

module.exports = router;
