import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { TripMapContent } from '../components/maps/TripMapContent';

export default function TripMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TripMapContent tripId={id || ''} />;
}
