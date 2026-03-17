import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { LiveTrackingContent } from '../components/maps/LiveTrackingContent';

export default function LiveTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LiveTrackingContent tripId={id || ''} />;
}
