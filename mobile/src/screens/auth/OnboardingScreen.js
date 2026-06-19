import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cpu, Users, ShieldCheck, ChevronLeft, Star, Check, Zap, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'تشخيص ذكي للأعطال',
    description: 'دع الذكاء الاصطناعي يحلل العطل فوراً بمجرد كتابة المشكلة أو تصويرها، ويقترح عليك الحل في ثوانٍ معدودة.',
    color: '#6366F1',
    bg: '#F5F3FF',
    accent: '#8B5CF6',
    type: 'ai'
  },
  {
    id: '2',
    title: 'فنيين معتمدين وموثقين',
    description: 'نخبة من أمهر مهندسي وفنيي الصيانة بالقرب منك، جاهزون لخدمتك فورياً بتقييمات حقيقية وضمان معتمد.',
    color: '#10B981',
    bg: '#ECFDF5',
    accent: '#059669',
    type: 'tech'
  },
  {
    id: '3',
    title: 'صيانة آمنة وضمان حقيقي',
    description: 'خطوات صيانة واضحة ومسجلة بالكامل في التطبيق، مع ضمان حقيقي على كافة القطع والخدمات المقدمة.',
    color: '#F59E0B',
    bg: '#FFFBEB',
    accent: '#D97706',
    type: 'warranty'
  },
];

