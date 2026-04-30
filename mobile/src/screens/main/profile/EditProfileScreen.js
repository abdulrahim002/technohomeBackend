import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { ChevronRight, Save, User, Phone, MapPin } from 'lucide-react-native';
import { getCities } from '../../../api/lookupService';
import { updateProfile } from '../../../api/authService';
import useAuthStore from '../../../store/useAuthStore';

/**
 * شاشة تعديل الملف الشخصي (Edit Profile Screen)
 * الدور: السماح للمستخدم بتحديث بياناته (الاسم، الهاتف، المدينة).
 */
export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuthStore();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    city: user?.city?._id || user?.city || ''
  });

  // جلب قائمة المدن المتاحة
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const data = await getCities();
        setCities(data);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    fetchCities();
  }, []);

  // تنفيذ عملية التحديث
  const handleSave = async () => {
    if (!formData.firstName || !formData.phone || !formData.city) {
      Alert.alert('تنبيه', 'يرجى ملء الحقول الأساسية واختيار المدينة');
      return;
    }

    setLoading(true);
    const result = await updateProfile(formData);
    setLoading(true); // تأخير بسيط للإحساس بالتحديث

    if (result.success) {
      updateUser(result.user); // تحديث بيانات المستخدم في الـ Store العالمي
      Alert.alert('نجاح', 'تم تحديث بياناتك بنجاح');
      navigation.goBack();
    } else {
      Alert.alert('خطأ', result.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronRight size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تعديل البيانات</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* حقل الاسم الأول */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>الاسم الأول</Text>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input}
              value={formData.firstName}
              onChangeText={(val) => setFormData({...formData, firstName: val})}
              placeholder="مثال: أحمد"
            />
            <User size={20} color="#94A3B8" />
          </View>
        </View>

        {/* حقل اسم العائلة */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>اسم العائلة</Text>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input}
              value={formData.lastName}
              onChangeText={(val) => setFormData({...formData, lastName: val})}
              placeholder="مثال: علي"
            />
            <User size={20} color="#94A3B8" />
          </View>
        </View>

        {/* حقل رقم الهاتف */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>رقم الهاتف</Text>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input}
              value={formData.phone}
              keyboardType="phone-pad"
              onChangeText={(val) => setFormData({...formData, phone: val})}
              placeholder="09XXXXXXXX"
            />
            <Phone size={20} color="#94A3B8" />
          </View>
        </View>

        {/* اختيار المدينة */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            {fetching && <ActivityIndicator size="small" color="#4F46E5" />}
            <Text style={styles.label}>المدينة</Text>
          </View>
          <View style={styles.cityGrid}>
            {cities.map((city) => (
              <TouchableOpacity 
                key={city._id} 
                style={[
                  styles.cityChip, 
                  formData.city === city._id && styles.cityChipSelected
                ]}
                onPress={() => setFormData({...formData, city: city._id})}
              >
                <Text style={[styles.cityText, formData.city === city._id && styles.cityTextSelected]}>
                  {city.nameAr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, loading && styles.disabledBtn]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Save size={20} color="white" />
              <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFF'
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  
  content: { padding: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 8, textAlign: 'right' },
  labelRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 8 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderRadius: 16, 
    paddingHorizontal: 16,
    height: 56
  },
  input: { flex: 1, textAlign: 'right', fontSize: 15, color: '#1E293B', fontWeight: '600', marginRight: 12 },
  
  cityGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  cityChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    backgroundColor: '#FFF' 
  },
  cityChipSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  cityText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  cityTextSelected: { color: '#FFF' },

  saveBtn: { 
    backgroundColor: '#4F46E5', 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: 60, 
    borderRadius: 20, 
    marginTop: 20,
    gap: 10,
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.2
  },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '900' },
  disabledBtn: { backgroundColor: '#94A3B8' }
});
