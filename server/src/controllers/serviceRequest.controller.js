const serviceRequestService = require('../services/serviceRequestService');

// ==========================================
// وظائف العميل (Client Functions)
// ==========================================

/**
 * اكتشاف الفنيين المتاحين للتشخيص الحالي
 */
exports.discoverTechnicians = async (req, res, next) => {
  try {
    const { applianceTypeId, cityId } = req.query;
    const technicianService = require('../services/technicianService');
    const technicians = await technicianService.findTechniciansForBooking(applianceTypeId, cityId);
    
    res.status(200).json({ 
      status: 'success', 
      data: { count: technicians.length, technicians } 
    });
  } catch (error) { next(error); }
};

/**
 * إنشاء طلب صيانة جديد مع تشخيص ذكي وتعيين فني وموعد
 */
exports.createServiceRequest = async (req, res, next) => {
  try {
    // معالجة الصور المرفوعة
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `uploads/requests/${file.filename}`);
    }

    // دمج الصور مع البيانات القادمة من مسار الحجز المباشر
    const requestData = {
      ...req.body,
      images,
      // فك ترميز التشخيص المسبق من FormData إذا وُجد
      preComputedDiagnosis: req.body.preComputedDiagnosis 
        ? JSON.parse(req.body.preComputedDiagnosis) 
        : null,
    };

    const result = await serviceRequestService.createRequest(requestData, req.userId);
    res.status(201).json({ 
      status: 'success', 
      message: 'تم حجز الطلب بنجاح في انتظار تأكيد الفني', 
      data: result 
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ status: 'fail', message: error.message });
    next(error); 
  }
};

/**
 * تشخيص المشكلة فقط (بدون حجز - نظام السباق الذكي 20 ثانية)
 */
exports.analyzeProblem = async (req, res, next) => {
  try {
    const result = await serviceRequestService.analyzeOnly(req.body, req.userId);
    if (result.limitReached) {
      return res.status(402).json({ status: 'fail', message: result.message });
    }
    res.status(200).json({ status: 'success', data: result.data, timedOut: result.timedOut || false });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ status: 'fail', message: error.message });
    next(error);
  }
};

/**
 * جلب قائمة طلبات العميل
 */
exports.getMyServiceRequests = async (req, res, next) => {
  try {
    const requests = await serviceRequestService.getMyRequests(req.userId, req.query.status);
    res.status(200).json({ status: 'success', data: { count: requests.length, requests } });
  } catch (error) { next(error); }
};

/**
 * جلب تفاصيل طلب محدد بالمعرف
 */
exports.getServiceRequestById = async (req, res, next) => {
  try {
    let request;
    if (req.userRole === 'technician') {
        request = await serviceRequestService.getTechnicianJobDetails(req.params.id, req.userId);
    } else {
        request = await serviceRequestService.getRequestDetails(req.params.id, req.userId);
    }
    res.status(200).json({ status: 'success', data: { request } });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ status: 'fail', message: error.message });
    next(error); 
  }
};

/**
 * رفع صورة العطل
 */
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ status: 'fail', message: 'لم يتم رفع صورة' });
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/users/${req.file.filename}`;
    res.status(200).json({ status: 'success', data: { imageUrl } });
  } catch (error) { next(error); }
};

/**
 * إلغاء حجز الفني (إعادة الطلب لحالة التشخيص فقط)
 */
exports.resetTechnician = async (req, res, next) => {
  try {
    const result = await serviceRequestService.resetTechnician(req.params.id, req.userId);
    res.status(200).json({ status: 'success', message: 'تم إلغاء الحجز، الطلب الآن في قائمة التشخيصات', data: result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ status: 'fail', message: error.message });
    next(error);
  }
};

/**
 * حذف الطلب
 */
exports.deleteRequest = async (req, res, next) => {
  try {
    const result = await serviceRequestService.deleteRequest(req.params.id, req.userId);
    res.status(200).json({ status: 'success', message: 'تم حذف الطلب بنجاح' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ status: 'fail', message: error.message });
    next(error);
  }
};

/**
 * --- Technician Actions ---
 */

exports.getTechnicianActiveJobs = async (req, res, next) => {
    try {
        const requests = await serviceRequestService.getTechnicianActiveJobs(req.userId);
        res.status(200).json({ status: 'success', data: { count: requests.length, requests } });
    } catch (error) { next(error); }
};

exports.acceptJob = async (req, res, next) => {
    try {
        const result = await serviceRequestService.acceptRequest(req.params.id, req.userId);
        res.status(200).json({ status: 'success', message: 'تم قبول الطلب بنجاح', data: result });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ status: 'fail', message: error.message });
        next(error);
    }
};

exports.updateJobStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const result = await serviceRequestService.updateJobStatus(req.params.id, req.userId, status);
        res.status(200).json({ status: 'success', message: 'تم تحديث حالة الطلب', data: result });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ status: 'fail', message: error.message });
        next(error);
    }
};

exports.completeJob = async (req, res, next) => {
    try {
        const { finalPrice, notes } = req.body;
        const result = await serviceRequestService.completeJob(req.params.id, req.userId, finalPrice, notes);
        res.status(200).json({ status: 'success', message: 'تم إتمام الصيانة بنجاح', data: result });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ status: 'fail', message: error.message });
        next(error);
    }
};
