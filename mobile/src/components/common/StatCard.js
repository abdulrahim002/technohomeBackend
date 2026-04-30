import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**  
 * بطاقة الاحصائيات (StatCard)
 * الدور: عرض إحصائية واحدة بتصميم مميز.
 * هذه البطاقة تستخدم لعرض الإحصائيات مثل عدد الطلبات، الأرباح، إلخ.
 *  
 */
const StatCard = ({ label, value, currency, icon: Icon, color }) => {
  return (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <View style={styles.statIconContainer}>
         <Icon size={20} color="rgba(255,255,255,0.7)" />
      </View>
      <Text style={styles.statValue}>
        {value} {currency && <Text style={styles.statCurrency}>{currency}</Text>}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statCard: { flex: 1, padding: 20, borderRadius: 32, elevation: 8, shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { height: 5 } },
  statIconContainer: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  statCurrency: { fontSize: 12, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginTop: 4 },
});

export default memo(StatCard);
