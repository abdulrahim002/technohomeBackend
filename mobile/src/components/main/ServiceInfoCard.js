import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wrench, ClipboardList, Settings } from 'lucide-react-native';

/**
 * ServiceInfoCard - عرض بيانات الجهاز والمشكلة بشكل موحد
 */
export const ServiceInfoCard = ({ applianceType, brand, problemDescription }) => {
  return (
    <View style={styles.card}>
      <View style={styles.section}>
        <View style={styles.row}>
          <Settings size={20} color="#4F46E5" />
          <Text style={styles.title}>بيانات الجهاز</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.value}>{applianceType?.nameAr || 'غير محدد'}</Text>
          <Text style={styles.label}>النوع:</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.value}>{brand || 'غير محدد'}</Text>
          <Text style={styles.label}>الماركة:</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <View style={styles.row}>
          <ClipboardList size={20} color="#4F46E5" />
          <Text style={styles.title}>وصف المشكلة</Text>
        </View>
        <Text style={styles.descText}>{problemDescription}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  section: { marginVertical: 5 },
  row: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 12, gap: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  dataRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  value: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#F8FAFC', marginVertical: 15 },
  descText: { fontSize: 14, color: '#475569', textAlign: 'right', lineHeight: 22 }
});
