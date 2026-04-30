import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { createServiceRequest } from '../../api/requestService';
import { Clock, ShieldCheck, Zap, ArrowRight, Tool, CheckCircle, HelpCircle, Activity } from 'lucide-react-native';

export default function DiagnosisResultScreen({ route, navigation }) {
  const { diagnosisData, timedOut, bookingData, isManual, requestId } = route.params;
  const { aiDiagnosis } = diagnosisData || {};
  const [savingOnly, setSavingOnly] = useState(false);

  const handleSaveOnly = async () => {
    setSavingOnly(true);
    const result = await createServiceRequest({
      ...bookingData,
      id: requestId,
      preComputedDiagnosis: aiDiagnosis,
    }, bookingData.imagesUris || []);
    setSavingOnly(false);

    if (result.success) {
      Alert.alert(
        "تم الحفظ ✅",
        "تم حفظ تفاصيل العطل في سجلاتك، يمكنك الحجز لاحقاً.",
        [{ text: "حسناً", onPress: () => navigation.reset({ index: 0, routes: [{ name: 'CustomerMain' }] }) }]
      );
    }
  };

  const handleBookTechnician = () => {
    navigation.navigate('TechnicianList', {
      requestId,
      diagnosisData: { aiDiagnosis },
      bookingData
    });
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section with Animation Effect */}
        <View style={styles.premiumHeader}>
          <View style={styles.reportBadge}>
            <Activity size={14} color="#4F46E5" />
            <Text style={styles.reportBadgeText}>تقرير ذكي مباشر</Text>
          </View>
          <Text style={styles.headerTitle}>
            {isManual ? '📋 فحص الجهاز' : '💡 نتيجة التشخيص'}
          </Text>
          <Text style={styles.headerSub}>تم تحليل العطل بناءً على البيانات المقدمة</Text>
        </View>

        {/* Diagnosis Highlight */}
        <View style={styles.mainCard}>
          <View style={styles.cardIndicator} />
          <View style={styles.cardContent}>
            <Text style={styles.diagnosisTitle}>التحليل المتوقع:</Text>
            <Text style={styles.diagnosisText}>{aiDiagnosis?.diagnosis}</Text>
          </View>
          <View style={styles.aiPulseContainer}>
            <View style={styles.pulseInner} />
            <Zap size={20} color="#4F46E5" fill="#4F46E5" />
          </View>
        </View>

        {/* Steps Section */}
        {aiDiagnosis?.steps?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>خطوات الإصلاح المقترحة</Text>
              <Clock size={16} color="#94A3B8" />
            </View>

            {aiDiagnosis.steps.map((step, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepIndex}>
                  <Text style={styles.stepIndexText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
                <CheckCircle size={18} color="#E2E8F0" />
              </View>
            ))}
          </View>
        )}

        <View style={styles.safetyInfo}>
          <ShieldCheck size={20} color="#10B981" />
          <Text style={styles.safetyText}>ننصح دائماً باستدعاء فني مختص لتجنب مخاطر الكهرباء.</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.footerActions}>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={handleBookTechnician}
          activeOpacity={0.9}
        >
          <View style={styles.btnIconCircle}>
            <Zap size={20} color="white" />
          </View>
          <View style={styles.btnTextContent}>
            <Text style={styles.bookBtnText}>اطلب فني للإصلاح</Text>
            <Text style={styles.bookBtnSub}>اختر أفضل الخبراء في منطقتك</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveOnly}
          disabled={savingOnly}
        >
          {savingOnly ? <ActivityIndicator color="#4F46E5" /> : <Text style={styles.saveBtnText}>اكتفيت بالتقرير</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 24 },

  premiumHeader: { marginTop: 30, marginBottom: 30, alignItems: 'flex-end' },
  reportBadge: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12 },
  reportBadgeText: { fontSize: 11, fontWeight: '900', color: '#4F46E5', marginRight: 6, textTransform: 'uppercase' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
  headerSub: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginTop: 4 },

  mainCard: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 24, flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', elevation: 10, shadowColor: '#4F46E5', shadowOpacity: 0.1, shadowRadius: 20, marginBottom: 30 },
  cardIndicator: { width: 6, height: '80%', backgroundColor: '#4F46E5', borderRadius: 3, marginLeft: 20 },
  cardContent: { flex: 1, alignItems: 'flex-end' },
  diagnosisTitle: { fontSize: 13, fontWeight: '800', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' },
  diagnosisText: { fontSize: 17, fontWeight: '800', color: '#1E293B', lineHeight: 26, textAlign: 'right' },
  aiPulseContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },

  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },

  stepCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  stepIndex: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginLeft: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  stepIndexText: { fontSize: 14, fontWeight: '900', color: '#1E293B' },
  stepText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#475569', textAlign: 'right', lineHeight: 22 },

  safetyInfo: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#DCFCE7' },
  safetyText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#166534', textAlign: 'right', marginRight: 12 },

  footerActions: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingVertical: 30, borderTopLeftRadius: 40, borderTopRightRadius: 40, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 },
  bookBtn: { backgroundColor: '#4F46E5', borderRadius: 24, padding: 20, flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 16, shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { height: 10 } },
  btnIconCircle: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginLeft: 16 },
  btnTextContent: { flex: 1, alignItems: 'flex-end' },
  bookBtnText: { color: 'white', fontSize: 18, fontWeight: '900' },
  bookBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', marginTop: 2 },
  saveBtn: { paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#4F46E5', fontSize: 16, fontWeight: '900' }
});
