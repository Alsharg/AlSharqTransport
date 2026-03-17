import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { Notification } from '../services/types';

// ===== Notification Type Config =====
interface NotifTypeConfig {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
}

const NOTIF_TYPES: Record<string, NotifTypeConfig> = {
  trip_new: { icon: 'local-taxi', color: '#3B82F6', bgColor: '#3B82F615', label: 'مشوار جديد' },
  trip_accepted: { icon: 'check-circle', color: '#F59E0B', bgColor: '#F59E0B15', label: 'تم قبول المشوار' },
  trip_confirmed: { icon: 'handshake', color: '#14B8A6', bgColor: '#14B8A615', label: 'تم الاتفاق' },
  trip_rejected: { icon: 'cancel', color: '#EF4444', bgColor: '#EF444415', label: 'تم رفض الطلب' },
  trip_completed: { icon: 'flag', color: '#22C55E', bgColor: '#22C55E15', label: 'مشوار مكتمل' },
  trip_application: { icon: 'person-add', color: '#8B5CF6', bgColor: '#8B5CF615', label: 'طلب سائق' },
  trip_status_change: { icon: 'swap-horiz', color: '#06B6D4', bgColor: '#06B6D415', label: 'تحديث حالة' },
  rating_new: { icon: 'star', color: '#FBBF24', bgColor: '#FBBF2415', label: 'تقييم جديد' },
  approval: { icon: 'how-to-reg', color: '#22C55E', bgColor: '#22C55E15', label: 'موافقة' },
  rejection: { icon: 'person-off', color: '#EF4444', bgColor: '#EF444415', label: 'رفض' },
  bonus: { icon: 'emoji-events', color: '#22C55E', bgColor: '#22C55E15', label: 'مكافأة' },
  penalty: { icon: 'remove-circle', color: '#EF4444', bgColor: '#EF444415', label: 'خصم' },
  announcement: { icon: 'campaign', color: '#8B5CF6', bgColor: '#8B5CF615', label: 'إعلان' },
  wallet_approved: { icon: 'account-balance-wallet', color: '#22C55E', bgColor: '#22C55E15', label: 'شحن المحفظة' },
  wallet_rejected: { icon: 'money-off', color: '#EF4444', bgColor: '#EF444415', label: 'رفض الشحن' },
  commission_confirmed: { icon: 'receipt-long', color: '#22C55E', bgColor: '#22C55E15', label: 'تأكيد عمولة' },
  driver_approval_request: { icon: 'person-pin', color: '#8B5CF6', bgColor: '#8B5CF615', label: 'طلب موافقة سائق' },
  general: { icon: 'info', color: '#64748B', bgColor: '#64748B15', label: 'عام' },
};

const getConfig = (type: string): NotifTypeConfig => NOTIF_TYPES[type] || NOTIF_TYPES.general;

function getTimeAgo(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(diffMs / 3600000);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(diffMs / 86400000);
  if (days < 7) return `منذ ${days} يوم`;
  return new Date(timestamp).toLocaleDateString('ar-SA');
}

type FilterType = 'all' | 'trips' | 'approvals' | 'wallet' | 'ratings';

const FILTERS: { id: FilterType; label: string; icon: string }[] = [
  { id: 'all', label: 'الكل', icon: 'notifications' },
  { id: 'trips', label: 'المشاوير', icon: 'local-taxi' },
  { id: 'approvals', label: 'الموافقات', icon: 'how-to-reg' },
  { id: 'wallet', label: 'المحفظة', icon: 'account-balance-wallet' },
  { id: 'ratings', label: 'التقييمات', icon: 'star' },
];

