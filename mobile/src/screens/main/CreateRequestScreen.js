import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, Alert,
  Image, TouchableOpacity, ActivityIndicator, StatusBar,
  FlatList, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Cpu, Tag, FileText, ChevronLeft, Zap, ArrowRight, X, Wrench, Mic, Play, Square, Trash2 } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useLookups } from '../../hooks/useLookups';
import { analyzeProblem } from '../../api/requestService';
import { useAuth } from '../../context/AuthContext';
import { UPLOADS_URL } from '../../config/constants'; // [+] لبناء روابط الشعارات

/**
 * شاشة إنشاء طلب صيانة — Premium Redesign
 * الدور: جمع البيانات والصور ثم عرض تشخيص الذكاء الاصطناعي.
 */

// [+] دالة مساعدة: بناء عنوان URL كامل لشعار الماركة أو الجهاز
const buildLogoUrl = (logoUrl) => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http')) return logoUrl;
  // دمج الـ UPLOADS_URL الأساسي مع المسار النسبي مع تجنب التكرار
  const base = UPLOADS_URL.endsWith('/') ? UPLOADS_URL.slice(0, -1) : UPLOADS_URL;
  const rel  = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
  return `${base}${rel}`;
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 20) / 3; // 48 is horizontal padding (24 * 2), 20 is total gap (10 * 2)

