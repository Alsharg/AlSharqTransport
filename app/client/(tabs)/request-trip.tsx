import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../../constants/theme';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../hooks/useAuth';
import { LocationPicker } from '../../../components/maps/LocationPicker';
import { calculateDistance, calculateMonthlyPrice } from '../../../services/distance';

const TRIP_TYPES = [
  { id: 'monthly', label: 'اشتراك شهري', icon: 'event-repeat', color: '#3B82F6', desc: 'توصيل يومي ذهاب وعودة' },
  { id: 'employee', label: 'موظفين', icon: 'groups', color: '#22C55E', desc: 'نقل موظفين للشركات' },
  { id: 'delivery', label: 'توصيل', icon: 'local-shipping', color: '#F59E0B', desc: 'توصيل طلبات ومستندات' },
];

const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

interface PassengerLocation {
  name: string;
  home: { address: string; lat: number; lng: number } | null;
  work: { address: string; lat: number; lng: number } | null;
}

// Default per-km pricing (used when no pricing_config found)
const DEFAULT_PRICE_PER_KM = 0.8; // ريال/كم
const DEFAULT_BASE_MONTHLY = 100; // ريال أساسي شهري
const EXTRA_PASSENGER_PERCENT = 15; // 15% زيادة لكل شخص إضافي

