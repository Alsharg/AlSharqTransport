import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

const GOOGLE_MAPS_KEY = 'AIzaSyBgh-D-6VzxB1D-qn29iTAnGbGRUKjDMYs';

interface LocationPickerProps {
  label: string;
  icon: string;
  iconColor: string;
  value: { address: string; lat: number; lng: number } | null;
  onChange: (loc: { address: string; lat: number; lng: number }) => void;
  initialRegion?: any;
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

export function LocationPicker({ label, icon, iconColor, value, onChange }: LocationPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ address: string; lat: number; lng: number }>>([]);
  const [searching, setSearching] = useState(false);

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
    setExpanded(false);
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
            {value ? value.address : 'اضغط للبحث عن الموقع'}
          </Text>
        </View>
        <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={24} color={theme.textMuted} />
      </Pressable>

      {expanded ? (
        <View style={styles.searchSection}>
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
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1.5, borderColor: theme.border, overflow: 'hidden', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  headerExpanded: { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '700', color: theme.textMuted, writingDirection: 'rtl' as const, textAlign: 'right' },
  address: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' as const, textAlign: 'right', marginTop: 2 },
  searchSection: { padding: 10 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: theme.textPrimary, writingDirection: 'rtl' as const },
  searchBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  resultsContainer: { backgroundColor: theme.surfaceElevated, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: theme.border },
  resultItem: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  resultText: { flex: 1, fontSize: 13, color: theme.textPrimary, writingDirection: 'rtl' as const, textAlign: 'right' },
});
