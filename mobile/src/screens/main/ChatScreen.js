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
  AppState,
  Modal,
  StatusBar,
  Dimensions
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Send, ChevronRight, Image as ImageIcon, Camera, MoreVertical, AlertCircle, Mic, Play, Pause, Square, Trash2 } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useAuth } from '../../context/AuthContext';
import { getSocket, emitSocketEvent, onSocketEvent, offSocketEvent } from '../../services/SocketService';
import * as chatService from '../../api/chatService';
import api from '../../api/api';

const ChatScreen = ({ route, navigation }) => {
  const { requestId, chatRoomId, recipientId, recipientName, unifiedByUser } = route.params;
  const flatListRef = useRef();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);

  // Audio Recording & Playing States
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState(null);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceMetering, setVoiceMetering] = useState([]);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  // 🖼️ Image Viewer State
  const [imageViewerUrl, setImageViewerUrl] = useState(null);

  const identifier = requestId || chatRoomId;
  const markUnifiedMessagesAsRead = useCallback(async (msgs = []) => {
    if (!unifiedByUser || !isFocused || AppState.currentState !== 'active') return;

    const unreadFromOther = msgs.filter((m) => {
      const senderId = m.sender?._id || m.sender;
      const recipient = m.recipient?._id || m.recipient;
      return String(senderId) === String(recipientId) && String(recipient) === String(user._id) && !m.isRead;
    });

    const identifiers = new Set();
    unreadFromOther.forEach((m) => {
      const id = m.serviceRequest || m.chatRoomId;
      if (id) identifiers.add(String(id));
    });

    for (const id of identifiers) {
      await chatService.markMessagesAsRead(id);
      emitSocketEvent('readMessages', { identifier: id, senderId: recipientId });
    }
  }, [unifiedByUser, isFocused, recipientId, user._id]);

  const handleReportChat = () => {
    Alert.alert(
      'تقديم بلاغ حول المحادثة ⚠️',
      'الرجاء اختيار سبب البلاغ:',
      [
        {
          text: 'سلوك غير لائق 🚫',
          onPress: () => submitChatReport('behavior')
        },
        {
          text: 'محاولة خارج التطبيق 💰',
          onPress: () => submitChatReport('bypass_commission')
        },
        {
          text: 'سبب آخر ✏️',
          onPress: () => submitChatReport('other')
        },
        {
          text: 'تراجع',
          style: 'cancel'
        }
      ],
      { cancelable: true }
    );
  };

  const submitChatReport = async (category) => {
    Alert.alert(
      'تأكيد الشكوى 📋',
      'هل أنت متأكد من إرسال هذا البلاغ للإدارة؟ سيتم مراجعة المحادثة واتخاذ الإجراء المناسب.',
      [
        {
          text: 'نعم، إرسال',
          onPress: async () => {
            try {
              const res = await api.post('/reports/submit', {
                reportedId: recipientId,
                source: 'chat',
                chatRoomId: identifier,
                category,
                description: 'بلاغ مباشر من المحادثة بخصوص السلوك أو الالتزام.'
              });

              if (res.data.status === 'success') {
                Alert.alert('نجح البلاغ ✅', 'تم إرسال بلاغك بنجاح وجاري المراجعة من قبل الإدارة.');
              } else {
                Alert.alert('خطأ', 'فشل في إرسال البلاغ');
              }
            } catch (error) {
              console.error(error);
              Alert.alert('خطأ', 'حدث خطأ غير متوقع أثناء إرسال البلاغ');
            }
          }
        },
        {
          text: 'إلغاء',
          style: 'cancel'
        }
      ]
    );
  };

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
      const history = unifiedByUser
        ? await chatService.getChatHistoryWithUser(recipientId)
        : await chatService.getChatHistory(identifier);
      if (history.success) {
        setMessages(history.data);
        if (unifiedByUser) {
          markUnifiedMessagesAsRead(history.data);
        }
      }
      setLoading(false);
      
      if (!unifiedByUser && isFocused && AppState.currentState === 'active') {
        chatService.markMessagesAsRead(identifier);
      }
    };
    fetchHistory();
  }, [identifier, isFocused, unifiedByUser, recipientId, markUnifiedMessagesAsRead]);

  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      const msgIdentifier = newMessage.serviceRequest || newMessage.chatRoomId;
      const senderIdRaw = newMessage.sender?._id || newMessage.sender;
      const recipientIdRaw = newMessage.recipient?._id || newMessage.recipient;
      const isSamePeer =
        String(senderIdRaw) === String(recipientId) || String(recipientIdRaw) === String(recipientId);
      if ((unifiedByUser && isSamePeer) || (!unifiedByUser && msgIdentifier === identifier)) {
        setMessages(prev => [...prev, newMessage]);
        
        // التحقق إن كانت الرسالة من الطرف الآخر (وليست تأكيد إرسال لرسالتي أنا)
        const senderId = newMessage.sender._id || newMessage.sender;
        const isFromOther = senderId !== user._id;

        // لا نرسل "تم القراءة" إلا إذا كانت الرسالة من الطرف الآخر وكان المستخدم داخل الشات حالياً والتطبيق نشط
        if (isFromOther && isFocused && AppState.currentState === 'active') {
          if (unifiedByUser) {
            const msgId = newMessage.serviceRequest || newMessage.chatRoomId;
            if (msgId) {
              chatService.markMessagesAsRead(msgId);
              emitSocketEvent('readMessages', { identifier: msgId, senderId });
            }
          } else {
            chatService.markMessagesAsRead(identifier);
            emitSocketEvent('readMessages', { identifier, senderId });
          }
        }
      }
    };

    const handleMessagesRead = (data) => {
      if ((unifiedByUser && String(data.readerId) === String(recipientId)) || data.identifier === identifier) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      }
    };

    const handleStatusChange = (data) => {
      if (data.userId === recipientId) {
        setIsRecipientOnline(data.isOnline);
      }
    };

    // دالة للتحقق من حالة الاتصال بعد تأخير بسيط (لانتظار registerUser)
    const checkStatusWithDelay = () => {
      setTimeout(() => emitSocketEvent('checkUserStatus', recipientId), 500);
    };

    // مراقبة إعادة الاتصال (reconnect) لإعادة فحص الحالة
    const handleReconnect = () => {
      emitSocketEvent('registerUser', user._id);
      checkStatusWithDelay();
    };

    onSocketEvent('receiveMessage', handleReceiveMessage);
    onSocketEvent('messageSent', handleReceiveMessage); 
    onSocketEvent('messagesRead', handleMessagesRead);
    onSocketEvent('userStatusChanged', handleStatusChange);
    onSocketEvent('connect', handleReconnect);

    // الفحص الأولي لحالة الطرف الآخر (مع تأخير بسيط لانتظار تسجيل الـ Socket)
    checkStatusWithDelay();

    // إبلاغ السيرفر بأننا فتحنا الشات وقرأنا الرسائل السابقة (فقط إذا كان الشات في الواجهة والتطبيق نشط)
    if (isFocused && AppState.currentState === 'active') {
      emitSocketEvent('enterChat', { partnerId: recipientId, identifier });
      if (!unifiedByUser) {
        emitSocketEvent('readMessages', { identifier, senderId: recipientId });
      }
    }

    return () => {
      offSocketEvent('receiveMessage', handleReceiveMessage);
      offSocketEvent('messageSent', handleReceiveMessage);
      offSocketEvent('messagesRead', handleMessagesRead);
      offSocketEvent('userStatusChanged', handleStatusChange);
      offSocketEvent('connect', handleReconnect);
      emitSocketEvent('leaveChat');
    };
  }, [identifier, recipientId, isFocused, unifiedByUser]);

  // مراقبة حالة التطبيق (Foreground/Background) لضمان دقة الـ Seen والـ Online status
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // العودة للواجهة -> تسجيل الدخول مجدداً للسوكت + إعادة فحص حالة الطرف الآخر
        emitSocketEvent('registerUser', user._id);
        setTimeout(() => emitSocketEvent('checkUserStatus', recipientId), 500);
        
        if (isFocused) {
          emitSocketEvent('enterChat', { partnerId: recipientId, identifier });
        }

        if (!unifiedByUser && isFocused) {
          chatService.markMessagesAsRead(identifier);
          emitSocketEvent('readMessages', { identifier, senderId: recipientId });
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // الخروج للخلفية -> إبلاغ السيرفر بالخروج
        emitSocketEvent('leaveChat');
        emitSocketEvent('goOffline');
      }
    });

    if (isFocused && AppState.currentState === 'active') {
      emitSocketEvent('enterChat', { partnerId: recipientId, identifier });
    }

    return () => {
      subscription.remove();
      emitSocketEvent('leaveChat');
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [identifier, recipientId, isFocused, user._id, unifiedByUser, sound]);

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

  // 🎙️ Audio Recording Functions
  // 🎙️ Audio Recording Functions
  const startRecording = async () => {
    try {
      // 1. Request mic permission
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('عفواً', 'نحتاج صلاحية الوصول للميكروفون لتسجيل الصوت.');
        return;
      }

      // 2. Set iOS audio settings
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Reset values
      setRecordingDuration(0);
      setVoiceMetering([]);

      // 3. Start recording with status update for metering
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {}
      });

      // Enable metering explicitly
      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setRecordingDuration(Math.round(status.durationMillis / 1000));
          
          // Get metering / decibels and convert to relative height percentage
          if (status.metering !== undefined) {
            // status.metering is usually between -160 and 0
            const relativeVolume = Math.max(0, status.metering + 160) / 160;
            // Get random-normalized dynamic height (e.g. 5px to 30px)
            const height = 5 + Math.round(relativeVolume * 25);
            setVoiceMetering(prev => {
              const next = [...prev, height];
              if (next.length > 22) next.shift(); // Keep last 22 bars
              return next;
            });
          } else {
            // Fallback waveform animation if metering is unsupported
            const height = 5 + Math.floor(Math.random() * 25);
            setVoiceMetering(prev => {
              const next = [...prev, height];
              if (next.length > 22) next.shift();
              return next;
            });
          }
        }
      });

      // Progress interval mapping for status updates every 100ms
      await newRecording.setProgressUpdateInterval(100);
      await newRecording.startAsync();
      
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('[Audio] Failed to start recording:', err);
      Alert.alert('خطأ', 'فشل في بدء التسجيل الصوتي');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const durationSec = Math.round((status.durationMillis || 0) / 1000);
      
      setRecording(null);
      setRecordingDuration(0);
      setVoiceMetering([]);

      // Reset audio mode to playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (uri) {
        uploadAudioMessage(uri, durationSec || 1);
      }
    } catch (err) {
      console.error('[Audio] Failed to stop recording:', err);
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setRecordingDuration(0);
      setVoiceMetering([]);
    } catch (err) {
      console.error('[Audio] Failed to cancel recording:', err);
    }
  };

  const uploadAudioMessage = async (uri, durationSec) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri,
        name: `chat_${Date.now()}.m4a`,
        type: 'audio/m4a',
      });
      formData.append('recipientId', recipientId);
      if (requestId) formData.append('serviceRequest', requestId);
      if (chatRoomId) formData.append('chatRoomId', chatRoomId);
      formData.append('messageType', 'audio');
      formData.append('audioDuration', String(durationSec));

      const res = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.status === 'success') {
        const newMessage = res.data.data.message;
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error('Audio upload error:', error);
      Alert.alert('خطأ', 'فشل رفع التسجيل الصوتي');
    } finally {
      setLoading(false);
    }
  };

  // 🔊 Audio Playback Functions
  const playSound = async (msgId, audioUrl) => {
    try {
      // If a sound is already playing
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setPlaybackPosition(0);
        setPlaybackDuration(0);
        if (playingMessageId === msgId) {
          setPlayingMessageId(null);
          return;
        }
      }

      setPlayingMessageId(msgId);
      setPlaybackPosition(0);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 250 }
      );
      
      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          // تحديث عداد التشغيل المباشر
          setPlaybackPosition(Math.floor((status.positionMillis || 0) / 1000));
          setPlaybackDuration(Math.floor((status.durationMillis || 0) / 1000));
          
          if (status.didJustFinish) {
            setPlayingMessageId(null);
            setPlaybackPosition(0);
            setPlaybackDuration(0);
            newSound.unloadAsync();
            setSound(null);
          }
        }
      });
    } catch (err) {
      console.error('[Audio] Playback error:', err);
      Alert.alert('خطأ', 'فشل في تشغيل الملف الصوتي');
      setPlayingMessageId(null);
      setPlaybackPosition(0);
      setPlaybackDuration(0);
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
            <TouchableOpacity activeOpacity={0.9} onPress={() => setImageViewerUrl(item.content)}>
              <Image source={{ uri: item.content }} style={styles.messageImage} resizeMode="cover" />
            </TouchableOpacity>
          ) : item.messageType === 'audio' ? (
            <View style={styles.audioPlayerContainer}>
              <TouchableOpacity 
                style={[styles.audioPlayBtn, isMe ? styles.myAudioPlayBtn : styles.theirAudioPlayBtn]} 
                onPress={() => playSound(item._id, item.content)}
              >
                {playingMessageId === item._id ? (
                  <Pause size={16} color={isMe ? '#4F46E5' : '#FFF'} fill={isMe ? '#4F46E5' : '#FFF'} />
                ) : (
                  <Play size={16} color={isMe ? '#4F46E5' : '#FFF'} fill={isMe ? '#4F46E5' : '#FFF'} />
                )}
              </TouchableOpacity>
              
              {/* Modern Waveform Design inside Bubble */}
              <View style={styles.waveformPlaybackContainer}>
                {/* 15 Static bars representing a modern voice message waveform */}
                {[12, 18, 8, 22, 14, 25, 10, 16, 12, 20, 6, 15, 12, 18, 8].map((h, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.waveformPlaybackBar, 
                      { 
                        height: h, 
                        backgroundColor: isMe 
                          ? (playingMessageId === item._id ? '#60A5FA' : 'rgba(255,255,255,0.4)') 
                          : (playingMessageId === item._id ? '#4F46E5' : '#CBD5E1')
                      }
                    ]} 
                  />
                ))}
              </View>

              <View style={styles.audioWaveformInfo}>
                <Text style={[styles.audioDurationText, isMe ? styles.myAudioDurationText : styles.theirAudioDurationText]}>
                  {playingMessageId === item._id
                    ? `${Math.floor(playbackPosition / 60)}:${(playbackPosition % 60).toString().padStart(2, '0')}`
                    : item.audioDuration
                      ? `${Math.floor(item.audioDuration / 60)}:${(item.audioDuration % 60).toString().padStart(2, '0')}`
                      : '0:00'
                  }
                </Text>
              </View>
            </View>
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

      {/* ── Image Viewer Full-Screen Modal ── */}
      <Modal
        visible={!!imageViewerUrl}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageViewerUrl(null)}
        statusBarTranslucent
      >
        <View style={styles.imageViewerOverlay}>
          <StatusBar backgroundColor="#000" barStyle="light-content" />
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => setImageViewerUrl(null)}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Text style={styles.imageViewerCloseText}>✕</Text>
          </TouchableOpacity>
          {imageViewerUrl && (
            <Image
              source={{ uri: imageViewerUrl }}
              style={styles.imageViewerFull}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
          <TouchableOpacity onPress={handleReportChat} style={styles.reportBtn}>
            <AlertCircle size={22} color="#EF4444" />
          </TouchableOpacity>
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

        {/* معاينة الصور المختارة والمصغرات فوق شريط الإدخال */}
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
          </View>
        )}

        <View style={styles.inputContainer}>
          {isRecording ? (
            <View style={styles.recordingWrapper}>
              <TouchableOpacity style={styles.cancelRecordBtn} onPress={cancelRecording}>
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
              
              {/* Voice Metering Waveform Simulator */}
              <View style={styles.meteringContainer}>
                {voiceMetering.map((height, idx) => (
                  <View 
                    key={idx} 
                    style={[
                      styles.meteringBar, 
                      { height: height, backgroundColor: '#10B981' }
                    ]} 
                  />
                ))}
                {voiceMetering.length === 0 && (
                  <View style={[styles.meteringBar, { height: 5, backgroundColor: '#CBD5E1' }]} />
                )}
              </View>

              {/* Counter Display */}
              <Text style={styles.recordingTimerText}>
                {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </Text>

              <TouchableOpacity style={styles.stopRecordBtn} onPress={stopRecording}>
                <Square size={16} color="#FFF" fill="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
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
              {inputText.trim() === '' && selectedImages.length === 0 ? (
                <TouchableOpacity 
                  style={[styles.sendBtn, { backgroundColor: '#10B981' }]} 
                  onPress={startRecording}
                >
                  <Mic size={20} color="#FFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[
                    styles.sendBtn, 
                    (!inputText.trim() && selectedImages.length === 0) && styles.sendBtnDisabled
                  ]} 
                  onPress={async () => {
                    if (inputText.trim() === '' && selectedImages.length === 0) return;
                    
                    const textToSend = inputText.trim();
                    const imagesToSend = [...selectedImages];
                    
                    // تفريغ المدخلات فوراً لتفادي التكرار وسرعة الاستجابة بالواجهة
                    setInputText('');
                    setSelectedImages([]);
                    setLoading(true);

                    try {
                      // 1. إرسال الصور أولاً إن وجدت
                      if (imagesToSend.length > 0) {
                        for (let i = 0; i < imagesToSend.length; i++) {
                          const imgUri = imagesToSend[i];
                          // إذا كانت هناك صورة واحدة ومعه نص، نرسل النص مع الصورة في رسالة واحدة أو منفصلة
                          // منطق إرسال الصورة
                          const formData = new FormData();
                          formData.append('image', {
                            uri: imgUri,
                            name: `chat_${Date.now()}_${i}.jpg`,
                            type: 'image/jpeg',
                          });
                          formData.append('recipientId', recipientId);
                          if (requestId) formData.append('serviceRequest', requestId);
                          if (chatRoomId) formData.append('chatRoomId', chatRoomId);
                          formData.append('messageType', 'image');
                          
                          // إذا كانت هذه هي الصورة الأخيرة ومعها نص، نربطهما معاً أو نرسل النص في نفس المحادثة
                          const res = await api.post('/chat/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });

                          if (res.data.status === 'success') {
                            const newMessage = res.data.data.message;
                            setMessages(prev => [...prev, newMessage]);
                          }
                        }
                      }

                      // 2. إرسال النص إن وجد وكان منفصلاً أو بعد الصور
                      if (textToSend !== '') {
                        const messageData = {
                          recipientId: recipientId,
                          content: textToSend,
                          messageType: 'text'
                        };

                        if (requestId) messageData.serviceRequest = requestId;
                        if (chatRoomId) messageData.chatRoomId = chatRoomId;

                        emitSocketEvent('sendMessage', messageData);
                      }
                    } catch (err) {
                      console.error('Error sending message/images:', err);
                      Alert.alert('خطأ', 'فشل في إرسال الرسالة أو الصور. يرجى المحاولة مجدداً.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={inputText.trim() === '' && selectedImages.length === 0}
                >
                  {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Send size={20} color="#FFF" />}
                </TouchableOpacity>
              )}
            </>
          )}
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
  reportBtn: { padding: 8, justifyContent: 'center', alignItems: 'center' },
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
  },
  
  // ────────────────────────────────────────────────────────────
  // 🎙️  Voice Note – Recording Bar Styles
  // ────────────────────────────────────────────────────────────
  recordingWrapper: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  cancelRecordBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  meteringContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    overflow: 'hidden',
    gap: 2,
    marginHorizontal: 6,
  },
  meteringBar: {
    width: 3,
    borderRadius: 3,
    alignSelf: 'center',
  },
  recordingTimerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
    marginHorizontal: 6,
    minWidth: 34,
    textAlign: 'center',
  },
  stopRecordBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#10B981',
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },

  // ────────────────────────────────────────────────────────────
  // 🎙️  Voice Note – Message Bubble Player Styles
  // ────────────────────────────────────────────────────────────
  audioPlayerContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    minWidth: 180,
    maxWidth: 220,
  },
  audioPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    flexShrink: 0,
  },
  myAudioPlayBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  theirAudioPlayBtn: {
    backgroundColor: '#4F46E5',
  },
  waveformPlaybackContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    gap: 2,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  waveformPlaybackBar: {
    width: 3,
    borderRadius: 3,
    alignSelf: 'center',
  },
  audioWaveformInfo: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 28,
  },
  audioDurationText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  myAudioDurationText: {
    color: 'rgba(255,255,255,0.8)',
  },
  theirAudioDurationText: {
    color: '#64748B',
  },

  // ────────────────────────────────────────────────────────────
  // 🖼️  Image Viewer Modal Styles
  // ────────────────────────────────────────────────────────────
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerFull: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.85,
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
});

export default ChatScreen;
