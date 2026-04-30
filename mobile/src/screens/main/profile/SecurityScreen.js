import React, { useState } from 'react';
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
import { ChevronRight, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';
import { updatePassword } from '../../../api/authService';

/**
 * شاشة الأمان وكلمة المرور (Security Screen)
 * الدور: تمكين المستخدم من تغيير كلمة المرور الخاصة به.
 */
export default function SecurityScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // تنفيذ عملية تغيير كلمة المرور
  const handleUpdatePassword = async () => {
    const { oldPassword, newPassword, confirmPassword } = formData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('تنبيه', 'يرجى ملء كافة الحقول');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('خطأ', 'كلمة المرور الجديدة غير متطابقة');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('تنبيه', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    const result = await updatePassword({ oldPassword, newPassword });
    setLoading(false);

    if (result.success) {
      Alert.alert('نجاح', 'تم تغيير كلمة المرور بنجاح');
      navigation.goBack();
    } else {
      Alert.alert('خطأ', result.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronRight size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الأمان وكلمة المرور</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.infoBox}>
           <ShieldCheck size={24} color="#4F46E5" />
           <Text style={styles.infoText}>
             احرص دائماً على اختيار كلمة مرور قوية وغير مكررة لحماية حسابك وبياناتك.
           </Text>
        </View>

        {/* كلمة المرور الحالية */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>كلمة المرور الحالية</Text>
          <View style={styles.inputWrapper}>
            <TouchableOpacity onPress={() => setShowOld(!showOld)}>
              {showOld ? <EyeOff size={20} color="#94A3B8" /> : <Eye size={20} color="#94A3B8" />}
            </TouchableOpacity>
            <TextInput 
              style={styles.input}
              secureTextEntry={!showOld}
              value={formData.oldPassword}
              onChangeText={(val) => setFormData({...formData, oldPassword: val})}
              placeholder="••••••••"
            />
            <Lock size={20} color="#94A3B8" />
          </View>
        </View>

        {/* كلمة المرور الجديدة */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>كلمة المرور الجديدة</Text>
          <View style={styles.inputWrapper}>
             <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              {showNew ? <EyeOff size={20} color="#94A3B8" /> : <Eye size={20} color="#94A3B8" />}
            </TouchableOpacity>
            <TextInput 
              style={styles.input}
              secureTextEntry={!showNew}
              value={formData.newPassword}
              onChangeText={(val) => setFormData({...formData, newPassword: val})}
              placeholder="••••••••"
            />
            <Lock size={20} color="#94A3B8" />
          </View>
        </View>

        {/* تأكيد كلمة المرور */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>تأكيد كلمة المرور الجديدة</Text>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input}
              secureTextEntry={!showNew}
              value={formData.confirmPassword}
              onChangeText={(val) => setFormData({...formData, confirmPassword: val})}
              placeholder="••••••••"
            />
            <Lock size={20} color="#94A3B8" />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, loading && styles.disabledBtn]} 
          onPress={handleUpdatePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveBtnText}>تحديث كلمة المرور</Text>
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
  infoBox: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    backgroundColor: '#EEF2FF', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 30,
    gap: 12
  },
  infoText: { flex: 1, fontSize: 13, color: '#4338CA', lineHeight: 20, textAlign: 'right', fontWeight: '600' },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 8, textAlign: 'right' },
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
  
  saveBtn: { 
    backgroundColor: '#4F46E5', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: 60, 
    borderRadius: 20, 
    marginTop: 20,
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.2
  },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '900' },
  disabledBtn: { backgroundColor: '#94A3B8' }
});
