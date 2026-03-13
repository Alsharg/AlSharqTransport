import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { Trip, getTripTypeIcon, getStatusColor, formatTripNumber } from '../../services/types';
import { useLanguage } from '../../contexts/LanguageContext';

type FilterStatus = 'all' | 'available' | 'accepted' | 'inProgress' | 'completed' | 'cancelled';
const FILTERS: { id: FilterStatus; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'available', label: 'متاح' },
  { id: 'accepted', label: 'مقبول' },
  { id: 'inProgress', label: 'جارٍ' },
  { id: 'completed', label: 'مكتمل' },
  { id: 'cancelled', label: 'ملغي' },
];

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { trips, profile, getMyApplication } = useApp();
  const { t, tripStatus, tripType } = useLanguage();
  const driverVisibleTrips = trips.filter(t => {
    // Driver sees: available trips OR trips assigned to them
    if (t.status === 'available') return true;
    if (t.driver_id === userId) return true;
    // Hide cancelled/archived/confirmed for other drivers
    return false;
  });
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  const userId = user?.id;
  const filteredTrips = driverVisibleTrips.filter(t => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'available') return t.status === 'available';
    return t.driver_id === userId && t.status === activeFilter;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const renderTrip = ({ item }: { item: Trip }) => {
    const statusColor = getStatusColor(item.status);
    const myApp = item.status === 'available' ? getMyApplication(item.id) : undefined;
    const tripNum = formatTripNumber(item.trip_number);
    return (
      <Pressable onPress={() => router.push({ pathname: '/trip-detail', params: { id: item.id } })} style={({ pressed }) => [styles.tripCard, pressed && { opacity: 0.9 }]}>
        <View style={styles.tripHeader}>
          <View style={styles.tripLeft}>
            <View style={[styles.typeIcon, { backgroundColor: statusColor + '15' }]}>
              <MaterialIcons name={getTripTypeIcon(item.type) as any} size={22} color={statusColor} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {tripNum ? <View style={styles.tripNumBadge}><Text style={styles.tripNumText}>{tripNum}</Text></View> : null}
                <Text style={styles.tripType}>{getTripTypeLabel(item.type)}</Text>
              </View>
              <Text style={styles.tripTime}>{item.scheduled_time} - {item.scheduled_date}</Text>
            </View>
          </View>
          <View style={styles.tripRight}>
            <Text style={styles.tripPrice}>{item.price} ر.س</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{getTripStatusLabel(item.status)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.routeSection}>
          <View style={styles.routeIndicator}>
            <View style={[styles.routeCircle, { backgroundColor: theme.success }]} />
            <View style={styles.routeDash} />
            <View style={[styles.routeCircle, { backgroundColor: theme.error }]} />
          </View>
          <View style={styles.routeTexts}>
            <Text style={styles.routeAddress} numberOfLines={1}>{item.pickup_location}</Text>
            <Text style={styles.routeAddress} numberOfLines={1}>{item.dropoff_location}</Text>
          </View>
        </View>
        {/* Application status for available trips */}
        {item.status === 'available' && myApp ? (
          <View style={[styles.appStatusBar, { backgroundColor: myApp.status === 'pending' ? '#FEF3C7' : myApp.status === 'accepted' ? '#D1FAE5' : '#FEE2E2' }]}>
            <MaterialIcons
              name={myApp.status === 'pending' ? 'hourglass-top' : myApp.status === 'accepted' ? 'check-circle' : 'cancel'}
              size={14}
              color={myApp.status === 'pending' ? '#D97706' : myApp.status === 'accepted' ? '#10B981' : '#EF4444'}
            />
            <Text style={[styles.appStatusText, { color: myApp.status === 'pending' ? '#92400E' : myApp.status === 'accepted' ? '#065F46' : '#991B1B' }]}>
              {myApp.status === 'pending' ? 'تم التقديم — بانتظار الموافقة' : myApp.status === 'accepted' ? 'تم قبولك لهذا المشوار' : 'تم رفض طلبك'}
            </Text>
          </View>
        ) : null}
        {/* Map button */}
        <Pressable onPress={() => router.push({ pathname: '/trip-map', params: { id: item.id } })} style={styles.mapBtn}>
          <MaterialIcons name="map" size={16} color={theme.primary} />
          <Text style={styles.mapBtnText}>عرض الخريطة</Text>
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Text style={styles.title}>{t.myTrips}</Text>
        <Text style={styles.subtitle}>{filteredTrips.length} {t.totalTrips}</Text>
      </Animated.View>
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(filter => {
            const isActive = activeFilter === filter.id;
            return (
              <Pressable key={filter.id} onPress={() => setActiveFilter(filter.id)} style={[styles.filterChip, isActive && styles.filterChipActive]}>
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <View style={{ flex: 1 }}>
        {filteredTrips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="route" size={64} color={theme.border} />
            <Text style={styles.emptyTitle}>لا توجد مشاوير</Text>
          </View>
        ) : (
          <FlashList data={filteredTrips} renderItem={renderTrip} estimatedItemSize={200} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }} ItemSeparatorComponent={() => <View style={{ height: 10 }} />} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { ...typography.title, writingDirection: 'rtl', textAlign: 'right' },
  subtitle: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  filterContainer: { height: 44, marginBottom: 12 },
  filterScroll: { paddingHorizontal: 20, gap: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.radiusFull, backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border },
  filterChipActive: { backgroundColor: theme.primary + '20', borderColor: theme.primary },
  filterText: { fontSize: 14, fontWeight: '500', color: theme.textSecondary },
  filterTextActive: { color: theme.primary, fontWeight: '600' },
  tripCard: { padding: 18, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  tripLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  typeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tripNumBadge: { backgroundColor: theme.primary + '25', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tripNumText: { fontSize: 10, fontWeight: '700', color: theme.primary },
  tripType: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right' },
  tripTime: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  tripRight: { alignItems: 'flex-end', gap: 6 },
  tripPrice: { ...typography.price },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radiusFull },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  routeSection: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  routeIndicator: { alignItems: 'center', paddingTop: 4 },
  routeCircle: { width: 8, height: 8, borderRadius: 4 },
  routeDash: { width: 2, height: 20, backgroundColor: theme.border },
  routeTexts: { flex: 1, gap: 12 },
  routeAddress: { ...typography.body, writingDirection: 'rtl', textAlign: 'right' },
  mapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.borderLight },
  mapBtnText: { fontSize: 13, fontWeight: '600', color: theme.primary, writingDirection: 'rtl' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyTitle: { ...typography.subtitle, textAlign: 'center', marginTop: 16 },
  appStatusBar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: theme.radiusMedium },
  appStatusText: { fontSize: 12, fontWeight: '600', writingDirection: 'rtl' },
});
