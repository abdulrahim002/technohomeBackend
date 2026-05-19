import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import api from '../api/api';

// إعداد كيفية ظهور الإشعارات عندما يكون التطبيق مفتوحاً (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * تسجيل الجهاز للحصول على Expo Push Token
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('فشل', 'فشل الحصول على تصريح الإشعارات!');
      return;
    }
    
    // الحصول على التوكن الخاص بـ Expo
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
      
      if (!projectId) {
        console.warn(' [WARN] Project ID not found in app.json. Remote push notifications will not work.');
        console.warn(' [HELP] To fix this, run: npx eas project:init');
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log(' [DEBUG] Expo Push Token:', token);
    } catch (e) {
      console.log(' [ERROR] Error getting push token (Handled):', e.message);
    }
  } else {
    console.log(' [DEBUG] Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * وظيفة لاختبار إشعار محلي فوراً
 */
export async function sendLocalTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "اختبار إشعار محلي 🔔",
      body: 'إذا رأيت هذا، فهذا يعني أن إعدادات الإشعارات في التطبيق تعمل بنجاح!',
      data: { test: 'data' },
    },
    trigger: null,
  });
}

/**
 * حفظ التوكن في السيرفر
 */
export async function savePushTokenToServer(token) {
  if (!token) return;
  try {
    await api.patch('/users/expo-push-token', { token });
    console.log(' [DEBUG] Push Token saved to server');
  } catch (error) {
    console.log(' [ERROR] Failed to save push token to server (Handled):', error.response?.data || error.message);
  }
}
