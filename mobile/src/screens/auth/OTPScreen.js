import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, SafeAreaView, Keyboard, Alert, StyleSheet, Dimensions } from 'react-native';
import { ChevronLeft, ShieldCheck, ArrowRight } from 'lucide-react-native'; 

/**
 * شاشة رمز التحقق (OTP Screen)
 * الدور: التحقق من رمز التحقق المرسل للعميل.
 * هذه الشاشة تسمح للعميل بإدخال رمز التحقق الذي تم إرساله إلى رقم هاتفه.
 *  
 */ 
const { width } = Dimensions.get('window');
const INPUT_SIZE = Math.floor(width / 8); // مقاس ديناميكي لكن ثابت التناسب

const OTPScreen = ({ navigation, route }) => {
  const { phone, devOtp } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);

  useEffect(() => {
    if (devOtp && devOtp.length === 6) {
      setOtp(devOtp.split(''));
    }
  }, [devOtp]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // الانتقال للخانة التالية
    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
    // إخفاء الكيبورد عند الانتهاء
    if (index === 5 && value) {
      Keyboard.dismiss();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length === 6) {
      navigation.navigate('ResetPassword', { phone, otp: code });
    } else {
      Alert.alert('تنبيه', 'الرجاء إدخال الرمز المكون من 6 أرقام');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.header}>
           <View style={styles.iconContainer}>
              <ShieldCheck size={40} color="#4F46E5" />
           </View>
           <Text style={styles.title}>{`تأكيد الرمز`}</Text>
           <Text style={styles.subtitle}>
             {`أدخل الرمز المرسل إلى الرقم ${phone}`}
           </Text>
        </View>

        <View style={styles.otpContainer}>
           {otp.map((digit, index) => (
             <TextInput
               key={index}
               ref={(ref) => (inputs.current[index] = ref)}
               style={[
                 styles.otpInput,
                 digit ? styles.otpInputActive : styles.otpInputInactive
               ]}
               keyboardType="number-pad"
               maxLength={1}
               value={digit}
               selectionColor="#4F46E5"
               onChangeText={(val) => handleOtpChange(val, index)}
               onKeyPress={({ nativeEvent }) => {
                 if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
                   inputs.current[index - 1].focus();
                 }
               }}
             />
           ))}
        </View>

        <TouchableOpacity 
          onPress={handleVerify}
          activeOpacity={0.9}
          style={styles.submitButton}
        >
          <Text style={styles.submitText}>{`تحقق واستمرار`}</Text>
          <ArrowRight size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 30,
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
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#EEF2FF',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
    textAlign: 'center',
    lineHeight: 24,
  },
  otpContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 60,
  },
  otpInput: {
    width: INPUT_SIZE,
    height: 70,
    borderRadius: 20,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
  },
  otpInputActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
  },
  otpInputInactive: {
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    height: 75,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginRight: 10,
  },
});

export default OTPScreen;
