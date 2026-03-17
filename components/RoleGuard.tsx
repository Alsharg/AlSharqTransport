import React, { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../constants/theme';
import { ActivityIndicator } from 'react-native';

type AllowedRole = 'admin' | 'supervisor' | 'driver' | 'client';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AllowedRole[];
}

function getHomeRoute(role: string | null): string {
  if (role === 'admin' || role === 'supervisor') return '/admin';
  if (role === 'client') return '/client';
  if (role === 'driver') return '/(tabs)';
  return '/login';
}

function getRoleLabel(role: string | null): string {
  switch (role) {
    case 'admin': return 'الإدارة';
    case 'supervisor': return 'المشرف';
    case 'driver': return 'الكابتن';
    case 'client': return 'العميل';
    default: return 'غير محدد';
  }
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { isLoggedIn, isLoading, userRole } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  if (!userRole || !allowedRoles.includes(userRole as AllowedRole)) {
    const homeRoute = getHomeRoute(userRole);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="block" size={56} color={theme.error} />
          </View>
          <Text style={styles.title}>غير مصرح</Text>
          <Text style={styles.subtitle}>
            {"ليس لديك صلاحية للوصول إلى هذه الصفحة"}
          </Text>
          <Text style={styles.roleInfo}>
            {"دورك الحالي: "}{getRoleLabel(userRole)}
          </Text>
          <Pressable
            onPress={() => router.replace(homeRoute as any)}
            style={({ pressed }) => [styles.homeBtn, pressed && { opacity: 0.9 }]}
          >
            <MaterialIcons name="home" size={20} color="#FFF" />
            <Text style={styles.homeBtnText}>العودة لصفحتك الرئيسية</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace('/login')}
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.logoutBtnText}>تسجيل الدخول بحساب آخر</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: theme.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: theme.error + '30',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.textPrimary,
    writingDirection: 'rtl' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
    lineHeight: 24,
    marginBottom: 8,
  },
  roleInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
    backgroundColor: theme.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    writingDirection: 'rtl' as const,
    marginBottom: 32,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    marginBottom: 14,
  },
  homeBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutBtn: {
    paddingVertical: 12,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
  },
});
