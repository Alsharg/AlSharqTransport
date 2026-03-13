import { Tabs } from 'expo-router/tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../constants/theme';

export default function AdminTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: theme.accent,
      tabBarInactiveTintColor: theme.textMuted,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600', writingDirection: 'rtl' },
      tabBarStyle: {
        backgroundColor: '#0B1929',
        borderTopWidth: 0,
        height: Platform.select({ ios: insets.bottom + 60, android: insets.bottom + 60, default: 70 }),
        paddingTop: 8,
        paddingBottom: Platform.select({ ios: insets.bottom + 8, android: insets.bottom + 8, default: 8 }),
        paddingHorizontal: 8,
      },
    }}>
      <Tabs.Screen name="index" options={{ title: 'لوحة التحكم', tabBarIcon: ({ color, size }) => <MaterialIcons name="dashboard" size={size} color={color} /> }} />
      <Tabs.Screen name="drivers" options={{ title: 'السائقين', tabBarIcon: ({ color, size }) => <MaterialIcons name="people" size={size} color={color} /> }} />
      <Tabs.Screen name="trips" options={{ title: 'المشاوير', tabBarIcon: ({ color, size }) => <MaterialIcons name="route" size={size} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'الإعدادات', tabBarIcon: ({ color, size }) => <MaterialIcons name="settings" size={size} color={color} /> }} />
    </Tabs>
  );
}
