import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * مكون أيقونة مع شارة تنبيه حمراء (IconWithBadge)
 * الدور: عرض أيقونة وبجانبها أو فوقها شارة (Badge) حمراء تدل على وجود تنبيهات غير مقروءة.
 * 
 * @param {React.ComponentType} IconComponent - مكون الأيقونة المراد رسمه (مثل الأيقونات من lucide-react-native أو expo vector icons)
 * @param {String} color - لون الأيقونة
 * @param {Number} size - حجم الأيقونة
 * @param {Number} count - عدد الإشعارات غير المقروءة (اختياري)
 * @param {Boolean} hasNotifications - هل توجد إشعارات غير مقروءة؟ (يستخدم كبديل منطقي عند عدم توفر العدد)
 */
export default function IconWithBadge({ IconComponent, color, size, count = 0, hasNotifications = false }) {
  // تحديد ما إذا كان يجب إظهار الشارة
  const showBadge = count > 0 || hasNotifications;

  // تنسيق قيمة الشارة لعرض "+9" عند زيادة العدد عن 9 لضمان تناسق التصميم (UI/UX)
  const displayCount = count > 9 ? '+9' : count;

  return (
    <View style={{ width: size, height: size, margin: 5 }}>
      {/* رسم الأيقونة الممررة */}
      {IconComponent && <IconComponent color={color} size={size} />}
      
      {/* عرض الشارة الحمراء إذا دعت الحاجة */}
      {showBadge && (
        <View style={[
          styles.badgeContainer,
          count > 0 ? styles.countBadge : styles.dotBadge
        ]}>
          {count > 0 && (
            <Text style={styles.badgeText}>
              {displayCount}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#EF4444', // اللون الأحمر المعتمد للتنبيهات الحية
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF', // إطار أبيض يفصل الشارة عن الأيقونة لتأثير جمالي
  },
  // تصميم شارة رقمية (تحتوي على أرقام)
  countBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
  },
  // تصميم شارة نقطية (نقطة حمراء فقط)
  dotBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
});
