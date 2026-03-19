import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { theme, typography } from '../../../constants/theme';
import { useAuth } from '../../../hooks/useAuth';
import { useApp } from '../../../contexts/AppContext';
import { config } from '../../../constants/config';
import { ADMIN_WHATSAPP } from '../../../constants/i18n';
import { Linking } from 'react-native';
import * as api from '../../../services/api';

export default function ClientProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user, logout, deleteAccount, refreshProfile } = useAuth();
  const { clientTrips } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editable fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email] = useState(user?.email || '');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');

  // Load client data
  useEffect(() => {
    if (user?.id) {
      loadClientData();
    }
  }, [user?.id]);

  const loadClientData = async () => {
    if (!user?.id) return;
    const { getSupabaseClient } = await import('@/template');
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).single();
    if (data) {
      setCompanyName(data.company_name || '');
      setAddress(data.address || '');
    }
  };

  useEffect(() => {
    setFullName(user?.full_name || '');
    setPhone(user?.phone || '');
  }, [user]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      showAlert('خطأ', 'الاسم مطلوب');
      return;
    }
    if (phone.trim() && !/^05\d{8}$/.test(phone.trim())) {
      showAlert('خطأ', 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام');
      return;
    }

    setSaving(true);
    try {
      // Update user profile
      const profileResult = await api.updateUserProfile(user!.id, {
        full_name: fullName.trim(),
        phone: phone.trim(),
      });

      // Update client record
      const { getSupabaseClient } = await import('@/template');
      const supabase = getSupabaseClient();
      await supabase.from('clients').update({
        company_name: companyName.trim(),
        address: address.trim(),
        updated_at: new Date().toISOString(),
      }).eq('user_id', user!.id);

      await refreshProfile();
      setIsEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('تم الحفظ', 'تم تحديث بياناتك بنجاح');
    } catch (e: any) {
      showAlert('خطأ', e.message || 'فشل حفظ التغييرات');
    }
    setSaving(false);
  };

  const handleDeleteAccount = () => {
    showAlert('حذف الحساب نهائياً', 'سيتم حذف حسابك وجميع بياناتك بشكل نهائي ولا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف نهائي',
        style: 'destructive',
        onPress: () => {
          showAlert('تأكيد أخير', 'هل أنت متأكد تماماً من حذف حسابك؟', [
            { text: 'لا', style: 'cancel' },
            {
              text: 'نعم، احذف حسابي',
              style: 'destructive',
              onPress: async () => {
                setDeleting(true);
                const result = await deleteAccount();
                if (result.success) {
                  router.replace('/login');
                } else {
                  showAlert('خطأ', result.error || 'فشل حذف الحساب');
                }
                setDeleting(false);
              },
            },
          ]);
        },
      },
    ]);
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showAlert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  };

  const myTripsCount = clientTrips.length;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
            <Text style={styles.headerTitle}>حسابي</Text>
            {!isEditing ? (
              <Pressable onPress={() => setIsEditing(true)} style={styles.editBtn}>
                <MaterialIcons name="edit" size={18} color="#8B5CF6" />
                <Text style={styles.editBtnText}>تعديل</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => { setIsEditing(false); setFullName(user?.full_name || ''); setPhone(user?.phone || ''); }} style={styles.editBtn}>
                <MaterialIcons name="close" size={18} color={theme.textMuted} />
                <Text style={[styles.editBtnText, { color: theme.textMuted }]}>إلغاء</Text>
              </Pressable>
            )}
          </Animated.View>

          {/* Profile Card */}
          <Animated.View entering={FadeInDown.duration(400).delay(50)} style={styles.profileCard}>
            <View style={[styles.avatar, { backgroundColor: theme.accent + '15' }]}>
              <MaterialIcons name="person" size={40} color={theme.accent} />
            </View>
            <Text style={styles.name}>{user?.full_name || user?.username || 'عميل'}</Text>
            <Text style={styles.emailDisplay}>{user?.email}</Text>
            <View style={[styles.roleBadge, { backgroundColor: theme.accent + '15' }]}>
              <MaterialIcons name="verified" size={14} color={theme.accent} />
              <Text style={[styles.roleText, { color: theme.accent }]}>عميل</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}><Text style={styles.statValue}>{myTripsCount}</Text><Text style={styles.statLabel}>مشوار</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.stat}><Text style={styles.statValue}>5.0</Text><Text style={styles.statLabel}>التقييم</Text></View>
            </View>
          </Animated.View>

          {/* Editable Form */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.formSection}>
            <Text style={styles.sectionTitle}>البيانات الشخصية</Text>
            <View style={styles.formCard}>
              <View style={styles.fieldRow}>
                <View style={[styles.fieldIcon, { backgroundColor: '#8B5CF615' }]}>
                  <MaterialIcons name="person" size={18} color="#8B5CF6" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>الاسم الكامل</Text>
                  {isEditing ? (
                    <TextInput value={fullName} onChangeText={setFullName} style={styles.fieldInput} textAlign="right" placeholder="الاسم الكامل" placeholderTextColor={theme.textMuted} />
                  ) : (
                    <Text style={styles.fieldValue}>{fullName || '—'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldDivider} />

              <View style={styles.fieldRow}>
                <View style={[styles.fieldIcon, { backgroundColor: '#22C55E15' }]}>
                  <MaterialIcons name="phone" size={18} color="#22C55E" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>رقم الجوال</Text>
                  {isEditing ? (
                    <TextInput value={phone} onChangeText={setPhone} style={styles.fieldInput} textAlign="right" placeholder="05XXXXXXXX" placeholderTextColor={theme.textMuted} keyboardType="phone-pad" />
                  ) : (
                    <Text style={styles.fieldValue}>{phone || '—'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldDivider} />

              <View style={styles.fieldRow}>
                <View style={[styles.fieldIcon, { backgroundColor: '#3B82F615' }]}>
                  <MaterialIcons name="email" size={18} color="#3B82F6" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>البريد الإلكتروني</Text>
                  <Text style={[styles.fieldValue, { color: theme.textMuted }]}>{email}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Company Info */}
          <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.formSection}>
            <Text style={styles.sectionTitle}>بيانات الشركة</Text>
            <View style={styles.formCard}>
              <View style={styles.fieldRow}>
                <View style={[styles.fieldIcon, { backgroundColor: '#F59E0B15' }]}>
                  <MaterialIcons name="business" size={18} color="#F59E0B" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>اسم الشركة</Text>
                  {isEditing ? (
                    <TextInput value={companyName} onChangeText={setCompanyName} style={styles.fieldInput} textAlign="right" placeholder="اسم الشركة (اختياري)" placeholderTextColor={theme.textMuted} />
                  ) : (
                    <Text style={styles.fieldValue}>{companyName || '—'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldDivider} />

              <View style={styles.fieldRow}>
                <View style={[styles.fieldIcon, { backgroundColor: '#EF444415' }]}>
                  <MaterialIcons name="location-on" size={18} color="#EF4444" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>العنوان</Text>
                  {isEditing ? (
                    <TextInput value={address} onChangeText={setAddress} style={styles.fieldInput} textAlign="right" placeholder="المدينة - الحي (اختياري)" placeholderTextColor={theme.textMuted} />
                  ) : (
                    <Text style={styles.fieldValue}>{address || '—'}</Text>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Save Button */}
          {isEditing ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.saveBtnWrap}>
              <Pressable onPress={handleSave} disabled={saving} style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9 }, saving && { opacity: 0.6 }]}>
                {saving ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <MaterialIcons name="check" size={20} color="#FFF" />
                    <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
                  </>
                )}
              </Pressable>
            </Animated.View>
          ) : null}

          {/* Quick Menu */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.formSection}>
            <Text style={styles.sectionTitle}>خيارات</Text>
            <View style={styles.formCard}>
              <Pressable onPress={() => router.push('/notifications')} style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: theme.backgroundSecondary }]}>
                <View style={[styles.fieldIcon, { backgroundColor: '#F59E0B15' }]}>
                  <MaterialIcons name="notifications-none" size={18} color="#F59E0B" />
                </View>
                <Text style={styles.menuLabel}>الإشعارات</Text>
                <MaterialIcons name="chevron-left" size={22} color={theme.textMuted} />
              </Pressable>

              <View style={styles.fieldDivider} />

              <Pressable onPress={() => router.push('/chat')} style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: theme.backgroundSecondary }]}>
                <View style={[styles.fieldIcon, { backgroundColor: '#3B82F615' }]}>
                  <MaterialIcons name="chat-bubble-outline" size={18} color="#3B82F6" />
                </View>
                <Text style={styles.menuLabel}>محادثة مع الإدارة</Text>
                <MaterialIcons name="chevron-left" size={22} color={theme.textMuted} />
              </Pressable>

              <View style={styles.fieldDivider} />

              <Pressable onPress={() => Linking.openURL(`https://wa.me/${ADMIN_WHATSAPP}`).catch(() => {})} style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: theme.backgroundSecondary }]}>
                <View style={[styles.fieldIcon, { backgroundColor: '#25D36615' }]}>
                  <MaterialIcons name="chat" size={18} color="#25D366" />
                </View>
                <Text style={styles.menuLabel}>واتساب الإدارة</Text>
                <MaterialIcons name="chevron-left" size={22} color={theme.textMuted} />
              </Pressable>
            </View>
          </Animated.View>

          {/* Logout */}
          <Animated.View entering={FadeInDown.duration(400).delay(250)}>
            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <MaterialIcons name="logout" size={20} color={theme.error} />
              <Text style={styles.logoutText}>تسجيل الخروج</Text>
            </Pressable>
          </Animated.View>

          {/* Delete Account */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <Pressable onPress={handleDeleteAccount} disabled={deleting} style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.9 }, deleting && { opacity: 0.6 }]}>
              {deleting ? <ActivityIndicator color={theme.error} size="small" /> : (
                <>
                  <MaterialIcons name="delete-forever" size={20} color={theme.error} />
                  <Text style={styles.deleteText}>حذف الحساب نهائياً</Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>الشرق درايفر</Text>
            <Text style={styles.footerVersion}>الإصدار {config.version}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radiusFull, backgroundColor: theme.accent + '10', borderWidth: 1, borderColor: theme.accent + '25' },
  editBtnText: { fontSize: 13, fontWeight: '600', color: theme.accent },
  profileCard: { marginHorizontal: 20, padding: 28, backgroundColor: theme.surface, borderRadius: theme.radiusXL, alignItems: 'center', borderWidth: 1, borderColor: theme.border, marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  emailDisplay: { ...typography.caption, marginTop: 4 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: theme.radiusFull },
  roleText: { fontSize: 13, fontWeight: '700' },
  statsRow: { flexDirection: 'row', marginTop: 20, width: '100%', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted },
  statDivider: { width: 1, height: 36, backgroundColor: theme.border },
  formSection: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginBottom: 10, paddingHorizontal: 4 },
  formCard: { backgroundColor: theme.surface, borderRadius: theme.radiusLarge, overflow: 'hidden', borderWidth: 1, borderColor: theme.border },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  fieldIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginBottom: 4 },
  fieldValue: { fontSize: 15, fontWeight: '500', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right' },
  fieldInput: { fontSize: 15, fontWeight: '500', color: theme.textPrimary, writingDirection: 'rtl', backgroundColor: theme.backgroundSecondary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: theme.border },
  fieldDivider: { height: 1, backgroundColor: theme.borderLight, marginHorizontal: 16 },
  saveBtnWrap: { paddingHorizontal: 20, marginBottom: 20 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.accent, paddingVertical: 16, borderRadius: theme.radiusMedium },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: theme.textSecondary, writingDirection: 'rtl', textAlign: 'right' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, paddingVertical: 16, borderRadius: theme.radiusMedium, backgroundColor: theme.errorLight, marginBottom: 12 },
  logoutText: { fontSize: 15, fontWeight: '600', color: theme.error },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, paddingVertical: 14, borderRadius: theme.radiusMedium, borderWidth: 1.5, borderColor: theme.error + '30', marginBottom: 8 },
  deleteText: { fontSize: 14, fontWeight: '600', color: theme.error },
  footer: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  footerText: { ...typography.caption },
  footerVersion: { fontSize: 11, fontWeight: '600', color: theme.textMuted },
});
