const reportService = require('../services/reportService');

exports.submitReport = async (req, res, next) => {
  try {
    const { reportedId, source, serviceRequestId, chatRoomId, category, description, attachment } = req.body;
    
    if (!reportedId || !source || !category || !description) {
      return res.status(400).json({ status: 'fail', message: 'يرجى تقديم كافة البيانات المطلوبة للبلاغ' });
    }

    const report = await reportService.submitReport({
      reporterId: req.userId,
      reportedId,
      source,
      serviceRequestId,
      chatRoomId,
      category,
      description,
      attachment
    });

    res.status(201).json({ status: 'success', message: 'تم إرسال البلاغ بنجاح وجاري المراجعة الإدارية', data: { report } });
  } catch (error) { next(error); }
};

exports.resolveReport = async (req, res, next) => {
  try {
    const { adminNotes, action } = req.body; // action can be 'refund_commission', 'restrict_reported', or 'none'
    const report = await reportService.resolveReport(req.params.id, { adminNotes, action });
    res.status(200).json({ status: 'success', message: 'تم معالجة واتخاذ الإجراء اللازم للبلاغ بنجاح', data: { report } });
  } catch (error) { next(error); }
};

exports.getReports = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const reports = await reportService.getReports({ status, category });
    res.status(200).json({ status: 'success', data: { count: reports.length, reports } });
  } catch (error) { next(error); }
};
