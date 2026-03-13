import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { config } from '../../constants/config';
import { getDriverLevelLabel, getDriverLevelColor } from '../../services/types';
import { useLanguage } from '../../contexts/LanguageContext';
import { LANGUAGES, ADMIN_WHATSAPP, Language } from '../../constants/i18n';
import { Linking, Modal } from 'react-native';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, totalEarnings, announcements, setDriverStatus } = useApp();
  const { logout, userRole } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [langModalVisible, setLangModalVisible] = useState(false);
  const isAvailable = profile?.status === 'available';
  const [tapCount, setTapCount] = useState(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = useCallback(() => {
    setTapCount(prev => {
      const next = prev + 1;
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      if (next >= 5) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push('/admin');
        return 0;
      }
      if (next >= 3) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      tapTimerRef.current = setTimeout(() => setTapCount(0), 2000);
      return next;
    });
  }, [router]);
  const openAdminWhatsApp = () => {
    Linking.openURL(`https://wa.me/${ADMIN_WHATSAPP}`).catch(() => {});
  };

  const activeAnnouncements = announcements.filter(a => a.is_active);
  const levelColor = getDriverLevelColor(profile?.level || 1);
  const levelLabel = getDriverLevelLabel(profile?.level || 1);

  const accountSettings = [
    { id: '1', icon: 'person', label: t.driverProfile, value: profile?.full_name || '', onPress: () => router.push('/edit-profile'), showChevron: true },
    { id: '2', icon: 'directions-car', label: t.vehicleInfo, value: profile?.vehicle_type || '', onPress: () => router.push('/edit-profile'), showChevron: true },
    { id: '3', icon: 'badge', label: t.drivingLicense, value: profile?.license_number || '', onPress: () => {}, showChevron: true },
  ];

  const generalSettings = [
    { id: '4', icon: 'chat-bubble-outline', label: t.chatWithAdmin, onPress: () => router.push('/chat'), showChevron: true },
    { id: '5', icon: 'notifications-none', label: t.notifications, onPress: () => router.push('/notifications'), showChevron: true },
    { id: '6', icon: 'history', label: t.tripHistory, onPress: () => router.push('/(tabs)/trips'), showChevron: true },
    { id: '9', icon: 'account-balance-wallet', label: t.wallet, onPress: () => router.push('/wallet'), showChevron: true, color: theme.accent },
    { id: '10', icon: 'translate', label: t.changeLanguage, value: LANGUAGES.find(l => l.id === language)?.nativeLabel || '', onPress: () => setLangModalVisible(true), showChevron: true, color: '#8B5CF6' },
  ];

  const supportSettings = [
    { id: 'wa', icon: 'chat', label: t.contactViaWhatsApp, value: '0569559088', onPress: openAdminWhatsApp, showChevron: true, color: '#25D366' },
    { id: '7', icon: 'email', label: t.contactUs, value: config.email, onPress: () => {}, showChevron: true },
    { id: '8', icon: 'info-outline', label: t.aboutApp, value: `${t.version} ${config.version}`, onPress: () => {}, showChevron: true },
  ];

  const renderSettingsGroup = (title: string, items: any[]) => (
    <View style={styles.settingsGroup}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            <Pressable onPress={() => { Haptics.selectionAsync(); item.onPress(); }} style={({ pressed }) => [styles.settingsRow, pressed && { backgroundColor: theme.backgroundSecondary }]}>
              <View style={styles.settingsLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: (item.color || theme.primary) + '12' }]}>
                  <MaterialIcons name={item.icon as any} size={20} color={item.color || theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>{item.label}</Text>
                  {item.value ? <Text style={styles.settingsValue} numberOfLines={1}>{item.value}</Text> : null}
                </View>
              </View>
              {item.showChevron ? <MaterialIcons name="chevron-left" size={22} color={theme.textMuted} /> : null}
            </Pressable>
            {index < items.length - 1 ? <View style={styles.settingsDivider} /> : null}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}><Text style={styles.title}>{t.more}</Text></Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <MaterialIcons name="person" size={36} color={theme.primary} />
          </View>
          <Text style={styles.profileName}>{profile?.full_name || profile?.username || ''}</Text>
          <Text style={styles.profilePhone}>{profile?.email || ''}</Text>
          <View style={[styles.levelBadge, { backgroundColor: levelColor + '15' }]}>
            <MaterialIcons name="military-tech" size={16} color={levelColor} />
            <Text style={[styles.levelText, { color: levelColor }]}>المستوى {profile?.level || 1} - {levelLabel}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: userRole === 'admin' ? '#FEF3C7' : userRole === 'supervisor' ? '#DBEAFE' : '#D1FAE5' }]}>
            <Text style={[styles.roleText, { color: userRole === 'admin' ? '#D97706' : userRole === 'supervisor' ? '#3B82F6' : '#059669' }]}>
              {userRole === 'admin' ? 'مدير' : userRole === 'supervisor' ? 'مشرف' : 'سائق'}
            </Text>
          </View>
          <View style={styles.profileStats}>
            <View style={styles.profileStat}><Text style={styles.profileStatValue}>{profile?.total_trips || 0}</Text><Text style={styles.profileStatLabel}>مشوار</Text></View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}><Text style={styles.profileStatValue}>{profile?.rating?.toFixed(1) || '5.0'}</Text><Text style={styles.profileStatLabel}>التقييم</Text></View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}><Text style={[styles.profileStatValue, { color: theme.accent }]}>{totalEarnings.toFixed(0)}</Text><Text style={styles.profileStatLabel}>الأرباح</Text></View>
          </View>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setDriverStatus(isAvailable ? 'unavailable' : 'available'); }}
            style={[styles.statusToggle, { backgroundColor: isAvailable ? theme.success : theme.textMuted }]}
          >
            <MaterialIcons name={isAvailable ? 'toggle-on' : 'toggle-off'} size={22} color="#FFF" />
            <Text style={styles.statusToggleText}>{isAvailable ? 'متاح' : 'غير متاح'}</Text>
          </Pressable>
        </Animated.View>

        {activeAnnouncements.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(400).delay(150)}>
            <View style={styles.settingsGroup}>
              <Text style={styles.groupTitle}>الإعلانات</Text>
              {activeAnnouncements.slice(0, 3).map(ann => {
                const colors: Record<string, string> = { info: '#3B82F6', warning: '#F59E0B', promo: '#10B981', urgent: '#EF4444' };
                return (
                  <View key={ann.id} style={styles.annCard}>
                    <View style={[styles.annDot, { backgroundColor: colors[ann.type] || theme.primary }]} />
                    <View style={{ flex: 1 }}><Text style={styles.annTitle}>{ann.title}</Text><Text style={styles.annBody} numberOfLines={2}>{ann.body}</Text></View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>{renderSettingsGroup(t.account, accountSettings)}</Animated.View>
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>{renderSettingsGroup(t.general, generalSettings)}</Animated.View>
        <Animated.View entering={FadeInDown.duration(400).delay(400)}>{renderSettingsGroup(t.support, supportSettings)}</Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(500)}>
          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert(t.logout, t.logoutConfirm, [
                { text: t.cancel, style: 'cancel' },
                { text: t.logout, style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
              ]);
            }}
            style={styles.logoutBtn}
          >
            <MaterialIcons name="logout" size={20} color={theme.error} />
            <Text style={styles.logoutText}>{t.logout}</Text>
          </Pressable>
        </Animated.View>

        <Pressable onPress={handleLogoTap} style={styles.footer}>
          <Text style={styles.footerText}>{t.appName}</Text>
          <Text style={styles.footerVersion}>{t.version} {config.version}</Text>
          {tapCount >= 3 ? <Text style={styles.tapHint}>{5 - tapCount} نقرات متبقية...</Text> : null}
        </Pressable>
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal visible={langModalVisible} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setLangModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t.changeLanguage}</Text>
            {LANGUAGES.map(lang => (
              <Pressable
                key={lang.id}
                onPress={() => { setLanguage(lang.id as Language); setLangModalVisible(false); }}
                style={[styles.langOption, language === lang.id && styles.langOptionActive]}
              >
                <Text style={[styles.langLabel, language === lang.id && { color: theme.primary, fontWeight: '700' }]}>{lang.nativeLabel}</Text>
                <Text style={styles.langSub}>{lang.label}</Text>
                {language === lang.id ? <MaterialIcons name="check-circle" size={22} color={theme.primary} /> : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { ...typography.title, writingDirection: 'rtl', textAlign: 'right' },
  profileCard: { marginHorizontal: 20, padding: 28, backgroundColor: theme.surface, borderRadius: theme.radiusXL, alignItems: 'center', borderWidth: 1, borderColor: theme.border, marginBottom: 24 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  profileName: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  profilePhone: { ...typography.caption, marginTop: 4, writingDirection: 'rtl' },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: theme.radiusFull },
  levelText: { fontSize: 12, fontWeight: '700' },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: theme.radiusFull, marginTop: 6 },
  roleText: { fontSize: 12, fontWeight: '700' },
  profileStats: { flexDirection: 'row', marginTop: 18, width: '100%', justifyContent: 'space-around', alignItems: 'center' },
  profileStat: { alignItems: 'center', gap: 4 },
  profileStatValue: { fontSize: 17, fontWeight: '700', color: theme.textPrimary },
  profileStatLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl' },
  profileStatDivider: { width: 1, height: 36, backgroundColor: theme.border },
  statusToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, paddingHorizontal: 20, paddingVertical: 10, borderRadius: theme.radiusFull },
  statusToggleText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  settingsGroup: { marginBottom: 20, paddingHorizontal: 20 },
  groupTitle: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right', marginBottom: 8, paddingHorizontal: 4 },
  groupCard: { backgroundColor: theme.surface, borderRadius: theme.radiusLarge, overflow: 'hidden', borderWidth: 1, borderColor: theme.border },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingsIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { ...typography.body, writingDirection: 'rtl', textAlign: 'right' },
  settingsValue: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 1 },
  settingsDivider: { height: 1, backgroundColor: theme.borderLight, marginHorizontal: 14 },
  annCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, backgroundColor: theme.surface, borderRadius: theme.radiusMedium, marginBottom: 8, borderWidth: 1, borderColor: theme.border },
  annDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  annTitle: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right' },
  annBody: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2, lineHeight: 20 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, paddingVertical: 16, borderRadius: theme.radiusMedium, backgroundColor: theme.errorLight, marginTop: 12 },
  logoutText: { fontSize: 15, fontWeight: '600', color: theme.error },
  footer: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  footerText: { ...typography.caption, writingDirection: 'rtl' },
  footerVersion: { fontSize: 11, fontWeight: '600', color: theme.textMuted },
  tapHint: { fontSize: 11, fontWeight: '600', color: theme.accent, marginTop: 4, writingDirection: 'rtl' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', marginBottom: 20, writingDirection: 'rtl' },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16, borderRadius: theme.radiusMedium, marginBottom: 8, backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border },
  langOptionActive: { borderColor: theme.primary, backgroundColor: theme.primary + '12' },
  langLabel: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, flex: 1 },
  langSub: { fontSize: 13, color: theme.textMuted, marginRight: 12 },
});
