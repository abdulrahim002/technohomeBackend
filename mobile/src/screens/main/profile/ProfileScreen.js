import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StyleSheet, 
  StatusBar,
  Alert,
  Linking,
  Image
} from 'react-native';
import { 
  User, 
  Settings, 
  LogOut, 
  ShieldCheck,
  CreditCard,
  Zap,
  UserCheck,
  Lock,
  Info,
  HelpCircle,
  Award,
  Flame
} from 'lucide-react-native';
import useAuthStore from '../../../store/useAuthStore';
import { useAuth } from '../../../context/AuthContext';
import { useTechnician } from '../../../hooks/useTechnician';
import ProfileMenuItem from '../../../components/profile/ProfileMenuItem';
import ProfileStatCard from '../../../components/profile/ProfileStatCard';
import { UPLOADS_URL } from '../../../config/constants';

/**
 * شاشة الملف الشخصي المطورة (Profile Screen v2)
 * الدور: إدارة الحساب بشكل شامل (تعديل، أمان، محفظة).
 * التصميم: Premium Clean UI مع تعليقات عربية.
 */
const ProfileScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const { stats } = useTechnician();

  const isTechnician = user?.role === 'technician';

  // تأكيد تسجيل الخروج
  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'خروج', style: 'destructive', onPress: signOut }
      ]
    );
  };

  // تفعيل مركز المساعدة
  const handleHelpCenter = () => {
    Alert.alert(
      'مركز المساعدة والدعم 🛠️📞',
      'يسعدنا دائماً مساعدتك والإجابة على استفساراتك. يرجى اختيار طريقة التواصل المناسبة:',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'اتصال هاتفياً 📞', 
          onPress: () => Linking.openURL('tel:+218944531009').catch(() => Alert.alert('خطأ', 'لا يمكن إجراء الاتصال من هذا الجهاز.'))
        },
        { 
          text: 'تواصل عبر واتساب 💬', 
          onPress: () => Linking.openURL('https://wa.me/0944531009').catch(() => Alert.alert('خطأ', 'تطبيق واتساب غير مثبت على هذا الجهاز.'))
        }
      ]
    );
  };

  // تفعيل عن تكنو هوم
  const handleAboutApp = () => {
    Alert.alert(
      'عن تكنو هوم 🏠✨',
      'تكنو هوم هو المنصة الذكية الرائدة لحجز فنيي الصيانة المنزلية المعتمدين والموثوقين.\n\nهدفنا هو تسهيل حياتك اليومية من خلال توفير خدمات صيانة سريعة ومضمونة تحت إشراف نخبة من الفنيين وبدعم تقني متكامل.\n\nالإصدار: 1.0.0\nحقوق الطبع والنشر © 2026 تكنو هوم.',
      [{ text: 'حسناً', style: 'default' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      
      {/* الجزء العلوي (الهيدر) */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
           <Text style={styles.headerTitle}>حسابي</Text>
        </View>

        <View style={styles.userInfo}>
           <View style={styles.avatarContainer}>
              {user?.profileImage ? (
                <Image 
                  source={{ uri: user.profileImage.startsWith('http') ? user.profileImage : `${UPLOADS_URL}${user.profileImage}` }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatar}>
                  <User size={40} color="#4F46E5" />
                </View>
              )}
              <View style={styles.verifiedBadge}>
                 <ShieldCheck size={14} color="white" />
              </View>
           </View>
           <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
           <Text style={styles.userPhone}>{user?.phone}</Text>
        </View>

        {/* كروت الإحصائيات (المحفظة والـ AI للفني أو العميل) */}
        <View style={[styles.statsContainer, isTechnician && styles.statsContainerTech]}>
          {isTechnician ? (
            <>
              <View style={styles.techCard}>
                <View style={[styles.techIconBox, { backgroundColor: '#4F46E515' }]}>
                  <Award size={16} color="#4F46E5" />
                </View>
                <View style={styles.techContent}>
                  <Text style={styles.techValue}>{stats.reliabilityScore} / 100</Text>
                  <Text style={styles.techLabel}>الموثوقية</Text>
                </View>
              </View>

              <View style={styles.techCard}>
                <View style={[styles.techIconBox, { backgroundColor: '#EA580C15' }]}>
                  <Flame size={16} color="#EA580C" />
                </View>
                <View style={styles.techContent}>
                  <Text style={styles.techValue}>🔥 {stats.consecutiveCompletedJobs}</Text>
                  <Text style={styles.techLabel}>السلسلة</Text>
                </View>
              </View>

              <View style={styles.techCard}>
                <View style={[styles.techIconBox, { backgroundColor: '#10B98115' }]}>
                  <CreditCard size={16} color="#10B981" />
                </View>
                <View style={styles.techContent}>
                  <Text style={styles.techValue}>{stats.walletBalance || user?.walletBalance || 0} د.ل</Text>
                  <Text style={styles.techLabel}>المحفظة</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <ProfileStatCard 
                icon={Zap} 
                label="نقاط AI" 
                value={user?.aiCredits || 0} 
                color="#8B5CF6" 
              />
              <ProfileStatCard 
                icon={CreditCard} 
                label="المحفظة" 
                value={`${user?.walletBalance || 0} د.ل`} 
                color="#10B981" 
              />
            </>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* مجموعة إعدادات الحساب */}
        <Text style={styles.sectionTitle}>إعدادات الحساب</Text>
        <ProfileMenuItem 
          icon={UserCheck} 
          label="تعديل البيانات الشخصية" 
          onPress={() => navigation.navigate('EditProfile')} 
          color="#3B82F6"
        />
        <ProfileMenuItem 
          icon={Lock} 
          label="كلمة المرور والأمان" 
          onPress={() => navigation.navigate('Security')} 
          color="#F59E0B"
        />
        {/* مجموعة الدعم والمعلومات */}
        <Text style={styles.sectionTitle}>الدعم والمساعدة</Text>
        <ProfileMenuItem 
          icon={HelpCircle} 
          label="مركز المساعدة والدعم" 
          onPress={handleHelpCenter} 
          color="#6366F1"
        />
        <ProfileMenuItem 
          icon={Info} 
          label="عن تكنو هوم" 
          onPress={handleAboutApp} 
          color="#64748B"
        />

        {/* تسجيل الخروج */}
        <View style={{ marginTop: 20 }}>
          <ProfileMenuItem 
            icon={LogOut} 
            label="تسجيل الخروج" 
            onPress={handleLogout} 
            danger={true}
            showChevron={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    backgroundColor: '#4F46E5', 
    paddingTop: 20, 
    paddingHorizontal: 24, 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40,
    paddingBottom: 60,
    zIndex: 1
  },
  headerTop: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20 
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: 'white' },
  userInfo: { alignItems: 'center', marginTop: 10 },
  avatarContainer: { position: 'relative' },
  avatar: { 
    width: 90, 
    height: 90, 
    borderRadius: 32, 
    backgroundColor: 'white', 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 10
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'white',
    elevation: 10
  },
  verifiedBadge: { 
    position: 'absolute', 
    bottom: -4, 
    right: -4, 
    backgroundColor: '#10B981', 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    borderWidth: 3, 
    borderColor: 'white', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  userName: { fontSize: 22, fontWeight: '900', color: 'white', marginTop: 15 },
  userPhone: { fontSize: 13, color: '#E0E7FF', marginTop: 4, fontWeight: '600' },
  
  statsContainer: { 
    flexDirection: 'row', 
    position: 'absolute', 
    bottom: -35, 
    left: 20, 
    right: 20,
    justifyContent: 'space-between'
  },
  statsContainerTech: {
    left: 12,
    right: 12,
  },
  techCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { height: 4 },
  },
  techIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  techContent: {
    marginRight: 6,
    alignItems: 'flex-end',
    flex: 1,
  },
  techValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E293B',
  },
  techLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },

  content: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: '#94A3B8', 
    marginBottom: 15, 
    marginTop: 10,
    textAlign: 'right' 
  }
});

export default ProfileScreen;
