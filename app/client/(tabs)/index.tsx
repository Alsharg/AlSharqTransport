import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../../constants/theme';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../hooks/useAuth';
import { getTripStatusLabel, getStatusColor, formatTripNumber, getTripTypeLabel } from '../../../services/types';

export default function ClientHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { clientTrips, clientActiveTrips, clientCompletedTrips, notifications, unreadNotifications } = useApp();

  const displayName = user?.full_name || user?.username || 'عميل';

  const quickActions = [
    { icon: 'add-circle', label: 'مشوار جديد', color: '#8B5CF6', route: '/client/(tabs)/request-trip' },
    { icon: 'route', label: 'مشاويري', color: '#3B82F6', route: '/client/(tabs)/my-trips' },
    { icon: 'chat-bubble-outline', label: 'الدعم', color: '#22C55E', route: '/chat' },
    { icon: 'notifications-none', label: 'الإشعارات', color: '#F59E0B', route: '/notifications' },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>مرحباً،</Text>
            <Text style={styles.name}>{displayName}</Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')} style={styles.iconBtn}>
            <MaterialIcons name="notifications-none" size={22} color={theme.textSecondary} />
            {unreadNotifications > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{unreadNotifications}</Text></View> : null}
          </Pressable>
        </Animated.View>

        {/* Hero Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.heroCard}>
          <View style={styles.heroContent}>
            <MaterialIcons name="local-shipping" size={40} color="#8B5CF6" />
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={styles.heroTitle}>الشرق للنقل والتوصيل</Text>
              <Text style={styles.heroSubtitle}>اطلب مشوارك الآن بأفضل الأسعار</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/client/(tabs)/request-trip' as any)} style={styles.heroCta}>
            <Text style={styles.heroCtaText}>اطلب مشوار</Text>
            <MaterialIcons name="arrow-back" size={18} color="#FFF" />
          </Pressable>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.actionsRow}>
          {quickActions.map(action => (
            <Pressable key={action.label} onPress={() => router.push(action.route as any)} style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}>
              <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                <MaterialIcons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{clientActiveTrips.length}</Text>
            <Text style={styles.statLabel}>نشط</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.success }]}>{clientCompletedTrips.length}</Text>
            <Text style={styles.statLabel}>مكتمل</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.accent }]}>{clientTrips.length}</Text>
            <Text style={styles.statLabel}>إجمالي</Text>
          </View>
        </Animated.View>

        {/* Active Trips */}
        {clientActiveTrips.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>المشاوير النشطة</Text>
              <View style={styles.countBadge}><Text style={styles.countBadgeText}>{clientActiveTrips.length}</Text></View>
            </View>
            {clientActiveTrips.slice(0, 3).map(trip => {
              const color = getStatusColor(trip.status);
              return (
                <Pressable key={trip.id} onPress={() => router.push({ pathname: '/trip-detail', params: { id: trip.id } })} style={styles.tripCard}>
                  <View style={styles.tripTop}>
                    <View style={[styles.tripIcon, { backgroundColor: color + '15' }]}>
                      <MaterialIcons name="route" size={20} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tripRoute} numberOfLines={1}>{trip.pickup_location} → {trip.dropoff_location}</Text>
                      <Text style={styles.tripTime}>{trip.scheduled_date} - {trip.scheduled_time}</Text>
                    </View>
                    <View style={styles.tripPriceWrap}>
                      <Text style={styles.tripPrice}>{trip.price}</Text>
                      <Text style={styles.tripCurrency}>ر.س</Text>
                    </View>
                  </View>
                  <View style={styles.tripBottom}>
                    {formatTripNumber(trip.trip_number) ? <View style={styles.tripNum}><Text style={styles.tripNumText}>{formatTripNumber(trip.trip_number)}</Text></View> : null}
                    <View style={[styles.statusBadge, { backgroundColor: color + '15' }]}>
                      <View style={[styles.statusDot, { backgroundColor: color }]} />
                      <Text style={[styles.statusText, { color }]}>{getTripStatusLabel(trip.status)}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.emptyState}>
            <MaterialIcons name="local-taxi" size={56} color={theme.border} />
            <Text style={styles.emptyTitle}>لا توجد مشاوير نشطة</Text>
            <Text style={styles.emptySubtitle}>اطلب مشوارك الأول الآن</Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  greeting: { fontSize: 14, fontWeight: '500', color: theme.textMuted, writingDirection: 'rtl' },
  name: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
  badge: { position: 'absolute', top: 4, right: 4, backgroundColor: theme.error, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  heroCard: { marginHorizontal: 20, padding: 24, backgroundColor: '#0D001A', borderRadius: theme.radiusXL, borderWidth: 1.5, borderColor: '#8B5CF6' + '30', marginBottom: 24 },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 18 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right' },
  heroSubtitle: { fontSize: 13, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginTop: 4 },
  heroCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8B5CF6', paddingVertical: 14, borderRadius: theme.radiusMedium },
  heroCtaText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  actionCard: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 18, backgroundColor: theme.surface, borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: theme.border },
  actionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  statCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 16, backgroundColor: theme.surface, borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: theme.border },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  countBadge: { backgroundColor: '#8B5CF6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  tripCard: { marginHorizontal: 20, marginBottom: 12, padding: 18, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  tripTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  tripIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tripRoute: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right' },
  tripTime: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  tripPriceWrap: { alignItems: 'flex-end' },
  tripPrice: { fontSize: 20, fontWeight: '700', color: theme.accent },
  tripCurrency: { fontSize: 10, color: theme.textMuted },
  tripBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.borderLight },
  tripNum: { backgroundColor: '#8B5CF6' + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tripNumText: { fontSize: 10, fontWeight: '700', color: '#8B5CF6' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radiusFull },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: theme.textMuted, marginTop: 16, writingDirection: 'rtl' },
  emptySubtitle: { fontSize: 13, color: theme.textMuted, marginTop: 4, writingDirection: 'rtl' },
});
