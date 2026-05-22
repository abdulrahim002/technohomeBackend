import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * دالة لتحديد تفاصيل الشارة (الاسم، اللون، لون الخلفية) بناءً على نقاط الموثوقية وعدد المهام المنجزة.
 */
export const getReliabilityBadge = (score, completedJobs = 0) => {
  if (completedJobs < 3) {
    return { label: "🔧 فني نشط جديد", color: "#64748B", bg: "#F1F5F9" }; // رمادي فاتح
  }
  if (score >= 90) {
    return { label: "🥇 فني موثوق للغاية", color: "#10B981", bg: "#F0FDF4" }; // أخضر
  }
  if (score >= 75) {
    return { label: "🥈 ملتزم بالمواعيد", color: "#3B82F6", bg: "#EFF6FF" }; // أزرق
  }
  return { label: "🔧 فني نشط", color: "#4B5563", bg: "#F3F4F6" }; // رمادي غامق
};

/**
 * مكون شارة الموثوقية البصري (ReliabilityBadge)
 * يستخدم في شاشات العميل لعرض شارات ملونة ذكية للفني بدلاً من عرض النسبة المئوية مباشرة.
 */
const ReliabilityBadge = ({ score, completedJobs = 0, style }) => {
  const badge = getReliabilityBadge(score, completedJobs);
  
  return (
    <View style={[styles.badge, { backgroundColor: badge.bg }, style]}>
      <Text style={[styles.text, { color: badge.color }]}>{badge.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
});

export default ReliabilityBadge;
