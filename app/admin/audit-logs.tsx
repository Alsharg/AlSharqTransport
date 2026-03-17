import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../constants/theme';
import { getSupabaseClient } from '@/template';
import { AuditLog, getRoleLabel, getRoleColor } from '../../services/types';

const ACTION_ICONS: Record<string, string> = {
  approve_driver: 'check-circle', reject_driver: 'cancel', toggle_driver: 'toggle-on',
  create_trip: 'add-circle', update_trip: 'edit', delete_trip: 'delete',
  confirm_trip: 'handshake', cancel_trip: 'block', archive_trip: 'archive',
  approve_topup: 'account-balance-wallet', reject_topup: 'money-off',
  create_announcement: 'campaign', bonus: 'emoji-events', penalty: 'gavel',
  promote_driver: 'upgrade', login: 'login', logout: 'logout',
};

const ACTION_COLORS: Record<string, string> = {
  approve_driver: '#22C55E', reject_driver: '#EF4444', toggle_driver: '#F59E0B',
  create_trip: '#3B82F6', update_trip: '#8B5CF6', delete_trip: '#EF4444',
  confirm_trip: '#14B8A6', cancel_trip: '#EF4444', archive_trip: '#64748B',
  approve_topup: '#22C55E', reject_topup: '#EF4444',
  create_announcement: '#F59E0B', bonus: '#22C55E', penalty: '#EF4444',
  promote_driver: '#3B82F6', login: '#3B82F6', logout: '#64748B',
};

export default function AuditLogsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    setLogs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('ar-SA')} ${d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>سجل العمليات</Text>
        <Pressable onPress={loadLogs} style={styles.refreshBtn}><MaterialIcons name="refresh" size={22} color={theme.primary} /></Pressable>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={theme.accent} /></View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          {logs.length === 0 ? (
            <View style={styles.emptyState}><MaterialIcons name="history" size={64} color={theme.border} /><Text style={styles.emptyText}>لا توجد عمليات مسجلة</Text></View>
          ) : logs.map((log, index) => {
            const iconName = ACTION_ICONS[log.action] || 'info';
            const color = ACTION_COLORS[log.action] || theme.textMuted;
            const roleColor = getRoleColor(log.actor_role);
            return (
              <Animated.View key={log.id} entering={FadeInDown.duration(200).delay(index * 20)}>
                <View style={styles.logCard}>
                  <View style={[styles.logIcon, { backgroundColor: color + '15' }]}>
                    <MaterialIcons name={iconName as any} size={20} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logAction}>{log.action.replace(/_/g, ' ')}</Text>
                    <View style={styles.logMeta}>
                      <View style={[styles.roleChip, { backgroundColor: roleColor + '15' }]}>
                        <Text style={[styles.roleChipText, { color: roleColor }]}>{getRoleLabel(log.actor_role)}</Text>
                      </View>
                      <Text style={styles.logActor}>{log.actor_name}</Text>
                    </View>
                    {log.target_type ? <Text style={styles.logTarget}>{log.target_type}{log.target_id ? `: ${log.target_id.substring(0, 8)}...` : ''}</Text> : null}
                    <Text style={styles.logTime}>{formatDate(log.created_at)}</Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  refreshBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logCard: { flexDirection: 'row', gap: 14, marginHorizontal: 20, marginTop: 12, padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: theme.border },
  logIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logAction: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right', textTransform: 'capitalize' },
  logMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  roleChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleChipText: { fontSize: 10, fontWeight: '700' },
  logActor: { fontSize: 12, fontWeight: '500', color: theme.textSecondary },
  logTarget: { fontSize: 11, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  logTime: { fontSize: 11, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.caption, marginTop: 12 },
});
