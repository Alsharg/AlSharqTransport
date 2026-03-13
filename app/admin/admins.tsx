import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { UserProfile } from '../../services/types';

export default function AdminManageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { allDriversList } = useApp();

  // Get admins and supervisors from the database
  const [admins, setAdmins] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadAdmins = async () => {
      const { fetchAllProfiles } = require('../../services/api');
      const adminProfiles = await fetchAllProfiles('admin');
      const supervisorProfiles = await fetchAllProfiles('supervisor');
      setAdmins([...adminProfiles, ...supervisorProfiles]);
      setLoading(false);
    };
    loadAdmins();
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>إدارة المشرفين</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        <View style={styles.noteBox}>
          <MaterialIcons name="info-outline" size={18} color={theme.primary} />
          <Text style={styles.noteText}>لإضافة مشرف جديد، استخدم صفحة "تسجيل حساب إداري" من شاشة تسجيل الدخول.</Text>
        </View>

        {admins.map((admin, index) => (
          <Animated.View key={admin.id} entering={FadeInDown.duration(300).delay(index * 60)}>
            <View style={[styles.adminCard, !admin.is_active && { opacity: 0.65 }]}>
              <View style={styles.adminTop}>
                <View style={[styles.avatarCircle, { backgroundColor: admin.role === 'admin' ? '#FEF3C7' : theme.primary + '15' }]}>
                  <MaterialIcons name={admin.role === 'admin' ? 'shield' : 'admin-panel-settings'} size={24} color={admin.role === 'admin' ? '#F59E0B' : theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adminName}>{admin.full_name || admin.username || 'بدون اسم'}</Text>
                  <Text style={styles.adminEmail}>{admin.email}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: admin.role === 'admin' ? '#FEF3C7' : '#EFF6FF' }]}>
                  <Text style={[styles.roleText, { color: admin.role === 'admin' ? '#D97706' : '#3B82F6' }]}>
                    {admin.role === 'admin' ? 'مدير' : 'مشرف'}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={14} color={theme.textMuted} />
                <Text style={styles.infoText}>{admin.phone || 'غير محدد'}</Text>
                <MaterialIcons name="circle" size={4} color={theme.textMuted} style={{ marginHorizontal: 8 }} />
                <MaterialIcons name={admin.is_active ? 'check-circle' : 'cancel'} size={14} color={admin.is_active ? theme.success : theme.error} />
                <Text style={[styles.infoText, { color: admin.is_active ? theme.success : theme.error }]}>{admin.is_active ? 'نشط' : 'معطل'}</Text>
              </View>
            </View>
          </Animated.View>
        ))}

        {admins.length === 0 && !loading ? (
          <View style={styles.emptyState}><MaterialIcons name="admin-panel-settings" size={64} color={theme.border} /><Text style={styles.emptyText}>لا يوجد مشرفون</Text></View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  noteBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#EFF6FF', borderRadius: theme.radiusMedium, marginBottom: 16, borderWidth: 1, borderColor: '#BFDBFE' },
  noteText: { ...typography.caption, color: theme.primary, flex: 1, writingDirection: 'rtl', textAlign: 'right', lineHeight: 20 },
  adminCard: { marginBottom: 12, padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, ...theme.shadowElevated },
  adminTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  adminName: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right' },
  adminEmail: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radiusFull },
  roleText: { fontSize: 11, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.borderLight },
  infoText: { ...typography.caption },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.caption, marginTop: 12 },
});
