import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { Linking } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../constants/theme';
import { getSupabaseClient } from '@/template';
import { UserProfile } from '../../services/types';
import * as api from '../../services/api';
import { ADMIN_WHATSAPP } from '../../constants/i18n';

export default function AdminClientsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClients = useCallback(async () => {
    setLoading(true);
    const data = await api.fetchAllProfiles('client');
    setClients(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const handleToggle = (client: UserProfile) => {
    const action = client.is_active ? 'حظر' : 'تفعيل';
    showAlert(`${action} العميل`, `${action} ${client.full_name || client.username}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: action, style: client.is_active ? 'destructive' : 'default', onPress: async () => {
        await api.updateUserProfile(client.id, { is_active: !client.is_active });
        loadClients();
      }},
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>إدارة العملاء</Text>
        <View style={styles.countBadge}><Text style={styles.countText}>{clients.length}</Text></View>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={theme.accent} /></View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          {clients.length === 0 ? (
            <View style={styles.emptyState}><MaterialIcons name="people-outline" size={64} color={theme.border} /><Text style={styles.emptyText}>لا يوجد عملاء مسجلون</Text></View>
          ) : clients.map((client, index) => (
            <Animated.View key={client.id} entering={FadeInDown.duration(200).delay(index * 40)}>
              <View style={[styles.clientCard, !client.is_active && { opacity: 0.6 }]}>
                <View style={styles.clientTop}>
                  <View style={[styles.avatar, { backgroundColor: '#8B5CF6' + '15' }]}>
                    <MaterialIcons name="person" size={24} color="#8B5CF6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientName}>{client.full_name || client.username || 'بدون اسم'}</Text>
                    <Text style={styles.clientEmail}>{client.email}</Text>
                    {client.phone ? <Text style={styles.clientPhone}>{client.phone}</Text> : null}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: client.is_active ? theme.success + '15' : theme.error + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: client.is_active ? theme.success : theme.error }]} />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: client.is_active ? theme.success : theme.error }}>{client.is_active ? 'نشط' : 'محظور'}</Text>
                  </View>
                </View>
                <View style={styles.clientMeta}>
                  <Text style={styles.clientMetaText}>تسجيل: {new Date(client.created_at).toLocaleDateString('ar-SA')}</Text>
                </View>
                <View style={styles.actions}>
                  <Pressable onPress={() => router.push({ pathname: '/admin/chat', params: { driverId: client.id, driverName: client.full_name || '' } })} style={[styles.actionBtn, { backgroundColor: '#3B82F6' + '15' }]}>
                    <MaterialIcons name="chat" size={16} color="#3B82F6" /><Text style={[styles.actionText, { color: '#3B82F6' }]}>محادثة</Text>
                  </Pressable>
                  {client.phone ? (
                    <Pressable onPress={() => Linking.openURL(`https://wa.me/${client.phone?.replace(/^0/, '966')}`).catch(() => {})} style={[styles.actionBtn, { backgroundColor: '#064E3B' }]}>
                      <MaterialIcons name="chat" size={16} color="#25D366" /><Text style={[styles.actionText, { color: '#25D366' }]}>واتساب</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => handleToggle(client)} style={[styles.actionBtn, { backgroundColor: client.is_active ? theme.errorLight : theme.successLight }]}>
                    <MaterialIcons name={client.is_active ? 'block' : 'check-circle'} size={16} color={client.is_active ? theme.error : theme.success} />
                    <Text style={[styles.actionText, { color: client.is_active ? theme.error : theme.success }]}>{client.is_active ? 'حظر' : 'تفعيل'}</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          ))}
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
  countBadge: { backgroundColor: '#8B5CF6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  countText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  clientCard: { marginHorizontal: 20, marginTop: 14, padding: 18, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  clientTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  clientName: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right' },
  clientEmail: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  clientPhone: { fontSize: 12, color: theme.textSecondary, writingDirection: 'rtl', textAlign: 'right', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radiusFull },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  clientMeta: { marginBottom: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.borderLight },
  clientMetaText: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.radiusMedium },
  actionText: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.caption, marginTop: 12 },
});
