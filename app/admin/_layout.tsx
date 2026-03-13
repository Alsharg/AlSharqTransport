import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="trip-form" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="promote-driver" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="approvals" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="announcements" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="bonuses" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="chat" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="receipts" options={{ headerShown: false }} />
      <Stack.Screen name="trip-applicants" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="admins" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="admin-form" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="wallet-receipts" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
