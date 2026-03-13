import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { Announcement } from '../../services/types';

const ANN_TYPES: { id: Announcement['type']; label: string; icon: string; color: string }[] = [
  { id: 'info', label: 'معلومات', icon: 'info', color: '#3B82F6' },
  { id: 'warning', label: 'تنبيه', icon: 'warning', color: '#F59E0B' },
  { id: 'promo', label: 'عرض', icon: 'local-offer', color: '#10B981' },
  { id: 'urgent', label: 'عاجل', icon: 'priority-high', color: '#EF4444' },
];

export default function AdminAnnouncementsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { announcements, addAnnouncement, removeAnnouncement, toggleAnnouncement } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<Announcement['type']>('info');

  const handleAdd = async () => {
    if (!title.trim() || !body.trim()) { showAlert('خطأ', 'يرجى ملء العنوان والمحتوى'); return; }
    const result = await addAnnouncement({ title: title.trim(), body: body.trim(), type, is_active: true });
    if (!result.error) { setTitle(''); setBody(''); setType('info'); setShowForm(false); showAlert('تم النشر', 'تم نشر الإعلان بنجاح'); }
    else { showAlert('خطأ', result.error); }
  };

  const handleDelete = (id: string) => {
    showAlert('حذف الإعلان', 'هل تريد حذف هذا الإعلان؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => removeAnnouncement(id) },
    ]);
  };

  const getTypeConfig = (t: Announcement['type']) => ANN_TYPES.find(at => at.id === t) || ANN_TYPES[0];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>الإعلانات</Text>
        <Pressable onPress={() => setShowForm(!showForm)} style={[styles.addBtn, showForm && { backgroundColor: theme.error }]}>
          <MaterialIcons name={showForm ? 'close' : 'add'} size={24} color="#FFF" />
        </Pressable>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {showForm ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.formCard}>
            <Text style={styles.formTitle}>إعلان جديد</Text>
            <View style={styles.typeRow}>
              {ANN_TYPES.map(t => (
                <Pressable key={t.id} onPress={() => setType(t.id)} style={[styles.typeChip, type === t.id && { backgroundColor: t.color + '15', borderColor: t.color }]}>
                  <MaterialIcons name={t.icon as any} size={16} color={type === t.id ? t.color : theme.textMuted} />
                  <Text style={[styles.typeChipText, type === t.id && { color: t.color }]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput value={title} onChangeText={setTitle} placeholder="عنوان الإعلان" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
            <TextInput value={body} onChangeText={setBody} placeholder="محتوى الإعلان..." placeholderTextColor={theme.textMuted} style={[styles.input, styles.textArea]} textAlign="right" multiline numberOfLines={3} />
            <Pressable onPress={handleAdd} style={styles.publishBtn}><MaterialIcons name="send" size={18} color="#FFF" /><Text style={styles.publishBtnText}>نشر الإعلان</Text></Pressable>
          </Animated.View>
        ) : null}
        {announcements.map((ann, i) => {
          const cfg = getTypeConfig(ann.type);
          return (
            <Animated.View key={ann.id} entering={FadeInDown.duration(250).delay(i * 40)}>
              <View style={[styles.annCard, !ann.is_active && { opacity: 0.5 }]}>
                <View style={styles.annTop}>
                  <View style={[styles.annIcon, { backgroundColor: cfg.color + '15' }]}><MaterialIcons name={cfg.icon as any} size={22} color={cfg.color} /></View>
                  <View style={{ flex: 1 }}><Text style={styles.annTitle}>{ann.title}</Text><Text style={styles.annDate}>{new Date(ann.created_at).toLocaleDateString('ar-SA')}</Text></View>
                  <View style={[styles.annTypeBadge, { backgroundColor: cfg.color + '15' }]}><Text style={[styles.annTypeText, { color: cfg.color }]}>{cfg.label}</Text></View>
                </View>
                <Text style={styles.annBody}>{ann.body}</Text>
                <View style={styles.annActions}>
                  <Pressable onPress={() => toggleAnnouncement(ann.id)} style={[styles.annActionBtn, { backgroundColor: ann.is_active ? '#FEF3C7' : '#D1FAE5' }]}>
                    <MaterialIcons name={ann.is_active ? 'visibility-off' : 'visibility'} size={14} color={ann.is_active ? '#D97706' : theme.success} />
                    <Text style={[styles.annActionText, { color: ann.is_active ? '#D97706' : theme.success }]}>{ann.is_active ? 'إخفاء' : 'إظهار'}</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(ann.id)} style={[styles.annActionBtn, { backgroundColor: theme.errorLight }]}>
                    <MaterialIcons name="delete" size={14} color={theme.error} /><Text style={[styles.annActionText, { color: theme.error }]}>حذف</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          );
        })}
        {announcements.length === 0 && !showForm ? (<View style={styles.emptyState}><MaterialIcons name="campaign" size={64} color={theme.border} /><Text style={styles.emptyText}>لا توجد إعلانات</Text></View>) : null}
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
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: theme.radiusFull, backgroundColor: theme.backgroundSecondary, borderWidth: 1.5, borderColor: 'transparent' },
  typeChipText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
  input: { backgroundColor: theme.backgroundSecondary, borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.textPrimary, borderWidth: 1.5, borderColor: theme.border, marginBottom: 10, writingDirection: 'rtl' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  publishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, paddingVertical: 14, borderRadius: theme.radiusMedium },
  publishBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  annCard: { marginBottom: 12, padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, ...theme.shadow },
  annTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  annIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  annTitle: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right' },
  annDate: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  annTypeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radiusFull },
  annTypeText: { fontSize: 11, fontWeight: '700' },
  annBody: { ...typography.body, writingDirection: 'rtl', textAlign: 'right', lineHeight: 22, marginBottom: 10 },
  annActions: { flexDirection: 'row', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.borderLight },
  annActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: theme.radiusSmall },
  annActionText: { fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.caption, marginTop: 12, writingDirection: 'rtl' },
});
