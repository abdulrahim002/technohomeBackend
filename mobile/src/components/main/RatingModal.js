import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Star } from 'lucide-react-native';

/**
 * نافذة تقييم الفني (Rating Modal)
 */
const RatingModal = ({ visible, onClose, onConfirm }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleConfirm = () => {
    onConfirm(rating, comment);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalBackdrop}>
           <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>كيف كانت تجربتك؟</Text>
              <Text style={styles.modalSub}>تقييمك يساعدنا في تحسين جودة الخدمة واختيار أفضل الفنيين</Text>
              
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity 
                    key={star} 
                    onPress={() => setRating(star)}
                    style={styles.starBtn}
                  >
                    <Star 
                      size={40} 
                      color={star <= rating ? "#F59E0B" : "#CBD5E1"} 
                      fill={star <= rating ? "#F59E0B" : "transparent"} 
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput 
                placeholder="أخبرنا المزيد عن جودة العمل، التعامل، والالتزام بالوقت..."
                multiline
                numberOfLines={4}
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
              />

              <View style={styles.modalActions}>
                 <TouchableOpacity onPress={onClose} style={styles.modalCancel}>
                    <Text style={styles.modalCancelText}>تخطى التقييم</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={handleConfirm} style={styles.modalConfirm}>
                    <Text style={styles.modalConfirmText}>إرسال التقييم</Text>
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 32, padding: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
  modalSub: { fontSize: 13, fontWeight: '600', color: '#64748B', textAlign: 'center', marginBottom: 25, lineHeight: 18 },
  starsContainer: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 10, marginBottom: 25 },
  starBtn: { padding: 5 },
  commentInput: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 15, height: 100, textAlign: 'right', fontSize: 14, fontWeight: '700', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 25 },
  modalActions: { flexDirection: 'row-reverse', gap: 12 },
  modalCancel: { flex: 1, height: 56, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '800', color: '#64748B' },
  modalConfirm: { flex: 2, height: 56, borderRadius: 16, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '800', color: '#FFF' }
});

export default RatingModal;
