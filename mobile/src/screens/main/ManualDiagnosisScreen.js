import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { getApplianceTypes, getBrands } from '../../api/lookupService';
import { searchErrorCode } from '../../api/errorCodeService';
import { Wrench, ShieldAlert, ChevronRight, Search, ChevronLeft } from 'lucide-react-native';

/**
 * شاشة التشخيص اليدوي (Manual Diagnosis)
 * الدور: تصفية (جهاز -> ماركة -> كود) وعرض الحل المباشر.
 * هذه الشاشة تتيح للمستخدم البحث عن حل لمشكلة معينة عن طريق تحديد نوع الجهاز، الماركة، وكود الخطأ. 
 *  
 */
export default function ManualDiagnosisScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [appliances, setAppliances] = useState([]);
  const [brands, setBrands] = useState([]);
  
  const [step, setStep] = useState(1); // 1: Device, 2: Brand, 3: Search
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [errorCode, setErrorCode] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appData, brandData] = await Promise.all([
        getApplianceTypes(),
        getBrands()
      ]);
      setAppliances(appData);
      setBrands(brandData);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('خطأ', 'فشل تحميل البيانات الأساسية');
    }
  };

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
        <View style={styles.grid}>
          {appliances.map(app => (
            <TouchableOpacity 
              key={app._id} 
              style={styles.card}
              onPress={() => {
                setSelectedDevice(app);
                setStep(2);
              }}
            >
              <View style={styles.cardIcon}>
                <Wrench size={32} color="#2563eb" />
              </View>
              <Text style={styles.cardName}>{app.nameAr}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Step 2: Brand Selection */}
      {step === 2 && (
        <View>
          <View style={styles.grid}>
            {currentBrands.map(brand => (
              <TouchableOpacity 
                key={brand._id} 
                style={styles.card}
                onPress={() => {
                  setSelectedBrand(brand);
                  setStep(3);
                }}
              >
                <View style={styles.cardIcon}>
                  <ShieldAlert size={32} color="#2563eb" />
                </View>
                <Text style={styles.cardName}>{brand.nameAr}</Text>
              </TouchableOpacity>
            ))}
            {currentBrands.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>لا توجد ماركات مسجلة لهذا الجهاز حالياً</Text>
              </View>
            )}
          </View>
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

              <TouchableOpacity 
                style={styles.requestBtn}
                onPress={() => navigation.navigate('CreateRequest', {
                  prefilled: {
                    applianceType: selectedDevice._id,
                    brand: selectedBrand.nameEn,
                    errorCode: result.code,
                    diagnosisType: 'manual'
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

  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 15 },
  card: { 
    width: '47%', 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 24, 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  cardIcon: { width: 64, height: 64, backgroundColor: '#F1F5F9', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  cardName: { fontSize: 15, fontWeight: '800', color: '#334155', textAlign: 'center' },
  
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