export default function CreateRequestScreen({ route, navigation }) {
  const { user } = useAuth();
  const { appliances, brands, loading: lookupLoading } = useLookups();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=device, 2=brand, 3=description

  const [formData, setFormData] = useState({
    applianceType: '',
    brand: '',
    problemDescription: '',
  });

  // حالات التسجيل الصوتي
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // إخلاء الموارد عند مغادرة الشاشة
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // بدء التسجيل الصوتي
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('تنبيه', 'يرجى تفعيل صلاحية المايكروفون لتسجيل الصوت');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      Alert.alert('خطأ', 'فشل في بدء التسجيل الصوتي');
    }
  };

  // إيقاف التسجيل الصوتي
  const stopRecording = async () => {
    try {
      setIsRecording(false);
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);

      // تحديث نمط الصوت للتشغيل عبر المكبر الخارجي
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldRouteThroughEarpieceIOS: false,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // تشغيل التسجيل الصوتي
  const playSound = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true, volume: 1.0 }
      );
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          await newSound.setPositionAsync(0); // تصفير الموضع عند انتهاء الصوت
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  // إيقاف تشغيل الصوت
  const stopSound = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        setIsPlaying(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // حذف التسجيل
  const deleteRecording = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      setRecordingUri(null);
      setIsPlaying(false);
    } catch (err) {
      console.error(err);
    }
  };

  // إزالة الكود القديم الخاص بجلب البيانات المسبقة، هذا المسار مخصص للـ AI فقط

  // جلب البيانات يتم عبر الـ hook الآن

  // Filter brands by selected appliance type
  const filteredBrands = formData.applianceType
    ? brands.filter(b => 
        !b.applianceTypes || 
        b.applianceTypes.length === 0 || 
        b.applianceTypes.some(at => (at._id || at) === formData.applianceType)
      )
    : brands;

  const brandData = [
    ...filteredBrands,
    { _id: 'other_brand', nameAr: 'أخرى', nameEn: 'أخرى', isOther: true }
  ];



  const handleAnalyze = async () => {
    if (!formData.applianceType || !formData.brand || (!formData.problemDescription && !recordingUri)) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول واختيار نوع الجهاز والماركة ووصف العطل');
      return;
    }
    setLoading(true);
    const result = await analyzeProblem({
      applianceType: formData.applianceType,
      brand: formData.brand,
      problemDescription: formData.problemDescription,
      audioUri: recordingUri
    });
    setLoading(false);
    navigation.navigate('DiagnosisResult', {
      diagnosisData: result.data,
      timedOut: result.timedOut || false,
      bookingData: {
        ...formData,
        applianceName: appliances.find(a => a._id === formData.applianceType)?.nameAr,
        cityId: user?.city?._id || user?.city,
        diagnosisType: 'ai',
        preComputedDiagnosis: result.data?.aiDiagnosis
      }
    });
  };

  const selectedAppliance = appliances.find(a => a._id === formData.applianceType);
  const selectedBrand = brands.find(b => b.nameEn === formData.brand || b.nameAr === formData.brand);
  const canProceed = formData.applianceType && formData.brand && (formData.problemDescription.length > 5 || recordingUri);

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

          <FlatList
            data={appliances}
            keyExtractor={item => item._id}
            numColumns={3}
            scrollEnabled={false}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => {
              const isSelected = formData.applianceType === item._id;
              return (
                <TouchableOpacity
                  onPress={() => { 
                    setFormData({ ...formData, applianceType: item._id, brand: '' }); 
                    setStep(Math.max(step, 2)); 
                  }}
                  style={[styles.gridCard, isSelected && styles.gridCardActive]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.cardLogoWrapper, isSelected && styles.cardLogoWrapperActive]}>
                    {item.logoUrl ? (
                      <Image
                        source={{ uri: buildLogoUrl(item.logoUrl) }}
                        style={styles.cardLogoImg}
                        resizeMode="contain"
                      />
                    ) : (
                      <Cpu
                        size={28}
                        color={isSelected ? '#4F46E5' : '#94A3B8'}
                      />
                    )}
                  </View>
                  <Text 
                    style={[styles.cardText, isSelected && styles.cardTextActive]}
                    numberOfLines={1}
                  >
                    {item.nameAr}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
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

            <FlatList
              data={brandData}
              keyExtractor={item => item._id}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item }) => {
                const isSelected = formData.brand === item.nameEn;
                return (
                  <TouchableOpacity
                    onPress={() => { 
                      setFormData({ ...formData, brand: item.nameEn }); 
                      setStep(Math.max(step, 3)); 
                    }}
                    style={[styles.gridCard, isSelected && styles.gridCardActive]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.cardLogoWrapper, isSelected && styles.cardLogoWrapperActive]}>
                      {item.isOther ? (
                        <Tag
                          size={28}
                          color={isSelected ? '#10B981' : '#94A3B8'}
                        />
                      ) : item.logoUrl ? (
                        <Image
                          source={{ uri: buildLogoUrl(item.logoUrl) }}
                          style={styles.cardLogoImg}
                          resizeMode="contain"
                        />
                      ) : (
                        <Tag
                          size={28}
                          color={isSelected ? '#10B981' : '#94A3B8'}
                        />
                      )}
                    </View>
                    <Text 
                      style={[styles.cardText, isSelected && styles.cardTextActive]}
                      numberOfLines={1}
                    >
                      {item.nameAr}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
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
              placeholder="اشرح العطل بالتفصيل... أو سجل مقطعاً صوتياً بالأسفل يصف المشكلة"
              placeholderTextColor="#CBD5E1"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              textAlign="right"
              value={formData.problemDescription}
              onChangeText={val => setFormData({ ...formData, problemDescription: val })}
            />

            {/* واجهة تسجيل الملاحظة الصوتية المضافة */}
            <View style={styles.voiceContainer}>
              {!recordingUri ? (
                <TouchableOpacity
                  onPress={isRecording ? stopRecording : startRecording}
                  style={[styles.micButton, isRecording && styles.micButtonActive]}
                  activeOpacity={0.8}
                >
                  {isRecording && <View style={styles.pulseIndicator} />}
                  <Mic size={22} color={isRecording ? '#EF4444' : '#4F46E5'} />
                  <Text style={[styles.micText, isRecording && { color: '#EF4444' }]}>
                    {isRecording ? 'جاري التسجيل... اضغط للإيقاف' : 'أو سجل وصف العطل بصوتك'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.playbackContainer}>
                  <TouchableOpacity
                    onPress={isPlaying ? stopSound : playSound}
                    style={styles.playbackBtn}
                    activeOpacity={0.8}
                  >
                    {isPlaying ? <Square size={14} color="#FFFFFF" fill="#FFFFFF" /> : <Play size={14} color="#FFFFFF" fill="#FFFFFF" />}
                    <Text style={styles.playbackText}>
                      {isPlaying ? 'إيقاف الاستماع' : 'استمع لتسجيلك'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={deleteRecording}
                    style={styles.deleteBtn}
                    activeOpacity={0.8}
                  >
                    <Trash2 size={14} color="#EF4444" />
                    <Text style={styles.deleteText}>حذف التسجيل</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>


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

  gridRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardActive: {
    backgroundColor: '#F5F7FF',
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardLogoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardLogoWrapperActive: {
    backgroundColor: '#EEF2FF',
  },
  cardLogoImg: {
    width: 48,
    height: 48,
  },
  cardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    width: '100%',
  },
  cardTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },

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

  // [+] تنسيقات مسجل الصوت الفاخر
  voiceContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 16,
    marginTop: 12,
  },
  micButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  micButtonActive: {
    borderColor: '#EF4444',
  },
  micText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  playbackContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playbackBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    gap: 8,
  },
  playbackText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  deleteBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
});
