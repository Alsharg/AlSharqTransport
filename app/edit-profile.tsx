import React, { useState, useEffect } from 'react';
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
import { useApp } from '../contexts/AppContext';
import * as api from '../services/api';
import { getDriverLevelLabel, getDriverLevelColor } from '../services/types';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { user, refreshProfile, userRole } = useAuth();
  const { profile } = useApp();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [residenceNumber, setResidenceNumber] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [carPhotoUris, setCarPhotoUris] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setVehicleType(profile.vehicle_type || '');
      setVehiclePlate(profile.vehicle_plate || '');
      setLicenseNumber(profile.license_number || '');
      setResidenceNumber((profile as any).residence_number || '');
      if (profile.avatar_url) setAvatarUri(profile.avatar_url);
      const photos = (profile as any).car_photos;
      if (Array.isArray(photos)) setCarPhotoUris(photos);
    }
  }, [profile]);

  const uploadImage = async (uri: string, path: string): Promise<string | null> => {
    try {
      // If it is already a URL, skip upload
      if (uri.startsWith('http')) return uri;
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

  const handleSave = async () => {
    if (!fullName.trim()) {
      showAlert('خطأ', 'يرجى إدخال الاسم الكامل');
      return;
    }
    if (!user?.id) return;

    setSaving(true);
    const timestamp = Date.now();

    // Upload avatar if changed
    let finalAvatarUrl = avatarUri;
    if (avatarUri && !avatarUri.startsWith('http')) {
      const url = await uploadImage(avatarUri, `avatars/${user.id}_${timestamp}.jpg`);
      if (url) finalAvatarUrl = url;
    }

    // Upload car photos
    const finalCarPhotos: string[] = [];
    for (let i = 0; i < carPhotoUris.length; i++) {
      if (carPhotoUris[i].startsWith('http')) {
        finalCarPhotos.push(carPhotoUris[i]);
      } else {
        const url = await uploadImage(carPhotoUris[i], `cars/${user.id}_${timestamp}_${i}.jpg`);
        if (url) finalCarPhotos.push(url);
      }
    }

    const updates: Record<string, any> = {
      full_name: fullName.trim(),
      phone: phone.trim(),
    };
    if (userRole === 'driver') {
      updates.vehicle_type = vehicleType.trim();
      updates.vehicle_plate = vehiclePlate.trim();
      updates.license_number = licenseNumber.trim();
      updates.residence_number = residenceNumber.trim();
      updates.car_photos = finalCarPhotos;
    }
    if (finalAvatarUrl && finalAvatarUrl.startsWith('http')) {
      updates.avatar_url = finalAvatarUrl;
    }

    const result = await api.updateUserProfile(user.id, updates);
    setSaving(false);

    if (result.error) {
      showAlert('خطأ', result.error);
    } else {
      await refreshProfile();
      showAlert('تم الحفظ', 'تم تحديث بياناتك بنجاح', [
        { text: 'حسناً', onPress: () => router.back() },
      ]);
    }
  };

  const levelColor = getDriverLevelColor(profile?.level || 1);
  const levelLabel = getDriverLevelLabel(profile?.level || 1);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="close" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>الملف الشخصي</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.avatarSection}>
            <Pressable onPress={pickAvatar} style={styles.avatarLarge}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" transition={200} />
              ) : (
                <MaterialIcons name="person" size={48} color={theme.primary} />
              )}
              <View style={styles.cameraOverlay}>
                <MaterialIcons name="camera-alt" size={16} color="#FFF" />
              </View>
            </Pressable>
            <Text style={styles.userName}>{profile?.full_name || profile?.username || ''}</Text>
            <Text style={styles.userEmail}>{profile?.email || ''}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.roleBadge, {
                backgroundColor: userRole === 'admin' ? '#FEF3C7' : userRole === 'supervisor' ? '#DBEAFE' : '#D1FAE5',
              }]}>
                <Text style={[styles.roleText, {
                  color: userRole === 'admin' ? '#D97706' : userRole === 'supervisor' ? '#3B82F6' : '#059669',
                }]}>
                  {userRole === 'admin' ? 'مدير' : userRole === 'supervisor' ? 'مشرف' : 'سائق'}
                </Text>
              </View>
              <View style={[styles.levelBadge, { backgroundColor: levelColor + '15' }]}>
                <MaterialIcons name="military-tech" size={14} color={levelColor} />
                <Text style={[styles.levelText, { color: levelColor }]}>المستوى {profile?.level || 1} - {levelLabel}</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(50)} style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.total_trips || 0}</Text>
              <Text style={styles.statLabel}>مشوار</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.statLabel}>التقييم</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.success }]}>{Number(profile?.bonuses || 0).toFixed(0)}</Text>
              <Text style={styles.statLabel}>المكافآت</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.error }]}>{Number(profile?.penalties || 0).toFixed(0)}</Text>
              <Text style={styles.statLabel}>المخالفات</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(100)}>
            <Text style={styles.sectionTitle}>المعلومات الشخصية</Text>

            <Text style={styles.label}>الاسم الكامل *</Text>
            <TextInput value={fullName} onChangeText={setFullName} placeholder="الاسم الكامل" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />

            <Text style={styles.label}>البريد الإلكتروني</Text>
            <View style={[styles.input, styles.disabledInput]}>
              <Text style={styles.disabledText}>{profile?.email || ''}</Text>
            </View>

            <Text style={styles.label}>رقم الجوال</Text>
            <TextInput value={phone} onChangeText={setPhone} placeholder="05XXXXXXXX" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="phone-pad" />
          </Animated.View>

          {userRole === 'driver' ? (
            <>
              <Animated.View entering={FadeInDown.duration(300).delay(200)}>
                <Text style={styles.sectionTitle}>بيانات المركبة</Text>

                <Text style={styles.label}>نوع المركبة</Text>
                <TextInput value={vehicleType} onChangeText={setVehicleType} placeholder="مثال: سيدان" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />

                <Text style={styles.label}>رقم اللوحة</Text>
                <TextInput value={vehiclePlate} onChangeText={setVehiclePlate} placeholder="أ ب ج 1234" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />

                <Text style={styles.label}>رقم رخصة القيادة</Text>
                <TextInput value={licenseNumber} onChangeText={setLicenseNumber} placeholder="DL-2025-XXXX" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />

                <Text style={styles.label}>رقم الإقامة</Text>
                <TextInput value={residenceNumber} onChangeText={setResidenceNumber} placeholder="رقم الإقامة (اختياري)" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="number-pad" />
              </Animated.View>

              {/* Car Photos */}
              <Animated.View entering={FadeInDown.duration(300).delay(250)}>
                <Text style={styles.sectionTitle}>صور السيارة</Text>
                <View style={styles.carPhotosGrid}>
                  {carPhotoUris.map((uri, index) => (
                    <View key={index} style={styles.carPhotoItem}>
                      <Image source={{ uri }} style={styles.carPhotoPreview} contentFit="cover" transition={200} />
                      <Pressable onPress={() => removeCarPhoto(index)} style={styles.removePhotoBtn}>
                        <MaterialIcons name="close" size={14} color="#FFF" />
                      </Pressable>
                    </View>
                  ))}
                  {carPhotoUris.length < 4 ? (
                    <Pressable onPress={pickCarPhoto} style={styles.addPhotoBtn}>
                      <MaterialIcons name="add-photo-alternate" size={28} color={theme.primary} />
                      <Text style={styles.addPhotoText}>إضافة صورة</Text>
                    </Pressable>
                  ) : null}
                </View>
              </Animated.View>
            </>
          ) : null}

          <Animated.View entering={FadeInDown.duration(300).delay(300)} style={styles.infoCard}>
            <MaterialIcons name="info-outline" size={18} color={theme.primary} />
            <Text style={styles.infoText}>
              تاريخ الإنشاء: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ar-SA') : '-'}
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={handleSave} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
          {saving ? <><ActivityIndicator color="#FFF" /><Text style={styles.saveBtnText}>جاري الحفظ...</Text></> : (
            <>
              <MaterialIcons name="save" size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
            </>
          )}
        </Pressable>
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
  avatarSection: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  avatarLarge: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: theme.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    borderWidth: 3, borderColor: theme.primary + '30', overflow: 'hidden',
  },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15,
    backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: theme.surface,
  },
  userName: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  userEmail: { ...typography.caption, writingDirection: 'rtl' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: theme.radiusFull },
  roleText: { fontSize: 12, fontWeight: '700' },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radiusFull },
  levelText: { fontSize: 12, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    padding: 18, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, marginBottom: 24, ...theme.shadow,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl' },
  statDivider: { width: 1, height: 36, backgroundColor: theme.border },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right', marginBottom: 12, marginTop: 8 },
  label: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border,
    borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl', ...theme.shadow,
  },
  disabledInput: { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderLight, justifyContent: 'center' },
  disabledText: { fontSize: 15, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right' },

  // Car photos
  carPhotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  carPhotoItem: {
    width: '47%' as any, aspectRatio: 4 / 3, borderRadius: theme.radiusMedium,
    overflow: 'hidden', borderWidth: 1, borderColor: theme.border,
  },
  carPhotoPreview: { width: '100%', height: '100%' },
  removePhotoBtn: {
    position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12,
    backgroundColor: theme.error, alignItems: 'center', justifyContent: 'center',
  },
  addPhotoBtn: {
    width: '47%' as any, aspectRatio: 4 / 3, borderRadius: theme.radiusMedium,
    backgroundColor: theme.surfaceElevated, borderWidth: 2, borderColor: theme.primary + '25',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addPhotoText: { fontSize: 11, fontWeight: '600', color: theme.primary },

  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.primary + '08', padding: 14, borderRadius: theme.radiusMedium, marginTop: 24,
  },
  infoText: { ...typography.caption, color: theme.primary, flex: 1, writingDirection: 'rtl', textAlign: 'right' },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.radiusMedium,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
