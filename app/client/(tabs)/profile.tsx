import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../../constants/theme';
import { useAuth } from '../../../hooks/useAuth';
import { useApp } from '../../../contexts/AppContext';
import { config } from '../../../constants/config';
import { ADMIN_WHATSAPP } from '../../../constants/i18n';

export default function ClientProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { trips, notifications } = useApp();

  const myTripsCount = trips.filter(t => t.created_by === user?.id).length;

  const menuItems = [
    { id: '1', icon: 'person', label: 'تعديل الملف الشخصي', route: '/edit-profile', color: '#8B5CF6' },
    { id: '2', icon: 'notifications-none', label: 'الإشعارات', route: '/notifications', color: '#F59E0B' },
    { id: '3', icon: 'chat-bubble-outline', label: 'محادثة مع الإدارة', route: '/chat', color: '#3B82F6' },
    { id: 'wa', icon: 'chat', label: 'واتساب الإدارة', route: '', color: '#25D366', isWhatsApp: true },
    { id: '4', icon: 'info-outline', label: 'عن التطبيق', route: '', color: theme.textMuted },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: '#8B5CF6' + '20' }]}>
            <MaterialIcons name="person" size={40} color="#8B5CF6" />
          </View>
          <Text style={styles.name}>{user?.full_name || user?.username || 'عميل'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: '#8B5CF6' + '20' }]}>
            <MaterialIcons name="verified" size={14} color="#8B5CF6" />
            <Text style={[styles.roleText, { color: '#8B5CF6' }]}>عميل</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={styles.statValue}>{myTripsCount}</Text><Text style={styles.statLabel}>مشوار</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.stat}><Text style={styles.statValue}>5.0</Text><Text style={styles.statLabel}>التقييم</Text></View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.menuGroup}>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (item.isWhatsApp) Linking.openURL(`https://wa.me/${ADMIN_WHATSAPP}`).catch(() => {});
                    else if (item.route) router.push(item.route as any);
                  }}
                  style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: theme.backgroundSecondary }]}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '12' }]}>
                    <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <MaterialIcons name="chevron-left" size={22} color={theme.textMuted} />
                </Pressable>
                {index < menuItems.length - 1 ? <View style={styles.menuDivider} /> : null}
              </React.Fragment>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'خروج', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
              ]);
            }}
            style={styles.logoutBtn}
          >
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
  profileCard: { margin: 20, padding: 28, backgroundColor: theme.surface, borderRadius: theme.radiusXL, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  email: { ...typography.caption, marginTop: 4 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: theme.radiusFull },
  roleText: { fontSize: 13, fontWeight: '700' },
  statsRow: { flexDirection: 'row', marginTop: 20, width: '100%', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted },
  statDivider: { width: 1, height: 36, backgroundColor: theme.border },
  menuGroup: { paddingHorizontal: 20, marginBottom: 20 },
  menuCard: { backgroundColor: theme.surface, borderRadius: theme.radiusLarge, overflow: 'hidden', borderWidth: 1, borderColor: theme.border },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: theme.textSecondary, writingDirection: 'rtl', textAlign: 'right' },
  menuDivider: { height: 1, backgroundColor: theme.borderLight, marginHorizontal: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, paddingVertical: 16, borderRadius: theme.radiusMedium, backgroundColor: theme.errorLight },
  logoutText: { fontSize: 15, fontWeight: '600', color: theme.error },
  footer: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  footerText: { ...typography.caption },
  footerVersion: { fontSize: 11, fontWeight: '600', color: theme.textMuted },
});
