const ServiceRequest = require('../../models/ServiceRequest.model');
const ApplianceType = require('../../models/ApplianceType.model');
const notificationService = require('../notificationService');

class SchedulingValidator {
  /**
   * الحالات التي تمثل التزاماً مؤكداً بالمواعيد وتمنع أي تداخل
   */
  static get ACTIVE_STATUSES() {
    return ['accepted', 'on_the_way', 'arrived', 'in_progress'];
  }

  /**
   * التحقق من انشغال الفني في توقيت معين (مع استبعاد طلب محدد عند التحديث)
   */
  async isTechnicianBusy(technicianId, scheduledDate, timeSlot, excludeRequestId = null) {
    if (!technicianId || !scheduledDate || !timeSlot) return false;

    const query = {
      technician: technicianId,
      scheduledDate,
      timeSlot,
      status: { $in: SchedulingValidator.ACTIVE_STATUSES }
    };

    if (excludeRequestId) {
      query._id = { $ne: excludeRequestId };
    }

    const collision = await ServiceRequest.findOne(query).lean();
    return !!collision;
  }

  /**
   * التحقق من وجود حجز نشط للعميل في توقيت معين
   */
  async isCustomerBusy(customerId, scheduledDate, timeSlot, excludeRequestId = null) {
    if (!customerId || !scheduledDate || !timeSlot) return false;

    const query = {
      customer: customerId,
      scheduledDate,
      timeSlot,
      status: { $in: SchedulingValidator.ACTIVE_STATUSES }
    };

    if (excludeRequestId) {
      query._id = { $ne: excludeRequestId };
    }

    const collision = await ServiceRequest.findOne(query).lean();
    return !!collision;
  }

  /**
   * التحقق من وجود طلب معلق بالفعل لنفس الفني في نفس اليوم لتفادي التكرار والسبام
   */
  async hasDuplicatePendingRequest(customerId, technicianId, scheduledDate) {
    if (!technicianId || !scheduledDate) return false;

    const collision = await ServiceRequest.findOne({
      customer: customerId,
      technician: technicianId,
      scheduledDate,
      status: 'pending'
    }).lean();

    return !!collision;
  }

  /**
   * التحقق مما إذا كان العميل يمتلك بالفعل حجزاً مؤكداً ونشطاً مع هذا الفني في نفس اليوم
   */
  async hasActiveBookingOnSameDay(customerId, technicianId, scheduledDate) {
    if (!technicianId || !scheduledDate) return false;

    const activeBooking = await ServiceRequest.findOne({
      customer: customerId,
      technician: technicianId,
      scheduledDate,
      status: { $in: ['accepted', 'on_the_way', 'arrived', 'in_progress'] }
    }).lean();

    return !!activeBooking;
  }

  /**
   * حل وتسوية التعارضات تلقائياً عند قبول طلب صيانة مع إرسال الإشعارات السياقية المخصصة
   */
  async autoRejectConflictingRequests(acceptedRequest) {
    const { _id, customer, technician, scheduledDate, timeSlot, applianceType } = acceptedRequest;

    // جلب اسم الجهاز لاستخدامه في نص الإشعار بشكل مخصص وودود
    let applianceName = 'جهازك';
    try {
      const typeDoc = await ApplianceType.findById(applianceType);
      if (typeDoc) applianceName = typeDoc.nameAr;
    } catch (e) {
      console.warn('[SCHEDULING_VALIDATOR] Failed to fetch appliance name:', e.message);
    }

    // =============================================================
    // المسار الأول: إلغاء ورفض طلبات العملاء الآخرين المقدمة لنفس الفني في هذا التوقيت
    // =============================================================
    const otherCustomerRequests = await ServiceRequest.find({
      _id: { $ne: _id },
      technician,
      scheduledDate,
      timeSlot,
      status: 'pending'
    }).lean();

    if (otherCustomerRequests.length > 0) {
      const requestIds = otherCustomerRequests.map(r => r._id);

      await ServiceRequest.updateMany(
        { _id: { $in: requestIds } },
        {
          $set: {
            status: 'rejected',
            cancelReason: 'rejected_by_technician',
            technicianNotes: 'تم رفض الموعد تلقائياً لتضاربه مع حجز مقبول آخر للفني.'
          }
        }
      );

      // إرسال إشعار لطيف لكل عميل
      for (const req of otherCustomerRequests) {
        notificationService.createNotification({
          recipientId: req.customer,
          title: 'تحديث موعد الصيانة ⏰',
          message: `عذراً، الفني ملتزم بطلب صيانة مؤكد آخر في هذا الوقت. تم إلغاء طلب صيانة (${applianceName}) تلقائياً. يرجى اختيار موعد آخر أو فني آخر متاح.`,
          type: 'system',
          relatedId: req._id
        }).catch(err => console.error('[CONFLICT_NOTIF_ERR] Customer notify error:', err.message));
      }
    }

    // =============================================================
    // المسار الثاني: إلغاء طلبات نفس العميل المقدمة لفنيين آخرين في نفس التوقيت
    // =============================================================
    const otherTechnicianRequests = await ServiceRequest.find({
      _id: { $ne: _id },
      customer,
      scheduledDate,
      timeSlot,
      status: 'pending'
    }).lean();

    if (otherTechnicianRequests.length > 0) {
      const requestIds = otherTechnicianRequests.map(r => r._id);

      await ServiceRequest.updateMany(
        { _id: { $in: requestIds } },
        {
          $set: {
            status: 'cancelled',
            cancelReason: 'customer_cancelled',
            technicianNotes: 'تم إلغاء الموعد تلقائياً لتأكيد العميل حجزاً آخراً في نفس الفترة الزمنية.'
          }
        }
      );

      // إرسال إشعار لطيف لكل فني آخر
      for (const req of otherTechnicianRequests) {
        if (req.technician) {
          notificationService.createNotification({
            recipientId: req.technician,
            title: 'تحديث حول طلب صيانة 🛠️',
            message: `نشكر وقتك؛ تم إلغاء طلب صيانة (${applianceName}) لتعارض جدول العميل مع حجز مقبول آخر لديه في نفس الوقت.`,
            type: 'system',
            relatedId: req._id
          }).catch(err => console.error('[CONFLICT_NOTIF_ERR] Technician notify error:', err.message));
        }
      }
    }
  }
}

module.exports = new SchedulingValidator();
