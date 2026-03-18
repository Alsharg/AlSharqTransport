import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, Platform, Linking, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolate,
  Easing, FadeInDown,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { theme, typography } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { getDriverLevelLabel, getDriverLevelColor, UserProfile } from '../services/types';
import * as api from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 380);
const CARD_HEIGHT = CARD_WIDTH * 1.45;

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  available: { label: 'متاح', color: '#22C55E', icon: 'check-circle' },
  unavailable: { label: 'غير متاح', color: '#94A3B8', icon: 'pause-circle-filled' },
  onTrip: { label: 'مشغول', color: '#8B5CF6', icon: 'directions-car' },
};

const WHATSAPP_NUMBER = '966569559088'; // 0569559088
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export default function DriverCardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { driverId } = useLocalSearchParams<{ driverId?: string }>();
  const { profile } = useApp();
  const { user } = useAuth();


  // If driverId param exists, load that driver; otherwise use current driver profile
  const [driver, setDriver] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (driverId) {
      setLoading(true);
      api.fetchUserProfile(driverId).then(d => {
        if (d) setDriver(d);
        setLoading(false);
      });
    } else if (profile) {
      setDriver(profile as UserProfile);
    }
  }, [driverId, profile]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (driverId) {
        api.fetchUserProfile(driverId).then(d => { if (d) setDriver(d); });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [driverId]);

  // Flip animation
  const flipProgress = useSharedValue(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const toValue = isFlipped ? 0 : 1;
    flipProgress.value = withTiming(toValue, {
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    setIsFlipped(!isFlipped);
  }, [isFlipped, flipProgress]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
    };
  });

  const shareCard = async () => {
    try {
      const text = `بطاقة كابتن - الشرق للنقل والتوصيل\n\nالاسم: ${driverName}\nالكود: ${driverCode}\nالسيارة: ${vehicleType}${carModel ? ` ${carModel}` : ''}\nاللوحة: ${vehiclePlate || '-'}\nالتقييم: ${rating} ⭐\nالمشاوير: ${totalTrips}\n\nللتواصل عبر واتساب:\nhttps://wa.me/${WHATSAPP_NUMBER}`;
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync('data:text/plain;base64,' + btoa(unescape(encodeURIComponent(text))), { mimeType: 'text/plain', dialogTitle: 'مشاركة البطاقة الرقمية' });
      }
    } catch (e) {
      // Fallback: just open share dialog isn't available
      console.error('Share error:', e);
    }
  };

  const openWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(WHATSAPP_URL).catch(() => {});
  };

  if (!driver || loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.loadingWrap}>
          <MaterialIcons name="badge" size={48} color={theme.accent} />
          <Text style={styles.loadingText}>جاري تحميل البطاقة...</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const driverName = driver.full_name || driver.username || 'كابتن';
  const driverCode = driver.driver_code || 'SH-RIDE-000';
  const vehicleType = driver.vehicle_type || 'غير محدد';
  const carModel = driver.car_model || '';
  const vehiclePlate = driver.vehicle_plate || '';
  const rating = Number(driver.rating || 5).toFixed(1);
  const totalTrips = driver.total_trips || 0;
  const level = driver.level || 1;
  const levelColor = getDriverLevelColor(level);
  const levelLabel = getDriverLevelLabel(level);
  const status = STATUS_MAP[driver.status] || STATUS_MAP.available;
  const nationality = driver.nationality || 'غير محدد';
  const phone = driver.phone || 'غير مسجل';
  const licenseNumber = driver.license_number || 'غير مسجل';
  const hasAvatar = !!driver.avatar_url;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>البطاقة الرقمية</Text>
        <Pressable onPress={shareCard} style={styles.shareBtn}>
          <MaterialIcons name="share" size={20} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Flip hint */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.hintRow}>
          <MaterialIcons name="touch-app" size={18} color={theme.textMuted} />
          <Text style={styles.hintText}>اضغط على البطاقة لقلبها</Text>
        </Animated.View>

        {/* Card Container */}
        <Pressable onPress={handleFlip} style={styles.cardContainer}>
          {/* FRONT FACE */}
          <Animated.View style={[styles.cardFace, frontAnimatedStyle]}>
            <View style={styles.card}>
              {/* Gold accent top */}
              <View style={styles.cardTopAccent}>
                <View style={styles.accentGradient} />
              </View>

              {/* Status Badge - top right */}
              <View style={[styles.statusBadge, { backgroundColor: status.color + '20', borderColor: status.color + '40' }]}>
                <MaterialIcons name={status.icon as any} size={14} color={status.color} />
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>

              {/* Brand */}
              <View style={styles.brandBar}>
                <MaterialIcons name="local-shipping" size={16} color={theme.accent} />
                <Text style={styles.brandName}>الشرق للنقل والتوصيل</Text>
              </View>

              {/* Avatar Circle */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarOuter}>
                  <View style={styles.avatarInner}>
                    {hasAvatar ? (
                      <Image source={{ uri: driver.avatar_url }} style={styles.avatarImage} contentFit="cover" transition={200} />
                    ) : (
                      <MaterialIcons name="person" size={44} color={theme.primary} />
                    )}
                  </View>
                  {/* Level badge on avatar */}
                  <View style={[styles.avatarLevelBadge, { backgroundColor: levelColor }]}>
                    <Text style={styles.avatarLevelText}>{level}</Text>
                  </View>
                </View>
              </View>

              {/* Name + Code */}
              <Text style={styles.driverName}>{driverName}</Text>
              <View style={styles.codeRow}>
                <MaterialIcons name="qr-code-2" size={14} color={theme.accent} />
                <Text style={styles.codeText}>{driverCode}</Text>
              </View>

              {/* Info Grid */}
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="flag" size={16} color={theme.textMuted} />
                  <Text style={styles.infoLabel}>الجنسية</Text>
                  <Text style={styles.infoValue}>{nationality}</Text>
                </View>
                <View style={styles.infoSeparator} />
                <View style={styles.infoItem}>
                  <MaterialIcons name="directions-car" size={16} color={theme.textMuted} />
                  <Text style={styles.infoLabel}>السيارة</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{vehicleType}{carModel ? ` ${carModel}` : ''}</Text>
                </View>
              </View>

              {/* Stats Bar */}
              <View style={styles.statsBar}>
                <View style={styles.statBlock}>
                  <MaterialIcons name="star" size={18} color="#FBBF24" />
                  <Text style={styles.statNum}>{rating}</Text>
                  <Text style={styles.statCaption}>التقييم</Text>
                </View>
                <View style={styles.statSep} />
                <View style={styles.statBlock}>
                  <MaterialIcons name="route" size={18} color={theme.primaryGlow} />
                  <Text style={styles.statNum}>{totalTrips}</Text>
                  <Text style={styles.statCaption}>مشوار</Text>
                </View>
                <View style={styles.statSep} />
                <View style={styles.statBlock}>
                  <MaterialIcons name="military-tech" size={18} color={levelColor} />
                  <Text style={[styles.statNum, { color: levelColor }]}>{levelLabel}</Text>
                  <Text style={styles.statCaption}>المستوى</Text>
                </View>
              </View>

              {/* Plate */}
              {vehiclePlate ? (
                <View style={styles.plateRow}>
                  <View style={styles.plateBox}>
                    <Text style={styles.plateText}>{vehiclePlate}</Text>
                  </View>
                </View>
              ) : null}

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.footerLeft}>Al-Sharq Transport</Text>
                <Text style={styles.footerRight}>كابتن معتمد ✓</Text>
              </View>
            </View>
          </Animated.View>

          {/* BACK FACE */}
          <Animated.View style={[styles.cardFace, styles.cardFaceBack, backAnimatedStyle]}>
            <View style={styles.card}>
              {/* Gold accent top */}
              <View style={styles.cardTopAccent}>
                <View style={styles.accentGradient} />
              </View>

              {/* Back header */}
              <View style={styles.backHeader}>
                <MaterialIcons name="local-shipping" size={16} color={theme.accent} />
                <Text style={styles.brandName}>بيانات الكابتن التفصيلية</Text>
              </View>

              {/* Phone */}
              <View style={styles.backSection}>
                <View style={styles.backRow}>
                  <View style={[styles.backIcon, { backgroundColor: '#3B82F615' }]}>
                    <MaterialIcons name="phone" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.backRowContent}>
                    <Text style={styles.backLabel}>رقم الجوال</Text>
                    <Text style={styles.backValue}>{phone}</Text>
                  </View>
                </View>

                <View style={styles.backRow}>
                  <View style={[styles.backIcon, { backgroundColor: '#8B5CF615' }]}>
                    <MaterialIcons name="email" size={20} color="#8B5CF6" />
                  </View>
                  <View style={styles.backRowContent}>
                    <Text style={styles.backLabel}>البريد الإلكتروني</Text>
                    <Text style={styles.backValue}>{driver.email}</Text>
                  </View>
                </View>

                <View style={styles.backRow}>
                  <View style={[styles.backIcon, { backgroundColor: '#F59E0B15' }]}>
                    <MaterialIcons name="assignment-ind" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.backRowContent}>
                    <Text style={styles.backLabel}>رقم الرخصة</Text>
                    <Text style={styles.backValue}>{licenseNumber}</Text>
                  </View>
                </View>

                <View style={styles.backRow}>
                  <View style={[styles.backIcon, { backgroundColor: '#22C55E15' }]}>
                    <MaterialIcons name="credit-card" size={20} color="#22C55E" />
                  </View>
                  <View style={styles.backRowContent}>
                    <Text style={styles.backLabel}>رقم اللوحة</Text>
                    <Text style={styles.backValue}>{vehiclePlate || 'غير مسجل'}</Text>
                  </View>
                </View>

                <View style={styles.backRow}>
                  <View style={[styles.backIcon, { backgroundColor: '#EC489915' }]}>
                    <MaterialIcons name="flag" size={20} color="#EC4899" />
                  </View>
                  <View style={styles.backRowContent}>
                    <Text style={styles.backLabel}>الجنسية</Text>
                    <Text style={styles.backValue}>{nationality}</Text>
                  </View>
                </View>

                <View style={styles.backRow}>
                  <View style={[styles.backIcon, { backgroundColor: '#14B8A615' }]}>
                    <MaterialIcons name="directions-car" size={20} color="#14B8A6" />
                  </View>
                  <View style={styles.backRowContent}>
                    <Text style={styles.backLabel}>السيارة</Text>
                    <Text style={styles.backValue}>{vehicleType}{carModel ? ` - ${carModel}` : ''}</Text>
                  </View>
                </View>
              </View>

              {/* Bonuses/Penalties */}
              <View style={styles.backStatsRow}>
                <View style={[styles.backStatCard, { borderColor: '#22C55E30' }]}>
                  <MaterialIcons name="emoji-events" size={18} color="#22C55E" />
                  <Text style={[styles.backStatValue, { color: '#22C55E' }]}>{Number(driver.bonuses || 0).toFixed(0)}</Text>
                  <Text style={styles.backStatLabel}>مكافآت</Text>
                </View>
                <View style={[styles.backStatCard, { borderColor: '#EF444430' }]}>
                  <MaterialIcons name="remove-circle" size={18} color="#EF4444" />
                  <Text style={[styles.backStatValue, { color: '#EF4444' }]}>{Number(driver.penalties || 0).toFixed(0)}</Text>
                  <Text style={styles.backStatLabel}>خصومات</Text>
                </View>
              </View>

              {/* Card Back Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.footerLeft}>تاريخ الانضمام</Text>
                <Text style={styles.footerRight}>{new Date(driver.created_at).toLocaleDateString('ar-SA')}</Text>
              </View>
            </View>
          </Animated.View>
        </Pressable>

        {/* Bottom Section — WhatsApp + Share */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.bottomSection}>
          <Text style={styles.supportText}>الشرق اللوجستية للدعم والاستفسارات</Text>

          <View style={styles.bottomActions}>
            <Pressable
              onPress={openWhatsApp}
              style={({ pressed }) => [styles.whatsappBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            >
              <MaterialIcons name="chat" size={22} color="#FFF" />
              <Text style={styles.whatsappBtnText}>تواصل عبر واتساب</Text>
            </Pressable>

            <Pressable
              onPress={shareCard}
              style={({ pressed }) => [styles.shareCardBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            >
              <MaterialIcons name="share" size={20} color={theme.primary} />
              <Text style={styles.shareCardBtnText}>مشاركة</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' as const },
  shareBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center',
  },

  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  hintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 16, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: theme.surface, borderRadius: theme.radiusFull,
    borderWidth: 1, borderColor: theme.border,
  },
  hintText: { fontSize: 12, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl' as const },

  // Card container
  cardContainer: { width: CARD_WIDTH, height: CARD_HEIGHT },
  cardFace: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
  },
  cardFaceBack: {
    // Back face is initially rotated 180
  },

  card: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: theme.accent + '30',
    ...Platform.select({
      ios: { shadowColor: theme.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20 },
      android: { elevation: 16 },
    }),
  },

  // Top accent
  cardTopAccent: { height: 5 },
  accentGradient: {
    flex: 1,
    backgroundColor: theme.accent,
  },

  // Status badge
  statusBadge: {
    position: 'absolute', top: 16, left: 16, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: theme.radiusFull, borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Brand
  brandBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingTop: 16, paddingBottom: 4,
  },
  brandName: { fontSize: 12, fontWeight: '700', color: theme.textMuted, writingDirection: 'rtl' as const },

  // Avatar
  avatarSection: { alignItems: 'center', paddingTop: 10, paddingBottom: 8 },
  avatarOuter: {
    width: 82, height: 82, borderRadius: 41,
    borderWidth: 3, borderColor: theme.accent + '50',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.primary + '15',
  },
  avatarInner: {
    width: 74, height: 74, borderRadius: 37,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.primary + '20',
    overflow: 'hidden',
  },
  avatarImage: { width: 74, height: 74, borderRadius: 37 },
  avatarLevelBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: theme.surface,
  },
  avatarLevelText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  // Name + Code
  driverName: {
    fontSize: 20, fontWeight: '700', color: theme.textPrimary,
    textAlign: 'center', writingDirection: 'rtl' as const,
  },
  codeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4,
  },
  codeText: { fontSize: 14, fontWeight: '700', color: theme.accent, letterSpacing: 1 },

  // Info grid
  infoGrid: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginTop: 12, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: theme.borderLight,
  },
  infoItem: { flex: 1, alignItems: 'center', gap: 3 },
  infoSeparator: { width: 1, height: 36, backgroundColor: theme.borderLight },
  infoLabel: { fontSize: 10, fontWeight: '600', color: theme.textMuted },
  infoValue: { fontSize: 13, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', writingDirection: 'rtl' as const },

  // Stats bar
  statsBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    marginHorizontal: 20, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: theme.borderLight,
  },
  statBlock: { alignItems: 'center', gap: 3 },
  statNum: { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  statCaption: { fontSize: 9, fontWeight: '600', color: theme.textMuted },
  statSep: { width: 1, height: 32, backgroundColor: theme.borderLight },

  // Plate
  plateRow: { alignItems: 'center', paddingVertical: 8 },
  plateBox: {
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 20, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: theme.border,
  },
  plateText: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, letterSpacing: 2 },

  // Card Footer
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: theme.backgroundSecondary,
    marginTop: 'auto',
  },
  footerLeft: { fontSize: 10, fontWeight: '600', color: theme.textMuted },
  footerRight: { fontSize: 10, fontWeight: '700', color: theme.accent, writingDirection: 'rtl' as const },

  // ===== BACK FACE =====
  backHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingTop: 16, paddingBottom: 12,
  },

  backSection: {
    paddingHorizontal: 16, gap: 2, flex: 1,
  },
  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: theme.borderLight,
  },
  backIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  backRowContent: { flex: 1 },
  backLabel: { fontSize: 10, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl' as const, textAlign: 'right' },
  backValue: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' as const, textAlign: 'right', marginTop: 1 },

  backStatsRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10,
  },
  backStatCard: {
    flex: 1, alignItems: 'center', gap: 4,
    paddingVertical: 12, borderRadius: theme.radiusMedium,
    backgroundColor: theme.surfaceElevated, borderWidth: 1,
  },
  backStatValue: { fontSize: 18, fontWeight: '700' },
  backStatLabel: { fontSize: 10, fontWeight: '600', color: theme.textMuted },

  // ===== BOTTOM =====
  bottomSection: { marginTop: 20, alignItems: 'center', width: '100%' },
  supportText: {
    fontSize: 13, fontWeight: '600', color: theme.textMuted,
    writingDirection: 'rtl' as const, textAlign: 'center', marginBottom: 14,
  },
  bottomActions: { flexDirection: 'row', gap: 10, width: '100%' },
  whatsappBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#25D366', paddingVertical: 14, borderRadius: theme.radiusMedium,
  },
  whatsappBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700', writingDirection: 'rtl' as const },
  shareCardBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: theme.primary + '20', paddingVertical: 14, borderRadius: theme.radiusMedium,
    borderWidth: 1, borderColor: theme.primary + '40',
  },
  shareCardBtnText: { color: theme.primary, fontSize: 14, fontWeight: '700' },

  // Loading
  loadingWrap: { alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl' as const },
});
