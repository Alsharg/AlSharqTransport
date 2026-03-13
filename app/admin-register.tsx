import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

type AdminRole = 'admin' | 'supervisor';

export default function AdminRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { sendOTP, verifyOTPAndRegister, operationLoading } = useAuth();

  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<AdminRole>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const handleSendOTP = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword || !secretCode.trim()) {
      showAlert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (password.length < 6) {
      showAlert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('خطأ', 'كلمتا المرور غير متطابقتين');
      return;
    }
    if (secretCode.trim() !== 'SHARQ2026') {
      showAlert('خطأ', 'رمز الإدارة غير صحيح');
      return;
    }

    const result = await sendOTP(email.trim());
    if (result.success) {
      setStep('otp');
      showAlert('تم الإرسال', 'تم إرسال رمز التحقق إلى بريدك الإلكتروني. تحقق من صندوق الوارد.');
    } else {
      showAlert('خطأ', result.error || 'فشل إرسال رمز التحقق');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.trim().length < 4) {
      showAlert('خطأ', 'يرجى إدخال رمز التحقق المكون من 4 أرقام');
      return;
    }

    const result = await verifyOTPAndRegister(email.trim(), otp.trim(), password, {
      full_name: name.trim(),
      phone: phone.trim(),
      username: name.trim().split(' ')[0],
    }, role);

    if (result.success) {
      showAlert('تم إنشاء الحساب', `تم إنشاء حساب ${role === 'admin' ? 'المدير' : 'المشرف'} بنجاح.`, [
        { text: 'متابعة', onPress: () => router.replace('/admin') },
      ]);
    } else {
      showAlert('خطأ', result.error || 'رمز التحقق غير صحيح');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => step === 'otp' ? setStep('info') : router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>تسجيل حساب إداري</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: step === 'info' ? '50%' : '100%' }]} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
          {step === 'info' ? (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View style={styles.stepHeader}>
                <View style={styles.adminIconContainer}>
                  <MaterialIcons name="admin-panel-settings" size={40} color={theme.primary} />
                </View>
                <Text style={styles.stepTitle}>إنشاء حساب إداري</Text>
                <Text style={styles.stepDesc}>يتطلب رمز الإدارة السري + تحقق بالبريد</Text>
              </View>

              <View style={styles.warningBox}>
                <MaterialIcons name="security" size={20} color="#D97706" />
                <Text style={styles.warningText}>هذه الصفحة محمية برمز سري. لا تشارك الرمز مع أي شخص غير مخول.</Text>
              </View>

              <Text style={styles.label}>نوع الحساب *</Text>
              <View style={styles.roleRow}>
                <Pressable onPress={() => setRole('admin')} style={[styles.roleChip, role === 'admin' && styles.roleChipActive]}>
                  <MaterialIcons name="verified-user" size={20} color={role === 'admin' ? '#FFF' : theme.primary} />
                  <Text style={[styles.roleChipText, role === 'admin' && styles.roleChipTextActive]}>مدير</Text>
                  <Text style={[styles.roleChipDesc, role === 'admin' && styles.roleChipDescActive]}>صلاحيات كاملة</Text>
                </Pressable>
                <Pressable onPress={() => setRole('supervisor')} style={[styles.roleChip, role === 'supervisor' && styles.roleChipActiveSupervisor]}>
                  <MaterialIcons name="supervisor-account" size={20} color={role === 'supervisor' ? '#FFF' : '#3B82F6'} />
                  <Text style={[styles.roleChipText, role === 'supervisor' && styles.roleChipTextActive]}>مشرف</Text>
                  <Text style={[styles.roleChipDesc, role === 'supervisor' && styles.roleChipDescActive]}>صلاحيات محدودة</Text>
                </Pressable>
              </View>

              <Text style={styles.label}>رمز الإدارة السري *</Text>
              <View style={styles.inputRow}>
                <TextInput value={secretCode} onChangeText={setSecretCode} placeholder="أدخل الرمز السري" placeholderTextColor={theme.textMuted} style={styles.inputInner} textAlign="right" secureTextEntry={!showSecret} autoCapitalize="characters" />
                <Pressable onPress={() => setShowSecret(!showSecret)}>
                  <MaterialIcons name={showSecret ? 'visibility' : 'visibility-off'} size={20} color={theme.textMuted} />
                </Pressable>
                <MaterialIcons name="lock" size={20} color={theme.accent} />
              </View>

              <Text style={styles.label}>الاسم الكامل *</Text>
              <TextInput value={name} onChangeText={setName} placeholder="الاسم الكامل" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />

              <Text style={styles.label}>رقم الجوال</Text>
              <TextInput value={phone} onChangeText={setPhone} placeholder="05XXXXXXXX" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="phone-pad" />

              <Text style={styles.label}>البريد الإلكتروني *</Text>
              <TextInput value={email} onChangeText={setEmail} placeholder="admin@example.com" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.label}>كلمة المرور *</Text>
              <View style={styles.inputRow}>
                <TextInput value={password} onChangeText={setPassword} placeholder="6 أحرف على الأقل" placeholderTextColor={theme.textMuted} style={styles.inputInner} textAlign="right" secureTextEntry={!showPassword} />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color={theme.textMuted} />
                </Pressable>
              </View>

              <Text style={styles.label}>تأكيد كلمة المرور *</Text>
              <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="أعد كتابة كلمة المرور" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" secureTextEntry />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View style={styles.stepHeader}>
                <View style={[styles.adminIconContainer, { backgroundColor: theme.success + '15' }]}>
                  <MaterialIcons name="mark-email-read" size={40} color={theme.success} />
                </View>
                <Text style={styles.stepTitle}>تحقق من بريدك</Text>
                <Text style={styles.stepDesc}>أدخل رمز التحقق المرسل إلى {email}</Text>
              </View>

              <Text style={styles.label}>رمز التحقق (4 أرقام) *</Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="0000"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { textAlign: 'center', fontSize: 28, fontWeight: '700', letterSpacing: 12 }]}
                keyboardType="number-pad"
                maxLength={4}
              />

              <View style={styles.noteBox}>
                <MaterialIcons name="info-outline" size={18} color={theme.primary} />
                <Text style={styles.noteText}>تحقق من صندوق الوارد أو مجلد البريد العشوائي (Spam)</Text>
              </View>

              <Pressable onPress={handleSendOTP} disabled={operationLoading} style={styles.resendBtn}>
                <Text style={styles.resendText}>إعادة إرسال الرمز</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {step === 'info' ? (
          <Pressable onPress={handleSendOTP} disabled={operationLoading} style={[styles.submitBtn, operationLoading && { opacity: 0.6 }]}>
            {operationLoading ? <ActivityIndicator color="#FFF" /> : (
              <>
                <MaterialIcons name="email" size={20} color="#FFF" />
                <Text style={styles.submitBtnText}>إرسال رمز التحقق</Text>
              </>
            )}
          </Pressable>
        ) : (
          <Pressable onPress={handleVerifyOTP} disabled={operationLoading} style={[styles.submitBtn, { backgroundColor: theme.success }, operationLoading && { opacity: 0.6 }]}>
            {operationLoading ? <ActivityIndicator color="#FFF" /> : (
              <>
                <MaterialIcons name="verified" size={20} color="#FFF" />
                <Text style={styles.submitBtnText}>تأكيد وإنشاء الحساب</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  progressBar: { height: 4, backgroundColor: theme.backgroundSecondary },
  progressFill: { height: 4, backgroundColor: theme.primary, borderRadius: 2 },
  stepHeader: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  adminIconContainer: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: theme.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  stepTitle: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  stepDesc: { ...typography.caption, writingDirection: 'rtl', textAlign: 'center' },
  warningBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FEF3C7', padding: 14, borderRadius: theme.radiusMedium, marginBottom: 20,
    borderWidth: 1, borderColor: '#FCD34D',
  },
  warningText: { ...typography.caption, color: '#92400E', flex: 1, writingDirection: 'rtl', textAlign: 'right', lineHeight: 20 },
  label: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right', marginBottom: 6, marginTop: 16 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleChip: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 16, paddingHorizontal: 12,
    borderRadius: theme.radiusMedium, backgroundColor: theme.surface,
    borderWidth: 2, borderColor: theme.border, ...theme.shadow,
  },
  roleChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  roleChipActiveSupervisor: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  roleChipText: { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  roleChipTextActive: { color: '#FFF' },
  roleChipDesc: { fontSize: 11, fontWeight: '500', color: theme.textMuted },
  roleChipDescActive: { color: 'rgba(255,255,255,0.8)' },
  input: {
    backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border,
    borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl', ...theme.shadow,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: theme.border, ...theme.shadow,
  },
  inputInner: { flex: 1, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl' },
  noteBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.primary + '10', padding: 14, borderRadius: theme.radiusMedium, marginTop: 20,
  },
  noteText: { ...typography.caption, color: theme.primary, flex: 1, writingDirection: 'rtl', textAlign: 'right', lineHeight: 20 },
  resendBtn: { alignSelf: 'center', marginTop: 16, paddingVertical: 10, paddingHorizontal: 20 },
  resendText: { fontSize: 14, fontWeight: '600', color: theme.primary, textDecorationLine: 'underline' },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.radiusMedium,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
