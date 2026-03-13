import React from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAlert } from '@/template';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import * as api from '../../services/api';

export default function PromoteDriverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { driverId, driverName } = useLocalSearchParams<{ driverId: string; driverName: string }>();
  const { allDriversList, loadDrivers } = useApp();

  const driverData = allDriversList.find(d => d.id === driverId);

  const handlePromote = () => {
    if (!driverId) return;

    showAlert('ترقية السائق', `هل أنت متأكد من ترقية ${driverName} إلى مشرف؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'ترقية',
        onPress: async () => {
          await api.updateUserProfile(driverId, { role: 'supervisor' });
          await loadDrivers();
          showAlert('تمت الترقية', `تمت ترقية ${driverName} إلى مشرف بنجاح`, [
            { text: 'حسناً', onPress: () => router.back() },
          ]);
        },
      },
    ]);
  };

  if (!driverData) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialIcons name="error-outline" size={64} color={theme.border} />
        <Text style={styles.errorText}>السائق غير موجود</Text>
        <Pressable onPress={() => router.back()} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>رجوع</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>ترقية سائق</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <MaterialIcons name="person" size={32} color={theme.primary} />
          </View>
          <Text style={styles.driverName}>{driverData.full_name || driverData.username || 'بدون اسم'}</Text>
          <Text style={styles.driverDetails}>{driverData.phone || ''} • {driverData.email}</Text>
          <View style={styles.driverMeta}>
            <View style={styles.metaItem}>
              <MaterialIcons name="star" size={16} color="#F59E0B" />
              <Text style={styles.metaText}>{Number(driverData.rating || 5).toFixed(1)}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="route" size={16} color={theme.textMuted} />
              <Text style={styles.metaText}>{driverData.total_trips || 0} مشوار</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="directions-car" size={16} color={theme.textMuted} />
              <Text style={styles.metaText}>{driverData.vehicle_type || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <View style={styles.arrowCircle}>
            <MaterialIcons name="arrow-downward" size={24} color={theme.primary} />
          </View>
          <Text style={styles.arrowText}>ترقية إلى مشرف</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>صلاحيات المشرف</Text>
          <Text style={styles.sectionDesc}>سيحصل المشرف على الصلاحيات التالية:</Text>

          {[
            { icon: 'people', label: 'إدارة السائقين', desc: 'تفعيل وتعطيل ومراجعة السائقين' },
            { icon: 'route', label: 'إدارة المشاوير', desc: 'إنشاء وتعديل وحذف وأرشفة المشاوير' },
            { icon: 'account-balance-wallet', label: 'عرض الأرباح', desc: 'مشاهدة تقارير الأرباح والعمولات' },
            { icon: 'campaign', label: 'الإعلانات', desc: 'إنشاء وإدارة الإعلانات' },
            { icon: 'chat', label: 'المحادثات', desc: 'التواصل مع السائقين' },
          ].map((perm, i) => (
            <View key={i} style={styles.permRow}>
              <View style={styles.permIcon}>
                <MaterialIcons name={perm.icon as any} size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.permLabel}>{perm.label}</Text>
                <Text style={styles.permDesc}>{perm.desc}</Text>
              </View>
              <MaterialIcons name="check-circle" size={22} color={theme.success} />
            </View>
          ))}
        </View>

        <View style={styles.warningBox}>
          <MaterialIcons name="warning" size={20} color="#D97706" />
          <Text style={styles.warningText}>سيتم تغيير صلاحية السائق من "سائق" إلى "مشرف" ولن يظهر في قائمة السائقين بعد الترقية.</Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={handlePromote} style={styles.promoteBtn}>
          <MaterialIcons name="upgrade" size={22} color="#FFF" />
          <Text style={styles.promoteBtnText}>ترقية إلى مشرف</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface,
  },
  closeBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  driverCard: {
    backgroundColor: theme.surface, borderRadius: theme.radiusXL,
    padding: 24, alignItems: 'center', ...theme.shadowElevated,
  },
  driverAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  driverName: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  driverDetails: { ...typography.caption, writingDirection: 'rtl', marginTop: 4 },
  driverMeta: { flexDirection: 'row', gap: 16, marginTop: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.caption },
  arrowContainer: { alignItems: 'center', paddingVertical: 16 },
  arrowCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: theme.primary + '12', alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  arrowText: { ...typography.captionBold, color: theme.primary },
  infoSection: { marginBottom: 16 },
  sectionTitle: { ...typography.sectionHeader, writingDirection: 'rtl', textAlign: 'right', marginBottom: 4 },
  sectionDesc: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginBottom: 14 },
  permRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, marginBottom: 8,
    backgroundColor: theme.surface, borderRadius: theme.radiusMedium,
    borderWidth: 1.5, borderColor: theme.primary + '20', ...theme.shadow,
  },
  permIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary + '12' },
  permLabel: { ...typography.bodyBold, writingDirection: 'rtl', textAlign: 'right' },
  permDesc: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  warningBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FEF3C7', padding: 14, borderRadius: theme.radiusMedium,
    borderWidth: 1, borderColor: '#FCD34D',
  },
  warningText: { ...typography.caption, color: '#92400E', flex: 1, writingDirection: 'rtl', textAlign: 'right', lineHeight: 20 },
  bottomBar: {
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border,
  },
  promoteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.radiusMedium,
  },
  promoteBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  errorText: { ...typography.subtitle, textAlign: 'center', marginTop: 16, writingDirection: 'rtl' },
  errorBtn: {
    marginTop: 16, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: theme.primary, borderRadius: theme.radiusMedium,
  },
  errorBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
