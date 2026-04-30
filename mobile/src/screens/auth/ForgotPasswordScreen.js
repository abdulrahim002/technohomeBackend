import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, Alert, StyleSheet, ScrollView } from 'react-native';
import { ChevronLeft, Phone, ArrowRight } from 'lucide-react-native';
import axios from 'axios';

import { API_URL } from '../../config/constants';
import LoadingOverlay from '../../components/common/LoadingOverlay';

/**
 * شاشة نسيت كلمة المرور (Forgot Password Screen)
 * الدور: إعادة تعيين كلمة المرور للعميل.
 * هذه الشاشة تسمح للعميل بإدخال رقم هاتفه لاستلام رمز تحقق وإعادة تعيين كلمة المرور.
 *  
 */   
const ForgotPasswordScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (phone.length < 9) {
      Alert.alert('تنبيه', 'الرجاء إدخال رقم هاتف صحيح');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { phone });
      navigation.navigate('OTP', { 
        phone, 
        devOtp: res.data.otp 
      });
    } catch (err) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل إرسال الرمز، تأكد من الرقم');
    } finally {
      setLoading(false);
    }
  };

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

          <Text style={styles.title}>{`نسيت كلمة المرور؟`}</Text>
          <Text style={styles.subtitle}>
            {`لا تقلق، أدخل رقم هاتفك وسنرسل لك رمزاً لتأمين حسابك مرة أخرى.`}
          </Text>

          <View style={styles.inputWrapper}>
             <Phone size={20} color="#64748B" />
             <TextInput
               placeholder="5xxxxxxxx"
               style={styles.textInput}
               keyboardType="phone-pad"
               maxLength={10}
               autoFocus={true}
               value={phone}
               onChangeText={setPhone}
               placeholderTextColor="#CBD5E1"
             />
          </View>

          <TouchableOpacity 
            onPress={handleSendOTP}
            activeOpacity={0.9}
            style={styles.submitButton}
          >
            <Text style={styles.submitText}>{`إرسال رمز التحقق`}</Text>
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
    textAlign: 'right',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'right',
    lineHeight: 24,
    marginBottom: 50,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 75,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    marginBottom: 40,
  },
  textInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A', // لون أسود داكن وواضح جداً
    marginLeft: 15,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    height: 75,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginRight: 10,
  },
});

export default ForgotPasswordScreen;
