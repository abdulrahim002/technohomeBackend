const cron = require('node-cron');
const ServiceRequest = require('../../models/ServiceRequest.model');
const notificationService = require('../notificationService');

/**
 * دالة استخراج ساعة بداية الفترة الزمنية (مثال: '14:00-16:00' -> 14)
 */
const getSlotStartHour = (timeSlot) => {
  if (!timeSlot) return null;
  const parts = timeSlot.split('-');
  if (parts.length === 0) return null;
  const startTime = parts[0].trim();
  const hour = parseInt(startTime.split(':')[0], 10);
  return isNaN(hour) ? null : hour;
};

/**
 * وظيفة مجدولة: إرسال تنبيهات تذكيرية قبل الموعد بساعتين
 */
const processReminders = async () => {
  try {
    console.log('[CRON] ⏰ بدء فحص المواعيد لإرسال التذكيرات...');

    // الحصول على تاريخ اليوم بتوقيت طرابلس/ليبيا
    const getLibyaDate = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Tripoli',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      });
      const parts = formatter.formatToParts(now);
      const get = (type) => parts.find(p => p.type === type)?.value || '0';
      const todayDate = `${get('year')}-${get('month')}-${get('day')}`;
      const currentHour = parseInt(get('hour'), 10);
      return { todayDate, currentHour };
    };

    const { todayDate, currentHour } = getLibyaDate();

    // جلب الطلبات المقبولة المجدولة لتاريخ اليوم ولم يتم إرسال تذكير لها بعد
    const upcomingRequests = await ServiceRequest.find({
      status: 'accepted',
      scheduledDate: todayDate,
      reminderSent: { $ne: true }
    }).populate('customer technician');

    let sentCount = 0;

    for (const request of upcomingRequests) {
      const startHour = getSlotStartHour(request.timeSlot);
      if (startHour === null) continue;

      // حساب الفارق الزمني بالساعات
      const hoursUntilAppointment = startHour - currentHour;

      // إرسال التذكير إذا كان الموعد متبقي عليه ساعتين أو أقل ومستقبلي
      if (hoursUntilAppointment <= 2 && hoursUntilAppointment >= 0) {
        // إشعار العميل
        await notificationService.createNotification({
          recipientId: request.customer._id,
          title: 'تذكير بالموعد القريب ⏰',
          message: `نود تذكيرك بموعد صيانة جهازك اليوم في الفترة (${request.timeSlot}). الفني يستعد للوصول إليك.`,
          type: 'order',
          relatedId: request._id
        }).catch(err => console.error('[CRON_REMINDER] Client notify error:', err.message));

        // إشعار الفني
        await notificationService.createNotification({
          recipientId: request.technician._id,
          title: 'تذكير بمهمة قادمة 🛠️',
          message: `لديك مهمة صيانة مجدولة بعد قليل اليوم في الفترة (${request.timeSlot}). يرجى الاستعداد للتحرك للموقع.`,
          type: 'order',
          relatedId: request._id
        }).catch(err => console.error('[CRON_REMINDER] Tech notify error:', err.message));

        // وضع علامة بأنه تم التنبيه لمنع التكرار
        request.reminderSent = true;
        await request.save();
        sentCount++;
        console.log(`[CRON_REMINDER] Sent reminder for request: ${request._id}`);
      }
    }

    console.log(`[CRON_REMINDER] ✅ تم إرسال ${sentCount} تذكير(ات) للمواعيد القادمة.`);
  } catch (error) {
    console.error('[CRON] ❌ خطأ في معالجة إرسال التذكيرات للمواعيد:', error);
  }
};

/**
 * تسجيل الوظيفة المجدولة للتذكير (تعمل كل ساعة)
 */
const startReminderJob = () => {
  // '* * * * *' = كل دقيقة للاختبار الفوري
  cron.schedule('* * * * *', processReminders, {
    timezone: 'Africa/Tripoli'
  });

  console.log('[CRON] 🕐 تم تسجيل وظيفة إرسال التذكيرات للمواعيد (كل ساعة)');
};

module.exports = { startReminderJob, processReminders };
