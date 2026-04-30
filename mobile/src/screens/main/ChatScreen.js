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
  Image
} from 'react-native';
import { Send, ChevronRight, Image as ImageIcon } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getSocket, emitSocketEvent, onSocketEvent, offSocketEvent } from '../../services/SocketService';
import * as chatService from '../../api/chatService';

const ChatScreen = ({ route, navigation }) => {
  const { requestId, recipientId, recipientName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef();

  // 1. جلب التاريخ عند التحميل
  useEffect(() => {
    const fetchHistory = async () => {
      const history = await chatService.getChatHistory(requestId);
      if (history.success) {
        setMessages(history.data);
      }
      chatService.markMessagesAsRead(requestId);
    };
    fetchHistory();
  }, [requestId]);

  // 2. الاستماع للرسائل الجديدة عبر السوكت
  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      // فقط إذا كانت الرسالة تخص هذا الطلب
      if (newMessage.serviceRequest === requestId) {
        setMessages(prev => [...prev, newMessage]);
        chatService.markMessagesAsRead(requestId);
      }
    };

    onSocketEvent('receiveMessage', handleReceiveMessage);
    onSocketEvent('messageSent', handleReceiveMessage); // لتحديث الحالة محلياً بعد التأكيد

    return () => {
      offSocketEvent('receiveMessage', handleReceiveMessage);
      offSocketEvent('messageSent', handleReceiveMessage);
    };
  }, [requestId]);

  const sendMessage = () => {
    if (inputText.trim() === '') return;

    const messageData = {
      serviceRequest: requestId,
      recipientId: recipientId,
      content: inputText,
      messageType: 'text'
    };

    emitSocketEvent('sendMessage', messageData);
    setInputText('');
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender._id === user._id || item.sender === user._id;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        {!isMe && (
          <Text style={styles.senderName}>{recipientName}</Text>
        )}
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
          {item.content}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(item.createdAt).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronRight size={28} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{recipientName}</Text>
          <Text style={styles.headerStatus}>متصل الآن</Text>
        </View>
        <View style={styles.avatarPlaceholder}>
           <Text style={styles.avatarText}>{recipientName.charAt(0)}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item._id || index.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn}>
            <ImageIcon size={24} color="#94A3B8" />
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
            <Send size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerInfo: { flex: 1, marginRight: 12, alignItems: 'flex-end' },
  headerName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  headerStatus: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: '900', color: '#64748B' },
  messagesList: { padding: 16, paddingBottom: 32 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 20, marginBottom: 12 },
  myMessage: { alignSelf: 'flex-start', backgroundColor: '#4F46E5', borderBottomLeftRadius: 4 },
  theirMessage: { alignSelf: 'flex-end', backgroundColor: '#FFF', borderBottomRightRadius: 4, borderWidth: 1, borderColor: '#F1F5F9' },
  messageText: { fontSize: 15, lineHeight: 22 },
  myMessageText: { color: '#FFF' },
  theirMessageText: { color: '#1E293B' },
  senderName: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 4, textAlign: 'right' },
  messageTime: { fontSize: 10, color: 'rgba(0,0,0,0.4)', marginTop: 4, alignSelf: 'flex-end' },
  inputContainer: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  input: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 8, textAlign: 'right', maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#E2E8F0' },
  attachBtn: { padding: 4 }
});

export default ChatScreen;
