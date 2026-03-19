import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { getSupabaseClient } from '@/template';
import { theme, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

const VEHICLE_TYPES = ['سيدان', 'دبل كابينة', 'فان', 'باص صغير', 'شاحنة خفيفة'];
const NATIONALITIES = ['سعودي', 'يمني', 'مصري', 'سوداني', 'سوري', 'أردني', 'باكستاني', 'هندي', 'بنغالي', 'أخرى'];

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { sendOTP, verifyOTPAndRegister, operationLoading } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Personal info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nationality, setNationality] = useState('');
  const [residenceNumber, setResidenceNumber] = useState('');

  // Step 2: Vehicle info
  const [vehicleType, setVehicleType] = useState('');
  const [carModel, setCarModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  // Step 3: Photos
  const [avatarUri, setAvatarUri] = useState('');
  const [carPhotoUris, setCarPhotoUris] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Step 4: OTP
  const [otp, setOtp] = useState('');

  const validateStep1 = () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !password || !confirmPassword || !nationality) {
      showAlert('خطأ', 'يرجى ملء جميع الحقول الإلزامية');
      return false;
    }
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      showAlert('خطأ', 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام');
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

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const pickCarPhoto = async () => {
    if (carPhotoUris.length >= 4) {
      showAlert('تنبيه', 'يمكنك إرفاق 4 صور كحد أقصى');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setCarPhotoUris(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removeCarPhoto = (index: number) => {
    setCarPhotoUris(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (uri: string, path: string): Promise<string | null> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.storage
        .from('driver-photos')
        .upload(path, decode(base64), { contentType: mimeType, upsert: true });
      if (error) { console.error('Upload error:', error); return null; }
      const { data: urlData } = supabase.storage.from('driver-photos').getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch (e) { console.error('Upload exception:', e); return null; }
  };

  const handleSendOTP = async () => {
    // Photos are optional, just proceed to OTP
    const result = await sendOTP(email.trim());
    if (result.success) {
      setStep(4);
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

    setUploadingPhotos(true);
    const timestamp = Date.now();

    // Upload avatar
    let avatarUrl = '';
    if (avatarUri) {
      const url = await uploadImage(avatarUri, `avatars/${timestamp}_avatar.jpg`);
      if (url) avatarUrl = url;
    }

    // Upload car photos
    const carPhotoUrls: string[] = [];
    for (let i = 0; i < carPhotoUris.length; i++) {
      const url = await uploadImage(carPhotoUris[i], `cars/${timestamp}_car_${i}.jpg`);
      if (url) carPhotoUrls.push(url);
    }
    setUploadingPhotos(false);

    const metadata: Record<string, any> = {
      full_name: name.trim(),
      phone: phone.trim(),
      username: name.trim().split(' ')[0],
      nationality: nationality,
      vehicle_type: vehicleType.trim(),
      car_model: carModel.trim(),
      vehicle_plate: vehiclePlate.trim(),
      license_number: licenseNumber.trim(),
      residence_number: residenceNumber.trim(),
    };
    if (avatarUrl) metadata.avatar_url = avatarUrl;
    if (carPhotoUrls.length > 0) metadata.car_photos = carPhotoUrls;

    const result = await verifyOTPAndRegister(email.trim(), otp.trim(), password, metadata, 'driver');

    if (result.success) {
      // Update car_photos as JSON if needed
      if (carPhotoUrls.length > 0 || avatarUrl || residenceNumber.trim()) {
        try {
          const supabase = getSupabaseClient();
          const userId = result.userId || result.user?.id;
          if (userId) {
            const updates: Record<string, any> = {};
            if (carPhotoUrls.length > 0) updates.car_photos = carPhotoUrls;
            if (avatarUrl) updates.avatar_url = avatarUrl;
            if (residenceNumber.trim()) updates.residence_number = residenceNumber.trim();
            await supabase.from('user_profiles').update(updates).eq('id', userId);
          }
        } catch (e) { console.error('Post-register update:', e); }
      }

      showAlert('تم التسجيل بنجاح', 'تم إرسال طلبك للمراجعة. ستتلقى إشعاراً عند قبول حسابك من الإدارة.', [
        { text: 'حسناً', onPress: () => { setTimeout(() => router.replace('/login'), 100); } },
      ]);
    } else {
      showAlert('خطأ', result.error || 'حدث خطأ في التسجيل');
    }
  };

  const totalSteps = 4;
  const currentStep = step;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => step > 1 ? setStep((step - 1) as any) : router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>تسجيل سائق جديد</Text>
        <Text style={styles.stepText}>{currentStep}/{totalSteps}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
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

              <Text style={styles.label}>رقم الإقامة</Text>
              <TextInput value={residenceNumber} onChangeText={setResidenceNumber} placeholder="رقم الإقامة (اختياري)" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="number-pad" />

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
          ) : step === 3 ? (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View style={styles.stepHeader}>
                <MaterialIcons name="photo-camera" size={32} color={theme.primary} />
                <Text style={styles.stepTitle}>الصور والمرفقات</Text>
                <Text style={styles.stepDesc}>أضف صورتك الشخصية وصور السيارة</Text>
              </View>

              {/* Personal Photo */}
              <Text style={styles.label}>الصورة الشخصية</Text>
              <Pressable onPress={pickAvatar} style={styles.avatarPickerCard}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarPreview} contentFit="cover" transition={200} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialIcons name="add-a-photo" size={32} color={theme.primary} />
                    <Text style={styles.avatarPlaceholderText}>اضغط لإضافة صورة شخصية</Text>
                  </View>
                )}
                {avatarUri ? (
                  <Pressable onPress={() => setAvatarUri('')} style={styles.removePhotoBtn}>
                    <MaterialIcons name="close" size={16} color="#FFF" />
                  </Pressable>
                ) : null}
              </Pressable>

              {/* Car Photos */}
              <Text style={[styles.label, { marginTop: 24 }]}>صور السيارة (حتى 4 صور)</Text>
              <View style={styles.carPhotosGrid}>
                {carPhotoUris.map((uri, index) => (
                  <View key={index} style={styles.carPhotoItem}>
                    <Image source={{ uri }} style={styles.carPhotoPreview} contentFit="cover" transition={200} />
                    <Pressable onPress={() => removeCarPhoto(index)} style={styles.removeCarPhotoBtn}>
                      <MaterialIcons name="close" size={14} color="#FFF" />
                    </Pressable>
                  </View>
                ))}
                {carPhotoUris.length < 4 ? (
                  <Pressable onPress={pickCarPhoto} style={styles.addCarPhotoBtn}>
                    <MaterialIcons name="add-photo-alternate" size={28} color={theme.primary} />
                    <Text style={styles.addCarPhotoText}>إضافة</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.noteBox}>
                <MaterialIcons name="info-outline" size={18} color={theme.primary} />
                <Text style={styles.noteText}>الصور اختيارية ولكنها تزيد من مصداقية حسابك وتسرّع عملية الموافقة.</Text>
              </View>
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

              <Pressable onPress={() => { setStep(3); handleSendOTP(); }} disabled={operationLoading} style={styles.resendBtn}>
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
          <Pressable onPress={() => { if (validateStep2()) setStep(3); }} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>التالي — الصور</Text>
            <MaterialIcons name="arrow-back" size={20} color="#FFF" />
          </Pressable>
        ) : step === 3 ? (
          <Pressable onPress={handleSendOTP} disabled={operationLoading} style={[styles.nextBtn, { backgroundColor: theme.accent }, operationLoading && { opacity: 0.6 }]}>
            {operationLoading ? <ActivityIndicator color="#FFF" /> : (
              <><Text style={styles.nextBtnText}>إرسال رمز التحقق</Text><MaterialIcons name="email" size={20} color="#FFF" /></>
            )}
          </Pressable>
        ) : (
          <Pressable onPress={handleVerifyAndSubmit} disabled={operationLoading || uploadingPhotos} style={[styles.submitBtn, (operationLoading || uploadingPhotos) && { opacity: 0.6 }]}>
            {operationLoading || uploadingPhotos ? (
              <><ActivityIndicator color="#FFF" /><Text style={styles.submitBtnText}>{uploadingPhotos ? 'جاري رفع الصور...' : 'جاري التحقق...'}</Text></>
            ) : (
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

  // Photo picker styles
  avatarPickerCard: {
    width: 140, height: 140, borderRadius: 70, alignSelf: 'center',
    backgroundColor: theme.surfaceElevated, borderWidth: 2, borderColor: theme.primary + '30',
    borderStyle: 'dashed', overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  avatarPreview: { width: 140, height: 140, borderRadius: 70 },
  avatarPlaceholder: { alignItems: 'center', gap: 8 },
  avatarPlaceholderText: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'center' },
  removePhotoBtn: {
    position: 'absolute', top: 4, right: 4, width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.error, alignItems: 'center', justifyContent: 'center',
  },

  carPhotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  carPhotoItem: {
    width: '47%' as any, aspectRatio: 4 / 3, borderRadius: theme.radiusMedium, overflow: 'hidden',
    borderWidth: 1, borderColor: theme.border,
  },
  carPhotoPreview: { width: '100%', height: '100%' },
  removeCarPhotoBtn: {
    position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12,
    backgroundColor: theme.error, alignItems: 'center', justifyContent: 'center',
  },
  addCarPhotoBtn: {
    width: '47%' as any, aspectRatio: 4 / 3, borderRadius: theme.radiusMedium,
    backgroundColor: theme.surfaceElevated, borderWidth: 2, borderColor: theme.primary + '25',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addCarPhotoText: { fontSize: 12, fontWeight: '600', color: theme.primary },
});
