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

export default function AdminWalletReceiptsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { allWalletTransactions, loadAllWalletTransactions, approveTopUp, rejectTopUp, allDriversList } = useApp();

  useEffect(() => { loadAllWalletTransactions(); }, []);

  const pendingTx = allWalletTransactions.filter(t => t.status === 'pending' && t.type === 'topup');
  const otherTx = allWalletTransactions.filter(t => t.status !== 'pending' || t.type !== 'topup');

  const getDriverName = (driverId: string) => {
    const d = allDriversList.find(dr => dr.id === driverId);
    return d?.full_name || d?.username || 'سائق';
  };

  const handleApprove = (tx: typeof allWalletTransactions[0]) => {
    const name = getDriverName(tx.driver_id);
    showAlert('اعتماد الشحن', `هل تم استلام التحويل من ${name} بمبلغ ${Number(tx.amount).toFixed(0)} ر.س؟\n\nسيتم إضافة المبلغ لرصيد المحفظة وإشعار السائق.`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'اعتماد', onPress: async () => {
        const result = await approveTopUp(tx.id, tx.driver_id, Number(tx.amount));
        if (result.error) showAlert('خطأ', result.error);
        else { showAlert('تم الاعتماد', 'تم اعتماد شحن المحفظة وإشعار السائق.'); await loadAllWalletTransactions(); }
      }},
    ]);
  };

  const handleReject = (tx: typeof allWalletTransactions[0]) => {
    showAlert('رفض الشحن', 'هل تريد رفض إيصال الشحن؟ سيتم إشعار السائق.', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'رفض', style: 'destructive', onPress: async () => {
        const result = await rejectTopUp(tx.id);
        if (result.error) showAlert('خطأ', result.error);
        else { showAlert('تم الرفض', 'تم رفض الإيصال وإشعار السائق.'); await loadAllWalletTransactions(); }
      }},
    ]);
  };

  const renderTx = (tx: typeof allWalletTransactions[0], index: number) => {
    const driverName = getDriverName(tx.driver_id);
    const isPending = tx.status === 'pending';
    const statusColor = tx.status === 'approved' ? '#10B981' : tx.status === 'pending' ? '#F59E0B' : '#EF4444';

    return (
      <Animated.View key={tx.id} entering={FadeInDown.duration(250).delay(index * 50)}>
        <View style={[styles.card, isPending && styles.cardHighlight]}>
          <View style={styles.cardTop}>
            <View style={[styles.avatarCircle, { backgroundColor: statusColor + '15' }]}>
              <MaterialIcons name="account-balance-wallet" size={22} color={statusColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driverName}</Text>
              <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={[styles.amount, { color: statusColor }]}>{Number(tx.amount).toFixed(0)} ر.س</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {tx.status === 'approved' ? 'مقبول' : tx.status === 'pending' ? 'بانتظار' : 'مرفوض'}
                </Text>
              </View>
            </View>
          </View>

          {tx.receipt_url ? (
            <View style={styles.receiptSection}>
              <Text style={styles.receiptLabel}>إيصال التحويل</Text>
              <Image source={{ uri: tx.receipt_url }} style={styles.receiptImage} contentFit="contain" transition={200} />
            </View>
          ) : null}

          {isPending ? (
            <View style={styles.actionsRow}>
              <Pressable onPress={() => handleApprove(tx)} style={styles.confirmBtn}>
                <MaterialIcons name="check-circle" size={18} color="#FFF" />
                <Text style={styles.confirmBtnText}>اعتماد الشحن</Text>
              </Pressable>
              <Pressable onPress={() => handleReject(tx)} style={styles.rejectBtn}>
                <MaterialIcons name="cancel" size={18} color={theme.error} />
                <Text style={styles.rejectBtnText}>رفض</Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={styles.dateText}>{new Date(tx.created_at).toLocaleDateString('ar-SA')} - {new Date(tx.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>إيصالات شحن المحفظة</Text>
        <View style={styles.pendingBadge}><Text style={styles.pendingBadgeText}>{pendingTx.length}</Text></View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {pendingTx.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>بانتظار المراجعة ({pendingTx.length})</Text>
            {pendingTx.map((p, i) => renderTx(p, i))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={64} color={theme.border} />
            <Text style={styles.emptyText}>لا توجد إيصالات بانتظار المراجعة</Text>
          </View>
        )}

        {otherTx.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>سجل العمليات ({otherTx.length})</Text>
            {otherTx.slice(0, 20).map((p, i) => renderTx(p, i + pendingTx.length))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  pendingBadge: { backgroundColor: theme.error, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  pendingBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  sectionTitle: { ...typography.sectionHeader, writingDirection: 'rtl', textAlign: 'right', marginBottom: 12 },
  card: { marginBottom: 12, padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  cardHighlight: { borderWidth: 1.5, borderColor: theme.accent },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  driverName: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right' },
  txDesc: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  amount: { fontSize: 18, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radiusFull },
  statusText: { fontSize: 10, fontWeight: '700' },
  receiptSection: { marginTop: 8, gap: 6 },
  receiptLabel: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right' },
  receiptImage: { width: '100%', height: 200, borderRadius: theme.radiusMedium, backgroundColor: theme.surfaceElevated },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.borderLight },
  confirmBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.success, paddingVertical: 12, borderRadius: theme.radiusMedium },
  confirmBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.errorLight, paddingVertical: 12, borderRadius: theme.radiusMedium, borderWidth: 1.5, borderColor: theme.error },
  rejectBtnText: { color: theme.error, fontSize: 14, fontWeight: '700' },
  dateText: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 8, fontSize: 11 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.caption, marginTop: 12, writingDirection: 'rtl' },
});
