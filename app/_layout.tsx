import { Stack } from 'expo-router';
import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../contexts/AppContext';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { I18nManager } from 'react-native';

if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <LanguageProvider>
          <AppProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="register" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="onboarding" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="trip-detail" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="trip-map" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="chat" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="notifications" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="ai-assistant" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="admin" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="edit-profile" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="wallet" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            </Stack>
          </AppProvider>
          </LanguageProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
