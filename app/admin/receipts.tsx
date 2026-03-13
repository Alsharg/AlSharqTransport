import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { getCommissionStatusLabel, getCommissionStatusColor } from '../../services/types';

export default function AdminReceiptsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { commissionPayments, loadCommissionPayments, confirmCommission, rejectCommission, allDriversList, trips } = useApp();

  useEffect(() => { loadCommissionPayments(); }, []);

  const pendingReceipts = commissionPayments.filter(c => c.status === 'receipt_uploaded');
  const otherReceipts = commissionPayments.filter(c => c.status !== 'receipt_uploaded');

  const getDriverName = (driverId: string) => {
    const d = allDriversList.find(dr => dr.id === driverId);
    return d?.full_name || d?.username || 'سائق';
  };

  const getTripInfo = (tripId: string) => {
    const t = trips.find(tr => tr.id === tripId);
    return t ? `${t.pickup_location} \u2192 ${t.dropoff_location}` : 'مشوار';
  };

  const handleConfirm = (paymentId: string, driverName: string) => {
    showAlert('تأكيد الاستلام', `هل تم استلام العمولة من ${driverName}?\n\nسيتم الكشف عن بيانات العميل للسائق.`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تأكيد الاستلام', onPress: async () => {
        const result = await confirmCommission(paymentId);
        if (result.error) { showAlert('خطأ', result.error); }
        else { showAlert('تم التأكيد', 'تم تأكيد استلام العمولة وإشعار السائق.'); await loadCommissionPayments(); }
      }},
    ]);
  };

  const handleReject = (paymentId: string, driverName: string) => {
    showAlert('رفض الإيصال', `هل تريد رفض إيصال ${driverName}?\n\nسيتم إشعار السائق لإعادة التحويل.`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'رفض', style: 'destructive', onPress: async () => {
        const result = await rejectCommission(paymentId);
        if (result.error) { showAlert('خطأ', result.error); }
        else { showAlert('تم الرفض', 'تم رفض الإيصال وإشعار السائق.'); await loadCommissionPayments(); }
      }},
    ]);
  };

  const renderPayment = (payment: typeof commissionPayments[0], index: number) => {
    const driverName = getDriverName(payment.driver_id);
    const tripInfo = getTripInfo(payment.trip_id);
    const statusColor = getCommissionStatusColor(payment.status);
    const isPendingReview = payment.status === 'receipt_uploaded';

    return (
      <Animated.View key={payment.id} entering={FadeInDown.duration(250).delay(index * 50)}>
        <View style={[styles.card, isPendingReview && styles.cardHighlight]}>
          <View style={styles.cardTop}>
            <View style={[styles.avatarCircle, { backgroundColor: statusColor + '15' }]}>
              <MaterialIcons name="receipt" size={22} color={statusColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driverName}</Text>
              <Text style={styles.tripInfo} numberOfLines={1}>{tripInfo}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={[styles.amount, { color: statusColor }]}>{Number(payment.amount).toFixed(0)} ر.س</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{getCommissionStatusLabel(payment.status)}</Text>
              </View>
            </View>
          </View>

          {payment.receipt_url ? (
            <View style={styles.receiptSection}>
              <Text style={styles.receiptLabel}>إيصال التحويل</Text>
              <Image source={{ uri: payment.receipt_url }} style={styles.receiptImage} contentFit="contain" transition={200} />
            </View>
          ) : null}

          {isPendingReview ? (
            <View style={styles.actionsRow}>
              <Pressable onPress={() => handleConfirm(payment.id, driverName)} style={styles.confirmBtn}>
                <MaterialIcons name="check-circle" size={18} color="#FFF" />
                <Text style={styles.confirmBtnText}>تأكيد الاستلام</Text>
              </Pressable>
              <Pressable onPress={() => handleReject(payment.id, driverName)} style={styles.rejectBtn}>
                <MaterialIcons name="cancel" size={18} color={theme.error} />
                <Text style={styles.rejectBtnText}>رفض</Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={styles.dateText}>{new Date(payment.created_at).toLocaleDateString('ar-SA')} - {new Date(payment.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>إيصالات التحويل</Text>
        <View style={styles.pendingBadge}><Text style={styles.pendingBadgeText}>{pendingReceipts.length}</Text></View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {pendingReceipts.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>بانتظار المراجعة ({pendingReceipts.length})</Text>
            {pendingReceipts.map((p, i) => renderPayment(p, i))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={64} color={theme.border} />
            <Text style={styles.emptyText}>لا توجد إيصالات بانتظار المراجعة</Text>
          </View>
        )}

        {otherReceipts.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>جميع الإيصالات ({otherReceipts.length})</Text>
            {otherReceipts.slice(0, 20).map((p, i) => renderPayment(p, i + pendingReceipts.length))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  pendingBadge: { backgroundColor: theme.error, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  pendingBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  sectionTitle: { ...typography.sectionHeader, writingDirection: 'rtl', textAlign: 'right', marginBottom: 12 },
  card: { marginBottom: 12, padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, ...theme.shadow },
  cardHighlight: { borderWidth: 1.5, borderColor: '#3B82F6', ...theme.shadowElevated },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  driverName: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right' },
  tripInfo: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  amount: { fontSize: 18, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radiusFull },
  statusText: { fontSize: 10, fontWeight: '700' },
  receiptSection: { marginTop: 8, gap: 6 },
  receiptLabel: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right' },
  receiptImage: { width: '100%', height: 200, borderRadius: theme.radiusMedium, backgroundColor: theme.backgroundSecondary },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.borderLight },
  confirmBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.success, paddingVertical: 12, borderRadius: theme.radiusMedium },
  confirmBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.errorLight, paddingVertical: 12, borderRadius: theme.radiusMedium, borderWidth: 1.5, borderColor: theme.error },
  rejectBtnText: { color: theme.error, fontSize: 14, fontWeight: '700' },
  dateText: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 8, fontSize: 11 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.caption, marginTop: 12, writingDirection: 'rtl' },
});
