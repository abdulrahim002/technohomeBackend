import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/main/HomeScreen';
import CreateRequestScreen from '../screens/main/CreateRequestScreen';
import DiagnosisResultScreen from '../screens/main/DiagnosisResultScreen';
import TechnicianListScreen from '../screens/main/TechnicianListScreen';
import BookingDetailsScreen from '../screens/main/BookingDetailsScreen';
import ManualDiagnosisScreen from '../screens/main/ManualDiagnosisScreen';

const Stack = createNativeStackNavigator();

/**
 * حزمة شاشات التطبيق الأساسية (MainStack)
 */
export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'طلباتي' }} 
      />
      <Stack.Screen 
        name="CreateRequest" 
        component={CreateRequestScreen} 
        options={{ title: 'طلب صيانة جديد' }} 
      />
      <Stack.Screen 
        name="DiagnosisResult" 
        component={DiagnosisResultScreen} 
        options={{ title: 'تشخيص الذكاء الاصطناعي' }} 
      />
      <Stack.Screen 
        name="TechnicianList" 
        component={TechnicianListScreen} 
        options={{ title: 'اختر الفني' }} 
      />
      <Stack.Screen 
        name="BookingDetails" 
        component={BookingDetailsScreen} 
        options={{ title: 'تفاصيل الحجز' }} 
      />
      <Stack.Screen 
        name="ManualDiagnosis" 
        component={ManualDiagnosisScreen} 
        options={{ title: 'تشخيص يدوي' }}   
      />
    </Stack.Navigator>
  );
}