export default function RequestTripScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { createTrip, calculateTripPrice } = useApp();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [calculatingDistance, setCalculatingDistance] = useState(false);

  const [tripType, setTripType] = useState('monthly');
  const [city, setCity] = useState('');

  // Main locations (for single passenger or base locations)
  const [homeLocation, setHomeLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [workLocation, setWorkLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);

  const [passengers, setPassengers] = useState(1);
  const [passengerGender, setPassengerGender] = useState<'male' | 'female'>('male');
  const [workDays, setWorkDays] = useState<string[]>([]);
  const [departureTime, setDepartureTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [notes, setNotes] = useState('');

  // Multi-passenger data
  const [passengersData, setPassengersData] = useState<PassengerLocation[]>([]);

  // Distance & pricing
  const [distanceKm, setDistanceKm] = useState(0);
  const [pricingBreakdown, setPricingBreakdown] = useState<{
    baseMonthly: number;
    passengerSurcharge: number;
    totalMonthly: number;
    roundTripKm: number;
    totalKmPerMonth: number;
  } | null>(null);

  // Sync passengersData array length with passengers count
  useEffect(() => {
    if (passengers > 1) {
      setPassengersData(prev => {
        const newData = [...prev];
        while (newData.length < passengers - 1) {
          newData.push({ name: '', home: null, work: null });
        }
        return newData.slice(0, passengers - 1);
      });
    } else {
      setPassengersData([]);
    }
  }, [passengers]);

  const toggleDay = (day: string) => {
    setWorkDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  // Auto-calculate distance and price when locations change
  useEffect(() => {
    if (homeLocation && workLocation && workDays.length > 0) {
      calculatePricing();
    } else {
      setPricingBreakdown(null);
    }
  }, [homeLocation, workLocation, workDays.length, passengers]);

  const calculatePricing = useCallback(async () => {
    if (!homeLocation || !workLocation || workDays.length === 0) return;

    setCalculatingDistance(true);
    try {
      const result = await calculateDistance(
        homeLocation.lat, homeLocation.lng,
        workLocation.lat, workLocation.lng
      );

      let oneWayKm = 0;
      if (result) {
        oneWayKm = result.distanceKm;
        setDistanceKm(oneWayKm);
      } else {
        // Fallback: Haversine approximation
        const R = 6371;
        const dLat = ((workLocation.lat - homeLocation.lat) * Math.PI) / 180;
        const dLon = ((workLocation.lng - homeLocation.lng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((homeLocation.lat * Math.PI) / 180) * Math.cos((workLocation.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        oneWayKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        setDistanceKm(Math.round(oneWayKm * 10) / 10);
      }

      const pricing = calculateMonthlyPrice(
        oneWayKm,
        DEFAULT_PRICE_PER_KM,
        DEFAULT_BASE_MONTHLY,
        workDays.length,
        passengers,
        EXTRA_PASSENGER_PERCENT
      );
      setPricingBreakdown(pricing);
    } catch (e) {
      console.error('Pricing calculation error:', e);
    }
    setCalculatingDistance(false);
  }, [homeLocation, workLocation, workDays.length, passengers]);

  const updatePassengerData = (index: number, field: keyof PassengerLocation, value: any) => {
    setPassengersData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!homeLocation || !workLocation) {
      showAlert('خطأ', 'يرجى تحديد موقع البيت وموقع العمل على الخريطة');
      return;
    }
    if (workDays.length === 0) {
      showAlert('خطأ', 'يرجى اختيار أيام العمل');
      return;
    }
    if (!departureTime.trim()) {
      showAlert('خطأ', 'يرجى تحديد وقت الذهاب');
      return;
    }

    // Validate multi-passenger data
    if (passengers > 1) {
      for (let i = 0; i < passengersData.length; i++) {
        if (!passengersData[i].name.trim()) {
          showAlert('خطأ', `يرجى إدخال اسم الراكب ${i + 2}`);
          return;
        }
        if (!passengersData[i].home || !passengersData[i].work) {
          showAlert('خطأ', `يرجى تحديد مواقع الراكب ${i + 2} على الخريطة`);
          return;
        }
      }
    }

    const finalPrice = pricingBreakdown?.totalMonthly || 0;

    // Build passengers data JSON for storage
    const allPassengers = [
      { name: user?.full_name || user?.username || 'الراكب الأساسي', home: homeLocation, work: workLocation },
      ...passengersData.map(p => ({ name: p.name, home: p.home, work: p.work })),
    ];

    setLoading(true);
    const result = await createTrip({
      type: tripType,
      pickup_location: homeLocation.address,
      dropoff_location: workLocation.address,
      pickup_lat: homeLocation.lat,
      pickup_lng: homeLocation.lng,
      dropoff_lat: workLocation.lat,
      dropoff_lng: workLocation.lng,
      home_location: homeLocation.address,
      work_location: workLocation.address,
      scheduled_time: departureTime || '07:00',
      scheduled_date: new Date().toISOString().split('T')[0],
      passengers,
      passenger_gender: passengerGender,
      price: finalPrice,
      notes: notes.trim(),
      city: city.trim(),
      work_days: workDays.join(', '),
      departure_time: departureTime,
      return_time: returnTime,
      client_name: user?.full_name || user?.username || '',
      client_phone: user?.phone || '',
      payment_type: 'prepaid',
      passengers_data: allPassengers,
    });
    setLoading(false);

    if (!result.error) {
      showAlert('تم إرسال طلب الاشتراك', `تم إرسال طلب الاشتراك الشهري بقيمة ${finalPrice} ر.س/شهرياً. سيتم مراجعته وتعيين سائق مناسب.`);
      setHomeLocation(null);
      setWorkLocation(null);
      setNotes('');
      setCity('');
      setDepartureTime('');
      setReturnTime('');
      setWorkDays([]);
      setPassengers(1);
      setPassengersData([]);
      setPricingBreakdown(null);
    } else {
      showAlert('خطأ', result.error);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="event-repeat" size={22} color={theme.primary} />
        <Text style={styles.headerTitle}>طلب اشتراك جديد</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>

          {/* Trip Type */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <Text style={styles.sectionTitle}>نوع الخدمة</Text>
            <View style={styles.typesRow}>
              {TRIP_TYPES.map(type => (
                <Pressable key={type.id} onPress={() => setTripType(type.id)} style={[styles.typeCard, tripType === type.id && { borderColor: type.color, backgroundColor: type.color + '08' }]}>
                  <MaterialIcons name={type.icon as any} size={24} color={tripType === type.id ? type.color : theme.textMuted} />
                  <Text style={[styles.typeLabel, tripType === type.id && { color: type.color, fontWeight: '700' }]}>{type.label}</Text>
                  <Text style={styles.typeDesc}>{type.desc}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* City */}
          <Animated.View entering={FadeInDown.duration(300).delay(50)}>
            <Text style={styles.label}>المدينة</Text>
            <TextInput value={city} onChangeText={setCity} placeholder="مثال: الدمام" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
          </Animated.View>

          {/* Map Locations */}
          <Animated.View entering={FadeInDown.duration(300).delay(100)}>
            <Text style={styles.sectionTitle}>
              <MaterialIcons name="map" size={16} color={theme.primary} /> تحديد المواقع
            </Text>
            <Text style={styles.sectionDesc}>حدد موقع البيت والعمل على الخريطة لحساب المسافة تلقائياً</Text>

            <LocationPicker
              label="موقع البيت (نقطة الانطلاق)"
              icon="home"
              iconColor={theme.success}
              value={homeLocation}
              onChange={setHomeLocation}
            />
            <LocationPicker
              label="موقع العمل (الوجهة)"
              icon="work"
              iconColor={theme.error}
              value={workLocation}
              onChange={setWorkLocation}
            />
          </Animated.View>

          {/* Passengers & Gender */}
          <Animated.View entering={FadeInDown.duration(300).delay(200)}>
            <Text style={styles.sectionTitle}>الركاب</Text>
            <View style={styles.passengerRow}>
              <Text style={styles.label}>عدد الأشخاص</Text>
              <View style={styles.counterRow}>
                <Pressable onPress={() => setPassengers(Math.max(1, passengers - 1))} style={styles.counterBtn}>
                  <MaterialIcons name="remove" size={20} color={theme.primary} />
                </Pressable>
                <Text style={styles.counterValue}>{passengers}</Text>
                <Pressable onPress={() => setPassengers(Math.min(10, passengers + 1))} style={styles.counterBtn}>
                  <MaterialIcons name="add" size={20} color={theme.primary} />
                </Pressable>
              </View>
            </View>

            {passengers > 1 ? (
              <View style={styles.extraPassengerNote}>
                <MaterialIcons name="info-outline" size={16} color={theme.accent} />
                <Text style={styles.extraPassengerText}>
                  زيادة {EXTRA_PASSENGER_PERCENT}% لكل شخص إضافي. حدد موقع كل شخص لحساب أدق.
                </Text>
              </View>
            ) : null}

            <Text style={[styles.label, { marginTop: 12 }]}>جنس الراكب</Text>
            <View style={styles.genderRow}>
              <Pressable onPress={() => setPassengerGender('male')} style={[styles.genderBtn, passengerGender === 'male' && styles.genderActive]}>
                <MaterialIcons name="male" size={20} color={passengerGender === 'male' ? '#3B82F6' : theme.textMuted} />
                <Text style={[styles.genderText, passengerGender === 'male' && { color: '#3B82F6' }]}>ذكر</Text>
              </Pressable>
              <Pressable onPress={() => setPassengerGender('female')} style={[styles.genderBtn, passengerGender === 'female' && { borderColor: '#EC4899', backgroundColor: '#EC489910' }]}>
                <MaterialIcons name="female" size={20} color={passengerGender === 'female' ? '#EC4899' : theme.textMuted} />
                <Text style={[styles.genderText, passengerGender === 'female' && { color: '#EC4899' }]}>أنثى</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Additional Passengers Locations */}
          {passengers > 1 ? (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Text style={styles.sectionTitle}>مواقع الركاب الإضافيين</Text>
              {passengersData.map((p, i) => (
                <View key={i} style={styles.passengerCard}>
                  <View style={styles.passengerCardHeader}>
                    <View style={[styles.passengerNum, { backgroundColor: theme.accent + '20' }]}>
                      <Text style={[styles.passengerNumText, { color: theme.accent }]}>{i + 2}</Text>
                    </View>
                    <Text style={styles.passengerCardTitle}>الراكب {i + 2}</Text>
                  </View>

                  <TextInput
                    value={p.name}
                    onChangeText={(v) => updatePassengerData(i, 'name', v)}
                    placeholder={`اسم الراكب ${i + 2}`}
                    placeholderTextColor={theme.textMuted}
                    style={[styles.input, { marginBottom: 10 }]}
                    textAlign="right"
                  />

                  <LocationPicker
                    label={`بيت الراكب ${i + 2}`}
                    icon="home"
                    iconColor="#22C55E"
                    value={p.home}
                    onChange={(v) => updatePassengerData(i, 'home', v)}
                  />
                  <LocationPicker
                    label={`عمل الراكب ${i + 2}`}
                    icon="work"
                    iconColor="#EF4444"
                    value={p.work}
                    onChange={(v) => updatePassengerData(i, 'work', v)}
                  />
                </View>
              ))}
            </Animated.View>
          ) : null}

          {/* Work Days */}
          <Animated.View entering={FadeInDown.duration(300).delay(300)}>
            <Text style={styles.sectionTitle}>أيام العمل *</Text>
            <View style={styles.daysRow}>
              {DAYS.map(day => (
                <Pressable key={day} onPress={() => toggleDay(day)} style={[styles.dayChip, workDays.includes(day) && styles.dayActive]}>
                  <Text style={[styles.dayText, workDays.includes(day) && styles.dayTextActive]}>{day}</Text>
                </Pressable>
              ))}
            </View>
            {workDays.length > 0 ? (
              <Text style={styles.daysCount}>{workDays.length} أيام × 4 أسابيع = {workDays.length * 4} يوم/شهر</Text>
            ) : null}
          </Animated.View>

          {/* Times */}
          <Animated.View entering={FadeInDown.duration(300).delay(400)}>
            <Text style={styles.label}>وقت الذهاب *</Text>
            <TextInput value={departureTime} onChangeText={setDepartureTime} placeholder="مثال: 07:00 صباحاً" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
            <Text style={styles.label}>وقت العودة</Text>
            <TextInput value={returnTime} onChangeText={setReturnTime} placeholder="مثال: 04:00 مساءً" placeholderTextColor={theme.textMuted} style={styles.input} textAlign="right" />
          </Animated.View>

          {/* Pricing Breakdown */}
          {calculatingDistance ? (
            <View style={styles.calcCard}>
              <ActivityIndicator color={theme.accent} />
              <Text style={styles.calcText}>جاري حساب المسافة والسعر...</Text>
            </View>
          ) : pricingBreakdown ? (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.priceCard}>
              <View style={styles.priceHeader}>
                <MaterialIcons name="receipt-long" size={22} color={theme.accent} />
                <Text style={styles.priceLabel}>تفاصيل التسعير الشهري</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>المسافة (ذهاب)</Text>
                <Text style={styles.priceRowValue}>{distanceKm.toFixed(1)} كم</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>ذهاب وإياب</Text>
                <Text style={styles.priceRowValue}>{pricingBreakdown.roundTripKm} كم</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>إجمالي الكيلومترات/شهر</Text>
                <Text style={styles.priceRowValue}>{pricingBreakdown.totalKmPerMonth} كم</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>السعر الأساسي الشهري</Text>
                <Text style={styles.priceRowValue}>{pricingBreakdown.baseMonthly} ر.س</Text>
              </View>
              {passengers > 1 ? (
                <View style={styles.priceRow}>
                  <Text style={styles.priceRowLabel}>زيادة {passengers - 1} ركاب إضافيين ({EXTRA_PASSENGER_PERCENT}% لكل)</Text>
                  <Text style={[styles.priceRowValue, { color: theme.warning }]}>+{pricingBreakdown.passengerSurcharge} ر.س</Text>
                </View>
              ) : null}

              <View style={styles.priceDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>الإجمالي الشهري</Text>
                <Text style={styles.totalValue}>{pricingBreakdown.totalMonthly} ر.س</Text>
              </View>
              <Text style={styles.priceFormula}>
                = ({pricingBreakdown.roundTripKm} كم × {DEFAULT_PRICE_PER_KM} ر.س/كم × {workDays.length} يوم × 4 أسابيع) + {DEFAULT_BASE_MONTHLY} أساسي
                {passengers > 1 ? ` + ${EXTRA_PASSENGER_PERCENT}% × ${passengers - 1} إضافي` : ''}
              </Text>
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
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <>
              <MaterialIcons name="send" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>
                إرسال طلب الاشتراك {pricingBreakdown ? `(${pricingBreakdown.totalMonthly} ر.س/شهر)` : ''}
              </Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
    borderBottomColor: theme.border, backgroundColor: theme.surface,
  },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' as const },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: theme.textPrimary,
    writingDirection: 'rtl' as const, textAlign: 'right', marginBottom: 8, marginTop: 20,
  },
  sectionDesc: {
    fontSize: 12, color: theme.textMuted, writingDirection: 'rtl' as const,
    textAlign: 'right', marginBottom: 12, lineHeight: 18,
  },
  label: {
    ...typography.captionBold, writingDirection: 'rtl' as const,
    textAlign: 'right', marginBottom: 6, marginTop: 14,
  },
  input: {
    backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border,
    borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl' as const,
  },
  typesRow: { flexDirection: 'row', gap: 10 },
  typeCard: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 16, paddingHorizontal: 6,
    borderRadius: theme.radiusMedium, backgroundColor: theme.surface,
    borderWidth: 1.5, borderColor: theme.border,
  },
  typeLabel: { fontSize: 12, fontWeight: '500', color: theme.textMuted, textAlign: 'center' },
  typeDesc: { fontSize: 9, color: theme.textMuted, textAlign: 'center' },
  passengerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8,
  },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  counterBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary + '15',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.primary + '30',
  },
  counterValue: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, minWidth: 30, textAlign: 'center' },
  extraPassengerNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.accent + '10', padding: 12, borderRadius: theme.radiusMedium,
    marginTop: 8,
  },
  extraPassengerText: {
    flex: 1, fontSize: 12, color: theme.accent, fontWeight: '600',
    writingDirection: 'rtl' as const, textAlign: 'right', lineHeight: 18,
  },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: theme.radiusMedium, backgroundColor: theme.surface,
    borderWidth: 1.5, borderColor: theme.border,
  },
  genderActive: { borderColor: '#3B82F6', backgroundColor: '#3B82F610' },
  genderText: { fontSize: 14, fontWeight: '600', color: theme.textMuted },
  passengerCard: {
    padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusLarge,
    borderWidth: 1, borderColor: theme.border, marginBottom: 12,
  },
  passengerCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  passengerNum: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  passengerNumText: { fontSize: 14, fontWeight: '700' },
  passengerCardTitle: {
    fontSize: 15, fontWeight: '700', color: theme.textPrimary,
    writingDirection: 'rtl' as const,
  },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.radiusFull,
    backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border,
  },
  dayActive: { backgroundColor: theme.primary + '20', borderColor: theme.primary },
  dayText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  dayTextActive: { color: theme.primary, fontWeight: '700' },
  daysCount: {
    fontSize: 12, color: theme.primary, fontWeight: '600',
    writingDirection: 'rtl' as const, textAlign: 'right', marginTop: 8,
  },
  calcCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 18, padding: 20, backgroundColor: theme.accent + '08',
    borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: theme.accent + '20',
  },
  calcText: { fontSize: 14, fontWeight: '600', color: theme.accent, writingDirection: 'rtl' as const },
  priceCard: {
    marginTop: 18, padding: 20, backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge, borderWidth: 1.5, borderColor: theme.accent + '30',
  },
  priceHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 16,
  },
  priceLabel: { fontSize: 15, fontWeight: '700', color: theme.accent, writingDirection: 'rtl' as const },
  priceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceRowLabel: {
    fontSize: 13, color: theme.textSecondary, writingDirection: 'rtl' as const,
  },
  priceRowValue: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },
  priceDivider: {
    height: 1, backgroundColor: theme.accent + '30', marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' as const },
  totalValue: { fontSize: 28, fontWeight: '700', color: theme.accent },
  priceFormula: {
    fontSize: 10, color: theme.textMuted, writingDirection: 'rtl' as const,
    textAlign: 'center', marginTop: 8, lineHeight: 16,
  },
  bottomBar: {
    paddingHorizontal: 20, paddingTop: 12, backgroundColor: theme.surface,
    borderTopWidth: 1, borderTopColor: theme.border,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.radiusMedium,
  },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700', writingDirection: 'rtl' as const },
});
