import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Bell, ChevronRight, Check, Trash2, Inbox } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getMyNotifications, markAsRead } from '../../api/notificationService';

/**
 * شاشة صندوق الإشعارات (NotificationCenterScreen)
 * تعرض قائمة بكافة الإشعارات الواردة للمستخدم الحالي (فني أو عميل)
 * تتيح تمييز الإشعار كـ "مقروء" والتوجيه الذكي عند الضغط عليه.
 */
export default function NotificationCenterScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // دالة جلب الإشعارات من السيرفر
  const fetchNotifications = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    const result = await getMyNotifications();
    if (result.success) {
      setNotifications(result.notifications);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  // دالة تنسيق الوقت بشكل مقروء ومناسب
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }) + ' - ' + 
             date.toLocaleDateString('ar-LY', { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  // دالة التعامل مع الضغط على الإشعار
  const handleNotificationPress = async (item) => {
    // 1. إذا كان الإشعار غير مقروء، نقوم بتمييزه كمقروء في السيرفر وتحديث الواجهة محلياً
    if (!item.isRead) {
      // تحديث الحالة محلياً فوراً لتحسين سرعة استجابة الـ UI (Optimistic Update)
      setNotifications(prev => 
        prev.map(notif => notif._id === item._id ? { ...notif, isRead: true } : notif)
      );
      // إرسال طلب التحديث للسيرفر في الخلفية
      await markAsRead(item._id);
    }

    // 2. نظام التوجيه الذكي (Routing Switch) بناءً على نوع الإشعار والـ payload
    const hasRelatedId = item.relatedId;
    
    if (hasRelatedId && (item.type === 'order' || item.type === 'expired_request')) {
      if (user?.role === 'technician') {
        // توجيه الفني لشاشة تفاصيل المهمة
        navigation.navigate('TechnicianJobDetails', { requestId: item.relatedId });
      } else {
        // توجيه العميل لشاشة تفاصيل الحجز
        navigation.navigate('BookingDetails', { order: { _id: item.relatedId } });
      }
    } else {
      console.log('إشعار عام أو لا يحتوي على معرف مرتبط للتوجيه');
    }
  };

  // عنصر القائمة الفردي (Notification Item Card)
  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.card,
          !item.isRead && styles.unreadCard
        ]}
      >
        <View style={styles.cardHeader}>
          {/* مؤشر غير مقروء */}
          {!item.isRead && <View style={styles.unreadDot} />}
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
        </View>

        <Text style={[styles.titleText, !item.isRead && styles.unreadTitleText]}>
          {item.title}
        </Text>
        
        <Text style={styles.messageText}>
          {item.message}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      
      {/* رأس الصفحة */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ChevronRight size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>صندوق الإشعارات</Text>
        <View style={styles.headerIcon}>
          <Bell size={20} color="#4F46E5" />
        </View>
      </View>

      {/* محتوى الشاشة */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>جاري تحميل الإشعارات...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Inbox size={48} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>صندوق الإشعارات فارغ</Text>
              <Text style={styles.emptySub}>ستظهر هنا جميع التنبيهات وإشعارات الطلبات فور وصولها.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFBFD' },
  header: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  backBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: '#F8FAFC', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  headerIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: '#EEF2FF', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  listContent: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    alignItems: 'flex-end', // لمحاذاة النص العربي
  },
  unreadCard: {
    borderColor: '#E0E7FF',
    borderRightWidth: 5,
    borderRightColor: '#4F46E5', // تمييز الإشعار غير المقروء بشريط أزرق جانبي مميز
    backgroundColor: '#F9FAFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    alignItems: 'center'
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 'auto'
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textAlign: 'right',
  },
  unreadTitleText: {
    color: '#0F172A',
    fontWeight: '800'
  },
  messageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'right',
    lineHeight: 20
  },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 100, 
    paddingHorizontal: 20 
  },
  emptyIconBox: { 
    width: 90, 
    height: 90, 
    borderRadius: 30, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 25
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 10 },
  emptySub: { 
    fontSize: 13, 
    color: '#94A3B8', 
    textAlign: 'center', 
    lineHeight: 20 
  }
});
