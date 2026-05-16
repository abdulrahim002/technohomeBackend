import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, TextInput, StyleSheet, Image, Linking, Platform } from 'react-native';
import { ChevronLeft, Calendar, MapPin, CheckCircle2, ArrowRight, Phone, MessageSquare, ShieldCheck, Camera, X, Search } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Modal } from 'react-native';
import axios from 'axios';

import { API_URL, GOOGLE_MAPS_API_KEY, TIME_SLOTS } from '../../config/constants';
import { getApplianceNameAr, getCityNameAr, getCityCoords, LIBYAN_CITIES } from '../../config/fixedData';
import useAuthStore from '../../store/useAuthStore';
import { useLookups } from '../../hooks/useLookups';
import LoadingOverlay from '../../components/common/LoadingOverlay';

// مهلة التحضير الأدنى بالساعات (يمكن تغييرها من مكان واحد حسب السياسة التشغيلية)
const LEAD_TIME_HOURS = 4;

// دالة موثوقة للحصول على التاريخ والوقت الحالي بتوقيت ليبيا (بدون حسابات UTC يدوية)
const getLibyaDateTime = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Tripoli',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  const parts = formatter.formatToParts(now);
  const get = (type) => parts.find(p => p.type === type)?.value || '0';
  const todayStr = `${get('year')}-${get('month')}-${get('day')}`;
  const currentHour = parseInt(get('hour'), 10);
  const currentMin = parseInt(get('minute'), 10);
  const currentDecimalHour = currentHour + currentMin / 60;
  return { todayStr, currentDecimalHour };
};

/**
 * شاشة تأكيد الحجز النهائية (Final Booking Screen)
 * الدور: عرض ملخص الطلب وتأكيد الحجز مع الفني.
 * هذه الشاشة هي الخطوة الأخيرة للعميل قبل تأكيد الحجز.
 * 
 */
