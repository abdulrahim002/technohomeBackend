import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  SafeAreaView, StatusBar, ActivityIndicator, Image, Modal, TextInput, Alert,
  KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform
} from 'react-native';
import { 
  ChevronRight, Star, ShieldCheck, MapPin, Wrench, 
  CheckCircle, User as UserIcon, Award, Calendar, X
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../api/api';
import { getApplianceTypes, getBrands } from '../../api/lookupService';
import ReliabilityBadge from '../../components/common/ReliabilityBadge';

/**
 * TechnicianProfileScreen - بروفايل الفني العام (للعميل)
 */
export default function TechnicianProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { techId, bookingData, diagnosisData, requestId } = route.params;
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // لحالة الحجز المباشر (عندما لا توجد بيانات مسبقة)
  const [modalVisible, setModalVisible] = useState(false);
  const [appliancesList, setAppliancesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [formConfig, setFormConfig] = useState({
    applianceType: bookingData?.applianceType || bookingData?.relatedSpecialty || '',
    brand: bookingData?.brand || '',
    problemDescription: bookingData?.problemDescription || ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/service-requests/technicians/${techId}/profile`);
        setProfile(res.data.data.profile);
      } catch (e) {
        console.error('Profile fetch error:', e.message);
      } finally {
        setLoading(false);
      }
    };
    const fetchLookups = async () => {
      try {
        const [appData, brandData] = await Promise.all([
          getApplianceTypes(), getBrands()
        ]);
        setAppliancesList(appData);
        setBrandsList(brandData);
      } catch (err) {
        console.error('Lookup fetch error:', err.message);
      }
    };
    fetchProfile();
    fetchLookups();
  }, [techId]);

  const handleBookPress = () => {
    // التحقق هل ينقصنا بيانات هامة (لأن العميل دخل بطريقة البحث المباشر)
    if (!formConfig.applianceType || !formConfig.brand || !formConfig.problemDescription) {
      setModalVisible(true);
    } else {
      proceedToBooking();
    }
  };

  const proceedToBooking = () => {
    setModalVisible(false);
    // دمج البيانات الجديدة مع القديمة لتمريرها لشاشة التأكيد
    const finalBookingData = {
      ...bookingData,
      applianceType: formConfig.applianceType,
      applianceName: appliancesList.find(a => a._id === formConfig.applianceType)?.nameAr,
      brand: formConfig.brand,
      problemDescription: formConfig.problemDescription,
      diagnosisType: 'manual'
    };

    navigation.navigate('FinalBooking', {
      selectedTechnician: profile,
      bookingData: finalBookingData,
      diagnosisData,
      requestId
    });
  };

  if (loading || !profile) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronRight size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ملف الفني</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.avatarLarge}>
            {profile.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={styles.avatarImg} />
            ) : (
              <UserIcon size={50} color="#CBD5E1" />
            )}
          </View>
          <Text style={styles.heroName}>{profile.fullName}</Text>
          
          {profile.isVerified && (
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.verifiedText}>فني موثق ومعتمد</Text>
            </View>
          )}

          {/* Rating Big */}
          <View style={styles.ratingBox}>
            <Text style={styles.ratingBig}>{(profile.rating || 0).toFixed(1)}</Text>
            <View style={styles.starsRow}>
              {[1,2,3,4,5].map(i => (
                <Star 
                  key={i} size={20}
                  color={i <= Math.round(profile.rating) ? "#F59E0B" : "#E2E8F0"}
                  fill={i <= Math.round(profile.rating) ? "#F59E0B" : "transparent"}
                />
              ))}
            </View>
            <Text style={styles.ratingCount}>{profile.reviewCount} تقييم</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
              <CheckCircle size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{profile.completedJobs}</Text>
            <Text style={styles.statLabel}>مهمة مكتملة</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Star size={20} color="#F59E0B" fill="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{profile.reviewCount || 0}</Text>
            <Text style={styles.statLabel}>تقييم عملاء</Text>
          </View>
        </View>

        {/* Reliability Badge */}
        <View style={styles.badgeWrapper}>
          <ReliabilityBadge 
            score={profile.reliabilityScore} 
            completedJobs={profile.completedJobs || 0}
            style={styles.fullWidthBadge}
          />
        </View>

        {/* Specialties */}
        {profile.specialties?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>التخصصات</Text>
            <View style={styles.tagsRow}>
              {profile.specialties.map((s, i) => (
                <View key={i} style={styles.tag}>
                  <Wrench size={12} color="#4F46E5" />
                  <Text style={styles.tagText}>{s.nameAr}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>آخر التقييمات</Text>
          
          {profile.reviews?.length > 0 ? (
            profile.reviews.map((review, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewStars}>
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12}
                        color={s <= review.rating ? "#F59E0B" : "#E2E8F0"}
                        fill={s <= review.rating ? "#F59E0B" : "transparent"}
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewAuthor}>
                    {review.customer?.firstName || 'عميل'} {review.customer?.lastName || ''}
                  </Text>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>"{review.comment}"</Text>
                )}
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString('ar-LY')}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyReviews}>
              <Star size={30} color="#E2E8F0" />
              <Text style={styles.emptyText}>لا توجد تقييمات بعد</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Book Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.bookBtn}
          onPress={handleBookPress}
        >
          <Text style={styles.bookBtnText}>احجز هذا الفني</Text>
        </TouchableOpacity>
      </View>

      {/* Modal لجمع بيانات الجهاز في حال الحجز المباشر */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalBg}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ width: '100%' }}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity style={styles.closeModal} onPress={() => setModalVisible(false)}>
                  <X size={24} color="#1E293B" />
                </TouchableOpacity>
                
                <Text style={styles.modalTitle}>تفاصيل المشكلة</Text>
                <Text style={styles.modalSub}>الرجاء تحديد تفاصيل الجهاز للمتابعة</Text>

                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  style={{ maxHeight: 380 }}
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  <Text style={styles.inputLabel}>نوع الجهاز</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                    {appliancesList.map(app => (
                      <TouchableOpacity 
                        key={app._id}
                        style={[styles.pill, formConfig.applianceType === app._id && styles.pillActive]}
                        onPress={() => setFormConfig({...formConfig, applianceType: app._id})}
                      >
                        <Text style={[styles.pillText, formConfig.applianceType === app._id && styles.pillTextActive]}>
                          {app.nameAr}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.inputLabel}>الماركة</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                    {brandsList.filter(b => b.applianceType === formConfig.applianceType || b.applianceType?._id === formConfig.applianceType || !b.applianceType).map(b => (
                      <TouchableOpacity 
                        key={b._id}
                        style={[styles.pill, formConfig.brand === (b.nameAr || b.nameEn) && styles.pillActive]}
                        onPress={() => setFormConfig({...formConfig, brand: b.nameAr || b.nameEn})}
                      >
                        <Text style={[styles.pillText, formConfig.brand === (b.nameAr || b.nameEn) && styles.pillTextActive]}>
                          {b.nameAr || b.nameEn}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.inputLabel}>وصف سريع للمشكلة</Text>
                  <TextInput 
                    style={styles.textArea}
                    placeholder="مثال: المكيف لا يبرد ويصدر صوتاً"
                    value={formConfig.problemDescription}
                    onChangeText={text => setFormConfig({...formConfig, problemDescription: text})}
                    multiline
                  />

                  <TouchableOpacity 
                    style={[styles.bookBtn, { marginTop: 20 }, (!formConfig.applianceType || !formConfig.brand || formConfig.problemDescription.length < 5) && { backgroundColor: '#CBD5E1' }]}
                    onPress={proceedToBooking}
                    disabled={!formConfig.applianceType || !formConfig.brand || formConfig.problemDescription.length < 5}
                  >
                    <Text style={styles.bookBtnText}>متابعة التأكيد</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  body: { padding: 24, paddingBottom: 120 },

  // Hero
  heroCard: { alignItems: 'center', marginBottom: 25 },
  avatarLarge: { width: 100, height: 100, borderRadius: 35, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 3, borderColor: '#EEF2FF', marginBottom: 15 },
  avatarImg: { width: '100%', height: '100%' },
  heroName: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginBottom: 8 },
  verifiedBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 20 },
  verifiedText: { fontSize: 12, fontWeight: '800', color: '#10B981' },
  ratingBox: { alignItems: 'center' },
  ratingBig: { fontSize: 36, fontWeight: '900', color: '#1E293B', marginBottom: 4 },
  starsRow: { flexDirection: 'row-reverse', gap: 3, marginBottom: 4 },
  ratingCount: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },

  // Stats
  statsGrid: { flexDirection: 'row-reverse', gap: 12, marginBottom: 20 },
  statItem: { flex: 1, backgroundColor: '#FAFBFD', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  badgeWrapper: {
    marginBottom: 25,
    width: '100%',
  },
  fullWidthBadge: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },

  // Section
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B', textAlign: 'right', marginBottom: 12 },
  tagsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  tagText: { fontSize: 12, fontWeight: '800', color: '#4F46E5' },

  // Reviews
  reviewCard: { backgroundColor: '#FAFBFD', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  reviewHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewAuthor: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  reviewStars: { flexDirection: 'row-reverse', gap: 2 },
  reviewComment: { fontSize: 13, fontWeight: '600', color: '#475569', textAlign: 'right', lineHeight: 20, fontStyle: 'italic', marginBottom: 6 },
  reviewDate: { fontSize: 10, fontWeight: '600', color: '#94A3B8', textAlign: 'left' },
  emptyReviews: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginTop: 10 },

  // Bottom
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 20, paddingBottom: 35, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  bookBtn: { backgroundColor: '#4F46E5', height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 12 },
  bookBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  closeModal: { alignSelf: 'flex-start', marginBottom: 10, padding: 5, backgroundColor: '#F8FAFC', borderRadius: 12 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', textAlign: 'right', marginBottom: 5 },
  modalSub: { fontSize: 13, fontWeight: '600', color: '#64748B', textAlign: 'right', marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '800', color: '#1E293B', textAlign: 'right', marginBottom: 10, marginTop: 10 },
  pillScroll: { marginBottom: 15, maxHeight: 45 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: '#F8FAFC', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center' },
  pillActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  pillText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  pillTextActive: { color: '#FFF' },
  textArea: { backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 15, minHeight: 80, textAlign: 'right', fontSize: 14, color: '#1E293B' },
});
