import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wrench, MapPin, Calendar, Clock } from 'lucide-react-native';   
import { TIME_SLOTS } from '../../config/constants';

/** 
 * بطاقة الطلب للفني (TechnicianJobCard)
 * الدور: عرض تفاصيل طلب واحد بتصميم مميز للفني.
 * هذه البطاقة تعرض تفاصيل الطلب مثل نوع الجهاز، العلامة التجارية، التاريخ، والحالة.
 *  
 */
const TechnicianJobCard = ({ item, onPress, hasConflict }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'waiting_for_confirmation': return { color: '#EF4444', bg: '#FEF2F2', label: 'طلب جديد' };
      case 'accepted': return { color: '#4F46E5', bg: '#EEF2FF', label: 'تم القبول' };
      case 'on_the_way': return { color: '#0EA5E9', bg: '#F0F9FF', label: 'في الطريق' };
      case 'arrived': return { color: '#10B981', bg: '#F0FDF4', label: 'وصل الموقع' };
      case 'in_progress': return { color: '#F59E0B', bg: '#FFFBEB', label: 'قيد الإصلاح' };
      default: return { color: '#64748B', bg: '#F8FAFC', label: status };
    }
  };

  const status = getStatusStyle(item.status);
  
  const timeSlotObj = TIME_SLOTS.find(s => s.id === item.timeSlot);
  const timeSlotLabel = timeSlotObj ? timeSlotObj.label : item.timeSlot;

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, hasConflict && styles.cardConflict]}
    >
      <View style={styles.cardHeader}>
         <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>● {status.label}</Text>
         </View>
         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {hasConflict && (
              <View style={styles.conflictBadge}>
                <Text style={styles.conflictText}>⚠️ تضارب وقت</Text>
              </View>
            )}
            <Text style={styles.requestId}>#{item._id.slice(-6).toUpperCase()}</Text>
         </View>
      </View>

      <View style={styles.cardBody}>
         <View style={styles.applianceInfo}>
            <Text style={styles.applianceName}>{item.applianceType?.nameAr || 'جهاز عام'}</Text>
            <Text style={styles.brandName}>{item.brand}</Text>
            {item.problemDescription && (
              <Text 
                style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 6, textAlign: 'right' }}
                numberOfLines={1}
              >
                {(item.problemDescription === item.aiDiagnosis?.diagnosis || item.problemDescription === 'تشخيص تلقائي بالصوت')
                  ? `طلب فحص ${item.applianceType?.nameAr || ''} عبر التسجيل الصوتي`
                  : item.problemDescription}
              </Text>
            )}
         </View>
         <View style={styles.iconContainer}>
            <Wrench size={24} color="#4F46E5" />
         </View>
      </View>

      <View style={styles.cardFooter}>
         <View style={styles.footerItem}>
            <Text style={[styles.footerText, item.distance !== undefined && { color: '#4F46E5', fontWeight: '800' }]}>
               {item.serviceAddress?.cityId?.nameAr || 'طرابلس'}
               {item.distance !== undefined && ` • يبعد ${item.distance.toFixed(1)} كم`}
            </Text>
            <MapPin size={14} color={item.distance !== undefined ? "#4F46E5" : "#94A3B8"} style={{ marginLeft: 6 }} />
         </View>
         <View style={styles.footerItem}>
            <Text style={styles.footerText}>
              {item.scheduledDate 
                ? item.scheduledDate 
                : new Date(item.createdAt).toLocaleDateString('ar-LY')}
            </Text>
            <Calendar size={14} color="#94A3B8" style={{ marginLeft: 6 }} />
         </View>
         {timeSlotLabel && (
           <View style={styles.footerItem}>
              <Text style={[styles.footerText, { color: '#4F46E5' }]}>{timeSlotLabel}</Text>
              <Clock size={14} color="#4F46E5" style={{ marginLeft: 6 }} />
           </View>
         )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9', elevation: 3, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { height: 4 } },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '800' },
  requestId: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  cardBody: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 20 },
  iconContainer: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
  applianceInfo: { flex: 1, alignItems: 'flex-end' },
  applianceName: { fontSize: 17, fontWeight: '900', color: '#1E293B', marginBottom: 2 },
  brandName: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 16 },
  footerItem: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 4 },
  footerText: { fontSize: 12, fontWeight: '700', color: '#64748B', flexShrink: 1 },
  cardConflict: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  conflictBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  conflictText: { fontSize: 10, fontWeight: '800', color: '#DC2626' }
});

export default memo(TechnicianJobCard);
