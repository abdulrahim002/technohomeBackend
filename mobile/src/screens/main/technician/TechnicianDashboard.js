import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Image
} from 'react-native';
import { 
  User, 
  ChevronLeft, 
  Briefcase, 
  TrendingUp, 
  Star, 
  CheckCircle,
  Clock,
  ShieldCheck,
  Wallet,
  Award,
  Flame,
  Bell
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTechnician } from '../../../hooks/useTechnician';
import StatCard from '../../../components/common/StatCard';
import { UPLOADS_URL } from '../../../config/constants';
import IconWithBadge from '../../../components/common/IconWithBadge';
import { getMyNotifications } from '../../../api/notificationService';
import { onSocketEvent, offSocketEvent } from '../../../services/SocketService';


/**
 * TechnicianDashboard - "Dumb" Screen component.
 * Layout and visuals are isolated from logic.
 * هذه هي الشاشة الرئيسية للفني (لوحة التحكم). 
 * تعرض ملخصاً سريعاً للأداء (الأرباح، التقييم) وزرين رئيسيين: 
 * "المهام الحالية" و "سجل العمليات". 
 * تعتمد على Hook منفصل (useTechnician) لجلب البيانات وتحديث حالته (متصل/غير متصل).    
 */
const TechnicianDashboard = () => {
  const navigation = useNavigation();
  const {
    user,
    isOnline,
    toggleOnline,
    greeting,
    stats,
    refresh
  } = useTechnician();

  const [unreadCount, setUnreadCount] = useState(0);

  // جلب الإشعارات وحساب غير المقروء منها للفني
  const fetchUnreadCount = async () => {
    const res = await getMyNotifications();
    if (res.success) {
      const count = res.notifications.filter(n => !n.isRead).length;
      setUnreadCount(count);
    }
  };

  // تحديث البيانات في كل مرة تظهر فيها الشاشة
  useFocusEffect(
    React.useCallback(() => {
      refresh();
      fetchUnreadCount();
    }, [refresh])
  );

  // الاستماع للإشعارات الجديدة عبر الـ Socket لزيادة العداد فوراً (Real-time)
  useEffect(() => {
    const handleNewNotification = () => {
      setUnreadCount(prev => prev + 1);
    };

    onSocketEvent('newNotification', handleNewNotification);
    return () => {
      offSocketEvent('newNotification', handleNewNotification);
    };
  }, []);

  const consecutive = stats.consecutiveCompletedJobs || 0;
  const remainingForBonus = 5 - (consecutive % 5);
  const remainingText = remainingForBonus === 1 
    ? 'أكمل طلباً واحداً إضافياً للحصول على بونص +5 نقاط موثوقية!' 
    : `أكمل ${remainingForBonus} طلبات إضافية للحصول على بونص +5 نقاط موثوقية!`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="default" />
      
      {/* Top Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            activeOpacity={0.7}
            style={{ marginRight: 12, padding: 4 }}
            onPress={() => navigation.navigate('NotificationCenter')}
          >
            <IconWithBadge 
              IconComponent={Bell} 
              color="#4F46E5" 
              size={22} 
              count={unreadCount} 
            />
          </TouchableOpacity>
          <Text style={styles.brandText}>TechnoHome</Text>
        </View>



        <View style={styles.headerRight}>
          <View style={styles.headerTexts}>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.userNameText}>{user?.firstName} {user?.lastName}</Text>
          </View>
          <View style={styles.avatarContainer}>
            {user?.profileImage ? (
              <Image 
                source={{ uri: user.profileImage.startsWith('http') ? user.profileImage : `${UPLOADS_URL}${user.profileImage}` }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={24} color="#4F46E5" />
              </View>
            )}
            <View style={[styles.avatarStatusDot, { backgroundColor: isOnline ? '#10B981' : '#EF4444' }]} />
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        
      {/* Availability Toggle */}
      <View style={styles.contentWrapper}>
        <View style={[styles.statusBanner, isOnline ? styles.onlineBanner : styles.offlineBanner]}>
          <View style={styles.statusInfo}>
             <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#EF4444' }]} />
             <Text style={styles.statusText}>{isOnline ? 'أنت متاح لاستقبال الطلبات' : 'وضع عدم الاتصال'}</Text>
          </View>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.toggleBtn, isOnline ? styles.toggleBtnOn : styles.toggleBtnOff]}
            onPress={toggleOnline}
          >
             <View style={[styles.toggleCircle, isOnline ? styles.circleRight : styles.circleLeft]} />
          </TouchableOpacity>
        </View>

        {/* Dynamic Stats Cards */}
        <View style={styles.statsGrid}>
           <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
              <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                 <CheckCircle size={20} color="#10B981" />
              </View>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.completedJobs}</Text>
              <Text style={styles.statLabel}>مهمة مكتملة</Text>
           </View>
           
           <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                 <Award size={20} color="#4F46E5" />
              </View>
              <Text style={[styles.statValue, { color: '#4F46E5' }]}>{stats.reliabilityScore} / 100</Text>
              <Text style={styles.statLabel}>نقاط الموثوقية</Text>
           </View>
        </View>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakIconContainer}>
            <Flame size={24} color="#EA580C" fill="#EA580C" />
          </View>
          <View style={styles.streakTextContent}>
            <Text style={styles.streakTitle}>
              سلسلة الإتمام: 🔥 {consecutive} {consecutive === 1 ? 'طلب متتالي' : consecutive === 2 ? 'طلبان متتاليان' : 'طلبات متتالية'}
            </Text>
            <Text style={styles.streakSubtitle}>
              {remainingText}
            </Text>
          </View>
        </View>

        {/* Rating Summary Card */}
        <View style={styles.premiumRatingCard}>
            <View style={styles.ratingMain}>
               <Text style={styles.ratingBig}>{stats.overallRating}</Text>
               <View style={styles.starsRow}>
                  {[1,2,3,4,5].map(i => (
                    <Star 
                      key={i} 
                      size={16} 
                      color={i <= Math.round(stats.overallRating) ? "#F59E0B" : "#E2E8F0"} 
                      fill={i <= Math.round(stats.overallRating) ? "#F59E0B" : "transparent"}
                    />
                  ))}
               </View>
            </View>
            <View style={styles.ratingDivider} />
            <View style={styles.ratingDetails}>
               <Text style={styles.ratingTitle}>التقييم العام</Text>
               <Text style={styles.ratingSubtitle}>بناءً على {stats.reviewCount} تقييم حقيقي</Text>
            </View>
        </View>

        {/* Main Actions Area */}
        <Text style={styles.sectionHeader}>إدارة المهام</Text>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('JobsTab')}
        >
           <View style={styles.actionIconContainer}>
              <Briefcase size={24} color="#4F46E5" />
           </View>
           <View style={styles.actionTextContent}>
              <Text style={styles.actionMainTitle}>الطلبات الحالية</Text>
              <Text style={styles.actionSubTitle}>لديك {stats.activeJobsCount} طلب الآن</Text>
           </View>
           <ChevronLeft size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('HistoryTab')}
        >
           <View style={[styles.actionIconContainer, { backgroundColor: '#F0F9FF' }]}>
              <Clock size={24} color="#0EA5E9" />
           </View>
           <View style={styles.actionTextContent}>
              <Text style={styles.actionMainTitle}>تاريخ العمليات</Text>
              <Text style={styles.actionSubTitle}>{stats.completedJobs} مهمة مكتملة</Text>
           </View>
           <ChevronLeft size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Security / Verification Badge */}
        <View style={styles.verificationBadge}>
           <ShieldCheck size={20} color="#10B981" />
           <Text style={styles.verificationBadgeText}>أنت فني موثق في TechnoHome</Text>
        </View>

      </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 24, 
    paddingBottom: 16, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTexts: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  headerLeft: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  brandText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  avatarContainer: {
    position: 'relative',
    width: 46,
    height: 46,
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#EEF2FF',
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  avatarStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  scrollContent: { paddingBottom: 40 },
  contentWrapper: { paddingHorizontal: 24 },
  statusBanner: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 28, marginTop: 24, marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  onlineBanner: { backgroundColor: '#F0FDF4' },
  offlineBanner: { backgroundColor: '#FEF2F2' },
  statusInfo: { flexDirection: 'row-reverse', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 12 },
  statusText: { fontSize: 15, fontWeight: '900', color: '#1E293B' },
  toggleBtn: { width: 56, height: 32, borderRadius: 16, paddingHorizontal: 4, justifyContent: 'center' },
  toggleBtnOn: { backgroundColor: '#10B981' },
  toggleBtnOff: { backgroundColor: '#EF4444' },
  toggleCircle: { width: 24, height: 24, backgroundColor: '#FFF', borderRadius: 12, elevation: 3 },
  circleLeft: { alignSelf: 'flex-start' },
  circleRight: { alignSelf: 'flex-end' },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 28, borderWidth: 1, borderColor: '#F1F5F9', elevation: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  iconCircle: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  streakCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    padding: 20,
    borderRadius: 28,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#EA580C',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  streakIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  streakTextContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  streakTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#C2410C',
    marginBottom: 4,
  },
  streakSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  premiumRatingCard: { flexDirection: 'row-reverse', backgroundColor: '#F8FAFC', padding: 20, borderRadius: 32, marginBottom: 32, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  ratingMain: { alignItems: 'center', paddingLeft: 20 },
  ratingBig: { fontSize: 28, fontWeight: '900', color: '#1E293B', marginBottom: 4 },
  starsRow: { flexDirection: 'row-reverse', gap: 2 },
  ratingDivider: { width: 1, height: 50, backgroundColor: '#E2E8F0', marginHorizontal: 20 },
  ratingDetails: { flex: 1, alignItems: 'flex-end' },
  ratingTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 2 },
  ratingSubtitle: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  sectionHeader: { fontSize: 18, fontWeight: '900', color: '#1E293B', textAlign: 'right', marginBottom: 20 },
  actionCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 18, borderRadius: 28, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10 },
  actionIconContainer: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  actionTextContent: { flex: 1, marginRight: 16, alignItems: 'flex-end' },
  actionMainTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  actionSubTitle: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  verificationBadge: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 20, marginTop: 10, alignSelf: 'center' },
  verificationBadgeText: { fontSize: 12, fontWeight: '800', color: '#10B981', marginRight: 8 }
});

export default TechnicianDashboard;
