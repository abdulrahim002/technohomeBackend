import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { getJobDetails, acceptJob, rejectJob, updateJobStatus, completeJob } from '../api/technicianService';
import * as requestService from '../api/requestService';

/**
 * useJobDetails Hook - Business logic for order operations (Shared).
 * Handles state, status transitions, and role-specific actions.
 */
export const useJobDetails = (requestId) => {
  const navigation = useNavigation();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [finalPrice, setFinalPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [otp, setOtp] = useState('');

  const fetchDetails = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
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

  // --- Technician Actions ---
  const handleAction = useCallback(async (status) => {
    setActionLoading(true);
    try {
      let result;
      if (status === 'accepted') {
        result = await acceptJob(requestId);
      } else if (status === 'rejected') {
        result = await rejectJob(requestId);
      } else if (status === 'completed') {
        result = await completeJob(requestId, 0, notes, otp);
        setPriceModalVisible(false);
      } else {
        let techLocation = null;
        if (status === 'arrived') {
          let { status: permission } = await Location.requestForegroundPermissionsAsync();
          if (permission !== 'granted') {
            Alert.alert('تنبيه', 'يجب السماح بالوصول للموقع لتأكيد الوصول');
            setActionLoading(false);
            return;
          }
          let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          techLocation = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        }
        result = await updateJobStatus(requestId, status, techLocation);
      }

      if (result.success) {
        if (status === 'rejected') {
          Alert.alert('تم الرفض', 'تم رفض الطلب بنجاح.');
          navigation.goBack();
        } else {
          await fetchDetails();
          if (status === 'completed') Alert.alert('تم ✅', 'تم إتمام المهمة بنجاح.');
        }
      } else {
        Alert.alert('خطأ', result.message);
      }
      return result;
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تنفيذ العملية');
      return { success: false };
    } finally {
      setActionLoading(false);
    }
  }, [requestId, finalPrice, notes, otp, fetchDetails]);

  const handleReject = useCallback(async () => {
    return new Promise((resolve) => {
      Alert.alert('تأكيد الرفض', 'هل أنت متأكد من رفض هذا الطلب؟', [
        { text: 'تراجع', style: 'cancel', onPress: () => resolve({ success: false }) },
        { 
          text: 'نعم، رفض', 
          style: 'destructive',
          onPress: async () => {
            const res = await handleAction('rejected');
            resolve(res);
          }
        }
      ]);
    });
  }, [handleAction]);

  // --- Customer Actions ---
  const cancelBooking = useCallback(async () => {
    Alert.alert('تأكيد', 'هل أنت متأكد من إلغاء حجز الفني؟', [
      { text: 'تراجع', style: 'cancel' },
      { 
        text: 'نعم، إلغاء', 
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          const result = await requestService.cancelServiceRequest(requestId);
          if (result.success) {
            Alert.alert('تم', 'تم إلغاء الحجز بنجاح.');
            await fetchDetails();
          } else {
            Alert.alert('خطأ', result.message);
          }
          setActionLoading(false);
        }
      }
    ]);
  }, [requestId, fetchDetails]);

  const deleteRequest = useCallback(async () => {
    Alert.alert('حذف الطلب', 'هل أنت متأكد من حذف هذا الطلب نهائياً؟', [
      { text: 'تراجع', style: 'cancel' },
      { 
        text: 'حذف', 
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          const result = await requestService.deleteServiceRequest(requestId);
          if (result.success) {
            navigation.goBack();
          } else {
            Alert.alert('خطأ', result.message);
          }
          setActionLoading(false);
        }
      }
    ]);
  }, [requestId, navigation]);

  // --- Shared Actions ---
  const callPerson = useCallback((phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  }, []);

  const openInMaps = useCallback(() => {
    if (request?.serviceAddress?.location?.coordinates) {
      const [lng, lat] = request.serviceAddress.location.coordinates;
      const url = Platform.select({
        ios: `maps:0,0?q=موقع الطلب@${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}`
      });
      Linking.openURL(url);
    } else {
      Alert.alert('تنبيه', 'الإحداثيات غير متوفرة لهذا الطلب.');
    }
  }, [request]);

  const sendOtpToTechnician = useCallback(async () => {
    setActionLoading(true);
    const result = await requestService.authorizeCompletion(requestId);
    if (result.success) {
      Alert.alert('تم ✅', 'تم إرسال رمز التأكيد لجهاز الفني تلقائياً.');
    } else {
      Alert.alert('خطأ', result.message);
    }
    setActionLoading(false);
  }, [requestId]);

  const submitTechnicianReview = useCallback(async (rating, comment) => {
    setActionLoading(true);
    const result = await requestService.submitReview(requestId, rating, comment);
    if (result.success) {
      Alert.alert('شكراً لك ⭐', 'تم إرسال تقييمك بنجاح.');
      await fetchDetails();
    } else {
      Alert.alert('خطأ', result.message);
    }
    setActionLoading(false);
    return result;
  }, [requestId, fetchDetails]);

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
    otp,
    setOtp,
    handleAction,
    handleReject,
    cancelBooking,
    deleteRequest,
    callPerson,
    openInMaps,
    sendOtpToTechnician,
    submitTechnicianReview,
    refresh: fetchDetails
  };
};
