import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

export default function ClientRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { sendOTP, verifyOTPAndRegister, operationLoading } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [otp, setOtp] = useState('');

  const validateStep1 = () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !password || !confirmPassword) {
      showAlert('خطأ', 'يرجى ملء جميع الحقول الإلزامية');
      return false;
    }
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      showAlert('خطأ', 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام');
      return false;
    }
    if (password.length < 6) { showAlert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return false; }
    if (password !== confirmPassword) { showAlert('خطأ', 'كلمتا المرور غير متطابقتين'); return false; }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validateStep1()) return;
    const result = await sendOTP(email.trim());
    if (result.success) { setStep(2); showAlert('تم الإرسال', 'تم إرسال رمز التحقق إلى بريدك الإلكتروني'); }
    else showAlert('خطأ', result.error || 'فشل إرسال رمز التحقق');
  };

  const handleVerify = async () => {
    if (!otp.trim() || otp.trim().length < 4) { showAlert('خطأ', 'يرجى إدخال رمز التحقق المكون من 4 أرقام'); return; }
    const result = await verifyOTPAndRegister(email.trim(), otp.trim(), password, {
      full_name: name.trim(),
      phone: phone.trim(),
      username: name.trim().split(' ')[0],
      company_name: companyName.trim(),
      address: address.trim(),
    }, 'client');
    if (result.success) {
      showAlert('تم التسجيل بنجاح', 'مرحباً بك في الشرق للنقل والتوصيل', [
        { text: 'حسناً', onPress: () => { setTimeout(() => router.replace('/login'), 100); } },
      ]);
    } else showAlert('خطأ', result.error || 'حدث خطأ في التسجيل');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => step > 1 ? setStep(1) : router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>تسجيل عميل جديد</Text>
        <Text style={styles.stepText}>{step}/2</Text>
      </View>
      <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${(step / 2) * 100}%` }]} /></View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
          {step === 1 ? (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View style={styles.stepHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#8B5CF6' + '15' }]}>
                  <MaterialIcons name="person-add" size={36} color="#8B5CF6" />
                </View>
                <Text style={styles.stepTitle}>معلومات العميل</Text>
                <Text style={styles.stepDesc}>أدخل بياناتك الأساسية</Text>
              </View>
              <Text style={styles.label}>الاسم الكامل *</Text>
              <TextInput value={name} onChangeText={setName} placeholder="الاسم الكامل" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
              <Text style={styles.label}>رقم الجوال *</Text>
              <TextInput value={phone} onChangeText={setPhone} placeholder="05XXXXXXXX" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="phone-pad" />
              <Text style={styles.label}>اسم الشركة (اختياري)</Text>
              <TextInput value={companyName} onChangeText={setCompanyName} placeholder="اسم الشركة أو المؤسسة" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
              <Text style={styles.label}>العنوان (اختياري)</Text>
              <TextInput value={address} onChangeText={setAddress} placeholder="المدينة - الحي" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
              <Text style={styles.label}>البريد الإلكتروني *</Text>
              <TextInput value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.label}>كلمة المرور *</Text>
              <TextInput value={password} onChangeText={setPassword} placeholder="6 أحرف على الأقل" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" secureTextEntry />
              <Text style={styles.label}>تأكيد كلمة المرور *</Text>
              <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="أعد كتابة كلمة المرور" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" secureTextEntry />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View style={styles.stepHeader}>
                <View style={[styles.iconCircle, { backgroundColor: theme.success + '15' }]}>
                  <MaterialIcons name="mark-email-read" size={36} color={theme.success} />
                </View>
                <Text style={styles.stepTitle}>تحقق من بريدك</Text>
                <Text style={styles.stepDesc}>أدخل رمز التحقق المرسل إلى {email}</Text>
              </View>
              <Text style={styles.label}>رمز التحقق (4 أرقام) *</Text>
              <TextInput value={otp} onChangeText={setOtp} placeholder="0000" placeholderTextColor={theme.textMuted} style={[styles.input, { textAlign: 'center', fontSize: 28, fontWeight: '700', letterSpacing: 12 }]} keyboardType="number-pad" maxLength={4} />
              <Pressable onPress={handleSendOTP} disabled={operationLoading} style={styles.resendBtn}>
                <Text style={styles.resendText}>إعادة إرسال الرمز</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {step === 1 ? (
          <Pressable onPress={handleSendOTP} disabled={operationLoading} style={[styles.nextBtn, operationLoading && { opacity: 0.6 }]}>
            {operationLoading ? <ActivityIndicator color="#FFF" /> : <><Text style={styles.nextBtnText}>إرسال رمز التحقق</Text><MaterialIcons name="email" size={20} color="#FFF" /></>}
          </Pressable>
        ) : (
          <Pressable onPress={handleVerify} disabled={operationLoading} style={[styles.submitBtn, operationLoading && { opacity: 0.6 }]}>
            {operationLoading ? <ActivityIndicator color="#FFF" /> : <><MaterialIcons name="verified" size={20} color="#FFF" /><Text style={styles.submitBtnText}>تأكيد وإنشاء الحساب</Text></>}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  stepText: { ...typography.captionBold, color: '#8B5CF6' },
  progressBar: { height: 4, backgroundColor: theme.backgroundSecondary },
  progressFill: { height: 4, backgroundColor: '#8B5CF6', borderRadius: 2 },
  stepHeader: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  stepDesc: { ...typography.caption, writingDirection: 'rtl', textAlign: 'center' },
  label: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border, borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl' },
  resendBtn: { alignSelf: 'center', marginTop: 16, paddingVertical: 10, paddingHorizontal: 20 },
  resendText: { fontSize: 14, fontWeight: '600', color: '#8B5CF6', textDecorationLine: 'underline' },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8B5CF6', paddingVertical: 16, borderRadius: theme.radiusMedium },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.success, paddingVertical: 16, borderRadius: theme.radiusMedium },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
