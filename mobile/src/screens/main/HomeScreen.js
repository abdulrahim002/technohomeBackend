import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Dimensions,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LayoutGrid, Zap, Search, Clock, ShieldCheck, ChevronRight, User, Bell } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useBookings } from '../../hooks/useBookings';
import { UPLOADS_URL } from '../../config/constants';
import IconWithBadge from '../../components/common/IconWithBadge';
import { getMyNotifications } from '../../api/notificationService';
import { onSocketEvent, offSocketEvent } from '../../services/SocketService';
import { useFocusEffect } from '@react-navigation/native';

/**
 * HomeScreen - "Dashboard Only" Mode
 * Focused on Statistics and Quick Discovery.
 */
export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { requests, totalCount } = useBookings();
  const [unreadCount, setUnreadCount] = useState(0);

  // جلب الإشعارات وحساب غير المقروء منها
  const fetchUnreadCount = async () => {
    const res = await getMyNotifications();
    if (res.success) {
      const count = res.notifications.filter(n => !n.isRead).length;
      setUnreadCount(count);
    }
  };

  // جلب العداد عند إدخال التركيز على الشاشة لضمان المزامنة
  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadCount();
    }, [])
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير ☀️';
    if (hour < 18) return 'مساء الخير ☕';
    return 'طاب مساؤك 🌙';
  };

  const activeRequests = requests.filter(r => !['completed', 'cancelled'].includes(r.status));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      
      {/* Unified Service Header */}
      <View style={styles.serviceHeader}>
        <View style={styles.mainRow}>
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
              <Text style={styles.greetingLabel}>{getGreeting()}</Text>
              <Text style={styles.userNameLabel}>{user?.firstName || 'عميلنا العزيز'} {user?.lastName || ''}</Text>
            </View>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.avatarContainer} 
              onPress={() => navigation.navigate('ProfileTab')}
            >
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
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        
        {/* Statistics Cards */}
        <View style={styles.statsStrip}>
           <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#F0F9FF' }]}>
                 <LayoutGrid size={20} color="#0EA5E9" />
              </View>
              <Text style={styles.statValue}>{totalCount}</Text>
              <Text style={styles.statLabel}>إجمالي العمليات</Text>
           </View>
           
           <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                 <Clock size={20} color="#4F46E5" />
              </View>
              <Text style={[styles.statValue, { color: '#4F46E5' }]}>{activeRequests.length}</Text>
              <Text style={styles.statLabel}>طلبات نشطة</Text>
           </View>
        </View>

        {/* Quick Actions / Services */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>خدمات سريعة</Text>
           
           <TouchableOpacity 
             style={styles.actionCard}
             onPress={() => navigation.navigate('AITab')}
           >
              <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
                 <Zap size={24} color="#4F46E5" />
              </View>
              <View style={styles.actionContent}>
                 <Text style={styles.actionTitle}>تشخيص ذكي AI</Text>
                 <Text style={styles.actionSub}>حلل عطل جهازك واعرف التكلفة في ثوانٍ</Text>
              </View>
              <ChevronRight size={20} color="#CBD5E1" />
           </TouchableOpacity>

           <TouchableOpacity 
             style={styles.actionCard}
             onPress={() => navigation.navigate('ManualDiagnosis')}
           >
              <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                 <Search size={24} color="#10B981" />
              </View>
              <View style={styles.actionContent}>
                 <Text style={styles.actionTitle}>بحث بأكواد الخطأ</Text>
                 <Text style={styles.actionSub}>هل يظهر لك رمز (E1, F0)؟ ابحث عن معناه</Text>
              </View>
              <ChevronRight size={20} color="#CBD5E1" />
           </TouchableOpacity>

           <TouchableOpacity 
             style={styles.actionCard}
             onPress={() => navigation.navigate('TechnicianList')}
           >
              <View style={[styles.actionIcon, { backgroundColor: '#FFFBEB' }]}>
                 <Search size={24} color="#F59E0B" />
              </View>
              <View style={styles.actionContent}>
                 <Text style={styles.actionTitle}>ابحث عن فني مباشرة</Text>
                 <Text style={styles.actionSub}>اختر التخصص والمدينة واحجز بدون تشخيص</Text>
              </View>
              <ChevronRight size={20} color="#CBD5E1" />
           </TouchableOpacity>
        </View>

        {/* Status / Tip Card */}
        <View style={[styles.section, { marginTop: 10 }]}>
           <View style={styles.tipCard}>
              <View style={styles.tipTextContainer}>
                 <Text style={styles.tipTitle}>حسابك موثق ونشط ✅</Text>
                 <Text style={styles.tipDesc}>أنت الآن تستمتع بكافة مميزات تيكنو هوم لخدمات الصيانة المنزلية.</Text>
              </View>
              <ShieldCheck size={40} color="#10B981" />
           </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFBFD' },
  container: { flex: 1 },
  
  serviceHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9'
  },
  mainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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

  statsStrip: { 
    flexDirection: 'row-reverse', 
    paddingHorizontal: 20, 
    marginTop: 10,
    gap: 12, 
  },
  statCard: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    padding: 20, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#F1F5F9', 
    elevation: 10, 
    shadowColor: '#4F46E5', 
    shadowOpacity: 0.1, 
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 }
  },
  iconCircle: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },

  section: { paddingHorizontal: 24, marginTop: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', textAlign: 'right', marginBottom: 18 },
  actionCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 18, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5 },
  actionIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  actionContent: { flex: 1, marginRight: 15, alignItems: 'flex-end' },
  actionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  actionSub: { fontSize: 12, fontWeight: '600', color: '#94A3B8', textAlign: 'right', lineHeight: 18 },

  tipCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 22, borderRadius: 24, borderWidth: 1, borderColor: '#DCFCE7' },
  tipTextContainer: { flex: 1, marginRight: 16, alignItems: 'flex-end' },
  tipTitle: { fontSize: 16, fontWeight: '900', color: '#166534', marginBottom: 4 },
  tipDesc: { fontSize: 12, fontWeight: '600', color: '#15803d', textAlign: 'right', lineHeight: 18 }
});
