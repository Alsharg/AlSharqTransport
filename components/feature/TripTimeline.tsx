import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface TimelineStep {
  key: string;
  label: string;
  icon: string;
  color: string;
}

const STEPS: TimelineStep[] = [
  { key: 'available', label: 'تم الإرسال', icon: 'send', color: '#2563EB' },
  { key: 'accepted', label: 'مقبول', icon: 'thumb-up', color: '#F59E0B' },
  { key: 'inProgress', label: 'جاري التنفيذ', icon: 'directions-car', color: '#7C3AED' },
  { key: 'completed', label: 'مكتمل', icon: 'check-circle', color: '#16A34A' },
];

function getStepIndex(status: string): number {
  if (status === 'cancelled') return -1;
  const map: Record<string, number> = {
    available: 0,
    accepted: 1,
    agreed: 1,
    confirmed: 1,
    inProgress: 2,
    completed: 3,
  };
  return map[status] ?? 0;
}

interface TripTimelineProps {
  status: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

export default function TripTimeline({ status, createdAt, updatedAt, completedAt }: TripTimelineProps) {
  const currentIndex = getStepIndex(status);
  const isCancelled = status === 'cancelled';

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`;
    } catch { return ''; }
  };

  if (isCancelled) {
    return (
      <View style={styles.cancelledCard}>
        <MaterialIcons name="cancel" size={28} color="#DC2626" />
        <Text style={styles.cancelledText}>تم إلغاء هذا المشوار</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>تتبع حالة المشوار</Text>
      <View style={styles.timeline}>
        {STEPS.map((step, index) => {
          const isDone = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === STEPS.length - 1;
          const dotColor = isDone ? step.color : theme.border;

          let timeLabel = '';
          if (index === 0 && createdAt) timeLabel = formatTime(createdAt);
          else if (index === currentIndex && updatedAt && index > 0) timeLabel = formatTime(updatedAt);
          if (index === 3 && completedAt) timeLabel = formatTime(completedAt);

          return (
            <View key={step.key} style={styles.stepRow}>
              {/* Dot column */}
              <View style={styles.dotColumn}>
                <View style={[
                  styles.dot,
                  { backgroundColor: isDone ? dotColor : theme.surfaceElevated, borderColor: isDone ? dotColor : theme.border },
                  isCurrent && styles.dotCurrent,
                  isCurrent && { borderColor: step.color },
                ]}>
                  <MaterialIcons
                    name={step.icon as any}
                    size={isCurrent ? 18 : 14}
                    color={isDone ? '#FFFFFF' : theme.textMuted}
                  />
                </View>
                {!isLast ? (
                  <View style={[styles.connector, { backgroundColor: isDone && index < currentIndex ? step.color : theme.border }]} />
                ) : null}
              </View>

              {/* Label column */}
              <View style={[styles.labelColumn, isCurrent && styles.labelColumnActive]}>
                <Text style={[styles.stepLabel, isDone && { color: theme.textPrimary, fontWeight: '700' }, isCurrent && { color: step.color }]}>{step.label}</Text>
                {timeLabel ? <Text style={[styles.stepTime, isCurrent && { color: step.color + 'CC' }]}>{timeLabel}</Text> : null}
                {isCurrent ? <View style={[styles.currentBadge, { backgroundColor: step.color + '15' }]}><View style={[styles.pulseDot, { backgroundColor: step.color }]} /><Text style={[styles.currentText, { color: step.color }]}>الحالة الحالية</Text></View> : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    borderWidth: 1,
    borderColor: theme.border,
    ...theme.shadow,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: 20,
  },
  timeline: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 64,
  },
  dotColumn: {
    alignItems: 'center',
    width: 40,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  dotCurrent: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
  },
  connector: {
    width: 3,
    flex: 1,
    minHeight: 20,
    borderRadius: 2,
    marginVertical: 4,
  },
  labelColumn: {
    flex: 1,
    paddingRight: 14,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  labelColumnActive: {
    paddingBottom: 20,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textMuted,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  stepTime: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.textMuted,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 2,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radiusFull,
    marginTop: 6,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  currentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cancelledCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    backgroundColor: '#DC262610',
    borderRadius: theme.radiusLarge,
    borderWidth: 1.5,
    borderColor: '#DC262630',
    alignItems: 'center',
    gap: 10,
  },
  cancelledText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
    writingDirection: 'rtl',
  },
});
