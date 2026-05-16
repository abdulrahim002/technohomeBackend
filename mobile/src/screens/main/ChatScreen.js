import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  Image,
  Keyboard,
  ActivityIndicator,
  Alert,
  AppState
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Send, ChevronRight, Image as ImageIcon, Camera, MoreVertical } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getSocket, emitSocketEvent, onSocketEvent, offSocketEvent } from '../../services/SocketService';
import * as chatService from '../../api/chatService';
import api from '../../api/api';

const ChatScreen = ({ route, navigation }) => {
  const { requestId, chatRoomId, recipientId, recipientName } = route.params;
  const flatListRef = useRef();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);

  const identifier = requestId || chatRoomId;

  // دالة لتقسيم الرسائل حسب التاريخ
  const groupMessages = (msgs) => {
    const groups = [];
    let lastDate = null;

    msgs.forEach(msg => {
      const date = new Date(msg.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD
      if (date !== lastDate) {
        groups.push({ type: 'date', date, _id: `date-${date}` });
        lastDate = date;
      }
      groups.push({ ...msg, type: 'message' });
    });
    return groups;
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const history = await chatService.getChatHistory(identifier);
      if (history.success) {
        setMessages(history.data);
      }
      setLoading(false);
      
      if (isFocused && AppState.currentState === 'active') {
        chatService.markMessagesAsRead(identifier);
      }
    };
    fetchHistory();
  }, [identifier, isFocused]);

  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      const msgIdentifier = newMessage.serviceRequest || newMessage.chatRoomId;
      if (msgIdentifier === identifier) {
        setMessages(prev => [...prev, newMessage]);
        
        // التحقق إن كانت الرسالة من الطرف الآخر (وليست تأكيد إرسال لرسالتي أنا)
        const senderId = newMessage.sender._id || newMessage.sender;
        const isFromOther = senderId !== user._id;

        // لا نرسل "تم القراءة" إلا إذا كانت الرسالة من الطرف الآخر وكان المستخدم داخل الشات حالياً والتطبيق نشط
        if (isFromOther && isFocused && AppState.currentState === 'active') {
          chatService.markMessagesAsRead(identifier);
          emitSocketEvent('readMessages', { identifier, senderId });
        }
      }
    };

    const handleMessagesRead = (data) => {
      if (data.identifier === identifier) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      }
    };

    const handleStatusChange = (data) => {
      if (data.userId === recipientId) {
        setIsRecipientOnline(data.isOnline);
      }
    };

    onSocketEvent('receiveMessage', handleReceiveMessage);
    onSocketEvent('messageSent', handleReceiveMessage); 
    onSocketEvent('messagesRead', handleMessagesRead);
    onSocketEvent('userStatusChanged', handleStatusChange);

    // الفحص الأولي لحالة الطرف الآخر
    emitSocketEvent('checkUserStatus', recipientId);

    // إبلاغ السيرفر بأننا فتحنا الشات وقرأنا الرسائل السابقة (فقط إذا كان الشات في الواجهة والتطبيق نشط)
    if (isFocused && AppState.currentState === 'active') {
      emitSocketEvent('readMessages', { identifier, senderId: recipientId });
    }

    return () => {
      offSocketEvent('receiveMessage', handleReceiveMessage);
      offSocketEvent('messageSent', handleReceiveMessage);
      offSocketEvent('messagesRead', handleMessagesRead);
      offSocketEvent('userStatusChanged', handleStatusChange);
    };
  }, [identifier, recipientId, isFocused]);

  // مراقبة حالة التطبيق (Foreground/Background) لضمان دقة الـ Seen والـ Online status
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // العودة للواجهة -> تسجيل الدخول مجدداً للسوكت
        emitSocketEvent('registerUser', user._id);
        
        if (isFocused) {
          chatService.markMessagesAsRead(identifier);
          emitSocketEvent('readMessages', { identifier, senderId: recipientId });
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // الخروج للخلفية -> إبلاغ السيرفر بالخروج
        emitSocketEvent('goOffline');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [identifier, recipientId, isFocused, user._id]);

  const sendMessage = () => {
    if (inputText.trim() === '') return;

    const messageData = {
      recipientId: recipientId,
      content: inputText,
      messageType: 'text'
    };

    if (requestId) messageData.serviceRequest = requestId;
    if (chatRoomId) messageData.chatRoomId = chatRoomId;

    emitSocketEvent('sendMessage', messageData);
    setInputText('');
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('عفواً', 'نحتاج صلاحية الوصول للصور لإتمام العملية.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        setSelectedImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
      }
    } catch (error) {
      console.error('Pick Image Error:', error);
    }
  };

  const handleSendImages = async () => {
    if (selectedImages.length === 0) return;
    
    const imagesToUpload = [...selectedImages];
    setSelectedImages([]); // مسح القائمة فوراً
    
    setLoading(true);
    for (const uri of imagesToUpload) {
      await uploadImageMessage(uri);
    }
    setLoading(false);
  };

  const uploadImageMessage = async (uri) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri,
        name: `chat_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      formData.append('recipientId', recipientId);
      if (requestId) formData.append('serviceRequest', requestId);
      if (chatRoomId) formData.append('chatRoomId', chatRoomId);
      formData.append('messageType', 'image');

      const res = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.status === 'success') {
        const newMessage = res.data.data.message;
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('خطأ', 'فشل رفع بعض الصور');
    }
  };

  const renderDateSeparator = (dateStr) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];

    let label = dateStr;
    if (dateStr === today) label = 'اليوم';
    else if (dateStr === yesterday) label = 'الأمس';
    else {
      label = new Date(dateStr).toLocaleDateString('ar-LY', { day: 'numeric', month: 'long' });
    }

    return (
      <View style={styles.dateSeparator}>
        <View style={styles.dateLine} />
        <Text style={styles.dateText}>{label}</Text>
        <View style={styles.dateLine} />
      </View>
    );
  };

  const renderMessage = ({ item, index }) => {
    if (item.type === 'date') return renderDateSeparator(item.date);

    const isMe = item.sender._id === user._id || item.sender === user._id;
    const nextMsg = messages[index + 1];
    const isLastInGroup = !nextMsg || nextMsg.sender._id !== item.sender._id;

    return (
      <View style={[
        styles.messageWrapper, 
        isMe ? styles.myMessageWrapper : styles.theirMessageWrapper,
        isLastInGroup && { marginBottom: 16 }
      ]}>
        <View style={[
          styles.messageBubble, 
          isMe ? styles.myMessage : styles.theirMessage,
          !isLastInGroup && (isMe ? { borderBottomLeftRadius: 20 } : { borderBottomRightRadius: 20 })
        ]}>
          {item.messageType === 'image' ? (
            <Image source={{ uri: item.content }} style={styles.messageImage} resizeMode="cover" />
          ) : (
            <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
              {item.content}
            </Text>
          )}
          <View style={styles.messageFooter}>
             <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
               {new Date(item.createdAt).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}
             </Text>
              {isMe && (
                <Text style={[
                  styles.readStatus, 
                  item.isRead && styles.readStatusSeen
                ]}>
                  ✓✓
                </Text>
              )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronRight size={28} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{recipientName}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, isRecipientOnline ? styles.onlineDot : styles.offlineDot]} />
              <Text style={[styles.headerStatus, isRecipientOnline && styles.onlineText]}>
                {isRecipientOnline ? 'متصل الآن' : 'غير متصل'}
              </Text>
            </View>
          </View>
          <View style={styles.avatarPlaceholder}>
             <Text style={styles.avatarText}>{recipientName.charAt(0)}</Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={groupMessages(messages)}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {/* معاينة الصور المختارة */}
        {selectedImages.length > 0 && (
          <View style={styles.imagePreviewContainer}>
            <FlatList
              horizontal
              data={selectedImages}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.previewImageWrapper}>
                  <Image source={{ uri: item }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.removePreviewBtn}
                    onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                  >
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={{ paddingHorizontal: 12 }}
            />
            <TouchableOpacity 
              style={styles.sendAllImagesBtn} 
              onPress={handleSendImages}
              disabled={loading}
            >
              <Send size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
            <ImageIcon size={24} color="#64748B" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="اكتب رسالتك هنا..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Send size={20} color="#FFF" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  headerSafe: { backgroundColor: '#FFF' },
  header: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1, marginRight: 12, alignItems: 'flex-end' },
  headerName: { fontSize: 18, fontWeight: '700', color: '#1E293B', textAlign: 'right' },
  headerStatus: { fontSize: 12, color: '#64748B', textAlign: 'right' },
  statusRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 6 },
  onlineDot: { backgroundColor: '#10B981' },
  offlineDot: { backgroundColor: '#94A3B8' },
  onlineText: { color: '#10B981', fontWeight: '600' },
  avatarPlaceholder: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#E2E8F0', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { fontWeight: '900', color: '#FFF', fontSize: 18 },
  messagesList: { padding: 16, paddingBottom: 20 },
  
  dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, paddingHorizontal: 10 },
  dateLine: { flex: 1, height: 1, backgroundColor: '#CBD5E1', opacity: 0.5 },
  dateText: { marginHorizontal: 12, fontSize: 12, color: '#64748B', fontWeight: '800' },

  messageWrapper: { width: '100%', marginBottom: 4 },
  myMessageWrapper: { alignItems: 'flex-start' },
  theirMessageWrapper: { alignItems: 'flex-end' },

  messageBubble: { maxWidth: '85%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
  myMessage: { backgroundColor: '#4F46E5', borderBottomLeftRadius: 4 },
  theirMessage: { backgroundColor: '#FFF', borderBottomRightRadius: 4 },
  
  messageText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  myMessageText: { color: '#FFF' },
  theirMessageText: { color: '#1E293B' },
  
  messageFooter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 2 },
  messageTime: { fontSize: 9, marginTop: 2 },
  myMessageTime: { color: 'rgba(255,255,255,0.7)' },
  theirMessageTime: { color: '#94A3B8' },
  readStatus: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginLeft: 4, fontWeight: '700' },
  readStatusSeen: { color: '#60A5FA' },

  inputContainer: { 
    flexDirection: 'row-reverse', 
    alignItems: 'flex-end', 
    padding: 10, 
    backgroundColor: '#FFF', 
    borderTopWidth: 1, 
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10
  },
  input: { 
    flex: 1, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    marginHorizontal: 8, 
    textAlign: 'right', 
    maxHeight: 120,
    fontSize: 15,
    color: '#1E293B'
  },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  sendBtnDisabled: { backgroundColor: '#CBD5E1' },
  attachBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  messageImage: { width: 220, height: 160, borderRadius: 12, marginBottom: 4 },
  
  imagePreviewContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  previewImageWrapper: {
    marginRight: 10,
    position: 'relative'
  },
  previewImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  removePreviewBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendAllImagesBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 4
  }
});

export default ChatScreen;
