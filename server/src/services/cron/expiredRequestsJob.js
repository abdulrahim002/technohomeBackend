const cron = require('node-cron');
const ServiceRequest = require('../../models/ServiceRequest.model');
const TechnicianProfile = require('../../models/TechnicianProfile.model');
const notificationService = require('../notificationService');

/**
 * وظيفة مجدولة: معالجة الطلبات منتهية الصلاحية (Expired Requests)
 * 
 * تعمل كل ساعة للبحث عن طلبات Pending تجاوز موعدها المحدد.
 * 
 * الشروط:
 * 1. الطلب في حالة 'pending' ومعين لفني محدد.
 * 2. مرور 30 دقيقة على الأقل من إنشاء الطلب (حماية الفني من الطلبات اللحظية).
 * 3. انتهاء الفترة الزمنية (timeSlot) أو تجاوز التاريخ (scheduledDate).
 * 
 * الإجراءات:
 * - تحويل الحالة إلى 'expired'.
 * - خصم 5 نقاط من موثوقية الفني.
 * - تصفير سلسلة النجاح (consecutiveCompletedJobs).
 * - إشعار العميل بالاعتذار وتوجيهه لحجز بديل.
 * - إشعار الفني بالتنبيه العتابي.
 */

const RELIABILITY_PENALTY = 5;
const MINIMUM_AGE_MINUTES = 30;

/**
 * استخراج ساعة نهاية الفترة الزمنية من النص (مثال: '10:00-12:00' -> 12)
 */
const getSlotEndHour = (timeSlot) => {
  if (!timeSlot) return null;
  const parts = timeSlot.split('-');
  if (parts.length !== 2) return null;
  const endTime = parts[1].trim();
  const hour = parseInt(endTime.split(':')[0], 10);
  return isNaN(hour) ? null : hour;
};

/**
 * التحقق مما إذا كان الموعد قد انتهى فعلاً
 */
const isSlotExpired = (scheduledDate, timeSlot) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  // إذا كان التاريخ المجدول أقدم من اليوم -> منتهي قطعاً
  if (scheduledDate < todayStr) return true;

  // إذا كان التاريخ هو اليوم -> نتحقق من انتهاء ساعة الفترة الزمنية
  if (scheduledDate === todayStr) {
    const endHour = getSlotEndHour(timeSlot);
    if (endHour !== null && now.getHours() >= endHour) return true;
  }

  // التاريخ مستقبلي -> لم ينتهِ بعد
  return false;
};

/**
 * الوظيفة الرئيسية لمعالجة الطلبات المنتهية
 */
const processExpiredRequests = async () => {
  try {
    console.log('[CRON] ⏰ بدء فحص الطلبات منتهية الصلاحية...');

    const cutoffTime = new Date(Date.now() - MINIMUM_AGE_MINUTES * 60 * 1000);

    // جلب الطلبات المعلقة التي لها فني محدد وتاريخ مجدول وعمرها أكثر من 30 دقيقة
    const pendingRequests = await ServiceRequest.find({
      status: 'pending',
      technician: { $exists: true, $ne: null },
      scheduledDate: { $exists: true, $ne: null },
      timeSlot: { $exists: true, $ne: null },
      createdAt: { $lte: cutoffTime }
    });

    let expiredCount = 0;

    for (const request of pendingRequests) {
      // التحقق من أن الموعد قد انتهى فعلاً
      if (!isSlotExpired(request.scheduledDate, request.timeSlot)) continue;

      // --- تحويل الطلب إلى منتهي الصلاحية ---
      request.status = 'expired';
      request.cancelReason = 'no_response_from_technician';
      await request.save();
      expiredCount++;

      // --- معاقبة الفني ---
      const profile = await TechnicianProfile.findOne({ user: request.technician });
      if (profile) {
        profile.reliabilityScore = Math.max(0, profile.reliabilityScore - RELIABILITY_PENALTY);
        profile.consecutiveCompletedJobs = 0; // كسر سلسلة النجاح
        await profile.save();
      }

      // --- إشعار العميل ---
      await notificationService.createNotification({
        recipientId: request.customer,
        title: 'انتهت صلاحية طلبك',
        message: 'نعتذر منك بشدة، لم يتمكن الفني من الرد على طلبك في الوقت المحدد. اضغط هنا لإعادة جدولة طلبك أو اختيار فني آخر متوفر الآن.',
        type: 'expired_request',
        relatedId: request._id
      });

      // --- إشعار الفني (تنبيه عتابي) ---
      await notificationService.createNotification({
        recipientId: request.technician,
        title: 'تنبيه: طلب منتهي الصلاحية',
        message: `لقد انتهت صلاحية طلب صيانة دون ردك. تم خصم ${RELIABILITY_PENALTY} نقاط من رصيد الموثوقية. يرجى متابعة طلباتك بانتظام للحفاظ على تقييم حسابك.`,
        type: 'system',
        relatedId: request._id
      });

      console.log(`[CRON]  الطلب ${request._id} -> expired (فني: ${request.technician})`);
    }

    console.log(`[CRON] ✅ اكتمل الفحص: ${expiredCount} طلب(ات) تم تحويلها إلى منتهية الصلاحية من أصل ${pendingRequests.length} طلب معلق.`);
  } catch (error) {
    console.error('[CRON] ❌ خطأ في معالجة الطلبات المنتهية:', error);
  }
};

/**
 * تسجيل الوظيفة المجدولة (كل ساعة)
 */
const startExpiredRequestsJob = () => {
  // '0 * * * *' = في بداية كل ساعة (الدقيقة 0)
  cron.schedule('* * * * *', processExpiredRequests, {
    timezone: 'Africa/Tripoli'
  });

  console.log('[CRON] 🕐 تم تسجيل وظيفة فحص الطلبات المنتهية (كل ساعة)');
};

module.exports = { startExpiredRequestsJob, processExpiredRequests };