const TRIP_TYPES = new Set(['trip_new', 'trip_accepted', 'trip_confirmed', 'trip_rejected', 'trip_completed', 'trip_application', 'trip_status_change', 'driver_approval_request']);
const APPROVAL_TYPES = new Set(['approval', 'rejection', 'trip_application', 'driver_approval_request']);
const WALLET_TYPES = new Set(['wallet_approved', 'wallet_rejected', 'commission_confirmed', 'bonus', 'penalty']);
const RATING_TYPES = new Set(['rating_new']);

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userRole } = useAuth();
  const { notifications, markNotificationRead, handleNotificationAction } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = [...notifications]
    .filter(n => {
      if (filter === 'all') return true;
      if (filter === 'trips') return TRIP_TYPES.has(n.type);
      if (filter === 'approvals') return APPROVAL_TYPES.has(n.type);
      if (filter === 'wallet') return WALLET_TYPES.has(n.type);
      if (filter === 'ratings') return RATING_TYPES.has(n.type);
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = useCallback(() => {
    notifications.filter(n => !n.is_read).forEach(n => markNotificationRead(n.id));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [notifications, markNotificationRead]);

  const handlePress = useCallback((item: Notification) => {
    if (!item.is_read) markNotificationRead(item.id);
    Haptics.selectionAsync();

    // Navigate based on notification type
    if (item.type === 'trip_new' || item.type === 'trip_accepted' || item.type === 'trip_confirmed' || item.type === 'trip_completed' || item.type === 'trip_status_change') {
      // Could navigate to trip detail if we had the trip ID
    } else if (item.type === 'trip_application' || item.type === 'driver_approval_request') {
      if (userRole === 'admin' || userRole === 'supervisor') {
        router.push('/admin/(tabs)/trips' as any);
      }
    } else if (item.type === 'rating_new') {
      // Could navigate to ratings
    }
  }, [markNotificationRead, userRole, router]);

  const renderNotif = ({ item, index }: { item: Notification; index: number }) => {
    const cfg = getConfig(item.type);
    return (
      <Animated.View entering={FadeInDown.duration(200).delay(Math.min(index * 30, 300))}>
        <Pressable
          onPress={() => handlePress(item)}
          style={({ pressed }) => [styles.notifCard, !item.is_read && styles.notifCardUnread, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
        >
          <View style={[styles.notifIcon, { backgroundColor: cfg.bgColor }]}>
            <MaterialIcons name={cfg.icon as any} size={22} color={cfg.color} />
          </View>
          <View style={styles.notifContent}>
            <View style={styles.notifHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.notifTypeRow}>
                  <View style={[styles.typeTag, { backgroundColor: cfg.color + '15' }]}>
                    <Text style={[styles.typeTagText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  {!item.is_read ? <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} /> : null}
                </View>
                <Text style={styles.notifTitle}>{item.title}</Text>
              </View>
            </View>
            <Text style={styles.notifBody} numberOfLines={3}>{item.body}</Text>
            <Text style={styles.notifTime}>{getTimeAgo(item.created_at)}</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>الإشعارات</Text>
          {unreadCount > 0 ? (
            <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{unreadCount}</Text></View>
          ) : null}
        </View>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllRead} style={styles.markAllBtn}>
            <MaterialIcons name="done-all" size={20} color={theme.primary} />
          </Pressable>
        ) : <View style={{ width: 40 }} />}
      </Animated.View>

      {/* Filter Bar */}
      <View style={styles.filterContainer}>
        <Animated.ScrollView
          entering={FadeInDown.duration(300).delay(100)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map(f => (
            <Pressable key={f.id} onPress={() => { setFilter(f.id); Haptics.selectionAsync(); }} style={[styles.filterChip, filter === f.id && styles.filterActive]}>
              <MaterialIcons name={f.icon as any} size={16} color={filter === f.id ? theme.primary : theme.textMuted} />
              <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </Animated.ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="notifications-off" size={48} color={theme.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>لا توجد إشعارات</Text>
            <Text style={styles.emptySubtitle}>ستظهر الإشعارات هنا عند وجود تحديثات</Text>
          </View>
        ) : (
          <FlashList
            data={filtered}
            renderItem={renderNotif}
            estimatedItemSize={120}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  headerBadge: { backgroundColor: theme.error, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  headerBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  markAllBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center' },
  filterContainer: { height: 52 },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radiusFull, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border },
  filterActive: { backgroundColor: theme.primary + '20', borderColor: theme.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: theme.textMuted },
  filterTextActive: { color: theme.primary },
  notifCard: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  notifCardUnread: { backgroundColor: theme.primary + '08', borderColor: theme.primary + '30' },
  notifIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notifContent: { flex: 1, gap: 6 },
  notifHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  notifTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  typeTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeTagText: { fontSize: 10, fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right' },
  notifBody: { fontSize: 13, fontWeight: '400', color: theme.textSecondary, writingDirection: 'rtl', textAlign: 'right', lineHeight: 20 },
  notifTime: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  emptySubtitle: { fontSize: 13, color: theme.textMuted, writingDirection: 'rtl', marginTop: 4 },
});
