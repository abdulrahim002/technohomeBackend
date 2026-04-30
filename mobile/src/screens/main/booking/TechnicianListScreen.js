import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, SafeAreaView, ActivityIndicator, Linking, Platform } from 'react-native';
import { ChevronLeft, Star, Phone, ShieldCheck, User, Wrench, MapPin } from 'lucide-react-native';
import axios from 'axios';

import { Colors } from '../../../constants/Colors';
import { API_URL } from '../../../config/constants';
import { getCityNameAr } from '../../../config/fixedData';
import useAuthStore from '../../../store/useAuthStore';

/**
 * شاشة عرض الفنيين المتاحين (Technician List Screen)
 * الدور: عرض قائمة بالفنيين المتاحين بناءً على نوع الجهاز والمدينة.
 * هذه الشاشة تعرض قائمة بالفنيين المتاحين بناءً على نوع الجهاز والمدينة.
 *  
 */ 
const TechnicianListScreen = ({ navigation, route }) => {
  const { specialtyId, cityId } = route.params;
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);

  const fetchTechnicians = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/users/technicians`, {
        params: { city: cityId, specialty: specialtyId },
        headers: { Authorization: `Bearer ${token}` }
      });
      setTechnicians(res.data.data.technicians || []);
    } catch (err) {
      console.error('[TechList] Fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, [cityId, specialtyId, token]);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) return;
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          console.log("Don't know how to open URI: " + url);
        }
      });
  };

  const renderItem = ({ item }) => (
    <View style={styles.techCard}>
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => navigation.navigate('FinalBookingScreen', { 
          selectedTechnician: item,
          bookingData: { serviceAddress: { city: cityId }, relatedSpecialty: specialtyId }
        })}
        style={styles.cardMain}
      >
        <View style={styles.imageWrapper}>
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.profileImg} />
          ) : (
            <User size={30} color="#CBD5E1" />
          )}
          <View style={[styles.onlineStatus, { backgroundColor: item.isOnline ? '#10B981' : '#CBD5E1' }]} />
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={10} color="#4F46E5" />
              <Text style={styles.verifiedText}>{`موثق`}</Text>
            </View>
            <Text style={styles.nameText}>{`${item.firstName || 'فني'} ${item.lastName || ''}`}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{`${item.experienceYears || 0} سنوات خبرة`}</Text>
            <View style={styles.dot} />
            <Text style={styles.metaText}>{getCityNameAr(cityId)}</Text>
            <MapPin size={10} color="#94A3B8" style={{ marginLeft: 4 }} />
          </View>

          <View style={styles.ratingRow}>
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>{`4.9`}</Text>
            <Text style={styles.reviewCount}>{`(120 تقييم)`}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.callButton}
        onPress={() => handleCall(item.phone)}
      >
        <Phone size={22} color="#FFFFFF" fill="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>{`الأفضل في ${getCityNameAr(cityId)}`}</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>{`جاري البحث عن خبراء...`}</Text>
        </View>
      ) : (
        <FlatList
          data={technicians}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Wrench size={60} color="#E2E8F0" strokeWidth={1} />
              <Text style={styles.emptyTitle}>{`عذراً، لا يوجد فنيون حالياً`}</Text>
              <Text style={styles.emptySubtitle}>{`جرب البحث في مدينة أخرى أو تخصص مختلف`}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 25,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  listContainer: {
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  techCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    marginBottom: 20,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  imageWrapper: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  profileImg: {
    width: '100%',
    height: '100%',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  infoContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 5,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    marginRight: 8,
  },
  verifiedBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#4F46E5',
    marginRight: 3,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  ratingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E293B',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginRight: 5,
  },
  callButton: {
    width: 50,
    height: 50,
    backgroundColor: '#4F46E5',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: '#64748B',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  }
});

export default TechnicianListScreen;
