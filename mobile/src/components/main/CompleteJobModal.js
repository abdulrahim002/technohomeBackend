import React from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { CreditCard } from 'lucide-react-native';

/** 
 * نافذة إتمام المهمة (Complete Job Modal)
 * الدور: إدخال السعر النهائي والملاحظات قبل إغلاق الطلب.
 * هذه النافذة تظهر للفني عند محاولة إغلاق المهمة، وتطلب منه إدخال السعر النهائي وأي ملاحظات إضافية قبل إرسالها للعميل.
 *  
 */
const CompleteJobModal = ({ visible, onClose, onConfirm, price, setPrice, notes, setNotes }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
         <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>إتمام الصيانة</Text>
            <Text style={styles.modalSub}>يرجى تأكيد السعر النهائي المتفق عليه مع العميل</Text>
            
            <View style={styles.inputContainer}>
               <Text style={styles.currency}>د.ل</Text>
               <TextInput 
                 placeholder="السعر الإجمالي"
                 keyboardType="numeric"
                 style={styles.priceInput}
                 value={price}
                 onChangeText={setPrice}
               />
               <CreditCard size={20} color="#94A3B8" />
            </View>

            <TextInput 
              placeholder="أي ملاحظات فنية إضافية..."
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
               <TouchableOpacity onPress={onConfirm} style={styles.modalConfirm}>
                  <Text style={styles.modalConfirmText}>تأكيد وإغلاق</Text>
               </TouchableOpacity>
            </View>
         </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', textAlign: 'right', marginBottom: 8 },
  modalSub: { fontSize: 14, fontWeight: '600', color: '#94A3B8', textAlign: 'right', marginBottom: 25 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 20, height: 60, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 15 },
  currency: { fontSize: 14, fontWeight: '900', color: '#64748B', marginRight: 15 },
  priceInput: { flex: 1, textAlign: 'right', fontSize: 18, fontWeight: '900' },
  notesInput: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 20, height: 100, textAlign: 'right', fontSize: 14, fontWeight: '700', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 25 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, height: 56, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { fontSize: 16, fontWeight: '800', color: '#64748B' },
  modalConfirm: { flex: 2, height: 56, borderRadius: 16, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  modalConfirmText: { fontSize: 16, fontWeight: '800', color: '#FFF' }
});

export default CompleteJobModal;
