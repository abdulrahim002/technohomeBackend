import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardList, Calendar, Search } from 'lucide-react-native';
import { useBookings } from '../../../hooks/useBookings';
import BookingCard from '../../../components/main/BookingCard';

/**
 * BookingsScreen - Professional Requests History
 * Separate from Dashboard to eliminate UI complexity.
 */
const BookingsScreen = ({ navigation }) => {
  const {
    requests,
    loading,
    refreshing,
    onRefresh,
    handleCancelBooking,
    handleDeleteRequest
  } = useBookings();

  const renderItem = ({ item }) => (
    <BookingCard 
      item={item}
      onDetails={() => navigation.navigate('BookingDetails', { order: item })}
      onCancel={() => handleCancelBooking(item._id)}
      onDelete={() => handleDeleteRequest(item._id)}
      onChat={() => navigation.navigate('Chat', {
        requestId: item._id,
        recipientId: item.technician?._id || item.technician,
        recipientName: item.technician?.fullName || 'الفني'
      })}
    />
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Statistics Header (Small) */}
        <View style={styles.header}>
           <Text style={styles.headerTitle}>سجل طلباتي</Text>
           <View style={styles.countBadge}>
              <Text style={styles.countText}>{requests.length} طلب</Text>
           </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
             <ActivityIndicator size="large" color="#4F46E5" />
             <Text style={styles.loaderText}>جاري تحميل سجلاتك...</Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBox}>
                   <ClipboardList size={48} color="#CBD5E1" />
                </View>
                <Text style={styles.emptyTitle}>لا توجد طلبات حتى الآن</Text>
                <Text style={styles.emptySub}>بمجرد بدء تشخيص أو حجز فني، ستظهر طلباتك هنا لتتمكن من متابعتها.</Text>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('AITab')}
                >
                  <Text style={styles.actionBtnText}>ابدأ أول طلب الآن</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFBFD' },
  container: { flex: 1, paddingHorizontal: 24 },
  header: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 25 
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  countBadge: { 
    backgroundColor: '#EEF2FF', 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 10 
  },
  countText: { color: '#4F46E5', fontSize: 12, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 15, fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  listContent: { paddingBottom: 100 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyIconBox: { 
    width: 90, 
    height: 90, 
    borderRadius: 30, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 25
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 10 },
  emptySub: { 
    fontSize: 13, 
    color: '#94A3B8', 
    textAlign: 'center', 
    lineHeight: 20, 
    marginBottom: 30 
  },
  actionBtn: { 
    backgroundColor: '#4F46E5', 
    paddingHorizontal: 24, 
    paddingVertical: 14, 
    borderRadius: 18 
  },
  actionBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15 }
});

export default BookingsScreen;