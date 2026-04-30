import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getActiveJobs } from '../api/technicianService';

/**
 * useTechnicianJobs Hook - Logic for fetching and refreshing technician jobs.
 * ادارة الطلبات  الفني و الفلترة و عمليات الالغاء و الحذف  
 */
export const useTechnicianJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    const result = await getActiveJobs();
    if (result.success) {
      setJobs(result.data.requests);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    refreshing,
    onRefresh,
    refetch: fetchJobs
  };
};
