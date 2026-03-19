import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, Platform, Linking, Dimensions, Share, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolate,
  Easing, FadeInDown, FadeInUp,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { theme, typography } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { getDriverLevelLabel, getDriverLevelColor, UserProfile } from '../services/types';
import * as api from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 390);
const CARD_HEIGHT = CARD_WIDTH * 1.52;

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  available: { label: 'متاح', color: '#22C55E', icon: 'check-circle' },
  unavailable: { label: 'غير متاح', color: '#94A3B8', icon: 'pause-circle-filled' },
  onTrip: { label: 'في مشوار', color: '#8B5CF6', icon: 'directions-car' },
};

const WHATSAPP_NUMBER = '966569559088';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export default function DriverCardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { driverId } = useLocalSearchParams<{ driverId?: string }>();
  const { profile } = useApp();
  const { user } = useAuth();

  const [driver, setDriver] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCarPhotos, setShowCarPhotos] = useState(false);

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

  const shareViaWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = `🚗 *بطاقة كابتن — الشرق درايفر*\n\n👤 الاسم: ${driverName}\n🆔 الكود: ${driverCode}\n🚘 السيارة: ${vehicleType}${carModel ? ` — ${carModel}` : ''}\n🔢 اللوحة: ${vehiclePlate || '-'}\n⭐ التقييم: ${rating}\n📊 المشاوير: ${totalTrips}\n🏅 المستوى: ${levelLabel}\n🌍 الجنسية: ${nationality}\n\n📞 للتواصل: ${phone}\n💬 واتساب: ${WHATSAPP_URL}\n\n— الشرق للنقل والتوصيل`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`).catch(() => {});
  };

  const shareCard = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = `🚗 بطاقة كابتن — الشرق درايفر\n\n👤 الاسم: ${driverName}\n🆔 الكود: ${driverCode}\n🚘 السيارة: ${vehicleType}${carModel ? ` — ${carModel}` : ''}\n🔢 اللوحة: ${vehiclePlate || '-'}\n⭐ التقييم: ${rating}\n📊 المشاوير: ${totalTrips}\n🏅 المستوى: ${levelLabel}\n🌍 الجنسية: ${nationality}\n\n📞 للتواصل: ${phone}\n💬 واتساب: ${WHATSAPP_URL}\n\n— الشرق للنقل والتوصيل`;
    try {
      await Share.share({ message: text, title: `بطاقة كابتن ${driverName}` });
    } catch (e) {
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
  const residenceNumber = (driver as any).residence_number || '';
  const hasAvatar = !!driver.avatar_url;
  const carPhotos: string[] = Array.isArray((driver as any).car_photos) ? (driver as any).car_photos : [];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>البطاقة الرقمية</Text>
        <Pressable onPress={shareCard} style={styles.shareHeaderBtn}>
          <MaterialIcons name="ios-share" size={20} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', paddingVertical: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Flip hint */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.hintRow}>
          <MaterialIcons name="touch-app" size={16} color={theme.accent} />
          <Text style={styles.hintText}>اضغط على البطاقة لقلبها</Text>
        </Animated.View>

        {/* Card Container */}
        <Pressable onPress={handleFlip} style={styles.cardContainer}>
          {/* FRONT FACE */}
          <Animated.View style={[styles.cardFace, frontAnimatedStyle]}>
            <View style={styles.card}>
              {/* Top accent gradient */}
              <View style={styles.cardTopAccent}>
                <View style={styles.accentBar} />
              </View>

              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: status.color + '18', borderColor: status.color + '35' }]}>
                <MaterialIcons name={status.icon as any} size={12} color={status.color} />
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>

              {/* Brand */}
              <View style={styles.brandBar}>
                <MaterialIcons name="local-shipping" size={14} color={theme.accent} />
                <Text style={styles.brandName}>الشرق درايفر</Text>
              </View>

              {/* Avatar */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarOuter}>
                  <View style={styles.avatarInner}>
                    {hasAvatar ? (
                      <Image source={{ uri: driver.avatar_url }} style={styles.avatarImage} contentFit="cover" transition={200} />
                    ) : (
                      <MaterialIcons name="person" size={42} color={theme.primary} />
                    )}
                  </View>
                  <View style={[styles.avatarLevelBadge, { backgroundColor: levelColor }]}>
                    <Text style={styles.avatarLevelText}>{level}</Text>
                  </View>
                </View>
              </View>

              {/* Name + Code */}
              <Text style={styles.driverName}>{driverName}</Text>
              <View style={styles.codeRow}>
                <View style={styles.qrBadge}>
                  <MaterialIcons name="qr-code-2" size={13} color={theme.accent} />
                </View>
                <Text style={styles.codeText}>{driverCode}</Text>
              </View>

              {/* Info Grid */}
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="flag" size={15} color={theme.accent} />
                  <Text style={styles.infoLabel}>الجنسية</Text>
                  <Text style={styles.infoValue}>{nationality}</Text>
                </View>
                <View style={styles.infoSeparator} />
                <View style={styles.infoItem}>
                  <MaterialIcons name="directions-car" size={15} color={theme.accent} />
                  <Text style={styles.infoLabel}>السيارة</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{vehicleType}{carModel ? ` ${carModel}` : ''}</Text>
                </View>
              </View>

              {/* Stats Bar */}
              <View style={styles.statsBar}>
                <View style={styles.statBlock}>
                  <MaterialIcons name="star" size={16} color="#FBBF24" />
                  <Text style={styles.statNum}>{rating}</Text>
                  <Text style={styles.statCaption}>التقييم</Text>
                </View>
                <View style={styles.statSep} />
                <View style={styles.statBlock}>
                  <MaterialIcons name="route" size={16} color={theme.primaryGlow} />
                  <Text style={styles.statNum}>{totalTrips}</Text>
                  <Text style={styles.statCaption}>مشوار</Text>
                </View>
                <View style={styles.statSep} />
                <View style={styles.statBlock}>
                  <MaterialIcons name="military-tech" size={16} color={levelColor} />
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
          <Animated.View style={[styles.cardFace, backAnimatedStyle]}>
            <View style={styles.card}>
              <View style={styles.cardTopAccent}>
                <View style={styles.accentBar} />
              </View>

              <View style={styles.backHeader}>
                <MaterialIcons name="badge" size={16} color={theme.accent} />
                <Text style={styles.backHeaderTitle}>بيانات الكابتن التفصيلية</Text>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 8 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {/* Details */}
                {[
                  { icon: 'phone', color: '#3B82F6', label: 'رقم الجوال', value: phone },
                  { icon: 'email', color: '#8B5CF6', label: 'البريد الإلكتروني', value: driver.email },
                  { icon: 'assignment-ind', color: '#F59E0B', label: 'رقم الرخصة', value: licenseNumber },
                  { icon: 'credit-card', color: '#22C55E', label: 'رقم اللوحة', value: vehiclePlate || 'غير مسجل' },
                  { icon: 'flag', color: '#EC4899', label: 'الجنسية', value: nationality },
                  { icon: 'directions-car', color: '#14B8A6', label: 'السيارة', value: `${vehicleType}${carModel ? ` — ${carModel}` : ''}` },
                  ...(residenceNumber ? [{ icon: 'badge', color: '#6366F1', label: 'رقم الإقامة', value: residenceNumber }] : []),
                ].map((item, idx) => (
                  <View key={idx} style={styles.backRow}>
                    <View style={[styles.backIcon, { backgroundColor: item.color + '12' }]}>
                      <MaterialIcons name={item.icon as any} size={18} color={item.color} />
                    </View>
                    <View style={styles.backRowContent}>
                      <Text style={styles.backLabel}>{item.label}</Text>
                      <Text style={styles.backValue}>{item.value}</Text>
                    </View>
                  </View>
                ))}

                {/* Bonuses/Penalties */}
                <View style={styles.backStatsRow}>
                  <View style={[styles.backStatCard, { borderColor: '#22C55E30' }]}>
                    <MaterialIcons name="emoji-events" size={16} color="#22C55E" />
                    <Text style={[styles.backStatValue, { color: '#22C55E' }]}>{Number(driver.bonuses || 0).toFixed(0)}</Text>
                    <Text style={styles.backStatLabel}>مكافآت</Text>
                  </View>
                  <View style={[styles.backStatCard, { borderColor: '#EF444430' }]}>
                    <MaterialIcons name="remove-circle" size={16} color="#EF4444" />
                    <Text style={[styles.backStatValue, { color: '#EF4444' }]}>{Number(driver.penalties || 0).toFixed(0)}</Text>
                    <Text style={styles.backStatLabel}>خصومات</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.cardFooter}>
                <Text style={styles.footerLeft}>تاريخ الانضمام</Text>
                <Text style={styles.footerRight}>{new Date(driver.created_at).toLocaleDateString('ar-SA')}</Text>
              </View>
            </View>
          </Animated.View>
        </Pressable>

        {/* Car Photos Section */}
        {carPhotos.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.carPhotosSection}>
            <Pressable onPress={() => setShowCarPhotos(!showCarPhotos)} style={styles.carPhotosHeader}>
              <MaterialIcons name="photo-library" size={20} color={theme.accent} />
              <Text style={styles.carPhotosTitle}>صور السيارة ({carPhotos.length})</Text>
              <MaterialIcons name={showCarPhotos ? 'expand-less' : 'expand-more'} size={22} color={theme.textMuted} />
            </Pressable>
            {showCarPhotos ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 4, paddingTop: 12 }}>
                {carPhotos.map((url, i) => (
                  <View key={i} style={styles.carPhotoWrap}>
                    <Image source={{ uri: url }} style={styles.carPhoto} contentFit="cover" transition={200} />
                  </View>
                ))}
              </ScrollView>
            ) : null}
          </Animated.View>
        ) : null}

        {/* Share Buttons */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.bottomSection}>
          <View style={styles.shareRow}>
            <Pressable onPress={shareViaWhatsApp} style={({ pressed }) => [styles.whatsappBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}>
              <MaterialIcons name="chat" size={22} color="#FFF" />
              <Text style={styles.whatsappBtnText}>مشاركة عبر واتساب</Text>
            </Pressable>
            <Pressable onPress={shareCard} style={({ pressed }) => [styles.shareAllBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}>
              <MaterialIcons name="share" size={20} color={theme.primary} />
            </Pressable>
          </View>

          <Pressable onPress={openWhatsApp} style={({ pressed }) => [styles.contactBtn, pressed && { opacity: 0.85 }]}>
            <MaterialIcons name="support-agent" size={20} color={theme.accent} />
            <Text style={styles.contactBtnText}>تواصل مع الدعم</Text>
            <MaterialIcons name="chevron-left" size={18} color={theme.textMuted} />
          </Pressable>
        </Animated.View>
      </ScrollView>
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
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' as const },
  shareHeaderBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },

  hintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: theme.accent + '10', borderRadius: theme.radiusFull,
    borderWidth: 1, borderColor: theme.accent + '25',
  },
  hintText: { fontSize: 12, fontWeight: '600', color: theme.accent, writingDirection: 'rtl' as const },

  cardContainer: { width: CARD_WIDTH, height: CARD_HEIGHT },
  cardFace: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },

  card: {
    flex: 1, backgroundColor: theme.surface, borderRadius: 24, overflow: 'hidden',
    borderWidth: 1.5, borderColor: theme.accent + '25',
    ...Platform.select({
      ios: { shadowColor: '#1A3B6D', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 12 },
    }),
  },

  cardTopAccent: { height: 5 },
  accentBar: { flex: 1, backgroundColor: theme.accent },

  statusBadge: {
    position: 'absolute', top: 14, left: 14, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: theme.radiusFull, borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '700' },

  brandBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 14, paddingBottom: 2 },
  brandName: { fontSize: 11, fontWeight: '700', color: theme.textMuted, writingDirection: 'rtl' as const, letterSpacing: 0.5 },

  avatarSection: { alignItems: 'center', paddingTop: 8, paddingBottom: 6 },
  avatarOuter: {
    width: 78, height: 78, borderRadius: 39, borderWidth: 3, borderColor: theme.accent + '40',
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary + '10',
  },
  avatarInner: {
    width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.primary + '15', overflow: 'hidden',
  },
  avatarImage: { width: 70, height: 70, borderRadius: 35 },
  avatarLevelBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: theme.surface,
  },
  avatarLevelText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  driverName: { fontSize: 19, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', writingDirection: 'rtl' as const },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 3 },
  qrBadge: { width: 22, height: 22, borderRadius: 6, backgroundColor: theme.accent + '12', alignItems: 'center', justifyContent: 'center' },
  codeText: { fontSize: 13, fontWeight: '700', color: theme.accent, letterSpacing: 1 },

  infoGrid: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 18, marginTop: 10, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: theme.borderLight,
  },
  infoItem: { flex: 1, alignItems: 'center', gap: 2 },
  infoSeparator: { width: 1, height: 32, backgroundColor: theme.borderLight },
  infoLabel: { fontSize: 9, fontWeight: '600', color: theme.textMuted },
  infoValue: { fontSize: 12, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', writingDirection: 'rtl' as const },

  statsBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    marginHorizontal: 18, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.borderLight,
  },
  statBlock: { alignItems: 'center', gap: 2 },
  statNum: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },
  statCaption: { fontSize: 8, fontWeight: '600', color: theme.textMuted },
  statSep: { width: 1, height: 28, backgroundColor: theme.borderLight },

  plateRow: { alignItems: 'center', paddingVertical: 6 },
  plateBox: {
    backgroundColor: theme.backgroundSecondary, paddingHorizontal: 18, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: theme.border,
  },
  plateText: { fontSize: 13, fontWeight: '700', color: theme.textPrimary, letterSpacing: 2 },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 9, backgroundColor: theme.backgroundSecondary, marginTop: 'auto',
  },
  footerLeft: { fontSize: 9, fontWeight: '600', color: theme.textMuted },
  footerRight: { fontSize: 9, fontWeight: '700', color: theme.accent, writingDirection: 'rtl' as const },

  // === BACK ===
  backHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 14, paddingBottom: 8 },
  backHeaderTitle: { fontSize: 12, fontWeight: '700', color: theme.textMuted, writingDirection: 'rtl' as const },

  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: theme.borderLight,
  },
  backIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  backRowContent: { flex: 1 },
  backLabel: { fontSize: 9, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl' as const, textAlign: 'right' },
  backValue: { fontSize: 13, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' as const, textAlign: 'right', marginTop: 1 },

  backStatsRow: { flexDirection: 'row', gap: 8, paddingVertical: 10 },
  backStatCard: {
    flex: 1, alignItems: 'center', gap: 3, paddingVertical: 10,
    borderRadius: theme.radiusMedium, backgroundColor: theme.surfaceElevated, borderWidth: 1,
  },
  backStatValue: { fontSize: 16, fontWeight: '700' },
  backStatLabel: { fontSize: 9, fontWeight: '600', color: theme.textMuted },

  // === Car Photos ===
  carPhotosSection: {
    width: CARD_WIDTH, marginTop: 16, padding: 16,
    backgroundColor: theme.surface, borderRadius: theme.radiusLarge,
    borderWidth: 1, borderColor: theme.border,
  },
  carPhotosHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  carPhotosTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' as const, textAlign: 'right' },
  carPhotoWrap: { width: 120, height: 90, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.border },
  carPhoto: { width: 120, height: 90 },

  // === Bottom ===
  bottomSection: { width: CARD_WIDTH, marginTop: 20, gap: 10 },
  shareRow: { flexDirection: 'row', gap: 10 },
  whatsappBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#25D366', paddingVertical: 15, borderRadius: theme.radiusMedium,
  },
  whatsappBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700', writingDirection: 'rtl' as const },
  shareAllBtn: {
    width: 52, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.primary + '15', borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: theme.primary + '30',
  },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, backgroundColor: theme.accent + '08', borderRadius: theme.radiusMedium,
    borderWidth: 1, borderColor: theme.accent + '20',
  },
  contactBtnText: { fontSize: 14, fontWeight: '600', color: theme.accent, writingDirection: 'rtl' as const },

  loadingWrap: { alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl' as const },
});
