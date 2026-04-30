import React from 'react';
import { View, Text, Modal, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';

/**  
 * شاشة التحميل (Loading Overlay)
 * الدور: عرض مؤشر تحميل مع رسالة للمستخدم.
 * هذه الشاشة تظهر فوق أي محتوى آخر لإعلام المستخدم بأن العملية جارية.
 *  
 * @param {boolean} visible - Visibility toggle
 * @param {string} message - Optional message to display (Arabic recommended)
 */
const LoadingOverlay = ({ visible, message = 'الرجاء الانتظار...' }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={Colors.primary} />
          {message ? <Text style={styles.text}>{message}</Text> : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Darker dim for focus
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  text: {
    marginTop: 20,
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'normal',
  },
});

export default LoadingOverlay;
