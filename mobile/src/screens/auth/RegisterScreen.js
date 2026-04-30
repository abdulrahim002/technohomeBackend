import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { getCities } from '../../api/lookupService';
import { register } from '../../api/authService';

/**
 * شاشة إنشاء الحساب المحسنة
 * الدور: جلب المدن من السيرفر، اختيار المدينة، وإرسال البيانات للتسجيل.
 */
export default function RegisterScreen({ navigation }) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    city: '' // سيخزن هذا الـ ID الخاص بالمدينة
  });
  const [selectedCityName, setSelectedCityName] = useState('اختر مدينتك');

  // جلب المدن عند فتح الشاشة
  useEffect(() => {
    const fetchCities = async () => {
      const data = await getCities();
      setCities(data);
    };
    fetchCities();
  }, []);

  const handleRegister = async () => {
    if (!formData.firstName || !formData.phone || !formData.city) {
      Alert.alert("تنبيه", "يرجى إكمال الحقول الأساسية واختيار المدينة");
      return;
    }

    setLoading(true);
    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      Alert.alert("نجاح", "تم إنشاء حسابك بنجاح! يمكنك سجل الدخول الآن.");
      navigation.navigate('Login');
    } else {
      Alert.alert("خطأ", result.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>إنشاء حساب جديد</Text>
      
      <TextInput 
        placeholder="الاسم الأول" 
        style={styles.input}
        onChangeText={(val) => setFormData({...formData, firstName: val})}
      />
      
      <TextInput 
        placeholder="اسم العائلة" 
        style={styles.input}
        onChangeText={(val) => setFormData({...formData, lastName: val})}
      />
      
      <TextInput 
        placeholder="رقم الهاتف" 
        keyboardType="phone-pad"
        style={styles.input}
        onChangeText={(val) => setFormData({...formData, phone: val})}
      />

      <TextInput 
        placeholder="كلمة المرور" 
        secureTextEntry
        style={styles.input}
        onChangeText={(val) => setFormData({...formData, password: val})}
      />

      {/* اختيار المدينة بصورة بسيطة */}
      <Text style={styles.label}>المدينة:</Text>
      <View style={styles.cityGrid}>
        {cities.map((city) => (
          <TouchableOpacity 
            key={city._id} 
            style={[
              styles.cityButton, 
              formData.city === city._id && styles.citySelected
            ]}
            onPress={() => {
              setFormData({...formData, city: city._id});
              setSelectedCityName(city.nameAr);
            }}
          >
            <Text style={formData.city === city._id ? styles.textWhite : null}>
              {city.nameAr}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ marginTop: 20 }}>
        <Button 
          title={loading ? "جاري المعالجة..." : "تسجيل الحساب"} 
          color="#2563eb" 
          onPress={handleRegister} 
          disabled={loading}
        />
      </View>
      
      <Text 
        style={styles.link} 
        onPress={() => navigation.goBack()}
      >
        لديك حساب بالفعل؟ سجل دخول
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 40, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  label: { textAlign: 'right', marginBottom: 10, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#eee', padding: 12, marginBottom: 15, borderRadius: 8, textAlign: 'right' },
  cityGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  cityButton: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, minWidth: 80, alignItems: 'center' },
  citySelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  textWhite: { color: '#fff' },
  link: { textAlign: 'center', marginTop: 30, color: '#666' }
});
