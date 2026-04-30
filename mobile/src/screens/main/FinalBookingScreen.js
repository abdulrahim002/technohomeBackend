import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { useFinalBooking } from '../../hooks/useFinalBooking';

/**
 * FinalBookingScreen - Customer's Final Confirmation Screen (Date/Time Selection).
 * هذه الشاشة هي الخطوة الأخيرة للعميل قبل تأكيد الحجز (اختيار الموعد النهائي). 
 */
export default function FinalBookingScreen({ route, navigation }) {
  const {
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
  } = useFinalBooking(route, navigation);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ملخص الفني */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👨‍🔧 الفني المختار:</Text>
        <View style={styles.techCard}>
          <Text style={styles.techName}>{technician.fullName}</Text>
          <Text style={styles.techInfo}>التقييم: ⭐ {technician.rating || 'جديد'} | الخبرة: {technician.yearsOfExperience || '0'} سنوات</Text>
        </View>
      </View>

      {/* اختيار اليوم */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗓 اختر يوم الزيارة:</Text>
        <View style={styles.row}>
          {days.map(day => (
            <TouchableOpacity 
              key={day.id} 
              style={[styles.chip, selectedDay?.id === day.id && styles.chipSelected]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={selectedDay?.id === day.id ? styles.textWhite : styles.textGray}>{day.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* اختيار الوقت */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏰ اختر الوقت المفضل:</Text>
        <View style={styles.grid}>
          {times.map(time => (
            <TouchableOpacity 
              key={time} 
              style={[styles.timeChip, selectedTime === time && styles.chipSelected]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={selectedTime === time ? styles.textWhite : styles.textGray}>{time}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ملخص التشخيص الذكي */}
      {aiDiagnosis?.diagnosis && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {route.params?.isManual ? '📋 تفاصيل العطل:' : '💡 ملخص التشخيص:'}
          </Text>
          <View style={styles.diagnosisCard}>
            <Text style={styles.diagnosisText} numberOfLines={3}>{aiDiagnosis.diagnosis}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.confirmBtn, loading && styles.disabledBtn]} 
        onPress={handleFinalBooking}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>تأكيد الحجز النهائي ✅</Text>}
      </TouchableOpacity>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, textAlign: 'right' },
  techCard: { backgroundColor: '#fff', padding: 18, borderRadius: 20, borderRightWidth: 5, borderRightColor: '#2563eb', elevation: 2 },
  techName: { fontSize: 18, fontWeight: 'bold', color: '#334155', textAlign: 'right' },
  techInfo: { fontSize: 13, color: '#64748b', textAlign: 'right', marginTop: 5 },
  row: { flexDirection: 'row-reverse', gap: 10 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  timeChip: { paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', width: '45%', alignItems: 'center' },
  diagnosisCard: { backgroundColor: '#eff6ff', padding: 18, borderRadius: 16, borderRightWidth: 4, borderRightColor: '#93c5fd' },
  diagnosisText: { fontSize: 14, color: '#1e40af', textAlign: 'right', lineHeight: 22 },
  chipSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  textWhite: { color: '#fff', fontWeight: 'bold' },
  textGray: { color: '#64748B', fontWeight: '600' },
  confirmBtn: { backgroundColor: '#10b981', height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 20, elevation: 5, shadowColor: '#10b981', shadowOpacity: 0.3 },
  confirmText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  disabledBtn: { backgroundColor: '#a7f3d0' }
});
