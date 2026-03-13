import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, Text } from 'react-native';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { activeTrips, unreadNotifications } = useApp();
  const { t } = useLanguage();

  const tabBarStyle = {
    height: Platform.select({ ios: insets.bottom + 60, android: insets.bottom + 60, default: 70 }),
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: insets.bottom + 8, android: insets.bottom + 8, default: 8 }),
    paddingHorizontal: 8,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  };

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle, tabBarActiveTintColor: theme.primary, tabBarInactiveTintColor: theme.textMuted, tabBarLabelStyle: { fontSize: 11, fontWeight: '600' } }}>
      <Tabs.Screen name="index" options={{ title: t.home, tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="trips" options={{
        title: t.myTrips,
        tabBarIcon: ({ color, size }) => (
          <View>
            <MaterialIcons name="route" size={size} color={color} />
            {activeTrips.length > 0 ? <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: theme.error, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>{activeTrips.length}</Text></View> : null}
          </View>
        ),
      }} />
      <Tabs.Screen name="earnings" options={{ title: t.earnings, tabBarIcon: ({ color, size }) => <MaterialIcons name="account-balance-wallet" size={size} color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: t.more, tabBarIcon: ({ color, size }) => <MaterialIcons name="menu" size={size} color={color} /> }} />
    </Tabs>
  );
}
