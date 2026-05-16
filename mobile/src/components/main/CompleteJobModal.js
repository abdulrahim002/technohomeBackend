import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Hash } from 'lucide-react-native';

/** 
 * نافذة إتمام المهمة (Complete Job Modal)
 */
const CompleteJobModal = ({ visible, onClose, onConfirm, notes, setNotes, otp, setOtp }) => {
  const handleConfirm = () => {
    Keyboard.dismiss();
    onConfirm();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalBackdrop}>
           <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>إتمام وإغلاق المهمة</Text>
              <Text style={styles.modalSub}>يرجى إدخال رمز التحقق (OTP) المستلم من العميل</Text>
              
              <View style={styles.otpContainer}>
                 <TextInput 
                   placeholder="رمز التحقق (4 أرقام)"
                   keyboardType="number-pad"
                   maxLength={4}
                   style={styles.otpInput}
                   value={otp}
                   onChangeText={setOtp}
                 />
                 <Hash size={20} color="#4F46E5" />
              </View>

              <TextInput 
                placeholder="أضف ملاحظاتك الفنية حول الإصلاح..."
                multiline
                numberOfLines={3}
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
              />

              <View style={styles.modalActions}>
                 <TouchableOpacity onPress={onClose} style={styles.modalCancel}>
                    <Text style={styles.modalCancelText}>تراجع</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={handleConfirm} style={styles.modalConfirm}>
                    <Text style={styles.modalConfirmText}>تأكيد الإغلاق</Text>
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', textAlign: 'right', marginBottom: 8 },
  modalSub: { fontSize: 14, fontWeight: '600', color: '#64748B', textAlign: 'right', marginBottom: 25 },
  otpContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', borderRadius: 16, paddingHorizontal: 20, height: 60, borderWidth: 1, borderColor: '#DDD6FE', marginBottom: 15 },
  otpInput: { flex: 1, textAlign: 'right', fontSize: 18, fontWeight: '900', color: '#4F46E5' },
  notesInput: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 20, height: 100, textAlign: 'right', fontSize: 14, fontWeight: '700', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 25 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, height: 56, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { fontSize: 16, fontWeight: '800', color: '#64748B' },
  modalConfirm: { flex: 2, height: 56, borderRadius: 16, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  modalConfirmText: { fontSize: 16, fontWeight: '800', color: '#FFF' }
});

export default CompleteJobModal;
