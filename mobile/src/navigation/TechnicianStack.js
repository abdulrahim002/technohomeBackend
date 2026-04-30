import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TechnicianDashboard from '../screens/main/technician/TechnicianDashboard';
import TechnicianJobDetails from '../screens/main/technician/TechnicianJobDetails';
import TechnicianActiveJobs from '../screens/main/technician/TechnicianActiveJobs';
import WalletHistoryScreen from '../screens/main/technician/WalletHistoryScreen';

const Stack = createNativeStackNavigator();

/**
 * حزمة شاشات الفني (TechnicianStack)
 * الدور: عرض الشاشات الخاصة بالفني فقط (لوحة التحكم، تفاصيل المهام، الخ).
 */
export default function TechnicianStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen 
        name="TechnicianDashboard" 
        component={TechnicianDashboard} 
        options={{ title: 'لوحة التحكم بالفني' }} 
      />
      <Stack.Screen 
        name="TechnicianJobDetails" 
        component={TechnicianJobDetails} 
        options={{ title: 'تفاصيل المهمة' }} 
      />
      <Stack.Screen 
        name="TechnicianActiveJobs" 
        component={TechnicianActiveJobs} 
        options={{ title: 'المهام النشطة' }} 
      />
      <Stack.Screen 
        name="WalletHistory" 
        component={WalletHistoryScreen} 
        options={{ title: 'سجل المحفظة' }} 
      />
    </Stack.Navigator>
  );
}
