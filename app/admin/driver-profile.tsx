import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAlert } from '@/template';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { getDriverLevelLabel, getDriverLevelColor, formatTripNumber, getRoleLabel, getStatusColor, getTripStatusLabel, getTripTypeLabel } from '../../services/types';
import { config } from '../../constants/config';
import * as api from '../../services/api';

export default function AdminDriverProfileScreen() {
  const { driverId } = useLocalSearchParams<{ driverId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { allDriversList, trips, earnings, toggleDriverActive, approveDriver, rejectDriver, logAuditAction, loadDrivers } = useApp();

  const driver = allDriversList.find(d => d.id === driverId);
  const [activeTab, setActiveTab] = useState<'info' | 'trips' | 'ratings' | 'logs'>('info');
  const [ratings, setRatings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [levelModal, setLevelModal] = useState(false);

  const driverTrips = trips.filter(t => t.driver_id === driverId);
  const driverEarnings = earnings.filter(e => e.driver_id === driverId);
  const totalEarnings = driverEarnings.reduce((s, e) => s + Number(e.driver_earning), 0);
  const totalCommission = driverEarnings.reduce((s, e) => s + Number(e.platform_commission), 0);

  useEffect(() => {
    if (!driverId) return;
    api.fetchRatingsForUser(driverId).then(setRatings);
    api.fetchAuditLogs(50).then(logs => setAuditLogs(logs.filter((l: any) => l.target_id === driverId || l.actor_id === driverId)));
  }, [driverId]);

  const handleToggle = useCallback(() => {
    if (!driver) return;
    const action = driver.is_active ? 'تعطيل' : 'تفعيل';
    showAlert(`${action} السائق`, `هل أنت متأكد من ${action} ${driver.full_name || driver.username}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: action, style: driver.is_active ? 'destructive' : 'default', onPress: async () => {
        await toggleDriverActive(driver.id);
        await logAuditAction(driver.is_active ? 'deactivate_driver' : 'activate_driver', 'driver', driver.id, { driver_name: driver.full_name });
        loadDrivers();
      }},
    ]);
  }, [driver, toggleDriverActive, logAuditAction, loadDrivers, showAlert]);

  const handleLevelChange = useCallback(async (newLevel: number) => {
    if (!driver) return;
    setLevelModal(false);
    setLoading(true);
    await api.updateUserProfile(driver.id, { level: newLevel });
    await logAuditAction('change_level', 'driver', driver.id, { from: driver.level, to: newLevel });
    loadDrivers();
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert('تم', `تم تغيير مستوى السائق إلى ${getDriverLevelLabel(newLevel)}`);
  }, [driver, logAuditAction, loadDrivers, showAlert]);

  if (!driver) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialIcons name="error-outline" size={64} color={theme.border} />
        <Text style={{ color: theme.textMuted, fontSize: 16, marginTop: 16 }}>السائق غير موجود</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>رجوع</Text></Pressable>
      </SafeAreaView>
    );
  }

  const statusColor = driver.is_active ? theme.success : theme.error;
  const levelColor = getDriverLevelColor(driver.level);

  const TABS = [
    { id: 'info' as const, label: 'المعلومات', icon: 'person' },
    { id: 'trips' as const, label: 'المشاوير', icon: 'route' },
    { id: 'ratings' as const, label: 'التقييمات', icon: 'star' },
    { id: 'logs' as const, label: 'السجل', icon: 'history' },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>ملف السائق</Text>
        <Pressable onPress={() => router.push({ pathname: '/driver-card', params: { driverId: driver.id } } as any)} style={styles.cardBtn}>
          <MaterialIcons name="badge" size={20} color={theme.accent} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: statusColor + '20' }]}>
            <MaterialIcons name="person" size={40} color={statusColor} />
          </View>
          <Text style={styles.driverName}>{driver.full_name || driver.username || 'بدون اسم'}</Text>
          {driver.driver_code ? <Text style={styles.driverCode}>{driver.driver_code}</Text> : null}
          <Text style={styles.driverEmail}>{driver.email}</Text>

          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: statusColor + '15' }]}>
              <View style={[styles.badgeDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.badgeText, { color: statusColor }]}>{driver.is_active ? 'نشط' : 'معطل'}</Text>
            </View>
            <Pressable onPress={() => setLevelModal(true)} style={[styles.badge, { backgroundColor: levelColor + '15' }]}>
              <MaterialIcons name="military-tech" size={14} color={levelColor} />
              <Text style={[styles.badgeText, { color: levelColor }]}>{getDriverLevelLabel(driver.level)}</Text>
              <MaterialIcons name="edit" size={12} color={levelColor} />
            </Pressable>
            <View style={[styles.badge, { backgroundColor: '#FBBF24' + '15' }]}>
              <MaterialIcons name="star" size={14} color="#FBBF24" />
              <Text style={[styles.badgeText, { color: '#FBBF24' }]}>{Number(driver.rating || 5).toFixed(1)}</Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}><Text style={[styles.statValue, { color: theme.primary }]}>{driver.total_trips || 0}</Text><Text style={styles.statLabel}>مشوار</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}><Text style={[styles.statValue, { color: theme.accent }]}>{totalEarnings.toFixed(0)}</Text><Text style={styles.statLabel}>أرباح</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}><Text style={[styles.statValue, { color: theme.error }]}>{totalCommission.toFixed(0)}</Text><Text style={styles.statLabel}>عمولة</Text></View>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.actionsRow}>
          <Pressable onPress={() => { const phone = driver.phone ? driver.phone.replace(/^0/, '966') : ''; if (phone) Linking.openURL(`https://wa.me/${phone}`); }} style={[styles.actionBtn, { backgroundColor: '#064E3B' }]}>
            <MaterialIcons name="chat" size={18} color="#25D366" />
            <Text style={[styles.actionText, { color: '#25D366' }]}>واتساب</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: '/admin/chat', params: { driverId: driver.id, driverName: driver.full_name || driver.username || '' } })} style={[styles.actionBtn, { backgroundColor: theme.primary + '15' }]}>
            <MaterialIcons name="chat-bubble" size={18} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.primary }]}>محادثة</Text>
          </Pressable>
          <Pressable onPress={handleToggle} style={[styles.actionBtn, { backgroundColor: driver.is_active ? theme.errorLight : theme.successLight }]}>
            <MaterialIcons name={driver.is_active ? 'block' : 'check-circle'} size={18} color={driver.is_active ? theme.error : theme.success} />
            <Text style={[styles.actionText, { color: driver.is_active ? theme.error : theme.success }]}>{driver.is_active ? 'تعطيل' : 'تفعيل'}</Text>
          </Pressable>
        </Animated.View>

        {/* Tabs */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {TABS.map(tab => (
              <Pressable key={tab.id} onPress={() => { setActiveTab(tab.id); Haptics.selectionAsync(); }} style={[styles.tab, activeTab === tab.id && styles.tabActive]}>
                <MaterialIcons name={tab.icon as any} size={16} color={activeTab === tab.id ? theme.primary : theme.textMuted} />
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Tab Content */}
        {activeTab === 'info' ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
            <InfoRow label="الاسم الكامل" value={driver.full_name || '-'} icon="person" />
            <InfoRow label="البريد الإلكتروني" value={driver.email} icon="email" />
            <InfoRow label="رقم الجوال" value={driver.phone || '-'} icon="phone" />
            <InfoRow label="الجنسية" value={driver.nationality || '-'} icon="flag" />
            <InfoRow label="نوع المركبة" value={driver.vehicle_type || '-'} icon="directions-car" />
            <InfoRow label="موديل المركبة" value={driver.car_model || '-'} icon="car-repair" />
            <InfoRow label="رقم اللوحة" value={driver.vehicle_plate || '-'} icon="credit-card" />
            <InfoRow label="رقم الرخصة" value={driver.license_number || '-'} icon="assignment-ind" />
            <InfoRow label="حالة الموافقة" value={driver.approval_status === 'approved' ? 'معتمد' : driver.approval_status === 'pending' ? 'بانتظار المراجعة' : 'مرفوض'} icon="verified" />
            <InfoRow label="تاريخ التسجيل" value={new Date(driver.created_at).toLocaleDateString('ar-SA')} icon="calendar-today" />
            <InfoRow label="المكافآت" value={`${Number(driver.bonuses || 0).toFixed(0)} ر.س`} icon="emoji-events" highlight />
            <InfoRow label="الخصومات" value={`${Number(driver.penalties || 0).toFixed(0)} ر.س`} icon="remove-circle" />
          </Animated.View>
        ) : null}

        {activeTab === 'trips' ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
            {driverTrips.length === 0 ? (
              <View style={styles.emptyTab}><MaterialIcons name="route" size={40} color={theme.border} /><Text style={styles.emptyTabText}>لا توجد مشاوير</Text></View>
            ) : driverTrips.slice(0, 20).map(trip => {
              const sc = getStatusColor(trip.status);
              return (
                <Pressable key={trip.id} onPress={() => router.push({ pathname: '/trip-detail', params: { id: trip.id } })} style={styles.tripRow}>
                  <View style={[styles.tripDot, { backgroundColor: sc }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tripRowTitle}>{formatTripNumber(trip.trip_number)} - {getTripTypeLabel(trip.type)}</Text>
                    <Text style={styles.tripRowSub}>{trip.pickup_location} → {trip.dropoff_location}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={[styles.tripRowPrice, { color: theme.accent }]}>{trip.price} ر.س</Text>
                    <Text style={[styles.tripRowStatus, { color: sc }]}>{getTripStatusLabel(trip.status)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>
        ) : null}

        {activeTab === 'ratings' ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
            {ratings.length === 0 ? (
              <View style={styles.emptyTab}><MaterialIcons name="star-outline" size={40} color={theme.border} /><Text style={styles.emptyTabText}>لا توجد تقييمات</Text></View>
            ) : ratings.map((r: any) => (
              <View key={r.id} style={styles.ratingRow}>
                <View style={styles.ratingStars}>
                  {[1,2,3,4,5].map(s => (
                    <MaterialIcons key={s} name={s <= Math.round(r.rating) ? 'star' : 'star-outline'} size={16} color="#FBBF24" />
                  ))}
                  <Text style={styles.ratingNum}>{Number(r.rating).toFixed(1)}</Text>
                </View>
                {r.comment ? <Text style={styles.ratingComment}>{r.comment}</Text> : null}
                <Text style={styles.ratingDate}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</Text>
              </View>
            ))}
          </Animated.View>
        ) : null}

        {activeTab === 'logs' ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
            {auditLogs.length === 0 ? (
              <View style={styles.emptyTab}><MaterialIcons name="history" size={40} color={theme.border} /><Text style={styles.emptyTabText}>لا توجد سجلات</Text></View>
            ) : auditLogs.slice(0, 30).map((log: any) => (
              <View key={log.id} style={styles.logRow}>
                <View style={styles.logDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.logAction}>{log.action}</Text>
                  <Text style={styles.logActor}>{log.actor_name} ({log.actor_role})</Text>
                </View>
                <Text style={styles.logTime}>{new Date(log.created_at).toLocaleDateString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            ))}
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Level Picker Modal */}
      <Modal visible={levelModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setLevelModal(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>تغيير مستوى السائق</Text>
            {[1,2,3,4,5].map(level => {
              const lc = getDriverLevelColor(level);
              return (
                <Pressable key={level} onPress={() => handleLevelChange(level)} style={[styles.levelOption, driver.level === level && { borderColor: lc, backgroundColor: lc + '10' }]}>
                  <View style={[styles.levelIcon, { backgroundColor: lc + '20' }]}>
                    <MaterialIcons name="military-tech" size={22} color={lc} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.levelName, { color: lc }]}>{getDriverLevelLabel(level)}</Text>
                    <Text style={styles.levelNum}>المستوى {level}</Text>
                  </View>
                  {driver.level === level ? <MaterialIcons name="check-circle" size={22} color={lc} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, icon, highlight }: { label: string; value: string; icon: string; highlight?: boolean }) {
  return (
    <View style={infoStyles.row}>
      <View style={[infoStyles.iconWrap, highlight ? { backgroundColor: theme.accent + '20' } : {}]}>
        <MaterialIcons name={icon as any} size={16} color={highlight ? theme.accent : theme.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={[infoStyles.value, highlight ? { color: theme.accent } : {}]}>{value}</Text>
      </View>
    </View>
  );
}
const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right' },
  value: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  cardBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.accent + '15', alignItems: 'center', justifyContent: 'center' },
  backBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: theme.primary, borderRadius: theme.radiusMedium },
  backBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  profileCard: { margin: 20, padding: 24, backgroundColor: theme.surface, borderRadius: theme.radiusXL, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  driverName: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  driverCode: { fontSize: 14, fontWeight: '700', color: theme.primary, marginTop: 2 },
  driverEmail: { ...typography.caption, marginTop: 4 },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radiusFull },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', marginTop: 20, width: '100%', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 10, fontWeight: '600', color: theme.textMuted },
  statDivider: { width: 1, height: 36, backgroundColor: theme.border },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: theme.radiusMedium },
  actionText: { fontSize: 13, fontWeight: '600' },
  tabsContainer: { height: 48, marginBottom: 4 },
  tabsScroll: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radiusFull, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border },
  tabActive: { backgroundColor: theme.primary + '20', borderColor: theme.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: theme.textMuted },
  tabTextActive: { color: theme.primary },
  section: { marginHorizontal: 20, marginTop: 8, padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  emptyTab: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTabText: { fontSize: 14, fontWeight: '500', color: theme.textMuted },
  // Trip rows
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  tripDot: { width: 8, height: 8, borderRadius: 4 },
  tripRowTitle: { fontSize: 13, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right' },
  tripRowSub: { fontSize: 11, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  tripRowPrice: { fontSize: 14, fontWeight: '700' },
  tripRowStatus: { fontSize: 10, fontWeight: '600' },
  // Ratings
  ratingRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight, gap: 4 },
  ratingStars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingNum: { fontSize: 13, fontWeight: '700', color: '#FBBF24', marginLeft: 8 },
  ratingComment: { fontSize: 13, color: theme.textSecondary, writingDirection: 'rtl', textAlign: 'right' },
  ratingDate: { fontSize: 11, color: theme.textMuted },
  // Wallet
  walletBalance: { alignItems: 'center', paddingVertical: 16, marginBottom: 12, backgroundColor: theme.primary + '10', borderRadius: theme.radiusMedium },
  walletBalanceLabel: { fontSize: 12, fontWeight: '600', color: theme.textMuted },
  walletBalanceValue: { fontSize: 28, fontWeight: '700', color: theme.accent, marginTop: 4 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  txIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontSize: 13, fontWeight: '500', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right' },
  txDate: { fontSize: 11, color: theme.textMuted },
  txAmount: { fontSize: 14, fontWeight: '700' },
  // Logs
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  logDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary },
  logAction: { fontSize: 13, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right' },
  logActor: { fontSize: 11, color: theme.textMuted },
  logTime: { fontSize: 10, fontWeight: '600', color: theme.textMuted },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { ...typography.subtitle, writingDirection: 'rtl', textAlign: 'center', marginBottom: 20 },
  levelOption: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 16, borderRadius: theme.radiusMedium, borderWidth: 1.5, borderColor: theme.border, marginBottom: 10 },
  levelIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  levelName: { fontSize: 16, fontWeight: '700' },
  levelNum: { fontSize: 12, fontWeight: '500', color: theme.textMuted, marginTop: 2 },
});
