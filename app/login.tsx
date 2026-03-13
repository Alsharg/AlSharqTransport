import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { login, operationLoading, isLoggedIn, userRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (isLoggedIn) {
    if (userRole === 'admin' || userRole === 'supervisor') {
      router.replace('/admin');
    } else {
      router.replace('/(tabs)');
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="local-shipping" size={48} color={theme.primary} />
            </View>
            <Text style={styles.appName}>الشرق للنقل والتوصيل</Text>
            <Text style={styles.appSubtitle}>منصة إدارة المشاوير والسائقين</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.formCard}>
            <Text style={styles.formTitle}>تسجيل الدخول</Text>

            <Text style={styles.label}>البريد الإلكتروني</Text>
            <View style={styles.inputRow}>
              <TextInput value={email} onChangeText={setEmail} placeholder="example@email.com" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="email-address" autoCapitalize="none" />
              <MaterialIcons name="email" size={20} color={theme.textMuted} />
            </View>

            <Text style={styles.label}>كلمة المرور</Text>
            <View style={styles.inputRow}>
              <TextInput value={password} onChangeText={setPassword} placeholder="كلمة المرور" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" secureTextEntry={!showPassword} />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            <Pressable onPress={handleLogin} disabled={operationLoading} style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.9 }, operationLoading && { opacity: 0.6 }]}>
              {operationLoading ? <ActivityIndicator color="#FFF" /> : (
                <><MaterialIcons name="login" size={20} color="#FFF" /><Text style={styles.loginBtnText}>دخول</Text></>
              )}
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.registerSection}>
            <Text style={styles.registerText}>سائق جديد؟</Text>
            <Pressable onPress={() => router.push('/onboarding')}><Text style={styles.registerLink}>سجل الآن</Text></Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <Pressable onPress={() => router.push('/admin-register')} style={styles.adminRegisterBtn}>
              <MaterialIcons name="admin-panel-settings" size={18} color={theme.primary} />
              <Text style={styles.adminRegisterText}>تسجيل حساب إداري</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  heroSection: { alignItems: 'center', paddingTop: 40, paddingBottom: 24 },
  logoContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { fontSize: 26, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'center' },
  appSubtitle: { ...typography.caption, writingDirection: 'rtl', textAlign: 'center', marginTop: 4 },
  formCard: { backgroundColor: theme.surface, borderRadius: theme.radiusXL, padding: 24, borderWidth: 1, borderColor: theme.border },
  formTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right', marginBottom: 20 },
  label: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right', marginBottom: 6, marginTop: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.surfaceElevated, borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5, borderColor: theme.border },
  input: { flex: 1, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl' },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.radiusMedium, marginTop: 24 },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  registerSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  registerText: { ...typography.body, color: theme.textSecondary, writingDirection: 'rtl' },
  registerLink: { ...typography.bodyBold, color: theme.primary },
  adminRegisterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingVertical: 12, borderRadius: theme.radiusMedium, backgroundColor: theme.primary + '10', borderWidth: 1.5, borderColor: theme.primary + '30' },
  adminRegisterText: { fontSize: 14, fontWeight: '600', color: theme.primary },
});
