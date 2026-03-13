import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';

export default function AdminBonusesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { bonusPenalties, allDriversList, addBonusPenalty } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'bonus' | 'penalty'>('bonus');

  const handleAdd = async () => {
    if (!selectedDriver || !amount || !reason.trim()) { showAlert('خطأ', 'يرجى ملء جميع الحقول'); return; }
    const driver = allDriversList.find(d => d.id === selectedDriver);
    if (!driver) return;
    const result = await addBonusPenalty({ driver_id: selectedDriver, driver_name: driver.full_name || driver.username || '', amount: Number(amount), reason: reason.trim(), type });
    if (!result.error) { setSelectedDriver(''); setAmount(''); setReason(''); setShowForm(false); showAlert('تم', type === 'bonus' ? 'تمت إضافة المكافأة' : 'تم تطبيق الخصم'); }
    else { showAlert('خطأ', result.error); }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>المكافآت والخصومات</Text>
        <Pressable onPress={() => setShowForm(!showForm)} style={[styles.addBtn, showForm && { backgroundColor: theme.error }]}>
          <MaterialIcons name={showForm ? 'close' : 'add'} size={24} color="#FFF" />
        </Pressable>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {showForm ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.formCard}>
            <Text style={styles.formTitle}>إضافة جديدة</Text>
            <View style={styles.typeRow}>
              <Pressable onPress={() => setType('bonus')} style={[styles.typeChip, type === 'bonus' && { backgroundColor: '#D1FAE5', borderColor: theme.success }]}>
                <MaterialIcons name="emoji-events" size={16} color={type === 'bonus' ? theme.success : theme.textMuted} />
                <Text style={[styles.typeChipText, type === 'bonus' && { color: theme.success }]}>مكافأة</Text>
              </Pressable>
              <Pressable onPress={() => setType('penalty')} style={[styles.typeChip, type === 'penalty' && { backgroundColor: '#FEE2E2', borderColor: theme.error }]}>
                <MaterialIcons name="remove-circle" size={16} color={type === 'penalty' ? theme.error : theme.textMuted} />
                <Text style={[styles.typeChipText, type === 'penalty' && { color: theme.error }]}>خصم</Text>
              </Pressable>
            </View>
            <Text style={styles.label}>اختر السائق</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }} contentContainerStyle={{ gap: 8 }}>
              {allDriversList.filter(d => d.is_active).map(d => (
                <Pressable key={d.id} onPress={() => setSelectedDriver(d.id)} style={[styles.driverChip, selectedDriver === d.id && { backgroundColor: theme.primary + '15', borderColor: theme.primary }]}>
                  <Text style={[styles.driverChipText, selectedDriver === d.id && { color: theme.primary }]}>{d.full_name || d.username}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput value={amount} onChangeText={setAmount} placeholder="المبلغ (ر.س)" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="numeric" />
            <TextInput value={reason} onChangeText={setReason} placeholder="السبب..." placeholderTextColor={theme.textMuted} style={[styles.input, styles.textArea]} textAlign="right" multiline />
            <Pressable onPress={handleAdd} style={[styles.submitBtn, { backgroundColor: type === 'bonus' ? theme.success : theme.error }]}>
              <MaterialIcons name={type === 'bonus' ? 'emoji-events' : 'remove-circle'} size={18} color="#FFF" />
              <Text style={styles.submitBtnText}>{type === 'bonus' ? 'إضافة مكافأة' : 'تطبيق خصم'}</Text>
            </Pressable>
          </Animated.View>
        ) : null}
        {bonusPenalties.map((bp, i) => (
          <Animated.View key={bp.id} entering={FadeInDown.duration(250).delay(i * 40)}>
            <View style={styles.bpCard}>
              <View style={[styles.bpIcon, { backgroundColor: bp.type === 'bonus' ? '#D1FAE5' : '#FEE2E2' }]}>
                <MaterialIcons name={bp.type === 'bonus' ? 'emoji-events' : 'remove-circle'} size={22} color={bp.type === 'bonus' ? theme.success : theme.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bpName}>{bp.driver_name}</Text>
                <Text style={styles.bpReason}>{bp.reason}</Text>
                <Text style={styles.bpDate}>{new Date(bp.created_at).toLocaleDateString('ar-SA')}</Text>
              </View>
              <Text style={[styles.bpAmount, { color: bp.type === 'bonus' ? theme.success : theme.error }]}>{bp.type === 'bonus' ? '+' : '-'}{Number(bp.amount)} ر.س</Text>
            </View>
          </Animated.View>
        ))}
        {bonusPenalties.length === 0 && !showForm ? (<View style={styles.emptyState}><MaterialIcons name="emoji-events" size={64} color={theme.border} /><Text style={styles.emptyText}>لا توجد سجلات</Text></View>) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  formCard: { backgroundColor: theme.surface, borderRadius: theme.radiusLarge, padding: 16, marginBottom: 16, ...theme.shadowElevated },
  formTitle: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right', marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  typeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: theme.radiusMedium, backgroundColor: theme.backgroundSecondary, borderWidth: 1.5, borderColor: 'transparent' },
  typeChipText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
  label: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right', marginBottom: 8 },
  driverChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radiusFull, backgroundColor: theme.backgroundSecondary, borderWidth: 1.5, borderColor: 'transparent' },
  driverChipText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  input: { backgroundColor: theme.backgroundSecondary, borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.textPrimary, borderWidth: 1.5, borderColor: theme.border, marginBottom: 10, writingDirection: 'rtl' },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: theme.radiusMedium },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  bpCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: theme.surface, borderRadius: theme.radiusMedium, marginBottom: 8, ...theme.shadow },
  bpIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bpName: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right' },
  bpReason: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  bpDate: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  bpAmount: { fontSize: 16, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.caption, marginTop: 12, writingDirection: 'rtl' },
});
