import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAlert } from '@/template';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { RolePermission } from '../../services/types';
import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

interface PermissionDef {
  key: string;
  label: string;
  icon: string;
  description: string;
  adminOnly?: boolean;
}

const PERMISSIONS: PermissionDef[] = [
  { key: 'manage_supervisors', label: 'إدارة المشرفين', icon: 'shield', description: 'إضافة وتعديل وحذف المشرفين', adminOnly: true },
  { key: 'manage_drivers', label: 'إدارة الكباتن', icon: 'people', description: 'قبول/رفض الكباتن، تعديل البيانات، التفعيل/التعطيل' },
  { key: 'manage_clients', label: 'إدارة العملاء', icon: 'person-search', description: 'عرض وتعديل بيانات العملاء، الحظر' },
  { key: 'manage_trips', label: 'إدارة المشاوير', icon: 'route', description: 'إنشاء وتعديل وحذف المشاوير، تعيين السائقين' },
  { key: 'manage_pricing', label: 'إدارة التسعير', icon: 'attach-money', description: 'تعديل الأسعار والعمولات ونظام التسعير الديناميكي', adminOnly: true },
  { key: 'manage_contracts', label: 'إدارة العقود', icon: 'description', description: 'إنشاء وتعديل العقود للسائقين والعملاء' },
  { key: 'manage_announcements', label: 'إدارة الإعلانات', icon: 'campaign', description: 'نشر وحذف الإعلانات' },
  { key: 'manage_bonuses', label: 'المكافآت والخصومات', icon: 'emoji-events', description: 'إضافة مكافآت وخصومات للسائقين' },
  { key: 'view_audit_logs', label: 'سجل العمليات', icon: 'history', description: 'عرض سجل جميع الإجراءات الإدارية' },
  { key: 'manage_ai_assistant', label: 'المساعد الذكي', icon: 'smart-toy', description: 'استخدام وإعداد المساعد الذكي', adminOnly: true },
];

const ROLES = [
  { id: 'supervisor', label: 'المشرفين', color: '#3B82F6' },
  { id: 'driver', label: 'الكباتن', color: '#22C55E' },
  { id: 'client', label: 'العملاء', color: '#8B5CF6' },
];

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { userRole } = useAuth();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [selectedRole, setSelectedRole] = useState('supervisor');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  useEffect(() => { loadPermissions(); }, []);

  const loadPermissions = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('role_permissions').select('*').order('created_at', { ascending: true });
    if (!error && data) setPermissions(data);
    setLoading(false);
  };

  const getPermissionValue = (role: string, permission: string): boolean => {
    const entry = permissions.find(p => p.role === role && p.permission === permission);
    return entry ? entry.is_allowed : false;
  };

  const togglePermission = useCallback(async (role: string, permission: string) => {
    const perm = PERMISSIONS.find(p => p.key === permission);
    if (perm?.adminOnly && !isAdmin) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('غير مسموح', 'هذه الصلاحية محصورة بالمدير فقط ولا يمكن تعديلها');
      return;
    }
    setSaving(permission);
    Haptics.selectionAsync();
    const current = getPermissionValue(role, permission);
    const existing = permissions.find(p => p.role === role && p.permission === permission);
    if (existing) {
      const { error } = await supabase.from('role_permissions').update({ is_allowed: !current }).eq('id', existing.id);
      if (!error) setPermissions(prev => prev.map(p => p.id === existing.id ? { ...p, is_allowed: !current } : p));
    } else {
      const { data, error } = await supabase.from('role_permissions').insert({ role, permission, is_allowed: true }).select().single();
      if (!error && data) setPermissions(prev => [...prev, data]);
    }
    setSaving(null);
  }, [permissions, isAdmin, showAlert]);

  if (loading) {
    return (<SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={theme.primary} /></SafeAreaView>);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}><MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>إدارة الصلاحيات</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.infoBanner}>
          <MaterialIcons name="info" size={20} color={theme.primary} />
          <Text style={styles.infoBannerText}>الأسعار والعمولات والمساعد الذكي محصورة بالمدير فقط</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.roleSelector}>
          {ROLES.map(role => (
            <Pressable key={role.id} onPress={() => { setSelectedRole(role.id); Haptics.selectionAsync(); }} style={[styles.roleChip, selectedRole === role.id && { backgroundColor: role.color + '20', borderColor: role.color }]}>
              <Text style={[styles.roleChipText, selectedRole === role.id && { color: role.color }]}>{role.label}</Text>
            </Pressable>
          ))}
        </Animated.View>
        <View style={styles.permsList}>
          {PERMISSIONS.map((perm, index) => {
            const isAllowed = getPermissionValue(selectedRole, perm.key);
            const isLocked = perm.adminOnly && !isAdmin;
            const isSaving = saving === perm.key;
            return (
              <Animated.View key={perm.key} entering={FadeInDown.duration(200).delay(150 + index * 40)}>
                <View style={[styles.permRow, isLocked && styles.permRowLocked]}>
                  <View style={[styles.permIcon, { backgroundColor: (isAllowed ? theme.success : theme.textMuted) + '15' }]}>
                    <MaterialIcons name={perm.icon as any} size={20} color={isAllowed ? theme.success : theme.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.permLabelRow}>
                      <Text style={styles.permLabel}>{perm.label}</Text>
                      {perm.adminOnly ? (<View style={styles.adminBadge}><MaterialIcons name="lock" size={10} color={theme.accent} /><Text style={styles.adminBadgeText}>مدير فقط</Text></View>) : null}
                    </View>
                    <Text style={styles.permDesc}>{perm.description}</Text>
                  </View>
                  {isSaving ? <ActivityIndicator size="small" color={theme.primary} /> : (
                    <Switch value={isAllowed} onValueChange={() => togglePermission(selectedRole, perm.key)} disabled={isLocked} trackColor={{ false: theme.border, true: theme.success + '40' }} thumbColor={isAllowed ? theme.success : theme.textMuted} />
                  )}
                </View>
              </Animated.View>
            );
          })}
        </View>
        {!isAdmin ? (<View style={styles.warningBanner}><MaterialIcons name="warning" size={18} color={theme.warning} /><Text style={styles.warningText}>بعض الصلاحيات مقفلة ولا يمكن تعديلها إلا من قبل المدير</Text></View>) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 20, marginBottom: 12, padding: 14, backgroundColor: theme.primary + '10', borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: theme.primary + '25' },
  infoBannerText: { flex: 1, fontSize: 13, fontWeight: '500', color: theme.primary, writingDirection: 'rtl', textAlign: 'right' },
  roleSelector: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  roleChip: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: theme.radiusMedium, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border },
  roleChipText: { fontSize: 14, fontWeight: '700', color: theme.textMuted },
  permsList: { paddingHorizontal: 20, gap: 8 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: theme.border },
  permRowLocked: { opacity: 0.6 },
  permIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  permLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  permLabel: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right' },
  permDesc: { fontSize: 11, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: theme.accent + '15' },
  adminBadgeText: { fontSize: 9, fontWeight: '700', color: theme.accent },
  warningBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 20, padding: 14, backgroundColor: theme.warningLight, borderRadius: theme.radiusMedium },
  warningText: { flex: 1, fontSize: 12, fontWeight: '500', color: theme.warning, writingDirection: 'rtl', textAlign: 'right' },
});
