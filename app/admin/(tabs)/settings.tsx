import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Linking } from 'react-native';
import { theme, typography } from '../../../constants/theme';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../hooks/useAuth';
import { config } from '../../../constants/config';
import { ADMIN_WHATSAPP } from '../../../constants/i18n';

export default function AdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userRole, logout, user } = useAuth();
  const { announcements, bonusPenalties, messages, allDriversList } = useApp();

  const pendingDrivers = allDriversList.filter(d => d.approval_status === 'pending').length;
  const activeAnnouncements = announcements.filter(a => a.is_active).length;
  const unreadMessages = messages.filter(m => m.sender_role === 'driver' && !m.is_read).length;

  const managementItems = [
    { id: 'approvals', icon: 'how-to-reg', label: 'طلبات التسجيل', desc: `${pendingDrivers} طلب بانتظار المراجعة`, color: '#EF4444', route: '/admin/approvals', badge: pendingDrivers },
    { id: 'wallet-receipts', icon: 'account-balance-wallet', label: 'إيصالات شحن المحفظة', desc: 'مراجعة واعتماد طلبات شحن المحفظة', color: '#F59E0B', route: '/admin/wallet-receipts' },
    { id: 'receipts', icon: 'receipt-long', label: 'إيصالات العمولة القديمة', desc: 'مراجعة إيصالات العمولة', color: '#3B82F6', route: '/admin/receipts' },
    { id: 'chat', icon: 'chat', label: 'محادثات السائقين', desc: `${messages.length} رسالة${unreadMessages > 0 ? ` • ${unreadMessages} جديدة` : ''}`, color: '#06B6D4', route: '/admin/chat', badge: unreadMessages },
    { id: 'announcements', icon: 'campaign', label: 'الإعلانات', desc: `${activeAnnouncements} إعلان نشط`, color: '#F59E0B', route: '/admin/announcements' },
    { id: 'bonuses', icon: 'emoji-events', label: 'المكافآت والخصومات', desc: `${bonusPenalties.length} سجل`, color: '#10B981', route: '/admin/bonuses' },
    { id: 'ai', icon: 'smart-toy', label: 'المساعد الذكي', desc: 'تحليلات واقتراحات ذكية', color: '#8B5CF6', route: '/ai-assistant' },
  ];

  const accountItems = [
    { id: 'profile', icon: 'person', label: 'الملف الشخصي', desc: user?.email || '', color: theme.primary, route: '/edit-profile' },
    { id: 'whatsapp', icon: 'chat', label: 'واتساب الإدارة', desc: '0569559088', color: '#25D366', route: '' },
  ];

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  };

  const renderGroup = (title: string, items: typeof managementItems, delay: number) => (
    <Animated.View entering={FadeInDown.duration(400).delay(delay)} style={styles.settingsGroup}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); if (item.id === 'whatsapp') { Linking.openURL(`https://wa.me/${ADMIN_WHATSAPP}`).catch(() => {}); } else { router.push(item.route as any); } }}
              style={({ pressed }) => [styles.settingsRow, pressed && { backgroundColor: theme.backgroundSecondary }]}
            >
              <View style={styles.settingsLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: item.color + '12' }]}>
                  <MaterialIcons name={item.icon as any} size={22} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>{item.label}</Text>
                  {item.desc ? <Text style={styles.settingsValue} numberOfLines={1}>{item.desc}</Text> : null}
                </View>
              </View>
              <View style={styles.settingsRight}>
                {item.badge ? (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{item.badge}</Text>
                  </View>
                ) : null}
                <MaterialIcons name="chevron-left" size={22} color={theme.textMuted} />
              </View>
            </Pressable>
            {index < items.length - 1 ? <View style={styles.settingsDivider} /> : null}
          </React.Fragment>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <Text style={styles.title}>الإعدادات</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(50)} style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <MaterialIcons name="admin-panel-settings" size={36} color={theme.primary} />
          </View>
          <Text style={styles.profileName}>{user?.username || 'مدير النظام'}</Text>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          <View style={[styles.roleBadge, { backgroundColor: userRole === 'admin' ? '#FEF3C7' : '#DBEAFE' }]}>
            <MaterialIcons name="verified-user" size={14} color={userRole === 'admin' ? '#D97706' : '#3B82F6'} />
            <Text style={[styles.roleText, { color: userRole === 'admin' ? '#D97706' : '#3B82F6' }]}>
              {userRole === 'admin' ? 'مدير النظام' : 'مشرف'}
            </Text>
          </View>
        </Animated.View>

        {renderGroup('الإدارة', managementItems, 100)}
        {renderGroup('الحساب', accountItems, 200)}

        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>الدعم</Text>
          <View style={styles.groupCard}>
            <View style={styles.settingsRow}>
              <View style={styles.settingsLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: theme.primary + '12' }]}>
                  <MaterialIcons name="info-outline" size={22} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>عن الشرق</Text>
                  <Text style={styles.settingsValue}>الإصدار {config.version}</Text>
                </View>
              </View>
            </View>
            <View style={styles.settingsDivider} />
            <View style={styles.settingsRow}>
              <View style={styles.settingsLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: theme.primary + '12' }]}>
                  <MaterialIcons name="email" size={22} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>تواصل معنا</Text>
                  <Text style={styles.settingsValue}>{config.email}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <MaterialIcons name="logout" size={20} color={theme.error} />
            <Text style={styles.logoutText}>تسجيل الخروج</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>الشرق للنقل والتوصيل</Text>
          <Text style={styles.footerVersion}>الإصدار {config.version}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { ...typography.title, writingDirection: 'rtl', textAlign: 'right' },
  profileCard: {
    marginHorizontal: 20, padding: 28, backgroundColor: theme.surface,
    borderRadius: theme.radiusXL, alignItems: 'center', borderWidth: 1, borderColor: theme.border, marginBottom: 24,
  },
  profileAvatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  profileName: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  profileEmail: { ...typography.caption, marginTop: 4, writingDirection: 'rtl' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: theme.radiusFull,
  },
  roleText: { fontSize: 13, fontWeight: '700' },
  settingsGroup: { marginBottom: 20, paddingHorizontal: 20 },
  groupTitle: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right', marginBottom: 8, paddingHorizontal: 4 },
  groupCard: { backgroundColor: theme.surface, borderRadius: theme.radiusLarge, overflow: 'hidden', borderWidth: 1, borderColor: theme.border },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingsRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingsIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { ...typography.body, writingDirection: 'rtl', textAlign: 'right' },
  settingsValue: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 1 },
  settingsDivider: { height: 1, backgroundColor: theme.borderLight, marginHorizontal: 14 },
  menuBadge: { backgroundColor: theme.error, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  menuBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, paddingVertical: 16, borderRadius: theme.radiusMedium,
    backgroundColor: theme.errorLight, marginTop: 12,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: theme.error },
  footer: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  footerText: { ...typography.caption, writingDirection: 'rtl' },
  footerVersion: { fontSize: 11, fontWeight: '600', color: theme.textMuted },
});
