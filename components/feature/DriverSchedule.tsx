import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../constants/theme';
import { Trip, getTripTypeLabel, formatTripNumber } from '../../services/types';

const DAYS_MAP: Record<string, string> = {
  'السبت': 'سبت',
  'الأحد': 'أحد',
  'الاثنين': 'اثن',
  'الثلاثاء': 'ثلا',
  'الأربعاء': 'أرب',
  'الخميس': 'خمي',
  'الجمعة': 'جمع',
};

const ALL_DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

// Get today's day name in Arabic
function getTodayName(): string {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[new Date().getDay()];
}

interface DriverScheduleProps {
  trips: Trip[];
  driverId: string;
}

interface SubscriberInfo {
  trip: Trip;
  clientName: string;
  homeLocation: string;
  workLocation: string;
  departureTime: string;
  returnTime: string;
  workDays: string[];
  passengers: number;
  price: number;
  passengersData: any[];
}

export function DriverSchedule({ trips, driverId }: DriverScheduleProps) {
  const router = useRouter();
  const todayName = getTodayName();

  // Extract active subscriptions assigned to this driver
  const subscriptions = useMemo(() => {
    return trips
      .filter(t =>
        t.driver_id === driverId &&
        ['accepted', 'confirmed', 'agreed', 'inProgress'].includes(t.status) &&
        (t.type === 'monthly' || t.type === 'employee')
      )
      .map(trip => {
        const workDaysStr = trip.work_days || '';
        const workDays = workDaysStr.split(',').map(d => d.trim()).filter(Boolean);
        const passData = Array.isArray((trip as any).passengers_data) ? (trip as any).passengers_data : [];

        return {
          trip,
          clientName: trip.client_name || 'عميل',
          homeLocation: trip.home_location || trip.pickup_location,
          workLocation: trip.work_location || trip.dropoff_location,
          departureTime: trip.departure_time || trip.scheduled_time || '07:00',
          returnTime: trip.return_time || '',
          workDays,
          passengers: trip.passengers || 1,
          price: trip.price,
          passengersData: passData,
        } as SubscriberInfo;
      });
  }, [trips, driverId]);

  // Filter today's schedule
  const todaySchedule = subscriptions.filter(sub => sub.workDays.includes(todayName));

  // Sort by departure time
  todaySchedule.sort((a, b) => a.departureTime.localeCompare(b.departureTime));

  if (subscriptions.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="calendar-today" size={18} color={theme.primary} />
        <Text style={styles.title}>جدول المشتركين</Text>
        <View style={styles.todayBadge}>
          <Text style={styles.todayText}>{todayName}</Text>
        </View>
      </View>

      {/* Today's Schedule */}
      {todaySchedule.length > 0 ? (
        <View style={styles.todaySection}>
          <Text style={styles.sectionLabel}>مشاوير اليوم ({todaySchedule.length})</Text>
          {todaySchedule.map((sub, index) => (
            <Pressable
              key={sub.trip.id}
              onPress={() => router.push({ pathname: '/trip-detail', params: { id: sub.trip.id } })}
              style={({ pressed }) => [styles.scheduleCard, pressed && { opacity: 0.9 }]}
            >
              <View style={styles.timeCol}>
                <View style={styles.timeBadge}>
                  <MaterialIcons name="schedule" size={12} color={theme.accent} />
                  <Text style={styles.timeText}>{sub.departureTime}</Text>
                </View>
                {sub.returnTime ? (
                  <View style={[styles.timeBadge, { backgroundColor: theme.primary + '10' }]}>
                    <MaterialIcons name="schedule" size={12} color={theme.primary} />
                    <Text style={[styles.timeText, { color: theme.primary }]}>{sub.returnTime}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.infoCol}>
                <View style={styles.clientRow}>
                  <Text style={styles.clientName}>{sub.clientName}</Text>
                  {sub.passengers > 1 ? (
                    <View style={styles.passengerBadge}>
                      <MaterialIcons name="people" size={12} color={theme.accent} />
                      <Text style={styles.passengerText}>{sub.passengers}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.routeMini}>
                  <View style={[styles.routeDotMini, { backgroundColor: theme.success }]} />
                  <Text style={styles.routeAddrMini} numberOfLines={1}>{sub.homeLocation}</Text>
                </View>
                <View style={styles.routeMini}>
                  <View style={[styles.routeDotMini, { backgroundColor: theme.error }]} />
                  <Text style={styles.routeAddrMini} numberOfLines={1}>{sub.workLocation}</Text>
                </View>

                {/* Show additional passengers */}
                {sub.passengersData.length > 1 ? (
                  <View style={styles.extraPassengers}>
                    {sub.passengersData.slice(1).map((p: any, pi: number) => (
                      <View key={pi} style={styles.extraPRow}>
                        <MaterialIcons name="person-pin" size={12} color={theme.textMuted} />
                        <Text style={styles.extraPText}>{p.name}: {p.home?.address?.substring(0, 30) || '...'}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>

              <Text style={styles.priceTag}>{sub.price} ر.س</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.noTripsToday}>
          <MaterialIcons name="event-available" size={32} color={theme.border} />
          <Text style={styles.noTripsTodayText}>لا توجد مشاوير اليوم ({todayName})</Text>
        </View>
      )}

      {/* Weekly Overview */}
      <View style={styles.weeklySection}>
        <Text style={styles.sectionLabel}>نظرة أسبوعية</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
          {ALL_DAYS.map(day => {
            const count = subscriptions.filter(s => s.workDays.includes(day)).length;
            const isToday = day === todayName;
            return (
              <View key={day} style={[styles.weekDay, isToday && styles.weekDayToday, count > 0 && styles.weekDayActive]}>
                <Text style={[styles.weekDayLabel, isToday && styles.weekDayLabelToday]}>{DAYS_MAP[day] || day}</Text>
                <Text style={[styles.weekDayCount, isToday && styles.weekDayCountToday, count > 0 && { color: theme.accent }]}>{count}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* All Subscriptions */}
      <View style={styles.allSubsSection}>
        <Text style={styles.sectionLabel}>كل الاشتراكات ({subscriptions.length})</Text>
        {subscriptions.map(sub => {
          const tripNum = formatTripNumber(sub.trip.trip_number);
          return (
            <Pressable
              key={sub.trip.id}
              onPress={() => router.push({ pathname: '/trip-detail', params: { id: sub.trip.id } })}
              style={styles.subRow}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {tripNum ? <Text style={styles.subNum}>{tripNum}</Text> : null}
                  <Text style={styles.subName}>{sub.clientName}</Text>
                </View>
                <Text style={styles.subDays}>{sub.workDays.join(' • ')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.subPrice}>{sub.price} ر.س/شهر</Text>
                <Text style={styles.subPassengers}>{sub.passengers} راكب</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, marginBottom: 12,
  },
  title: {
    fontSize: 17, fontWeight: '700', color: theme.textPrimary,
    writingDirection: 'rtl' as const, flex: 1,
  },
  todayBadge: {
    backgroundColor: theme.primary + '20', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: theme.radiusFull,
  },
  todayText: { fontSize: 12, fontWeight: '700', color: theme.primary },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: theme.textMuted,
    writingDirection: 'rtl' as const, textAlign: 'right', marginBottom: 8,
  },
  todaySection: { paddingHorizontal: 20, marginBottom: 16 },
  scheduleCard: {
    flexDirection: 'row', gap: 12, padding: 14,
    backgroundColor: theme.surface, borderRadius: theme.radiusMedium,
    borderWidth: 1, borderColor: theme.border, marginBottom: 8,
  },
  timeCol: { gap: 4, alignItems: 'center' },
  timeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.accent + '10', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: { fontSize: 11, fontWeight: '700', color: theme.accent },
  infoCol: { flex: 1, gap: 4 },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clientName: {
    fontSize: 14, fontWeight: '700', color: theme.textPrimary,
    writingDirection: 'rtl' as const,
  },
  passengerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: theme.accent + '15', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 8,
  },
  passengerText: { fontSize: 10, fontWeight: '700', color: theme.accent },
  routeMini: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeDotMini: { width: 6, height: 6, borderRadius: 3 },
  routeAddrMini: {
    fontSize: 11, color: theme.textSecondary, flex: 1,
    writingDirection: 'rtl' as const, textAlign: 'right',
  },
  extraPassengers: { marginTop: 4, gap: 2 },
  extraPRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  extraPText: {
    fontSize: 10, color: theme.textMuted, writingDirection: 'rtl' as const,
  },
  priceTag: { fontSize: 14, fontWeight: '700', color: theme.accent },
  noTripsToday: {
    alignItems: 'center', paddingVertical: 30, marginHorizontal: 20,
    backgroundColor: theme.surface, borderRadius: theme.radiusMedium,
    borderWidth: 1, borderColor: theme.border, gap: 8, marginBottom: 16,
  },
  noTripsTodayText: {
    fontSize: 13, fontWeight: '600', color: theme.textMuted,
    writingDirection: 'rtl' as const,
  },
  weeklySection: { paddingHorizontal: 20, marginBottom: 16 },
  weekDay: {
    width: 52, height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    gap: 4, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border,
  },
  weekDayToday: { borderColor: theme.primary, backgroundColor: theme.primary + '10' },
  weekDayActive: { borderColor: theme.accent + '40' },
  weekDayLabel: { fontSize: 10, fontWeight: '600', color: theme.textMuted },
  weekDayLabelToday: { color: theme.primary, fontWeight: '700' },
  weekDayCount: { fontSize: 18, fontWeight: '700', color: theme.textMuted },
  weekDayCountToday: { color: theme.primary },
  allSubsSection: { paddingHorizontal: 20 },
  subRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    backgroundColor: theme.surface, borderRadius: theme.radiusMedium,
    borderWidth: 1, borderColor: theme.border, marginBottom: 6,
  },
  subNum: { fontSize: 10, fontWeight: '700', color: theme.primary },
  subName: {
    fontSize: 14, fontWeight: '600', color: theme.textPrimary,
    writingDirection: 'rtl' as const,
  },
  subDays: {
    fontSize: 11, color: theme.textMuted, writingDirection: 'rtl' as const,
    textAlign: 'right', marginTop: 2,
  },
  subPrice: { fontSize: 13, fontWeight: '700', color: theme.accent },
  subPassengers: { fontSize: 10, color: theme.textMuted, marginTop: 2 },
});
