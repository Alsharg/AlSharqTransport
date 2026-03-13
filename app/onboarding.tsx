import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';

type Step = 'about' | 'howItWorks' | 'terms';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [step, setStep] = useState<Step>('about');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleReject = () => {
    showAlert('رفض الشروط', 'عند رفض الشروط لن تتمكن من استخدام التطبيق. هل أنت متأكد؟', [
      { text: 'تراجع', style: 'cancel' },
      { text: 'رفض والخروج', style: 'destructive', onPress: () => { BackHandler.exitApp(); } },
    ]);
  };

  const handleAccept = () => {
    if (!agreedToTerms) {
      showAlert('تنبيه', 'يرجى الموافقة على الشروط والأحكام أولا');
      return;
    }
    router.replace('/register');
  };

  const steps = { about: 1, howItWorks: 2, terms: 3 };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(steps[step] / 3) * 100}%` }]} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        {step === 'about' ? (
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.stepIconContainer}>
              <MaterialIcons name="local-shipping" size={48} color={theme.primary} />
            </View>
            <Text style={styles.stepTitle}>من نحن</Text>
            <Text style={styles.stepSubtitle}>الشرق للنقل والتوصيل</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                نحن منصة متخصصة في إدارة خدمات النقل والتوصيل، نربط السائقين المحترفين بالعملاء لتقديم أفضل تجربة نقل في المنطقة.
              </Text>
            </View>

            <View style={styles.featuresList}>
              {[
                { icon: 'groups', title: 'توصيل موظفين', desc: 'خدمة التوصيل اليومي للشركات والمؤسسات' },
                { icon: 'event-repeat', title: 'اشتراكات شهرية', desc: 'باقات شهرية مرنة للعملاء الدائمين' },
                { icon: 'local-shipping', title: 'توصيل طلبات', desc: 'خدمة توصيل البضائع والطلبات' },
                { icon: 'person-pin-circle', title: 'مشاوير خاصة', desc: 'رحلات خاصة وVIP' },
              ].map((f, i) => (
                <Animated.View key={f.title} entering={FadeInRight.duration(300).delay(i * 100)}>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}><MaterialIcons name={f.icon as any} size={24} color={theme.primary} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureTitle}>{f.title}</Text>
                      <Text style={styles.featureDesc}>{f.desc}</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        ) : step === 'howItWorks' ? (
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.stepIconContainer}>
              <MaterialIcons name="route" size={48} color={theme.primary} />
            </View>
            <Text style={styles.stepTitle}>طريقة العمل</Text>
            <Text style={styles.stepSubtitle}>كيف تعمل المنصة</Text>

            <View style={styles.stepsFlow}>
              {[
                { num: '1', icon: 'app-registration', title: 'سجل حسابك', desc: 'أدخل بياناتك الشخصية وبيانات المركبة ورخصة القيادة' },
                { num: '2', icon: 'hourglass-top', title: 'انتظر الموافقة', desc: 'سيقوم فريق الإدارة بمراجعة طلبك والموافقة عليه' },
                { num: '3', icon: 'notifications', title: 'استقبل المشاوير', desc: 'ستصلك إشعارات فورية عند توفر مشاوير جديدة' },
                { num: '4', icon: 'touch-app', title: 'تقدم للمشوار', desc: 'اختر المشوار المناسب وقدم طلب قبول وانتظر تعيين الإدارة' },
                { num: '5', icon: 'account-balance', title: 'حول العمولة', desc: 'حول عمولة المنصة (10%) عبر التحويل البنكي وارفع الإيصال' },
                { num: '6', icon: 'play-circle', title: 'ابدأ المشوار', desc: 'بعد تأكيد الإدارة للعمولة ستظهر بيانات العميل ويمكنك البدء' },
              ].map((s, i) => (
                <Animated.View key={s.num} entering={FadeInRight.duration(300).delay(i * 80)}>
                  <View style={styles.stepFlowItem}>
                    <View style={styles.stepNumContainer}>
                      <Text style={styles.stepNum}>{s.num}</Text>
                      {i < 5 ? <View style={styles.stepLine} /> : null}
                    </View>
                    <View style={styles.stepContent}>
                      <View style={styles.stepFlowIcon}><MaterialIcons name={s.icon as any} size={22} color={theme.primary} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stepFlowTitle}>{s.title}</Text>
                        <Text style={styles.stepFlowDesc}>{s.desc}</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>

            <View style={styles.commissionBox}>
              <MaterialIcons name="info" size={20} color={theme.primary} />
              <Text style={styles.commissionText}>نسبة العمولة: 10% من قيمة كل مشوار. يحصل السائق على 90% من المبلغ كصافي ربح.</Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.stepIconContainer}>
              <MaterialIcons name="gavel" size={48} color={theme.primary} />
            </View>
            <Text style={styles.stepTitle}>الشروط والأحكام</Text>
            <Text style={styles.stepSubtitle}>يرجى قراءة الشروط بعناية</Text>

            <View style={styles.termsCard}>
              <Text style={styles.termsText}>
                {`1. يلتزم السائق بالمواعيد المحددة لكل مشوار وعدم التأخر.

2. يجب أن تكون المركبة نظيفة وصالحة للاستخدام في جميع الأوقات.

3. عمولة المنصة 10% من كل مشوار يتم تحويلها قبل بدء المشوار.

