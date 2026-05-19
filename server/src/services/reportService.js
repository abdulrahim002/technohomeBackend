const Report = require('../models/Report.model');
const User = require('../models/User.model');
const TechnicianProfile = require('../models/TechnicianProfile.model');
const notificationService = require('./notificationService');
const transactionService = require('./transactionService');

class ReportService {
  /**
   * تقديم بلاغ جديد (سواء صيانة أو شات)
   */
  async submitReport({ reporterId, reportedId, source, serviceRequestId, chatRoomId, category, description, attachment }) {
    const reportData = {
      reporter: reporterId,
      reported: reportedId,
      source,
      category,
      description
    };

    if (source === 'booking') {
      reportData.serviceRequest = serviceRequestId;
    } else if (source === 'chat') {
      reportData.chatRoomId = chatRoomId;
    }

    if (attachment) {
      reportData.attachment = attachment;
    }

    const report = await Report.create(reportData);
    
    // إشعار الإدارة
    await notificationService.notifyAdmins({
      senderId: reporterId,
      title: source === 'chat' ? 'بلاغ محادثة جديد 💬' : 'بلاغ صيانة جديد 🛠️',
      message: `تم رفع بلاغ جديد يخص ${source === 'chat' ? 'محادثة شات' : 'طلب صيانة'}.`,
      relatedId: report._id
    });

    return report;
  }

  /**
   * معالجة البلاغ من قبل الإدارة بضغطة زر
   */
  async resolveReport(reportId, { adminNotes, action }) {
    const report = await Report.findById(reportId);
    if (!report) throw { status: 404, message: 'البلاغ غير موجود' };
    
    if (report.status !== 'pending') {
      throw { status: 400, message: 'تم التعامل مع هذا البلاغ مسبقاً' };
    }

    report.status = 'resolved';
    report.adminNotes = adminNotes || '';
    report.resolvedAt = new Date();
    await report.save();

    // 1. إجراء رد العمولة للفني يدوياً
    if (action === 'refund_commission' && report.source === 'booking') {
      const ServiceRequest = require('../models/ServiceRequest.model');
      const reqDetails = await ServiceRequest.findById(report.serviceRequest);
      
      if (reqDetails && reqDetails.technician) {
        const techId = reqDetails.technician;
        const commission = Number(process.env.COMMISSION_AMOUNT || 10);
        await transactionService.refundCommission(techId, report._id, commission);
        
        // إرجاع نقاط الموثوقية للفني كدعم إضافي
        const profile = await TechnicianProfile.findOne({ user: techId });
        if (profile) {
          profile.reliabilityScore = Math.min(100, profile.reliabilityScore + 5);
          await profile.save();
        }

        // إرسال إشعار فوري للفني
        await notificationService.createNotification({
          recipientId: techId,
          title: 'إرجاع عمولة الطلب 💰',
          message: 'تم قبول البلاغ وإعادة عمولة الطلب المخصومة ونقاط الموثوقية لمحفظتك بنجاح.',
          type: 'system',
          relatedId: report._id
        });
      }
    } 
    
    // 2. إجراء تقييد حساب المشتكى عليه فوراً
    else if (action === 'restrict_reported') {
      const user = await User.findById(report.reported);
      if (user) {
        user.isActive = false;
        await user.save();
      }
    }

    return report;
  }

  /**
   * جلب كافة البلاغات مع البيانات التفصيلية للأطراف المعنية للأدمن
   */
  async getReports({ status, category }) {
    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    return await Report.find(query)
      .populate('reporter', 'firstName lastName phone role')
      .populate('reported', 'firstName lastName phone role isActive')
      .populate({
         path: 'serviceRequest',
         populate: { path: 'applianceType', select: 'nameAr' }
      })
      .sort({ createdAt: -1 })
      .lean();
  }
}

module.exports = new ReportService();
