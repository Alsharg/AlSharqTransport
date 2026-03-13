import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { UserProfile } from '../../services/types';

export default function AdminApprovalsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { allDriversList, approveDriver, rejectDriver, loadDrivers } = useApp();

  const pendingDrivers = allDriversList.filter(d => d.approval_status === 'pending');
  const reviewedDrivers = allDriversList.filter(d => d.approval_status !== 'pending');

  const handleApprove = (driver: UserProfile) => {
    showAlert('قبول السائق', `هل تريد قبول طلب ${driver.full_name}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'قبول', onPress: async () => { await approveDriver(driver.id); await loadDrivers(); showAlert('تم القبول', `تم قبول ${driver.full_name} وتفعيل حسابه`); } },
    ]);
  };

  const handleReject = (driver: UserProfile) => {
    showAlert('رفض السائق', `هل تريد رفض طلب ${driver.full_name}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'رفض', style: 'destructive', onPress: async () => { await rejectDriver(driver.id); await loadDrivers(); } },
    ]);
  };

  const renderDriverCard = (driver: UserProfile, index: number) => {
    const isPending = driver.approval_status === 'pending';
    const statusColor = driver.approval_status === 'approved' ? theme.success : driver.approval_status === 'rejected' ? theme.error : theme.info;
    const statusLabel = driver.approval_status === 'approved' ? 'معتمد' : driver.approval_status === 'rejected' ? 'مرفوض' : 'قيد المراجعة';
    return (
      <Animated.View key={driver.id} entering={FadeInDown.duration(250).delay(index * 50)}>
        <View style={[styles.card, !isPending && { opacity: 0.75 }]}>
          <View style={styles.cardTop}>
            <View style={[styles.avatar, { backgroundColor: statusColor + '15' }]}><MaterialIcons name="person-add" size={24} color={statusColor} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{driver.full_name || driver.username}</Text>
              {driver.driver_code ? <Text style={styles.driverCode}>{driver.driver_code}</Text> : null}
              <Text style={styles.info}>{driver.phone || ''} | {driver.email}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}><Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text></View>
          </View>

          {/* Driver Details Card */}
          <View style={styles.detailsGrid}>
            {driver.nationality ? (
              <View style={styles.detailItem}>
                <MaterialIcons name="flag" size={14} color={theme.textMuted} />
                <Text style={styles.detailLabel}>الجنسية</Text>
                <Text style={styles.detailValue}>{driver.nationality}</Text>
              </View>
            ) : null}
            {driver.vehicle_type ? (
              <View style={styles.detailItem}>
                <MaterialIcons name="directions-car" size={14} color={theme.textMuted} />
                <Text style={styles.detailLabel}>نوع السيارة</Text>
                <Text style={styles.detailValue}>{driver.vehicle_type}</Text>
              </View>
            ) : null}
            {driver.car_model ? (
              <View style={styles.detailItem}>
                <MaterialIcons name="car-rental" size={14} color={theme.textMuted} />
                <Text style={styles.detailLabel}>الموديل</Text>
                <Text style={styles.detailValue}>{driver.car_model}</Text>
              </View>
            ) : null}
            {driver.vehicle_plate ? (
              <View style={styles.detailItem}>
                <MaterialIcons name="confirmation-number" size={14} color={theme.textMuted} />
                <Text style={styles.detailLabel}>اللوحة</Text>
                <Text style={styles.detailValue}>{driver.vehicle_plate}</Text>
              </View>
            ) : null}
            {driver.license_number ? (
              <View style={styles.detailItem}>
                <MaterialIcons name="badge" size={14} color={theme.textMuted} />
                <Text style={styles.detailLabel}>الرخصة</Text>
                <Text style={styles.detailValue}>{driver.license_number}</Text>
              </View>
            ) : null}
          </View>

          {isPending ? (
            <View style={styles.actionsRow}>
              <Pressable onPress={() => handleApprove(driver)} style={styles.approveBtn}><MaterialIcons name="verified" size={18} color="#FFF" /><Text style={styles.approveBtnText}>تم الاعتماد</Text></Pressable>
              <Pressable onPress={() => handleReject(driver)} style={styles.rejectBtn}><MaterialIcons name="cancel" size={18} color={theme.error} /><Text style={styles.rejectBtnText}>رفض</Text></Pressable>
            </View>
          ) : null}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>طلبات التسجيل</Text>
        <View style={styles.pendingBadge}><Text style={styles.pendingBadgeText}>{pendingDrivers.length}</Text></View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {pendingDrivers.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>قيد المراجعة ({pendingDrivers.length})</Text>
            {pendingDrivers.map((d, i) => renderDriverCard(d, i))}
          </>
        ) : (
          <View style={styles.emptyState}><MaterialIcons name="how-to-reg" size={64} color={theme.border} /><Text style={styles.emptyText}>لا توجد طلبات تسجيل جديدة</Text></View>
        )}
        {reviewedDrivers.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>السائقون ({reviewedDrivers.length})</Text>
            {reviewedDrivers.slice(0, 10).map((d, i) => renderDriverCard(d, i + pendingDrivers.length))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  pendingBadge: { backgroundColor: theme.error, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  pendingBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  sectionTitle: { ...typography.sectionHeader, writingDirection: 'rtl', textAlign: 'right', marginBottom: 12 },
  card: { marginBottom: 12, padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right' },
  info: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radiusFull },
  statusText: { fontSize: 11, fontWeight: '700' },
  driverCode: { fontSize: 12, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' as const, textAlign: 'right' as const, marginTop: 1 },
  detailsGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.borderLight },
  detailItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, backgroundColor: theme.surfaceElevated, paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.radiusFull },
  detailLabel: { fontSize: 11, fontWeight: '500', color: theme.textMuted },
  detailValue: { fontSize: 12, fontWeight: '600', color: theme.textPrimary },
  actionsRow: { flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.borderLight },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.success, paddingVertical: 12, borderRadius: theme.radiusMedium },
  approveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.errorLight, paddingVertical: 12, borderRadius: theme.radiusMedium, borderWidth: 1.5, borderColor: theme.error },
  rejectBtnText: { color: theme.error, fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.caption, marginTop: 12, writingDirection: 'rtl' },
});
