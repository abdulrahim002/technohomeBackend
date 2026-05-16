import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { connectSocket, disconnectSocket } from '../services/SocketService';

// Import New Tab Navigators
import AuthStack from './AuthStack';
import CustomerTabs from './tabs/CustomerTabs';
import TechnicianTabs from './tabs/TechnicianTabs';
import PendingApprovalScreen from '../screens/auth/PendingApprovalScreen';

/**
 * AppNavigator - The Root Controller.
 * Switches between Auth flow and Tab-based Main flows based on user role and session.
 */
export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (user && user._id) {
      connectSocket(user._id);
    }
    
    return () => {
      disconnectSocket();
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
    <NavigationContainer>
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
