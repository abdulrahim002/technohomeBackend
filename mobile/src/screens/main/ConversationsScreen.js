import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { MessageSquare, ChevronLeft, User as UserIcon, Clock, Search } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import useAuthStore from '../../store/useAuthStore';

/**
 * ConversationsScreen - شاشة استعراض المحادثات النشطة
 */
const ConversationsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { token } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setConversations(res.data.data.conversations);
      }
    } catch (err) {
      console.error('[Conversations] Fetch failed:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
    // Refresh when screen focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchConversations();
    });
    return unsubscribe;
  }, [fetchConversations, navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const formatTime = (time) => {
    const now = new Date();
    const msgDate = new Date(time);
    const diffDays = Math.floor((now - msgDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return msgDate.toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'الأمس';
    } else if (diffDays < 7) {
      return msgDate.toLocaleDateString('ar-LY', { weekday: 'short' });
    } else {
      return msgDate.toLocaleDateString('ar-LY', { day: 'numeric', month: 'short' });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.conversationCard, item.unreadCount > 0 && styles.unreadCard]}
      onPress={() => {
        const isRoom = item.id.includes('_');
        navigation.navigate('Chat', {
          requestId: isRoom ? null : item.id,
          chatRoomId: isRoom ? item.id : null,
          recipientId: item.otherUser._id,
          recipientName: `${item.otherUser.firstName} ${item.otherUser.lastName}`
        });
      }}
    >
      <View style={styles.avatarContainer}>
        {item.otherUser.profileImage ? (
          <Image source={{ uri: item.otherUser.profileImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.otherUser.firstName.charAt(0)}</Text>
          </View>
        )}
        {item.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.convContent}>
        <View style={styles.convHeader}>
          <Text style={styles.userName}>{`${item.otherUser.firstName} ${item.otherUser.lastName}`}</Text>
          <Text style={[styles.timeText, item.unreadCount > 0 && styles.unreadTimeText]}>
            {formatTime(item.lastMessageTime)}
          </Text>
        </View>
        <Text style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      <ChevronLeft size={16} color="#CBD5E1" style={{ marginLeft: 5 }} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المحادثات</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MessageSquare size={60} color="#E2E8F0" strokeWidth={1} />
              <Text style={styles.emptyTitle}>لا توجد محادثات نشطة</Text>
              <Text style={styles.emptySubtitle}>ابدأ محادثة مع الفنيين أو العملاء لتظهر هنا</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  listContainer: { padding: 16, paddingBottom: 40 },
  conversationCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  unreadCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#E0F2FE',
    borderWidth: 1,
  },
  avatarContainer: { width: 60, height: 60, marginLeft: 15, position: 'relative' },
  avatar: { width: '100%', height: '100%', borderRadius: 20 },
  avatarPlaceholder: { 
    width: '100%', height: '100%', borderRadius: 20, 
    backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' 
  },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#4F46E5', minWidth: 22, height: 22,
    borderRadius: 11, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, borderWidth: 3, borderColor: '#FFF'
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  convContent: { flex: 1, alignItems: 'flex-end', paddingLeft: 10 },
  convHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%', marginBottom: 6 },
  userName: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  timeText: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
  unreadTimeText: { color: '#4F46E5' },
  lastMessage: { fontSize: 14, color: '#64748B', fontWeight: '500', lineHeight: 20 },
  unreadMessage: { color: '#1E293B', fontWeight: '700' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginTop: 20 },
  emptySubtitle: { fontSize: 15, color: '#94A3B8', textAlign: 'center', marginTop: 10, paddingHorizontal: 40, lineHeight: 22 },
});

export default ConversationsScreen;