export default function OnboardingScreen({ navigation, route, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('isFirstLaunch', 'false');
      if (onComplete) {
        onComplete();
      } else if (route?.params?.onComplete) {
        route.params.onComplete();
      } else {
        navigation.replace('Login');
      }
    } catch (error) {
      console.log('Error completing onboarding:', error);
      if (onComplete) {
        onComplete();
      } else {
        navigation.replace('Login');
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    // حماية لتجنب تحديث المؤشر بقيمة غير صحيحة أثناء السحب السريع
    if (index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  };

  // دالة لرسم المشاهد الرسومية المبتكرة (Visual Scenes) بدلاً من الأيقونات العادية
  const renderVisualScene = (type, slideColor, accentColor, bg) => {
    if (type === 'ai') {
      return (
        <View style={styles.sceneWrapper}>
          {/* خلفية مشعة */}
          <View style={[styles.glowCircle, { backgroundColor: slideColor }]} />
          
          <View style={[styles.mainCircle, { borderColor: slideColor, backgroundColor: '#FFFFFF' }]}>
            <Cpu size={56} color={slideColor} />
            {/* مؤشر المسح الذكي */}
            <View style={[styles.scanBar, { backgroundColor: slideColor }]} />
          </View>
          
          {/* كروت تفاعلية طائرة */}
          <View style={[styles.floatingBadge, styles.badgeLeft, styles.shadowPremium]}>
            <Sparkles size={14} color="#6366F1" />
            <Text style={styles.badgeText}>دقة 98%</Text>
          </View>
          <View style={[styles.floatingBadge, styles.badgeRight, styles.shadowPremium]}>
            <Text style={styles.badgeText}>تم الكشف ✓</Text>
          </View>
        </View>
      );
    }
    
    if (type === 'tech') {
      return (
        <View style={styles.sceneWrapper}>
          <View style={[styles.glowCircle, { backgroundColor: slideColor }]} />
          
          {/* دوائر الرادار */}
          <View style={[styles.radarRing1, { borderColor: slideColor }]} />
          <View style={[styles.radarRing2, { borderColor: slideColor }]} />
          
          <View style={[styles.mainCircle, { borderColor: slideColor, backgroundColor: '#FFFFFF' }]}>
            <Users size={52} color={slideColor} />
            <View style={styles.verifiedBadge}>
              <Check size={12} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>
          
          {/* كروت الفنيين الطائرة */}
          <View style={[styles.floatingCard, styles.cardLeft, styles.shadowPremium]}>
            <View style={styles.avatarPlaceholder} />
            <View>
              <Text style={styles.cardTitleText}>م. أحمد خالد</Text>
              <View style={styles.ratingRow}>
                <Star size={10} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>4.9</Text>
              </View>
            </View>
          </View>
          
          <View style={[styles.floatingBadge, styles.badgeRightTech, styles.shadowPremium]}>
            <View style={styles.onlineDot} />
            <Text style={styles.badgeText}>متاح الآن</Text>
          </View>
        </View>
      );
    }
    
    if (type === 'warranty') {
      return (
        <View style={styles.sceneWrapper}>
          <View style={[styles.glowCircle, { backgroundColor: slideColor }]} />
          
          <View style={[styles.mainCircle, { borderColor: slideColor, backgroundColor: '#FFFFFF' }]}>
            <ShieldCheck size={56} color={slideColor} />
          </View>
          
          {/* عناصر الضمان الطائرة */}
          <View style={[styles.floatingBadge, styles.badgeLeftWarranty, styles.shadowPremium]}>
            <Zap size={14} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.badgeText}>ضمان 30 يوم</Text>
          </View>
          
          <View style={[styles.floatingCard, styles.cardRightWarranty, styles.shadowPremium]}>
            <Text style={styles.cardTitleTextBold}>سند صيانة معتمد</Text>
            <Text style={styles.cardSubText}>فاتورة موثقة رقمياً</Text>
          </View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* خلفية جمالية علوية وسفلية خفيفة جداً (Glowing Blurs) */}
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      {/* Header (Skip & Logo) */}
      <View style={styles.header}>
        <Text style={styles.brandLogo}>Techno<Text style={{ color: '#6366F1' }}>Home</Text></Text>
        {currentIndex < slides.length - 1 ? (
          <TouchableOpacity onPress={completeOnboarding} activeOpacity={0.7} style={styles.skipBtn}>
            <Text style={styles.skipText}>تخطي</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      {/* Slides Swiper */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        getItemLayout={(data, index) => (
          { length: width, offset: width * index, index }
        )}
        renderItem={({ item }) => {
          return (
            <View style={styles.slide}>
              {/* Illustration Area */}
              <View style={styles.illustrationArea}>
                {renderVisualScene(item.type, item.color, item.accent, item.bg)}
              </View>

              {/* Text Info */}
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Footer Controls */}
      <View style={styles.footer}>
        {/* Pagination Line-styled Indicators */}
        <View style={styles.pagination}>
          {slides.map((_, index) => {
            const isSelected = currentIndex === index;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isSelected ? [styles.dotActive, { backgroundColor: slides[currentIndex].color }] : null,
                ]}
              />
            );
          })}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: slides[currentIndex].color }]}
          onPress={handleNext}
          activeOpacity={0.9}
        >
          <Text style={styles.btnText}>
            {currentIndex === slides.length - 1 ? 'ابدأ الآن' : 'التالي'}
          </Text>
          {currentIndex < slides.length - 1 && (
            <ChevronLeft size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // خلفيات غامرة مضيئة (Abstract Glows)
  bgOrb1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#EEF2FF',
    opacity: 0.7,
  },
  bgOrb2: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: '#ECFDF5',
    opacity: 0.6,
  },
  header: {
    height: 70,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  brandLogo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 30,
  },
  illustrationArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  textContainer: {
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 26,
  },
  
  // تصميم المشاهد والتحكم بالتموضع (Visual Scene Styles)
  sceneWrapper: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.08,
  },
  mainCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  scanBar: {
    position: 'absolute',
    width: 110,
    height: 4,
    borderRadius: 2,
    top: '50%',
    opacity: 0.8,
  },
  
  // كروت وبادجات طائرة
  shadowPremium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  floatingBadge: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeLeft: {
    left: 10,
    top: 50,
  },
  badgeRight: {
    right: 15,
    bottom: 50,
  },
  
  // الرادار الخاص بالفنيين
  radarRing1: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderStyle: 'dotted',
    opacity: 0.2,
  },
  radarRing2: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderStyle: 'dotted',
    opacity: 0.1,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#10B981',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  floatingCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardLeft: {
    left: -20,
    bottom: 40,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  cardTitleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  ratingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  badgeRightTech: {
    right: -10,
    top: 60,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  
  // عناصر الضمان
  badgeLeftWarranty: {
    left: -10,
    top: 50,
  },
  cardRightWarranty: {
    right: -20,
    bottom: 30,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
  },
  cardTitleTextBold: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  cardSubText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },

  // أزرار التحكم والـ Footer
  footer: {
    paddingHorizontal: 28,
    paddingVertical: 32,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 22,
  },
  btn: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
