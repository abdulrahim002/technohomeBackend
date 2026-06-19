import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Search, User, ClipboardList, Plus, LayoutGrid, MessageSquare } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../../screens/main/HomeScreen';
import CreateRequestScreen from '../../screens/main/CreateRequestScreen';
import DiagnosisResultScreen from '../../screens/main/DiagnosisResultScreen';
import TechnicianListScreen from '../../screens/main/TechnicianListScreen';
import BookingDetailsScreen from '../../screens/main/BookingDetailsScreen';
import ManualDiagnosisScreen from '../../screens/main/ManualDiagnosisScreen';
import ProfileScreen from '../../screens/main/profile/ProfileScreen';
import BookingsScreen from '../../screens/main/BookingsScreen';
import ChatScreen from '../../screens/main/ChatScreen';
import ConversationsScreen from '../../screens/main/ConversationsScreen';
import FinalBookingScreen from '../../screens/main/FinalBookingScreen';
import EditProfileScreen from '../../screens/main/profile/EditProfileScreen';
import SecurityScreen from '../../screens/main/profile/SecurityScreen';
import TechnicianProfileScreen from '../../screens/main/TechnicianProfileScreen';
import NotificationCenterScreen from '../../screens/main/NotificationCenterScreen';
import IconWithBadge from '../../components/common/IconWithBadge';
import api from '../../api/api';
import { getMyNotifications } from '../../api/notificationService';
import { onSocketEvent, offSocketEvent } from '../../services/SocketService';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Custom Center Action Button (+)
const AICenterButton = ({ children, onPress }) => {
  const insets = useSafeAreaInsets();
  return (
    <TouchableOpacity
      style={[styles.centerBtnContainer, { bottom: insets.bottom > 0 ? insets.bottom + 8 : 16 }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.centerBtn}>
        <Plus size={28} color="white" />
      </View>
    </TouchableOpacity>
  );
};

/**
 * Customer Tab Navigator
 */
const TabNavigator = () => {
  const [unreadChats, setUnreadChats] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);

  // جلب عدد المحادثات غير المقروءة وعدد الطلبات النشطة للعميل
  const fetchCounts = async () => {
    try {
      const chatRes = await api.get('/chat/conversations');
      if (chatRes.data?.status === 'success') {
        const totalChats = chatRes.data.data.conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
        setUnreadChats(totalChats);
      }
    } catch (e) {
      console.log('Error fetching chat count:', e.message);
    }

    try {
      // جلب طلبات العميل وحساب النشطة منها (أي التي لم تُكتمل أو تُلغَ)
      const ordersRes = await api.get('/service-requests/my-requests');
      if (ordersRes.data?.status === 'success') {
        const orders = ordersRes.data.data.requests || [];
        const activeCount = orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length;
        setActiveOrders(activeCount);
      }
    } catch (e) {
      console.log('Error fetching orders count:', e.message);
    }
  };

  useEffect(() => {
    fetchCounts();

    const handleSocketUpdate = () => {
      fetchCounts();
    };

    // الاستماع للتحديثات الفورية للرسائل والطلبات لزيادة العداد تلقائياً
    onSocketEvent('newMessage', handleSocketUpdate);
    onSocketEvent('chatRead', handleSocketUpdate);
    onSocketEvent('requestStatusUpdated', handleSocketUpdate); // تحديث حالة الطلب

    return () => {
      offSocketEvent('newMessage', handleSocketUpdate);
      offSocketEvent('chatRead', handleSocketUpdate);
      offSocketEvent('requestStatusUpdated', handleSocketUpdate);
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'الرئيسية',
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="BookingsTab" 
        component={BookingsScreen} 
        options={{
          tabBarLabel: 'طلباتي',
          tabBarIcon: ({ color, size }) => (
            <IconWithBadge 
              IconComponent={ClipboardList} 
              color={color} 
              size={size} 
              count={activeOrders}
            />
          )
        }}
        listeners={{
          tabPress: () => {
            // تصفير العلامة الحمراء فور الضغط على التبويب
            setActiveOrders(0);
          },
        }}
      />
      <Tab.Screen 
        name="AITab" 
        component={CreateRequestScreen} 
        options={{
          tabBarLabel: '', 
          tabBarButton: (props) => <AICenterButton {...props} />
        }}
      />
      <Tab.Screen 
        name="ChatsTab" 
        component={ConversationsScreen} 
        options={{
          tabBarLabel: 'المحادثات',
          tabBarIcon: ({ color, size }) => (
            <IconWithBadge 
              IconComponent={MessageSquare} 
              color={color} 
              size={size} 
              count={unreadChats} 
            />
          )
        }}
        listeners={{
          tabPress: () => {
            // تصفير عدد المحادثات غير المقروءة فور الضغط على التبويب
            setUnreadChats(0);
          },
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'حسابي',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  );
};


/**
 * Root Customer Navigator
 */
export default function CustomerTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="CustomerMain" 
        component={TabNavigator} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen name="CreateRequest" component={CreateRequestScreen} options={{ title: 'تشخيص ذكي AI' }} />
      <Stack.Screen name="DiagnosisResult" component={DiagnosisResultScreen} options={{ title: 'النتائج' }} />
      <Stack.Screen name="TechnicianList" component={TechnicianListScreen} options={{ title: 'اختر الفني' }} />
      <Stack.Screen name="TechnicianProfile" component={TechnicianProfileScreen} options={{ title: 'ملف الفني' }} />
      <Stack.Screen name="FinalBooking" component={FinalBookingScreen} options={{ title: 'تأكيد الموعد' }} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} options={{ title: 'تفاصيل الطلب' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Security" component={SecurityScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Conversations" component={ConversationsScreen} options={{ title: 'المحادثات' }} />
      <Stack.Screen name="ManualDiagnosis" component={ManualDiagnosisScreen} options={{ title: 'البحث بأكواد الخطأ' }} />
      <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} options={{ title: 'صندوق الإشعارات' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    elevation: 20,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  centerBtnContainer: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: Platform.OS === 'ios' ? 20 : 14,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { height: 6 },
    elevation: 10,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  }
});