4. يتم الكشف عن بيانات العميل فقط بعد تأكيد الإدارة لاستلام العمولة.

5. أي مخالفة للشروط قد تؤدي لخصم أو تعطيل الحساب.

6. السائق مسؤول عن سلامة الركاب والبضائع أثناء النقل.

7. يحق للإدارة رفض أو قبول أي طلب تسجيل بناء على المعايير المحددة.

8. الالتزام بقوانين المرور والسرعة المحددة إلزامي.

9. يحق للإدارة تعديل نسبة العمولة مع إشعار مسبق.

10. بالموافقة على هذه الشروط، يقر السائق بأنه قرأها وفهمها ويوافق على الالتزام بها.`}
              </Text>
            </View>

            <Pressable onPress={() => setAgreedToTerms(!agreedToTerms)} style={styles.checkboxRow}>
              <MaterialIcons name={agreedToTerms ? 'check-box' : 'check-box-outline-blank'} size={28} color={agreedToTerms ? theme.success : theme.textMuted} />
              <Text style={styles.checkboxText}>أوافق على جميع الشروط والأحكام</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {step === 'about' ? (
          <View style={styles.btnRow}>
            <Pressable onPress={() => router.back()} style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>رجوع</Text></Pressable>
            <Pressable onPress={() => setStep('howItWorks')} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>التالي</Text><MaterialIcons name="arrow-back" size={20} color="#FFF" /></Pressable>
          </View>
        ) : step === 'howItWorks' ? (
          <View style={styles.btnRow}>
            <Pressable onPress={() => setStep('about')} style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>السابق</Text></Pressable>
            <Pressable onPress={() => setStep('terms')} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>التالي</Text><MaterialIcons name="arrow-back" size={20} color="#FFF" /></Pressable>
          </View>
        ) : (
          <View style={styles.btnRow}>
            <Pressable onPress={handleReject} style={styles.rejectTermsBtn}><MaterialIcons name="close" size={18} color={theme.error} /><Text style={styles.rejectTermsText}>رفض</Text></Pressable>
            <Pressable onPress={handleAccept} style={[styles.acceptBtn, !agreedToTerms && { opacity: 0.5 }]}><MaterialIcons name="check" size={20} color="#FFF" /><Text style={styles.acceptBtnText}>موافقة ومتابعة التسجيل</Text></Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  progressBar: { height: 4, backgroundColor: theme.backgroundSecondary },
  progressFill: { height: 4, backgroundColor: theme.primary, borderRadius: 2 },
  stepIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.primary + '12', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  stepTitle: { fontSize: 24, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', writingDirection: 'rtl' },
  stepSubtitle: { ...typography.caption, textAlign: 'center', writingDirection: 'rtl', marginBottom: 24 },
  infoCard: { backgroundColor: theme.surface, borderRadius: theme.radiusLarge, padding: 20, borderWidth: 1, borderColor: theme.border, marginBottom: 24 },
  infoText: { ...typography.body, writingDirection: 'rtl', textAlign: 'right', lineHeight: 26, color: theme.textSecondary },
  featuresList: { gap: 10 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: theme.border },
  featureIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: theme.primary + '12', alignItems: 'center', justifyContent: 'center' },
  featureTitle: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right' },
  featureDesc: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  stepsFlow: { gap: 0, marginBottom: 16 },
  stepFlowItem: { flexDirection: 'row', gap: 12 },
  stepNumContainer: { alignItems: 'center', width: 32 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primary, color: '#FFF', fontSize: 14, fontWeight: '700', textAlign: 'center', lineHeight: 28, overflow: 'hidden' },
  stepLine: { width: 2, height: 40, backgroundColor: theme.border },
  stepContent: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingBottom: 16 },
  stepFlowIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.primary + '10', alignItems: 'center', justifyContent: 'center' },
  stepFlowTitle: { ...typography.cardTitle, writingDirection: 'rtl', textAlign: 'right' },
  stepFlowDesc: { ...typography.caption, writingDirection: 'rtl', textAlign: 'right', marginTop: 2, lineHeight: 20 },
  commissionBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, backgroundColor: theme.primary + '15', borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: theme.primary + '30' },
  commissionText: { ...typography.body, color: theme.primary, flex: 1, writingDirection: 'rtl', textAlign: 'right', lineHeight: 24, fontSize: 14 },
  termsCard: { backgroundColor: theme.surface, borderRadius: theme.radiusLarge, padding: 20, borderWidth: 1, borderColor: theme.border, marginBottom: 20 },
  termsText: { ...typography.body, writingDirection: 'rtl', textAlign: 'right', lineHeight: 28, color: theme.textSecondary, fontSize: 14 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: theme.surface, borderRadius: theme.radiusMedium, borderWidth: 1, borderColor: theme.border },
  checkboxText: { ...typography.bodyBold, writingDirection: 'rtl', flex: 1, textAlign: 'right' },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border },
  btnRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.radiusMedium },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: theme.radiusMedium, backgroundColor: theme.surfaceElevated },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: theme.textSecondary },
  rejectTermsBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16, borderRadius: theme.radiusMedium, backgroundColor: theme.errorLight, borderWidth: 1.5, borderColor: theme.error },
  rejectTermsText: { fontSize: 15, fontWeight: '700', color: theme.error },
  acceptBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.success, paddingVertical: 16, borderRadius: theme.radiusMedium },
  acceptBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
