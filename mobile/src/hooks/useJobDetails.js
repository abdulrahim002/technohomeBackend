import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getJobDetails, acceptJob, updateJobStatus, completeJob } from '../api/technicianService';

/**
 * useJobDetails Hook - Business logic for technician job operations.
 * Handles state, status transitions, and price modal logic.
 * يتولى هذا الهوك جلب تفاصيل الطلب من السيرفر وتحديث حالة الطلب  
 * العمليات المعقدة (قبول المهمة، تحديث الحالة، استدعاء العميل، وإغلاق المهمة مع السعر النهائي).  
 */
export const useJobDetails = (requestId) => {
  const navigation = useNavigation();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [finalPrice, setFinalPrice] = useState('');
  const [notes, setNotes] = useState('');

  const fetchDetails = useCallback(async () => {
    const result = await getJobDetails(requestId);
    if (result.success) {
      setRequest(result.data.request);
    } else {
      Alert.alert('خطأ', result.message);
      navigation.goBack();
    }
    setLoading(false);
  }, [requestId, navigation]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleAction = useCallback(async (status) => {
    setActionLoading(true);
    let result;
    
    try {
      if (status === 'accepted') {
        result = await acceptJob(requestId);
      } else if (status === 'completed') {
        if (!finalPrice) {
          Alert.alert('تنبيه', 'يرجى إدخال السعر النهائي');
          setActionLoading(false);
          return;
        }
        result = await completeJob(requestId, finalPrice, notes);
        setPriceModalVisible(false);
      } else {
        result = await updateJobStatus(requestId, status);
      }

      if (result.success) {
        await fetchDetails();
        if (status === 'completed') Alert.alert('تم ✅', 'تم إتمام المهمة بنجاح.');
      } else {
        Alert.alert('خطأ', result.message);
      }
    } catch (error) {
      Alert.alert('خطأ برمجى', 'حدث خطأ غير متوقع');
    } finally {
      setActionLoading(false);
    }
  }, [requestId, finalPrice, notes, fetchDetails]);

  const callCustomer = useCallback(() => {
    if (request?.customer?.phone) {
      Linking.openURL(`tel:${request.customer.phone}`);
    }
  }, [request]);

  const openInMaps = useCallback(() => {
    Alert.alert('قريباً', 'سيتم ربط خرائط جوجل في التحديث القادم');
  }, []);

  return {
    request,
    loading,
    actionLoading,
    priceModalVisible,
    setPriceModalVisible,
    finalPrice,
    setFinalPrice,
    notes,
    setNotes,
    handleAction,
    callCustomer,
    openInMaps,
    refresh: fetchDetails
  };
};
