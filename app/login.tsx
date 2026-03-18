import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { theme, typography, spacing } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

type PortalType = 'driver' | 'admin' | 'client';
type ScreenMode = 'portal' | 'login' | 'forgot_email' | 'forgot_otp' | 'forgot_newpass';

export default function LoginScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { login, sendOTP, verifyOTPForReset, resetPassword, operationLoading, isLoggedIn, userRole } = useAuth();
  const [mode, setMode] = useState<ScreenMode>('portal');
  const [selectedPortal, setSelectedPortal] = useState<PortalType | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  if (isLoggedIn) {
    if (userRole === 'admin' || userRole === 'supervisor') router.replace('/admin');
    else if (userRole === 'client') router.replace('/client');
    else router.replace('/(tabs)');
    return null;
  }

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    const result = await login(email.trim(), password);
    if (result.success) {
      router.replace('/');
    } else {
      showAlert('خطأ في الدخول', result.error || 'حدث خطأ');
    }
  };

  const handleForgotSendOTP = async () => {
    if (!forgotEmail.trim()) {
      showAlert('خطأ', 'يرجى إدخال البريد الإلكتروني');
      return;
    }
    const result = await sendOTP(forgotEmail.trim());
    if (result.success) {
      setMode('forgot_otp');
      showAlert('تم الإرسال', 'تم إرسال رمز التحقق إلى بريدك الإلكتروني');
    } else {
      showAlert('خطأ', result.error || 'فشل إرسال رمز التحقق');
    }
  };

  const handleForgotVerifyOTP = async () => {
    if (!forgotOtp.trim() || forgotOtp.trim().length < 4) {
      showAlert('خطأ', 'يرجى إدخال رمز التحقق المكون من 4 أرقام');
      return;
    }
    const result = await verifyOTPForReset(forgotEmail.trim(), forgotOtp.trim());
    if (result.success) {
      setMode('forgot_newpass');
    } else {
      showAlert('خطأ', result.error || 'رمز التحقق غير صحيح');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showAlert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showAlert('خطأ', 'كلمتا المرور غير متطابقتين');
      return;
    }
    const result = await resetPassword(newPassword);
    if (result.success) {
      showAlert('تم بنجاح', 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.', [
        { text: 'حسناً', onPress: () => {
          setMode('login');
          setForgotEmail('');
          setForgotOtp('');
          setNewPassword('');
          setConfirmNewPassword('');
        }},
      ]);
    } else {
      showAlert('خطأ', result.error || 'فشل تغيير كلمة المرور');
    }
  };

  const goBackFromForgot = () => {
    if (mode === 'forgot_newpass') setMode('forgot_otp');
    else if (mode === 'forgot_otp') setMode('forgot_email');
    else if (mode === 'forgot_email') setMode('login');
  };

  const portals: { id: PortalType; icon: string; title: string; subtitle: string; color: string; gradient: string }[] = [
    { id: 'admin', icon: 'admin-panel-settings', title: 'لوحة الإدارة', subtitle: 'التحكم الكامل بالنظام', color: '#D4A017', gradient: '#1A1500' },
    { id: 'driver', icon: 'local-shipping', title: 'بوابة الكباتن', subtitle: 'إدارة المشاوير والأرباح', color: '#22C55E', gradient: '#001A0A' },
    { id: 'client', icon: 'person', title: 'بوابة العملاء', subtitle: 'طلب مشاوير وتتبع', color: '#8B5CF6', gradient: '#0D001A' },
  ];

  // Portal selection screen
  if (mode === 'portal') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.portalScroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <MaterialIcons name="diamond" size={40} color={theme.accent} />
            </View>
            <Text style={styles.brandName}>الشرق</Text>
            <Text style={styles.brandTagline}>للنقل والتوصيل</Text>
            <View style={styles.dividerLine}>
              <View style={styles.dividerGold} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <Text style={styles.portalTitle}>اختر بوابتك</Text>
          </Animated.View>

          {portals.map((portal, index) => (
            <Animated.View key={portal.id} entering={FadeInDown.duration(400).delay(300 + index * 100)}>
              <Pressable
                onPress={() => { setSelectedPortal(portal.id); setMode('login'); }}
                style={({ pressed }) => [styles.portalCard, { backgroundColor: portal.gradient, borderColor: portal.color + '30' }, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              >
                <View style={[styles.portalIconWrap, { backgroundColor: portal.color + '20' }]}>
                  <MaterialIcons name={portal.icon as any} size={28} color={portal.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.portalCardTitle, { color: portal.color }]}>{portal.title}</Text>
                  <Text style={styles.portalCardSubtitle}>{portal.subtitle}</Text>
                </View>
                <MaterialIcons name="chevron-left" size={24} color={portal.color + '80'} />
              </Pressable>
            </Animated.View>
          ))}

          <Animated.View entering={FadeInDown.duration(400).delay(600)} style={styles.footerSection}>
            <Text style={styles.footerText}>الشرق للنقل والتوصيل</Text>
            <Text style={styles.footerVersion}>الإصدار 2.0.0</Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentPortal = portals.find(p => p.id === selectedPortal) || portals[0];

  // Forgot password screens
  if (mode === 'forgot_email' || mode === 'forgot_otp' || mode === 'forgot_newpass') {
    const forgotStep = mode === 'forgot_email' ? 1 : mode === 'forgot_otp' ? 2 : 3;
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.loginScroll} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(300)} style={styles.loginHeader}>
              <Pressable onPress={goBackFromForgot} style={styles.backBtn}>
                <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
              </Pressable>
              <View style={[styles.portalBadge, { backgroundColor: '#EF4444' + '20', borderColor: '#EF4444' + '40' }]}>
                <MaterialIcons name="lock-reset" size={16} color="#EF4444" />
                <Text style={[styles.portalBadgeText, { color: '#EF4444' }]}>استعادة كلمة المرور</Text>
              </View>
            </Animated.View>

            {/* Progress */}
            <View style={styles.forgotProgress}>
              {[1, 2, 3].map(s => (
                <View key={s} style={[styles.forgotProgressDot, s <= forgotStep && styles.forgotProgressDotActive]} />
              ))}
            </View>

            {mode === 'forgot_email' ? (
              <Animated.View entering={FadeInDown.duration(400)}>
                <View style={styles.loginHero}>
                  <View style={[styles.loginLogoCircle, { backgroundColor: '#EF4444' + '15', borderColor: '#EF4444' + '30' }]}>
                    <MaterialIcons name="email" size={44} color="#EF4444" />
                  </View>
                  <Text style={styles.loginTitle}>نسيت كلمة المرور؟</Text>
                  <Text style={styles.loginSubtitle}>أدخل بريدك الإلكتروني لإرسال رمز التحقق</Text>
                </View>

                <View style={styles.formCard}>
                  <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      value={forgotEmail} onChangeText={setForgotEmail}
                      placeholder="example@email.com" placeholderTextColor={theme.textMuted}
                      style={styles.input} textAlign="right"
                      keyboardType="email-address" autoCapitalize="none"
                    />
                    <MaterialIcons name="email" size={20} color={theme.textMuted} />
                  </View>

                  <Pressable
                    onPress={handleForgotSendOTP} disabled={operationLoading}
                    style={({ pressed }) => [styles.loginBtn, { backgroundColor: '#EF4444' }, pressed && { opacity: 0.9 }, operationLoading && { opacity: 0.6 }]}
                  >
                    {operationLoading ? <ActivityIndicator color="#FFF" /> : (
                      <>
                        <MaterialIcons name="send" size={20} color="#FFF" />
                        <Text style={styles.loginBtnText}>إرسال رمز التحقق</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </Animated.View>
            ) : mode === 'forgot_otp' ? (
              <Animated.View entering={FadeInDown.duration(400)}>
                <View style={styles.loginHero}>
                  <View style={[styles.loginLogoCircle, { backgroundColor: theme.success + '15', borderColor: theme.success + '30' }]}>
                    <MaterialIcons name="mark-email-read" size={44} color={theme.success} />
                  </View>
                  <Text style={styles.loginTitle}>تحقق من بريدك</Text>
                  <Text style={styles.loginSubtitle}>أدخل رمز التحقق المرسل إلى {forgotEmail}</Text>
                </View>

                <View style={styles.formCard}>
                  <Text style={styles.inputLabel}>رمز التحقق (4 أرقام)</Text>
                  <TextInput
                    value={forgotOtp} onChangeText={setForgotOtp}
                    placeholder="0000" placeholderTextColor={theme.textMuted}
                    style={[styles.otpInput]}
                    keyboardType="number-pad" maxLength={4}
                  />

                  <Pressable onPress={handleForgotSendOTP} disabled={operationLoading} style={styles.resendRow}>
                    <MaterialIcons name="refresh" size={16} color={theme.primary} />
                    <Text style={styles.resendText}>إعادة إرسال الرمز</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleForgotVerifyOTP} disabled={operationLoading}
                    style={({ pressed }) => [styles.loginBtn, { backgroundColor: theme.success }, pressed && { opacity: 0.9 }, operationLoading && { opacity: 0.6 }]}
                  >
                    {operationLoading ? <ActivityIndicator color="#FFF" /> : (
                      <>
                        <MaterialIcons name="verified" size={20} color="#FFF" />
                        <Text style={styles.loginBtnText}>تأكيد الرمز</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInDown.duration(400)}>
                <View style={styles.loginHero}>
                  <View style={[styles.loginLogoCircle, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
                    <MaterialIcons name="lock" size={44} color={theme.primary} />
                  </View>
                  <Text style={styles.loginTitle}>كلمة مرور جديدة</Text>
                  <Text style={styles.loginSubtitle}>أدخل كلمة المرور الجديدة</Text>
                </View>

                <View style={styles.formCard}>
                  <Text style={styles.inputLabel}>كلمة المرور الجديدة</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      value={newPassword} onChangeText={setNewPassword}
                      placeholder="6 أحرف على الأقل" placeholderTextColor={theme.textMuted}
                      style={styles.input} textAlign="right" secureTextEntry={!showNewPassword}
                    />
                    <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
                      <MaterialIcons name={showNewPassword ? 'visibility' : 'visibility-off'} size={20} color={theme.textMuted} />
                    </Pressable>
                  </View>

                  <Text style={styles.inputLabel}>تأكيد كلمة المرور</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      value={confirmNewPassword} onChangeText={setConfirmNewPassword}
                      placeholder="أعد كتابة كلمة المرور" placeholderTextColor={theme.textMuted}
                      style={styles.input} textAlign="right" secureTextEntry
                    />
                    <MaterialIcons name="lock" size={20} color={theme.textMuted} />
                  </View>

                  <Pressable
                    onPress={handleResetPassword} disabled={operationLoading}
                    style={({ pressed }) => [styles.loginBtn, { backgroundColor: theme.primary }, pressed && { opacity: 0.9 }, operationLoading && { opacity: 0.6 }]}
                  >
                    {operationLoading ? <ActivityIndicator color="#FFF" /> : (
                      <>
                        <MaterialIcons name="check-circle" size={20} color="#FFF" />
                        <Text style={styles.loginBtnText}>تغيير كلمة المرور</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Login screen
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.loginScroll} showsVerticalScrollIndicator={false}>
          {/* Back + Portal Header */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.loginHeader}>
            <Pressable onPress={() => { setMode('portal'); setSelectedPortal(null); }} style={styles.backBtn}>
              <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
            </Pressable>
            <View style={[styles.portalBadge, { backgroundColor: currentPortal.color + '20', borderColor: currentPortal.color + '40' }]}>
              <MaterialIcons name={currentPortal.icon as any} size={16} color={currentPortal.color} />
              <Text style={[styles.portalBadgeText, { color: currentPortal.color }]}>{currentPortal.title}</Text>
            </View>
          </Animated.View>

          {/* Login Hero */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.loginHero}>
            <View style={[styles.loginLogoCircle, { backgroundColor: currentPortal.color + '15', borderColor: currentPortal.color + '30' }]}>
              <MaterialIcons name={currentPortal.icon as any} size={44} color={currentPortal.color} />
            </View>
            <Text style={styles.loginTitle}>تسجيل الدخول</Text>
            <Text style={styles.loginSubtitle}>{currentPortal.subtitle}</Text>
          </Animated.View>

          {/* Login Form */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.formCard}>
            <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={email} onChangeText={setEmail}
                placeholder="example@email.com" placeholderTextColor={theme.textMuted}
                style={styles.input} textAlign="right"
                keyboardType="email-address" autoCapitalize="none"
              />
              <MaterialIcons name="email" size={20} color={theme.textMuted} />
            </View>

            <Text style={styles.inputLabel}>كلمة المرور</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={password} onChangeText={setPassword}
                placeholder="كلمة المرور" placeholderTextColor={theme.textMuted}
                style={styles.input} textAlign="right" secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            {/* Forgot password link */}
            <Pressable onPress={() => setMode('forgot_email')} style={styles.forgotLink}>
              <Text style={styles.forgotLinkText}>نسيت كلمة المرور؟</Text>
            </Pressable>

            <Pressable
              onPress={handleLogin} disabled={operationLoading}
              style={({ pressed }) => [styles.loginBtn, { backgroundColor: currentPortal.color }, pressed && { opacity: 0.9 }, operationLoading && { opacity: 0.6 }]}
            >
              {operationLoading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <MaterialIcons name="login" size={20} color="#FFF" />
                  <Text style={styles.loginBtnText}>دخول</Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          {/* Register Links */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.registerSection}>
            {selectedPortal === 'driver' ? (
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>كابتن جديد؟</Text>
                <Pressable onPress={() => router.push('/onboarding')}>
                  <Text style={[styles.registerLink, { color: currentPortal.color }]}>سجل الآن</Text>
                </Pressable>
              </View>
            ) : selectedPortal === 'admin' ? (
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>حساب إداري جديد؟</Text>
                <Pressable onPress={() => router.push('/admin-register')}>
                  <Text style={[styles.registerLink, { color: currentPortal.color }]}>إنشاء حساب</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>عميل جديد؟</Text>
                <Pressable onPress={() => router.push('/client-register')}>
                  <Text style={[styles.registerLink, { color: currentPortal.color }]}>سجل الآن</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  // Portal Selection
  portalScroll: { paddingHorizontal: 24, paddingBottom: 40 },
  logoSection: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  logoCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: theme.accent + '15', borderWidth: 2, borderColor: theme.accent + '30', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  brandName: { fontSize: 36, fontWeight: '700', color: theme.textPrimary, letterSpacing: 2 },
  brandTagline: { fontSize: 16, fontWeight: '500', color: theme.accent, marginTop: 4, letterSpacing: 1 },
  dividerLine: { marginTop: 24, width: '50%', height: 2, backgroundColor: theme.border, borderRadius: 1 },
  dividerGold: { width: '40%', height: 2, backgroundColor: theme.accent, borderRadius: 1, alignSelf: 'center' },
  portalTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', marginBottom: 20, writingDirection: 'rtl' },
  portalCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: theme.radiusLarge, borderWidth: 1.5, marginBottom: 14 },
  portalIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  portalCardTitle: { fontSize: 17, fontWeight: '700', writingDirection: 'rtl', textAlign: 'right' },
  portalCardSubtitle: { fontSize: 13, fontWeight: '500', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  footerSection: { alignItems: 'center', paddingTop: 32, gap: 4 },
  footerText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  footerVersion: { fontSize: 11, fontWeight: '500', color: theme.textMuted },

  // Login Screen
  loginScroll: { paddingHorizontal: 24, paddingBottom: 40 },
  loginHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  portalBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radiusFull, borderWidth: 1 },
  portalBadgeText: { fontSize: 13, fontWeight: '600' },
  loginHero: { alignItems: 'center', paddingBottom: 28 },
  loginLogoCircle: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  loginTitle: { fontSize: 26, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  loginSubtitle: { fontSize: 14, fontWeight: '500', color: theme.textMuted, writingDirection: 'rtl', marginTop: 4, textAlign: 'center' },
  formCard: { backgroundColor: theme.surface, borderRadius: theme.radiusXL, padding: 24, borderWidth: 1, borderColor: theme.border },
  inputLabel: { fontSize: 13, fontWeight: '700', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginBottom: 8, marginTop: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.backgroundSecondary, borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: theme.border },
  input: { flex: 1, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl' },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: theme.radiusMedium, marginTop: 24 },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  registerSection: { paddingTop: 24 },
  registerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  registerText: { fontSize: 14, fontWeight: '500', color: theme.textSecondary, writingDirection: 'rtl' },
  registerLink: { fontSize: 15, fontWeight: '700' },

  // Forgot password
  forgotLink: { alignSelf: 'flex-end', marginTop: 12, paddingVertical: 4, paddingHorizontal: 4 },
  forgotLinkText: { fontSize: 13, fontWeight: '600', color: '#EF4444', writingDirection: 'rtl' },
  forgotProgress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  forgotProgressDot: { width: 32, height: 4, borderRadius: 2, backgroundColor: theme.border },
  forgotProgressDotActive: { backgroundColor: '#EF4444' },
  otpInput: {
    backgroundColor: theme.backgroundSecondary, borderWidth: 1.5, borderColor: theme.border,
    borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 16,
    fontSize: 28, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', letterSpacing: 12,
  },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingVertical: 8 },
  resendText: { fontSize: 14, fontWeight: '600', color: theme.primary, textDecorationLine: 'underline' },
});
