import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { getDriverLevelLabel, getDriverLevelColor } from '../services/types';

export default function DriverCardScreen() {
  const router = useRouter();
  const { profile } = useApp();
  const { user } = useAuth();
  const cardRef = useRef<View>(null);

  const levelColor = getDriverLevelColor(profile?.level || 1);
  const levelLabel = getDriverLevelLabel(profile?.level || 1);
  const driverName = profile?.full_name || profile?.username || 'كابتن';
  const driverCode = profile?.driver_code || 'SH-RIDE-000';
  const vehicleType = profile?.vehicle_type || 'غير محدد';
  const carModel = profile?.car_model || '';
  const vehiclePlate = profile?.vehicle_plate || '';
  const rating = profile?.rating?.toFixed(1) || '5.0';
  const totalTrips = profile?.total_trips || 0;
  const level = profile?.level || 1;

  const shareCard = async () => {
    try {
      if (!cardRef.current) return;
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'مشاركة البطاقة الرقمية' });
      }
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>البطاقة الرقمية</Text>
        <Pressable onPress={shareCard} style={styles.shareBtn}>
          <MaterialIcons name="share" size={22} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <View ref={cardRef} collapsable={false} style={styles.card}>
            {/* Top accent bar */}
            <View style={styles.cardAccentBar} />

            {/* Company branding */}
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <MaterialIcons name="local-shipping" size={20} color={theme.accent} />
              </View>
              <Text style={styles.brandText}>الشرق للنقل والتوصيل</Text>
              <Text style={styles.brandBadge}>كابتن معتمد</Text>
            </View>

            {/* Avatar + Name */}
            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                <MaterialIcons name="person" size={48} color={theme.primary} />
                <View style={[styles.levelBadgeAvatar, { backgroundColor: levelColor }]}>
                  <Text style={styles.levelBadgeText}>{level}</Text>
                </View>
              </View>
              <Text style={styles.driverName}>{driverName}</Text>
              <View style={styles.codeRow}>
                <MaterialIcons name="qr-code" size={16} color={theme.accent} />
                <Text style={styles.driverCode}>{driverCode}</Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialIcons name="star" size={22} color="#FBBF24" />
                <Text style={styles.statValue}>{rating}</Text>
                <Text style={styles.statLabel}>التقييم</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="route" size={22} color={theme.primaryGlow} />
                <Text style={styles.statValue}>{totalTrips}</Text>
                <Text style={styles.statLabel}>مشوار</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="military-tech" size={22} color={levelColor} />
                <Text style={[styles.statValue, { color: levelColor }]}>{levelLabel}</Text>
                <Text style={styles.statLabel}>المستوى</Text>
              </View>
            </View>

            {/* Vehicle Info */}
            <View style={styles.vehicleSection}>
              <View style={styles.vehicleRow}>
                <MaterialIcons name="directions-car" size={18} color={theme.textMuted} />
                <Text style={styles.vehicleText}>{vehicleType}{carModel ? ` - ${carModel}` : ''}</Text>
              </View>
              {vehiclePlate ? (
                <View style={styles.plateBox}>
                  <Text style={styles.plateText}>{vehiclePlate}</Text>
                </View>
              ) : null}
            </View>

            {/* Footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>Al-Sharq Transport & Delivery</Text>
              <Text style={styles.footerDate}>تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Pressable onPress={shareCard} style={styles.shareCardBtn}>
            <MaterialIcons name="share" size={20} color="#FFF" />
            <Text style={styles.shareCardBtnText}>مشاركة البطاقة كصورة</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  shareBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },

  card: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: theme.primary + '40',
    ...Platform.select({
      ios: { shadowColor: theme.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  cardAccentBar: { height: 6, backgroundColor: theme.accent },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  brandIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: theme.accent + '15', alignItems: 'center', justifyContent: 'center' },
  brandText: { flex: 1, fontSize: 13, fontWeight: '700', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'center' },
  brandBadge: { fontSize: 10, fontWeight: '700', color: theme.success, backgroundColor: theme.success + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },

  profileSection: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: theme.primary + '20', borderWidth: 3, borderColor: theme.primary + '50', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  levelBadgeAvatar: { position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.surface },
  levelBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  driverName: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  driverCode: { fontSize: 16, fontWeight: '700', color: theme.accent, letterSpacing: 1 },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 20, marginHorizontal: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.borderLight },
  statItem: { alignItems: 'center', gap: 6 },
  statValue: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted },
  statDivider: { width: 1, height: 40, backgroundColor: theme.border },

  vehicleSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vehicleText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary, writingDirection: 'rtl' },
  plateBox: { backgroundColor: theme.backgroundSecondary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.border },
  plateText: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, letterSpacing: 2 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: theme.backgroundSecondary },
  footerText: { fontSize: 10, fontWeight: '600', color: theme.textMuted },
  footerDate: { fontSize: 10, fontWeight: '500', color: theme.textMuted, writingDirection: 'rtl' },

  shareCardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.radiusMedium, marginTop: 24 },
  shareCardBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
