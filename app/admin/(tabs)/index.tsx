import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../../constants/theme';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../hooks/useAuth';

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userRole } = useAuth();
  const { trips, earnings, allDriversList, messages, platformTotalEarnings, allDriversEarnings } = useApp();

  const availableCount = trips.filter(t => t.status === 'available').length;
  const activeCount = trips.filter(t => t.status === 'accepted' || t.status === 'inProgress').length;
  const completedCount = trips.filter(t => t.status === 'completed').length;
  const agreedCount = trips.filter(t => t.status === 'agreed' || t.status === 'confirmed').length;
  const activeDrivers = allDriversList.filter(d => d.is_active).length;
  const totalDrivers = allDriversList.length;
  const totalRevenue = earnings.reduce((s, e) => s + Number(e.total_amount), 0);
  const pendingDrivers = allDriversList.filter(d => d.approval_status === 'pending').length;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>لوحة التحكم</Text>
            <Text style={styles.subtitle}>تحكم كامل في النظام</Text>
          </View>
          <View style={styles.adminBadge}>
            <MaterialIcons name="verified-user" size={16} color="#FFF" />
            <Text style={styles.adminBadgeText}>{userRole === 'admin' ? 'مدير' : 'مشرف'}</Text>
          </View>
        </Animated.View>

        {pendingDrivers > 0 ? (
          <Animated.View entering={FadeInDown.duration(400).delay(50)}>
            <Pressable onPress={() => router.push('/admin/approvals')} style={styles.alertBanner}>
              <MaterialIcons name="person-add" size={20} color="#FFF" />
              <Text style={styles.alertTitle}>{pendingDrivers} طلب تسجيل جديد</Text>
              <MaterialIcons name="chevron-left" size={20} color="#FFF" />
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Revenue Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.heroCard}>
          <Text style={styles.heroValue}>{totalRevenue.toFixed(0)}</Text>
          <Text style={styles.heroLabel}>إجمالي الإيرادات (ر.س)</Text>
          <View style={styles.heroDivider} />
          <View style={styles.heroSubRow}>
            <View style={styles.heroSubItem}>
              <View style={[styles.heroDot, { backgroundColor: theme.accent }]} />
              <Text style={styles.heroSubLabel}>عمولة</Text>
              <Text style={styles.heroSubValue}>{platformTotalEarnings.toFixed(0)}</Text>
            </View>
            <View style={styles.heroSubItem}>
              <View style={[styles.heroDot, { backgroundColor: theme.success }]} />
              <Text style={styles.heroSubLabel}>سائقين</Text>
              <Text style={styles.heroSubValue}>{allDriversEarnings.toFixed(0)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.statsGrid}>
          {[
            { label: 'متاح', value: availableCount, color: '#60A5FA', icon: 'local-taxi' as const },
            { label: 'نشط', value: activeCount, color: '#A78BFA', icon: 'pending' as const },
            { label: 'مكتمل', value: completedCount, color: '#34D399', icon: 'check-circle' as const },
            { label: 'اتفاق', value: agreedCount, color: '#34D399', icon: 'handshake' as const },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <MaterialIcons name={s.icon} size={22} color={s.color} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Drivers Overview */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.driversCard}>
          <View style={styles.driversRow}>
            <View style={styles.driverStat}><Text style={styles.driverStatValue}>{totalDrivers}</Text><Text style={styles.driverStatLabel}>إجمالي</Text></View>
            <View style={styles.driverDivider} />
            <View style={styles.driverStat}><Text style={[styles.driverStatValue, { color: theme.success }]}>{activeDrivers}</Text><Text style={styles.driverStatLabel}>نشط</Text></View>
            <View style={styles.driverDivider} />
            <View style={styles.driverStat}><Text style={[styles.driverStatValue, { color: theme.accent }]}>{pendingDrivers}</Text><Text style={styles.driverStatLabel}>بانتظار</Text></View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          <View style={styles.quickGrid}>
            {[
              { label: 'مشوار جديد', icon: 'add-circle' as const, color: theme.primary, route: '/admin/trip-form' },
              { label: 'إيصالات', icon: 'account-balance-wallet' as const, color: '#FBBF24', route: '/admin/wallet-receipts' },
              { label: 'الطلبات', icon: 'how-to-reg' as const, color: '#F87171', route: '/admin/approvals' },
              { label: 'المساعد', icon: 'smart-toy' as const, color: '#A78BFA', route: '/ai-assistant' },
            ].map(q => (
              <Pressable key={q.label} onPress={() => router.push(q.route as any)} style={[styles.quickBtn, { borderColor: q.color + '40' }]}>
                <MaterialIcons name={q.icon} size={24} color={q.color} />
                <Text style={styles.quickBtnText}>{q.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  title: { ...typography.title, writingDirection: 'rtl', textAlign: 'right' },
  subtitle: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radiusFull },
  adminBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 16, padding: 14, backgroundColor: '#B91C1C', borderRadius: theme.radiusMedium },
  alertTitle: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '700', writingDirection: 'rtl', textAlign: 'right' },
  heroCard: { marginHorizontal: 16, backgroundColor: theme.primaryDark, borderRadius: theme.radiusXL, padding: 24, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.primary + '20' },
  heroValue: { fontSize: 42, fontWeight: '700', color: theme.accent },
  heroLabel: { fontSize: 13, fontWeight: '500', color: theme.textSecondary, marginTop: 4, writingDirection: 'rtl' },
  heroDivider: { height: 1, width: '100%', backgroundColor: theme.border, marginVertical: 16 },
  heroSubRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  heroSubItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroDot: { width: 8, height: 8, borderRadius: 4 },
  heroSubLabel: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl' },
  heroSubValue: { fontSize: 13, fontWeight: '700', color: theme.textPrimary },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  statCard: { flex: 1, padding: 12, borderRadius: theme.radiusMedium, backgroundColor: theme.surface, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: theme.border },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl' },
  driversCard: { marginHorizontal: 16, marginBottom: 20, padding: 18, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  driversRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  driverStat: { alignItems: 'center', gap: 4 },
  driverStatValue: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
  driverStatLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl' },
  driverDivider: { width: 1, height: 36, backgroundColor: theme.border },
  sectionTitle: { ...typography.sectionHeader, writingDirection: 'rtl', textAlign: 'right', paddingHorizontal: 16, marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  quickBtn: { width: '47%', flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20, borderRadius: theme.radiusLarge, backgroundColor: theme.surface, borderWidth: 1 },
  quickBtnText: { color: theme.textPrimary, fontSize: 13, fontWeight: '700' },
});
