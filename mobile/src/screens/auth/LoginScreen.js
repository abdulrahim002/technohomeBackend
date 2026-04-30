import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Phone, ArrowLeft, LogIn } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

/**
 * LoginScreen - Premium Authentication Interface.
 * Role: Provides a secure and beautiful entry point for both Clients and Technicians.
 */
export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert("تنبيه", "يرجى إدخال رقم الهاتف وكلمة المرور");
      return;
    }

    setLoading(true);
    const result = await signIn(phone, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert("فشل الدخول", result.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.keyboardView}
        >
          <View style={styles.header}>
             <View style={styles.logoCircle}>
                <LogIn size={40} color="#4F46E5" />
             </View>
             <Text style={styles.title}>Techno Home</Text>
             <Text style={styles.subtitle}>الرفيق الأول لصيانة منزلك بذكاء</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
               <Phone size={20} color="#94A3B8" style={styles.inputIcon} />
               <TextInput 
                 placeholder="رقم الهاتف" 
                 keyboardType="phone-pad"
                 style={styles.input} 
                 value={phone}
                 onChangeText={setPhone}
                 placeholderTextColor="#94A3B8"
               />
            </View>

            <View style={styles.inputWrapper}>
               <Lock size={20} color="#94A3B8" style={styles.inputIcon} />
               <TextInput 
                 placeholder="كلمة المرور" 
                 style={styles.input} 
                 secureTextEntry
                 value={password}
                 onChangeText={setPassword}
                 placeholderTextColor="#94A3B8"
               />
            </View>

            <TouchableOpacity 
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>نسيت كلمة المرور؟</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginBtn, loading && styles.disabledBtn]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
               <TouchableOpacity onPress={() => navigation.navigate('RoleSelection')}>
                  <Text style={styles.linkText}>سجل الآن</Text>
               </TouchableOpacity>
               <Text style={styles.footerText}>ليس لديك حساب؟ </Text>
            </View>
          </View>

        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1, paddingHorizontal: 30, justifyContent: 'center' },
  
  header: { alignItems: 'center', marginBottom: 50 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '900', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: '600', color: '#64748B' },

  form: { width: '100%' },
  inputWrapper: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    borderRadius: 20, 
    paddingHorizontal: 20, 
    height: 64, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  inputIcon: { marginLeft: 15 },
  input: { flex: 1, textAlign: 'right', fontSize: 16, fontWeight: '700', color: '#1E293B' },

  forgotBtn: { alignSelf: 'flex-start', marginBottom: 30 },
  forgotText: { color: '#4F46E5', fontWeight: '800', fontSize: 14 },

  loginBtn: { 
    backgroundColor: '#4F46E5', 
    height: 64, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { height: 5 }
  },
  loginBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  disabledBtn: { backgroundColor: '#C7D2FE' },

  footer: { flexDirection: 'row-reverse', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#64748B', fontWeight: '600' },
  linkText: { color: '#4F46E5', fontWeight: '800' }
});
