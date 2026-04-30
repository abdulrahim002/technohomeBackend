import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StyleSheet, 
  StatusBar,
  Alert
} from 'react-native';
import { 
  User, 
  Settings, 
  LogOut, 
  ShieldCheck,
  CreditCard,
  Bell,
  Zap,
  UserCheck,
  Lock,
  Info,
  HelpCircle
} from 'lucide-react-native';
import useAuthStore from '../../../store/useAuthStore';
import ProfileMenuItem from '../../../components/profile/ProfileMenuItem';
import ProfileStatCard from '../../../components/profile/ProfileStatCard';

/**
 * شاشة الملف الشخصي المطورة (Profile Screen v2)
 * الدور: إدارة الحساب بشكل شامل (تعديل، أمان، محفظة).
 * التصميم: Premium Clean UI مع تعليقات عربية.
 */
const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuthStore();

  // تأكيد تسجيل الخروج
  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'خروج', style: 'destructive', onPress: logout }
      ]
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
              <View style={styles.avatar}>
                <User size={40} color="#4F46E5" />
              </View>
              <View style={styles.verifiedBadge}>
                 <ShieldCheck size={14} color="white" />
              </View>
           </View>
           <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
           <Text style={styles.userPhone}>{user?.phone}</Text>
        </View>

        {/* كروت الإحصائيات (المحفظة والـ AI) */}
        <View style={styles.statsContainer}>
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
        <ProfileMenuItem 
          icon={Bell} 
          label="الإشعارات" 
          onPress={() => {}} 
          color="#EF4444"
        />

        {/* مجموعة الدعم والمعلومات */}
        <Text style={styles.sectionTitle}>الدعم والمساعدة</Text>
        <ProfileMenuItem 
          icon={HelpCircle} 
          label="مركز المساعدة" 
          onPress={() => {}} 
          color="#6366F1"
        />
        <ProfileMenuItem 
          icon={Info} 
          label="عن تكنو هوم" 
          onPress={() => {}} 
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
