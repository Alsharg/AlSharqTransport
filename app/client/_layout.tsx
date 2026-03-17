import { Stack } from 'expo-router';
import { RoleGuard } from '../../components/RoleGuard';

export default function ClientLayout() {
  return (
    <RoleGuard allowedRoles={['client']}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </RoleGuard>
  );
}
