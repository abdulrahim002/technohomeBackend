import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { ChevronRight, Inbox } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTechnicianJobs } from '../../../hooks/useTechnicianJobs';
import TechnicianJobCard from '../../../components/main/TechnicianJobCard';

/**
 * TechnicianActiveJobs - Screen for showing current technical tasks (Refactored).
 * هذه هي الشاشة الرئيسية للفني لعرض المهام التي تم قبولها وتنتظر التنفيذ أو قيد التنفيذ. 
 * تستخدم الـ Hook المخصص useTechnicianJobs لجلب البيانات وتحديثها عند السحب للأسفل (Pull-to-Refresh). 
 * 
 */
const TechnicianActiveJobs = () => {
  const navigation = useNavigation();
  const { jobs, loading, refreshing, onRefresh } = useTechnicianJobs();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
           <ChevronRight size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المهام الحالية</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
           <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList 
          data={jobs}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <TechnicianJobCard 
              item={item} 
              onPress={() => navigation.navigate('TechnicianJobDetails', { requestId: item._id })} 
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
               <View style={styles.emptyIconCircle}>
                  <Inbox size={48} color="#CBD5E1" />
               </View>
               <Text style={styles.emptyTitle}>لا توجد مهام نشطة</Text>
               <Text style={styles.emptySub}>تصفح المهام الجديدة من لوحة التحكم أو انتظر وصول إشعارات</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 10 },
  emptySub: { fontSize: 13, fontWeight: '600', color: '#94A3B8', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 }
});

export default TechnicianActiveJobs;
