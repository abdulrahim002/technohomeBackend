import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Search, User, ClipboardList, Plus, Bell, LayoutGrid } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../../screens/main/HomeScreen';
import CreateRequestScreen from '../../screens/main/CreateRequestScreen';
import DiagnosisResultScreen from '../../screens/main/DiagnosisResultScreen';
import TechnicianListScreen from '../../screens/main/TechnicianListScreen';
import BookingDetailsScreen from '../../screens/main/BookingDetailsScreen';
import ManualDiagnosisScreen from '../../screens/main/ManualDiagnosisScreen';
import ProfileScreen from '../../screens/main/profile/ProfileScreen';
import BookingsScreen from '../../screens/main/bookings/BookingsScreen';
import ChatScreen from '../../screens/main/ChatScreen';
import FinalBookingScreen from '../../screens/main/FinalBookingScreen';
import EditProfileScreen from '../../screens/main/profile/EditProfileScreen';
import SecurityScreen from '../../screens/main/profile/SecurityScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Header Notification Icon Component
const HeaderRight = () => (
  <TouchableOpacity style={styles.headerIcon} onPress={() => {}}>
    <View style={styles.badge} />
    <Bell size={22} color="#1E293B" />
  </TouchableOpacity>
);

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
 * Minimalist structure — each tab points to its main screen.
 */
const TabNavigator = () => (
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
        tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />
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
      name="ManualTab" 
      component={ManualDiagnosisScreen} 
      options={{
        tabBarLabel: 'كود عطل',
        tabBarIcon: ({ color, size }) => <Search size={size} color={color} />
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
 * Root Customer Navigator
 * Holds the TabNavigator + All screens that need to be accessible from any tab
 */
export default function CustomerTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen 
        name="CustomerMain" 
        component={TabNavigator} 
        options={{ headerShown: false }} 
      />
      {/* Shared Screens accessible from any Tab */}
      <Stack.Screen name="CreateRequest" component={CreateRequestScreen} options={{ title: 'تشخيص ذكي AI' }} />
      <Stack.Screen name="DiagnosisResult" component={DiagnosisResultScreen} options={{ title: 'النتائج' }} />
      <Stack.Screen name="TechnicianList" component={TechnicianListScreen} options={{ title: 'اختر الفني' }} />
      <Stack.Screen name="FinalBooking" component={FinalBookingScreen} options={{ title: 'تأكيد الموعد' }} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} options={{ title: 'تفاصيل الطلب' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Security" component={SecurityScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
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
  },
  headerIcon: {
    marginRight: 15,
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    zIndex: 1,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  }
});
