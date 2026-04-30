import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { discoverTechnicians } from '../../api/technicianService';
import { useAuth } from '../../context/AuthContext';

/**
 * شاشة عرض الفنيين المتاحين (Technician List)
 * الدور: عرض الفنيين المناسبين لنوع الجهاز والمدينة.
 * هذه الشاشة تعرض قائمة بالفنيين المتاحين بناءً على نوع الجهاز والمدينة.
 
 */
export default function TechnicianListScreen({ route, navigation }) {
  const { user } = useAuth();
  const { diagnosisData, bookingData, requestId } = route.params;
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب الفنيين بناءً على المدينة ونوع الجهاز
  useEffect(() => {
    const fetchTechs = async () => {
      const applianceTypeId = bookingData.applianceType;
      const cityId = user.city?._id || user.city;
      const data = await discoverTechnicians(applianceTypeId, cityId);
      setTechnicians(data);
      setLoading(false);
    };
    fetchTechs();
  }, []);

  const renderTechCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('FinalBooking', { 
        technician: item,
        diagnosisData,
        bookingData,
        requestId // تمرير الـ ID لضمان التحديث
      })}
    >
      <View style={styles.cardRow}>
        <View style={styles.imagePlaceholder}>
            <Text style={styles.initials}>{item.fullName[0]}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.fullName}</Text>
          <Text style={styles.rating}>⭐ {item.rating || 'جديد'} ({item.reviewCount || 0} تقييم)</Text>
          <Text style={styles.experience}>خبرة {item.yearsOfExperience || 0} سنوات</Text>
          <Text style={styles.phone}>📞 {item.phone}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.selectBtn}
        onPress={() => navigation.navigate('BookingDetails', { 
            technician: item,
            diagnosisData,
            bookingData,
            requestId // تمرير الـ ID لضمان التحديث
          })}
      >
        <Text style={styles.selectText}>حجز موعد</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>أفضل الفنيين المتاحين في منطقتك:</Text>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>جاري البحث عن فنيين...</Text>
        </View>
      ) : (
        <FlatList
          data={technicians}
          keyExtractor={item => item.techId}
          renderItem={renderTechCard}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>عذراً، لا يوجد فنيين متاحين حالياً لهذا النوع من الأجهزة في مدينتك.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 20, textAlign: 'right' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748b' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  cardRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  imagePlaceholder: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  initials: { fontSize: 24, fontWeight: 'bold', color: '#64748b' },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#334155', textAlign: 'right' },
  rating: { fontSize: 14, color: '#f59e0b', textAlign: 'right', marginVertical: 3 },
  experience: { fontSize: 13, color: '#64748b', textAlign: 'right' },
  phone: { fontSize: 13, color: '#2563eb', textAlign: 'right', marginTop: 3 },
  selectBtn: { marginTop: 15, backgroundColor: '#2563eb', padding: 10, borderRadius: 10, alignItems: 'center' },
  selectText: { color: '#fff', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 16 }
});
