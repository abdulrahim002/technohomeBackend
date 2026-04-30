import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, ScrollView, Alert, 
  Image, TouchableOpacity, ActivityIndicator, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Cpu, Tag, FileText, Camera, ChevronLeft, Zap, ArrowRight, X, MapPin } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { getApplianceTypes, getBrands } from '../../api/lookupService';
import { analyzeProblem } from '../../api/requestService';
import { useAuth } from '../../context/AuthContext';

/**
 * شاشة إنشاء طلب صيانة — Premium Redesign
 * الدور: جمع البيانات والصور ثم عرض تشخيص الذكاء الاصطناعي.
 */
export default function CreateRequestScreen({ route, navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [appliances, setAppliances] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [step, setStep] = useState(1); // 1=device, 2=brand, 3=description
  const [location, setLocation] = useState(null);

  const [formData, setFormData] = useState({
    applianceType: '',
    brand: '',
    problemDescription: '',
  });

  // Pre-fill from error code flow
  useEffect(() => {
    if (route.params?.prefilled) {
      const { applianceType, brand, errorCode } = route.params.prefilled;
      setFormData(prev => ({
        ...prev,
        applianceType: applianceType || prev.applianceType,
        brand: brand || prev.brand,
        problemDescription: errorCode 
          ? `لدي مشكلة، يظهر لي كود الخطأ: ${errorCode}` 
          : prev.problemDescription
      }));
      if (applianceType) setStep(2);
      if (brand) setStep(3);
    }
  }, [route.params?.prefilled]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [applianceData, brandData] = await Promise.all([
          getApplianceTypes(),
          getBrands()
        ]);
        setAppliances(applianceData);
        setBrands(brandData);

        // Request Location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation({
            type: 'Point',
            coordinates: [loc.coords.longitude, loc.coords.latitude]
          });
        }
      } catch (err) {
        console.error('Fetch lookup/location counts failed', err);
      }
    };
    fetchData();
  }, []);

  // Filter brands by selected appliance type
  const filteredBrands = formData.applianceType
    ? brands.filter(b => 
        !b.applianceTypes || 
        b.applianceTypes.length === 0 || 
        b.applianceTypes.some(at => (at._id || at) === formData.applianceType)
      )
    : brands;

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setSelectedImages([...selectedImages, ...result.assets.map(a => a.uri)].slice(0, 5));
    }
  };

  const handleAnalyze = async () => {
    if (!formData.applianceType || !formData.brand || !formData.problemDescription) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول واختيار نوع الجهاز والماركة');
      return;
    }
    setLoading(true);
    const result = await analyzeProblem({
      applianceType: formData.applianceType,
      brand: formData.brand,
      problemDescription: formData.problemDescription
    });
    setLoading(false);
    navigation.navigate('DiagnosisResult', {
      diagnosisData: result.data,
      timedOut: result.timedOut || false,
      bookingData: {
        ...formData,
        cityId: user?.city?._id || user?.city,
        location: location, // Pass GPS location
        imagesUris: selectedImages,
        diagnosisType: 'ai'
      }
    });
  };

  const handleDirectBooking = () => {
    if (!formData.applianceType || !formData.brand || !formData.problemDescription) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول');
      return;
    }
    navigation.navigate('DiagnosisResult', {
      isManual: true,
      diagnosisData: {
        aiDiagnosis: {
          diagnosis: `تم إدخال كود الخطأ: ${route.params?.prefilled?.errorCode}`,
          steps: ['تم تشخيص المشكلة يدوياً، يرجى الاستمرار لطلب الفني المختص.']
        }
      },
      timedOut: false,
      bookingData: {
        ...formData,
        cityId: user?.city?._id || user?.city,
        location: location, // Pass GPS location
        imagesUris: selectedImages,
        diagnosisType: 'manual'
      }
    });
  };

  const selectedAppliance = appliances.find(a => a._id === formData.applianceType);
  const selectedBrand = brands.find(b => b.nameEn === formData.brand || b.nameAr === formData.brand);
  const canProceed = formData.applianceType && formData.brand && formData.problemDescription.length > 5;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلب صيانة جديد</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {[1,2,3].map(s => (
          <View key={s} style={styles.progressStep}>
            <View style={[styles.progressDot, step >= s && styles.progressDotActive, step > s && styles.progressDotDone]}>
              {step > s ? (
                <Text style={styles.progressDotText}>✓</Text>
              ) : (
                <Text style={[styles.progressDotText, step < s && { color: '#94A3B8' }]}>{s}</Text>
              )}
            </View>
            {s < 3 && <View style={[styles.progressLine, step > s && styles.progressLineActive]} />}
          </View>
        ))}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* STEP 1: Appliance Type */}
        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={styles.stepIconCircle}>
              <Cpu size={18} color="#4F46E5" />
            </View>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.stepTitle}>نوع الجهاز</Text>
              {selectedAppliance && <Text style={styles.stepSelected}>{selectedAppliance.nameAr}</Text>}
            </View>
          </View>

          <View style={styles.chipGrid}>
            {appliances.map(item => (
              <TouchableOpacity
                key={item._id}
                onPress={() => { setFormData({ ...formData, applianceType: item._id, brand: '' }); setStep(Math.max(step, 2)); }}
                style={[styles.chip, formData.applianceType === item._id && styles.chipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, formData.applianceType === item._id && styles.chipTextActive]}>
                  {item.nameAr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* STEP 2: Brand */}
        {step >= 2 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepIconCircle, { backgroundColor: '#F0FDF4' }]}>
                <Tag size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.stepTitle}>الماركة</Text>
                {formData.brand && <Text style={[styles.stepSelected, { color: '#10B981' }]}>{formData.brand}</Text>}
              </View>
            </View>

            <View style={styles.chipGrid}>
              {filteredBrands.map(brand => (
                <TouchableOpacity
                  key={brand._id}
                  onPress={() => { setFormData({ ...formData, brand: brand.nameEn }); setStep(Math.max(step, 3)); }}
                  style={[styles.chip, styles.chipGreen, formData.brand === brand.nameEn && styles.chipGreenActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, formData.brand === brand.nameEn && styles.chipTextActive]}>
                    {brand.nameAr}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => { setFormData({ ...formData, brand: 'أخرى' }); setStep(Math.max(step, 3)); }}
                style={[styles.chip, styles.chipGreen, formData.brand === 'أخرى' && styles.chipGreenActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, formData.brand === 'أخرى' && styles.chipTextActive]}>أخرى</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: Problem Description + Images */}
        {step >= 3 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepIconCircle, { backgroundColor: '#FFFBEB' }]}>
                <FileText size={18} color="#F59E0B" />
              </View>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.stepTitle}>وصف المشكلة</Text>
                <Text style={styles.stepSub}>كلما كان الوصف دقيقاً، كان التشخيص أفضل</Text>
              </View>
            </View>

            <TextInput
              style={styles.textArea}
              placeholder="اشرح العطل بالتفصيل... مثال: المكيف يعمل لكن لا يبرد، ويصدر صوتاً غريباً"
              placeholderTextColor="#CBD5E1"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              textAlign="right"
              value={formData.problemDescription}
              onChangeText={val => setFormData({ ...formData, problemDescription: val })}
            />

            {/* Image Upload */}
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImages} activeOpacity={0.8}>
              <Camera size={20} color="#4F46E5" />
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.uploadBtnText}>إضافة صور العطل</Text>
                <Text style={styles.uploadBtnSub}>حتى 5 صور — اختياري</Text>
              </View>
              <View style={styles.uploadCount}>
                <Text style={styles.uploadCountText}>{selectedImages.length}/5</Text>
              </View>
            </TouchableOpacity>

            {selectedImages.length > 0 && (
              <View style={styles.imagePreviewRow}>
                {selectedImages.map((uri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity 
                      style={styles.removeImageBtn}
                      onPress={() => setSelectedImages(selectedImages.filter((_, i) => i !== index))}
                    >
                      <X size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CTA Footer */}
      <View style={styles.footer}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <View style={{ marginRight: 12 }}>
              <Text style={styles.loadingTitle}>الذكاء الاصطناعي يحلل المشكلة...</Text>
              <Text style={styles.loadingSub}>قد يستغرق حتى 20 ثانية</Text>
            </View>
          </View>
        ) : route.params?.prefilled?.errorCode ? (
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: '#10B981' }, !canProceed && styles.submitBtnDisabled]}
            onPress={handleDirectBooking}
            disabled={!canProceed}
            activeOpacity={0.9}
          >
            <Text style={styles.submitBtnText}>تأكيد ومتابعة الحجز</Text>
            <ArrowRight size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitBtn, !canProceed && styles.submitBtnDisabled]}
            onPress={handleAnalyze}
            disabled={!canProceed}
            activeOpacity={0.9}
          >
            <Zap size={20} color="white" style={{ marginLeft: 10 }} />
            <Text style={styles.submitBtnText}>ابدأ التشخيص الذكي</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  header: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#1E293B' },

  progressContainer: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40, 
    paddingVertical: 20 
  },
  progressStep: { flexDirection: 'row-reverse', alignItems: 'center', flex: 1 },
  progressDot: { 
    width: 32, height: 32, borderRadius: 16, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#E2E8F0'
  },
  progressDotActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  progressDotDone: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  progressDotText: { fontSize: 12, fontWeight: '900', color: '#4F46E5' },
  progressLine: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 6 },
  progressLineActive: { backgroundColor: '#4F46E5' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 10 },

  stepSection: { marginBottom: 30 },
  stepHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 16 },
  stepIconCircle: { 
    width: 44, height: 44, borderRadius: 14, 
    backgroundColor: '#EEF2FF', 
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0
  },
  stepTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B', textAlign: 'right' },
  stepSelected: { fontSize: 12, fontWeight: '700', color: '#4F46E5', marginTop: 2 },
  stepSub: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 2 },

  chipGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  chip: { 
    paddingHorizontal: 16, paddingVertical: 10, 
    borderRadius: 16, 
    borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF'
  },
  chipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  chipGreen: { borderColor: '#E2E8F0' },
  chipGreenActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  chipTextActive: { color: '#FFFFFF' },

  textArea: { 
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 24, 
    padding: 18, 
    fontSize: 15, fontWeight: '600', color: '#1E293B',
    minHeight: 120,
    marginBottom: 16,
    lineHeight: 24
  },

  uploadBtn: { 
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: '#F8FAFC', 
    borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed',
    borderRadius: 20, padding: 16,
    marginBottom: 16
  },
  uploadBtnText: { fontSize: 14, fontWeight: '800', color: '#1E293B', textAlign: 'right' },
  uploadBtnSub: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
  uploadCount: { 
    backgroundColor: '#EEF2FF', 
    paddingHorizontal: 10, paddingVertical: 4, 
    borderRadius: 10 
  },
  uploadCountText: { fontSize: 12, fontWeight: '900', color: '#4F46E5' },

  imagePreviewRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  imageWrapper: { position: 'relative' },
  previewImage: { width: 72, height: 72, borderRadius: 16, backgroundColor: '#F1F5F9' },
  removeImageBtn: { 
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'white'
  },

  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24, paddingVertical: 24,
    borderTopWidth: 1, borderTopColor: '#F1F5F9'
  },
  loadingBox: { 
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: '#EEF2FF', padding: 18, borderRadius: 20
  },
  loadingTitle: { fontSize: 14, fontWeight: '800', color: '#4F46E5', textAlign: 'right' },
  loadingSub: { fontSize: 11, fontWeight: '600', color: '#818CF8', marginTop: 2 },
  submitBtn: { 
    backgroundColor: '#4F46E5', 
    flexDirection: 'row-reverse', 
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 20,
    elevation: 8, shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 12
  },
  submitBtnDisabled: { backgroundColor: '#C7D2FE', elevation: 0, shadowOpacity: 0 },
  submitBtnText: { color: 'white', fontSize: 17, fontWeight: '900' },
});
