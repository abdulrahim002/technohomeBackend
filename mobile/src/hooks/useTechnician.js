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

  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const result = await technicianService.getTechnicianProfile();
    if (result.success) {
      setProfile(result.data);
      setIsOnline(result.data.isAvailable);
    }
    // جلب عدد المهام النشطة والمكتملة
    const activeResult = await technicianService.getActiveJobs();
    if (activeResult.success) {
      // التأكد من جلب الرقم الصحيح: إما من حقل count أو من طول المصفوفة مباشرة
      const count = activeResult.data.count !== undefined 
        ? activeResult.data.count 
        : (activeResult.data.requests?.length || 0);
      
      console.log(`[DEBUG] Active Jobs Count: ${count}`);
      setActiveCount(count);
    }
    const historyResult = await technicianService.getJobHistory();
    if (historyResult.success) {
      const completed = (historyResult.data.requests || []).filter(r => r.status === 'completed');
      setCompletedCount(completed.length);
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
    setIsOnline(nextStatus);
    
    const result = await technicianService.toggleAvailability(nextStatus);
    if (!result.success) {
      setIsOnline(!nextStatus);
      alert(result.message);
    }
  }, [isOnline]);

  const stats = useMemo(() => ({
    walletBalance: profile?.user?.walletBalance || 0,
    reliabilityScore: profile?.reliabilityScore || 0,
    overallRating: profile?.rating || 0,
    reviewCount: profile?.reviewCount || 0,
    isVerified: profile?.isVerified || false,
    activeJobsCount: activeCount,
    completedJobs: completedCount
  }), [profile, activeCount, completedCount]);

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
