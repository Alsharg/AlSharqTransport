import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { Linking } from 'react-native';
import { theme, typography } from '../../../constants/theme';
import { useApp } from '../../../contexts/AppContext';
import { Trip, getTripTypeLabel, getTripTypeIcon, getStatusColor, getTripStatusLabel, formatTripNumber } from '../../../services/types';
import { ADMIN_WHATSAPP } from '../../../constants/i18n';

type TripFilter = 'all' | 'available' | 'accepted' | 'confirmed' | 'inProgress' | 'completed' | 'cancelled' | 'archived';

const FILTERS: { id: TripFilter; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'available', label: 'متاح' },
  { id: 'accepted', label: 'مقبول' },
  { id: 'confirmed', label: 'تم الاتفاق' },
  { id: 'inProgress', label: 'جارٍ' },
  { id: 'completed', label: 'مكتمل' },
  { id: 'cancelled', label: 'ملغي' },
  { id: 'archived', label: 'مؤرشف' },
];

export default function AdminTripsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { trips, deleteTrip, cancelTrip, archiveTrip, confirmTrip, allDriversList, getApplicationsForTrip, updateTrip: updateTripAction } = useApp();
  const [filter, setFilter] = useState<TripFilter>('all');
  const [statusMenuTripId, setStatusMenuTripId] = useState<string | null>(null);
  const [clientModal, setClientModal] = useState<Trip | null>(null);
  const [driverPickerTrip, setDriverPickerTrip] = useState<Trip | null>(null);

  const filtered = trips
    .filter(t => {
      if (filter === 'all') return t.status !== 'archived';
      if (filter === 'confirmed') return t.status === 'confirmed' || t.status === 'agreed';
      return t.status === filter;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getDriverName = (driverId?: string) => {
    if (!driverId) return 'غير محدد';
    const d = allDriversList.find(dr => dr.id === driverId);
    return d ? (d.full_name || d.username || 'غير محدد') : 'غير محدد';
  };

  const handleStatusAction = (trip: Trip, action: 'cancel' | 'confirmed' | 'archive' | 'delete') => {
    setStatusMenuTripId(null);
    switch (action) {
      case 'confirmed':
        if (trip.driver_id) {
          showAlert('تم الاتفاق', `سيتم تأكيد الاتفاق مع السائق ${getDriverName(trip.driver_id)} وإخفاء المشوار من باقي السائقين.`, [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'تأكيد', onPress: async () => {
              const result = await confirmTrip(trip.id, trip.driver_id!);
              if (!result.error) showAlert('تم', 'تم تأكيد الاتفاق بنجاح');
              else showAlert('خطأ', result.error);
            }},
          ]);
        } else {
          // No driver assigned yet — show driver picker
          setDriverPickerTrip(trip);
        }
        break;
      case 'cancel':
        showAlert('إلغاء المشوار', 'سيتم إلغاء المشوار وإخفاؤه من جميع السائقين.', [
          { text: 'تراجع', style: 'cancel' },
          { text: 'إلغاء', style: 'destructive', onPress: () => cancelTrip(trip.id) },
        ]);
        break;
      case 'archive':
        showAlert('أرشفة المشوار', 'سيتم نقل المشوار للأرشيف.', [
          { text: 'تراجع', style: 'cancel' },
          { text: 'أرشفة', onPress: () => archiveTrip(trip.id) },
        ]);
        break;
      case 'delete':
        showAlert('حذف نهائي', 'سيتم حذف المشوار نهائياً من قاعدة البيانات.', [
          { text: 'تراجع', style: 'cancel' },
          { text: 'حذف', style: 'destructive', onPress: () => deleteTrip(trip.id) },
        ]);
        break;
    }
  };

  const handlePickDriver = async (trip: Trip, driverId: string) => {
    setDriverPickerTrip(null);
    const result = await confirmTrip(trip.id, driverId);
    if (!result.error) showAlert('تم', 'تم تأكيد الاتفاق وتعيين السائق بنجاح');
    else showAlert('خطأ', result.error);
  };

  // Get active/approved drivers for picker
  const activeDrivers = allDriversList.filter(d => d.is_active && d.approval_status === 'approved');

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>إدارة المشاوير</Text>
        <Pressable onPress={() => router.push('/admin/trip-form')} style={styles.addBtn}>
          <MaterialIcons name="add" size={24} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(f => (
            <Pressable key={f.id} onPress={() => setFilter(f.id)} style={[styles.filterChip, filter === f.id && styles.filterActive]}>
              <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.countText}>{filtered.length} مشوار</Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>
        {filtered.map((trip, index) => {
          const statusColor = getStatusColor(trip.status);
          const apps = getApplicationsForTrip(trip.id);
          const pendingApps = apps.filter(a => a.status === 'pending').length;
          const tripNum = formatTripNumber(trip.trip_number);

          return (
            <Animated.View key={trip.id} entering={FadeInDown.duration(200).delay(index * 30)}>
              <View style={styles.tripCard}>
                {/* Header: trip number + type + price + status */}
                <View style={styles.tripTop}>
                  <View style={[styles.typeIcon, { backgroundColor: statusColor + '20' }]}>
                    <MaterialIcons name={getTripTypeIcon(trip.type) as any} size={20} color={statusColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.tripNameRow}>
                      {tripNum ? <View style={styles.tripNumberBadge}><Text style={styles.tripNumberText}>{tripNum}</Text></View> : null}
                      <Text style={styles.tripType}>{trip.city || getTripTypeLabel(trip.type)}</Text>
                    </View>
                    <Text style={styles.tripTime}>{trip.departure_time || trip.scheduled_time}{trip.return_time ? ` \u2194 ${trip.return_time}` : ''}</Text>
                  </View>
                  <View style={styles.tripRight}>
                    <Text style={styles.tripPrice}>{trip.price} ر.س</Text>
                    <View style={[styles.statusChip, { backgroundColor: statusColor + '15' }]}>
                      <View style={[styles.statusDotInline, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusChipText, { color: statusColor }]}>{getTripStatusLabel(trip.status)}</Text>
                    </View>
                  </View>
                </View>

                {/* Route row */}
                <View style={styles.routeRow}>
                  <MaterialIcons name="home" size={14} color={theme.success} />
                  <Text style={styles.routeText} numberOfLines={1}>{trip.home_location || trip.pickup_location}</Text>
                  <MaterialIcons name="arrow-back" size={12} color={theme.textMuted} />
                  <MaterialIcons name="work" size={14} color={theme.primary} />
                  <Text style={styles.routeText} numberOfLines={1}>{trip.work_location || trip.dropoff_location}</Text>
                </View>

                {/* Driver */}
                {trip.driver_id ? (
                  <View style={styles.driverRow}>
                    <MaterialIcons name="person" size={14} color={theme.primary} />
                    <Text style={styles.driverText}>{getDriverName(trip.driver_id)}</Text>
                  </View>
                ) : null}

                {/* Applicants bar */}
                {trip.status === 'available' && pendingApps > 0 ? (
                  <Pressable onPress={() => router.push({ pathname: '/admin/trip-applicants', params: { tripId: trip.id } })} style={styles.applicantsBar}>
                    <MaterialIcons name="people" size={14} color={theme.primary} />
                    <Text style={styles.applicantsText}>{pendingApps} سائق متقدم</Text>
                    <MaterialIcons name="chevron-left" size={16} color={theme.primary} />
                  </Pressable>
                ) : null}

                {/* Client info button for confirmed trips */}
                {(trip.status === 'confirmed' || trip.status === 'agreed') ? (
                  <Pressable onPress={() => setClientModal(trip)} style={styles.clientInfoBtn}>
                    <MaterialIcons name="info" size={16} color={theme.success} />
                    <Text style={[styles.actionText, { color: theme.success }]}>بيانات العميل</Text>
                  </Pressable>
                ) : null}

                {/* Actions row — always show "حالة المشوار" + edit */}
                <View style={styles.actionsRow}>
                  {/* Status Change Button — main admin action */}
                  <Pressable onPress={() => setStatusMenuTripId(statusMenuTripId === trip.id ? null : trip.id)} style={styles.statusBtn}>
                    <MaterialIcons name="swap-horiz" size={16} color={theme.primary} />
                    <Text style={styles.statusBtnText}>حالة المشوار</Text>
                    <MaterialIcons name={statusMenuTripId === trip.id ? 'expand-less' : 'expand-more'} size={16} color={theme.primary} />
                  </Pressable>

                  <Pressable onPress={() => router.push({ pathname: '/admin/trip-form', params: { tripId: trip.id } })} style={styles.iconAction}>
                    <MaterialIcons name="edit" size={16} color={theme.textSecondary} />
                  </Pressable>
                  {trip.driver_id ? (
                    <Pressable onPress={() => {
                      const driver = allDriversList.find(d => d.id === trip.driver_id);
                      const phone = driver?.phone ? driver.phone.replace(/^0/, '966') : '';
                      if (phone) Linking.openURL(`https://wa.me/${phone}`).catch(() => {});
                    }} style={[styles.iconAction, { backgroundColor: '#064E3B' }]}>
                      <MaterialIcons name="chat" size={16} color="#25D366" />
                    </Pressable>
                  ) : null}
                </View>

                {/* Status dropdown */}
                {statusMenuTripId === trip.id ? (
                  <Animated.View entering={FadeInDown.duration(150)} style={styles.dropdown}>
                    <Pressable onPress={() => handleStatusAction(trip, 'confirmed')} style={styles.dropdownItem}>
                      <MaterialIcons name="handshake" size={18} color={theme.success} />
                      <Text style={[styles.dropdownText, { color: theme.success }]}>تم الاتفاق</Text>
                    </Pressable>
                    <View style={styles.dropdownDivider} />
                    <Pressable onPress={() => handleStatusAction(trip, 'cancel')} style={styles.dropdownItem}>
                      <MaterialIcons name="cancel" size={18} color={theme.error} />
                      <Text style={[styles.dropdownText, { color: theme.error }]}>إلغاء</Text>
                    </Pressable>
                    <View style={styles.dropdownDivider} />
                    <Pressable onPress={() => handleStatusAction(trip, 'archive')} style={styles.dropdownItem}>
                      <MaterialIcons name="archive" size={18} color={theme.textMuted} />
                      <Text style={styles.dropdownText}>أرشفة</Text>
                    </Pressable>
                    <View style={styles.dropdownDivider} />
                    <Pressable onPress={() => handleStatusAction(trip, 'delete')} style={styles.dropdownItem}>
                      <MaterialIcons name="delete-forever" size={18} color={theme.error} />
                      <Text style={[styles.dropdownText, { color: theme.error }]}>حذف نهائي</Text>
                    </Pressable>
                  </Animated.View>
                ) : null}
              </View>
            </Animated.View>
          );
        })}

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="route" size={64} color={theme.border} />
            <Text style={styles.emptyText}>لا توجد مشاوير</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Client Info Modal */}
      <Modal visible={!!clientModal} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setClientModal(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <MaterialIcons name="person" size={24} color={theme.success} />
              <Text style={styles.modalTitle}>بيانات العميل</Text>
              <Pressable onPress={() => setClientModal(null)} style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={22} color={theme.textPrimary} />
              </Pressable>
            </View>
            {clientModal ? (
              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                <View style={styles.modalBody}>
                  <ModalRow label="الاسم" value={clientModal.client_name || 'غير محدد'} icon="badge" />
                  <ModalRow label="رقم الجوال" value={clientModal.client_phone || clientModal.notes || 'غير محدد'} icon="phone" highlight />
                  <ModalRow label="المدينة" value={clientModal.city || 'غير محدد'} icon="location-city" />
                  <ModalRow label="موقع البيت" value={clientModal.home_location || clientModal.pickup_location} icon="home" />
                  <ModalRow label="موقع العمل" value={clientModal.work_location || clientModal.dropoff_location} icon="work" />
                  <ModalRow label="السعر الشهري" value={`${clientModal.price} ر.س`} icon="payments" highlight />
                  <ModalRow label="عدد الركاب" value={`${clientModal.passengers} (${clientModal.passenger_gender === 'female' ? 'أنثى' : 'ذكر'})`} icon="people" />
                  {clientModal.work_days ? <ModalRow label="أيام العمل" value={clientModal.work_days} icon="date-range" /> : null}
                  {clientModal.departure_time ? <ModalRow label="الذهاب" value={clientModal.departure_time} icon="schedule" /> : null}
                  {clientModal.return_time ? <ModalRow label="العودة" value={clientModal.return_time} icon="schedule" /> : null}
                  <ModalRow label="السائق" value={getDriverName(clientModal.driver_id)} icon="directions-car" />
                  {clientModal.trip_number ? <ModalRow label="رقم المشوار" value={formatTripNumber(clientModal.trip_number)} icon="tag" /> : null}
                </View>
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Driver Picker Modal */}
      <Modal visible={!!driverPickerTrip} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setDriverPickerTrip(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <MaterialIcons name="person-add" size={24} color={theme.primary} />
              <Text style={styles.modalTitle}>اختر السائق</Text>
              <Pressable onPress={() => setDriverPickerTrip(null)} style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={22} color={theme.textPrimary} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {activeDrivers.map(driver => (
                <Pressable key={driver.id} onPress={() => driverPickerTrip ? handlePickDriver(driverPickerTrip, driver.id) : null} style={styles.driverPickerItem}>
                  <View style={styles.driverPickerAvatar}>
                    <MaterialIcons name="person" size={20} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverPickerName}>{driver.full_name || driver.username}</Text>
                    {driver.driver_code ? <Text style={styles.driverPickerCode}>{driver.driver_code}</Text> : null}
                  </View>
                  <MaterialIcons name="chevron-left" size={20} color={theme.textMuted} />
                </Pressable>
              ))}
              {activeDrivers.length === 0 ? (
                <View style={{ alignItems: 'center', padding: 40 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 14 }}>لا يوجد سائقون نشطون</Text>
                </View>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function ModalRow({ label, value, icon, highlight }: { label: string; value: string; icon: string; highlight?: boolean }) {
  return (
    <View style={modalStyles.row}>
      <View style={[modalStyles.iconCircle, highlight ? { backgroundColor: theme.accent + '20' } : {}]}>
        <MaterialIcons name={icon as any} size={16} color={highlight ? theme.accent : theme.textMuted} />
      </View>
      <View style={modalStyles.rowContent}>
        <Text style={modalStyles.label}>{label}</Text>
        <Text style={[modalStyles.value, highlight ? { color: theme.accent, fontSize: 16 } : {}]}>{value}</Text>
      </View>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  label: { fontSize: 12, fontWeight: '500', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right' },
  value: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  filterContainer: { height: 56 },
  filterScroll: { paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radiusFull, backgroundColor: theme.surfaceElevated },
  filterActive: { backgroundColor: theme.primary + '30', borderWidth: 1, borderColor: theme.primary },
  filterText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  filterTextActive: { color: theme.primary, fontWeight: '600' },
  countText: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', paddingHorizontal: 20, paddingBottom: 10 },

  tripCard: { marginHorizontal: 20, marginBottom: 12, padding: 18, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  tripTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  typeIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tripNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tripNumberBadge: { backgroundColor: theme.primary + '25', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tripNumberText: { fontSize: 11, fontWeight: '700', color: theme.primary },
  tripType: { fontSize: 15, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right' },
  tripTime: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginTop: 3 },
  tripRight: { alignItems: 'flex-end', gap: 6 },
  tripPrice: { fontSize: 17, fontWeight: '700', color: theme.accent },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radiusFull },
  statusDotInline: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: { fontSize: 10, fontWeight: '700' },

  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: theme.backgroundSecondary, borderRadius: theme.radiusMedium },
  routeText: { fontSize: 12, color: theme.textSecondary, flex: 1, writingDirection: 'rtl' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  driverText: { fontSize: 13, fontWeight: '600', color: theme.primary },
  applicantsBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: theme.primary + '12', borderRadius: theme.radiusMedium, marginBottom: 10 },
  applicantsText: { flex: 1, fontSize: 13, fontWeight: '600', color: theme.primary, writingDirection: 'rtl' },

  clientInfoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 10, borderRadius: theme.radiusMedium, backgroundColor: theme.success + '15', marginBottom: 10 },

  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.borderLight },
  statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', paddingVertical: 12, borderRadius: theme.radiusMedium, backgroundColor: theme.primary + '15', borderWidth: 1, borderColor: theme.primary + '30' },
  statusBtnText: { fontSize: 13, fontWeight: '700', color: theme.primary },
  iconAction: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 13, fontWeight: '600' },

  dropdown: { marginTop: 12, padding: 6, backgroundColor: theme.surfaceElevated, borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: theme.border },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  dropdownText: { fontSize: 14, fontWeight: '500', color: theme.textPrimary, writingDirection: 'rtl' },
  dropdownDivider: { height: 1, backgroundColor: theme.border, marginHorizontal: 12 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.caption, marginTop: 12, writingDirection: 'rtl' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 32, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  modalTitle: { ...typography.subtitle, writingDirection: 'rtl', flex: 1, textAlign: 'center' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  modalBody: { gap: 4 },

  // Driver picker
  driverPickerItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  driverPickerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center' },
  driverPickerName: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right' },
  driverPickerCode: { fontSize: 12, fontWeight: '600', color: theme.primary, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
});
