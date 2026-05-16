import React, { useState, useEffect, useCallback } from 'react';

// دالة موثوقة للحصول على الوقت بتوقيت ليبيا (متناسقة مع كل مكان في التطبيق)
const getLibyaDateTime = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Tripoli',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  const parts = formatter.formatToParts(now);
  const get = (type) => parts.find(p => p.type === type)?.value || '0';
  const todayStr = `${get('year')}-${get('month')}-${get('day')}`;
  const currentDecimalHour = parseInt(get('hour'), 10) + parseInt(get('minute'), 10) / 60;
  return { todayStr, currentDecimalHour };
};
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  Alert
} from 'react-native';
import { 
  ChevronRight, 
  MapPin, 
  Phone, 
  Navigation as NavigationIcon, 
  CheckCircle2, 
  AlertTriangle,
  Target,
  Wrench,
  X,
  MessageSquare
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useJobDetails } from '../../../hooks/useJobDetails';
import { 
  ServiceInfoCard 
} from '../../../components/main/ServiceInfoCard';

import JobStepper from '../../../components/main/JobStepper';
import CompleteJobModal from '../../../components/main/CompleteJobModal';
import { UPLOADS_URL } from '../../../config/constants';
import { onSocketEvent, offSocketEvent } from '../../../services/SocketService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * TechnicianJobDetails - Refactored for Clean Architecture.
 * يستخدم المكونات الموحدة والهوك المشترك لتقليل التكرار.
 */
const TechnicianJobDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { requestId } = route.params;

  // Local State for Image Viewer
  const [selectedImage, setSelectedImage] = useState(null);
  const [confirmTripVisible, setConfirmTripVisible] = useState(false);

  const {
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
    callPerson,
    openInMaps
  } = useJobDetails(requestId);

  useEffect(() => {
    const handleOtpReceived = (data) => {
      if (String(data.requestId) === String(requestId)) {
        setOtp(data.otp);
        Alert.alert('تم استلام الرمز ✅', 'قام العميل بإرسال رمز التأكيد رقمياً، تم تعبئته تلقائياً.');
      }
    };

    onSocketEvent('otpReceived', handleOtpReceived);
    return () => offSocketEvent('otpReceived', handleOtpReceived);
  }, [requestId, setOtp]);

  // فحص إذا كان مسموحاً للفني ببدء التحرك (هامش ساعتين قبل الفترة - بتوقيت ليبيا UTC+2)
  const canStartTrip = useCallback(() => {
    if (!request) return false;
    const { scheduledDate, timeSlot } = request;
    const { todayStr, currentDecimalHour } = getLibyaDateTime();

    if (scheduledDate && todayStr !== scheduledDate) return false;

    if (timeSlot) {
      const slotStartHour = parseInt(timeSlot.split('-')[0].split(':')[0], 10);
      if (currentDecimalHour < slotStartHour - 2) return false;
    }

    return true;
  }, [request]);

  const getTripHintText = useCallback(() => {
    if (!request) return '';
    const { scheduledDate, timeSlot } = request;
    const { todayStr } = getLibyaDateTime();

    if (scheduledDate && todayStr < scheduledDate) {
      return `يمكنك التحرك يوم ${scheduledDate}`;
    }

    if (timeSlot) {
      const slotStartHour = parseInt(timeSlot.split('-')[0].split(':')[0], 10);
      const earliestHour = slotStartHour - 2;
      return `يمكنك التحرك بعد الساعة ${String(earliestHour).padStart(2, '0')}:00`;
    }

    return '';
  }, [request]);

  const getActionButton = () => {
    if (!request) return null;
    switch(request.status) {
      case 'pending':
        return { label: 'قبول المهمة', color: '#4F46E5', status: 'accepted', icon: <CheckCircle2 size={20} color="white" /> };
      case 'accepted': {
        const allowed = canStartTrip();
        return { label: 'بدأ التحرك للموقع', color: allowed ? '#0EA5E9' : '#CBD5E1', status: 'on_the_way', disabled: !allowed, icon: <NavigationIcon size={20} color="white" /> };
      }
      case 'on_the_way':
        return { label: 'لقد وصلت للموقع', color: '#10B981', status: 'arrived', icon: <MapPin size={20} color="white" /> };
      case 'arrived':
        return { label: 'بدء العمل الفعلي', color: '#F59E0B', status: 'in_progress', icon: <Wrench size={20} color="white" /> };
      case 'in_progress':
        return { label: 'إتمام وإغلاق المهمة', color: '#10B981', status: 'completed', icon: <CheckCircle2 size={20} color="white" /> };
      default: return null;
    }
  };

  const action = getActionButton();

  if (loading || !request) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
           <ChevronRight size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل المهمة</Text>
        <View style={styles.headerActions}>
           <TouchableOpacity 
             style={[styles.backBtn, { marginRight: 10 }]} 
             onPress={() => navigation.navigate('Chat', { 
               requestId: request._id, 
               recipientId: request.customer?._id, 
               recipientName: `${request.customer?.firstName} ${request.customer?.lastName}` 
             })}
           >
              <MessageSquare size={20} color="#4F46E5" />
           </TouchableOpacity>
           <TouchableOpacity style={styles.backBtn} onPress={() => callPerson(request.customer?.phone)}>
              <Phone size={20} color="#4F46E5" />
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        
        <JobStepper status={request.status} />

        {['rejected', 'expired'].includes(request.status) && (
          <View style={styles.errorBanner}>
             <AlertTriangle size={20} color="#EF4444" />
             <Text style={styles.errorBannerText}>
               {request.status === 'rejected' ? 'هذا الطلب تم رفضه مسبقاً' : 'انتهت صلاحية هذا الطلب (Timeout)'}
             </Text>
          </View>
        )}



        {/* Evidence Images */}
        {request.images && request.images.length > 0 && (
          <View style={styles.imageSection}>
             <Text style={styles.sectionTitle}>صور المعاينة</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                {request.images.map((img, index) => {
                   const fullUri = img.startsWith('http') ? img : `${UPLOADS_URL}${img.replace(/^\/+/, '')}`;
                   return (
                     <TouchableOpacity 
                       key={index} 
                       style={styles.imageWrapper}
                       onPress={() => setSelectedImage(fullUri)}
                     >
                       <Image 
                         source={{ uri: fullUri }} 
                         style={styles.evidenceImage} 
                         resizeMode="cover"
                       />
                     </TouchableOpacity>
                   );
                })}
             </ScrollView>
          </View>
        )}

        {/* Client & Location Card */}
        <Text style={styles.sectionTitle}>بيانات العميل والموقع</Text>
        <View style={styles.infoCard}>
           <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{request.customer?.firstName} {request.customer?.lastName}</Text>
              <Text style={styles.infoLabel}>العميل</Text>
           </View>
           <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{request.serviceAddress?.cityId?.nameAr || 'طرابلس'}</Text>
              <Text style={styles.infoLabel}>المدينة</Text>
           </View>
           <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{request.serviceAddress?.street || 'العنوان غير محدد'}</Text>
              <Text style={styles.infoLabel}>العنوان</Text>
           </View>
           
           <TouchableOpacity style={styles.mapBtn} onPress={openInMaps}>
              <NavigationIcon size={18} color="#4F46E5" style={{ marginLeft: 8 }} />
              <Text style={styles.mapBtnText}>فتح في الخرائط</Text>
           </TouchableOpacity>
        </View>

        {/* Device & Problem Info (Shared Card) */}
        <Text style={styles.sectionTitle}>تفاصيل الطلب</Text>
        <ServiceInfoCard 
          applianceType={request.applianceType}
          brand={request.brand}
          problemDescription={request.problemDescription}
        />

      </ScrollView>

      {/* Action Footer */}
      {action && (
        <View style={styles.footer}>
           {request.status === 'pending' ? (
             <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  disabled={actionLoading}
                  onPress={handleReject}
                  style={[styles.actionBtn, styles.rejectBtn]}
                >
                  {actionLoading ? <ActivityIndicator color="#EF4444" /> : (
                    <>
                      <Text style={[styles.actionBtnText, {color: '#EF4444'}]}>رفض</Text>
                      <X size={20} color="#EF4444" />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  disabled={actionLoading}
                  onPress={() => handleAction('accepted')}
                  style={[styles.actionBtn, { backgroundColor: '#4F46E5', flex: 2 }]}
                >
                  {actionLoading ? <ActivityIndicator color="white" /> : (
                    <>
                      <Text style={styles.actionBtnText}>قبول</Text>
                      <CheckCircle2 size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>
             </View>
           ) : action.status === 'on_the_way' ? (
             // زر بدء التحرك: يحتاج منطق خاص (تعطيل + modal تأكيد)
             <View>
               <TouchableOpacity
                 disabled={actionLoading || action.disabled}
                 onPress={() => setConfirmTripVisible(true)}
                 style={[styles.actionBtn, { backgroundColor: action.color, opacity: action.disabled ? 0.7 : 1 }]}
               >
                 {actionLoading ? <ActivityIndicator color="white" /> : (
                   <>
                     <Text style={styles.actionBtnText}>{action.label}</Text>
                     {action.icon}
                   </>
                 )}
               </TouchableOpacity>
               {action.disabled && (
                 <Text style={styles.hintText}>
                   ⏰ {getTripHintText()}
                 </Text>
               )}
             </View>
           ) : (
             <TouchableOpacity
               disabled={actionLoading}
               onPress={() => action.status === 'completed' ? setPriceModalVisible(true) : handleAction(action.status)}
               style={[styles.actionBtn, { backgroundColor: action.color }]}
             >
               {actionLoading ? <ActivityIndicator color="white" /> : (
                 <>
                   <Text style={styles.actionBtnText}>{action.label}</Text>
                   {action.icon}
                 </>
               )}
             </TouchableOpacity>
           )}
        </View>
      )}

      {/* Confirm Trip Modal */}
      <Modal visible={confirmTripVisible} transparent animationType="slide">
        <View style={styles.confirmModalBg}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmModalIcon}>
              <NavigationIcon size={28} color="#0EA5E9" />
            </View>
            <Text style={styles.confirmModalTitle}>تأكيد بدء التحرك</Text>
            <Text style={styles.confirmModalBody}>
              هل أنت متأكد من بدء التحرك نحو موقع العميل الآن؟
            </Text>
            <Text style={styles.confirmModalSub}>سيتم إخبار العميل فوراً.</Text>
            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={styles.confirmModalCancel}
                onPress={() => setConfirmTripVisible(false)}
              >
                <Text style={styles.confirmModalCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmModalConfirm}
                onPress={() => {
                  setConfirmTripVisible(false);
                  handleAction('on_the_way');
                }}
              >
                <Text style={styles.confirmModalConfirmText}>نعم، تحرك الآن 🚗</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pricing Modal */}
      <CompleteJobModal 
        visible={priceModalVisible}
        onClose={() => setPriceModalVisible(false)}
        onConfirm={() => handleAction('completed')}
        notes={notes}
        setNotes={setNotes}
        otp={otp}
        setOtp={setOtp}
      />

      {/* IMAGE VIEWER MODAL */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.closeModal} onPress={() => setSelectedImage(null)}>
            <X size={32} color="white" />
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullImage} 
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  headerActions: { flexDirection: 'row' },
  scrollBody: { padding: 20, paddingBottom: 120 },
  reportCard: { backgroundColor: '#EEF2FF', borderRadius: 32, padding: 24, marginBottom: 30, borderWidth: 1, borderColor: '#E0E7FF' },
  reportHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  reportBadge: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  reportBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFF' },
  reportMainText: { fontSize: 18, fontWeight: '900', color: '#1E293B', textAlign: 'right', marginBottom: 8, lineHeight: 26 },
  reportSubText: { fontSize: 13, fontWeight: '600', color: '#4F46E5', textAlign: 'right', opacity: 0.8, lineHeight: 20 },
  hintText: { textAlign: 'center', color: '#64748B', fontSize: 12, fontWeight: '700', marginTop: 8 },
  confirmModalBg: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  confirmModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 40, alignItems: 'center' },
  confirmModalIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  confirmModalTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 8 },
  confirmModalBody: { fontSize: 15, fontWeight: '700', color: '#475569', textAlign: 'center', lineHeight: 22, marginBottom: 6 },
  confirmModalSub: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 24 },
  confirmModalActions: { flexDirection: 'row-reverse', gap: 12, width: '100%' },
  confirmModalCancel: { flex: 1, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  confirmModalCancelText: { fontSize: 15, fontWeight: '800', color: '#64748B' },
  confirmModalConfirm: { flex: 2, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0EA5E9' },
  confirmModalConfirmText: { fontSize: 15, fontWeight: '900', color: '#FFF' },
  imageScroll: { marginTop: 20 },
  imageWrapper: { width: 120, height: 80, borderRadius: 16, marginLeft: 12, backgroundColor: '#f1f5f9', overflow: 'hidden' },
  evidenceImage: { width: '100%', height: '100%' },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#94A3B8', textAlign: 'right', marginBottom: 12, textTransform: 'uppercase' },
  infoCard: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#F1F5F9' },
  infoRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  infoValue: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  mapBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', paddingVertical: 12, borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  mapBtnText: { color: '#4F46E5', fontWeight: '800', fontSize: 14 },
  deviceCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  deviceIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
  deviceInfo: { flex: 1, alignItems: 'flex-end' },
  deviceName: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  deviceBrand: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  errorBanner: { backgroundColor: '#FEF2F2', padding: 15, borderRadius: 16, flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FEE2E2' },
  errorBannerText: { color: '#EF4444', fontSize: 13, fontWeight: '800', marginRight: 10 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  buttonGroup: { flexDirection: 'row-reverse', gap: 12 },
  actionBtn: { height: 60, borderRadius: 20, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { height: 4 }, flex: 1 },
  rejectBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2', elevation: 0 },
  actionBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900', marginLeft: 12 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  closeModal: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 },
});

export default TechnicianJobDetails;
