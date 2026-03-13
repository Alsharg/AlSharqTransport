import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAlert } from '@/template';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { getTripTypeIcon, getStatusColor, formatTripNumber } from '../services/types';
import { useLanguage } from '../contexts/LanguageContext';
import { config } from '../constants/config';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const {
    getTripById, startTrip, completeTrip, cancelTrip, profile,
    applyForTrip, withdrawApplication, getMyApplication, getApplicationsForTrip,
    acceptTripDirectly,
  } = useApp();
  const { user, userRole } = useAuth();
  const { t, tripStatus, tripType } = useLanguage();
  const trip = getTripById(id || '');
  const [accepting, setAccepting] = useState(false);

  if (!trip) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialIcons name="error-outline" size={64} color={theme.border} />
        <Text style={styles.errorText}>{t.noData}</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>{t.back}</Text></Pressable>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(trip.status);
  const isMyTrip = trip.driver_id === user?.id;
  const driverEarning = trip.price * config.driverShareRate;
  const commission = trip.price * config.platformCommissionRate;
  const myApplication = getMyApplication(trip.id);
  const applicationsCount = getApplicationsForTrip(trip.id).length;
  const isDriver = userRole === 'driver';
  const hasApplied = !!myApplication;
  const isAssigned = (trip.status === 'accepted' || trip.status === 'agreed' || trip.status === 'confirmed') && isMyTrip;
  const isConfirmed = (trip.status === 'confirmed' || trip.status === 'agreed') && isMyTrip;
  const tripNum = formatTripNumber(trip.trip_number);

  const handleAcceptTrip = async () => {
    showAlert(t.acceptTrip, `${t.tripConfirmAccept}\n${t.netEarning}: ${driverEarning.toFixed(0)} ${t.currency}`, [
      { text: t.cancel, style: 'cancel' },
      { text: t.acceptTrip, onPress: async () => {
        setAccepting(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const result = await acceptTripDirectly(trip.id);
        setAccepting(false);
        if (result.error) { showAlert(t.error, result.error); }
        else { showAlert(t.tripBooked, t.tripBookedMsg); }
      }},
    ]);
  };

  const handleStart = async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); await startTrip(trip.id); };
  const handleComplete = () => {
    showAlert(t.endTrip, t.tripConfirmAccept, [
      { text: t.cancel, style: 'cancel' },
      { text: t.endTrip, onPress: async () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); await completeTrip(trip.id); } },
    ]);
  };
  const handleCancel = () => {
    showAlert(t.cancelTrip, t.tripConfirmAccept, [
      { text: t.cancel, style: 'cancel' },
      { text: t.cancelTrip, style: 'destructive', onPress: async () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); await cancelTrip(trip.id); } },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}><MaterialIcons name="close" size={24} color={theme.textPrimary} /></Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t.tripDetails}</Text>
          {tripNum ? <Text style={styles.headerTripNum}>{tripNum}</Text> : null}
        </View>
        <Pressable onPress={() => router.push({ pathname: '/trip-map', params: { id: trip.id } })} style={styles.mapIconBtn}>
          <MaterialIcons name="map" size={22} color={theme.primary} />
        </Pressable>
      </Animated.View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 140 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={[styles.statusBanner, { backgroundColor: statusColor + '12' }]}>
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusLabel, { color: statusColor }]}>{tripStatus(trip.status)}</Text>
        </Animated.View>

        {isDriver && trip.status === 'available' && hasApplied ? (
          <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.applicationBanner}>
            <MaterialIcons name="hourglass-top" size={20} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.applicationBannerTitle}>{t.applicationSent}</Text>
              <Text style={styles.applicationBannerDesc}>{t.applicationWaiting}</Text>
            </View>
          </Animated.View>
        ) : null}

        {/* Client info for confirmed trips (driver view) */}
        {isConfirmed ? (
          <Animated.View entering={FadeInDown.duration(400).delay(130)} style={styles.clientInfoCard}>
            <View style={styles.clientInfoHeader}>
              <MaterialIcons name="verified" size={22} color={theme.success} />
              <Text style={styles.clientInfoTitle}>{t.clientInfo}</Text>
            </View>
            <View style={styles.infoDivider} />
            {trip.client_name ? <View style={styles.infoRow}><Text style={styles.infoLabel}>الاسم</Text><Text style={styles.infoValue}>{trip.client_name}</Text></View> : null}
            {trip.client_phone ? <View style={styles.infoRow}><Text style={styles.infoLabel}>رقم الجوال</Text><Text style={[styles.infoValue, { color: theme.accent }]}>{trip.client_phone}</Text></View> : null}
            <View style={styles.infoRow}><Text style={styles.infoLabel}>نقطة الانطلاق</Text><Text style={styles.infoValue}>{trip.pickup_location}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>الوجهة</Text><Text style={styles.infoValue}>{trip.dropoff_location}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>الموعد</Text><Text style={styles.infoValue}>{trip.scheduled_date} - {trip.scheduled_time}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>السعر</Text><Text style={[styles.infoValue, { color: theme.accent, fontWeight: '700' }]}>{trip.price} ر.س</Text></View>
            {trip.passengers > 0 ? <View style={styles.infoRow}><Text style={styles.infoLabel}>عدد الركاب</Text><Text style={styles.infoValue}>{trip.passengers}</Text></View> : null}
            {trip.work_days ? <View style={styles.infoRow}><Text style={styles.infoLabel}>أيام العمل</Text><Text style={styles.infoValue}>{trip.work_days}</Text></View> : null}
            {trip.notes ? <View style={styles.infoRow}><Text style={styles.infoLabel}>ملاحظات</Text><Text style={styles.infoValue}>{trip.notes}</Text></View> : null}
          </Animated.View>
        ) : isAssigned && !isConfirmed ? (
          <Animated.View entering={FadeInDown.duration(400).delay(130)} style={styles.hiddenInfoNotice}>
            <MaterialIcons name="lock" size={32} color={theme.textMuted} />
            <Text style={styles.hiddenInfoText}>{t.clientInfoHidden}{"\n"}{t.clientInfoAfterApproval}</Text>
          </Animated.View>
        ) : null}

        {!isAssigned ? (
          <>
            <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.typeCard}>
              <View style={[styles.typeIconLarge, { backgroundColor: statusColor + '15' }]}>
                <MaterialIcons name={getTripTypeIcon(trip.type) as any} size={32} color={statusColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.typeName}>{tripType(trip.type)}</Text>
                <Text style={styles.typeDate}>{trip.scheduled_date} - {trip.scheduled_time}</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.routeCard}>
              <Text style={styles.cardTitle}>المسار</Text>
              <View style={styles.routeContainer}>
                <View style={styles.routeTimeline}>
                  <View style={[styles.routeCircle, { backgroundColor: theme.success }]}><MaterialIcons name="trip-origin" size={14} color="#FFF" /></View>
                  <View style={styles.routeDashLine} />
                  <View style={[styles.routeCircle, { backgroundColor: theme.error }]}><MaterialIcons name="place" size={14} color="#FFF" /></View>
                </View>
                <View style={styles.routeDetails}>
                  <View style={styles.routePointDetail}><Text style={styles.routePointLabel}>نقطة الانطلاق</Text><Text style={styles.routePointAddress}>{trip.pickup_location}</Text></View>
                  <View style={styles.routePointDetail}><Text style={styles.routePointLabel}>الوجهة</Text><Text style={styles.routePointAddress}>{trip.dropoff_location}</Text></View>
                </View>
              </View>
            </Animated.View>
          </>
        ) : null}

        {applicationsCount > 0 && trip.status === 'available' ? (
          <Animated.View entering={FadeInDown.duration(400).delay(130)}>
            <View style={styles.applicantsInfo}>
              <MaterialIcons name="people" size={18} color={theme.primary} />
              <Text style={styles.applicantsText}>{applicationsCount} سائق تقدم لهذا المشوار</Text>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.priceCard}>
          <Text style={styles.cardTitle}>{t.tripFare}</Text>
          <View style={styles.priceRow}><Text style={styles.priceLabel}>{t.tripFare}</Text><Text style={styles.priceValue}>{trip.price} {t.currency}</Text></View>
          <View style={styles.detailDivider} />
          <View style={styles.priceRow}><Text style={styles.priceLabel}>{t.platformCommission}</Text><Text style={[styles.priceValue, { color: theme.error }]}>-{commission.toFixed(0)} {t.currency}</Text></View>
          <View style={styles.detailDivider} />
          <View style={[styles.priceRow, styles.totalRow]}><Text style={styles.totalLabel}>{t.driverEarning}</Text><Text style={styles.totalValue}>{driverEarning.toFixed(0)} {t.currency}</Text></View>
        </Animated.View>
      </ScrollView>

      {/* Bottom actions */}
      {isDriver && trip.status === 'available' ? (
        <Animated.View entering={FadeInUp.duration(400)} style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable onPress={handleAcceptTrip} disabled={accepting} style={[styles.actionBtn, styles.applyBtn, accepting && { opacity: 0.6 }]}>
            {accepting ? <ActivityIndicator color="#FFF" /> : (<><MaterialIcons name="check-circle" size={20} color="#FFF" /><Text style={styles.actionBtnText}>{t.acceptTrip}</Text></>)}
          </Pressable>
        </Animated.View>
      ) : null}

      {isMyTrip && (trip.status === 'accepted' || trip.status === 'agreed' || trip.status === 'confirmed') ? (
        <Animated.View entering={FadeInUp.duration(400)} style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.actionRow}>
            <Pressable onPress={handleCancel} style={[styles.actionBtn, styles.cancelBtn, { flex: 1 }]}><MaterialIcons name="cancel" size={20} color={theme.error} /><Text style={[styles.actionBtnText, { color: theme.error }]}>{t.cancel}</Text></Pressable>
            <Pressable onPress={handleStart} style={[styles.actionBtn, styles.startBtn, { flex: 2 }]}><MaterialIcons name="play-arrow" size={22} color="#FFF" /><Text style={styles.actionBtnText}>{t.startTrip}</Text></Pressable>
          </View>
        </Animated.View>
      ) : null}

      {isMyTrip && trip.status === 'inProgress' ? (
        <Animated.View entering={FadeInUp.duration(400)} style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable onPress={handleComplete} style={[styles.actionBtn, styles.completeBtn]}><MaterialIcons name="flag" size={22} color="#FFF" /><Text style={styles.actionBtnText}>{t.endTrip}</Text></Pressable>
        </Animated.View>
      ) : null}

      {trip.status === 'completed' ? (
        <Animated.View entering={FadeInUp.duration(400)} style={[styles.completedBanner, { paddingBottom: insets.bottom + 16 }]}>
          <MaterialIcons name="check-circle" size={24} color={theme.success} /><Text style={styles.completedText}>تم إكمال المشوار بنجاح</Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  headerTripNum: { fontSize: 12, fontWeight: '700', color: theme.primary, marginTop: 2 },
  mapIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary + '12', alignItems: 'center', justifyContent: 'center' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginHorizontal: 20, marginTop: 20, borderRadius: theme.radiusMedium },
  statusIndicator: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 16, fontWeight: '700' },
  applicationBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 10, padding: 14, backgroundColor: '#FEF3C7', borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: '#FCD34D' },
  applicationBannerTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', writingDirection: 'rtl', textAlign: 'right' },
  applicationBannerDesc: { fontSize: 12, fontWeight: '500', color: '#A16207', writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  clientInfoCard: { marginHorizontal: 20, marginTop: 16, padding: 20, backgroundColor: theme.success + '15', borderRadius: theme.radiusLarge, borderWidth: 1.5, borderColor: theme.success + '30' },
  clientInfoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  clientInfoTitle: { ...typography.subtitle, color: '#065F46', writingDirection: 'rtl' },
  infoDivider: { height: 1, backgroundColor: theme.success + '30', marginVertical: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  infoLabel: { fontSize: 13, fontWeight: '500', color: theme.textMuted, writingDirection: 'rtl' },
  infoValue: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right', maxWidth: '60%' },
  hiddenInfoNotice: { alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 20, padding: 28, backgroundColor: theme.surfaceElevated, borderRadius: theme.radiusLarge, borderWidth: 1.5, borderColor: theme.border },
  hiddenInfoText: { ...typography.body, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'center', lineHeight: 24 },
  applicantsInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 16, marginTop: 10, paddingVertical: 10, backgroundColor: theme.primary + '08', borderRadius: theme.radiusMedium },
  applicantsText: { fontSize: 13, fontWeight: '600', color: theme.primary, writingDirection: 'rtl' },
  typeCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: 20, marginTop: 20, padding: 20, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  typeIconLarge: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  typeName: { ...typography.subtitle, writingDirection: 'rtl', textAlign: 'right' },
  typeDate: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 4 },
  routeCard: { marginHorizontal: 20, marginTop: 14, padding: 20, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  cardTitle: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right', marginBottom: 16 },
  routeContainer: { flexDirection: 'row', gap: 12 },
  routeTimeline: { alignItems: 'center' },
  routeCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  routeDashLine: { width: 2, height: 40, backgroundColor: theme.border },
  routeDetails: { flex: 1, gap: 20 },
  routePointDetail: { gap: 2 },
  routePointLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right' },
  routePointAddress: { ...typography.body, writingDirection: 'rtl', textAlign: 'right', fontWeight: '500' },
  priceCard: { marginHorizontal: 20, marginTop: 14, padding: 20, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border, marginBottom: 20 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  priceLabel: { ...typography.body, writingDirection: 'rtl' },
  priceValue: { ...typography.bodyBold },
  detailDivider: { height: 1, backgroundColor: theme.borderLight },
  totalRow: { backgroundColor: theme.success + '15', marginHorizontal: -16, marginBottom: -16, paddingHorizontal: 16, paddingVertical: 14, borderBottomLeftRadius: theme.radiusLarge, borderBottomRightRadius: theme.radiusLarge },
  totalLabel: { fontSize: 16, fontWeight: '700', color: theme.success, writingDirection: 'rtl' },
  totalValue: { fontSize: 20, fontWeight: '700', color: theme.success },
  bottomActions: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: theme.radiusMedium },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  applyBtn: { backgroundColor: theme.primary },
  startBtn: { backgroundColor: theme.statusInProgress },
  completeBtn: { backgroundColor: theme.success },
  cancelBtn: { backgroundColor: theme.errorLight, borderWidth: 1.5, borderColor: theme.error },
  completedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 16, paddingHorizontal: 16, backgroundColor: theme.success + '15', borderTopWidth: 1, borderTopColor: theme.success + '30' },
  completedText: { fontSize: 16, fontWeight: '600', color: theme.success, writingDirection: 'rtl' },
  errorText: { ...typography.subtitle, textAlign: 'center', marginTop: 16, writingDirection: 'rtl' },
  backBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: theme.primary, borderRadius: theme.radiusMedium },
  backBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
