const reportService = require('../services/reportService');

exports.submitReport = async (req, res, next) => {
  try {
    const { serviceRequestId, description } = req.body;
    const report = await reportService.submitReport(req.userId, serviceRequestId, description);
    res.status(201).json({ status: 'success', message: 'تم إرسال البلاغ بنجاح وجاري المراجعة', data: { report } });
  } catch (error) { next(error); }
};

exports.resolveReport = async (req, res, next) => {
  try {
    const { status, adminReply } = req.body;
    const report = await reportService.resolveReport(req.params.id, status, adminReply);
    res.status(200).json({ status: 'success', message: 'تم التعامل مع البلاغ', data: { report } });
  } catch (error) { next(error); }
};
