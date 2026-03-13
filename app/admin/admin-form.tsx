import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { theme, typography } from '../../constants/theme';

interface AdminPermission {
  manageDrivers: boolean;
  manageTrips: boolean;
  viewEarnings: boolean;
  manageAdmins: boolean;
  promoteDrivers: boolean;
}

const PERMISSION_OPTIONS: { key: keyof AdminPermission; label: string; icon: string; desc: string }[] = [
  { key: 'manageDrivers', label: 'إدارة السائقين', icon: 'people', desc: 'تفعيل وتعطيل ومراجعة السائقين' },
  { key: 'manageTrips', label: 'إدارة المشاوير', icon: 'route', desc: 'إنشاء وتعديل وحذف وأرشفة المشاوير' },
  { key: 'viewEarnings', label: 'عرض الأرباح', icon: 'account-balance-wallet', desc: 'مشاهدة تقارير الأرباح والعمولات' },
  { key: 'manageAdmins', label: 'إدارة المشرفين', icon: 'admin-panel-settings', desc: 'إضافة وتعديل وإزالة المشرفين' },
  { key: 'promoteDrivers', label: 'ترقية السائقين', icon: 'upgrade', desc: 'ترقية السائقين إلى مشرفين' },
];

export default function AdminFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<AdminPermission>({
    manageDrivers: true, manageTrips: true, viewEarnings: true, manageAdmins: false, promoteDrivers: false,
  });

  const togglePermission = (key: keyof AdminPermission) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      showAlert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    showAlert('ملاحظة', 'لإضافة مشرف جديد، يرجى استخدام صفحة تسجيل حساب إداري من شاشة تسجيل الدخول.', [
      { text: 'حسناً', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}><MaterialIcons name="close" size={24} color={theme.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>إضافة مشرف جديد</Text>
        <View style={{ width: 44 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>
            <Text style={styles.label}>الاسم الكامل *</Text>
            <TextInput value={name} onChangeText={setName} placeholder="اسم المشرف" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
            <Text style={styles.label}>رقم الجوال *</Text>
            <TextInput value={phone} onChangeText={setPhone} placeholder="05XXXXXXXX" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="phone-pad" />
            <Text style={styles.label}>البريد الإلكتروني *</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الصلاحيات</Text>
            <Text style={styles.sectionDesc}>حدد الصلاحيات التي سيحصل عليها المشرف</Text>
            {PERMISSION_OPTIONS.map(perm => {
              const isOn = permissions[perm.key];
              return (
                <Pressable key={perm.key} onPress={() => togglePermission(perm.key)} style={[styles.permRow, isOn && styles.permRowActive]}>
                  <View style={[styles.permIcon, { backgroundColor: isOn ? theme.primary + '15' : '#F1F5F9' }]}>
                    <MaterialIcons name={perm.icon as any} size={20} color={isOn ? theme.primary : theme.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.permLabel, isOn && { color: theme.primary }]}>{perm.label}</Text>
                    <Text style={styles.permDesc}>{perm.desc}</Text>
                  </View>
                  <MaterialIcons name={isOn ? 'check-circle' : 'radio-button-unchecked'} size={24} color={isOn ? theme.primary : theme.textMuted} />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={handleSave} style={styles.saveBtn}>
          <MaterialIcons name="person-add" size={22} color="#FFF" />
          <Text style={styles.saveBtnText}>إضافة المشرف</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  section: { marginBottom: 24 },
  sectionTitle: { ...typography.sectionHeader, writingDirection: 'rtl', textAlign: 'right', marginBottom: 4 },
  sectionDesc: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginBottom: 12 },
  label: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border, borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl', ...theme.shadow },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 8, backgroundColor: theme.surface, borderRadius: theme.radiusMedium, borderWidth: 1.5, borderColor: 'transparent', ...theme.shadow },
  permRowActive: { borderColor: theme.primary + '40', backgroundColor: theme.primary + '05' },
  permIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  permLabel: { ...typography.bodyBold, writingDirection: 'rtl', textAlign: 'right' },
  permDesc: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.accent, paddingVertical: 16, borderRadius: theme.radiusMedium },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
