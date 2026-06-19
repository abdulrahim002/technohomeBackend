import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Image,
  FlatList,
  Dimensions
} from 'react-native';
import { useLookups } from '../../hooks/useLookups';
import { searchErrorCode } from '../../api/errorCodeService';
import { Wrench, ShieldAlert, ChevronRight, Search, ChevronLeft, Cpu, Tag } from 'lucide-react-native';
import { UPLOADS_URL } from '../../config/constants';

/**
 * شاشة التشخيص اليدوي (Manual Diagnosis)
 * الدور: تصفية (جهاز -> ماركة -> كود) وعرض الحل المباشر.
 * هذه الشاشة تتيح للمستخدم البحث عن حل لمشكلة معينة عن طريق تحديد نوع الجهاز، الماركة، وكود الخطأ. 
 *  
 */

const buildLogoUrl = (logoUrl) => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http')) return logoUrl;
  const base = UPLOADS_URL.endsWith('/') ? UPLOADS_URL.slice(0, -1) : UPLOADS_URL;
  const rel  = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
  return `${base}${rel}`;
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 20) / 3; // 48 is horizontal padding (24 * 2), 20 is total gap (10 * 2)

export default function ManualDiagnosisScreen({ navigation }) {
  const { appliances, brands, loading } = useLookups();
  const [searching, setSearching] = useState(false);
  
  const [step, setStep] = useState(1); // 1: Device, 2: Brand, 3: Search
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [errorCode, setErrorCode] = useState('');
  const [result, setResult] = useState(null);

  // جلب البيانات يتم عبر الـ hook الآن

  const currentBrands = brands.filter(b => 
    selectedDevice && b.applianceTypes?.some(a => (a._id || a) === selectedDevice._id)
  );

  const handleSearch = async () => {
    if (!errorCode.trim()) return;
    setSearching(true);
    setResult(null);
    const response = await searchErrorCode(selectedDevice._id, selectedBrand._id, errorCode);
    setSearching(false);
    if (response.success) {
      setResult(response.data);
    } else {
      Alert.alert('تنبيه', response.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.main}>
      {/* Header */}
      <View style={styles.header}>
        {step > 1 ? (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtnHeader}>
            <ChevronRight size={24} color="#1E293B" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnHeader}>
            <ChevronRight size={24} color="#1E293B" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>بحث بأكواد الأعطال</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={styles.dots}>
            {[1, 2, 3].map(i => (
              <View key={i} style={[styles.dot, step >= i && styles.dotActive]} />
            ))}
          </View>
          <Text style={styles.stepTitle}>
            {step === 1 ? 'اختر نوع الجهاز' : step === 2 ? 'اختر ماركة الجهاز' : 'ابحث عن الكود'}
          </Text>
        </View>

      {/* Step 1: Device Selection */}
      {step === 1 && (
        <FlatList
          data={appliances}
          keyExtractor={item => item._id}
          numColumns={3}
          scrollEnabled={false}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => {
            const isSelected = selectedDevice?._id === item._id;
            return (
              <TouchableOpacity
                onPress={() => {
                  setSelectedDevice(item);
                  setStep(2);
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
      )}

      {/* Step 2: Brand Selection */}
      {step === 2 && (
        <View>
          <FlatList
            data={currentBrands}
            keyExtractor={item => item._id}
            numColumns={3}
            scrollEnabled={false}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => {
              const isSelected = selectedBrand?._id === item._id;
              return (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedBrand(item);
                    setStep(3);
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
                      <Tag
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
          {currentBrands.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>لا توجد ماركات مسجلة لهذا الجهاز حالياً</Text>
            </View>
          )}
        </View>
      )}

      {/* Step 3: Search Area */}
      {step === 3 && (
        <View>
          <View style={styles.infoSummary}>
             <Text style={styles.summaryText}>{selectedDevice?.nameAr} • {selectedBrand?.nameAr}</Text>
          </View>

          <View style={styles.searchBox}>
            <TextInput 
              style={styles.input}
              placeholder="أدخل كود العطل (مثال: E1, F0...)"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              value={errorCode}
              onChangeText={setErrorCode}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
              {searching ? <ActivityIndicator color="#fff" /> : <Search size={24} color="#fff" />}
            </TouchableOpacity>
          </View>

          {result && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultCode}>{result.code}</Text>
                <Text style={styles.resultTitle}>تفاصيل العطل</Text>
              </View>
              <Text style={styles.description}>{result.description}</Text>
              
              <View style={styles.actionSection}>
                <Text style={styles.actionTitle}>💡 نصيحة للحل السريع:</Text>
                <Text style={styles.actionStep}>{result.actionStep}</Text>
              </View>

              {/* انتقال مباشر لقائمة الفنيين دون المرور بشاشات الذكاء الاصطناعي (Clean Code) */}
              <TouchableOpacity 
                style={styles.requestBtn}
                onPress={() => navigation.navigate('TechnicianList', {
                  bookingData: {
                    applianceType: selectedDevice._id,
                    brand: selectedBrand.nameEn,
                    problemDescription: `كود الخطأ المكتشف: ${result.code} - ${result.description}`,
                    diagnosisType: 'manual'
                  },
                  diagnosisData: {
                    code: result.code,
                    description: result.description,
                    actionStep: result.actionStep
                  }
                })}
              >
                <Text style={styles.requestBtnText}>طلب فني متخصص لهذه المشكلة</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, padding: 24 },
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
  backBtnHeader: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },

  stepIndicator: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  stepTitle: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
  dots: { flexDirection: 'row-reverse', gap: 6 },
  dot: { width: 24, height: 6, borderRadius: 3, backgroundColor: '#e2e8f0' },
  dotActive: { backgroundColor: '#4F46E5', width: 35 },

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
  
  infoSummary: { backgroundColor: '#EEF2FF', padding: 12, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  summaryText: { color: '#4F46E5', fontSize: 14, fontWeight: '800' },

  searchBox: { flexDirection: 'row-reverse', backgroundColor: '#fff', borderRadius: 20, padding: 6, elevation: 4, marginBottom: 25, borderWidth: 1, borderColor: '#F1F5F9' },
  input: { flex: 1, paddingHorizontal: 15, fontSize: 16, textAlign: 'right', fontWeight: '800', color: '#1e293b' },
  searchBtn: { backgroundColor: '#4F46E5', width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  
  resultCard: { backgroundColor: '#fff', borderRadius: 32, padding: 24, elevation: 6, shadowColor: '#4F46E5', shadowOpacity: 0.1 },
  resultHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  resultCode: { fontSize: 26, fontWeight: '900', color: '#4F46E5' },
  resultTitle: { fontSize: 14, color: '#94A3B8', fontWeight: '800' },
  description: { fontSize: 16, color: '#1E293B', fontWeight: '800', lineHeight: 26, textAlign: 'right', marginBottom: 20 },
  actionSection: { backgroundColor: '#F0FDF4', padding: 20, borderRadius: 20, borderRightWidth: 5, borderRightColor: '#10B981', marginBottom: 25 },
  actionTitle: { color: '#166534', fontSize: 13, fontWeight: '900', marginBottom: 8, textAlign: 'right' },
  actionStep: { color: '#15803D', fontSize: 14, fontWeight: '800', textAlign: 'right', lineHeight: 22 },
  
  requestBtn: { backgroundColor: '#1E293B', padding: 20, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  requestBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  
  emptyContainer: { width: '100%', alignItems: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 15, fontWeight: '800' }
});
