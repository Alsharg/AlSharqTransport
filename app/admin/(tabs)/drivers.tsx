import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { Linking } from 'react-native';
import { theme, typography } from '../../../constants/theme';
import { useApp } from '../../../contexts/AppContext';
import { UserProfile } from '../../../services/types';
import { ADMIN_WHATSAPP } from '../../../constants/i18n';

const STATUS_LABELS: Record<string, string> = {
  available: 'متاح',
  unavailable: 'غير متاح',
  onTrip: 'في مشوار',
};

const STATUS_COLORS: Record<string, string> = {
  available: '#10B981',
  unavailable: '#94A3B8',
  onTrip: '#8B5CF6',
};

type Filter = 'all' | 'active' | 'inactive';

export default function AdminDriversScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { allDriversList, toggleDriverActive, earnings, loadDrivers } = useApp();
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => { loadDrivers(); }, []);

  const filtered = allDriversList.filter(d => {
    if (filter === 'active') return d.is_active;
    if (filter === 'inactive') return !d.is_active;
    return true;
  });

  const getDriverEarnings = (driverId: string) => {
    return earnings.filter(e => e.driver_id === driverId).reduce((sum, e) => sum + Number(e.driver_earning), 0);
  };

  const handleToggle = (driver: UserProfile) => {
    const action = driver.is_active ? 'تعطيل' : 'تفعيل';
    showAlert(`${action} السائق`, `هل أنت متأكد من ${action} ${driver.full_name || driver.username}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: action,
        style: driver.is_active ? 'destructive' : 'default',
        onPress: async () => { await toggleDriverActive(driver.id); await loadDrivers(); },
      },
    ]);
  };

  const handlePromote = (driver: UserProfile) => {
    router.push({ pathname: '/admin/promote-driver', params: { driverId: driver.id, driverName: driver.full_name || driver.username || '' } });
  };

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: `الكل (${allDriversList.length})` },
    { id: 'active', label: `نشط (${allDriversList.filter(d => d.is_active).length})` },
    { id: 'inactive', label: `معطل (${allDriversList.filter(d => !d.is_active).length})` },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>إدارة السائقين</Text>
        <Pressable onPress={() => router.push('/admin/approvals')} style={styles.approvalsBtn}>
          <MaterialIcons name="how-to-reg" size={20} color="#FFF" />
          <Text style={styles.approvalsBtnText}>الطلبات</Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <Pressable
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={[styles.filterChip, filter === f.id && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((driver, index) => {
          const statusColor = STATUS_COLORS[driver.status] || '#94A3B8';
          const statusLabel = STATUS_LABELS[driver.status] || driver.status;
          return (
            <Animated.View key={driver.id} entering={FadeInDown.duration(300).delay(index * 60)}>
              <View style={[styles.driverCard, !driver.is_active && styles.driverInactive]}>
                <View style={styles.driverTop}>
                  <View style={styles.driverInfo}>
                    <View style={[styles.avatarCircle, { backgroundColor: driver.is_active ? theme.primary + '15' : '#F1F5F9' }]}>
                      <MaterialIcons name="person" size={24} color={driver.is_active ? theme.primary : theme.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.driverName}>{driver.full_name || driver.username || 'بدون اسم'}</Text>
                      {driver.driver_code ? <Text style={styles.driverCode}>{driver.driver_code}</Text> : null}
                      <Text style={styles.driverPhone}>{driver.phone || driver.email}</Text>
                    </View>
                    <View style={[styles.statusChip, { backgroundColor: statusColor + '15' }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                  </View>
                </View>

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
                    <MaterialIcons name="account-balance-wallet" size={14} color={theme.accent} />
                    <Text style={[styles.driverStatText, { color: theme.accent }]}>{getDriverEarnings(driver.id).toFixed(0)} ر.س</Text>
                  </View>
                </View>

                {driver.nationality || driver.car_model ? (
                  <View style={styles.driverMeta}>
                    {driver.nationality ? (
                      <View style={styles.metaChip}><MaterialIcons name="flag" size={12} color={theme.textMuted} /><Text style={styles.metaChipText}>{driver.nationality}</Text></View>
                    ) : null}
                    {driver.car_model ? (
                      <View style={styles.metaChip}><MaterialIcons name="directions-car" size={12} color={theme.textMuted} /><Text style={styles.metaChipText}>{driver.car_model}</Text></View>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.driverActions}>
                  <Pressable
                    onPress={() => router.push({ pathname: '/admin/chat', params: { driverId: driver.id, driverName: driver.full_name || driver.username || '' } })}
                    style={[styles.actionBtn, { backgroundColor: '#1E3A5F' }]}
                  >
                    <MaterialIcons name="chat" size={16} color="#60A5FA" />
                    <Text style={[styles.actionText, { color: '#60A5FA' }]}>محادثة</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const phone = driver.phone ? driver.phone.replace(/^0/, '966') : '';
                      if (phone) Linking.openURL(`https://wa.me/${phone}`).catch(() => {});
                      else showAlert('خطأ', 'لا يوجد رقم هاتف مسجل لهذا السائق');
                    }}
                    style={[styles.actionBtn, { backgroundColor: '#064E3B' }]}
                  >
                    <MaterialIcons name="chat" size={16} color="#25D366" />
                    <Text style={[styles.actionText, { color: '#25D366' }]}>واتساب</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleToggle(driver)}
                    style={[styles.actionBtn, driver.is_active ? styles.deactivateBtn : styles.activateBtn]}
                  >
                    <MaterialIcons
                      name={driver.is_active ? 'block' : 'check-circle'}
                      size={16}
                      color={driver.is_active ? theme.error : theme.success}
                    />
                    <Text style={[styles.actionText, { color: driver.is_active ? theme.error : theme.success }]}>
                      {driver.is_active ? 'تعطيل' : 'تفعيل'}
                    </Text>
                  </Pressable>

                  {driver.is_active ? (
                    <Pressable
                      onPress={() => handlePromote(driver)}
                      style={[styles.actionBtn, styles.promoteBtn]}
                    >
                      <MaterialIcons name="upgrade" size={16} color={theme.primary} />
                      <Text style={[styles.actionText, { color: theme.primary }]}>ترقية لمشرف</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </Animated.View>
          );
        })}

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="people-outline" size={64} color={theme.border} />
            <Text style={styles.emptyText}>لا يوجد سائقون في هذا التصنيف</Text>
          </View>
        ) : null}
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
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  approvalsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EF4444', paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radiusFull,
  },
  approvalsBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: theme.radiusFull, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border,
  },
  filterActive: { backgroundColor: theme.primary + '20', borderWidth: 1.5, borderColor: theme.primary },
  filterText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  filterTextActive: { color: theme.primary, fontWeight: '600' },
  driverCard: {
    marginHorizontal: 20, marginBottom: 14, padding: 20,
    backgroundColor: theme.surface, borderRadius: theme.radiusLarge,
    borderWidth: 1, borderColor: theme.border,
  },
  driverInactive: { opacity: 0.7 },
  driverTop: { marginBottom: 12 },
  driverInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
  },
  driverName: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right' },
  driverCode: { fontSize: 12, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' as const, textAlign: 'right' as const, marginTop: 1 },
  driverPhone: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radiusFull,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  driverStats: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 14,
    paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.borderLight, marginBottom: 14,
  },
  driverStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  driverStatText: { ...typography.caption },
  driverActions: { flexDirection: 'row', gap: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.borderLight },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.radiusMedium,
  },
  actionText: { fontSize: 13, fontWeight: '600' },
  deactivateBtn: { backgroundColor: theme.errorLight },
  activateBtn: { backgroundColor: theme.successLight },
  promoteBtn: { backgroundColor: theme.primary + '12' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.caption, marginTop: 12 },
  driverMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: theme.backgroundSecondary, borderRadius: theme.radiusFull },
  metaChipText: { fontSize: 11, fontWeight: '500', color: theme.textSecondary },
});
