import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { MapPin, ChevronLeft, Map } from 'lucide-react-native';
import { LIBYAN_CITIES } from '../../../config/fixedData';

/**
 * شاشة اختيار المدينة (Location Selection Screen 
 * الدور: عرض قائمة المدن الليبية للمستخدم لاختيار المدينة التي يسكن بها.
 * 
 */ 
const LocationSelectionScreen = ({ navigation, route }) => {
  const { specialtyId } = route.params;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('TechnicianList', { specialtyId, cityId: item.id })}
      style={styles.locationCard}
    >
      <View style={styles.pinContainer}>
        <MapPin size={22} color="#4F46E5" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.cityName}>{item.nameAr}</Text>
        <Text style={styles.countryName}>{`ليبيا`}</Text>
      </View>
      <View style={styles.selectionDot} />
    </TouchableOpacity>
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
        <Text style={styles.title}>{`أين تسكن؟`}</Text>
        <Text style={styles.subtitle}>{`اختر مدينتك لنعرض لك خوارزمية أفضل الفنيين القريبين منك`}</Text>
      </View>

      <View style={styles.mapIllustrationContainer}>
         <View style={styles.mapCircle}>
            <Map size={40} color="#4F46E5" strokeWidth={1.5} />
         </View>
      </View>

      <FlatList
        data={LIBYAN_CITIES}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
    alignItems: 'flex-end',
  },
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'right',
    lineHeight: 24,
    marginBottom: 30,
  },
  mapIllustrationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mapCircle: {
    width: 100,
    height: 100,
    backgroundColor: '#EEF2FF',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  listContainer: {
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  locationCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 25,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pinContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cityName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  countryName: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 2,
  },
  selectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
  }
});

export default LocationSelectionScreen;
