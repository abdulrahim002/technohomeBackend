import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  StyleSheet, 
  SafeAreaView, 
  ActivityIndicator, 
  Linking, 
  Platform,
  ScrollView
} from 'react-native';
import { 
  ChevronLeft, 
  Star, 
  Phone, 
  ShieldCheck, 
  User, 
  Wrench, 
  MapPin, 
  CheckCircle,
  MessageCircle,
  Filter,
  X
} from 'lucide-react-native';
import axios from 'axios';

import { Colors } from '../../constants/Colors';
import { API_URL, UPLOADS_URL } from '../../config/constants';
import { getCityNameAr } from '../../config/fixedData';
import useAuthStore from '../../store/useAuthStore';
import { useAuth } from '../../context/AuthContext';
import { useLookups } from '../../hooks/useLookups';
import ReliabilityBadge from '../../components/common/ReliabilityBadge';

/**
 * TechnicianListScreen - شاشة اكتشاف الفنيين الموحدة
 * توفر تجربة بحث سلسة مع فلاتر أفقية للتصنيفات والمدن.
 */
const TechnicianListScreen = ({ navigation, route }) => {
  const params = route.params || {};
  const { specialtyId, cityId, diagnosisData, bookingData, requestId } = params;
  
  const { token } = useAuthStore();
  const { user } = useAuth();
  const { cities, appliances, loading: lookupsLoading } = useLookups();
  
  // States
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);
  const [activeSpecialty, setActiveSpecialty] = useState(specialtyId || bookingData?.applianceType || null);
  const [activeCity, setActiveCity] = useState(cityId || bookingData?.serviceAddress?.city || null);
  const [activeBrand, setActiveBrand] = useState(null); // للمستقبل إذا أردنا إضافة فلاتر ماركات
  const [activeSort, setActiveSort] = useState(null); // 'distance' | 'rating' | null

  // دالة حساب المسافة الجغرافية بصيغة Haversine
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (
      lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined ||
      lat1 === null || lon1 === null || lat2 === null || lon2 === null ||
      (lat1 === 0 && lon1 === 0) || (lat2 === 0 && lon2 === 0)
    ) {
      return Infinity;
    }
    const R = 6371; // نصف قطر الأرض بالكيلومترات
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // المسافة بالكيلومترات
  };

  // Fetching Technicians
  const fetchTechnicians = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/service-requests/technicians/discover`, {
        params: { 
          applianceTypeId: activeSpecialty, 
          cityId: activeCity 
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const rawTechs = res.data.data.technicians || [];
      const userCoordinates = user?.location?.coordinates;
      const userLon = userCoordinates?.[0];
      const userLat = userCoordinates?.[1];

      console.log(' [DEBUG] User Coordinates:', userCoordinates);

      // حساب المسافة مسبقاً مرة واحدة لكل فني (Performance O(N))
      const mappedTechs = rawTechs.map(tech => {
        const techCoordinates = tech.location?.coordinates;
        const techLon = techCoordinates?.[0];
        const techLat = techCoordinates?.[1];
        const distance = calculateDistance(userLat, userLon, techLat, techLon);
        console.log(` [DEBUG] Tech ${tech.fullName} Coordinates:`, techCoordinates, 'Distance:', distance);
        return { ...tech, distance };
      });

      setTechnicians(mappedTechs);
    } catch (err) {
      console.error('[TechList] Fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, [activeSpecialty, activeCity, token, user]);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  // مصفوفة الفنيين المرتبة ديناميكياً
  const sortedTechnicians = React.useMemo(() => {
    let result = [...technicians];
    if (activeSort === 'distance') {
      result.sort((a, b) => a.distance - b.distance);
    } else if (activeSort === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }
    return result;
  }, [technicians, activeSort]);


  // Filter Pill Component
  const FilterPill = ({ label, active, onPress, icon: Icon }) => (
    <TouchableOpacity 
      style={[styles.pill, active && styles.pillActive]} 
      onPress={onPress}
    >
      {Icon && <Icon size={14} color={active ? '#FFF' : '#64748B'} style={{ marginLeft: 6 }} />}
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => (
    <View style={styles.techCard}>
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => navigation.navigate('TechnicianProfile', { 
          techId: item._id || item.techId,
          bookingData: bookingData || { relatedSpecialty: activeSpecialty, serviceAddress: { city: activeCity } },
          diagnosisData,
          requestId
        })}
        style={styles.cardMain}
      >
        <View style={styles.imageWrapper}>
          {item.profileImage ? (
            <Image 
              source={{ uri: item.profileImage.startsWith('http') ? item.profileImage : `${UPLOADS_URL}${item.profileImage}` }} 
              style={styles.profileImg} 
            />
          ) : (
            <User size={30} color="#CBD5E1" />
          )}
          <View style={[styles.onlineStatus, { backgroundColor: item.isOnline ? '#10B981' : '#CBD5E1' }]} />
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={10} color="#4F46E5" />
                <Text style={styles.verifiedText}>موثق</Text>
              </View>
            )}
            <Text style={styles.nameText} numberOfLines={1}>
              {item.fullName || `${item.firstName || 'فني'} ${item.lastName || ''}`}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{getCityNameAr(item.city)}</Text>
            <MapPin size={10} color="#94A3B8" style={{ marginLeft: 4 }} />
            {item.distance !== undefined && item.distance !== Infinity && (
              <>
                <View style={styles.dot} />
                <Text style={styles.distanceText}>📍 يبعد {item.distance.toFixed(1)} كم</Text>
              </>
            )}
          </View>

          <View style={styles.ratingRow}>
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>{(item.rating || 0).toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({item.reviewCount || 0} تقييم)</Text>
            <View style={styles.dot} />
            <CheckCircle size={10} color="#10B981" />
            <Text style={styles.reviewCount}>{item.completedJobs || 0} مهمة</Text>
          </View>

          <ReliabilityBadge 
            score={item.reliabilityScore} 
            completedJobs={item.completedJobs || 0} 
            style={{ marginTop: 8 }} 
          />
        </View>
      </TouchableOpacity>
    </View>
  );

  const SkeletonCard = () => (
    <View style={styles.techCard}>
      <View style={[styles.cardMain, { opacity: 0.6 }]}>
        <View style={[styles.imageWrapper, { backgroundColor: '#E2E8F0' }]} />
        <View style={styles.infoContainer}>
          <View style={{ width: '60%', height: 18, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 10, alignSelf: 'flex-end' }} />
          <View style={{ width: '40%', height: 12, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 10, alignSelf: 'flex-end' }} />
          <View style={{ width: '70%', height: 12, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 12, alignSelf: 'flex-end' }} />
          <View style={{ width: '100%', height: 25, backgroundColor: '#F1F5F9', borderRadius: 6, alignSelf: 'flex-end' }} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>اكتشف الفنيين</Text>
          <Text style={styles.subtitle}>أفضل الخبراء في منطقتك</Text>
        </View>
      </View>

      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
          <FilterPill 
            label="الكل" 
            active={!activeSpecialty && !activeCity} 
            onPress={() => { setActiveSpecialty(null); setActiveCity(null); }} 
          />
          
          <View style={styles.filterDivider} />
          
          {/* تخصصات */}
          {appliances.map(app => (
            <FilterPill 
              key={app._id || app.id}
              label={app.nameAr}
              active={activeSpecialty === (app._id || app.id)}
              onPress={() => {
                const id = app._id || app.id;
                setActiveSpecialty(activeSpecialty === id ? null : id);
              }}
            />
          ))}

          <View style={styles.filterDivider} />

          {/* مدن */}
          {cities.map(city => (
            <FilterPill 
              key={city._id || city.id}
              label={city.nameAr}
              active={activeCity === (city._id || city.id)}
              onPress={() => {
                const id = city._id || city.id;
                setActiveCity(activeCity === id ? null : id);
              }}
              icon={MapPin}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.quickFiltersWrapper}>
        <TouchableOpacity 
          style={[styles.quickFilterBtn, activeSort === 'distance' && styles.quickFilterBtnActive]} 
          onPress={() => setActiveSort(activeSort === 'distance' ? null : 'distance')}
        >
          <MapPin size={12} color={activeSort === 'distance' ? '#FFF' : '#4F46E5'} style={{ marginLeft: 4 }} />
          <Text style={[styles.quickFilterText, activeSort === 'distance' && styles.quickFilterTextActive]}>📍 الأقرب إليّ</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.quickFilterBtn, activeSort === 'rating' && styles.quickFilterBtnActive]} 
          onPress={() => setActiveSort(activeSort === 'rating' ? null : 'rating')}
        >
          <Star size={12} color={activeSort === 'rating' ? '#FFF' : '#4F46E5'} style={{ marginLeft: 4 }} fill={activeSort === 'rating' ? '#FFF' : 'none'} />
          <Text style={[styles.quickFilterText, activeSort === 'rating' && styles.quickFilterTextActive]}>⭐ الأعلى تقييماً</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <FlatList
          data={[1, 2, 3, 4]} // عرض 4 كروت كعينة أثناء التحميل
          renderItem={() => <SkeletonCard />}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={sortedTechnicians}
          renderItem={renderItem}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Wrench size={60} color="#E2E8F0" strokeWidth={1} />
              <Text style={styles.emptyTitle}>عذراً، لا يوجد فنيون حالياً</Text>
              <Text style={styles.emptySubtitle}>جرب البحث في مدينة أخرى أو تخصص مختلف</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 25,
    paddingTop: 15,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  titleContainer: { flex: 1, marginRight: 15, alignItems: 'flex-end' },
  title: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  
  filtersWrapper: { marginBottom: 15 },
  filtersContainer: { paddingHorizontal: 25, paddingVertical: 5 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row-reverse',
    alignItems: 'center'
  },
  pillActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  pillText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  pillTextActive: { color: '#FFF' },
  filterDivider: { width: 1, height: 20, backgroundColor: '#E2E8F0', marginHorizontal: 8, alignSelf: 'center' },

  listContainer: { paddingHorizontal: 25, paddingBottom: 40 },
  techCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 16,
    flexDirection: 'row-reverse',
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardMain: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center' },
  imageWrapper: {
    width: 65,
    height: 65,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  profileImg: { width: '100%', height: '100%' },
  onlineStatus: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  infoContainer: { flex: 1, alignItems: 'flex-end' },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 4 },
  nameText: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginRight: 6 },
  verifiedBadge: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  verifiedText: { fontSize: 8, fontWeight: '900', color: '#4F46E5', marginRight: 2 },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 6 },
  metaText: { fontSize: 11, color: '#64748B', fontWeight: '700' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CBD5E1', marginHorizontal: 6 },
  ratingRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  ratingText: { fontSize: 12, fontWeight: '900', color: '#1E293B', marginRight: 3 },
  reviewCount: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginRight: 4 },
  
  quickFiltersWrapper: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 25,
    marginBottom: 15,
    gap: 10,
  },
  quickFilterBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quickFilterBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  quickFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  quickFilterTextActive: {
    color: '#FFFFFF',
  },
  distanceText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '700',
  },
  
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#64748B', fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginTop: 15 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }
});

export default TechnicianListScreen;
