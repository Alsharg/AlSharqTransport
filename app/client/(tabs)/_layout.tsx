import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { theme } from '../../../constants/theme';

export default function ClientTabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: theme.accent,
      tabBarInactiveTintColor: theme.textMuted,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarStyle: {
        backgroundColor: theme.surface,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        height: Platform.select({ ios: insets.bottom + 60, android: insets.bottom + 60, default: 70 }),
        paddingTop: 8,
        paddingBottom: Platform.select({ ios: insets.bottom + 8, android: insets.bottom + 8, default: 8 }),
      },
    }}>
      <Tabs.Screen name="index" options={{ title: 'الرئيسية', tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="request-trip" options={{ title: 'طلب مشوار', tabBarIcon: ({ color, size }) => <MaterialIcons name="add-circle" size={size} color={color} /> }} />
      <Tabs.Screen name="my-trips" options={{ title: 'مشاويري', tabBarIcon: ({ color, size }) => <MaterialIcons name="route" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'حسابي', tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} /> }} />
    </Tabs>
  );
}
