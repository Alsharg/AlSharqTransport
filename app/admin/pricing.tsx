import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../constants/theme';
import { getSupabaseClient } from '@/template';
import { PricingConfig, getTripTypeLabel } from '../../services/types';
import { useAuth } from '../../hooks/useAuth';

export default function PricingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { userRole } = useAuth();
  const [configs, setConfigs] = useState<PricingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', base_price: '', price_per_km: '', surge_multiplier: '1.0', min_price: '', city: '', trip_type: 'private' });

  const supabase = getSupabaseClient();
  const isAdmin = userRole === 'admin';

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('pricing_config').select('*').order('created_at', { ascending: false });
    setConfigs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  const resetForm = () => { setForm({ name: '', base_price: '', price_per_km: '', surge_multiplier: '1.0', min_price: '', city: '', trip_type: 'private' }); setEditId(null); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.base_price) { showAlert('خطأ', 'يرجى ملء الحقول الإلزامية'); return; }
    const payload = {
      name: form.name.trim(), base_price: parseFloat(form.base_price) || 0,
      price_per_km: parseFloat(form.price_per_km) || 0, surge_multiplier: parseFloat(form.surge_multiplier) || 1,
      min_price: parseFloat(form.min_price) || 0, city: form.city.trim(), trip_type: form.trip_type,
    };
    if (editId) {
      const { error } = await supabase.from('pricing_config').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId);
      if (error) { showAlert('خطأ', error.message); return; }
    } else {
      const { error } = await supabase.from('pricing_config').insert(payload);
      if (error) { showAlert('خطأ', error.message); return; }
    }
    setShowForm(false); resetForm(); loadConfigs();
    showAlert('تم', editId ? 'تم تحديث التسعيرة' : 'تم إضافة التسعيرة');
  };

  const handleEdit = (config: PricingConfig) => {
    setForm({
      name: config.name, base_price: String(config.base_price), price_per_km: String(config.price_per_km),
      surge_multiplier: String(config.surge_multiplier), min_price: String(config.min_price),
      city: config.city || '', trip_type: config.trip_type || 'private',
    });
    setEditId(config.id); setShowForm(true);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>التسعير الديناميكي</Text>
        {isAdmin ? <Pressable onPress={() => { resetForm(); setShowForm(true); }} style={styles.addBtn}><MaterialIcons name="add" size={24} color="#FFF" /></Pressable> : <View style={{ width: 44 }} />}
      </View>

      {!isAdmin ? (
        <View style={styles.restrictedBanner}>
          <MaterialIcons name="lock" size={18} color={theme.accent} />
          <Text style={styles.restrictedText}>التسعير يُعدّل بواسطة المدير فقط</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={theme.accent} /></View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          {configs.length === 0 ? (
            <View style={styles.emptyState}><MaterialIcons name="attach-money" size={64} color={theme.border} /><Text style={styles.emptyText}>لا توجد قواعد تسعير</Text></View>
          ) : configs.map((config, index) => (
            <Animated.View key={config.id} entering={FadeInDown.duration(200).delay(index * 40)}>
              <View style={styles.priceCard}>
                <View style={styles.priceTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.priceName}>{config.name}</Text>
                    <View style={styles.priceChips}>
                      {config.city ? <View style={styles.chip}><MaterialIcons name="location-city" size={12} color={theme.textMuted} /><Text style={styles.chipText}>{config.city}</Text></View> : null}
                      <View style={styles.chip}><MaterialIcons name="route" size={12} color={theme.textMuted} /><Text style={styles.chipText}>{getTripTypeLabel(config.trip_type as any)}</Text></View>
                    </View>
                  </View>
                  <View style={[styles.activeIndicator, { backgroundColor: config.is_active ? theme.success + '20' : theme.error + '20' }]}>
                    <View style={[styles.activeDot, { backgroundColor: config.is_active ? theme.success : theme.error }]} />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: config.is_active ? theme.success : theme.error }}>{config.is_active ? 'نشط' : 'معطل'}</Text>
                  </View>
                </View>
                <View style={styles.priceGrid}>
                  <View style={styles.priceItem}><Text style={styles.priceItemLabel}>السعر الأساسي</Text><Text style={styles.priceItemValue}>{config.base_price} ر.س</Text></View>
                  <View style={styles.priceItem}><Text style={styles.priceItemLabel}>سعر الكيلومتر</Text><Text style={styles.priceItemValue}>{config.price_per_km} ر.س</Text></View>
                  <View style={styles.priceItem}><Text style={styles.priceItemLabel}>معامل الذروة</Text><Text style={styles.priceItemValue}>x{config.surge_multiplier}</Text></View>
                  <View style={styles.priceItem}><Text style={styles.priceItemLabel}>الحد الأدنى</Text><Text style={styles.priceItemValue}>{config.min_price} ر.س</Text></View>
                </View>
                {isAdmin ? (
                  <Pressable onPress={() => handleEdit(config)} style={styles.editBtn}>
                    <MaterialIcons name="edit" size={16} color={theme.primary} /><Text style={styles.editBtnText}>تعديل</Text>
                  </Pressable>
                ) : null}
              </View>
            </Animated.View>
          ))}
        </ScrollView>
      )}

      <Modal visible={showForm} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowForm(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editId ? 'تعديل التسعيرة' : 'تسعيرة جديدة'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>اسم التسعيرة *</Text>
              <TextInput value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="مثال: تسعيرة الدمام" placeholderTextColor={theme.textMuted} style={styles.formInput} textAlign="right" />
              <Text style={styles.formLabel}>السعر الأساسي *</Text>
              <TextInput value={form.base_price} onChangeText={v => setForm(p => ({ ...p, base_price: v }))} placeholder="0" placeholderTextColor={theme.textMuted} style={styles.formInput} textAlign="right" keyboardType="numeric" />
              <Text style={styles.formLabel}>سعر الكيلومتر</Text>
              <TextInput value={form.price_per_km} onChangeText={v => setForm(p => ({ ...p, price_per_km: v }))} placeholder="0" placeholderTextColor={theme.textMuted} style={styles.formInput} textAlign="right" keyboardType="numeric" />
              <Text style={styles.formLabel}>معامل الذروة</Text>
              <TextInput value={form.surge_multiplier} onChangeText={v => setForm(p => ({ ...p, surge_multiplier: v }))} placeholder="1.0" placeholderTextColor={theme.textMuted} style={styles.formInput} textAlign="right" keyboardType="numeric" />
              <Text style={styles.formLabel}>الحد الأدنى للسعر</Text>
              <TextInput value={form.min_price} onChangeText={v => setForm(p => ({ ...p, min_price: v }))} placeholder="0" placeholderTextColor={theme.textMuted} style={styles.formInput} textAlign="right" keyboardType="numeric" />
              <Text style={styles.formLabel}>المدينة</Text>
              <TextInput value={form.city} onChangeText={v => setForm(p => ({ ...p, city: v }))} placeholder="الدمام" placeholderTextColor={theme.textMuted} style={styles.formInput} textAlign="right" />
              <Pressable onPress={handleSave} style={styles.saveBtn}><Text style={styles.saveBtnText}>حفظ</Text></Pressable>
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
  restrictedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginTop: 12, padding: 12, backgroundColor: theme.accent + '10', borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: theme.accent + '30' },
  restrictedText: { fontSize: 13, fontWeight: '600', color: theme.accent, writingDirection: 'rtl' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  priceCard: { marginHorizontal: 20, marginTop: 14, padding: 18, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  priceTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  priceName: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right' },
  priceChips: { flexDirection: 'row', gap: 6, marginTop: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: theme.backgroundSecondary, borderRadius: theme.radiusFull },
  chipText: { fontSize: 11, color: theme.textSecondary },
  activeIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radiusFull },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  priceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  priceItem: { width: '47%', flexGrow: 1, padding: 12, backgroundColor: theme.backgroundSecondary, borderRadius: theme.radiusMedium },
  priceItemLabel: { fontSize: 11, fontWeight: '500', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right' },
  priceItemValue: { fontSize: 16, fontWeight: '700', color: theme.accent, writingDirection: 'rtl', textAlign: 'right', marginTop: 4 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 10, borderRadius: theme.radiusMedium, backgroundColor: theme.primary + '15', borderWidth: 1, borderColor: theme.primary + '30' },
  editBtnText: { fontSize: 13, fontWeight: '600', color: theme.primary },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.caption, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 32, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalTitle: { ...typography.subtitle, writingDirection: 'rtl', textAlign: 'center', marginBottom: 16 },
  formLabel: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right', marginTop: 14, marginBottom: 6 },
  formInput: { backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border, borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl' },
  saveBtn: { backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.radiusMedium, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
