import React, { useEffect, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';
import { Wrench } from 'lucide-react-native';
import { connectSocket, disconnectSocket } from '../services/SocketService';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

// Import New Tab Navigators
import AuthStack from './AuthStack';
import CustomerTabs from './tabs/CustomerTabs';
import TechnicianTabs from './tabs/TechnicianTabs';
import PendingApprovalScreen from '../screens/auth/PendingApprovalScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

// تصدير مرجع التنقل العالمي
export const navigationRef = createNavigationContainerRef();

/**
 * AppNavigator - The Root Controller.
 * Switches between Auth flow and Tab-based Main flows based on user role and session.
 */
export default function AppNavigator() {
  const { user, isLoading } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('isFirstLaunch')
      .then(value => {
        if (value === null) {
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(value === 'true');
        }
      })
      .catch(() => {
        setIsFirstLaunch(false);
      });
  }, []);

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

  if (isLoading || isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        {/* شعار التطبيق الفخم */}
        <View style={{ 
          width: 90, 
          height: 90, 
          borderRadius: 28, 
          backgroundColor: '#EEF2FF', 
          justifyContent: 'center', 
          alignItems: 'center',
          marginBottom: 20,
          shadowColor: '#4F46E5',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 4
        }}>
          <Wrench size={42} color="#4F46E5" />
        </View>
        
        {/* اسم الهوية التجارية */}
        <Text style={{ fontSize: 26, fontWeight: '900', color: '#0F172A', marginBottom: 6 }}>
          Techno<Text style={{ color: '#4F46E5' }}>Home</Text>
        </Text>
        
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 40 }}>
          منصة الصيانة الذكية والأسرع
        </Text>

        <ActivityIndicator size="small" color="#4F46E5" />
      </View>
    );
  }

  if (isFirstLaunch) {
    return (
      <OnboardingScreen onComplete={() => setIsFirstLaunch(false)} />
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
