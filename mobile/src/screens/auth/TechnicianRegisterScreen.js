import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Phone, Lock, ChevronLeft, Check, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

import { API_URL } from '../../config/constants';
import LoadingOverlay from '../../components/common/LoadingOverlay';
  
/**
 * شاشة تسجيل الفني (Technician Register Screen)
 * الدور: تسجيل حساب جديد للفني في المنصة.
 * هذه الشاشة تسمح للفني بإدخال بياناته الشخصية (الاسم، المدينة، الهاتف، كلمة المرور) وإنشاء حساب جديد.
 *  
 */ 
const TechnicianRegisterScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  
  const [cities, setCities] = useState([]);
  const [appliances, setAppliances] = useState([]);
  const [brands, setBrands] = useState([]);
  
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedSpecs, setSelectedSpecs] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  
  const [showCities, setShowCities] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', password: '', experienceYears: ''
  });

  useEffect(() => {
    fetchLookups();
  }, []);

  const fetchLookups = async () => {
    try {
      const [cityRes, appRes, brandRes] = await Promise.all([
        axios.get(`${API_URL}/service-requests/lookups/cities`),
        axios.get(`${API_URL}/service-requests/lookups/appliances`),
        axios.get(`${API_URL}/service-requests/lookups/brands`)
      ]);
      setCities(cityRes.data.data.cities);
      setAppliances(appRes.data.data.applianceTypes);
      setBrands(brandRes.data.data.brands);
    } catch (err) {
      console.log('Error', err);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const handleRegister = async () => {
    if (!form.firstName || !form.lastName || !form.phone || !form.password || !selectedCity || selectedSpecs.length === 0) {
      return Alert.alert('تنبيه', 'يرجى ملء البيانات واختيار المدينة وتخصص واحد على الأقل');
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(form).forEach(key => data.append(key, form[key]));
      data.append('role', 'technician');
      data.append('city', selectedCity);
      data.append('specialties', JSON.stringify(selectedSpecs));
      data.append('brands', JSON.stringify(selectedBrands));
      data.append('yearsOfExperience', form.experienceYears);

      if (profileImage) {
        const name = profileImage.split('/').pop();
        data.append('profileImage', { uri: profileImage, name, type: 'image/jpeg' });
      }

      await axios.post(`${API_URL}/auth/register`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      Alert.alert('تم إرسال الطلب', 'بياناتك قيد المراجعة حالياً، سنخبرك فور تفعيل حسابك.', [
        { text: 'حسناً', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (Icon, label, field, props = {}) => (
    <View style={styles.inputContainer}>
      <Icon size={18} color="#94A3B8" />
      <TextInput
        placeholder={label}
        value={form[field]}
        onChangeText={v => setForm({ ...form, [field]: v })}
        style={styles.input}
        placeholderTextColor="#CBD5E1"
        textAlign="right"
        {...props}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LoadingOverlay visible={loading} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color="#1E293B" size={24} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>انضم كخبير</Text>
          <Text style={styles.subtitle}>كن جزءاً من فريق الصيانة الأكبر في ليبيا</Text>
        </View>

        <TouchableOpacity onPress={pickImage} style={styles.photoPicker}>
          <View style={styles.photoContainer}>
            {profileImage ? <Image source={{ uri: profileImage }} style={styles.fullImage} /> : <Camera size={32} color="#4F46E5" />}
          </View>
          <Text style={styles.photoText}>إضافة صورة شخصية</Text>
        </TouchableOpacity>

        <View style={styles.row}>
           <View style={{ flex: 1 }}>{renderInput(User, "الكنية", "lastName")}</View>
           <View style={{ flex: 1, marginLeft: 12 }}>{renderInput(User, "الاسم", "firstName")}</View>
        </View>

        {renderInput(Phone, "رقم الهاتف", "phone", { keyboardType: 'phone-pad' })}
        {renderInput(Lock, "كلمة المرور", "password", { secureTextEntry: true })}
        {renderInput(User, "سنوات الخبرة", "experienceYears", { keyboardType: 'numeric' })}

        <Text style={styles.label}>مدينة العمل</Text>
        <TouchableOpacity onPress={() => setShowCities(!showCities)} style={styles.citySelector}>
          <Text style={styles.citySelectorText}>
            {cities.find(c => c._id === selectedCity)?.nameAr || 'اختر المدينة'}
          </Text>
        </TouchableOpacity>

        {showCities && (
          <View style={styles.cityGrid}>
            {cities.map(c => (
              <TouchableOpacity
                key={c._id}
                onPress={() => { setSelectedCity(c._id); setShowCities(false); }}
                style={[styles.cityItem, selectedCity === c._id && styles.cityItemActive]}
              >
                <Text style={[styles.cityItemText, selectedCity === c._id && styles.cityItemTextActive]}>{c.nameAr}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>اختر تخصصاتك</Text>
        <View style={styles.chipGrid}>
          {appliances.map(s => (
            <TouchableOpacity
              key={s._id}
              onPress={() => setSelectedSpecs(prev => prev.includes(s._id) ? prev.filter(x => x !== s._id) : [...prev, s._id])}
              style={[styles.chip, selectedSpecs.includes(s._id) && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedSpecs.includes(s._id) && styles.chipTextActive]}>{s.nameAr}</Text>
              {selectedSpecs.includes(s._id) && <Check size={14} color="white" />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>الماركات التي تدعمها</Text>
        <View style={styles.chipGrid}>
          {brands
            .filter(b => b.applianceTypes?.some(id => selectedSpecs.includes(id._id || id)))
            .map(b => (
              <TouchableOpacity
                key={b._id}
                onPress={() => setSelectedBrands(prev => prev.includes(b._id) ? prev.filter(x => x !== b._id) : [...prev, b._id])}
                style={[styles.chip, styles.chipGreen, selectedBrands.includes(b._id) && styles.chipGreenActive]}
              >
                <Text style={[styles.chipText, selectedBrands.includes(b._id) && styles.chipTextActive]}>{b.nameAr}</Text>
              </TouchableOpacity>
            ))}
        </View>

        <TouchableOpacity onPress={handleRegister} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>إرسال طلب الانضمام</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1, paddingHorizontal: 32 },
  backButton: { marginTop: 24, width: 48, height: 48, backgroundColor: '#f8fafc', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'flex-end', marginTop: 32, marginBottom: 32 },
  title: { fontSize: 30, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 16, color: '#94a3b8', fontWeight: 'bold', marginTop: 8 },
  photoPicker: { alignItems: 'center', marginBottom: 32, alignSelf: 'center' },
  photoContainer: { width: 112, height: 112, backgroundColor: '#eff6ff', borderRadius: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 4, borderColor: '#fff' },
  fullImage: { width: '100%', height: '100%' },
  photoText: { color: '#4f46e5', fontWeight: 'bold', fontSize: 12, marginTop: 12, textAlign: 'center' },
  row: { flexDirection: 'row-reverse' },
  inputContainer: { backgroundColor: '#f8fafc', borderRadius: 24, paddingHorizontal: 24, paddingVertical: 20, marginBottom: 16, flexDirection: 'row-reverse', alignItems: 'center' },
  input: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginRight: 12 },
  label: { textAlign: 'right', color: '#94a3b8', fontWeight: 'bold', marginBottom: 12, marginRight: 8 },
  citySelector: { backgroundColor: '#4f46e5', borderRadius: 24, paddingHorizontal: 24, paddingVertical: 20, marginBottom: 16, alignItems: 'center' },
  citySelectorText: { color: 'white', fontWeight: '900', fontSize: 18 },
  cityGrid: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 32, marginBottom: 24, flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center' },
  cityItem: { margin: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, backgroundColor: '#fff' },
  cityItemActive: { backgroundColor: '#4f46e5' },
  cityItemText: { fontWeight: 'bold', color: '#64748b' },
  cityItemTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 16, textAlign: 'right' },
  chipGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'flex-start', marginBottom: 32 },
  chip: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginBottom: 12, marginLeft: 8, borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  chipGreen: { },
  chipGreenActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  chipText: { fontWeight: 'bold', color: '#64748b', marginRight: 4 },
  chipTextActive: { color: '#fff' },
  submitButton: { backgroundColor: '#0f172a', paddingVertical: 24, borderRadius: 30, alignItems: 'center', marginBottom: 40 },
  submitButtonText: { color: 'white', fontSize: 20, fontWeight: '900', textAlign: 'center' }
});

export default TechnicianRegisterScreen;
