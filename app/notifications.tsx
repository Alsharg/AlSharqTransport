import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { Notification } from '../services/types';

const getNotificationIcon = (type: string): string => {
  const map: Record<string, string> = { trip_new: 'local-taxi', trip_accepted: 'check-circle', trip_completed: 'flag', general: 'info', bonus: 'emoji-events', penalty: 'remove-circle', announcement: 'campaign', approval: 'how-to-reg' };
  return map[type] || 'notifications';
};
const getNotificationColor = (type: string): string => {
  const map: Record<string, string> = { trip_new: '#3B82F6', trip_accepted: '#F59E0B', trip_completed: '#10B981', general: '#0C4A6E', bonus: '#10B981', penalty: '#EF4444', announcement: '#8B5CF6', approval: '#3B82F6' };
  return map[type] || theme.textSecondary;
};
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

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notifications, markNotificationRead } = useApp();
  const sorted = [...notifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const renderNotif = ({ item }: { item: Notification }) => {
    const color = getNotificationColor(item.type);
    return (
      <Pressable onPress={() => markNotificationRead(item.id)} style={[styles.notifCard, !item.is_read && styles.notifCardUnread]}>
        <View style={[styles.notifIcon, { backgroundColor: color + '15' }]}><MaterialIcons name={getNotificationIcon(item.type) as any} size={22} color={color} /></View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}><Text style={styles.notifTitle}>{item.title}</Text>{!item.is_read ? <View style={styles.unreadDot} /> : null}</View>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.notifTime}>{getTimeAgo(item.created_at)}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}><MaterialIcons name="close" size={24} color={theme.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>الإشعارات</Text>
        <View style={{ width: 40 }} />
      </Animated.View>
      <View style={{ flex: 1 }}>
        {sorted.length === 0 ? (
          <View style={styles.emptyContainer}><MaterialIcons name="notifications-off" size={64} color={theme.border} /><Text style={styles.emptyTitle}>لا توجد إشعارات</Text></View>
        ) : (
          <FlashList data={sorted} renderItem={renderNotif} estimatedItemSize={100} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 16 }} ItemSeparatorComponent={() => <View style={{ height: 8 }} />} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  notifCard: { flexDirection: 'row', gap: 12, padding: 14, backgroundColor: theme.surface, borderRadius: theme.radiusMedium, ...theme.shadow },
  notifCardUnread: { backgroundColor: '#F0F7FF', borderLeftWidth: 3, borderLeftColor: theme.primary },
  notifIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifContent: { flex: 1, gap: 4 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifTitle: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary },
  notifBody: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', lineHeight: 20 },
  notifTime: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyTitle: { ...typography.subtitle, textAlign: 'center', marginTop: 16 },
});
