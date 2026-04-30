import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { ChevronRight, ArrowUpRight, ArrowDownLeft, FileText, Wallet } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as technicianService from '../../../api/technicianService';

const WalletHistoryScreen = () => {
  const navigation = useNavigation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const result = await technicianService.getWalletHistory();
    if (result.success) {
      setHistory(result.data.transactions);
      // If balance is in the metadata
      setBalance(result.data.currentBalance || 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const renderItem = ({ item }) => {
    const isCredit = item.type === 'credit' || item.type === 'refund';
    return (
      <View style={styles.transactionCard}>
        <View style={[styles.iconContainer, { backgroundColor: isCredit ? '#F0FDF4' : '#FEF2F2' }]}>
          {isCredit ? (
            <ArrowDownLeft size={20} color="#10B981" />
          ) : (
            <ArrowUpRight size={20} color="#EF4444" />
          )}
        </View>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('ar-LY')}</Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: isCredit ? '#10B981' : '#EF4444' }]}>
            {isCredit ? '+' : '-'}{item.amount} د.ل
          </Text>
          <Text style={styles.balanceAfter}>{item.balanceAfter} د.ل</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.balanceHeader}>
        <View style={styles.balanceCircle}>
          <Wallet size={32} color="#FFF" />
        </View>
        <Text style={styles.balanceLabel}>الرصيد الحالي</Text>
        <Text style={styles.balanceValue}>{balance} د.ل</Text>
        
        <TouchableOpacity style={styles.exportBtn}>
           <FileText size={18} color="#4F46E5" />
           <Text style={styles.exportText}>تصدير كشف حساب (Excel)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>سجل العمليات</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>لا يوجد عمليات مالية مسجلة بعد</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  balanceHeader: { backgroundColor: '#4F46E5', padding: 30, alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  balanceCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  balanceValue: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  exportBtn: { flexDirection: 'row-reverse', backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 20, alignItems: 'center', gap: 8 },
  exportText: { color: '#4F46E5', fontWeight: '800', fontSize: 13 },
  historySection: { flex: 1, paddingHorizontal: 24, paddingTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', textAlign: 'right', marginBottom: 20 },
  listContent: { paddingBottom: 20 },
  transactionCard: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  iconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
  detailsContainer: { flex: 1, alignItems: 'flex-end' },
  description: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
  date: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  amountContainer: { alignItems: 'flex-start' },
  amount: { fontSize: 15, fontWeight: '900', marginBottom: 2 },
  balanceAfter: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 100, fontWeight: '700' }
});

export default WalletHistoryScreen;
