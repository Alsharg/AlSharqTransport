import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { theme, typography } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { getWalletTransactionLabel, getWalletTransactionColor } from '../services/types';

const BANK_INFO = {
  bankName: 'بنك الراجحي',
  accountName: 'الشرق للنقل البري',
  iban: 'SA0000000000000000000000',
  accountNumber: '000000000000',
};

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const { wallet, walletTransactions, loadWallet, topUpWallet } = useApp();
  const [showTopUp, setShowTopUp] = useState(false);
  const [amount, setAmount] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUploadReceipt = async () => {
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      showAlert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (result.canceled || !result.assets?.[0]?.base64) return;
    setUploading(true);
    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop() || 'jpg';
    const topUpResult = await topUpWallet(Number(amount), asset.base64, ext);
    setUploading(false);
    if (topUpResult.error) { showAlert('خطأ', topUpResult.error); }
    else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('تم الإرسال', 'تم رفع إيصال الشحن بنجاح. سيتم مراجعته من الإدارة.');
      setAmount('');
      setShowTopUp(false);
      await loadWallet();
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}><MaterialIcons name="close" size={24} color={theme.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>المحفظة</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.balanceCard}>
            <MaterialIcons name="account-balance-wallet" size={32} color={theme.accent} />
            <Text style={styles.balanceLabel}>رصيد المحفظة</Text>
            <Text style={styles.balanceAmount}>{Number(wallet?.balance || 0).toFixed(0)}</Text>
            <Text style={styles.balanceCurrency}>ريال سعودي</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Pressable onPress={() => setShowTopUp(!showTopUp)} style={[styles.topUpToggle, showTopUp && { backgroundColor: theme.primary }]}>
              <MaterialIcons name={showTopUp ? 'close' : 'add-circle'} size={20} color={showTopUp ? '#FFF' : theme.primary} />
              <Text style={[styles.topUpToggleText, showTopUp && { color: '#FFF' }]}>{showTopUp ? 'إلغاء' : 'شحن المحفظة'}</Text>
            </Pressable>
          </Animated.View>

          {showTopUp ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.topUpCard}>
              {/* Bank Info */}
              <View style={styles.bankInfoCard}>
                <View style={styles.bankRow}><Text style={styles.bankLabel}>البنك</Text><Text style={styles.bankValue}>{BANK_INFO.bankName}</Text></View>
                <View style={styles.bankRow}><Text style={styles.bankLabel}>اسم الحساب</Text><Text style={styles.bankValue}>{BANK_INFO.accountName}</Text></View>
                <View style={styles.bankRow}><Text style={styles.bankLabel}>الآيبان</Text><Text style={styles.bankValue}>{BANK_INFO.iban}</Text></View>
              </View>

              {/* Amount Input */}
              <Text style={styles.inputLabel}>المبلغ (ر.س)</Text>
              <TextInput value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor={theme.textMuted} style={styles.amountInput} textAlign="center" keyboardType="numeric" />

              {/* Quick Amounts */}
              <View style={styles.quickAmounts}>
                {[50, 100, 200, 500].map(qa => (
                  <Pressable key={qa} onPress={() => setAmount(String(qa))} style={[styles.quickChip, amount === String(qa) && styles.quickChipActive]}>
                    <Text style={[styles.quickChipText, amount === String(qa) && styles.quickChipTextActive]}>{qa}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Upload Button */}
              <Pressable onPress={handleUploadReceipt} disabled={uploading} style={[styles.uploadBtn, uploading && { opacity: 0.6 }]}>
                {uploading ? <ActivityIndicator color="#FFF" /> : (
                  <><MaterialIcons name="cloud-upload" size={20} color="#FFF" /><Text style={styles.uploadBtnText}>رفع الإيصال</Text></>
                )}
              </Pressable>
            </Animated.View>
          ) : null}

          {/* Transactions */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <Text style={styles.sectionTitle}>سجل العمليات</Text>
            {walletTransactions.length === 0 ? (
              <View style={styles.emptyState}><MaterialIcons name="receipt-long" size={48} color={theme.border} /><Text style={styles.emptyText}>لا توجد عمليات بعد</Text></View>
            ) : walletTransactions.map(tx => {
              const txColor = getWalletTransactionColor(tx.type);
              const isDeduction = tx.type === 'commission_deduction';
              return (
                <View key={tx.id} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: txColor + '20' }]}>
                    <MaterialIcons name={isDeduction ? 'remove-circle' : 'add-circle'} size={20} color={txColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txTitle}>{getWalletTransactionLabel(tx.type)}</Text>
                    <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString('ar-SA')}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: isDeduction ? theme.error : theme.success }]}>{isDeduction ? '-' : '+'}{Number(tx.amount).toFixed(0)} ر.س</Text>
                </View>
              );
            })}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  balanceCard: { marginHorizontal: 16, marginTop: 16, padding: 28, backgroundColor: theme.primaryDark, borderRadius: theme.radiusXL, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: theme.primary + '30' },
  balanceLabel: { fontSize: 14, fontWeight: '500', color: theme.textSecondary, writingDirection: 'rtl' },
  balanceAmount: { fontSize: 48, fontWeight: '700', color: theme.accent },
  balanceCurrency: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  topUpToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, paddingVertical: 14, borderRadius: theme.radiusMedium, backgroundColor: theme.primary + '15', borderWidth: 1.5, borderColor: theme.primary + '30' },
  topUpToggleText: { fontSize: 15, fontWeight: '700', color: theme.primary },
  topUpCard: { marginHorizontal: 16, marginTop: 12, padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, borderWidth: 1, borderColor: theme.border },
  bankInfoCard: { backgroundColor: theme.surfaceElevated, borderRadius: theme.radiusMedium, padding: 12, gap: 8, marginBottom: 16 },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bankLabel: { ...typography.caption, writingDirection: 'rtl' },
  bankValue: { ...typography.bodyBold, fontSize: 14, writingDirection: 'rtl' },
  inputLabel: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right', marginBottom: 6 },
  amountInput: { backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border, borderRadius: theme.radiusMedium, paddingVertical: 14, fontSize: 24, fontWeight: '700', color: theme.textPrimary },
  quickAmounts: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 14 },
  quickChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: theme.radiusMedium, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border },
  quickChipActive: { backgroundColor: theme.primary + '20', borderColor: theme.primary },
  quickChipText: { fontSize: 14, fontWeight: '700', color: theme.textSecondary },
  quickChipTextActive: { color: theme.primary },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, paddingVertical: 14, borderRadius: theme.radiusMedium },
  uploadBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  sectionTitle: { ...typography.sectionHeader, writingDirection: 'rtl', textAlign: 'right', paddingHorizontal: 20, marginTop: 28, marginBottom: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { ...typography.caption, marginTop: 8 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 20, marginBottom: 10, padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: theme.border },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txTitle: { ...typography.bodyBold, writingDirection: 'rtl', textAlign: 'right', fontSize: 14 },
  txDate: { fontSize: 11, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '700' },
});
