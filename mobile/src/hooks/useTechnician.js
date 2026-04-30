import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as technicianService from '../api/technicianService';

/**
 * useTechnician Hook - Logic and state management for the Technician Cockpit.
 */
export const useTechnician = () => {
  const { user, signOut } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const result = await technicianService.getTechnicianProfile();
    if (result.success) {
      setProfile(result.data);
      setIsOnline(result.data.isAvailable);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير كابتن ☀️';
    if (hour < 18) return 'مساء الخير كابتن ☕';
    return 'طاب مساؤك كابتن 🌙';
  }, []);

  const toggleOnline = useCallback(async () => {
    const nextStatus = !isOnline;
    // تحديث متفائل (Optimistic UI)
    setIsOnline(nextStatus);
    
    const result = await technicianService.toggleAvailability(nextStatus);
    if (!result.success) {
      // إرجاع الحالة إذا فشل الطلب
      setIsOnline(!nextStatus);
      alert(result.message);
    }
  }, [isOnline]);

  const stats = useMemo(() => ({
    walletBalance: profile?.user?.walletBalance || 0,
    reliabilityScore: profile?.reliabilityScore || 0,
    overallRating: profile?.rating || 0,
    reviewCount: profile?.reviewCount || 0,
    isVerified: profile?.isVerified || false
  }), [profile]);

  return {
    user,
    signOut,
    isOnline,
    toggleOnline,
    greeting: getGreeting(),
    stats,
    loading,
    refresh: fetchProfile
  };
};
