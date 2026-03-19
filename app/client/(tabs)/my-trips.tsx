import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../../constants/theme';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../hooks/useAuth';
import { getTripStatusLabel, getStatusColor, getTripTypeLabel, formatTripNumber } from '../../../services/types';
import TripTimeline from '../../../components/feature/TripTimeline';

type FilterType = 'all' | 'active' | 'completed' | 'cancelled';

export default function ClientMyTripsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { clientTrips, refreshData } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const filteredTrips = [...clientTrips].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).filter(trip => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['available', 'accepted', 'agreed', 'confirmed', 'inProgress'].includes(trip.status);
    if (filter === 'completed') return trip.status === 'completed';
    if (filter === 'cancelled') return trip.status === 'cancelled';
    return true;
  });

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'الكل', count: clientTrips.length },
    { key: 'active', label: 'نشط', count: clientTrips.filter(t => ['available', 'accepted', 'agreed', 'confirmed', 'inProgress'].includes(t.status)).length },
    { key: 'completed', label: 'مكتمل', count: clientTrips.filter(t => t.status === 'completed').length },
    { key: 'cancelled', label: 'ملغي', count: clientTrips.filter(t => t.status === 'cancelled').length },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>مشاويري</Text>
        <Text style={styles.countText}>{filteredTrips.length} مشوار</Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {filters.map(f => (
            <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.filterChip, filter === f.key && styles.filterChipActive]}>
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
              <View style={[styles.filterCount, filter === f.key && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, filter === f.key && { color: '#FFF' }]}>{f.count}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {filteredTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="route" size={64} color={theme.border} />
            <Text style={styles.emptyTitle}>لا توجد مشاوير</Text>
            <Pressable onPress={() => router.push('/client/(tabs)/request-trip' as any)} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>اطلب مشوارك الأول</Text>
            </Pressable>
          </View>
        ) : filteredTrips.map((trip, index) => {
          const color = getStatusColor(trip.status);
          const tripNum = formatTripNumber(trip.trip_number);
          const isExpanded = expandedTripId === trip.id;

          return (
            <Animated.View key={trip.id} entering={FadeInDown.duration(200).delay(index * 40)}>
              <Pressable
                onPress={() => setExpandedTripId(isExpanded ? null : trip.id)}
                style={({ pressed }) => [styles.tripCard, pressed && { opacity: 0.95 }, isExpanded && styles.tripCardExpanded]}
              >
                <View style={styles.tripTop}>
                  <View style={[styles.typeIcon, { backgroundColor: color + '12' }]}>
                    <MaterialIcons name="route" size={20} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {tripNum ? <View style={styles.numBadge}><Text style={styles.numText}>{tripNum}</Text></View> : null}
                      <Text style={styles.tripType}>{getTripTypeLabel(trip.type)}</Text>
                    </View>
                    <Text style={styles.tripTime}>{trip.scheduled_date} - {trip.scheduled_time}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={styles.tripPrice}>{trip.price > 0 ? `${trip.price} ر.س` : 'قيد التسعير'}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: color + '12' }]}>
                      <View style={[styles.statusDot, { backgroundColor: color }]} />
                      <Text style={[styles.statusText, { color }]}>{getTripStatusLabel(trip.status)}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.routeSection}>
                  <View style={styles.routePoint}><View style={[styles.routeDot, { backgroundColor: theme.success }]} /><Text style={styles.routeAddr} numberOfLines={1}>{trip.pickup_location}</Text></View>
                  <View style={styles.routeLine} />
                  <View style={styles.routePoint}><View style={[styles.routeDot, { backgroundColor: theme.error }]} /><Text style={styles.routeAddr} numberOfLines={1}>{trip.dropoff_location}</Text></View>
                </View>

                {/* Expand hint */}
                <View style={styles.expandHint}>
                  <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={20} color={theme.textMuted} />
                  <Text style={styles.expandHintText}>{isExpanded ? 'إخفاء التتبع' : 'تتبع الحالة'}</Text>
                </View>
              </Pressable>

              {/* Timeline - shown when expanded */}
              {isExpanded ? (
                <TripTimeline
                  status={trip.status}
                  createdAt={trip.created_at}
                  updatedAt={trip.updated_at}
                  completedAt={trip.completed_at}
                />
              ) : null}

              {/* Detail button when expanded */}
              {isExpanded ? (
                <Pressable
                  onPress={() => router.push({ pathname: '/trip-detail', params: { id: trip.id } })}
                  style={styles.detailBtn}
                >
                  <MaterialIcons name="open-in-new" size={16} color={theme.primary} />
                  <Text style={styles.detailBtnText}>عرض التفاصيل الكاملة</Text>
                </Pressable>
              ) : null}
            </Animated.View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  countText: { ...typography.caption },
  filterBar: { paddingVertical: 12, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.radiusFull, backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border },
  filterChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  filterTextActive: { color: '#FFF' },
  filterCount: { backgroundColor: theme.border, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterCountText: { fontSize: 11, fontWeight: '700', color: theme.textMuted },
  tripCard: { marginHorizontal: 20, marginTop: 12, padding: 18, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border, ...theme.shadowLight, elevation: 2 },
  tripCardExpanded: { borderColor: theme.primary + '40', borderWidth: 1.5 },
  tripTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  typeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tripType: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' },
  tripTime: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl', marginTop: 2 },
  numBadge: { backgroundColor: theme.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  numText: { fontSize: 10, fontWeight: '700', color: theme.primary },
  tripPrice: { fontSize: 16, fontWeight: '700', color: theme.accent },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radiusFull },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  routeSection: { gap: 4 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeAddr: { fontSize: 13, color: theme.textSecondary, flex: 1, writingDirection: 'rtl', textAlign: 'right' },
  routeLine: { width: 2, height: 12, backgroundColor: theme.border, marginLeft: 3 },
  expandHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.borderLight },
  expandHintText: { fontSize: 12, fontWeight: '600', color: theme.textMuted },
  detailBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 20, marginTop: 8, marginBottom: 4, paddingVertical: 10, backgroundColor: theme.primary + '08', borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: theme.primary + '20' },
  detailBtnText: { fontSize: 13, fontWeight: '600', color: theme.primary },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: theme.textMuted, marginTop: 16, writingDirection: 'rtl' },
  emptyBtn: { marginTop: 20, backgroundColor: theme.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.radiusMedium },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
