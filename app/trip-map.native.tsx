import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { theme, typography } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { getTripTypeLabel, getStatusColor } from '../services/types';

const RIYADH_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  'حي الياسمين': { lat: 24.8200, lng: 46.6700 },
  'طريق الملك فهد': { lat: 24.7136, lng: 46.6753 },
  'حي النرجس': { lat: 24.8100, lng: 46.6300 },
  'فندق الريتز كارلتون': { lat: 24.6900, lng: 46.6850 },
  'مطار الملك خالد الدولي': { lat: 24.9578, lng: 46.6989 },
  'حي الملقا': { lat: 24.7930, lng: 46.6210 },
  'جامعة الملك سعود': { lat: 24.7226, lng: 46.6329 },
  'حي العليا': { lat: 24.6920, lng: 46.6850 },
  'default_pickup': { lat: 24.7500, lng: 46.6500 },
  'default_dropoff': { lat: 24.7100, lng: 46.6900 },
};

function getCoords(location: string, isPickup: boolean) {
  for (const [key, value] of Object.entries(RIYADH_LOCATIONS)) {
    if (location.includes(key)) return value;
  }
  return isPickup ? RIYADH_LOCATIONS['default_pickup'] : RIYADH_LOCATIONS['default_dropoff'];
}

export default function TripMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getTripById } = useApp();
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDimensions(window));
    return () => sub?.remove();
  }, []);

  const trip = getTripById(id || '');

  if (!trip) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialIcons name="error-outline" size={64} color={theme.border} />
        <Text style={styles.errorText}>المشوار غير موجود</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtnFallback}>
          <Text style={{ color: '#FFF', fontWeight: '600' }}>رجوع</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const pickup = trip.pickup_lat && trip.pickup_lng
    ? { lat: trip.pickup_lat, lng: trip.pickup_lng }
    : getCoords(trip.pickup_location, true);
  const dropoff = trip.dropoff_lat && trip.dropoff_lng
    ? { lat: trip.dropoff_lat, lng: trip.dropoff_lng }
    : getCoords(trip.dropoff_location, false);

  const midLat = (pickup.lat + dropoff.lat) / 2;
  const midLng = (pickup.lng + dropoff.lng) / 2;
  const statusColor = getStatusColor(trip.status);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>خريطة المشوار</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{trip.status === 'available' ? 'متاح' : trip.status === 'inProgress' ? 'جارٍ' : trip.status}</Text>
        </View>
      </Animated.View>

      <MapView
        style={{ height: dimensions.height * 0.55, width: '100%' }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: Math.abs(pickup.lat - dropoff.lat) * 1.8 + 0.02,
          longitudeDelta: Math.abs(pickup.lng - dropoff.lng) * 1.8 + 0.02,
        }}
      >
        <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} title="نقطة الانطلاق" description={trip.pickup_location} pinColor="green" />
        <Marker coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }} title="الوجهة" description={trip.dropoff_location} pinColor="red" />
        <Polyline
          coordinates={[
            { latitude: pickup.lat, longitude: pickup.lng },
            { latitude: midLat + 0.005, longitude: midLng },
            { latitude: dropoff.lat, longitude: dropoff.lng },
          ]}
          strokeColor={theme.primary}
          strokeWidth={4}
        />
      </MapView>

      <Animated.View entering={FadeInUp.duration(400)} style={[styles.infoPanel, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.infoPanelHandle} />
        <Text style={styles.infoTitle}>{getTripTypeLabel(trip.type)}</Text>
        <Text style={styles.infoDate}>{trip.scheduled_time} • {trip.scheduled_date}</Text>

        <View style={styles.routeInfo}>
          <View style={styles.routeRow}>
            <View style={[styles.routeCircle, { backgroundColor: theme.success }]}>
              <MaterialIcons name="trip-origin" size={12} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>نقطة الانطلاق</Text>
              <Text style={styles.routeAddress}>{trip.pickup_location}</Text>
            </View>
          </View>
          <View style={styles.routeDash} />
          <View style={styles.routeRow}>
            <View style={[styles.routeCircle, { backgroundColor: theme.error }]}>
              <MaterialIcons name="place" size={12} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>الوجهة</Text>
              <Text style={styles.routeAddress}>{trip.dropoff_location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoFooter}>
          <View style={styles.infoStat}>
            <MaterialIcons name="attach-money" size={20} color={theme.accent} />
            <Text style={styles.infoStatValue}>{trip.price} ر.س</Text>
          </View>
          {trip.passengers > 0 ? (
            <View style={styles.infoStat}>
              <MaterialIcons name="people" size={20} color={theme.primary} />
              <Text style={styles.infoStatValue}>{trip.passengers} ركاب</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.surface,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' as const },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radiusFull },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  infoPanel: {
    flex: 1, backgroundColor: theme.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, marginTop: -10,
  },
  infoPanelHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 16 },
  infoTitle: { ...typography.subtitle, writingDirection: 'rtl' as const, textAlign: 'right' },
  infoDate: { ...typography.caption, writingDirection: 'rtl' as const, textAlign: 'right', marginTop: 4, marginBottom: 16 },
  routeInfo: { gap: 0 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  routeLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl' as const, textAlign: 'right' },
  routeAddress: { fontSize: 15, fontWeight: '500', color: theme.textPrimary, writingDirection: 'rtl' as const, textAlign: 'right' },
  routeDash: { width: 2, height: 24, backgroundColor: theme.border, marginLeft: 13 },
  infoFooter: { flexDirection: 'row', gap: 20, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.borderLight },
  infoStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoStatValue: { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  errorText: { fontSize: 17, fontWeight: '600', color: theme.textMuted, textAlign: 'center', marginTop: 16, writingDirection: 'rtl' as const },
  backBtnFallback: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: theme.primary, borderRadius: theme.radiusMedium },
});
