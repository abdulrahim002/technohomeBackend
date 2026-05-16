import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi } from '../api/authService';
import api from '../api/api';
import useAuthStore from '../store/useAuthStore';
import { registerForPushNotificationsAsync, savePushTokenToServer } from '../services/NotificationService';

const AuthContext = createContext({});

/**
 * AuthProvider - Managing Auth via Context & Syncing with Zustand Store.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setAuth, logout: clearZustand } = useAuthStore();

  // Unified logout function
  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      setUser(null);
      clearZustand();
    } catch (e) {
      console.error('Logout error:', e);
    }
  }, [clearZustand]);

  const signIn = async (phone, password) => {
    const result = await loginApi(phone, password);
    if (result.success) {
      const storedToken = await AsyncStorage.getItem('userToken');
      const userData = {
        ...result.user,
        // تفضيل حالة التوثيق من بروفايل الفني إذا وجد، وإلا من المستخدم
        isVerified: result.techProfile ? result.techProfile.isVerified : result.user.isVerified
      };
      setUser(userData);
      setAuth(storedToken, userData);
      
      // تسجيل الإشعارات بعد تسجيل الدخول
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) await savePushTokenToServer(pushToken);
    }
    return result;
  };

  const refreshProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        const { user: freshUser, techProfile } = response.data.data;
        const storedToken = await AsyncStorage.getItem('userToken');
        
        const userData = {
          ...freshUser,
          isVerified: techProfile ? techProfile.isVerified : freshUser.isVerified
        };

        setUser(userData);
        setAuth(storedToken, userData);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        return true;
      }
    } catch (err) {
      console.log('Profile refresh failed:', err.message);
    }
    return false;
  }, [setAuth]);

  // Load storage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');
        
        if (storedToken) {
          // 1. Initial state from storage
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setAuth(storedToken, parsedUser);
          }

          // 2. Fetch fresh data from server
          try {
            const response = await api.get('/auth/me');
            if (response.data.success) {
              const { user: freshUser, techProfile } = response.data.data;
              const userData = {
                ...freshUser,
                isVerified: techProfile ? techProfile.isVerified : freshUser.isVerified
              };
              setUser(userData);
              setAuth(storedToken, userData);
              await AsyncStorage.setItem('userData', JSON.stringify(userData));

              // مزامنة توكن الإشعارات
              const pushToken = await registerForPushNotificationsAsync();
              if (pushToken) await savePushTokenToServer(pushToken);
            }
          } catch (err) {
            console.log('Session validation failed:', err.message);
            // If server returns 401 (Unauthorized), force logout
            if (err.response?.status === 401) {
              await signOut();
            }
          }
        }
      } catch (e) {
        console.error('Auth initialization error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [setAuth, signOut]);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
