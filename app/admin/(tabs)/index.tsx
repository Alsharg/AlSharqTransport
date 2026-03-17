import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography, spacing } from '../../../constants/theme';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../hooks/useAuth';
import { getRoleLabel } from '../../../services/types';

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userRole, user } = useAuth();
  const { trips, earnings, allDriversList, messages, platformTotalEarnings, allDriversEarnings, tripApplications } = useApp();

  const availableCount = trips.filter(t => t.status === 'available').length;
  const activeCount = trips.filter(t => t.status === 'accepted' || t.status === 'inProgress').length;
  const completedCount = trips.filter(t => t.status === 'completed').length;
  const confirmedCount = trips.filter(t => t.status === 'agreed' || t.status === 'confirmed').length;
  const activeDrivers = allDriversList.filter(d => d.is_active).length;
  const totalDrivers = allDriversList.length;
  const totalRevenue = earnings.reduce((s, e) => s + Number(e.total_amount), 0);
  const pendingDrivers = allDriversList.filter(d => d.approval_status === 'pending').length;
  const unreadMsgs = messages.filter(m => m.sender_role === 'driver' && !m.is_read).length;
  const pendingApplications = tripApplications.filter(a => a.status === 'pending').length;

  const sections = [
    {
      title: 'التحكم بالمشرفين',
      icon: 'shield',
      color: theme.accent,
      items: [
        { label: 'إدارة المشرفين', icon: 'admin-panel-settings', route: '/admin/admins', badge: 0 },
        { label: 'سجل العمليات', icon: 'history', route: '/admin/audit-logs', badge: 0 },
        { label: 'الصلاحيات', icon: 'security', route: '/admin/permissions', badge: 0 },
      ],
    },
    {
      title: 'التحكم بالكباتن',
      icon: 'local-shipping',
      color: '#22C55E',
      items: [
        { label: 'إدارة الكباتن', icon: 'people', route: '/admin/(tabs)/drivers', badge: totalDrivers },
        { label: 'طلبات التسجيل', icon: 'how-to-reg', route: '/admin/approvals', badge: pendingDrivers },
        { label: 'المحادثات', icon: 'chat', route: '/admin/chat', badge: unreadMsgs },
        { label: 'المكافآت', icon: 'emoji-events', route: '/admin/bonuses', badge: 0 },
      ],
    },
    {
      title: 'التحكم بالعملاء',
      icon: 'people-outline',
      color: '#8B5CF6',
      items: [
        { label: 'إدارة العملاء', icon: 'person-search', route: '/admin/clients', badge: 0 },
        { label: 'العقود', icon: 'description', route: '/admin/contracts', badge: 0 },
        { label: 'الإعلانات', icon: 'campaign', route: '/admin/announcements', badge: 0 },
      ],
    },
    {
      title: 'المشاوير والخرائط',
      icon: 'map',
      color: '#3B82F6',
      items: [
        { label: 'متابعة المشاوير', icon: 'route', route: '/admin/(tabs)/trips', badge: pendingApplications > 0 ? pendingApplications : availableCount },
        { label: 'مشوار جديد', icon: 'add-circle', route: '/admin/trip-form', badge: 0 },
        { label: 'التسعير الديناميكي', icon: 'attach-money', route: '/admin/pricing', badge: 0 },
        { label: 'إيصالات المحفظة', icon: 'account-balance-wallet', route: '/admin/wallet-receipts', badge: 0 },
        { label: 'المساعد الذكي', icon: 'smart-toy', route: '/ai-assistant', badge: 0 },
      ],
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>مرحباً،</Text>
            <Text style={styles.title}>{user?.username || 'مدير النظام'}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '40' }]}>
            <MaterialIcons name="verified-user" size={14} color={theme.accent} />
            <Text style={[styles.roleText, { color: theme.accent }]}>{getRoleLabel(userRole || 'admin')}</Text>
          </View>
        </Animated.View>

        {/* Alert Banner */}
        {pendingDrivers > 0 ? (
          <Animated.View entering={FadeInDown.duration(400).delay(50)}>
            <Pressable onPress={() => router.push('/admin/approvals')} style={styles.alertBanner}>
              <View style={styles.alertIconWrap}>
                <MaterialIcons name="person-add" size={20} color="#FFF" />
              </View>
              <Text style={styles.alertTitle}>{pendingDrivers} طلب تسجيل بانتظار المراجعة</Text>
              <MaterialIcons name="chevron-left" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Revenue Hero */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroMain}>
              <Text style={styles.heroLabel}>إجمالي الإيرادات</Text>
              <Text style={styles.heroValue}>{totalRevenue.toFixed(0)}</Text>
              <Text style={styles.heroCurrency}>ريال سعودي</Text>
            </View>
            <View style={styles.heroSide}>
              <View style={styles.heroSideItem}>
                <View style={[styles.heroDot, { backgroundColor: theme.accent }]} />
                <Text style={styles.heroSideLabel}>العمولة</Text>
                <Text style={styles.heroSideValue}>{platformTotalEarnings.toFixed(0)}</Text>
              </View>
              <View style={styles.heroSideDivider} />
              <View style={styles.heroSideItem}>
                <View style={[styles.heroDot, { backgroundColor: '#22C55E' }]} />
                <Text style={styles.heroSideLabel}>الكباتن</Text>
                <Text style={styles.heroSideValue}>{allDriversEarnings.toFixed(0)}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.statsRow}>
          {[
            { label: 'متاح', value: availableCount, color: '#3B82F6', icon: 'local-taxi' },
            { label: 'نشط', value: activeCount, color: '#8B5CF6', icon: 'pending' },
            { label: 'مكتمل', value: completedCount, color: '#22C55E', icon: 'check-circle' },
            { label: 'اتفاق', value: confirmedCount, color: '#14B8A6', icon: 'handshake' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <MaterialIcons name={s.icon as any} size={20} color={s.color} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* 4 Sections */}
        {sections.map((section, sIndex) => (
          <Animated.View key={section.title} entering={FadeInDown.duration(400).delay(200 + sIndex * 80)} style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: section.color + '15' }]}>
                <MaterialIcons name={section.icon as any} size={20} color={section.color} />
              </View>
              <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
            </View>
            <View style={styles.sectionGrid}>
              {section.items.map(item => (
                <Pressable
                  key={item.label}
                  onPress={() => router.push(item.route as any)}
                  style={({ pressed }) => [styles.sectionBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
                >
                  <View style={styles.sectionBtnIcon}>
                    <MaterialIcons name={item.icon as any} size={22} color={section.color} />
                  </View>
                  <Text style={styles.sectionBtnLabel}>{item.label}</Text>
                  {item.badge > 0 ? (
                    <View style={[styles.sectionBadge, { backgroundColor: section.color }]}>
                      <Text style={styles.sectionBadgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ))}

        {/* Drivers Overview */}
        <Animated.View entering={FadeInDown.duration(400).delay(520)} style={styles.driversCard}>
          <Text style={styles.driversCardTitle}>نظرة على الكباتن</Text>
          <View style={styles.driversRow}>
            <View style={styles.driverStat}><Text style={styles.driverStatValue}>{totalDrivers}</Text><Text style={styles.driverStatLabel}>إجمالي</Text></View>
            <View style={styles.driverDivider} />
            <View style={styles.driverStat}><Text style={[styles.driverStatValue, { color: '#22C55E' }]}>{activeDrivers}</Text><Text style={styles.driverStatLabel}>نشط</Text></View>
            <View style={styles.driverDivider} />
            <View style={styles.driverStat}><Text style={[styles.driverStatValue, { color: theme.accent }]}>{pendingDrivers}</Text><Text style={styles.driverStatLabel}>بانتظار</Text></View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  greeting: { fontSize: 14, fontWeight: '500', color: theme.textMuted, writingDirection: 'rtl' },
  title: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radiusFull, borderWidth: 1 },
  roleText: { fontSize: 12, fontWeight: '700' },

  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 16, padding: 14, backgroundColor: '#991B1B', borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: '#EF4444' + '30' },
  alertIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  alertTitle: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '600', writingDirection: 'rtl', textAlign: 'right' },

  heroCard: { marginHorizontal: 20, backgroundColor: theme.primaryDark, borderRadius: theme.radiusXL, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: theme.primary + '30' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroMain: { flex: 1, alignItems: 'center' },
  heroLabel: { fontSize: 12, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl' },
  heroValue: { fontSize: 40, fontWeight: '700', color: theme.accent, marginTop: 4 },
  heroCurrency: { fontSize: 12, fontWeight: '500', color: theme.textMuted, marginTop: 2 },
  heroSide: { width: 1, backgroundColor: theme.border },
  heroSideItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 16 },
  heroDot: { width: 8, height: 8, borderRadius: 4 },
  heroSideLabel: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl' },
  heroSideValue: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },
  heroSideDivider: { height: 12 },

  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 24 },
  statCard: { flex: 1, padding: 14, borderRadius: theme.radiusMedium, backgroundColor: theme.surface, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: theme.border },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 10, fontWeight: '600', color: theme.textMuted },

  sectionBlock: { marginHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', writingDirection: 'rtl' },
  sectionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sectionBtn: { width: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: theme.radiusMedium, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  sectionBtnIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  sectionBtnLabel: { fontSize: 13, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl', flex: 1, textAlign: 'right' },
  sectionBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  sectionBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  driversCard: { marginHorizontal: 20, marginBottom: 20, padding: 20, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  driversCardTitle: { fontSize: 15, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right', marginBottom: 16 },
  driversRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  driverStat: { alignItems: 'center', gap: 4 },
  driverStatValue: { fontSize: 22, fontWeight: '700', color: theme.textPrimary },
  driverStatLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted },
  driverDivider: { width: 1, height: 36, backgroundColor: theme.border },
});
