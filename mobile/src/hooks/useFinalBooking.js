import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { createServiceRequest } from '../api/requestService';

/**
 * useFinalBooking Hook - Orchestrates the final step of the customer booking flow.
 * Handles date selection and the multipart submission.
 */
export const useFinalBooking = (route, navigation) => {
  const { technician, diagnosisData, bookingData, requestId } = route.params;
  const { aiDiagnosis } = diagnosisData || {};
  
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const days = [
    { id: 1, label: 'غداً', date: new Date(Date.now() + 86400000) },
    { id: 2, label: 'بعد غد', date: new Date(Date.now() + 172800000) },
    { id: 3, label: 'الإثنين', date: new Date(Date.now() + 259200000) },
  ];

  const times = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'];

  const handleFinalBooking = useCallback(async () => {
    if (!selectedDay || !selectedTime) {
      Alert.alert("تنبيه", "يرجى اختيار اليوم والوقت المفضل للزيارة");
      return;
    }

    setLoading(true);

    const scheduledDate = new Date(selectedDay.date);
    const [hours] = selectedTime.split(':');
    scheduledDate.setHours(parseInt(hours) + (selectedTime.includes('PM') && parseInt(hours) !== 12 ? 12 : 0));

    const result = await createServiceRequest({
      ...bookingData,
      id: requestId,
      technicianId: technician._id || technician.techId,
      scheduledDate: scheduledDate.toISOString(),
      preComputedDiagnosis: aiDiagnosis,
    }, bookingData.imagesUris || []);

    setLoading(false);

    if (result.success) {
      Alert.alert(
        "تم الحجز بنجاح 🎉",
        `تم إرسال طلبك للفني ${technician.fullName}. سيتصل بك فور تأكيده للموعد.`,
        [{ text: "الذهاب للطلبات", onPress: () => navigation.reset({ index: 0, routes: [{ name: 'HomeTab' }] }) }]
      );
    } else {
      Alert.alert("حدث خطأ", result.message);
    }
  }, [selectedDay, selectedTime, bookingData, requestId, technician, aiDiagnosis, navigation]);

  return {
    technician,
    aiDiagnosis,
    loading,
    selectedDay,
    setSelectedDay,
    selectedTime,
    setSelectedTime,
    days,
    times,
    handleFinalBooking
  };
};
