import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { fetchRoutePolyline, RouteInfo } from '../../services/distance';

interface RoutePreviewProps {
  home: { address: string; lat: number; lng: number };
  work: { address: string; lat: number; lng: number };
  onRouteCalculated?: (info: RouteInfo) => void;
}

export function RoutePreview({ home, work, onRouteCalculated }: RoutePreviewProps) {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchRoutePolyline(home.lat, home.lng, work.lat, work.lng).then(result => {
      if (cancelled) return;
      setLoading(false);
      if (result) {
        setRouteInfo(result);
        onRouteCalculated?.(result);
      }
    });

    return () => { cancelled = true; };
  }, [home.lat, home.lng, work.lat, work.lng]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="route" size={18} color={theme.primary} />
        <Text style={styles.title}>مسار الرحلة</Text>
      </View>

      {/* Static map image via Google Maps Static API */}
      <View style={styles.mapWrap}>
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>جاري تحميل المسار...</Text>
          </View>
        ) : (
          <View style={styles.routeVisual}>
            <View style={styles.routeStep}>
              <View style={[styles.routeDot, { backgroundColor: '#22C55E' }]}>
                <MaterialIcons name="home" size={14} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>البيت</Text>
                <Text style={styles.routeAddr} numberOfLines={2}>{home.address}</Text>
              </View>
            </View>
            <View style={styles.routeLine}>
              <View style={styles.routeLineDash} />
              {routeInfo ? (
                <View style={styles.routeLineInfo}>
                  <MaterialIcons name="straighten" size={12} color={theme.primary} />
                  <Text style={styles.routeLineText}>{routeInfo.distanceText}</Text>
                  <MaterialIcons name="schedule" size={12} color={theme.accent} />
                  <Text style={styles.routeLineText}>{routeInfo.durationText}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.routeStep}>
              <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]}>
                <MaterialIcons name="work" size={14} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>العمل</Text>
                <Text style={styles.routeAddr} numberOfLines={2}>{work.address}</Text>
              </View>
            </View>
          </View>
        )}
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
    borderRadius: 16,
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
    minHeight: 160,
    position: 'relative',
  },
  loadingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
    writingDirection: 'rtl' as const,
  },
  routeVisual: {
    padding: 16,
    gap: 0,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    writingDirection: 'rtl' as const,
    textAlign: 'right',
  },
  routeAddr: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textPrimary,
    writingDirection: 'rtl' as const,
    textAlign: 'right',
    marginTop: 2,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingVertical: 6,
    gap: 10,
  },
  routeLineDash: {
    width: 2,
    height: 30,
    backgroundColor: theme.border,
  },
  routeLineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routeLineText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
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
    borderRadius: 10,
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
