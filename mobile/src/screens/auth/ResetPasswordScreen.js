import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, SafeAreaView, Alert, KeyboardAvoidingView, Platform, StyleSheet, ScrollView } from 'react-native';
import { ChevronLeft, Lock, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import axios from 'axios';

import { API_URL } from '../../config/constants';
import LoadingOverlay from '../../components/common/LoadingOverlay';

/**
 * شاشة إعادة تعيين كلمة المرور (Reset Password Screen)
 * الدور: إعادة تعيين كلمة المرور للعميل بعد التحقق من رمز التحقق.
 * هذه الشاشة تسمح للعميل بإدخال كلمة مرور جديدة وتأكيدها.
 *  
 */   
const ResetPasswordScreen = ({ navigation, route }) => {
  const { phone, otp } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async () => {
    if (password.length < 6) {
      Alert.alert('تنبيه', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('تنبيه', 'كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password-otp`, {
        phone,
        otp,
        password
      });
      setIsSuccess(true);
    } catch (err) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تحديث كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconOuter}>
             <CheckCircle2 size={64} color="#10B981" />
          </View>
          <Text style={styles.title}>{`تم التحديث بنجاح!`}</Text>
          <Text style={styles.subtitle}>
             {`كلمة المرور الجديدة جاهزة للاستخدام الآن`}
          </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            style={styles.submitButton}
          >
            <Text style={styles.submitText}>{`تسجيل الدخول`}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LoadingOverlay visible={loading} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color="#1E293B" />
          </TouchableOpacity>

          <Text style={[styles.title, { textAlign: 'right' }]}>{`كلمة مرور جديدة`}</Text>
          <Text style={[styles.subtitle, { textAlign: 'right', marginBottom: 40 }]}>
            {`قم بإنشاء كلمة مرور قوية وسهلة التذكر لحماية حسابك الموثق.`}
          </Text>

          <View style={styles.inputWrapper}>
             <Lock size={20} color="#64748B" />
             <TextInput
               placeholder="كلمة المرور الجديدة"
               secureTextEntry
               style={styles.textInput}
               value={password}
               onChangeText={setPassword}
               placeholderTextColor="#CBD5E1"
             />
          </View>

          <View style={styles.inputWrapper}>
             <Lock size={20} color="#64748B" />
             <TextInput
               placeholder="تأكيد كلمة المرور"
               secureTextEntry
               style={styles.textInput}
               value={confirmPassword}
               onChangeText={setConfirmPassword}
               placeholderTextColor="#CBD5E1"
             />
          </View>

          <TouchableOpacity 
            onPress={handleReset}
            activeOpacity={0.9}
            style={[styles.submitButton, { marginTop: 20 }]}
          >
            <Text style={styles.submitText}>{`تحديث كلمة المرور`}</Text>
            <ArrowRight size={20} color="white" />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  successIconOuter: {
    width: 120,
    height: 120,
    backgroundColor: '#ECFDF5',
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 24,
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 70,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 15,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    height: 75,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginRight: 10,
  },
});

export default ResetPasswordScreen;
