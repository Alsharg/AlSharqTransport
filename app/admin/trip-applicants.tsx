import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { config } from '../../constants/config';
import { TripApplication } from '../../services/types';

export default function TripApplicantsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const {
    getTripById, getApplicationsForTrip, assignDriverToTrip,
    allDriversList, loadApplications, loadTrips,
  } = useApp();

  const trip = getTripById(tripId || '');
  const applications = getApplicationsForTrip(tripId || '');
  const pendingApps = applications.filter(a => a.status === 'pending');
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  if (!trip) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialIcons name="error-outline" size={64} color={theme.border} />
        <Text style={styles.errorText}>المشوار غير موجود</Text>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}><Text style={styles.goBackText}>رجوع</Text></Pressable>
      </SafeAreaView>
    );
  }

  const getDriverInfo = (driverId: string) => {
    return allDriversList.find(d => d.id === driverId);
  };

  const handleAssign = (app: TripApplication) => {
    const driver = getDriverInfo(app.driver_id);
    const driverName = driver?.full_name || app.driver_name || 'السائق';
    const commission = (trip.price * config.platformCommissionRate).toFixed(0);
    const driverEarning = (trip.price * config.driverShareRate).toFixed(0);

    showAlert(
      'تعيين السائق',
      `تعيين ${driverName} لهذا المشوار؟\n\nسيتم إشعاره بالتفاصيل:\n• العمولة: ${commission} ر.س\n• صافي ربحه: ${driverEarning} ر.س`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تعيين',
          onPress: async () => {
            setAssigning(app.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const result = await assignDriverToTrip(trip.id, app.driver_id, app.id);
            setAssigning(null);
            if (result.error) {
              showAlert('خطأ', result.error);
            } else {
              await loadTrips();
              await loadApplications();
              showAlert('تم التعيين', `تم تعيين ${driverName} لهذا المشوار وتم إشعاره بالتفاصيل والعمولة.`, [
                { text: 'حسناً', onPress: () => router.back() },
              ]);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>طلبات السائقين</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {/* Trip Summary */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.tripSummary}>
          <View style={styles.tripSummaryRow}>
            <MaterialIcons name="route" size={20} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tripSummaryText}>{trip.pickup_location}</Text>
              <Text style={styles.tripSummaryArrow}>↓</Text>
              <Text style={styles.tripSummaryText}>{trip.dropoff_location}</Text>
            </View>
            <View style={styles.tripSummaryPrice}>
              <Text style={styles.priceAmount}>{trip.price}</Text>
              <Text style={styles.priceCurrency}>ر.س</Text>
            </View>
          </View>
          <View style={styles.tripSummaryMeta}>
            <Text style={styles.metaText}>{trip.scheduled_date} - {trip.scheduled_time}</Text>
            <Text style={styles.metaText}>عمولة المنصة: {(trip.price * config.platformCommissionRate).toFixed(0)} ر.س</Text>
          </View>
        </Animated.View>

        {/* Status Summary */}
        <Animated.View entering={FadeInDown.duration(300).delay(50)} style={styles.statusSummary}>
          <View style={[styles.statusItem, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.statusCount, { color: '#D97706' }]}>{pendingApps.length}</Text>
            <Text style={styles.statusItemLabel}>بانتظار المراجعة</Text>
          </View>
          <View style={[styles.statusItem, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.statusCount, { color: theme.success }]}>{applications.filter(a => a.status === 'accepted').length}</Text>
            <Text style={styles.statusItemLabel}>مقبول</Text>
          </View>
          <View style={[styles.statusItem, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.statusCount, { color: theme.error }]}>{applications.filter(a => a.status === 'rejected').length}</Text>
            <Text style={styles.statusItemLabel}>مرفوض</Text>
          </View>
        </Animated.View>

        {trip.status !== 'available' ? (
          <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.assignedNote}>
            <MaterialIcons name="info" size={18} color={theme.primary} />
            <Text style={styles.assignedNoteText}>تم تعيين سائق لهذا المشوار بالفعل</Text>
          </Animated.View>
        ) : null}

        {/* Applicant Cards */}
        <Text style={styles.sectionTitle}>السائقون المتقدمون ({applications.length})</Text>

        {applications.map((app, index) => {
          const driver = getDriverInfo(app.driver_id);
          const isPending = app.status === 'pending';
          const isAccepted = app.status === 'accepted';
          const isRejected = app.status === 'rejected';

          return (
            <Animated.View key={app.id} entering={FadeInDown.duration(300).delay(150 + index * 60)}>
              <View style={[styles.applicantCard, isAccepted && styles.acceptedCard, isRejected && styles.rejectedCard]}>
                <View style={styles.applicantTop}>
                  <View style={[styles.avatarCircle, { backgroundColor: isAccepted ? '#D1FAE5' : isPending ? theme.primary + '15' : '#FEE2E2' }]}>
                    <MaterialIcons name="person" size={24} color={isAccepted ? theme.success : isPending ? theme.primary : theme.error} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.applicantName}>{driver?.full_name || app.driver_name || 'سائق'}</Text>
                    <Text style={styles.applicantEmail}>{driver?.email || driver?.phone || ''}</Text>
                  </View>
                  <View style={[styles.appStatusBadge, {
                    backgroundColor: isAccepted ? '#D1FAE5' : isPending ? '#FEF3C7' : '#FEE2E2',
                  }]}>
                    <Text style={[styles.appStatusText, {
                      color: isAccepted ? theme.success : isPending ? '#D97706' : theme.error,
                    }]}>
                      {isAccepted ? 'مقبول' : isPending ? 'بانتظار' : 'مرفوض'}
                    </Text>
                  </View>
                </View>

                {driver ? (
                  <View style={styles.driverStats}>
                    <View style={styles.driverStat}>
                      <MaterialIcons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.driverStatText}>{Number(driver.rating || 5).toFixed(1)}</Text>
                    </View>
                    <View style={styles.driverStat}>
                      <MaterialIcons name="route" size={14} color={theme.textMuted} />
                      <Text style={styles.driverStatText}>{driver.total_trips || 0} مشوار</Text>
                    </View>
                    <View style={styles.driverStat}>
                      <MaterialIcons name="directions-car" size={14} color={theme.textMuted} />
                      <Text style={styles.driverStatText}>{driver.vehicle_type || '-'}</Text>
                    </View>
                    <View style={styles.driverStat}>
                      <MaterialIcons name="verified" size={14} color={theme.textMuted} />
                      <Text style={styles.driverStatText}>مستوى {driver.level || 1}</Text>
                    </View>
                  </View>
                ) : null}

                <Text style={styles.applicationTime}>تقدم بتاريخ: {new Date(app.created_at).toLocaleDateString('ar-SA')} - {new Date(app.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</Text>

                {isPending && trip.status === 'available' ? (
                  <Pressable
                    onPress={() => handleAssign(app)}
                    disabled={assigning === app.id}
                    style={[styles.assignBtn, assigning === app.id && { opacity: 0.6 }]}
                  >
                    {assigning === app.id ? <ActivityIndicator color="#FFF" size="small" /> : (
                      <>
                        <MaterialIcons name="check-circle" size={18} color="#FFF" />
                        <Text style={styles.assignBtnText}>تعيين هذا السائق</Text>
                      </>
                    )}
                  </Pressable>
                ) : null}
              </View>
            </Animated.View>
          );
        })}

        {applications.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="people-outline" size={64} color={theme.border} />
            <Text style={styles.emptyTitle}>لا توجد طلبات بعد</Text>
            <Text style={styles.emptyDesc}>سيظهر هنا السائقون المتقدمون لهذا المشوار</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  tripSummary: { padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, ...theme.shadowElevated, marginBottom: 12 },
  tripSummaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tripSummaryText: { ...typography.body, writingDirection: 'rtl', textAlign: 'right', fontWeight: '500' },
  tripSummaryArrow: { textAlign: 'center', color: theme.textMuted, fontSize: 16, paddingVertical: 2 },
  tripSummaryPrice: { alignItems: 'center' },
  priceAmount: { fontSize: 24, fontWeight: '700', color: theme.accent },
  priceCurrency: { fontSize: 11, fontWeight: '600', color: theme.textMuted },
  tripSummaryMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.borderLight },
  metaText: { ...typography.caption, writingDirection: 'rtl' },
  statusSummary: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statusItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: theme.radiusMedium },
  statusCount: { fontSize: 22, fontWeight: '700' },
  statusItemLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, marginTop: 2, writingDirection: 'rtl' },
  assignedNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: theme.infoLight, borderRadius: theme.radiusMedium, marginBottom: 16 },
  assignedNoteText: { ...typography.caption, color: theme.info, fontWeight: '600', writingDirection: 'rtl' },
  sectionTitle: { ...typography.sectionHeader, writingDirection: 'rtl', textAlign: 'right', marginBottom: 12 },
  applicantCard: { marginBottom: 12, padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, ...theme.shadow },
  acceptedCard: { borderWidth: 1.5, borderColor: '#6EE7B7' },
  rejectedCard: { opacity: 0.6 },
  applicantTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  applicantName: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right' },
  applicantEmail: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  appStatusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radiusFull },
  appStatusText: { fontSize: 12, fontWeight: '700' },
  driverStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.borderLight, marginBottom: 8 },
  driverStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  driverStatText: { ...typography.caption },
  applicationTime: { fontSize: 11, fontWeight: '500', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginBottom: 10 },
  assignBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.success, paddingVertical: 14, borderRadius: theme.radiusMedium },
  assignBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { ...typography.subtitle, textAlign: 'center', marginTop: 16, writingDirection: 'rtl' },
  emptyDesc: { ...typography.caption, textAlign: 'center', marginTop: 6, writingDirection: 'rtl' },
  errorText: { ...typography.subtitle, textAlign: 'center', marginTop: 16, writingDirection: 'rtl' },
  goBackBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: theme.primary, borderRadius: theme.radiusMedium },
  goBackText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
