const Report = require('../models/Report.model');
const User = require('../models/User.model');
const TechnicianProfile = require('../models/TechnicianProfile.model');
const notificationService = require('./notificationService');
const transactionService = require('./transactionService');

class ReportService {
  /**
   * رفع بلاغ من قبل الفني
   */
  async submitReport(techId, requestId, description) {
    const report = await Report.create({
      technician: techId,
      serviceRequest: requestId,
      description
    });
    
    // إشعار الإدارة
    await notificationService.notifyAdmins({
      senderId: techId,
      title: 'بلاغ جديد من فني',
      message: 'قام أحد الفنيين برفع بلاغ حول طلب صيانة تم إلغاؤه',
      relatedId: report._id
    });

    return report;
  }

  /**
   * معالجة البلاغ من قبل الإدارة
   */
  async resolveReport(reportId, status, adminReply) {
    const report = await Report.findById(reportId);
    if (!report) throw { status: 404, message: 'البلاغ غير موجود' };
    
    if (report.status !== 'pending') {
      throw { status: 400, message: 'تم التعامل مع هذا البلاغ مسبقاً' };
    }

    report.status = status; // 'refunded' or 'rejected'
    report.adminReply = adminReply;
    await report.save();

    if (status === 'refunded') {
      // 1. إرجاع الـ 10 دينار باستخدام نظام السجلات
      const commission = Number(process.env.COMMISSION_AMOUNT || 10);
      await transactionService.refundCommission(report.technician, report._id, commission);
      
      // 2. استرجاع نقاط الموثوقية (5 نقاط)
      const profile = await TechnicianProfile.findOne({ user: report.technician });
      if (profile) {
        profile.reliabilityScore = Math.min(100, profile.reliabilityScore + 5);
        await profile.save();
      }
    }

    // إشعار الفني
    await notificationService.createNotification({
      recipientId: report.technician,
      title: 'تحديث حالة البلاغ',
      message: status === 'refunded' ? 'تم قبول بلاغك وإرجاع عمولة الطلب لنقاطك.' : 'نأسف، تم رفض طلب استرجاع العمولة.',
      type: 'system',
      relatedId: report._id
    });

    return report;
  }
}

module.exports = new ReportService();
