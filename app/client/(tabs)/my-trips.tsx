import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../../constants/theme';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../hooks/useAuth';
import { getTripStatusLabel, getStatusColor, getTripTypeLabel, formatTripNumber } from '../../../services/types';

export default function ClientMyTripsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { clientTrips } = useApp();

  const myTrips = [...clientTrips].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>مشاويري</Text>
        <Text style={styles.countText}>{myTrips.length} مشوار</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {myTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="route" size={64} color={theme.border} />
            <Text style={styles.emptyTitle}>لا توجد مشاوير بعد</Text>
            <Pressable onPress={() => router.push('/client/(tabs)/request-trip' as any)} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>اطلب مشوارك الأول</Text>
            </Pressable>
          </View>
        ) : myTrips.map((trip, index) => {
          const color = getStatusColor(trip.status);
          const tripNum = formatTripNumber(trip.trip_number);
          return (
            <Animated.View key={trip.id} entering={FadeInDown.duration(200).delay(index * 40)}>
              <Pressable onPress={() => router.push({ pathname: '/trip-detail', params: { id: trip.id } })} style={({ pressed }) => [styles.tripCard, pressed && { opacity: 0.9 }]}>
                <View style={styles.tripTop}>
                  <View style={[styles.typeIcon, { backgroundColor: color + '15' }]}>
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
                    <View style={[styles.statusBadge, { backgroundColor: color + '15' }]}>
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
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  countText: { ...typography.caption },
  tripCard: { marginHorizontal: 20, marginTop: 12, padding: 18, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  tripTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  typeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tripType: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' },
  tripTime: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl', marginTop: 2 },
  numBadge: { backgroundColor: '#8B5CF6' + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  numText: { fontSize: 10, fontWeight: '700', color: '#8B5CF6' },
  tripPrice: { fontSize: 16, fontWeight: '700', color: theme.accent },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radiusFull },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  routeSection: { gap: 4 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeAddr: { fontSize: 13, color: theme.textSecondary, flex: 1, writingDirection: 'rtl', textAlign: 'right' },
  routeLine: { width: 2, height: 12, backgroundColor: theme.border, marginLeft: 3 },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: theme.textMuted, marginTop: 16, writingDirection: 'rtl' },
  emptyBtn: { marginTop: 20, backgroundColor: '#8B5CF6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.radiusMedium },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
