const { Expo } = require('expo-server-sdk');

// إنشاء نسخة جديدة من Expo SDK
const expo = new Expo();

/**
 * إرسال إشعار دفع لجهاز واحد عبر Expo
 */
exports.sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  // التحقق من صحة التوكن
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error(`Push token ${expoPushToken} is not a valid Expo push token`);
    return;
  }

  // بناء الرسالة
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
    priority: 'high',
    channelId: 'default', // مهم للأندرويد
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];
    
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending chunk to Expo:', error);
      }
    }
    
    console.log('[EXPO PUSH] Sent successfully:', tickets);
    return tickets;
  } catch (error) {
    console.error('[EXPO PUSH] Fatal Error:', error);
  }
};

/**
 * إرسال إشعار لمجموعة من المستخدمين
 */
exports.sendMulticastNotification = async (tokens, title, body, data = {}) => {
  const messages = [];
  for (const pushToken of tokens) {
    if (!Expo.isExpoPushToken(pushToken)) continue;
    
    messages.push({
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    });
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending multicast chunk to Expo:', error);
    }
  }
  
  return tickets;
};
