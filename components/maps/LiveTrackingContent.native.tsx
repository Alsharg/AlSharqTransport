import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { getStatusColor, getTripStatusLabel, formatTripNumber } from '../../services/types';

export function LiveTrackingContent({ tripId }: { tripId: string }) {
  const router = useRouter();
  const { getTripById, allDriversList } = useApp();
  const { user, userRole } = useAuth();
  const mapRef = useRef<MapView>(null);

  const trip = getTripById(tripId);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);

  const isDriver = userRole === 'driver';
  const driverProfile = allDriversList.find(d => d.id === trip?.driver_id);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      setLocationPermission(true);
      const updateLocation = async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setDriverLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          if (isDriver && mapRef.current) {
            mapRef.current.animateToRegion({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 500);
          }
        } catch (e) { console.error('Location error:', e); }
      };
      await updateLocation();
      intervalId = setInterval(updateLocation, 10000);
    };
    startTracking();
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isDriver]);

  const defaultRegion = {
    latitude: driverLocation?.latitude || trip?.pickup_lat || 24.7136,
    longitude: driverLocation?.longitude || trip?.pickup_lng || 46.6753,
    latitudeDelta: 0.05, longitudeDelta: 0.05,
  };

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

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={defaultRegion}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          showsUserLocation={isDriver}
          showsMyLocationButton={false}
        >
          {driverLocation ? (
            <Marker coordinate={driverLocation} title={isDriver ? 'موقعي' : (driverProfile?.full_name || 'السائق')}>
              <View style={styles.driverMarker}><MaterialIcons name="local-shipping" size={24} color="#FFF" /></View>
            </Marker>
          ) : null}
          {trip?.pickup_lat && trip?.pickup_lng ? (
            <Marker coordinate={{ latitude: trip.pickup_lat, longitude: trip.pickup_lng }} title="نقطة الانطلاق">
              <View style={[styles.locationMarker, { backgroundColor: theme.success }]}><MaterialIcons name="home" size={18} color="#FFF" /></View>
            </Marker>
          ) : null}
          {trip?.dropoff_lat && trip?.dropoff_lng ? (
            <Marker coordinate={{ latitude: trip.dropoff_lat, longitude: trip.dropoff_lng }} title="نقطة الوصول">
              <View style={[styles.locationMarker, { backgroundColor: theme.error }]}><MaterialIcons name="work" size={18} color="#FFF" /></View>
            </Marker>
          ) : null}
        </MapView>
        <Pressable onPress={() => { if (driverLocation && mapRef.current) mapRef.current.animateToRegion({ ...driverLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500); }} style={styles.myLocationBtn}>
          <MaterialIcons name="my-location" size={22} color={theme.primary} />
        </Pressable>
      </View>

      {trip ? (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.infoPanel}>
          <View style={styles.infoPanelHeader}>
            <View style={[styles.statusChip, { backgroundColor: statusColor + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusTextStyle, { color: statusColor }]}>{getTripStatusLabel(trip.status)}</Text>
            </View>
            <Text style={styles.infoPrice}>{trip.price} ر.س</Text>
          </View>
          <View style={styles.routeInfo}>
            <View style={styles.routeRow}><View style={[styles.routeDot, { backgroundColor: theme.success }]} /><Text style={styles.routeText} numberOfLines={1}>{trip.home_location || trip.pickup_location}</Text></View>
            <View style={styles.routeConnector} />
            <View style={styles.routeRow}><View style={[styles.routeDot, { backgroundColor: theme.error }]} /><Text style={styles.routeText} numberOfLines={1}>{trip.work_location || trip.dropoff_location}</Text></View>
          </View>
          {!isDriver && driverProfile ? (
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}><MaterialIcons name="person" size={20} color={theme.primary} /></View>
              <View style={{ flex: 1 }}><Text style={styles.driverName}>{driverProfile.full_name || driverProfile.username}</Text><Text style={styles.driverCode}>{driverProfile.driver_code}</Text></View>
              <View style={styles.ratingBadge}><MaterialIcons name="star" size={14} color="#FBBF24" /><Text style={styles.ratingText}>{driverProfile.rating?.toFixed(1)}</Text></View>
            </View>
          ) : null}
          {!locationPermission ? (
            <View style={styles.permissionNote}><MaterialIcons name="location-off" size={16} color={theme.warning} /><Text style={styles.permissionText}>يرجى السماح بالوصول للموقع لتفعيل التتبع</Text></View>
          ) : (
            <View style={styles.trackingActive}><View style={styles.pulsingDot} /><Text style={styles.trackingText}>التتبع مباشر - يتحدث كل 10 ثوانٍ</Text></View>
          )}
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface, zIndex: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' as const },
  tripNumBadge: { backgroundColor: theme.primary + '25', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tripNumText: { fontSize: 12, fontWeight: '700', color: theme.primaryGlow },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  myLocationBtn: { position: 'absolute', bottom: 16, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }, android: { elevation: 4 } }) },
  driverMarker: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' },
  locationMarker: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  infoPanel: { backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderTopWidth: 1, borderColor: theme.border },
  infoPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusTextStyle: { fontSize: 13, fontWeight: '700' },
  infoPrice: { fontSize: 22, fontWeight: '700', color: theme.accent },
  routeInfo: { marginBottom: 16 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeText: { fontSize: 14, fontWeight: '500', color: theme.textSecondary, flex: 1, writingDirection: 'rtl' as const, textAlign: 'right' },
  routeConnector: { width: 2, height: 16, backgroundColor: theme.border, marginLeft: 4, marginVertical: 2 },
  driverInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.borderLight, marginBottom: 12 },
  driverAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' as const, textAlign: 'right' },
  driverCode: { fontSize: 12, fontWeight: '600', color: theme.primary, writingDirection: 'rtl' as const, textAlign: 'right' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#78350F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#FBBF24' },
  permissionNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: theme.warning + '15', borderRadius: 12 },
  permissionText: { fontSize: 12, fontWeight: '500', color: theme.warning, writingDirection: 'rtl' as const, flex: 1 },
  trackingActive: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: theme.success + '15', borderRadius: 12 },
  pulsingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.success },
  trackingText: { fontSize: 12, fontWeight: '600', color: theme.success, writingDirection: 'rtl' as const },
});
