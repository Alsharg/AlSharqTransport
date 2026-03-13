import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { Trip, getTripTypeIcon, getStatusColor, formatTripNumber } from '../../services/types';
import { useLanguage } from '../../contexts/LanguageContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { profile, availableTrips, activeTrips, completedTrips,
    todayEarnings, unreadNotifications, unreadMessages,
    setDriverStatus, isDataLoading, getMyApplication, wallet, trips,
  } = useApp();
  const { t, tripStatus, tripType } = useLanguage();

  // Filter trips for driver view: only show available or assigned to this driver
  const userId = user?.id;
  const driverVisibleTrips = trips.filter(t => {
    if (t.status === 'available') return true;
    if (t.driver_id === userId) return true;
    return false;
  });
  const driverAvailable = driverVisibleTrips.filter(t => t.status === 'available');

  const isAvailable = profile?.status === 'available';
  const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'مستخدم';

  const toggleAvailability = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDriverStatus(isAvailable ? 'unavailable' : 'available');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Header with more breathing room */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.push('/edit-profile')} style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={28} color={theme.primary} />
            </Pressable>
            <View>
              <Text style={styles.greeting}>{t.home === 'Home' ? 'Hello,' : t.home === 'ہوم' ? 'خوش آمدید،' : 'مرحباً،'}</Text>
              <Text style={styles.driverName}>{displayName.split(' ')[0]}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={() => router.push('/chat')} style={styles.iconBtn}>
              <MaterialIcons name="chat-bubble-outline" size={22} color={theme.textSecondary} />
              {unreadMessages > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{unreadMessages}</Text></View> : null}
            </Pressable>
            <Pressable onPress={() => router.push('/notifications')} style={styles.iconBtn}>
              <MaterialIcons name="notifications-none" size={24} color={theme.textSecondary} />
              {unreadNotifications > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{unreadNotifications}</Text></View> : null}
            </Pressable>
          </View>
        </Animated.View>

        {/* Status toggle */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Pressable onPress={toggleAvailability} style={[styles.statusCard, { backgroundColor: isAvailable ? '#064E3B' : '#7F1D1D' }]}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isAvailable ? theme.success : theme.error }]} />
              <Text style={[styles.statusText, { color: isAvailable ? theme.success : theme.error }]}>
                {isAvailable ? t.availableForTrips : t.notAvailable}
              </Text>
            </View>
            <View style={[styles.toggleBtn, { backgroundColor: isAvailable ? theme.success : theme.error }]}>
              <MaterialIcons name={isAvailable ? 'toggle-on' : 'toggle-off'} size={28} color="#FFF" />
            </View>
          </Pressable>
        </Animated.View>

        {/* Stats row — spaced out */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialIcons name="local-taxi" size={26} color={theme.statusAvailable} />
            <Text style={[styles.statValue, { color: theme.statusAvailable }]}>{availableTrips.length}</Text>
            <Text style={styles.statLabel}>{t.availableTripsCount}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="schedule" size={26} color={theme.statusInProgress} />
            <Text style={[styles.statValue, { color: theme.statusInProgress }]}>{activeTrips.length}</Text>
            <Text style={styles.statLabel}>{t.activeTrips}</Text>
          </View>
          <Pressable onPress={() => router.push('/wallet')} style={styles.statCard}>
            <MaterialIcons name="account-balance-wallet" size={26} color={theme.accent} />
            <Text style={[styles.statValue, { color: theme.accent }]}>{Number(wallet?.balance || 0).toFixed(0)}</Text>
            <Text style={styles.statLabel}>{t.wallet}</Text>
          </Pressable>
        </Animated.View>

        {/* Active trips */}
        {activeTrips.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.activeTrips}</Text>
              <Pressable onPress={() => router.push('/(tabs)/trips')}><Text style={styles.seeAll}>عرض الكل</Text></Pressable>
            </View>
            {activeTrips.slice(0, 2).map((trip, i) => (
              <TripCard key={trip.id} trip={trip} index={i} onPress={() => router.push({ pathname: '/trip-detail', params: { id: trip.id } })} />
            ))}
          </Animated.View>
        ) : null}

        {/* Available trips */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.availableTripsCount}</Text>
            <View style={styles.countBadge}><Text style={styles.countBadgeText}>{availableTrips.length}</Text></View>
          </View>
          {driverAvailable.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="route" size={56} color={theme.border} />
              <Text style={styles.emptyTitle}>{t.noData}</Text>
              <Text style={styles.emptySubtitle}>{t.notifications}</Text>
            </View>
          ) : (
            driverAvailable.slice(0, 5).map((trip, i) => (
              <TripCard key={trip.id} trip={trip} index={i} onPress={() => router.push({ pathname: '/trip-detail', params: { id: trip.id } })} />
            ))
          )}
        </Animated.View>

        {/* Daily summary */}
        <Animated.View entering={FadeInDown.duration(400).delay(500)} style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{t.dailySummary}</Text></View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{completedTrips.length}</Text>
                <Text style={styles.summaryLabel}>{t.completedTrips}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: theme.accent }]}>{todayEarnings.toFixed(0)} {t.currency}</Text>
                <Text style={styles.summaryLabel}>{t.todayEarnings}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{profile?.rating?.toFixed(1) || '5.0'}</Text>
                <Text style={styles.summaryLabel}>{t.rating}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TripCard({ trip, index, onPress }: { trip: Trip; index: number; onPress: () => void }) {
  const statusColor = getStatusColor(trip.status);
  const { getMyApplication } = useApp();
  const { t, tripStatus, tripType } = useLanguage();
  const myApp = trip.status === 'available' ? getMyApplication(trip.id) : undefined;
  const tripNum = formatTripNumber(trip.trip_number);

  return (
    <Animated.View entering={FadeInRight.duration(300).delay(index * 80)}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.tripCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
        {/* Header row: type + price */}
        <View style={styles.tripCardHeader}>
          <View style={styles.tripTypeRow}>
            <View style={[styles.tripTypeIcon, { backgroundColor: statusColor + '15' }]}>
              <MaterialIcons name={getTripTypeIcon(trip.type) as any} size={20} color={statusColor} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {tripNum ? <View style={styles.tripNumBadge}><Text style={styles.tripNumText}>{tripNum}</Text></View> : null}
                <Text style={styles.tripType}>{tripType(trip.type)}</Text>
              </View>
              <Text style={styles.tripTime}>{trip.scheduled_time} - {trip.scheduled_date}</Text>
            </View>
          </View>
          <View style={styles.tripPriceContainer}>
            <Text style={styles.tripPrice}>{trip.price}</Text>
            <Text style={styles.tripCurrency}>{t.currency}</Text>
          </View>
        </View>

        {/* Route - compact */}
        <View style={styles.tripRoute}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: theme.success }]} />
            <Text style={styles.routeText} numberOfLines={1}>{trip.pickup_location}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: theme.error }]} />
            <Text style={styles.routeText} numberOfLines={1}>{trip.dropoff_location}</Text>
          </View>
        </View>

        {/* Application indicator */}
        {myApp ? (
          <View style={[styles.appIndicator, { backgroundColor: myApp.status === 'pending' ? '#78350F' : '#064E3B' }]}>
            <MaterialIcons name={myApp.status === 'pending' ? 'hourglass-top' : 'check-circle'} size={13} color={myApp.status === 'pending' ? '#FBBF24' : '#34D399'} />
            <Text style={[styles.appIndicatorText, { color: myApp.status === 'pending' ? '#FBBF24' : '#34D399' }]}>
              {myApp.status === 'pending' ? t.waitingApproval : t.success}
            </Text>
          </View>
        ) : null}

        {/* Footer: meta + status */}
        <View style={styles.tripCardFooter}>
          {trip.passengers > 0 ? (
            <View style={styles.tripMeta}>
              <MaterialIcons name="person" size={14} color={theme.textMuted} />
              <Text style={styles.tripMetaText}>{trip.passengers} ركاب</Text>
            </View>
          ) : <View />}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDotSmall, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{tripStatus(trip.status)}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center' },
  greeting: { ...typography.caption, writingDirection: 'rtl' },
  driverName: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  headerRight: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 6, right: 6, backgroundColor: theme.error, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  // Status card
  statusCard: { marginHorizontal: 20, padding: 18, borderRadius: theme.radiusLarge, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: theme.border },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 15, fontWeight: '600', writingDirection: 'rtl' as const },
  toggleBtn: { width: 44, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // Stats row
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 28 },
  statCard: { flex: 1, paddingVertical: 18, borderRadius: theme.radiusMedium, alignItems: 'center', gap: 8, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  statValue: { fontSize: 26, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '600', color: theme.textMuted, textAlign: 'center', writingDirection: 'rtl' },

  // Section
  section: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  seeAll: { fontSize: 14, fontWeight: '600', color: theme.primary },
  countBadge: { backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  // Trip card
  tripCard: { marginHorizontal: 20, marginBottom: 12, padding: 18, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  tripCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  tripTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  tripTypeIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tripNumBadge: { backgroundColor: theme.primary + '25', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tripNumText: { fontSize: 10, fontWeight: '700', color: theme.primary },
  tripType: { fontSize: 15, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  tripTime: { fontSize: 12, color: theme.textSecondary, marginTop: 3, writingDirection: 'rtl' },
  tripPriceContainer: { alignItems: 'flex-end' },
  tripPrice: { fontSize: 22, fontWeight: '700', color: theme.accent },
  tripCurrency: { fontSize: 11, fontWeight: '600', color: theme.textMuted },

  // Route
  tripRoute: { marginBottom: 14, gap: 4 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeText: { fontSize: 14, color: theme.textSecondary, flex: 1, writingDirection: 'rtl', textAlign: 'right' },
  routeLine: { width: 2, height: 16, backgroundColor: theme.border, marginLeft: 3 },

  // App indicator
  appIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: theme.radiusMedium, marginBottom: 10 },
  appIndicatorText: { fontSize: 12, fontWeight: '600', writingDirection: 'rtl' },

  // Footer
  tripCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.borderLight },
  tripMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tripMetaText: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radiusFull },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },

  // Empty & Summary
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: theme.textMuted, textAlign: 'center', marginTop: 16, writingDirection: 'rtl' },
  emptySubtitle: { ...typography.caption, textAlign: 'center', writingDirection: 'rtl', marginTop: 4, lineHeight: 20 },
  summaryCard: { marginHorizontal: 20, paddingVertical: 24, paddingHorizontal: 20, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  summaryItem: { alignItems: 'center', gap: 6 },
  summaryValue: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
  summaryLabel: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl' },
  summaryDivider: { width: 1, height: 44, backgroundColor: theme.border },
});
