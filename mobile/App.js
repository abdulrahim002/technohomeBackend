import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from './src/services/NotificationService';

/**
 * Techno Home - Main Application Entry Point
 */
export default function App() {
  React.useEffect(() => {
    // تسجيل الإشعارات عند بدء التطبيق
    registerForPushNotificationsAsync();

    // الاستماع للإشعارات أثناء فتح التطبيق
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log(' [DEBUG] Notification Received:', notification);
    });

    // الاستماع للضغط على الإشعار
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(' [DEBUG] Notification Clicked:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
