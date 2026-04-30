import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { 
  ClipboardList, 
  Settings, 
  MapPin, 
  User, 
  CheckCircle, 
  Calendar, 
  Clock, 
  Zap,
  ChevronLeft
} from 'lucide-react-native';

/**
 * BookingDetailsScreen - شاشة عرض تفاصيل الطلب (للقراءة فقط)
 * الدور: عرض بيانات الطلب المخزن مسبقاً من سجل الطلبات.
 * 
 * استقبال البيانات: يتم استقبال كائن الطلب (order) عبر route.params.order
 */
export default function BookingDetailsScreen({ route, navigation }) {
  // استقبال الطلب من الـ Navigation
  const { order } = route.params || {};

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>عذراً، لم يتم العثور على بيانات الطلب.</Text>
      </View>
    );
  }

  // دالة لجلب تسمية الحالة بلون مناسب
  const getStatusInfo = (status) => {
    const metas = {
      pending: { label: 'بانتظار المراجعة', color: '#F59E0B' },
      accepted: { label: 'تم القبول', color: '#3B82F6' },
      completed: { label: 'مكتمل ✅', color: '#10B981' },
      cancelled: { label: 'ملغي', color: '#EF4444' },
      diagnosed_only: { label: 'تشخيص فقط', color: '#8B5CF6' }
    };
    return metas[status] || { label: status, color: '#64748B' };
  };

  const statusMeta = getStatusInfo(order.status);

  const handleBookNow = () => {
    navigation.navigate('TechnicianList', {
      requestId: order._id,
      diagnosisData: { aiDiagnosis: order.aiDiagnosis },
      bookingData: {
        ...order,
        applianceType: order.applianceType?._id || order.applianceType,
        imagesUris: order.images || []
      }
    });
  };

  return (
    <View style={styles.main}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: statusMeta.color }]}>
           <Text style={styles.label}>حالة الطلب الحالية:</Text>
           <View style={[styles.badge, { backgroundColor: statusMeta.color + '20' }]}>
              <Text style={[styles.badgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
           </View>
        </View>

        {/* Device Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>بيانات الجهاز</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>نوع الجهاز:</Text>
            <Text style={styles.infoValue}>{order.applianceType?.nameAr || 'غير محدد'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الماركة:</Text>
            <Text style={styles.infoValue}>{order.brand || 'غير محدد'}</Text>
          </View>
        </View>

        {/* Problem Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ClipboardList size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>وصف المشكلة</Text>
          </View>
          <Text style={styles.descriptionText}>{order.problemDescription}</Text>
        </View>

        {/* AI Diagnosis Result */}
        {order.aiDiagnosis && (
          <View style={[styles.section, styles.aiSection]}>
            <View style={styles.sectionHeader}>
              <Zap size={20} color="#8B5CF6" fill="#8B5CF6" />
              <Text style={[styles.sectionTitle, { color: '#8B5CF6' }]}>التشخيص الذكي المحفوظ</Text>
            </View>
            <Text style={styles.diagnosisText}>{order.aiDiagnosis.diagnosis}</Text>
            
            {order.aiDiagnosis.steps?.length > 0 && (
               <View style={styles.stepsContainer}>
                  {order.aiDiagnosis.steps.map((step, index) => (
                    <View key={index} style={styles.stepItem}>
                      <CheckCircle size={14} color="#10B981" />
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
               </View>
            )}
          </View>
        )}

        {/* Tech Info if assigned */}
        {order.technician && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={20} color="#10B981" />
              <Text style={[styles.sectionTitle, { color: '#10B981' }]}>الفني المختص</Text>
            </View>
            <Text style={styles.infoValue}>{order.technician.fullName || 'جاري التعيين...'}</Text>
            {order.scheduledDate && (
               <View style={styles.dateInfo}>
                  <Calendar size={14} color="#64748B" />
                  <Text style={styles.dateText}>
                     {new Date(order.scheduledDate).toLocaleDateString('ar-LY')}
                  </Text>
               </View>
            )}
          </View>
        )}

        {/* Book Now Button (Conditional) */}
        {order.status === 'diagnosed_only' && (
          <TouchableOpacity 
            style={styles.bookNowBtn} 
            onPress={handleBookNow}
            activeOpacity={0.8}
          >
            <Zap size={20} color="white" />
            <Text style={styles.bookNowText}>اطلب فني للإصلاح الآن</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#FAFBFD' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFF'
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  scroll: { padding: 20 },

  statusCard: { 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 24, 
    borderRightWidth: 6, 
    marginBottom: 20,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05
  },
  label: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '900' },

  section: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  aiSection: { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE', borderWidth: 1 },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 15, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B' },

  infoRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  infoLabel: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  infoValue: { fontSize: 14, fontWeight: '800', color: '#1E293B' },

  descriptionText: { fontSize: 14, color: '#475569', textAlign: 'right', lineHeight: 22 },
  diagnosisText: { fontSize: 15, fontWeight: '800', color: '#5B21B6', textAlign: 'right', marginBottom: 15 },
  
  stepsContainer: { gap: 10 },
  stepItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  stepText: { fontSize: 13, color: '#6D28D9', flex: 1, textAlign: 'right' },

  dateInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 10 },
  dateText: { fontSize: 12, color: '#64748B', fontWeight: '700' },

  bookNowBtn: { 
    backgroundColor: '#4F46E5', 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 20, 
    borderRadius: 24,
    gap: 12,
    marginTop: 10,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8
  },
  bookNowText: { color: 'white', fontSize: 16, fontWeight: '900' }
});
