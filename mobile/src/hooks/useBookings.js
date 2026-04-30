import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMyRequests, cancelServiceRequest, deleteServiceRequest } from '../api/requestService';

/**
 * useBookings Hook - Business logic and state management for client bookings.
 * Follows Separation of Concerns by isolating data fetching and filtering.
 * ادارة الطلبات  العميل و الفلترة و عمليات الالغاء و الحذف
 */
export const useBookings = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchRequests = useCallback(async () => {
    const result = await getMyRequests();
    if (result.success) {
      setRequests(result.data.requests);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, [fetchRequests]);

  // Memoized filter result for maximum performance
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'waiting') return req.status === 'waiting_for_confirmation';
      const isManual = req.diagnosisType === 'manual' || req.problemDescription?.includes('كود الخطأ');
      const isAI = req.diagnosisType === 'ai' || (!isManual && req.aiDiagnosis?.diagnosis);
      if (activeFilter === 'ai') return isAI;
      if (activeFilter === 'manual') return isManual;
      if (activeFilter === 'confirmed') return ['accepted', 'confirmed', 'on_the_way', 'arrived', 'in_progress'].includes(req.status);
      if (activeFilter === 'cancelled') return req.status === 'cancelled';
      return true;
    });
  }, [requests, activeFilter]);

  const handleCancelBooking = useCallback((requestId) => {
    Alert.alert("تأكيد الإلغاء", "هل تريد إلغاء حجز الفني؟ سيبقى التشخيص محفوظاً.", [
      { text: "تراجع", style: "cancel" },
      { text: "إلغاء الفني", style: "destructive", onPress: async () => {
        const res = await cancelServiceRequest(requestId);
        if (res.success) fetchRequests();
        else Alert.alert("خطأ", res.message);
      }}
    ]);
  }, [fetchRequests]);

  const handleDeleteRequest = useCallback((requestId) => {
    Alert.alert("حذف الطلب", "هل أنت متأكد من الحذف النهائي؟", [
      { text: "تراجع", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: async () => {
        const res = await deleteServiceRequest(requestId);
        if (res.success) fetchRequests();
      }}
    ]);
  }, [fetchRequests]);

  return {
    requests: filteredRequests,
    loading,
    refreshing,
    activeFilter,
    setActiveFilter,
    onRefresh,
    handleCancelBooking,
    handleDeleteRequest,
    totalCount: requests.length
  };
};
