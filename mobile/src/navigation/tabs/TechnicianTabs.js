import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, Briefcase, User, History, MessageSquare } from 'lucide-react-native';

import TechnicianDashboard from '../../screens/main/technician/TechnicianDashboard';
import TechnicianJobDetails from '../../screens/main/technician/TechnicianJobDetails';
import TechnicianActiveJobs from '../../screens/main/technician/TechnicianActiveJobs';
import TechnicianHistoryScreen from '../../screens/main/technician/TechnicianHistoryScreen';
import WalletHistoryScreen from '../../screens/main/technician/WalletHistoryScreen';
import ChatScreen from '../../screens/main/ChatScreen';
import ProfileScreen from '../../screens/main/profile/ProfileScreen';
import ConversationsScreen from '../../screens/main/ConversationsScreen';
import EditProfileScreen from '../../screens/main/profile/EditProfileScreen';
import SecurityScreen from '../../screens/main/profile/SecurityScreen';
import NotificationCenterScreen from '../../screens/main/NotificationCenterScreen';
import IconWithBadge from '../../components/common/IconWithBadge';
import api from '../../api/api';
import { onSocketEvent, offSocketEvent } from '../../services/SocketService';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/**
 * Technician Tab Navigator - Stateful للدعم الديناميكي للشارات الحمراء
 */
const TabNavigator = () => {
  const [unreadChats, setUnreadChats] = useState(0);
  const [pendingJobs, setPendingJobs] = useState(0);

  // جلب عدد المهام المعلقة (pending) وعدد الرسائل غير المقروءة معاً
  const fetchCounts = async () => {
    try {
      // جلب المحادثات غير المقروءة
      const chatRes = await api.get('/chat/conversations');
      if (chatRes.data?.status === 'success') {
        const total = chatRes.data.data.conversations.reduce(
          (acc, conv) => acc + (conv.unreadCount || 0), 0
        );
        setUnreadChats(total);
      }
    } catch (e) {
      console.log('[TechnicianTabs] Error fetching chat count:', e.message);
    }

    try {
      // جلب المهام النشطة وحساب الطلبات الجديدة (pending) التي تحتاج رداً من الفني
      const jobRes = await api.get('/service-requests/technician/active');
      if (jobRes.data?.status === 'success') {
        const jobs = jobRes.data.data.requests || [];
        const pendingCount = jobs.filter(j => j.status === 'pending').length;
        setPendingJobs(pendingCount);
      }
    } catch (e) {
      console.log('[TechnicianTabs] Error fetching jobs count:', e.message);
    }
  };

  useEffect(() => {
    fetchCounts();

    const handleUpdate = () => fetchCounts();

    // الاستماع لأحداث Socket للتحديث الفوري
    onSocketEvent('newMessage', handleUpdate);
    onSocketEvent('chatRead', handleUpdate);
    onSocketEvent('newOrderNotification', handleUpdate); // طلب جديد وصل للفني

    return () => {
      offSocketEvent('newMessage', handleUpdate);
      offSocketEvent('chatRead', handleUpdate);
      offSocketEvent('newOrderNotification', handleUpdate);
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
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
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          marginTop: 2,
        }
      }}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={TechnicianDashboard} 
        options={{
          tabBarLabel: 'الرئيسية',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="JobsTab" 
        component={TechnicianActiveJobs} 
        options={{
          tabBarLabel: 'مهامي',
          tabBarIcon: ({ color, size }) => (
            <IconWithBadge 
              IconComponent={Briefcase} 
              color={color} 
              size={size} 
              count={pendingJobs}
            />
          )
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
      />
      <Tab.Screen 
        name="HistoryTab" 
        component={TechnicianHistoryScreen} 
        options={{
          tabBarLabel: 'سجلي',
          tabBarIcon: ({ color, size }) => <History size={size} color={color} />
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


export default function TechnicianTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="TechMain" 
        component={TabNavigator} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="TechnicianJobDetails" 
        component={TechnicianJobDetails} 
        options={{ title: 'تفاصيل المهمة' }} 
      />
      <Stack.Screen 
        name="WalletHistory" 
        component={WalletHistoryScreen} 
        options={{ title: 'سجل المحفظة' }} 
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Conversations" 
        component={ConversationsScreen} 
        options={{ title: 'المحادثات' }} 
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Security" 
        component={SecurityScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="NotificationCenter" 
        component={NotificationCenterScreen} 
        options={{ title: 'صندوق الإشعارات' }} 
      />
    </Stack.Navigator>
  );
}
