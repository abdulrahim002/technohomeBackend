import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * مكون بطاقة الإحصائيات (ProfileStatCard)
 * الدور: عرض رصيد المحفظة أو نقاط الـ AI في هيدر الملف الشخصي.
 */
const ProfileStatCard = ({ icon: Icon, label, value, color = "#4F46E5" }) => (
  <View style={styles.card}>
    <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
      <Icon size={18} color={color} />
    </View>
    <View style={styles.content}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginHorizontal: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { height: 4 },
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    marginRight: 12,
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  }
});

export default ProfileStatCard;
