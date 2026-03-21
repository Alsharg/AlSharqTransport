import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { fetchRoutePolyline, RouteInfo } from '../../services/distance';

interface RoutePreviewProps {
  home: { address: string; lat: number; lng: number };
  work: { address: string; lat: number; lng: number };
  onRouteCalculated?: (info: RouteInfo) => void;
}

export function RoutePreview({ home, work, onRouteCalculated }: RoutePreviewProps) {
  const mapRef = useRef<MapView>(null);
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchRoutePolyline(home.lat, home.lng, work.lat, work.lng).then(result => {
      if (cancelled) return;
      setLoading(false);
      if (result) {
        setRouteCoords(result.polyline);
        setRouteInfo(result);
        onRouteCalculated?.(result);

        // Fit map to show the entire route
        if (mapRef.current && result.polyline.length > 1) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(result.polyline, {
              edgePadding: { top: 60, right: 40, bottom: 60, left: 40 },
              animated: true,
            });
          }, 300);
        }
      } else {
        // Fallback: straight line
        setRouteCoords([
          { latitude: home.lat, longitude: home.lng },
          { latitude: work.lat, longitude: work.lng },
        ]);
      }
    });

    return () => { cancelled = true; };
  }, [home.lat, home.lng, work.lat, work.lng]);

  const midLat = (home.lat + work.lat) / 2;
  const midLng = (home.lng + work.lng) / 2;
  const latDelta = Math.abs(home.lat - work.lat) * 1.6 + 0.02;
  const lngDelta = Math.abs(home.lng - work.lng) * 1.6 + 0.02;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="route" size={18} color={theme.primary} />
        <Text style={styles.title}>مسار الرحلة</Text>
      </View>

      <View style={styles.mapWrap}>
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>جاري تحميل المسار...</Text>
          </View>
        ) : null}

        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={{
            latitude: midLat,
            longitude: midLng,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Marker
            coordinate={{ latitude: home.lat, longitude: home.lng }}
            title="البيت"
            description={home.address}
          >
            <View style={[styles.markerWrap, { backgroundColor: '#22C55E' }]}>
              <MaterialIcons name="home" size={16} color="#FFF" />
            </View>
          </Marker>

          <Marker
            coordinate={{ latitude: work.lat, longitude: work.lng }}
            title="العمل"
            description={work.address}
          >
            <View style={[styles.markerWrap, { backgroundColor: '#EF4444' }]}>
              <MaterialIcons name="work" size={16} color="#FFF" />
            </View>
          </Marker>

          {routeCoords.length > 1 ? (
            <Polyline
              coordinates={routeCoords}
              strokeColor={theme.primary}
              strokeWidth={4}
              lineDashPattern={undefined}
            />
          ) : null}
        </MapView>
      </View>

      {/* Route Info Cards */}
      {routeInfo ? (
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <MaterialIcons name="straighten" size={20} color={theme.primary} />
            <Text style={styles.infoValue}>{routeInfo.distanceText}</Text>
            <Text style={styles.infoLabel}>المسافة (اتجاه واحد)</Text>
          </View>
          <View style={styles.infoCard}>
            <MaterialIcons name="schedule" size={20} color={theme.accent} />
            <Text style={styles.infoValue}>{routeInfo.durationText}</Text>
            <Text style={styles.infoLabel}>الوقت المتوقع</Text>
          </View>
          <View style={styles.infoCard}>
            <MaterialIcons name="swap-vert" size={20} color="#8B5CF6" />
            <Text style={styles.infoValue}>{(routeInfo.distanceKm * 2).toFixed(1)} كم</Text>
            <Text style={styles.infoLabel}>ذهاب وعودة</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    borderWidth: 1.5,
    borderColor: theme.primary + '30',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.primary,
    writingDirection: 'rtl' as const,
  },
  mapWrap: {
    height: 220,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
    writingDirection: 'rtl' as const,
  },
  markerWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  infoCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    backgroundColor: theme.surfaceElevated,
    borderRadius: theme.radiusMedium,
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textMuted,
    writingDirection: 'rtl' as const,
    textAlign: 'center',
  },
});
