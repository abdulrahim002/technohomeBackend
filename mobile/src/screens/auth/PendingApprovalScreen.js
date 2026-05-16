import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { Clock, ShieldCheck, LogOut, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
  
/**
 * شاشة الانتظار (Pending Approval Screen)
 */ 
const PendingApprovalScreen = () => {
  const { signOut, user, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.iconContainer}>
           <Clock size={56} color="#4F46E5" />
        </View>

        <Text style={styles.title}>طلبك قيد المراجعة</Text>
        
        <View style={styles.messageBox}>
           <Text style={styles.messageText}>
              أهلاً بك {user?.firstName}، فريق تكنو هوم يقوم حالياً بمراجعة بياناتك المهنية. سيتم تفعيل حسابك فور التأكد من مطابقة المعايير.
           </Text>
        </View>

        <View style={styles.badge}>
           <ShieldCheck size={18} color="#4F46E5" />
           <Text style={styles.badgeText}>عملية توثيق آمنة 100%</Text>
        </View>

        <TouchableOpacity 
          onPress={handleRefresh}
          disabled={refreshing}
          style={[styles.refreshBtn, refreshing && { opacity: 0.7 }]}
        >
          <RefreshCw size={20} color="#FFFFFF" style={refreshing ? { transform: [{ rotate: '45deg' }] } : {}} />
          <Text style={styles.refreshText}>{refreshing ? 'جاري التحقق...' : 'تحديث الحالة'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={signOut}
          style={styles.logoutBtn}
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, px: 32, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconContainer: { width: 120, height: 120, backgroundColor: '#EEF2FF', borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '900', color: '#1E293B', textAlign: 'center', marginBottom: 16 },
  messageBox: { backgroundColor: '#F8FAFC', p: 24, borderRadius: 28, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 32, padding: 24 },
  messageText: { fontSize: 15, fontWeight: '700', color: '#64748B', textAlign: 'center', lineHeight: 24 },
  badge: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#EEF2FF', px: 16, py: 10, borderRadius: 20, marginBottom: 40, paddingHorizontal: 16, paddingVertical: 10 },
  badgeText: { fontSize: 13, fontWeight: '800', color: '#4F46E5', marginLeft: 8 },
  logoutBtn: { flexDirection: 'row-reverse', alignItems: 'center', px: 32, py: 18, borderRadius: 24, borderWidth: 1.5, borderColor: '#F1F5F9', paddingHorizontal: 32, paddingVertical: 18, backgroundColor: '#F8FAFC' },
  logoutText: { fontSize: 16, fontWeight: '800', color: '#EF4444', marginLeft: 10 },
  
  refreshBtn: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    backgroundColor: '#4F46E5', 
    width: '100%',
    py: 20, 
    borderRadius: 24, 
    marginBottom: 16, 
    justifyContent: 'center',
    paddingVertical: 20,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  refreshText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginLeft: 10 }
});

export default PendingApprovalScreen;
