import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../../constants/theme';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../hooks/useAuth';

const TRIP_TYPES = [
  { id: 'monthly', label: 'شهري', icon: 'event-repeat', color: '#3B82F6' },
  { id: 'private', label: 'خاص', icon: 'person-pin-circle', color: '#8B5CF6' },
  { id: 'employee', label: 'موظفين', icon: 'groups', color: '#22C55E' },
  { id: 'delivery', label: 'توصيل', icon: 'local-shipping', color: '#F59E0B' },
];

const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

export default function RequestTripScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { createTrip, calculateTripPrice } = useApp();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [tripType, setTripType] = useState('monthly');
  const [city, setCity] = useState('');
  const [homeLocation, setHomeLocation] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [passengerGender, setPassengerGender] = useState<'male' | 'female'>('male');
  const [workDays, setWorkDays] = useState<string[]>([]);
  const [departureTime, setDepartureTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [notes, setNotes] = useState('');

  const toggleDay = (day: string) => {
    setWorkDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const [estimatedPrice, setEstimatedPrice] = useState(0);
  React.useEffect(() => {
    const price = calculateTripPrice(tripType, city, parseInt(passengers) || 1);
    setEstimatedPrice(price);
  }, [tripType, city, passengers, calculateTripPrice]);

  const handleSubmit = async () => {
    if (!homeLocation.trim() || !workLocation.trim()) {
      showAlert('خطأ', 'يرجى إدخال موقع الانطلاق والوصول');
      return;
    }
    setLoading(true);
    const result = await createTrip({
      type: tripType,
      pickup_location: homeLocation.trim(),
      dropoff_location: workLocation.trim(),
      home_location: homeLocation.trim(),
      work_location: workLocation.trim(),
      scheduled_time: departureTime || '07:00',
      scheduled_date: new Date().toISOString().split('T')[0],
      passengers: parseInt(passengers) || 1,
      passenger_gender: passengerGender,
      price: estimatedPrice,
      notes: notes.trim(),
      city: city.trim(),
      work_days: workDays.join(', '),
      departure_time: departureTime,
      return_time: returnTime,
      client_name: user?.full_name || user?.username || '',
      client_phone: user?.phone || '',
      payment_type: 'prepaid',
    });
    setLoading(false);
    if (!result.error) {
      showAlert('تم إرسال الطلب', 'سيتم مراجعة طلبك وتعيين سائق مناسب. ستتلقى إشعاراً عند التأكيد.');
      setHomeLocation(''); setWorkLocation(''); setNotes(''); setCity('');
      setDepartureTime(''); setReturnTime(''); setWorkDays([]);
    } else showAlert('خطأ', result.error);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>طلب مشوار جديد</Text>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
          {/* Trip Type */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <Text style={styles.label}>نوع المشوار</Text>
            <View style={styles.typesRow}>
              {TRIP_TYPES.map(type => (
                <Pressable key={type.id} onPress={() => setTripType(type.id)} style={[styles.typeCard, tripType === type.id && { borderColor: type.color, backgroundColor: type.color + '10' }]}>
                  <MaterialIcons name={type.icon as any} size={24} color={tripType === type.id ? type.color : theme.textMuted} />
                  <Text style={[styles.typeLabel, tripType === type.id && { color: type.color, fontWeight: '700' }]}>{type.label}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Locations */}
          <Animated.View entering={FadeInDown.duration(300).delay(100)}>
            <Text style={styles.label}>المدينة</Text>
            <TextInput value={city} onChangeText={setCity} placeholder="مثال: الدمام" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
            <Text style={styles.label}>موقع الانطلاق (البيت) *</Text>
            <TextInput value={homeLocation} onChangeText={setHomeLocation} placeholder="الحي - الشارع" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
            <Text style={styles.label}>موقع الوصول (العمل) *</Text>
            <TextInput value={workLocation} onChangeText={setWorkLocation} placeholder="الحي - الشارع" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
          </Animated.View>

          {/* Passengers & Gender */}
          <Animated.View entering={FadeInDown.duration(300).delay(200)}>
            <Text style={styles.label}>عدد الركاب</Text>
            <TextInput value={passengers} onChangeText={setPassengers} placeholder="1" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" keyboardType="number-pad" />
            <Text style={styles.label}>جنس الراكب</Text>
            <View style={styles.genderRow}>
              <Pressable onPress={() => setPassengerGender('male')} style={[styles.genderBtn, passengerGender === 'male' && styles.genderActive]}>
                <MaterialIcons name="male" size={20} color={passengerGender === 'male' ? '#3B82F6' : theme.textMuted} />
                <Text style={[styles.genderText, passengerGender === 'male' && { color: '#3B82F6' }]}>ذكر</Text>
              </Pressable>
              <Pressable onPress={() => setPassengerGender('female')} style={[styles.genderBtn, passengerGender === 'female' && styles.genderActive]}>
                <MaterialIcons name="female" size={20} color={passengerGender === 'female' ? '#EC4899' : theme.textMuted} />
                <Text style={[styles.genderText, passengerGender === 'female' && { color: '#EC4899' }]}>أنثى</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Work Days */}
          <Animated.View entering={FadeInDown.duration(300).delay(300)}>
            <Text style={styles.label}>أيام العمل</Text>
            <View style={styles.daysRow}>
              {DAYS.map(day => (
                <Pressable key={day} onPress={() => toggleDay(day)} style={[styles.dayChip, workDays.includes(day) && styles.dayActive]}>
                  <Text style={[styles.dayText, workDays.includes(day) && styles.dayTextActive]}>{day}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Times */}
          <Animated.View entering={FadeInDown.duration(300).delay(400)}>
            <Text style={styles.label}>وقت الذهاب</Text>
            <TextInput value={departureTime} onChangeText={setDepartureTime} placeholder="مثال: 07:00 صباحاً" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
            <Text style={styles.label}>وقت العودة</Text>
            <TextInput value={returnTime} onChangeText={setReturnTime} placeholder="مثال: 04:00 مساءً" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
          </Animated.View>

          {/* Estimated Price */}
          {estimatedPrice > 0 ? (
            <Animated.View entering={FadeInDown.duration(300).delay(450)} style={styles.priceCard}>
              <View style={styles.priceHeader}>
                <MaterialIcons name="calculate" size={22} color={theme.accent} />
                <Text style={styles.priceLabel}>السعر التقديري</Text>
              </View>
              <Text style={styles.priceValue}>{estimatedPrice.toFixed(0)} ر.س</Text>
              <Text style={styles.priceNote}>يتم حسابه تلقائياً حسب نوع المشوار والمدينة وعدد الركاب</Text>
            </Animated.View>
          ) : null}

          {/* Notes */}
          <Animated.View entering={FadeInDown.duration(300).delay(500)}>
            <Text style={styles.label}>ملاحظات إضافية</Text>
            <TextInput value={notes} onChangeText={setNotes} placeholder="أي تفاصيل إضافية..." placeholderTextColor={theme.textMuted} style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} textAlign="right" multiline />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={handleSubmit} disabled={loading} style={[styles.submitBtn, loading && { opacity: 0.6 }]}>
          {loading ? <ActivityIndicator color="#FFF" /> : <><MaterialIcons name="send" size={20} color="#FFF" /><Text style={styles.submitBtnText}>إرسال الطلب</Text></>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl', textAlign: 'center' },
  label: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right', marginBottom: 8, marginTop: 18 },
  input: { backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border, borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl' },
  typesRow: { flexDirection: 'row', gap: 10 },
  typeCard: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 16, borderRadius: theme.radiusMedium, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border },
  typeLabel: { fontSize: 12, fontWeight: '500', color: theme.textMuted },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: theme.radiusMedium, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border },
  genderActive: { borderColor: '#3B82F6', backgroundColor: '#3B82F6' + '10' },
  genderText: { fontSize: 14, fontWeight: '600', color: theme.textMuted },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.radiusFull, backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border },
  dayActive: { backgroundColor: '#8B5CF6' + '20', borderColor: '#8B5CF6' },
  dayText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  dayTextActive: { color: '#8B5CF6', fontWeight: '600' },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8B5CF6', paddingVertical: 16, borderRadius: theme.radiusMedium },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  priceCard: { marginTop: 18, padding: 20, backgroundColor: theme.accent + '10', borderRadius: theme.radiusMedium, borderWidth: 1.5, borderColor: theme.accent + '30', alignItems: 'center', gap: 8 },
  priceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceLabel: { fontSize: 14, fontWeight: '600', color: theme.accent, writingDirection: 'rtl' as const },
  priceValue: { fontSize: 32, fontWeight: '700', color: theme.accent },
  priceNote: { fontSize: 11, color: theme.textMuted, writingDirection: 'rtl' as const, textAlign: 'center' as const },
});
