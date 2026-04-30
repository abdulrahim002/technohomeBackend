import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, TextInput, StyleSheet, Image, Linking, Platform } from 'react-native';
import { ChevronLeft, Calendar, MapPin, CheckCircle2, ArrowRight, Phone, MessageSquare, ShieldCheck, Camera, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

import { API_URL } from '../../../config/constants';
import { getApplianceNameAr, getCityNameAr } from '../../../config/fixedData';
import useAuthStore from '../../../store/useAuthStore';
import LoadingOverlay from '../../../components/common/LoadingOverlay';

/**
 * شاشة تأكيد الحجز النهائية (Final Booking Screen)
 * الدور: عرض ملخص الطلب وتأكيد الحجز مع الفني.
 * هذه الشاشة هي الخطوة الأخيرة للعميل قبل تأكيد الحجز.
 * 
 */
const FinalBookingScreen = ({ navigation, route }) => {
  const { selectedTechnician, bookingData } = route.params;
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [addressDetails, setAddressDetails] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('تنبيه', 'نحتاج صلاحية الوصول للصور لإرفاق صورة للجهاز');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleCall = () => {
    const phone = selectedTechnician.phone;
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      let imageUrl = null;
      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', {
          uri: Platform.OS === 'ios' ? selectedImage.uri.replace('file://', '') : selectedImage.uri,
          name: 'problem-image.jpg',
          type: 'image/jpeg',
        });
        const uploadRes = await axios.post(`${API_URL}/service-requests/upload-image`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        imageUrl = uploadRes.data.data.imageUrl;
      }

      await axios.post(`${API_URL}/service-requests`, {
        technician: selectedTechnician._id,
        applianceType: bookingData.relatedSpecialty,
        problemDescription: `طلب صيانة ${getApplianceNameAr(bookingData.relatedSpecialty)}`,
        address: {
           city: bookingData.serviceAddress?.city || 'tripoli',
           details: addressDetails || 'لا يوجد تفاصيل إضافية'
        },
        images: imageUrl ? [imageUrl] : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('تم الطلب بنجاح', 'تم إرسال طلبك للفني. يمكنك التواصل معه الآن عبر الهاتف.', [
        { text: 'العودة للرئيسية', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (err) {
      Alert.alert('خطأ', 'فشل إتمام الحجز، تأكد من الاتصال وحاول مجدداً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LoadingOverlay visible={loading} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{`تأكيد وطلب الصيانة`}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.summaryCard}>
          <View style={styles.techBrief}>
            <View style={styles.techInfo}>
              <Text style={styles.techName}>{`${selectedTechnician.firstName || 'فني'} ${selectedTechnician.lastName || ''}`}</Text>
              <View style={styles.verifiedRow}>
                <ShieldCheck size={12} color="#4F46E5" />
                <Text style={styles.verifiedText}>{`خبير معتمد لدى تكنو هوم`}</Text>
              </View>
            </View>
            <View style={styles.imageContainer}>
               {selectedTechnician.profileImage ? (
                 <Image source={{ uri: selectedTechnician.profileImage }} style={styles.profileImg} />
               ) : (
                 <View style={styles.placeholderImg}><Text style={styles.placeholderText}>{`TH`}</Text></View>
               )}
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={handleCall} style={styles.actionBtnSecondary}>
              <Phone size={20} color="#4F46E5" fill="#4F46E5" />
              <Text style={styles.actionBtnTextSecondary}>{`اتصال`}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnSecondary}>
              <MessageSquare size={20} color="#4F46E5" />
              <Text style={styles.actionBtnTextSecondary}>{`دردشة`}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>{`تفاصيل الخدمة`}</Text>
        </View>

        <View style={styles.detailBox}>
           <View style={styles.detailEntry}>
              <Text style={styles.entryValue}>{getApplianceNameAr(bookingData.relatedSpecialty)}</Text>
              <Text style={styles.entryLabel}>{`نوع الجهاز:`}</Text>
           </View>
           <View style={styles.divider} />
           <View style={styles.detailEntry}>
              <Text style={styles.entryValue}>{getCityNameAr(bookingData.serviceAddress?.city)}</Text>
              <Text style={styles.entryLabel}>{`المدينة:`}</Text>
           </View>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>{`تفاصيل السكن (اختياري)`}</Text>
        </View>
        <TextInput
           placeholder="مثلاً: طريق المطار، بالقرب من جامع ..."
           multiline
           numberOfLines={3}
           value={addressDetails}
           onChangeText={setAddressDetails}
           style={styles.textArea}
           placeholderTextColor="#CBD5E1"
        />

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>{`صورة المشكلة (اختياري)`}</Text>
        </View>

        {selectedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
              <X size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={handlePickImage} style={styles.imagePickerBtn}>
             <Text style={styles.imagePickerText}>{`إرفاق صورة للمشكلة أو للجهاز`}</Text>
             <Camera size={24} color="#64748B" />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          onPress={handleConfirmBooking}
          style={styles.confirmButton}
        >
          <Text style={styles.confirmText}>{`إرسال الطلب الآن`}</Text>
          <ArrowRight size={22} color="white" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingVertical: 15,
  },
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 35,
    padding: 25,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  techBrief: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  techInfo: {
    marginRight: 15,
    alignItems: 'flex-end',
  },
  techName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '700',
    marginLeft: 5,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileImg: {
    width: '100%',
    height: '100%',
  },
  placeholderImg: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#4F46E5',
    fontSize: 24,
    fontWeight: '900',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtnSecondary: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    height: 55,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },
  actionBtnTextSecondary: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
    marginLeft: 10,
  },
  sectionHeader: {
    marginBottom: 15,
    paddingRight: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'right',
  },
  detailBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 30,
  },
  detailEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  entryLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
  },
  entryValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 30,
    padding: 20,
    minHeight: 120,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 35,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  imagePickerBtn: {
    backgroundColor: '#F8FAFC',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 35,
    flexDirection: 'row',
  },
  imagePickerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 10,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 180,
    borderRadius: 30,
    marginBottom: 35,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#4F46E5',
    height: 75,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginRight: 10,
  }
});

export default FinalBookingScreen;
