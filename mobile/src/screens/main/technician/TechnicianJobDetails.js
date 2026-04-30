import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions
} from 'react-native';
import { 
  ChevronRight, 
  MapPin, 
  Phone, 
  Navigation as NavigationIcon, 
  CheckCircle2, 
  AlertTriangle,
  Target,
  Wrench,
  X,
  MessageSquare
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useJobDetails } from '../../../hooks/useJobDetails';
import JobStepper from '../../../components/main/JobStepper';
import CompleteJobModal from '../../../components/main/CompleteJobModal';
import { UPLOADS_URL } from '../../../config/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * TechnicianJobDetails - Refactored for Clean Architecture.
 */
const TechnicianJobDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { requestId } = route.params;

  // Local State for Image Viewer
  const [selectedImage, setSelectedImage] = useState(null);

  const {
    request,
    loading,
    actionLoading,
    priceModalVisible,
    setPriceModalVisible,
    finalPrice,
    setFinalPrice,
    notes,
    setNotes,
    handleAction,
    callCustomer,
    openInMaps
  } = useJobDetails(requestId);

  const getActionButton = () => {
    if (!request) return null;
    switch(request.status) {
      case 'waiting_for_confirmation':
        return { label: 'قبول المهمة', color: '#4F46E5', status: 'accepted', icon: <CheckCircle2 size={20} color="white" /> };
      case 'accepted':
        return { label: 'بدأ التحرك للموقع', color: '#0EA5E9', status: 'on_the_way', icon: <NavigationIcon size={20} color="white" /> };
      case 'on_the_way':
        return { label: 'لقد وصلت للموقع', color: '#10B981', status: 'arrived', icon: <MapPin size={20} color="white" /> };
      case 'arrived':
        return { label: 'بدء العمل الفعلي', color: '#F59E0B', status: 'in_progress', icon: <Wrench size={20} color="white" /> };
      case 'in_progress':
        return { label: 'إتمام وإغلاق المهمة', color: '#10B981', status: 'completed', icon: <CheckCircle2 size={20} color="white" /> };
      default: return null;
    }
  };

  const action = getActionButton();

  if (loading || !request) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
           <ChevronRight size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل المهمة</Text>
        <View style={styles.headerActions}>
           <TouchableOpacity 
             style={[styles.backBtn, { marginRight: 10 }]} 
             onPress={() => navigation.navigate('Chat', { 
               requestId: request._id, 
               recipientId: request.customer?._id, 
               recipientName: `${request.customer?.firstName} ${request.customer?.lastName}` 
             })}
           >
              <MessageSquare size={20} color="#4F46E5" />
           </TouchableOpacity>
           <TouchableOpacity style={styles.backBtn} onPress={callCustomer}>
              <Phone size={20} color="#4F46E5" />
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        
        <JobStepper status={request.status} />

        {/* AI Report Card */}
        <View style={styles.reportCard}>
           <View style={styles.reportHeader}>
              <View style={styles.reportBadge}>
                 <Target size={14} color="#FFF" style={{ marginLeft: 6 }} />
                 <Text style={styles.reportBadgeText}>تشخيص الذكاء الاصطناعي</Text>
              </View>
              <AlertTriangle size={20} color="#4F46E5" />
           </View>
           
           <Text style={styles.reportMainText}>{request.aiDiagnosis?.diagnosis || 'لم يتم التشخيص آلياً'}</Text>
           <Text style={styles.reportSubText}>{request.problemDescription}</Text>
           
           {request.images && request.images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                 {request.images.map((img, index) => {
                    const fullUri = img.startsWith('http') ? img : `${UPLOADS_URL}${img.replace(/^\/+/, '')}`;
                    return (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.imageWrapper}
                        onPress={() => setSelectedImage(fullUri)}
                      >
                        <Image 
                          source={{ uri: fullUri }} 
                          style={styles.evidenceImage} 
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    );
                 })}
              </ScrollView>
           )}
        </View>

        {/* Client & Location Card */}
        <Text style={styles.sectionTitle}>بيانات العميل والموقع</Text>
        <View style={styles.infoCard}>
           <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{request.customer?.firstName} {request.customer?.lastName}</Text>
              <Text style={styles.infoLabel}>العميل</Text>
           </View>
           <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{request.serviceAddress?.cityId?.nameAr || 'طرابلس'}</Text>
              <Text style={styles.infoLabel}>المدينة</Text>
           </View>
           <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{request.serviceAddress?.street || 'العنوان غير محدد'}</Text>
              <Text style={styles.infoLabel}>العنوان</Text>
           </View>
           
           <TouchableOpacity style={styles.mapBtn} onPress={openInMaps}>
              <NavigationIcon size={18} color="#4F46E5" style={{ marginLeft: 8 }} />
              <Text style={styles.mapBtnText}>فتح في الخرائط</Text>
           </TouchableOpacity>
        </View>

        {/* Service Details */}
        <Text style={styles.sectionTitle}>تفاصيل الجهاز</Text>
        <View style={styles.deviceCard}>
           <View style={styles.deviceIcon}>
              <Wrench size={24} color="#4F46E5" />
           </View>
           <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{request.applianceType?.nameAr}</Text>
              <Text style={styles.deviceBrand}>{request.brand}</Text>
           </View>
        </View>

      </ScrollView>

      {/* Action Footer */}
      {action && (
        <View style={styles.footer}>
           <TouchableOpacity 
             disabled={actionLoading}
             onPress={() => action.status === 'completed' ? setPriceModalVisible(true) : handleAction(action.status)}
             style={[styles.actionBtn, { backgroundColor: action.color }]}
           >
             {actionLoading ? <ActivityIndicator color="white" /> : (
               <>
                 <Text style={styles.actionBtnText}>{action.label}</Text>
                 {action.icon}
               </>
             )}
           </TouchableOpacity>
        </View>
      )}

      {/* Pricing Modal */}
      <CompleteJobModal 
        visible={priceModalVisible}
        onClose={() => setPriceModalVisible(false)}
        onConfirm={() => handleAction('completed')}
        price={finalPrice}
        setPrice={setFinalPrice}
        notes={notes}
        setNotes={setNotes}
      />

      {/* IMAGE VIEWER MODAL */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.closeModal} onPress={() => setSelectedImage(null)}>
            <X size={32} color="white" />
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullImage} 
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  headerActions: { flexDirection: 'row' },
  scrollBody: { padding: 20, paddingBottom: 120 },
  reportCard: { backgroundColor: '#EEF2FF', borderRadius: 32, padding: 24, marginBottom: 30, borderWidth: 1, borderColor: '#E0E7FF' },
  reportHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  reportBadge: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  reportBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFF' },
  reportMainText: { fontSize: 18, fontWeight: '900', color: '#1E293B', textAlign: 'right', marginBottom: 8, lineHeight: 26 },
  reportSubText: { fontSize: 13, fontWeight: '600', color: '#4F46E5', textAlign: 'right', opacity: 0.8, lineHeight: 20 },
  imageScroll: { marginTop: 20 },
  imageWrapper: { width: 120, height: 80, borderRadius: 16, marginLeft: 12, backgroundColor: '#f1f5f9', overflow: 'hidden' },
  evidenceImage: { width: '100%', height: '100%' },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#94A3B8', textAlign: 'right', marginBottom: 12, textTransform: 'uppercase' },
  infoCard: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#F1F5F9' },
  infoRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  infoValue: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  mapBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', paddingVertical: 12, borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  mapBtnText: { color: '#4F46E5', fontWeight: '800', fontSize: 14 },
  deviceCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  deviceIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
  deviceInfo: { flex: 1, alignItems: 'flex-end' },
  deviceName: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  deviceBrand: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  actionBtn: { height: 60, borderRadius: 20, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { height: 4 } },
  actionBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900', marginLeft: 12 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  closeModal: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 },
});

export default TechnicianJobDetails;
