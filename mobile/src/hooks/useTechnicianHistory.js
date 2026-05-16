import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getJobHistory } from '../api/technicianService';

/**
 * useTechnicianHistory Hook - Logic for fetching technician job history.
 */
export const useTechnicianHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    const result = await getJobHistory();
    if (result.success) {
      setHistory(result.data.requests);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    refreshing,
    onRefresh,
    refetch: fetchHistory
  };
};
