import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

/**
 * مكون عنصر القائمة في الملف الشخصي (ProfileMenuItem)
 * الدور: عرض خيار واحد في قائمة الإعدادات مع أيقونة وسهم.
 */
const ProfileMenuItem = ({ icon: Icon, label, onPress, color = "#4F46E5", showChevron = true, danger = false }) => (
  <TouchableOpacity 
    style={[styles.container, danger && styles.dangerContainer]} 
    onPress={onPress} 
    activeOpacity={0.7}
  >
    <View style={styles.leftRow}>
      {showChevron && <ChevronLeft size={20} color={danger ? "#EF4444" : "#CBD5E1"} />}
    </View>

    <View style={styles.rightRow}>
      <Text style={[styles.label, danger && styles.dangerText]}>{label}</Text>
      <View style={[styles.iconBox, { backgroundColor: danger ? "#FEF2F2" : "#F8FAFC" }]}>
        <Icon size={20} color={danger ? "#EF4444" : color} />
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dangerContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  dangerText: {
    color: '#EF4444',
  }
});

export default ProfileMenuItem;
