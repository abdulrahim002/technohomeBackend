import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, Briefcase, User } from 'lucide-react-native';

import TechnicianDashboard from '../../screens/main/technician/TechnicianDashboard';
import TechnicianJobDetails from '../../screens/main/technician/TechnicianJobDetails';
import TechnicianActiveJobs from '../../screens/main/technician/TechnicianActiveJobs';
import WalletHistoryScreen from '../../screens/main/technician/WalletHistoryScreen';
import ChatScreen from '../../screens/main/ChatScreen';
import ProfileScreen from '../../screens/main/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/**
 * Technician Tab Navigator
 */
const TabNavigator = () => (
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
        tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />
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

/**
 * Root Technician Navigator
 * Uses a Stack to hold the Tabs + specialized screens like Job Details.
 * This resolves the 'action not handled' error when navigating from across different tabs.
 */
export default function TechnicianTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
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
    </Stack.Navigator>
  );
}