const FinalBookingScreen = ({ navigation, route }) => {
  const { selectedTechnician, bookingData, diagnosisData } = route.params;
  const mapRef = React.useRef(null);
  const modalMapRef = React.useRef(null);
  const { token } = useAuthStore();
  const { cities } = useLookups();
  const [loading, setLoading] = useState(false);
  const [addressDetails, setAddressDetails] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  // إعدادات الخريطة والموقع
  const targetCityId = bookingData?.serviceAddress?.city || bookingData?.cityId;
  
  // محاولة جلب الإحداثيات من المدن الديناميكية أولاً
  const dynamicCity = cities.find(c => (c._id || c.id) === targetCityId);
  const cityCoords = dynamicCity && dynamicCity.latitude 
    ? { latitude: dynamicCity.latitude, longitude: dynamicCity.longitude }
    : getCityCoords(targetCityId);

  const [region, setRegion] = useState({
    ...cityCoords,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [markerCoordinate, setMarkerCoordinate] = useState(null);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // -----------------------------------------
  // نظام إدارة المواعيد (Time Slots)
  // -----------------------------------------
  const [availableDays, setAvailableDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  React.useEffect(() => {
    // حساب الوقت الحالي بتوقيت ليبيا
    const { todayStr, currentDecimalHour } = getLibyaDateTime();

    // فحص: هل اليوم الحالي يملك أي فترة تستوفي شرط الليد تايم (4 ساعات)?
    const todayHasOpenSlot = TIME_SLOTS.some(slot => {
      const slotStartHour = parseInt(slot.id.split('-')[0].split(':')[0], 10);
      return (slotStartHour - currentDecimalHour) >= LEAD_TIME_HOURS;
    });

    const days = [];
    for (let i = 0; i < 8; i++) {
      // تجاوز اليوم الحالي إذا لم تتبق له فترات مفتوحة
      if (i === 0 && !todayHasOpenSlot) continue;

      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateString = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('ar-LY', { weekday: 'short' });
      days.push({ dateString, dayName, dayNum: d.getDate() });
    }
    setAvailableDays(days);
    if (days.length > 0) setSelectedDate(days[0].dateString);
  }, []);

  React.useEffect(() => {
    if (selectedDate && selectedTechnician) {
      fetchUnavailableSlots(selectedDate);
      setSelectedTimeSlot(''); // Reset on date change
    }
  }, [selectedDate, selectedTechnician]);

  const fetchUnavailableSlots = async (dateStr) => {
    setFetchingSlots(true);
    try {
      const techId = selectedTechnician.techId || selectedTechnician._id;
      const res = await axios.get(`${API_URL}/service-requests/technicians/${techId}/unavailable-slots?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnavailableSlots(res.data.data.unavailableSlots || []);
    } catch (e) {
      console.error('Failed to fetch unavailable slots', e);
      setUnavailableSlots([]);
    } finally {
      setFetchingSlots(false);
    }
  };
  // -----------------------------------------

  React.useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('تنبيه', 'يُنصح بتفعيل صلاحية الموقع لتحديد منزلك بدقة على الخريطة');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const currentCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setRegion({
        ...region,
        ...currentCoords
      });
      setMarkerCoordinate(currentCoords);
    })();
  }, []);

  const handleSearch = async () => {
    if (!searchText) return;
    try {
      // محاولة أولى: البحث في المدن المحلية (الديناميكية والثابتة) لسرعة الاستجابة
      const localCity = cities.find(c => searchText.includes(c.nameAr) || c.nameAr.includes(searchText)) || 
                        LIBYAN_CITIES.find(c => searchText.includes(c.nameAr) || c.nameAr.includes(searchText));
      
      if (localCity) {
        const coords = localCity.coords || { latitude: localCity.latitude, longitude: localCity.longitude };
        const newRegion = {
          ...coords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);
        setMarkerCoordinate(coords);
        modalMapRef.current?.animateToRegion(newRegion, 1000);
        return;
      }

      // محاولة ثانية: استخدام Nominatim (OpenStreetMap) كبديل مجاني تماماً لا يتطلب بطاقة مصرفية
      const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: `${searchText}, Libya`,
          format: 'json',
          addressdetails: 1,
          limit: 1,
          'accept-language': 'ar'
        },
        headers: {
          'User-Agent': 'TechnoHomeApp/1.0' // متطلب من OSM Nominatim
        }
      });
      
      if (res.data && res.data.length > 0) {
        const loc = res.data[0];
        const newRegion = {
          latitude: parseFloat(loc.lat),
          longitude: parseFloat(loc.lon),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        setMarkerCoordinate({ latitude: newRegion.latitude, longitude: newRegion.longitude });
        modalMapRef.current?.animateToRegion(newRegion, 1000);
      } else {
        Alert.alert('تنبيه', 'لم نتمكن من العثور على هذا الموقع، حاول كتابة اسم المدينة أو المنطقة بشكل أوضح (مثال: طرابلس، حي الأندلس)');
      }
    } catch (e) {
      Alert.alert('خطأ', 'فشل البحث، يرجى المحاولة لاحقاً أو تحديد الموقع يدوياً على الخريطة');
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('تنبيه', 'نحتاج صلاحية الوصول للصور لإرفاق صورة للجهاز');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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
    if (!markerCoordinate) {
       Alert.alert('تنبيه', 'يرجى تحديد موقع منزلك على الخريطة أولاً لضمان وصول الفني إليك.');
       return;
    }
    if (!selectedDate || !selectedTimeSlot) {
       Alert.alert('تنبيه', 'يرجى اختيار تاريخ ووقت الصيانة المناسب.');
       return;
    }

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
        technicianId: selectedTechnician.techId || selectedTechnician._id,
        applianceType: bookingData.applianceType || bookingData.relatedSpecialty,
        brand: bookingData.brand || 'غير محدد',
        problemDescription: bookingData.problemDescription || `طلب صيانة ${getApplianceNameAr(bookingData.applianceType || bookingData.relatedSpecialty)}`,
        preComputedDiagnosis: diagnosisData?.aiDiagnosis,
        diagnosisType: bookingData.diagnosisType || 'none',
        scheduledDate: selectedDate,
        timeSlot: selectedTimeSlot,
        serviceAddress: {
           cityId: bookingData.cityId || bookingData.serviceAddress?.city || bookingData.serviceAddress?.cityId,
           street: addressDetails || 'لا يوجد تفاصيل إضافية',
           location: {
             type: 'Point',
             coordinates: [markerCoordinate.longitude, markerCoordinate.latitude]
           }
        },
        images: imageUrl ? [imageUrl] : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('تم الطلب بنجاح', 'تم إرسال طلبك للفني. يمكنك متابعة حالة الطلب من قسم "طلباتي".', [
        { 
          text: 'حسناً', 
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'CustomerMain' }],
          })
        }
      ]);
    } catch (err) {
      console.error('Booking confirmation failed:', err.response?.data || err.message);
      const serverMsg = err.response?.data?.message || 'فشل إتمام الحجز، تأكد من البيانات والاتصال وحاول مجدداً';
      Alert.alert('خطأ', serverMsg);
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
        </View>

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>{`تفاصيل الخدمة`}</Text>
        </View>

        <View style={styles.detailBox}>
           <View style={styles.detailEntry}>
              <Text style={styles.entryValue}>{bookingData.applianceName || getApplianceNameAr(bookingData.applianceType || bookingData.relatedSpecialty)}</Text>
              <Text style={styles.entryLabel}>{`نوع الجهاز:`}</Text>
           </View>
           <View style={styles.divider} />
           <View style={styles.detailEntry}>
              <Text style={styles.entryValue}>{bookingData.brand || 'غير محدد'}</Text>
              <Text style={styles.entryLabel}>{`الماركة:`}</Text>
           </View>
        </View>

        {diagnosisData?.aiDiagnosis?.diagnosis && (
          <View style={styles.diagnosisSummary}>
             <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{`ملخص التشخيص`}</Text>
             </View>
             <View style={styles.diagnosisCard}>
                <Text style={styles.diagnosisText}>{diagnosisData.aiDiagnosis.diagnosis}</Text>
             </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>{`موقع المنزل على الخريطة`}</Text>
        </View>

        <View style={styles.mapContainer}>
          <TouchableOpacity 
            style={styles.expandMapBtn} 
            onPress={() => setIsMapModalVisible(true)}
          >
             <Text style={styles.expandText}>تكبير الخريطة وملء الشاشة</Text>
          </TouchableOpacity>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={region}
            onPress={(e) => setMarkerCoordinate(e.nativeEvent.coordinate)}
          >
            {markerCoordinate && (
              <Marker 
                coordinate={markerCoordinate} 
              />
            )}
          </MapView>
          <View style={styles.mapOverlay}>
             <Text style={styles.mapTip}>اضغط لتحديد الموقع أو كبّر الخريطة</Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* اختيار موعد الصيانة (Time Slots) */}
        {/* ============================================================ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Calendar size={20} color="#4F46E5" />
            <Text style={styles.cardTitle}>تحديد الموعد</Text>
          </View>

          <Text style={styles.subLabel}>اختر اليوم</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
            {availableDays.map((day, idx) => {
              const isSelected = selectedDate === day.dateString;
              return (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.dayCard, isSelected && styles.dayCardActive]}
                  onPress={() => setSelectedDate(day.dateString)}
                >
                  <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>{day.dayName}</Text>
                  <Text style={[styles.dayNum, isSelected && styles.dayNumActive]}>{day.dayNum}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.subLabel}>اختر الوقت (لفترة ساعتين)</Text>
          {fetchingSlots ? (
            <Text style={styles.loadingSlots}>جاري التحقق من المواعيد المتاحة...</Text>
          ) : (
            <View style={styles.slotsGrid}>
              {TIME_SLOTS.map(slot => {
                // 1. مشغول من الفني مسبقاً
                const isTechBusy = unavailableSlots.includes(slot.id);

                // 2. فترة منتهية أو لا تستوفي Lead Time (لليوم الحالي فقط)
                const { todayStr, currentDecimalHour } = getLibyaDateTime();
                let isPastOrTooSoon = false;
                if (selectedDate === todayStr) {
                  const slotStartHour = parseInt(slot.id.split('-')[0].split(':')[0], 10);
                  isPastOrTooSoon = (slotStartHour - currentDecimalHour) < LEAD_TIME_HOURS;
                }

                const isUnavailable = isTechBusy || isPastOrTooSoon;
                const isSelected = selectedTimeSlot === slot.id;

                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.slotChip,
                      isSelected && styles.slotChipActive,
                      isUnavailable && styles.slotChipDisabled
                    ]}
                    onPress={() => {
                      if (!isUnavailable) {
                        setSelectedTimeSlot(slot.id);
                      } else {
                        const msg = isPastOrTooSoon
                          ? `هذه الفترة لا تستوفي شرط الحجز (يلزم ${LEAD_TIME_HOURS} ساعات على الأقل).`
                          : 'هذا الموعد محجوز مسبقاً، يرجى اختيار موعد آخر.';
                        Alert.alert('عفواً', msg);
                      }
                    }}
                    activeOpacity={isUnavailable ? 1 : 0.7}
                  >
                    <Text style={[
                      styles.slotChipText,
                      isSelected && styles.slotChipTextActive,
                      isUnavailable && styles.slotChipTextDisabled
                    ]}>
                      {slot.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Location Section */}
        <Modal
          visible={isMapModalVisible}
          animationType="slide"
          onRequestClose={() => setIsMapModalVisible(false)}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsMapModalVisible(false)} style={styles.closeBtn}>
                <X size={24} color="#1E293B" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>حدد موقعك بدقة</Text>
            </View>

            <View style={styles.searchBar}>
               <TextInput
                 placeholder="ابحث عن منطقة أو شارع..."
                 style={styles.searchInput}
                 value={searchText}
                 onChangeText={setSearchText}
                 onSubmitEditing={() => handleSearch()}
               />
               <TouchableOpacity onPress={() => handleSearch()} style={{ padding: 10 }}>
                 <Search size={20} color="#4F46E5" />
               </TouchableOpacity>
            </View>

            <MapView
              ref={modalMapRef}
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={region}
              onPress={(e) => setMarkerCoordinate(e.nativeEvent.coordinate)}
            >
              {markerCoordinate && (
                <Marker 
                  coordinate={markerCoordinate} 
                  draggable
                  onDragEnd={(e) => setMarkerCoordinate(e.nativeEvent.coordinate)}
                />
              )}
            </MapView>
            
            <TouchableOpacity 
              style={styles.confirmMapBtn}
              onPress={() => {
                setIsMapModalVisible(false);
                if (markerCoordinate) {
                  mapRef.current?.animateToRegion({
                    ...markerCoordinate,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }, 500);
                }
              }}
            >
              <Text style={styles.confirmMapText}>تأكيد هذا الموقع</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>{`تفاصيل العنوان (اختياري)`}</Text>
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
  },
  mapContainer: {
    height: 250,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 12,
  },
  mapTip: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  diagnosisSummary: {
    marginBottom: 30,
  },
  diagnosisCard: {
    backgroundColor: '#EEF2FF',
    padding: 20,
    borderRadius: 24,
    borderRightWidth: 4,
    borderRightColor: '#4F46E5',
  },
  diagnosisText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 22,
  },
  expandMapBtn: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 10,
    backgroundColor: 'rgba(79, 70, 229, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  expandText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    height: 50,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 10,
  },
  confirmMapBtn: {
    backgroundColor: '#4F46E5',
    margin: 20,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmMapText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  
  // Time Slots
  daysScroll: { marginTop: 10, marginBottom: 20 },
  dayCard: { width: 60, height: 70, backgroundColor: '#F8FAFC', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  dayCardActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  dayName: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 5 },
  dayNameActive: { color: '#E0E7FF' },
  dayNum: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  dayNumActive: { color: '#FFFFFF' },
  subLabel: { fontSize: 13, fontWeight: '800', color: '#475569', textAlign: 'right', marginBottom: 8 },
  slotsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  slotChip: { width: '48%', backgroundColor: '#F8FAFC', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  slotChipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  slotChipDisabled: { backgroundColor: '#F1F5F9', borderColor: '#F1F5F9', opacity: 0.5 },
  slotChipText: { fontSize: 12, fontWeight: '800', color: '#475569' },
  slotChipTextActive: { color: '#FFF' },
  slotChipTextDisabled: { color: '#94A3B8', textDecorationLine: 'line-through' },
  loadingSlots: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginVertical: 10, fontWeight: '600' }
});

export default FinalBookingScreen;
