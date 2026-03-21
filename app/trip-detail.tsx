import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Platform, Modal, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAlert } from '@/template';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { getTripTypeIcon, getStatusColor, formatTripNumber } from '../services/types';
import { useLanguage } from '../contexts/LanguageContext';
import { config } from '../constants/config';
import TripTimeline from '../components/feature/TripTimeline';
import { RoutePreview } from '../components/maps/RoutePreview';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const {
    getTripById, startTrip, completeTrip, cancelTrip, profile,
    applyForTrip, withdrawApplication, getMyApplication, getApplicationsForTrip,
    acceptTripDirectly, requestPriceIncrease,
  } = useApp();
  const { user, userRole } = useAuth();
  const { t, tripStatus, tripType } = useLanguage();
  const trip = getTripById(id || '');
  const [accepting, setAccepting] = useState(false);
  const [increaseModal, setIncreaseModal] = useState(false);
  const [increaseAmount, setIncreaseAmount] = useState('150');
  const [requestingIncrease, setRequestingIncrease] = useState(false);

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
  const isMonthly = trip.type === 'monthly' || trip.type === 'private';
  const hasIncreaseRequest = trip.proposed_increase && trip.proposed_increase > 0;
  const increaseFullyApproved = trip.increase_client_approval === 'approved' && trip.increase_admin_approval === 'approved';
  const increaseRejected = trip.increase_client_approval === 'rejected' || trip.increase_admin_approval === 'rejected';
  const hasHomeWork = trip.pickup_lat && trip.pickup_lng && trip.dropoff_lat && trip.dropoff_lng;

  const handleRequestTrip = async () => {
    showAlert('طلب الموافقة', `سيتم إرسال طلبك للإدارة/العميل للموافقة عليه.\n${t.netEarning}: ${driverEarning.toFixed(0)} ${t.currency}`, [
      { text: t.cancel, style: 'cancel' },
      { text: 'تقديم طلب', onPress: async () => {
        setAccepting(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const result = await acceptTripDirectly(trip.id);
        setAccepting(false);
        if (result.error) { showAlert(t.error, result.error); }
        else { showAlert('تم تقديم الطلب', 'سيتم إشعارك عند موافقة الإدارة أو العميل على طلبك.'); }
      }},
    ]);
  };

  const handleRequestIncrease = async () => {
    const amt = parseInt(increaseAmount);
    if (isNaN(amt) || amt < 100 || amt > 200) {
      showAlert('خطأ', 'يجب أن تكون الزيادة بين 100 و 200 ريال');
      return;
    }
    setRequestingIncrease(true);
    const result = await requestPriceIncrease(trip.id, amt);
    setRequestingIncrease(false);
    setIncreaseModal(false);
    if (result.error) showAlert('خطأ', result.error);
    else showAlert('تم إرسال الطلب', `تم إرسال طلب زيادة ${amt} ر.س للعميل والإدارة للموافقة.`);
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
        {(trip.status === 'inProgress' || trip.status === 'accepted' || trip.status === 'confirmed') ? (
          <Pressable onPress={() => router.push({ pathname: '/live-tracking', params: { id: trip.id } })} style={[styles.mapIconBtn, { backgroundColor: theme.success + '15' }]}>
            <MaterialIcons name="gps-fixed" size={22} color={theme.success} />
          </Pressable>
        ) : null}
      </Animated.View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 140 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={[styles.statusBanner, { backgroundColor: statusColor + '12' }]}>
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusLabel, { color: statusColor }]}>{tripStatus(trip.status)}</Text>
        </Animated.View>

        {(userRole === 'client' || trip.status === 'completed' || trip.status === 'cancelled') ? (
          <Animated.View entering={FadeInDown.duration(400).delay(110)}>
            <TripTimeline status={trip.status} createdAt={trip.created_at} updatedAt={trip.updated_at} completedAt={trip.completed_at} />
          </Animated.View>
        ) : null}

        {isDriver && trip.status === 'available' && hasApplied ? (
          <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.applicationBanner}>
            <MaterialIcons name="hourglass-top" size={20} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.applicationBannerTitle}>{t.applicationSent}</Text>
              <Text style={styles.applicationBannerDesc}>{t.applicationWaiting}</Text>
            </View>
          </Animated.View>
        ) : null}

        {/* ===== SUBSCRIPTION DETAIL CARD (Driver View) ===== */}
        {isDriver && isMonthly && (isAssigned || isConfirmed || trip.status === 'available') ? (
          <Animated.View entering={FadeInDown.duration(400).delay(130)} style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <MaterialIcons name="event-repeat" size={22} color={theme.primary} />
              <Text style={styles.subscriptionTitle}>تفاصيل الاشتراك الشهري</Text>
            </View>

            {/* Locations info */}
            <View style={styles.subInfoGrid}>
              <View style={styles.subInfoItem}>
                <MaterialIcons name="home" size={18} color={theme.success} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.subInfoLabel}>البيت</Text>
                  <Text style={styles.subInfoValue} numberOfLines={2}>{trip.home_location || trip.pickup_location}</Text>
                </View>
              </View>
              <View style={styles.subInfoItem}>
                <MaterialIcons name="work" size={18} color={theme.error} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.subInfoLabel}>العمل</Text>
                  <Text style={styles.subInfoValue} numberOfLines={2}>{trip.work_location || trip.dropoff_location}</Text>
                </View>
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.subStatsRow}>
              <View style={styles.subStatBox}>
                <MaterialIcons name="people" size={20} color="#3B82F6" />
                <Text style={styles.subStatValue}>{trip.passengers || 1}</Text>
                <Text style={styles.subStatLabel}>ركاب</Text>
              </View>
              <View style={styles.subStatBox}>
                <MaterialIcons name={trip.passenger_gender === 'female' ? 'female' : 'male'} size={20} color={trip.passenger_gender === 'female' ? '#EC4899' : '#3B82F6'} />
                <Text style={styles.subStatValue}>{trip.passenger_gender === 'female' ? 'إناث' : 'ذكور'}</Text>
                <Text style={styles.subStatLabel}>الجنس</Text>
              </View>
              <View style={styles.subStatBox}>
                <MaterialIcons name="date-range" size={20} color={theme.accent} />
                <Text style={styles.subStatValue}>{trip.work_days ? trip.work_days.split(',').length : 0}</Text>
                <Text style={styles.subStatLabel}>أيام/أسبوع</Text>
              </View>
            </View>

            {/* Work days */}
            {trip.work_days ? (
              <View style={styles.subWorkDays}>
                <Text style={styles.subWorkDaysLabel}>أيام العمل:</Text>
                <Text style={styles.subWorkDaysValue}>{trip.work_days}</Text>
              </View>
            ) : null}

            {/* Times */}
            <View style={styles.subTimesRow}>
              {trip.departure_time ? (
                <View style={styles.subTimeBox}>
                  <MaterialIcons name="wb-sunny" size={16} color="#F59E0B" />
                  <Text style={styles.subTimeLabel}>ذهاب</Text>
                  <Text style={styles.subTimeValue}>{trip.departure_time}</Text>
                </View>
              ) : null}
              {trip.return_time ? (
                <View style={styles.subTimeBox}>
                  <MaterialIcons name="nights-stay" size={16} color="#8B5CF6" />
                  <Text style={styles.subTimeLabel}>عودة</Text>
                  <Text style={styles.subTimeValue}>{trip.return_time}</Text>
                </View>
              ) : null}
            </View>

            {/* Multi-passenger data */}
            {trip.passengers_data && trip.passengers_data.length > 1 ? (
              <View style={styles.subPassengersSection}>
                <Text style={styles.subPassengersTitle}>مواقع الركاب ({trip.passengers_data.length})</Text>
                {trip.passengers_data.map((p: any, i: number) => (
                  <View key={i} style={styles.subPassengerItem}>
                    <View style={[styles.subPassengerNum, { backgroundColor: theme.accent + '20' }]}>
                      <Text style={[styles.subPassengerNumText, { color: theme.accent }]}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subPassengerName}>{p.name || `راكب ${i + 1}`}</Text>
                      <Text style={styles.subPassengerAddr}>🏠 {p.home?.address || 'غير محدد'}</Text>
                      <Text style={styles.subPassengerAddr}>🏢 {p.work?.address || 'غير محدد'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Client info for confirmed */}
            {isConfirmed ? (
              <View style={styles.subClientSection}>
                <View style={styles.subClientHeader}>
                  <MaterialIcons name="verified" size={18} color={theme.success} />
                  <Text style={styles.subClientTitle}>بيانات العميل</Text>
                </View>
                {trip.client_name ? <Text style={styles.subClientInfo}>الاسم: {trip.client_name}</Text> : null}
                {trip.client_phone ? <Text style={[styles.subClientInfo, { color: theme.accent }]}>الجوال: {trip.client_phone}</Text> : null}
                {trip.city ? <Text style={styles.subClientInfo}>المدينة: {trip.city}</Text> : null}
              </View>
            ) : null}
          </Animated.View>
        ) : null}

        {/* Route Preview Map — show for all trips with coordinates */}
        {hasHomeWork && (isDriver || userRole === 'client' || userRole === 'admin' || userRole === 'supervisor') ? (
          <Animated.View entering={FadeInDown.duration(400).delay(160)} style={{ marginHorizontal: 20 }}>
            <RoutePreview
              home={{ address: trip.home_location || trip.pickup_location, lat: trip.pickup_lat!, lng: trip.pickup_lng! }}
              work={{ address: trip.work_location || trip.dropoff_location, lat: trip.dropoff_lat!, lng: trip.dropoff_lng! }}
            />
          </Animated.View>
        ) : null}

        {/* Price Increase Status Banner */}
        {hasIncreaseRequest && !increaseFullyApproved && !increaseRejected ? (
          <Animated.View entering={FadeInDown.duration(400).delay(170)} style={styles.increaseBanner}>
            <MaterialIcons name="trending-up" size={20} color="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.increaseBannerTitle}>طلب زيادة سعر: +{trip.proposed_increase} ر.س</Text>
              <View style={styles.increaseApprovalRow}>
                <View style={styles.increaseApprovalItem}>
                  <MaterialIcons name={trip.increase_client_approval === 'approved' ? 'check-circle' : 'hourglass-top'} size={14} color={trip.increase_client_approval === 'approved' ? theme.success : '#F59E0B'} />
                  <Text style={styles.increaseApprovalText}>العميل: {trip.increase_client_approval === 'approved' ? 'وافق' : 'بانتظار'}</Text>
                </View>
                <View style={styles.increaseApprovalItem}>
                  <MaterialIcons name={trip.increase_admin_approval === 'approved' ? 'check-circle' : 'hourglass-top'} size={14} color={trip.increase_admin_approval === 'approved' ? theme.success : '#F59E0B'} />
                  <Text style={styles.increaseApprovalText}>الإدارة: {trip.increase_admin_approval === 'approved' ? 'وافقت' : 'بانتظار'}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ) : null}

        {hasIncreaseRequest && increaseFullyApproved ? (
          <Animated.View entering={FadeInDown.duration(400).delay(170)} style={[styles.increaseBanner, { backgroundColor: theme.success + '12', borderColor: theme.success + '30' }]}>
            <MaterialIcons name="check-circle" size={20} color={theme.success} />
            <Text style={[styles.increaseBannerTitle, { color: theme.success }]}>تمت الموافقة على زيادة +{trip.proposed_increase} ر.س</Text>
          </Animated.View>
        ) : null}

        {hasIncreaseRequest && increaseRejected ? (
          <Animated.View entering={FadeInDown.duration(400).delay(170)} style={[styles.increaseBanner, { backgroundColor: theme.error + '08', borderColor: theme.error + '30' }]}>
            <MaterialIcons name="cancel" size={20} color={theme.error} />
            <Text style={[styles.increaseBannerTitle, { color: theme.error }]}>تم رفض طلب الزيادة ({trip.proposed_increase} ر.س)</Text>
          </Animated.View>
        ) : null}

        {/* Non-assigned view - type + route (for trips without map coords) */}
        {!isAssigned && !(isDriver && isMonthly) && !hasHomeWork ? (
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

        {/* Client info for confirmed non-subscription */}
        {isConfirmed && !isMonthly ? (
          <Animated.View entering={FadeInDown.duration(400).delay(130)} style={styles.clientInfoCard}>
            <View style={styles.clientInfoHeader}>
              <MaterialIcons name="verified" size={22} color={theme.success} />
              <Text style={styles.clientInfoTitle}>{t.clientInfo}</Text>
            </View>
            <View style={styles.infoDivider} />
            {trip.client_name ? <View style={styles.infoRow}><Text style={styles.infoLabel}>الاسم</Text><Text style={styles.infoValue}>{trip.client_name}</Text></View> : null}
            {trip.client_phone ? <View style={styles.infoRow}><Text style={styles.infoLabel}>رقم الجوال</Text><Text style={[styles.infoValue, { color: theme.accent }]}>{trip.client_phone}</Text></View> : null}
          </Animated.View>
        ) : null}

        {isAssigned && !isConfirmed && !isMonthly ? (
          <Animated.View entering={FadeInDown.duration(400).delay(130)} style={styles.hiddenInfoNotice}>
            <MaterialIcons name="lock" size={32} color={theme.textMuted} />
            <Text style={styles.hiddenInfoText}>{t.clientInfoHidden}{"\n"}{t.clientInfoAfterApproval}</Text>
          </Animated.View>
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
          <View style={styles.priceRow}><Text style={styles.priceLabel}>{isMonthly ? 'الاشتراك الشهري' : t.tripFare}</Text><Text style={styles.priceValue}>{trip.price} {t.currency}</Text></View>
          <View style={styles.detailDivider} />
          <View style={styles.priceRow}><Text style={styles.priceLabel}>{t.platformCommission}</Text><Text style={[styles.priceValue, { color: theme.error }]}>-{commission.toFixed(0)} {t.currency}</Text></View>
          <View style={styles.detailDivider} />
          <View style={[styles.priceRow, styles.totalRow]}><Text style={styles.totalLabel}>{t.driverEarning}</Text><Text style={styles.totalValue}>{driverEarning.toFixed(0)} {t.currency}</Text></View>
        </Animated.View>
      </ScrollView>

      {/* Bottom actions */}
      {isDriver && trip.status === 'available' && !hasApplied ? (
        <Animated.View entering={FadeInUp.duration(400)} style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable onPress={handleRequestTrip} disabled={accepting} style={[styles.actionBtn, styles.applyBtn, accepting && { opacity: 0.6 }]}>
            {accepting ? <ActivityIndicator color="#FFF" /> : (<><MaterialIcons name="send" size={20} color="#FFF" /><Text style={styles.actionBtnText}>طلب الموافقة على المشوار</Text></>)}
          </Pressable>
        </Animated.View>
      ) : null}

      {isDriver && trip.status === 'available' && hasApplied ? (
        <Animated.View entering={FadeInUp.duration(400)} style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.actionBtn, { backgroundColor: theme.warning + '20', borderWidth: 1.5, borderColor: theme.warning + '40' }]}>
            <MaterialIcons name="hourglass-top" size={20} color={theme.warning} />
            <Text style={[styles.actionBtnText, { color: theme.warning }]}>بانتظار موافقة الإدارة</Text>
          </View>
        </Animated.View>
      ) : null}

      {isMyTrip && (trip.status === 'accepted' || trip.status === 'agreed' || trip.status === 'confirmed') ? (
        <Animated.View entering={FadeInUp.duration(400)} style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
          {/* Price Increase button for driver on monthly */}
          {isMonthly && !hasIncreaseRequest ? (
            <Pressable onPress={() => setIncreaseModal(true)} style={styles.increaseBtn}>
              <MaterialIcons name="trending-up" size={18} color={theme.accent} />
              <Text style={styles.increaseBtnText}>طلب زيادة سعر</Text>
            </Pressable>
          ) : null}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <MaterialIcons name="check-circle" size={24} color={theme.success} /><Text style={styles.completedText}>تم إكمال المشوار بنجاح</Text>
          </View>
          <Pressable onPress={() => router.push({ pathname: '/rate-trip', params: { id: trip.id } })} style={styles.rateBtn}>
            <MaterialIcons name="star" size={20} color="#FFF" />
            <Text style={styles.rateBtnText}>قيّم المشوار</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      {/* Price Increase Modal */}
      <Modal visible={increaseModal} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setIncreaseModal(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <MaterialIcons name="trending-up" size={24} color={theme.accent} />
              <Text style={styles.modalTitle}>طلب زيادة سعر</Text>
            </View>
            <Text style={styles.modalDesc}>حدد مبلغ الزيادة المطلوب (100 - 200 ريال). سيتم إرسال الطلب للعميل والإدارة للموافقة.</Text>

            <Text style={styles.modalLabel}>مبلغ الزيادة (ر.س)</Text>
            <TextInput
              value={increaseAmount}
              onChangeText={setIncreaseAmount}
              keyboardType="number-pad"
              style={styles.modalInput}
              textAlign="center"
              placeholder="150"
              placeholderTextColor={theme.textMuted}
            />

            <View style={styles.modalSliderRow}>
              {[100, 125, 150, 175, 200].map(v => (
                <Pressable key={v} onPress={() => setIncreaseAmount(String(v))} style={[styles.modalQuickBtn, increaseAmount === String(v) && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                  <Text style={[styles.modalQuickText, increaseAmount === String(v) && { color: '#FFF' }]}>{v}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalPricePreview}>
              <Text style={styles.modalPriceLabel}>السعر الحالي: {trip.price} ر.س</Text>
              <Text style={styles.modalPriceNew}>السعر الجديد: {trip.price + (parseInt(increaseAmount) || 0)} ر.س</Text>
            </View>

            <Pressable onPress={handleRequestIncrease} disabled={requestingIncrease} style={[styles.modalSubmitBtn, requestingIncrease && { opacity: 0.6 }]}>
              {requestingIncrease ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <MaterialIcons name="send" size={18} color="#FFF" />
                  <Text style={styles.modalSubmitText}>إرسال طلب الزيادة</Text>
                </>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' as const },
  headerTripNum: { fontSize: 12, fontWeight: '700', color: theme.primary, marginTop: 2 },
  mapIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary + '12', alignItems: 'center', justifyContent: 'center' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginHorizontal: 20, marginTop: 20, borderRadius: theme.radiusMedium },
  statusIndicator: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 16, fontWeight: '700' },
  applicationBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 10, padding: 14, backgroundColor: '#FEF3C7', borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: '#FCD34D' },
  applicationBannerTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', writingDirection: 'rtl' as const, textAlign: 'right' },
  applicationBannerDesc: { fontSize: 12, fontWeight: '500', color: '#A16207', writingDirection: 'rtl' as const, textAlign: 'right', marginTop: 2 },

  // Subscription detail card
  subscriptionCard: { marginHorizontal: 20, marginTop: 16, padding: 20, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1.5, borderColor: theme.primary + '25' },
  subscriptionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  subscriptionTitle: { fontSize: 16, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' as const },
  subInfoGrid: { gap: 12, marginBottom: 16 },
  subInfoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: theme.surfaceElevated, borderRadius: theme.radiusMedium },
  subInfoLabel: { fontSize: 11, fontWeight: '700', color: theme.textMuted, writingDirection: 'rtl' as const, textAlign: 'right' },
  subInfoValue: { fontSize: 13, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' as const, textAlign: 'right', marginTop: 2 },
  subStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  subStatBox: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, backgroundColor: theme.surfaceElevated, borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: theme.border },
  subStatValue: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },
  subStatLabel: { fontSize: 10, fontWeight: '600', color: theme.textMuted },
  subWorkDays: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: theme.primary + '08', borderRadius: theme.radiusMedium },
  subWorkDaysLabel: { fontSize: 12, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' as const },
  subWorkDaysValue: { flex: 1, fontSize: 12, fontWeight: '600', color: theme.textSecondary, writingDirection: 'rtl' as const, textAlign: 'right' },
  subTimesRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  subTimeBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: theme.surfaceElevated, borderRadius: theme.radiusMedium },
  subTimeLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted },
  subTimeValue: { fontSize: 13, fontWeight: '700', color: theme.textPrimary },
  subPassengersSection: { marginTop: 4 },
  subPassengersTitle: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' as const, textAlign: 'right', marginBottom: 10 },
  subPassengerItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: theme.surfaceElevated, borderRadius: theme.radiusMedium },
  subPassengerNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  subPassengerNumText: { fontSize: 12, fontWeight: '700' },
  subPassengerName: { fontSize: 13, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' as const, textAlign: 'right' },
  subPassengerAddr: { fontSize: 11, color: theme.textSecondary, writingDirection: 'rtl' as const, textAlign: 'right', marginTop: 2 },
  subClientSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border },
  subClientHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  subClientTitle: { fontSize: 14, fontWeight: '700', color: theme.success, writingDirection: 'rtl' as const },
  subClientInfo: { fontSize: 13, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' as const, textAlign: 'right', marginBottom: 4 },

  // Price increase banner
  increaseBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 12, padding: 14, backgroundColor: '#FEF3C7', borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: '#FCD34D' },
  increaseBannerTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', writingDirection: 'rtl' as const, textAlign: 'right' },
  increaseApprovalRow: { flexDirection: 'row', gap: 16, marginTop: 6 },
  increaseApprovalItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  increaseApprovalText: { fontSize: 11, fontWeight: '600', color: '#78350F' },
  increaseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, marginBottom: 10, borderRadius: theme.radiusMedium, backgroundColor: theme.accent + '12', borderWidth: 1.5, borderColor: theme.accent + '30' },
  increaseBtnText: { fontSize: 14, fontWeight: '700', color: theme.accent },

  clientInfoCard: { marginHorizontal: 20, marginTop: 16, padding: 20, backgroundColor: theme.success + '15', borderRadius: theme.radiusLarge, borderWidth: 1.5, borderColor: theme.success + '30' },
  clientInfoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  clientInfoTitle: { ...typography.subtitle, color: '#065F46', writingDirection: 'rtl' as const },
  infoDivider: { height: 1, backgroundColor: theme.success + '30', marginVertical: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  infoLabel: { fontSize: 13, fontWeight: '500', color: theme.textMuted, writingDirection: 'rtl' as const },
  infoValue: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' as const, textAlign: 'right', maxWidth: '60%' },
  hiddenInfoNotice: { alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 20, padding: 28, backgroundColor: theme.surfaceElevated, borderRadius: theme.radiusLarge, borderWidth: 1.5, borderColor: theme.border },
  hiddenInfoText: { ...typography.body, color: theme.textMuted, writingDirection: 'rtl' as const, textAlign: 'center', lineHeight: 24 },
  applicantsInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 16, marginTop: 10, paddingVertical: 10, backgroundColor: theme.primary + '08', borderRadius: theme.radiusMedium },
  applicantsText: { fontSize: 13, fontWeight: '600', color: theme.primary, writingDirection: 'rtl' as const },
  typeCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: 20, marginTop: 20, padding: 20, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  typeIconLarge: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  typeName: { ...typography.subtitle, writingDirection: 'rtl' as const, textAlign: 'right' },
  typeDate: { ...typography.caption, writingDirection: 'rtl' as const, textAlign: 'right', marginTop: 4 },
  routeCard: { marginHorizontal: 20, marginTop: 14, padding: 20, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  cardTitle: { ...typography.cardTitle, writingDirection: 'rtl' as const, textAlign: 'right', marginBottom: 16 },
  routeContainer: { flexDirection: 'row', gap: 12 },
  routeTimeline: { alignItems: 'center' },
  routeCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  routeDashLine: { width: 2, height: 40, backgroundColor: theme.border },
  routeDetails: { flex: 1, gap: 20 },
  routePointDetail: { gap: 2 },
  routePointLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl' as const, textAlign: 'right' },
  routePointAddress: { ...typography.body, writingDirection: 'rtl' as const, textAlign: 'right', fontWeight: '500' },
  priceCard: { marginHorizontal: 20, marginTop: 14, padding: 20, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border, marginBottom: 20 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  priceLabel: { ...typography.body, writingDirection: 'rtl' as const },
  priceValue: { ...typography.bodyBold },
  detailDivider: { height: 1, backgroundColor: theme.borderLight },
  totalRow: { backgroundColor: theme.success + '15', marginHorizontal: -16, marginBottom: -16, paddingHorizontal: 16, paddingVertical: 14, borderBottomLeftRadius: theme.radiusLarge, borderBottomRightRadius: theme.radiusLarge },
  totalLabel: { fontSize: 16, fontWeight: '700', color: theme.success, writingDirection: 'rtl' as const },
  totalValue: { fontSize: 20, fontWeight: '700', color: theme.success },
  bottomActions: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: theme.radiusMedium },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  applyBtn: { backgroundColor: theme.primary },
  startBtn: { backgroundColor: theme.statusInProgress },
  completeBtn: { backgroundColor: theme.success },
  cancelBtn: { backgroundColor: theme.errorLight, borderWidth: 1.5, borderColor: theme.error },
  completedBanner: { alignItems: 'center', paddingTop: 16, paddingHorizontal: 16, backgroundColor: theme.success + '15', borderTopWidth: 1, borderTopColor: theme.success + '30' },
  completedText: { fontSize: 16, fontWeight: '600', color: theme.success, writingDirection: 'rtl' as const },
  rateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FBBF24', paddingVertical: 14, paddingHorizontal: 32, borderRadius: theme.radiusMedium },
  rateBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  errorText: { ...typography.subtitle, textAlign: 'center', marginTop: 16, writingDirection: 'rtl' as const },
  backBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: theme.primary, borderRadius: theme.radiusMedium },
  backBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 32 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' as const },
  modalDesc: { fontSize: 13, color: theme.textSecondary, writingDirection: 'rtl' as const, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalLabel: { fontSize: 13, fontWeight: '700', color: theme.textMuted, writingDirection: 'rtl' as const, textAlign: 'right', marginBottom: 8 },
  modalInput: { backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border, borderRadius: theme.radiusMedium, paddingVertical: 16, fontSize: 28, fontWeight: '700', color: theme.accent },
  modalSliderRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 20 },
  modalQuickBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: theme.radiusMedium, backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border },
  modalQuickText: { fontSize: 14, fontWeight: '700', color: theme.textSecondary },
  modalPricePreview: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: theme.surfaceElevated, borderRadius: theme.radiusMedium, marginBottom: 20 },
  modalPriceLabel: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  modalPriceNew: { fontSize: 14, fontWeight: '700', color: theme.accent },
  modalSubmitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: theme.radiusMedium, backgroundColor: theme.accent },
  modalSubmitText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
