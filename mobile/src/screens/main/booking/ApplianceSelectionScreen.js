import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { ChevronRight, Zap } from 'lucide-react-native';
import { APPLIANCE_TYPES } from '../../../config/fixedData';

/**
 * شاشة اختيار الجهاز (Appliance Selection Screen)
 * الدور: عرض أنواع الأجهزة المتاحة للمستخدم لاختيار ما يحتاج صيانته.
 * هذه الشاشة تعرض قائمة بجميع أنواع الأجهزة (مثل الثلاجات، الغسالات، المكيفات) مع أيقونات جذابة.
 *  
 */ 
const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

const ApplianceSelectionScreen = ({ navigation }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('LocationSelection', { specialtyId: item.slug })}
      style={styles.card}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <Text style={styles.cardTitle}>{item.nameAr}</Text>
      <View style={styles.arrowIcon}>
        <ChevronRight size={16} color="#6366F1" strokeWidth={3} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{`أهلاً بك 👋`}</Text>
        <Text style={styles.title}>{`ماذا تريد أن تصلح اليوم؟`}</Text>
      </View>

      <FlatList
        data={APPLIANCE_TYPES}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.fastServiceBanner}>
             <View style={styles.zapCircle}>
                <Zap size={20} color="#FFFFFF" fill="#FFFFFF" />
             </View>
             <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>{`خدمة فورية`}</Text>
                <Text style={styles.bannerSubtitle}>{`أفضل خبراء الصيانة في جيبك`}</Text>
             </View>
          </View>
        )}
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
    paddingBottom: 30,
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 5,
  },
  title: {
    fontSize: 26,
    color: '#0F172A',
    fontWeight: '900',
    textAlign: 'right',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  fastServiceBanner: {
    backgroundColor: '#4F46E5',
    borderRadius: 30,
    padding: 25,
    marginBottom: 30,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  zapCircle: {
    width: 45,
    height: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextContainer: {
    marginRight: 15,
    flex: 1,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: '#F8FAFC',
    borderRadius: 35,
    padding: 20,
    margin: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconContainer: {
    width: 70,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconText: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 10,
  },
  arrowIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default ApplianceSelectionScreen;
