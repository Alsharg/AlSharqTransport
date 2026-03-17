import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../constants/theme';
import { getSupabaseClient } from '@/template';
import { Contract, getContractStatusLabel, getContractStatusColor } from '../../services/types';
import { useAuth } from '../../hooks/useAuth';

const CONTRACT_TYPES = [
  { id: 'employment', label: 'عقد وظيفي', icon: 'badge', color: '#3B82F6' },
  { id: 'client', label: 'عقد عميل', icon: 'person', color: '#8B5CF6' },
  { id: 'service', label: 'عقد خدمة', icon: 'handyman', color: '#22C55E' },
];

export default function ContractsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'employment', content: '', start_date: '', end_date: '', monthly_amount: '' });

  const supabase = getSupabaseClient();

  const loadContracts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
    setContracts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  const handleSave = async () => {
    if (!form.title.trim()) { showAlert('خطأ', 'يرجى إدخال عنوان العقد'); return; }
    const { error } = await supabase.from('contracts').insert({
      title: form.title.trim(), type: form.type, content: form.content.trim(),
      start_date: form.start_date || null, end_date: form.end_date || null,
      monthly_amount: parseFloat(form.monthly_amount) || 0,
      user_id: user?.id, created_by: user?.id, status: 'draft',
    });
    if (error) { showAlert('خطأ', error.message); return; }
    setShowForm(false); setForm({ title: '', type: 'employment', content: '', start_date: '', end_date: '', monthly_amount: '' });
    loadContracts(); showAlert('تم', 'تم إنشاء العقد');
  };

  const updateStatus = async (contractId: string, status: string) => {
    await supabase.from('contracts').update({ status, updated_at: new Date().toISOString() }).eq('id', contractId);
    loadContracts();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>إدارة العقود</Text>
        <Pressable onPress={() => setShowForm(true)} style={styles.addBtn}><MaterialIcons name="add" size={24} color="#FFF" /></Pressable>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={theme.accent} /></View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          {contracts.length === 0 ? (
            <View style={styles.emptyState}><MaterialIcons name="description" size={64} color={theme.border} /><Text style={styles.emptyText}>لا توجد عقود</Text></View>
          ) : contracts.map((contract, index) => {
            const statusColor = getContractStatusColor(contract.status);
            const typeInfo = CONTRACT_TYPES.find(t => t.id === contract.type) || CONTRACT_TYPES[0];
            return (
              <Animated.View key={contract.id} entering={FadeInDown.duration(200).delay(index * 40)}>
                <View style={styles.contractCard}>
                  <View style={styles.contractTop}>
                    <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '15' }]}>
                      <MaterialIcons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contractTitle}>{contract.title}</Text>
                      <Text style={styles.contractType}>{typeInfo.label}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusText, { color: statusColor }]}>{getContractStatusLabel(contract.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.contractMeta}>
                    {contract.monthly_amount ? <View style={styles.metaItem}><MaterialIcons name="payments" size={14} color={theme.accent} /><Text style={[styles.metaText, { color: theme.accent }]}>{contract.monthly_amount} ر.س/شهر</Text></View> : null}
                    {contract.start_date ? <View style={styles.metaItem}><MaterialIcons name="date-range" size={14} color={theme.textMuted} /><Text style={styles.metaText}>{contract.start_date}{contract.end_date ? ` → ${contract.end_date}` : ''}</Text></View> : null}
                  </View>
                  <View style={styles.contractActions}>
                    {contract.status === 'draft' ? (
                      <Pressable onPress={() => updateStatus(contract.id, 'active')} style={[styles.actionBtn, { backgroundColor: theme.success + '15' }]}>
                        <MaterialIcons name="check-circle" size={16} color={theme.success} /><Text style={[styles.actionText, { color: theme.success }]}>تفعيل</Text>
                      </Pressable>
                    ) : contract.status === 'active' ? (
                      <Pressable onPress={() => updateStatus(contract.id, 'terminated')} style={[styles.actionBtn, { backgroundColor: theme.error + '15' }]}>
                        <MaterialIcons name="cancel" size={16} color={theme.error} /><Text style={[styles.actionText, { color: theme.error }]}>إنهاء</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={showForm} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowForm(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>عقد جديد</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>عنوان العقد *</Text>
              <TextInput value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} placeholder="عنوان العقد" placeholderTextColor={theme.textMuted} style={styles.formInput} textAlign="right" />
              <Text style={styles.formLabel}>نوع العقد</Text>
              <View style={styles.typesRow}>
                {CONTRACT_TYPES.map(type => (
                  <Pressable key={type.id} onPress={() => setForm(p => ({ ...p, type: type.id }))} style={[styles.typeChip, form.type === type.id && { borderColor: type.color, backgroundColor: type.color + '10' }]}>
                    <MaterialIcons name={type.icon as any} size={18} color={form.type === type.id ? type.color : theme.textMuted} />
                    <Text style={[styles.typeChipText, form.type === type.id && { color: type.color }]}>{type.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.formLabel}>المبلغ الشهري</Text>
              <TextInput value={form.monthly_amount} onChangeText={v => setForm(p => ({ ...p, monthly_amount: v }))} placeholder="0" placeholderTextColor={theme.textMuted} style={styles.formInput} textAlign="right" keyboardType="numeric" />
              <Text style={styles.formLabel}>تاريخ البداية</Text>
              <TextInput value={form.start_date} onChangeText={v => setForm(p => ({ ...p, start_date: v }))} placeholder="2026-01-01" placeholderTextColor={theme.textMuted} style={styles.formInput} textAlign="right" />
              <Text style={styles.formLabel}>تاريخ النهاية</Text>
              <TextInput value={form.end_date} onChangeText={v => setForm(p => ({ ...p, end_date: v }))} placeholder="2027-01-01" placeholderTextColor={theme.textMuted} style={styles.formInput} textAlign="right" />
              <Text style={styles.formLabel}>تفاصيل العقد</Text>
              <TextInput value={form.content} onChangeText={v => setForm(p => ({ ...p, content: v }))} placeholder="بنود العقد..." placeholderTextColor={theme.textMuted} style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]} textAlign="right" multiline />
              <Pressable onPress={handleSave} style={styles.saveBtn}><Text style={styles.saveBtnText}>إنشاء العقد</Text></Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contractCard: { marginHorizontal: 20, marginTop: 14, padding: 18, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  contractTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  typeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contractTitle: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right' },
  contractType: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radiusFull },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  contractMeta: { gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.borderLight, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  contractActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.radiusMedium },
  actionText: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.caption, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 32, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalTitle: { ...typography.subtitle, writingDirection: 'rtl', textAlign: 'center', marginBottom: 16 },
  formLabel: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right', marginTop: 14, marginBottom: 6 },
  formInput: { backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border, borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl' },
  typesRow: { flexDirection: 'row', gap: 8 },
  typeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: theme.radiusMedium, borderWidth: 1.5, borderColor: theme.border, backgroundColor: theme.surfaceElevated },
  typeChipText: { fontSize: 12, fontWeight: '600', color: theme.textMuted },
  saveBtn: { backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.radiusMedium, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
