import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme, typography } from '../constants/theme';

export default function WalletScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>المحفظة</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="account-balance-wallet" size={48} color={theme.textMuted} />
        </View>
        <Text style={styles.title}>المحفظة غير متاحة</Text>
        <Text style={styles.subtitle}>تم إزالة نظام المحفظة. يتم احتساب العمولة مباشرة من المشاوير.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
          <Text style={styles.backBtnText}>رجوع</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'center' },
  subtitle: { fontSize: 14, fontWeight: '500', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: theme.radiusMedium, marginTop: 24 },
  backBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
