import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { config } from '../../constants/config';

type Period = 'today' | 'week' | 'month' | 'total';
const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'اليوم' },
  { id: 'week', label: 'الأسبوع' },
  { id: 'month', label: 'الشهر' },
  { id: 'total', label: 'الإجمالي' },
];

function ProgressRing({ progress, size = 140, strokeWidth = 8, color = theme.accent, trackColor = '#E5E7EB', children }: any) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} strokeDasharray={`${circumference}`} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="none" rotation="-90" origin={`${size / 2},${size / 2}`} />
      </Svg>
      {children}
    </View>
  );
}

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const { todayEarnings, weekEarnings, monthEarnings, totalEarnings, earnings, completedTrips, profile } = useApp();
  const { user } = require('../../hooks/useAuth').useAuth();
  const [activePeriod, setActivePeriod] = useState<Period>('week');

  const getEarnings = () => {
    switch (activePeriod) {
      case 'today': return todayEarnings;
      case 'week': return weekEarnings;
      case 'month': return monthEarnings;
      case 'total': return totalEarnings;
    }
  };

  const periodEarning = getEarnings();
  const periodCommission = periodEarning / config.driverShareRate * config.platformCommissionRate;
  const periodTotal = periodEarning + periodCommission;

  const myEarnings = earnings
    .filter(e => e.driver_id === user?.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <Text style={styles.title}>الأرباح</Text>
          <Text style={styles.subtitle}>تتبع دخلك وعمولة المنصة</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.periodContainer}>
          {PERIODS.map(period => (
            <Pressable key={period.id} onPress={() => setActivePeriod(period.id)} style={[styles.periodChip, activePeriod === period.id && styles.periodChipActive]}>
              <Text style={[styles.periodText, activePeriod === period.id && styles.periodTextActive]}>{period.label}</Text>
            </Pressable>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.heroCard}>
          <View style={styles.heroGradient}>
            <ProgressRing progress={Math.min(periodEarning / 1000, 1)} size={160} strokeWidth={10} color="#FCD34D" trackColor="rgba(255,255,255,0.2)">
              <View style={{ alignItems: 'center' }}><Text style={styles.heroAmount}>{periodEarning.toFixed(0)}</Text><Text style={styles.heroCurrency}>ر.س</Text></View>
            </ProgressRing>
            <Text style={styles.heroLabel}>صافي أرباحك</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>تفاصيل العمولة</Text>
          <View style={styles.breakdownRow}><View style={styles.breakdownItem}><View style={[styles.breakdownDot, { backgroundColor: theme.accent }]} /><Text style={styles.breakdownLabel}>إجمالي المشاوير</Text></View><Text style={styles.breakdownValue}>{periodTotal.toFixed(0)} ر.س</Text></View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownRow}><View style={styles.breakdownItem}><View style={[styles.breakdownDot, { backgroundColor: theme.error }]} /><Text style={styles.breakdownLabel}>عمولة المنصة (10%)</Text></View><Text style={[styles.breakdownValue, { color: theme.error }]}>-{periodCommission.toFixed(0)} ر.س</Text></View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownRow}><View style={styles.breakdownItem}><View style={[styles.breakdownDot, { backgroundColor: theme.success }]} /><Text style={[styles.breakdownLabel, { fontWeight: '700' }]}>صافي الربح (90%)</Text></View><Text style={[styles.breakdownValue, { color: theme.success, fontWeight: '700' }]}>{periodEarning.toFixed(0)} ر.س</Text></View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.quickStats}>
          <View style={styles.quickStatItem}><MaterialIcons name="check-circle" size={28} color={theme.success} /><Text style={styles.quickStatValue}>{completedTrips.length}</Text><Text style={styles.quickStatLabel}>مشوار مكتمل</Text></View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}><MaterialIcons name="trending-up" size={28} color={theme.accent} /><Text style={styles.quickStatValue}>{completedTrips.length > 0 ? (periodEarning / completedTrips.length).toFixed(0) : 0}</Text><Text style={styles.quickStatLabel}>متوسط الربح</Text></View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}><MaterialIcons name="star" size={28} color="#F59E0B" /><Text style={styles.quickStatValue}>{profile?.rating?.toFixed(1) || '5.0'}</Text><Text style={styles.quickStatLabel}>التقييم</Text></View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(500)}>
          <Text style={styles.sectionTitle}>آخر العمليات</Text>
          {myEarnings.length === 0 ? (
            <View style={styles.emptyTransactions}><MaterialIcons name="receipt-long" size={48} color={theme.border} /><Text style={styles.emptyText}>لا توجد عمليات بعد</Text></View>
          ) : myEarnings.map(earning => (
            <View key={earning.id} style={styles.transactionRow}>
              <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: '#ECFDF5' }]}><MaterialIcons name="check-circle" size={20} color={theme.success} /></View>
                <View><Text style={styles.transactionTitle}>مشوار مكتمل</Text><Text style={styles.transactionDate}>{earning.date}</Text></View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>+{Number(earning.driver_earning).toFixed(0)} ر.س</Text>
                <Text style={styles.transactionCommission}>عمولة: {Number(earning.platform_commission).toFixed(0)} ر.س</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { ...typography.title, writingDirection: 'rtl', textAlign: 'right' },
  subtitle: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  periodContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  periodChip: { flex: 1, paddingVertical: 10, borderRadius: theme.radiusMedium, backgroundColor: theme.surfaceElevated, alignItems: 'center' },
  periodChipActive: { backgroundColor: theme.primary },
  periodText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  periodTextActive: { color: '#FFF' },
  heroCard: { marginHorizontal: 20, borderRadius: theme.radiusXL, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: theme.border },
  heroGradient: { backgroundColor: theme.primaryDark, paddingVertical: 28, alignItems: 'center', gap: 12 },
  heroAmount: { fontSize: 42, fontWeight: '700', color: '#FFF' },
  heroCurrency: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  heroLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)', writingDirection: 'rtl' },
  breakdownCard: { marginHorizontal: 20, padding: 20, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border, marginBottom: 24 },
  breakdownTitle: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right', marginBottom: 14 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  breakdownItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { ...typography.body, writingDirection: 'rtl' },
  breakdownValue: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
  breakdownDivider: { height: 1, backgroundColor: theme.borderLight },
  quickStats: { flexDirection: 'row', marginHorizontal: 20, padding: 24, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border, marginBottom: 24, justifyContent: 'space-around' },
  quickStatItem: { alignItems: 'center', gap: 6 },
  quickStatValue: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
  quickStatLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl' },
  quickStatDivider: { width: 1, backgroundColor: theme.border },
  sectionTitle: { ...typography.sectionHeader, writingDirection: 'rtl', textAlign: 'right', paddingHorizontal: 20, marginBottom: 14 },
  transactionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, paddingVertical: 16, paddingHorizontal: 16, backgroundColor: theme.surface, borderRadius: theme.radiusMedium, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  transactionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  transactionTitle: { ...typography.bodyBold, writingDirection: 'rtl' },
  transactionDate: { ...typography.caption, writingDirection: 'rtl', marginTop: 1 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: '700', color: theme.success },
  transactionCommission: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  emptyTransactions: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { ...typography.caption, marginTop: 8 },
});
