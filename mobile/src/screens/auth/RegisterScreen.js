import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { 
  User, 
  Phone, 
  Lock, 
  MapPin, 
  ChevronLeft, 
  CheckCircle2,
  Navigation2,
  Camera,
  Briefcase,
  Check,
  Plus
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { getCities, getApplianceTypes, getBrands } from '../../api/lookupService';
import { register } from '../../api/authService';
import LoadingOverlay from '../../components/common/LoadingOverlay';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation, route }) {
  // استقبال نوع الدور من البارامترات (default is customer)
  const role = route.params?.role || 'customer';
  const isTech = role === 'technician';

  const [cities, setCities] = useState([]);
  const [appliances, setAppliances] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState([]);
  
  // خاص بالفني
  const [profileImage, setProfileImage] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [selectedSpecs, setSelectedSpecs] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    city: '',
    area: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [citiesData, appsData, brandsData] = await Promise.all([
          getCities(),
          isTech ? getApplianceTypes() : Promise.resolve([]),
          isTech ? getBrands() : Promise.resolve([])
        ]);
        setCities(citiesData);
        if (isTech) {
          setAppliances(appsData);
          setAllBrands(brandsData);
        }
      } catch (e) {
        console.error('Fetch registration data failed', e);
      }
    };
    fetchData();
  }, [isTech]);

  const handleCitySelect = (city) => {
    setFormData({ ...formData, city: city._id, area: '' });
    setSelectedAreas(city.areas || []);
  };

  const pickImage = async (type) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      if (type === 'profile') {
        setProfileImage(result.assets[0].uri);
      } else {
        setCertificates([...certificates, result.assets[0].uri]);
      }
    }
  };

  const handleRegister = async () => {
    const isBaseValid = formData.firstName && formData.phone && formData.city && formData.area && formData.password;
    const isTechValid = isTech ? (selectedSpecs.length > 0) : true;

    if (!isBaseValid || !isTechValid) {
      Alert.alert("تنبيه", "يرجى إكمال كافة البيانات المطلوبة.");
      return;
    }

    setLoading(true);
    try {
      // إذا كان فني نستخدم FormData لرفع الصور
      let submissionData;
      if (isTech) {
        submissionData = new FormData();
        submissionData.append('role', 'technician');
        submissionData.append('firstName', formData.firstName);
        submissionData.append('lastName', formData.lastName);
        submissionData.append('phone', formData.phone);
        submissionData.append('password', formData.password);
        submissionData.append('city', formData.city);
        submissionData.append('area', formData.area);
        submissionData.append('specialties', JSON.stringify(selectedSpecs));
        submissionData.append('brands', JSON.stringify(selectedBrands));

        if (profileImage) {
          const name = profileImage.split('/').pop();
          submissionData.append('profileImage', { uri: profileImage, name, type: 'image/jpeg' });
        }

        certificates.forEach((uri, index) => {
          const name = uri.split('/').pop();
          submissionData.append('certificates', { uri, name, type: 'image/jpeg' });
        });
      } else {
        submissionData = { ...formData, role: 'customer' };
      }

      const result = await register(submissionData);
      if (result.success) {
        if (isTech) {
          Alert.alert("تم الإرسال", "بياناتك قيد المراجعة، سنقوم بتفعيل حسابك قريباً.");
        } else {
          Alert.alert("نجاح", "تم إنشاء حسابك بنجاح!");
        }
        navigation.navigate('Login');
      } else {
        Alert.alert("خطأ", result.message || "فشل التسجيل");
      }
    } catch (err) {
      Alert.alert("خطأ", "حدث خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <LoadingOverlay visible={loading} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ChevronLeft color="#1e293b" size={28} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>{isTech ? 'انضم كفني خبير' : 'إنشاء حساب عميل'}</Text>
              <Text style={styles.subtitle}>{isTech ? 'ابدأ بجني الأرباح مع أكبر شبكة صيانة' : 'انضم إلينا واستمتع بخدمات صيانة مميزة'}</Text>
            </View>
          </View>

          {/* Profile Image (Tech Only) */}
          {isTech && (
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={() => pickImage('profile')} style={styles.avatarWrapper}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Camera color="#4f46e5" size={32} />
                  </View>
                )}
                <View style={styles.cameraIconBadge}>
                  <Plus color="#fff" size={14} />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarLabel}>الصورة الشخصية</Text>
            </View>
          )}

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, {flex: 1}]}>
                <Text style={styles.label}>الاسم الأول</Text>
                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={styles.input}
                    placeholder="أحمد"
                    onChangeText={(val) => setFormData({...formData, firstName: val})}
                  />
                </View>
              </View>
              <View style={{width: 15}} />
              <View style={[styles.inputGroup, {flex: 1}]}>
                <Text style={styles.label}>اللقب</Text>
                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={styles.input}
                    placeholder="علي"
                    onChangeText={(val) => setFormData({...formData, lastName: val})}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>رقم الهاتف</Text>
              <View style={styles.inputWrapper}>
                <Phone size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="09XXXXXXXX"
                  keyboardType="phone-pad"
                  onChangeText={(val) => setFormData({...formData, phone: val})}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>كلمة المرور</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="********"
                  secureTextEntry
                  onChangeText={(val) => setFormData({...formData, password: val})}
                />
              </View>
            </View>


          </View>

          {/* Location Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color="#4f46e5" />
              <Text style={styles.sectionTitle}>موقع العمل / السكن</Text>
            </View>
            
            <Text style={styles.label}>المدينة</Text>
            <View style={styles.chipsContainer}>
              {cities.length > 0 ? cities.map((city) => (
                <TouchableOpacity 
                  key={city._id} 
                  style={[styles.chip, formData.city === city._id && styles.chipActive]}
                  onPress={() => handleCitySelect(city)}
                >
                  <Text style={[styles.chipText, formData.city === city._id && styles.chipTextActive]}>{city.nameAr}</Text>
                </TouchableOpacity>
              )) : <Text style={styles.loadingText}>جاري تحميل المدن...</Text>}
            </View>

            {selectedAreas.length > 0 && (
              <View style={styles.areaBox}>
                <View style={styles.areaHeader}>
                  <Navigation2 size={14} color="#3b82f6" />
                  <Text style={styles.label}>المنطقة / الحي</Text>
                </View>
                <View style={styles.chipsContainer}>
                  {selectedAreas.map((area) => (
                    <TouchableOpacity 
                      key={area._id} 
                      style={[styles.areaChip, formData.area === area._id && styles.areaChipActive]}
                      onPress={() => setFormData({...formData, area: area._id})}
                    >
                      <Text style={[styles.areaChipText, formData.area === area._id && styles.areaChipTextActive]}>{area.nameAr}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Tech Specialties & Brands */}
          {isTech && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Briefcase size={20} color="#4f46e5" />
                <Text style={styles.sectionTitle}>التخصصات والماركات</Text>
              </View>
              
              <Text style={styles.label}>الأجهزة التي تصينها</Text>
              <View style={styles.chipsContainer}>
                {appliances.length > 0 ? appliances.map(app => (
                  <TouchableOpacity 
                    key={app._id} 
                    style={[styles.chip, selectedSpecs.includes(app._id) && styles.chipActive]}
                    onPress={() => setSelectedSpecs(prev => prev.includes(app._id) ? prev.filter(i => i !== app._id) : [...prev, app._id])}
                  >
                    <Text style={[styles.chipText, selectedSpecs.includes(app._id) && styles.chipTextActive]}>{app.nameAr}</Text>
                    {selectedSpecs.includes(app._id) && <Check size={12} color="#fff" style={{marginLeft: 5}} />}
                  </TouchableOpacity>
                )) : <Text style={styles.loadingText}>جاري تحميل التخصصات...</Text>}
              </View>

              <Text style={styles.label}>الماركات التي تدعمها</Text>
              <View style={styles.chipsContainer}>
                {allBrands.length > 0 ? allBrands
                  .filter(b => b.applianceTypes?.some(id => selectedSpecs.includes(id._id || id)))
                  .map(brand => (
                    <TouchableOpacity 
                      key={brand._id} 
                      style={[styles.areaChip, selectedBrands.includes(brand._id) && styles.areaChipActive]}
                      onPress={() => setSelectedBrands(prev => prev.includes(brand._id) ? prev.filter(i => i !== brand._id) : [...prev, brand._id])}
                    >
                      <Text style={[styles.areaChipText, selectedBrands.includes(brand._id) && styles.areaChipTextActive]}>{brand.nameAr}</Text>
                    </TouchableOpacity>
                )) : <Text style={styles.loadingText}>اختر تخصصاً أولاً...</Text>}
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>الشهادات وأعمال سابقة</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.certScroll}>
                <TouchableOpacity onPress={() => pickImage('cert')} style={styles.addCertBtn}>
                  <Plus color="#4f46e5" size={24} />
                  <Text style={styles.addCertText}>إضافة</Text>
                </TouchableOpacity>
                {certificates.map((uri, i) => (
                  <View key={i} style={styles.certWrapper}>
                    <Image source={{ uri }} style={styles.certImage} />
                    <TouchableOpacity onPress={() => setCertificates(certificates.filter((_, idx) => idx !== i))} style={styles.removeCert}>
                      <Text style={{color: '#fff', fontSize: 10, fontWeight: '900'}}>X</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleRegister}>
            <Text style={styles.submitBtnText}>{isTech ? 'إرسال طلب الانضمام' : 'إنشاء الحساب'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 60 },
  header: { paddingHorizontal: 25, paddingTop: 60, paddingBottom: 20, flexDirection: 'row-reverse', alignItems: 'center' },
  backBtn: { width: 45, height: 45, backgroundColor: '#fff', borderRadius: 15, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTextContainer: { flex: 1, marginRight: 15, alignItems: 'flex-end' },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: '600', textAlign: 'right' },
  avatarSection: { alignItems: 'center', marginVertical: 20 },
  avatarWrapper: { width: 100, height: 100, borderRadius: 35, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', elevation: 4 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 32 },
  avatarPlaceholder: { alignItems: 'center' },
  cameraIconBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#4f46e5', width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarLabel: { marginTop: 10, fontSize: 12, fontWeight: '800', color: '#4f46e5' },
  
  formCard: { backgroundColor: '#fff', marginHorizontal: 25, borderRadius: 25, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 10 },
  sectionCard: { backgroundColor: '#fff', marginHorizontal: 25, marginTop: 20, borderRadius: 25, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 10 },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginRight: 10 },
  
  row: { flexDirection: 'row-reverse' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 8, textAlign: 'right' },
  inputWrapper: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 15, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#e2e8f0' },
  inputIcon: { marginLeft: 10 },
  input: { flex: 1, height: '100%', textAlign: 'right', fontSize: 14, fontWeight: '700', color: '#1e293b' },
  
  chipsContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  chip: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row-reverse', alignItems: 'center' },
  chipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  chipText: { fontSize: 13, fontWeight: '800', color: '#64748b' },
  chipTextActive: { color: '#fff' },
  
  areaBox: { backgroundColor: '#eff6ff', padding: 15, borderRadius: 20, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  areaHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, marginBottom: 10 },
  areaChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe' },
  areaChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  areaChipText: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },
  areaChipTextActive: { color: '#fff' },
  
  loadingText: { fontSize: 12, color: '#94a3b8', textAlign: 'right', fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 20 },
  
  certScroll: { flexDirection: 'row-reverse', marginTop: 10 },
  addCertBtn: { width: 70, height: 70, borderRadius: 15, backgroundColor: '#f8fafc', borderStyle: 'dashed', borderWidth: 2, borderColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  addCertText: { fontSize: 10, color: '#4f46e5', fontWeight: '900', marginTop: 4 },
  certWrapper: { width: 70, height: 70, borderRadius: 15, overflow: 'hidden', marginLeft: 10 },
  certImage: { width: '100%', height: '100%' },
  removeCert: { position: 'absolute', top: 5, right: 5, backgroundColor: '#ef4444', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  
  submitBtn: { backgroundColor: '#0f172a', marginHorizontal: 25, height: 65, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 30, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 10 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  tnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  loginLink: {
    marginTop: 25,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  loginLinkBold: {
    color: '#4f46e5',
    fontWeight: '900',
  }
});

