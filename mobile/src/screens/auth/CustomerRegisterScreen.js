import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Phone, Lock, ChevronLeft, ArrowRight } from 'lucide-react-native';
import axios from 'axios';

import { API_URL } from '../../config/constants';
import useAuthStore from '../../store/useAuthStore';
import LoadingOverlay from '../../components/common/LoadingOverlay';

/**
 * شاشة تسجيل العميل (Customer Register Screen)
 * الدور: تسجيل حساب جديد للعميل في المنصة.
 * هذه الشاشة تسمح للعميل بإدخال بياناته الشخصية (الاسم، المدينة، الهاتف، كلمة المرور) وإنشاء حساب جديد.
 *  
 */ 
const CustomerRegisterScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCities, setShowCities] = useState(false);
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', password: ''
  });

  useEffect(() => {
    axios.get(`${API_URL}/service-requests/lookups/cities`)
      .then(res => setCities(res.data.data.cities))
      .catch(err => console.log(err));
  }, []);

  const handleRegister = async () => {
    if (!form.firstName || !form.lastName || !form.phone || !form.password || !selectedCity) {
      return Alert.alert('تنبيه', 'يرجى ملء كافة البيانات المطلوبة واختيار المدينة');
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        ...form,
        role: 'customer',
        city: selectedCity
      });
      
      const { token, user } = res.data.data;
      setAuth(token, user);
    } catch (err) {
      Alert.alert('فشل التسجيل', err.response?.data?.message || 'حدث خطأ غير متوقع');
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft color="#1E293B" size={24} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>حساب جديد</Text>
            <Text style={styles.subtitle}>انضم إلينا واستمتع بخدمات صيانة مميزة</Text>
          </View>

          <View style={styles.row}>
             <View style={{ flex: 1 }}>{renderInput(User, "الكنية", "lastName")}</View>
             <View style={{ flex: 1, marginLeft: 12 }}>{renderInput(User, "الاسم", "firstName")}</View>
          </View>

          {renderInput(Phone, "رقم الهاتف", "phone", { keyboardType: 'phone-pad' })}
          {renderInput(Lock, "كلمة المرور", "password", { secureTextEntry: true })}

          <Text style={styles.label}>مدينة السكن</Text>
          <TouchableOpacity 
            onPress={() => setShowCities(!showCities)}
            style={styles.citySelector}
          >
             <Text style={styles.citySelectorText}>
                {cities.find(c => c._id === selectedCity)?.nameAr || 'اختر مدينتك'}
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

          <TouchableOpacity 
            onPress={handleRegister}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>إنشاء الحساب</Text>
            <ArrowRight size={20} color="white" />
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1, paddingHorizontal: 32 },
  backButton: { marginTop: 24, width: 48, height: 48, backgroundColor: '#f8fafc', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'flex-end', marginTop: 32, marginBottom: 40 },
  title: { fontSize: 30, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 16, color: '#94a3b8', fontWeight: 'bold', marginTop: 8 },
  row: { flexDirection: 'row-reverse', gap: 0 },
  inputContainer: { backgroundColor: '#f8fafc', borderOuterWidth: 1, borderColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: 24, paddingVertical: 20, marginBottom: 16, flexDirection: 'row-reverse', alignItems: 'center' },
  input: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginRight: 12 },
  label: { textAlign: 'right', color: '#94a3b8', fontWeight: 'bold', marginBottom: 12, marginRight: 8 },
  citySelector: { backgroundColor: '#4f46e5', borderRadius: 24, paddingHorizontal: 24, paddingVertical: 20, marginBottom: 16, alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  citySelectorText: { color: 'white', fontWeight: '900', fontSize: 18 },
  cityGrid: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 32, marginBottom: 24, flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', borderOuterWidth: 1, borderColor: '#f1f5f9' },
  cityItem: { margin: 4, px: 20, py: 10, borderRadius: 16, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10 },
  cityItemActive: { backgroundColor: '#4f46e5' },
  cityItemText: { fontWeight: 'bold', color: '#64748b' },
  cityItemTextActive: { color: '#fff' },
  submitButton: { backgroundColor: '#0f172a', borderRadius: 30, marginTop: 24, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 30 },
  submitButtonText: { color: 'white', fontSize: 20, fontWeight: '900', marginLeft: 8 }
});

export default CustomerRegisterScreen;
