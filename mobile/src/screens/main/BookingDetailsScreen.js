import React, { useState } from 'react';
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
  MessageSquare,
  Zap,
  X,
  Trash2,
  Calendar,
  User as UserIcon,
  ShieldCheck,
  Star,
  CheckCircle
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useJobDetails } from '../../hooks/useJobDetails';
import { ServiceInfoCard } from '../../components/main/ServiceInfoCard';
import { DiagnosisCard } from '../../components/main/DiagnosisCard';
import JobStepper from '../../components/main/JobStepper';
import RatingModal from '../../components/main/RatingModal';
import { UPLOADS_URL } from '../../config/constants';
import api from '../../api/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * BookingDetailsScreen - Professional Customer View.
 * يعرض تفاصيل الطلب للعميل مع إمكانية تتبع الحالة الحية والاتصال بالفني.
 */
export default function BookingDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { order } = route.params || {};
  const requestId = order?._id;

  const [selectedImage, setSelectedImage] = useState(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  const {
    request,
    loading,
    actionLoading,
    cancelBooking,
    deleteRequest,
    callPerson,
    openInMaps,
    sendOtpToTechnician,
    submitTechnicianReview
  } = useJobDetails(requestId);

  const handleSubmitReview = async (rating, comment) => {
    const result = await submitTechnicianReview(rating, comment);
    if (result?.success) {
      setRatingModalVisible(false);
    }
  };

  const handleReportTechnician = () => {
    Alert.alert(
      'تقديم شكوى ضد الفني ⚠️',
      'الرجاء اختيار سبب المشكلة:',
      [
        {
          text: 'لم يحضر الفني (تأخر) ⏰',
          onPress: () => submitTechnicianReport('no_show')
        },
        {
          text: 'سلوك غير لائق 🚫',
          onPress: () => submitTechnicianReport('behavior')
        },
        {
          text: 'محاولة التفاف على العمولة 💰',
          onPress: () => submitTechnicianReport('bypass_commission')
        },
        {
          text: 'سبب آخر ✏️',
          onPress: () => submitTechnicianReport('other')
        },
        {
          text: 'تراجع',
          style: 'cancel'
        }
      ],
      { cancelable: true }
    );
  };

  const submitTechnicianReport = async (category) => {
    Alert.alert(
      'تأكيد البلاغ 📋',
      'هل تود رفع بلاغ للإدارة بخصوص الفني؟ سيتم مراجعة الطلب وجدية البلاغ فوراً لاتخاذ الإجراء اللازم.',
      [
        {
          text: 'نعم، إرسال البلاغ',
          onPress: async () => {
            try {
              const res = await api.post('/reports/submit', {
                reportedId: request.technician?._id,
                source: 'booking',
                serviceRequestId: request._id,
                category,
                description: 'بلاغ من العميل بخصوص التزام أو سلوك الفني خلال طلب الصيانة.'
              });

              if (res.data.status === 'success') {
                Alert.alert('تم الإرسال ✅', 'تم تسجيل بلاغك بنجاح، وسيتواصل معك الدعم الفني أو الأدمن عند الضرورة.');
              } else {
                Alert.alert('خطأ', 'فشل في إرسال البلاغ');
              }
            } catch (error) {
              console.error(error);
              Alert.alert('خطأ', 'حدث خطأ أثناء معالجة وإرسال البلاغ');
            }
          }
        },
        {
          text: 'إلغاء',
          style: 'cancel'
        }
      ]
    );
  };

  if (loading || !request) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );

  const isDiagnosedOnly = request.status === 'diagnosed_only';
  const canCancel = request.status === 'pending';
  const isCompleted = request.status === 'completed';
  const hasReview = !!request.review;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
           <ChevronRight size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل طلبي</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        
        {/* Progress Stepper (If assigned) */}
        {!isDiagnosedOnly && <JobStepper status={request.status} />}

        {/* === COMPLETED: Rating Section === */}
        {isCompleted && (
          <View style={styles.completedBanner}>
            <View style={styles.completedIconRow}>
              <CheckCircle size={24} color="#10B981" />
              <Text style={styles.completedTitle}>تم إتمام المهمة بنجاح ✅</Text>
            </View>

            {hasReview ? (
              <View style={styles.reviewDone}>
                <View style={styles.reviewStarsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      size={18} 
                      color={s <= request.review.rating ? "#F59E0B" : "#CBD5E1"} 
                      fill={s <= request.review.rating ? "#F59E0B" : "transparent"} 
                    />
                  ))}
                </View>
                <Text style={styles.reviewDoneText}>شكراً لك! تم تقييمك بنجاح</Text>
                {request.review.comment ? (
                  <Text style={styles.reviewComment}>"{request.review.comment}"</Text>
                ) : null}
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.rateBtn} 
                onPress={() => setRatingModalVisible(true)}
              >
                <Star size={18} color="#FFF" fill="#FFF" />
                <Text style={styles.rateBtnText}>قيّم الفني الآن</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Diagnosis Results */}
        <DiagnosisCard 
          diagnosis={request.aiDiagnosis?.diagnosis} 
          steps={request.aiDiagnosis?.steps} 
        />

        {/* Technician Info (If assigned) */}
        {request.technician && (
          <View style={styles.techCard}>
             <View style={styles.techHeader}>
                <View style={styles.techInfo}>
                   <Text style={styles.techName}>{request.technician.firstName} {request.technician.lastName}</Text>
                   <View style={styles.verifiedRow}>
                      <ShieldCheck size={12} color="#10B981" />
                      <Text style={styles.verifiedText}>فني معتمد</Text>
                   </View>
                </View>
                <View style={styles.techAvatar}>
                   {request.technician.profileImage ? (
                      <Image source={{ uri: request.technician.profileImage }} style={styles.avatarImg} />
                   ) : (
                      <UserIcon size={30} color="#CBD5E1" />
                   )}
                </View>
             </View>

             {/* OTP Display for Customer */}
             {request.closingOTP && request.status !== 'completed' && (
                <View style={styles.otpBox}>
                   <Text style={styles.otpLabel}>رمز إغلاق الطلب (أعطه للفني أو أرسله رقمياً)</Text>
                   <View style={styles.otpCodeContainer}>
                      {request.closingOTP.split('').map((char, index) => (
                         <View key={index} style={styles.otpDigit}>
                            <Text style={styles.otpDigitText}>{char}</Text>
                         </View>
                      ))}
                   </View>
                   
                   <TouchableOpacity 
                     style={styles.sendOtpBtn} 
                     onPress={sendOtpToTechnician}
                     disabled={actionLoading}
                   >
                      <Zap size={16} color="#FFF" style={{ marginLeft: 6 }} />
                      <Text style={styles.sendOtpBtnText}>إرسال الرمز لجهاز الفني</Text>
                   </TouchableOpacity>
                </View>
             )}
             
             <View style={styles.techActions}>
                {!isCompleted && (
                  <TouchableOpacity style={styles.callBtn} onPress={() => callPerson(request.technician.phone)}>
                     <Phone size={18} color="#FFF" style={{ marginLeft: 8 }} />
                     <Text style={styles.callBtnText}>اتصال هاتفياً</Text>
                  </TouchableOpacity>
                )}
                {canCancel ? (
                   <TouchableOpacity style={styles.cancelBtn} onPress={cancelBooking}>
                      <Text style={styles.cancelBtnText}>إلغاء حجز الفني</Text>
                   </TouchableOpacity>
                ) : (
                   !isCompleted && (
                     <TouchableOpacity style={[styles.cancelBtn, { borderColor: '#FEE2E2' }]} onPress={handleReportTechnician}>
                        <Text style={[styles.cancelBtnText, { color: '#EF4444' }]}>إبلاغ عن الفني ⚠️</Text>
                     </TouchableOpacity>
                   )
                )}
             </View>
          </View>
        )}

        {/* Evidence Images */}
        {request.images && request.images.length > 0 && (
          <View style={styles.imageSection}>
             <Text style={styles.sectionTitle}>الصور المرفقة</Text>
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

        {/* Device & Problem Info (Shared Card) */}
        <Text style={styles.sectionTitle}>تفاصيل الطلب</Text>
        <ServiceInfoCard 
          applianceType={request.applianceType}
          brand={request.brand}
          problemDescription={request.problemDescription}
        />

        {/* Location Preview */}
        <Text style={styles.sectionTitle}>موقع تقديم الخدمة</Text>
        <View style={styles.infoCard}>
           <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{request.serviceAddress?.cityId?.nameAr || 'غير محدد'}</Text>
              <Text style={styles.infoLabel}>المدينة</Text>
           </View>
           <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{request.serviceAddress?.street || 'العنوان غير محدد'}</Text>
              <Text style={styles.infoLabel}>العنوان</Text>
           </View>
           
           <TouchableOpacity style={styles.mapBtn} onPress={openInMaps}>
              <NavigationIcon size={18} color="#4F46E5" style={{ marginLeft: 8 }} />
              <Text style={styles.mapBtnText}>رؤية الموقع على الخريطة</Text>
           </TouchableOpacity>
        </View>

        {/* Action for Diagnosed Only */}
        {isDiagnosedOnly && (
           <TouchableOpacity 
             style={styles.bookNowBtn}
             onPress={() => navigation.navigate('TechnicianList', {
               requestId: request._id,
               diagnosisData: { aiDiagnosis: request.aiDiagnosis },
               bookingData: request
             })}
           >
              <Zap size={20} color="#FFF" />
              <Text style={styles.bookNowText}>اطلب فني للإصلاح الآن</Text>
           </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

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

      {/* RATING MODAL */}
      <RatingModal 
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onConfirm={handleSubmitReview}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  scrollBody: { padding: 20, paddingBottom: 40 },
  
  // Completed Banner
  completedBanner: { backgroundColor: '#F0FDF4', borderRadius: 20, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#BBF7D0' },
  completedIconRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 15 },
  completedTitle: { fontSize: 16, fontWeight: '900', color: '#166534' },
  rateBtn: { backgroundColor: '#F59E0B', height: 52, borderRadius: 16, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 },
  rateBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  reviewDone: { alignItems: 'center', paddingTop: 5 },
  reviewStarsRow: { flexDirection: 'row-reverse', gap: 4, marginBottom: 8 },
  reviewDoneText: { fontSize: 13, fontWeight: '700', color: '#166534' },
  reviewComment: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 6, fontStyle: 'italic', textAlign: 'center' },

  imageSection: { marginBottom: 25 },
  imageScroll: { marginTop: 10 },
  imageWrapper: { width: 120, height: 80, borderRadius: 16, marginLeft: 12, backgroundColor: '#f1f5f9', overflow: 'hidden' },
  evidenceImage: { width: '100%', height: '100%' },
  
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#94A3B8', textAlign: 'right', marginBottom: 12, textTransform: 'uppercase' },
  
  techCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#F1F5F9', elevation: 4, shadowColor: '#4F46E5', shadowOpacity: 0.05 },
  techHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 15 },
  techAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  techInfo: { flex: 1, marginRight: 15, alignItems: 'flex-end' },
  techName: { fontSize: 17, fontWeight: '900', color: '#1E293B' },
  verifiedRow: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: 4, gap: 4 },
  verifiedText: { fontSize: 12, color: '#10B981', fontWeight: '700' },
  
  techActions: { flexDirection: 'row-reverse', gap: 12, marginTop: 5 },
  callBtn: { flex: 1, backgroundColor: '#4F46E5', height: 48, borderRadius: 14, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center' },
  callBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  cancelBtn: { paddingHorizontal: 15, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '700' },

  infoCard: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#F1F5F9' },
  infoRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  infoValue: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  mapBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', paddingVertical: 12, borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  mapBtnText: { color: '#4F46E5', fontWeight: '800', fontSize: 14 },
  
  otpBox: { backgroundColor: '#F5F3FF', padding: 15, borderRadius: 16, marginBottom: 15, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#DDD6FE' },
  otpLabel: { fontSize: 11, fontWeight: '700', color: '#6D28D9', marginBottom: 10 },
  otpCodeContainer: { flexDirection: 'row', gap: 10 },
  otpDigit: { width: 40, height: 45, backgroundColor: '#FFF', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E9D5FF', elevation: 2 },
  otpDigitText: { fontSize: 20, fontWeight: '900', color: '#4F46E5' },
  sendOtpBtn: { backgroundColor: '#4F46E5', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, marginTop: 15 },
  sendOtpBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  bookNowBtn: { backgroundColor: '#4F46E5', height: 64, borderRadius: 22, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 8, shadowColor: '#4F46E5', shadowOpacity: 0.3 },
  bookNowText: { color: '#FFF', fontSize: 16, fontWeight: '900' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  closeModal: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 },
});
