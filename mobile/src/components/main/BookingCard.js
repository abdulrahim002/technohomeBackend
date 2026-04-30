import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, CheckCircle2, AlertCircle, Calendar, MapPin, Wrench, MessageSquare, Star, Zap } from 'lucide-react-native';
   
/**
 * بطاقة الطلب (BookingCard)
 * الدور: عرض تفاصيل طلب واحد بتصميم مميز.
 * هذه البطاقة تعرض تفاصيل الطلب مثل نوع الجهاز، العلامة التجارية، التاريخ، والحالة.
 *  
 */
const BookingCard = ({ item, onDetails, onCancel, onDelete, onChat, onRate }) => {
  const getStatusMeta = (status) => {
    const s = status 
      ? String(status).toLowerCase().trim().replace(/-/g, '_').replace(/\s+/g, '_') 
      : 'pending';

    const metas = {
      pending: { label: 'قيد المراجعة', color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
      waiting_for_confirmation: { label: 'بانتظار الفني', color: '#6366F1', bg: '#EEF2FF', icon: Clock },
      accepted: { label: 'تم القبول', color: '#3B82F6', bg: '#EFF6FF', icon: CheckCircle2 },
      on_the_way: { label: 'الفني في الطريق', color: '#0EA5E9', bg: '#F0F9FF', icon: MapPin },
      arrived: { label: 'في الموقع', color: '#8B5CF6', bg: '#F5F3FF', icon: MapPin },
      in_progress: { label: 'جاري العمل', color: '#F59E0B', bg: '#FFFBEB', icon: Wrench },
      completed: { label: 'تمت الصيانة', color: '#10B981', bg: '#ECFDF5', icon: CheckCircle2 },
      cancelled: { label: 'ملغي', color: '#EF4444', bg: '#FEF2F2', icon: AlertCircle },
      diagnosed_only: { label: 'تشخيص محفوظ', color: '#8B5CF6', bg: '#F5F3FF', icon: Zap }
    };

    return metas[s] || { label: `حالة: ${status}`, color: '#64748B', bg: '#F1F5F9', icon: AlertCircle };
  };

  const meta = getStatusMeta(item.status);
  const StatusIcon = meta.icon;

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      style={styles.card}
      onPress={onDetails}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.applianceName}>{item.applianceType?.nameAr || 'صيانة عامة'}</Text>
          <Text style={styles.brandText}>{item.brand} • {item.diagnosisType === 'ai' ? 'ذكاء اصطناعي ✨' : 'فحص كود 📋'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
         <View style={styles.dateRow}>
            <Calendar size={14} color="#94A3B8" style={{marginLeft: 6}} />
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('ar-LY')}</Text>
         </View>
         {item.aiDiagnosis && (
            <View style={styles.diagnosisPreview}>
               <Text style={styles.diagnosisText} numberOfLines={1}>💡 {item.aiDiagnosis.diagnosis}</Text>
            </View>
         )}
      </View>

      <View style={styles.cardFooter}>
         <View style={styles.statusDetail}>
            <StatusIcon size={16} color={meta.color} />
             <Text style={[styles.statusDetailText, { color: meta.color }]}>
               {item.status === 'completed' ? 'تمت بنجاح ✅' : item.status === 'diagnosed_only' ? 'جاهز لطلب فني' : 'جاري المتابعة...'}
            </Text>
         </View>
         <View style={styles.actions}>
            {item.status === 'waiting_for_confirmation' && (
               <TouchableOpacity onPress={onCancel} style={styles.actionBtn}>
                  <AlertCircle size={18} color="#F59E0B" />
               </TouchableOpacity>
            )}
            {item.status !== 'completed' && (
               <TouchableOpacity onPress={onDelete} style={[styles.actionBtn, {backgroundColor: '#FEF2F2'}]}>
                  <AlertCircle size={18} color="#EF4444" />
               </TouchableOpacity>
            )}
            {['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(item.status) && (
               <TouchableOpacity onPress={onChat} style={[styles.actionBtn, {backgroundColor: '#EEF2FF'}]}>
                  <MessageSquare size={18} color="#4F46E5" />
               </TouchableOpacity>
            )}
            {item.status === 'completed' && !item.isRated && (
               <TouchableOpacity onPress={onRate} style={[styles.actionBtn, {backgroundColor: '#FFFBEB'}]}>
                  <Star size={18} color="#F59E0B" />
               </TouchableOpacity>
            )}
            {item.status === 'diagnosed_only' && (
               <TouchableOpacity onPress={onDetails} style={[styles.actionBtn, {backgroundColor: '#EEF2FF', width: 'auto', paddingHorizontal: 12}]}>
                  <Text style={{color: '#4F46E5', fontSize: 10, fontWeight: '900'}}>اطلب فني</Text>
               </TouchableOpacity>
            )}
         </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowOpacity: 0.03 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  cardInfo: { alignItems: 'flex-end', flex: 1 },
  applianceName: { fontSize: 17, fontWeight: '900', color: '#1E293B', marginBottom: 4 },
  brandText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusLabel: { fontSize: 10, fontWeight: '900' },
  cardBody: { marginBottom: 15 },
  dateRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 8 },
  dateText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  diagnosisPreview: { backgroundColor: '#F1F5F9', padding: 12, borderRadius: 16 },
  diagnosisText: { fontSize: 12, fontWeight: '700', color: '#4F46E5', textAlign: 'right' },
  cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 15 },
  statusDetail: { flexDirection: 'row-reverse', alignItems: 'center' },
  statusDetailText: { fontSize: 12, fontWeight: '800', marginRight: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFBEB', justifyContent: 'center', alignItems: 'center' },
});

export default memo(BookingCard);
