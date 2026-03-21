import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform, TextInput, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { theme, typography } from '../../constants/theme';

const GOOGLE_MAPS_KEY = 'AIzaSyBgh-D-6VzxB1D-qn29iTAnGbGRUKjDMYs';

interface LocationPickerProps {
  label: string;
  icon: string;
  iconColor: string;
  value: { address: string; lat: number; lng: number } | null;
  onChange: (loc: { address: string; lat: number; lng: number }) => void;
  initialRegion?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
}

// Default to Dammam area
const DEFAULT_REGION = {
  latitude: 26.4207,
  longitude: 50.0888,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=ar&key=${GOOGLE_MAPS_KEY}`
    );
    const json = await res.json();
    if (json.results && json.results.length > 0) {
      return json.results[0].formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  } catch (e) {
    console.error('Geocode error:', e);
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

async function searchPlace(query: string): Promise<Array<{ address: string; lat: number; lng: number }>> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&language=ar&region=sa&key=${GOOGLE_MAPS_KEY}`
    );
    const json = await res.json();
    if (json.results && json.results.length > 0) {
      return json.results.slice(0, 5).map((r: any) => ({
        address: r.formatted_address,
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
      }));
    }
  } catch (e) {
    console.error('Search error:', e);
  }
  return [];
}

export function LocationPicker({ label, icon, iconColor, value, onChange, initialRegion }: LocationPickerProps) {
  const mapRef = useRef<MapView>(null);
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ address: string; lat: number; lng: number }>>([]);
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const region = value
    ? { latitude: value.lat, longitude: value.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : initialRegion || DEFAULT_REGION;

  const handleMapPress = useCallback(async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setGeocoding(true);
    const address = await reverseGeocode(latitude, longitude);
    onChange({ address, lat: latitude, lng: longitude });
    setGeocoding(false);
  }, [onChange]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchPlace(searchQuery.trim());
    setSearchResults(results);
    setSearching(false);
  }, [searchQuery]);

  const selectResult = useCallback((result: { address: string; lat: number; lng: number }) => {
    onChange(result);
    setSearchResults([]);
    setSearchQuery('');
    mapRef.current?.animateToRegion({
      latitude: result.lat, longitude: result.lng,
      latitudeDelta: 0.01, longitudeDelta: 0.01,
    }, 500);
  }, [onChange]);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setExpanded(!expanded)} style={[styles.header, expanded && styles.headerExpanded]}>
        <View style={[styles.iconWrap, { backgroundColor: iconColor + '15' }]}>
          <MaterialIcons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.address} numberOfLines={1}>
            {value ? value.address : 'اضغط لتحديد الموقع على الخريطة'}
          </Text>
        </View>
        <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={24} color={theme.textMuted} />
      </Pressable>

      {expanded ? (
        <View style={styles.mapSection}>
          {/* Search Bar */}
          <View style={styles.searchRow}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="ابحث عن موقع..."
              placeholderTextColor={theme.textMuted}
              style={styles.searchInput}
              textAlign="right"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <Pressable onPress={handleSearch} style={styles.searchBtn}>
              {searching ? <ActivityIndicator size="small" color="#FFF" /> : <MaterialIcons name="search" size={20} color="#FFF" />}
            </Pressable>
          </View>

          {/* Search Results */}
          {searchResults.length > 0 ? (
            <View style={styles.resultsContainer}>
              {searchResults.map((r, i) => (
                <Pressable key={i} onPress={() => selectResult(r)} style={styles.resultItem}>
                  <MaterialIcons name="place" size={16} color={iconColor} />
                  <Text style={styles.resultText} numberOfLines={2}>{r.address}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {/* Map */}
          <View style={styles.mapWrap}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              initialRegion={region}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton
            >
              {value ? (
                <Marker
                  coordinate={{ latitude: value.lat, longitude: value.lng }}
                  title={label}
                  description={value.address}
                  pinColor={iconColor}
                />
              ) : null}
            </MapView>
            {geocoding ? (
              <View style={styles.geocodingOverlay}>
                <ActivityIndicator color={theme.primary} />
                <Text style={styles.geocodingText}>جاري تحديد العنوان...</Text>
              </View>
            ) : null}
            <View style={styles.mapHint}>
              <MaterialIcons name="touch-app" size={14} color={theme.accent} />
              <Text style={styles.mapHintText}>اضغط على الخريطة لتحديد الموقع</Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium,
    borderWidth: 1.5,
    borderColor: theme.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  headerExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    writingDirection: 'rtl' as const,
    textAlign: 'right',
  },
  address: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    writingDirection: 'rtl' as const,
    textAlign: 'right',
    marginTop: 2,
  },
  mapSection: {
    padding: 10,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radiusMedium,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.textPrimary,
    writingDirection: 'rtl' as const,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radiusMedium,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsContainer: {
    backgroundColor: theme.surfaceElevated,
    borderRadius: theme.radiusMedium,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  resultText: {
    flex: 1,
    fontSize: 13,
    color: theme.textPrimary,
    writingDirection: 'rtl' as const,
    textAlign: 'right',
  },
  mapWrap: {
    height: 250,
    borderRadius: theme.radiusMedium,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  geocodingOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radiusMedium,
  },
  geocodingText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
    writingDirection: 'rtl' as const,
  },
  mapHint: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 6,
    borderRadius: theme.radiusFull,
  },
  mapHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.accent,
    writingDirection: 'rtl' as const,
  },
});
