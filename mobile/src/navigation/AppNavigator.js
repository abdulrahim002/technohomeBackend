import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { connectSocket, disconnectSocket } from '../services/SocketService';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import api from '../api/api';

// Import New Tab Navigators
import AuthStack from './AuthStack';
import CustomerTabs from './tabs/CustomerTabs';
import TechnicianTabs from './tabs/TechnicianTabs';
import PendingApprovalScreen from '../screens/auth/PendingApprovalScreen';

// تصدير مرجع التنقل العالمي
export const navigationRef = createNavigationContainerRef();

/**
 * AppNavigator - The Root Controller.
 * Switches between Auth flow and Tab-based Main flows based on user role and session.
 */
export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const syncLocation = async () => {
      try {
        if (!user || !user._id) return;
        
        // 1. طلب إذن الموقع
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log(' [Location Sync] Permission denied');
          return;
        }

        // 2. جلب الموقع الحالي
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // 3. إرسال الموقع للسيرفر
        await api.patch('/users/location', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        console.log(` [Location Sync] Updated successfully for user: ${user._id}`);
      } catch (error) {
        console.log(' [Location Sync] Error updating location:', error.message);
      }
    };

    if (user && user._id) {
      connectSocket(user._id);
      syncLocation();
    }
    
    return () => {
      disconnectSocket();
    };
  }, [user]);

  // الاستماع للضغط على الإشعار وتوجيه المستخدم
  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(' [DEBUG] Notification Clicked in AppNavigator:', response);
      
      const data = response?.notification?.request?.content?.data;
      if (!data || !user) return;

      // التأكد من جاهزية نظام التنقل لتفادي أي انهيار (Cold Start)
      if (!navigationRef.isReady()) {
        console.log(' [DEBUG] Navigation is not ready yet');
        return;
      }

      // نمط توجيه نظيف ومباشر (Routing Switch)
      switch (data.type) {
        case 'chat':
          navigationRef.navigate('Chat', {
            requestId: data.serviceRequest || null,
            chatRoomId: data.chatRoomId || null,
            recipientId: data.senderId,
            recipientName: data.senderName,
            unifiedByUser: false
          });
          break;

        case 'order_update':
          if (user.role === 'technician') {
            navigationRef.navigate('TechnicianJobDetails', {
              orderId: data.orderId
            });
          } else {
            navigationRef.navigate('BookingDetails', {
              bookingId: data.orderId
            });
          }
          break;

        default:
          console.log(' [DEBUG] Informational notification, no navigation needed');
          break;
      }
    });

    return () => {
      if (responseListener?.remove) {
        responseListener.remove();
      }
    };
  }, [user]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {!user ? (
        <AuthStack />
      ) : user.role === 'technician' ? (
        !user.isVerified ? (
          <PendingApprovalScreen />
        ) : (
          <TechnicianTabs />
        )
      ) : (
        <CustomerTabs />
      )}
    </NavigationContainer>
  );
}
