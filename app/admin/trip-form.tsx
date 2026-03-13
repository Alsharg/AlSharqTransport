import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAlert } from '@/template';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { Trip } from '../../services/types';

type TripType = Trip['type'];

const TRIP_TYPES: { id: TripType; label: string; icon: string }[] = [
  { id: 'employee', label: 'توصيل موظفين', icon: 'groups' },
  { id: 'monthly', label: 'توصيل شهري', icon: 'event-repeat' },
  { id: 'delivery', label: 'توصيل طلبات', icon: 'local-shipping' },
  { id: 'private', label: 'مشوار خاص', icon: 'person-pin-circle' },
];

const WORK_DAYS_OPTIONS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

export default function TripFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const { createTrip, updateTrip, getTripById } = useApp();

  const existingTrip = tripId ? getTripById(tripId) : undefined;
  const isEdit = !!existingTrip;

  const [type, setType] = useState<TripType>(existingTrip?.type || 'monthly');
  const [city, setCity] = useState(existingTrip?.city || '');
  const [homeLocation, setHomeLocation] = useState(existingTrip?.home_location || existingTrip?.pickup_location || '');
  const [workLocation, setWorkLocation] = useState(existingTrip?.work_location || existingTrip?.dropoff_location || '');
  const [passengers, setPassengers] = useState(String(existingTrip?.passengers || '1'));
  const [gender, setGender] = useState<'male' | 'female'>(existingTrip?.passenger_gender || 'male');
  const [workDays, setWorkDays] = useState<string[]>(existingTrip?.work_days ? existingTrip.work_days.split(',') : []);
  const [offDays, setOffDays] = useState(existingTrip?.off_days || '');
  const [departureTime, setDepartureTime] = useState(existingTrip?.departure_time || existingTrip?.scheduled_time || '');
  const [returnTime, setReturnTime] = useState(existingTrip?.return_time || '');
  const [price, setPrice] = useState(String(existingTrip?.price || ''));
  const [clientName, setClientName] = useState(existingTrip?.client_name || '');
  const [clientPhone, setClientPhone] = useState(existingTrip?.client_phone || '');
  const [notes, setNotes] = useState(existingTrip?.notes || '');
  const [paymentType, setPaymentType] = useState<'prepaid' | 'deferred'>(existingTrip?.payment_type || 'prepaid');
  const [saving, setSaving] = useState(false);

  const toggleWorkDay = (day: string) => {
    setWorkDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSave = async () => {
    if (!city.trim() || !homeLocation.trim() || !workLocation.trim() || !departureTime.trim() || !price.trim()) {
      showAlert('خطأ', 'يرجى ملء جميع الحقول المطلوبة (المدينة، موقع البيت، موقع العمل، الوقت، السعر)');
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showAlert('خطأ', 'يرجى إدخال سعر صحيح');
      return;
    }
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const tripData = {
      type,
      city: city.trim(),
      home_location: homeLocation.trim(),
      work_location: workLocation.trim(),
      pickup_location: homeLocation.trim(),
      dropoff_location: workLocation.trim(),
      scheduled_time: departureTime.trim(),
      scheduled_date: today,
      departure_time: departureTime.trim(),
      return_time: returnTime.trim(),
      passengers: parseInt(passengers) || 1,
      passenger_gender: gender,
      work_days: workDays.join(','),
      off_days: offDays.trim(),
      price: priceNum,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      notes: notes.trim(),
      payment_type: paymentType,
    };

    if (isEdit && tripId) {
      const result = await updateTrip(tripId, tripData);
      setSaving(false);
      if (result.error) { showAlert('خطأ', result.error); }
      else { showAlert('تم التحديث', 'تم تحديث المشوار بنجاح', [{ text: 'حسناً', onPress: () => router.back() }]); }
    } else {
      const result = await createTrip(tripData);
      setSaving(false);
      if (result.error) { showAlert('خطأ', result.error); }
      else { showAlert('تم الإنشاء', 'تم إنشاء المشوار وإرسال إشعار للسائقين', [{ text: 'حسناً', onPress: () => router.back() }]); }
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}><MaterialIcons name="close" size={24} color={theme.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>{isEdit ? 'تعديل المشوار' : 'مشوار جديد'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>نوع المشوار *</Text>
          <View style={styles.typeGrid}>
            {TRIP_TYPES.map(t => (
              <Pressable key={t.id} onPress={() => setType(t.id)} style={[styles.typeChip, type === t.id && styles.typeChipActive]}>
                <MaterialIcons name={t.icon as any} size={18} color={type === t.id ? '#FFF' : theme.textSecondary} />
                <Text style={[styles.typeChipText, type === t.id && { color: '#FFF' }]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionLabel}>بيانات الموقع</Text>

          <Text style={styles.label}>المدينة *</Text>
          <TextInput value={city} onChangeText={setCity} placeholder="مثال: الرياض" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />

          <Text style={styles.label}>موقع البيت *</Text>
          <TextInput value={homeLocation} onChangeText={setHomeLocation} placeholder="حي، شارع، رقم المبنى" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />

          <Text style={styles.label}>موقع العمل *</Text>
          <TextInput value={workLocation} onChangeText={setWorkLocation} placeholder="اسم الشركة، الموقع" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />

          <Text style={styles.sectionLabel}>بيانات الراكب</Text>

          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>عدد الأشخاص *</Text>
              <TextInput value={passengers} onChangeText={setPassengers} placeholder="1" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>الجنس *</Text>
              <View style={styles.genderRow}>
                <Pressable onPress={() => setGender('male')} style={[styles.genderChip, gender === 'male' && styles.genderActive]}>
                  <Text style={[styles.genderText, gender === 'male' && { color: '#FFF' }]}>ذكر</Text>
                </Pressable>
                <Pressable onPress={() => setGender('female')} style={[styles.genderChip, gender === 'female' && styles.genderActive]}>
                  <Text style={[styles.genderText, gender === 'female' && { color: '#FFF' }]}>أنثى</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>المواعيد والأيام</Text>

          <Text style={styles.label}>أيام العمل</Text>
          <View style={styles.daysWrap}>
            {WORK_DAYS_OPTIONS.map(d => (
              <Pressable key={d} onPress={() => toggleWorkDay(d)} style={[styles.dayChip, workDays.includes(d) && styles.dayActive]}>
                <Text style={[styles.dayText, workDays.includes(d) && { color: '#FFF' }]}>{d}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>أيام الأوف</Text>
          <TextInput value={offDays} onChangeText={setOffDays} placeholder="مثال: الجمعة، السبت" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>وقت الذهاب *</Text>
              <TextInput value={departureTime} onChangeText={setDepartureTime} placeholder="06:30" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>وقت العودة</Text>
              <TextInput value={returnTime} onChangeText={setReturnTime} placeholder="16:00" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
            </View>
          </View>

          <Text style={styles.sectionLabel}>بيانات العميل والسعر</Text>

          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>اسم العميل</Text>
              <TextInput value={clientName} onChangeText={setClientName} placeholder="اسم العميل" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>رقم العميل</Text>
              <TextInput value={clientPhone} onChangeText={setClientPhone} placeholder="05XXXXXXXX" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="phone-pad" />
            </View>
          </View>

          <Text style={styles.label}>السعر الشهري (ر.س) *</Text>
          <TextInput value={price} onChangeText={setPrice} placeholder="1500" placeholderTextColor={theme.textMuted} style={[styles.input, { fontSize: 20, fontWeight: '700' }]} textAlign="center" keyboardType="decimal-pad" />

          <Text style={styles.label}>طريقة دفع العمولة</Text>
          <View style={styles.genderRow}>
            <Pressable onPress={() => setPaymentType('prepaid')} style={[styles.genderChip, paymentType === 'prepaid' && styles.genderActive, { flex: 1 }]}>
              <Text style={[styles.genderText, paymentType === 'prepaid' && { color: '#FFF' }]}>مقدم</Text>
            </Pressable>
            <Pressable onPress={() => setPaymentType('deferred')} style={[styles.genderChip, paymentType === 'deferred' && styles.genderActive, { flex: 1 }]}>
              <Text style={[styles.genderText, paymentType === 'deferred' && { color: '#FFF' }]}>مؤجل (بعد يوم)</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>ملاحظات</Text>
          <TextInput value={notes} onChangeText={setNotes} placeholder="ملاحظات إضافية..." placeholderTextColor={theme.textMuted} style={[styles.input, styles.textArea]} textAlign="right" multiline numberOfLines={3} />

          {price ? (
            <View style={styles.pricePreview}>
              <View style={styles.previewRow}><Text style={styles.previewLabel}>السعر الشهري</Text><Text style={styles.previewValue}>{parseFloat(price) || 0} ر.س</Text></View>
              <View style={styles.previewRow}><Text style={styles.previewLabel}>عمولة المنصة (10%)</Text><Text style={[styles.previewValue, { color: theme.error }]}>-{((parseFloat(price) || 0) * 0.1).toFixed(0)} ر.س</Text></View>
              <View style={styles.previewRow}><Text style={[styles.previewLabel, { fontWeight: '700', color: theme.success }]}>ربح السائق</Text><Text style={[styles.previewValue, { color: theme.success, fontWeight: '700' }]}>{((parseFloat(price) || 0) * 0.9).toFixed(0)} ر.س</Text></View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={handleSave} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
          {saving ? <ActivityIndicator color="#FFF" /> : (
            <><MaterialIcons name={isEdit ? 'save' : 'add-circle'} size={22} color="#FFF" /><Text style={styles.saveBtnText}>{isEdit ? 'حفظ التعديلات' : 'إنشاء المشوار'}</Text></>
          )}
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
  sectionLabel: { fontSize: 14, fontWeight: '700', color: theme.primary, writingDirection: 'rtl', textAlign: 'right', marginTop: 24, marginBottom: 4, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
  label: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border, borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  rowInputs: { flexDirection: 'row', gap: 10 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.radiusMedium, backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: 'transparent' },
  typeChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  typeChipText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: theme.radiusMedium, backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border, alignItems: 'center' },
  genderActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  genderText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
  daysWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.radiusFull, backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border },
  dayActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  dayText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  pricePreview: { marginTop: 20, padding: 16, backgroundColor: theme.surfaceElevated, borderRadius: theme.radiusLarge, gap: 10, borderWidth: 1, borderColor: theme.border },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewLabel: { ...typography.body, writingDirection: 'rtl' },
  previewValue: { ...typography.bodyBold },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.radiusMedium },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
