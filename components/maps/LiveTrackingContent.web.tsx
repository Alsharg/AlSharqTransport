import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { getStatusColor, getTripStatusLabel, formatTripNumber } from '../../services/types';

export function LiveTrackingContent({ tripId }: { tripId: string }) {
  const router = useRouter();
  const { getTripById } = useApp();
  const trip = getTripById(tripId);

  const statusColor = trip ? getStatusColor(trip.status) : theme.primary;
  const tripNum = trip ? formatTripNumber(trip.trip_number) : '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>التتبع المباشر</Text>
        {tripNum ? <View style={styles.tripNumBadge}><Text style={styles.tripNumText}>{tripNum}</Text></View> : <View style={{ width: 44 }} />}
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="map" size={56} color={theme.primary} />
          </View>
          <Text style={styles.title}>التتبع المباشر متاح على الجوال فقط</Text>
          <Text style={styles.subtitle}>افتح التطبيق من هاتفك لتتبع المشوار على الخريطة مباشرة</Text>

          {trip ? (
            <View style={styles.tripInfo}>
              <View style={[styles.statusChip, { backgroundColor: statusColor + '15' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusTextStyle, { color: statusColor }]}>{getTripStatusLabel(trip.status)}</Text>
              </View>
              <View style={styles.routeSection}>
                <View style={styles.routeRow}><View style={[styles.routeDot, { backgroundColor: theme.success }]} /><Text style={styles.routeText} numberOfLines={1}>{trip.home_location || trip.pickup_location}</Text></View>
                <View style={styles.routeConnector} />
                <View style={styles.routeRow}><View style={[styles.routeDot, { backgroundColor: theme.error }]} /><Text style={styles.routeText} numberOfLines={1}>{trip.work_location || trip.dropoff_location}</Text></View>
              </View>
              <Text style={styles.priceText}>{trip.price} ر.س</Text>
            </View>
          ) : null}
        </Animated.View>

        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
          <Text style={styles.goBackBtnText}>العودة</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' as const },
  tripNumBadge: { backgroundColor: theme.primary + '25', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tripNumText: { fontSize: 12, fontWeight: '700', color: theme.primaryGlow },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  card: { backgroundColor: theme.surface, borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  iconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', writingDirection: 'rtl' as const, marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: '500', color: theme.textMuted, textAlign: 'center', writingDirection: 'rtl' as const, lineHeight: 22 },
  tripInfo: { width: '100%', marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: theme.borderLight, alignItems: 'center', gap: 12 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusTextStyle: { fontSize: 13, fontWeight: '700' },
  routeSection: { width: '100%', gap: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeText: { fontSize: 14, fontWeight: '500', color: theme.textSecondary, flex: 1, writingDirection: 'rtl' as const, textAlign: 'right' },
  routeConnector: { width: 2, height: 12, backgroundColor: theme.border, marginLeft: 3 },
  priceText: { fontSize: 22, fontWeight: '700', color: theme.accent },
  goBackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 12, marginTop: 24 },
  goBackBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
