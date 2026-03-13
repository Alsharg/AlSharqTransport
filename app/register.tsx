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

const VEHICLE_TYPES = ['سيدان', 'دبل كابينة', 'فان', 'باص صغير', 'شاحنة خفيفة'];
const NATIONALITIES = ['سعودي', 'يمني', 'مصري', 'سوداني', 'سوري', 'أردني', 'باكستاني', 'هندي', 'بنغالي', 'أخرى'];

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { sendOTP, verifyOTPAndRegister, operationLoading } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nationality, setNationality] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [carModel, setCarModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [otp, setOtp] = useState('');

  const validateStep1 = () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !password || !confirmPassword || !nationality) {
      showAlert('خطأ', 'يرجى ملء جميع الحقول الإلزامية');
      return false;
    }
    if (password.length < 6) {
      showAlert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    if (password !== confirmPassword) {
      showAlert('خطأ', 'كلمتا المرور غير متطابقتين');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!vehicleType.trim() || !carModel.trim() || !vehiclePlate.trim() || !licenseNumber.trim()) {
      showAlert('خطأ', 'يرجى ملء جميع بيانات المركبة');
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validateStep2()) return;
    const result = await sendOTP(email.trim());
    if (result.success) {
      setStep(3);
      showAlert('تم الإرسال', 'تم إرسال رمز التحقق إلى بريدك الإلكتروني');
    } else {
      showAlert('خطأ', result.error || 'فشل إرسال رمز التحقق');
    }
  };

  const handleVerifyAndSubmit = async () => {
    if (!otp.trim() || otp.trim().length < 4) {
      showAlert('خطأ', 'يرجى إدخال رمز التحقق المكون من 4 أرقام');
      return;
    }

    const result = await verifyOTPAndRegister(email.trim(), otp.trim(), password, {
      full_name: name.trim(),
      phone: phone.trim(),
      username: name.trim().split(' ')[0],
      nationality: nationality,
      vehicle_type: vehicleType.trim(),
      car_model: carModel.trim(),
      vehicle_plate: vehiclePlate.trim(),
      license_number: licenseNumber.trim(),
    }, 'driver');

    if (result.success) {
      showAlert('تم التسجيل بنجاح', 'تم إرسال طلبك للمراجعة. ستتلقى إشعاراً عند قبول حسابك من الإدارة.', [
        { text: 'حسناً', onPress: () => { setTimeout(() => router.replace('/login'), 100); } },
      ]);
    } else {
      showAlert('خطأ', result.error || 'حدث خطأ في التسجيل');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => step > 1 ? setStep((step - 1) as 1 | 2) : router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>تسجيل سائق جديد</Text>
        <Text style={styles.stepText}>{step}/3</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
          {step === 1 ? (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View style={styles.stepHeader}>
                <MaterialIcons name="person" size={32} color={theme.primary} />
                <Text style={styles.stepTitle}>المعلومات الشخصية</Text>
                <Text style={styles.stepDesc}>أدخل بياناتك الأساسية</Text>
              </View>

              <Text style={styles.label}>الاسم الكامل *</Text>
              <TextInput value={name} onChangeText={setName} placeholder="الاسم الكامل" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />

              <Text style={styles.label}>رقم الجوال *</Text>
              <TextInput value={phone} onChangeText={setPhone} placeholder="05XXXXXXXX" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="phone-pad" />

              <Text style={styles.label}>الجنسية *</Text>
              <View style={styles.chipsWrap}>
                {NATIONALITIES.map(n => (
                  <Pressable key={n} onPress={() => setNationality(n)} style={[styles.chip, nationality === n && styles.chipActive]}>
                    <Text style={[styles.chipText, nationality === n && styles.chipTextActive]}>{n}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>البريد الإلكتروني *</Text>
              <TextInput value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.label}>كلمة المرور *</Text>
              <TextInput value={password} onChangeText={setPassword} placeholder="6 أحرف على الأقل" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" secureTextEntry />

              <Text style={styles.label}>تأكيد كلمة المرور *</Text>
              <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="أعد كتابة كلمة المرور" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" secureTextEntry />
            </Animated.View>
          ) : step === 2 ? (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View style={styles.stepHeader}>
                <MaterialIcons name="directions-car" size={32} color={theme.primary} />
                <Text style={styles.stepTitle}>بيانات المركبة</Text>
                <Text style={styles.stepDesc}>أدخل معلومات مركبتك</Text>
              </View>

              <Text style={styles.label}>نوع السيارة *</Text>
              <View style={styles.chipsWrap}>
                {VEHICLE_TYPES.map(v => (
                  <Pressable key={v} onPress={() => setVehicleType(v)} style={[styles.chip, vehicleType === v && styles.chipActive]}>
                    <Text style={[styles.chipText, vehicleType === v && styles.chipTextActive]}>{v}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>موديل السيارة *</Text>
              <TextInput value={carModel} onChangeText={setCarModel} placeholder="مثال: تويوتا كامري 2024" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />

              <Text style={styles.label}>رقم اللوحة *</Text>
              <TextInput value={vehiclePlate} onChangeText={setVehiclePlate} placeholder="أ ب ج 1234" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />

              <Text style={styles.label}>رقم رخصة القيادة *</Text>
              <TextInput value={licenseNumber} onChangeText={setLicenseNumber} placeholder="رقم الرخصة" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View style={styles.stepHeader}>
                <View style={[styles.otpIconContainer, { backgroundColor: theme.success + '15' }]}>
                  <MaterialIcons name="mark-email-read" size={36} color={theme.success} />
                </View>
                <Text style={styles.stepTitle}>تحقق من بريدك</Text>
                <Text style={styles.stepDesc}>أدخل رمز التحقق المرسل إلى {email}</Text>
              </View>

              <Text style={styles.label}>رمز التحقق (4 أرقام) *</Text>
              <TextInput
                value={otp} onChangeText={setOtp} placeholder="0000" placeholderTextColor={theme.textMuted}
                style={[styles.input, { textAlign: 'center', fontSize: 28, fontWeight: '700', letterSpacing: 12 }]}
                keyboardType="number-pad" maxLength={4}
              />

              <View style={styles.noteBox}>
                <MaterialIcons name="info-outline" size={18} color={theme.primary} />
                <Text style={styles.noteText}>تحقق من صندوق الوارد أو مجلد البريد العشوائي. سيتم مراجعة طلبك من قبل الإدارة.</Text>
              </View>

              <Pressable onPress={handleSendOTP} disabled={operationLoading} style={styles.resendBtn}>
                <Text style={styles.resendText}>إعادة إرسال الرمز</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {step === 1 ? (
          <Pressable onPress={() => { if (validateStep1()) setStep(2); }} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>التالي</Text>
            <MaterialIcons name="arrow-back" size={20} color="#FFF" />
          </Pressable>
        ) : step === 2 ? (
          <Pressable onPress={handleSendOTP} disabled={operationLoading} style={[styles.nextBtn, operationLoading && { opacity: 0.6 }]}>
            {operationLoading ? <ActivityIndicator color="#FFF" /> : (
              <><Text style={styles.nextBtnText}>إرسال رمز التحقق</Text><MaterialIcons name="email" size={20} color="#FFF" /></>
            )}
          </Pressable>
        ) : (
          <Pressable onPress={handleVerifyAndSubmit} disabled={operationLoading} style={[styles.submitBtn, operationLoading && { opacity: 0.6 }]}>
            {operationLoading ? <ActivityIndicator color="#FFF" /> : (
              <><MaterialIcons name="verified" size={20} color="#FFF" /><Text style={styles.submitBtnText}>تأكيد وإرسال الطلب</Text></>
            )}
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
  stepText: { ...typography.captionBold, color: theme.primary },
  progressBar: { height: 4, backgroundColor: theme.backgroundSecondary },
  progressFill: { height: 4, backgroundColor: theme.primary, borderRadius: 2 },
  stepHeader: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  stepDesc: { ...typography.caption, writingDirection: 'rtl', textAlign: 'center' },
  label: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border, borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.radiusFull, backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border },
  chipActive: { backgroundColor: theme.primary + '20', borderColor: theme.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  chipTextActive: { color: theme.primary, fontWeight: '600' },
  otpIconContainer: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  noteBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.primary + '10', padding: 14, borderRadius: theme.radiusMedium, marginTop: 20 },
  noteText: { ...typography.caption, color: theme.primary, flex: 1, writingDirection: 'rtl', textAlign: 'right', lineHeight: 20 },
  resendBtn: { alignSelf: 'center', marginTop: 16, paddingVertical: 10, paddingHorizontal: 20 },
  resendText: { fontSize: 14, fontWeight: '600', color: theme.primary, textDecorationLine: 'underline' },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.radiusMedium },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.success, paddingVertical: 16, borderRadius: theme.radiusMedium },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
