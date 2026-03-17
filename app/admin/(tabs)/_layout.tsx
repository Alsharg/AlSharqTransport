import { Tabs } from 'expo-router/tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../constants/theme';
import { useApp } from '../../../contexts/AppContext';

export default function AdminTabsLayout() {
  const insets = useSafeAreaInsets();
  const { allDriversList, messages } = useApp();
  const pendingDrivers = allDriversList.filter(d => d.approval_status === 'pending').length;

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
        paddingHorizontal: 8,
      },
    }}>
      <Tabs.Screen name="index" options={{
        title: 'لوحة التحكم',
        tabBarIcon: ({ color, size }) => <MaterialIcons name="dashboard" size={size} color={color} />,
      }} />
      <Tabs.Screen name="drivers" options={{
        title: 'الكباتن',
        tabBarIcon: ({ color, size }) => (
          <View>
            <MaterialIcons name="people" size={size} color={color} />
            {pendingDrivers > 0 ? (
              <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: theme.error, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>{pendingDrivers}</Text>
              </View>
            ) : null}
          </View>
        ),
      }} />
      <Tabs.Screen name="trips" options={{
        title: 'المشاوير',
        tabBarIcon: ({ color, size }) => <MaterialIcons name="route" size={size} color={color} />,
      }} />
      <Tabs.Screen name="settings" options={{
        title: 'الإعدادات',
        tabBarIcon: ({ color, size }) => <MaterialIcons name="settings" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
