// Distance calculation service using Google Maps APIs

const GOOGLE_MAPS_KEY = 'AIzaSyBgh-D-6VzxB1D-qn29iTAnGbGRUKjDMYs';

export interface DistanceResult {
  distanceKm: number;
  durationMin: number;
  distanceText: string;
  durationText: string;
}

export interface RouteInfo {
  distanceKm: number;
  durationMin: number;
  distanceText: string;
  durationText: string;
  polyline: Array<{ latitude: number; longitude: number }>;
}

/**
 * Calculate driving distance between two points using Google Maps Distance Matrix API
 */
export async function calculateDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<DistanceResult | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&mode=driving&language=ar&key=${GOOGLE_MAPS_KEY}`;
    const res = await fetch(url);
    const json = await res.json();

    if (
      json.status === 'OK' &&
      json.rows?.[0]?.elements?.[0]?.status === 'OK'
    ) {
      const element = json.rows[0].elements[0];
      return {
        distanceKm: element.distance.value / 1000, // meters to km
        durationMin: Math.ceil(element.duration.value / 60), // seconds to minutes
        distanceText: element.distance.text,
        durationText: element.duration.text,
      };
    }
  } catch (e) {
    console.error('Distance Matrix error:', e);
  }
  return null;
}

/**
 * Decode Google Maps encoded polyline string into coordinate pairs
 */
function decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
  const coords: Array<{ latitude: number; longitude: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return coords;
}

/**
 * Fetch route polyline + distance/duration from Google Directions API
 */
export async function fetchRoutePolyline(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<RouteInfo | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=driving&language=ar&key=${GOOGLE_MAPS_KEY}`;
    const res = await fetch(url);
    const json = await res.json();

    if (json.status === 'OK' && json.routes && json.routes.length > 0) {
      const route = json.routes[0];
      const leg = route.legs[0];
      const encodedPolyline = route.overview_polyline?.points || '';
      const polyline = decodePolyline(encodedPolyline);

      return {
        distanceKm: leg.distance.value / 1000,
        durationMin: Math.ceil(leg.duration.value / 60),
        distanceText: leg.distance.text,
        durationText: leg.duration.text,
        polyline,
      };
    }
  } catch (e) {
    console.error('Directions API error:', e);
  }
  return null;
}

/**
 * Calculate monthly subscription price
 * Formula: (round-trip distance × price_per_km × work_days_per_week × 4 weeks) + base_price
 * Additional passengers: +15% per extra person
 */
export function calculateMonthlyPrice(
  oneWayDistanceKm: number,
  pricePerKm: number,
  basePriceMonthly: number,
  workDaysPerWeek: number,
  passengerCount: number,
  additionalPassengerPercent: number = 15
): {
  baseMonthly: number;
  passengerSurcharge: number;
  totalMonthly: number;
  roundTripKm: number;
  totalKmPerMonth: number;
} {
  const roundTripKm = oneWayDistanceKm * 2;
  const totalKmPerMonth = roundTripKm * workDaysPerWeek * 4;
  const distanceCost = totalKmPerMonth * pricePerKm;
  const baseMonthly = distanceCost + basePriceMonthly;

  // Additional passenger surcharge
  const extraPassengers = Math.max(0, passengerCount - 1);
  const passengerSurcharge = baseMonthly * (extraPassengers * additionalPassengerPercent / 100);
  const totalMonthly = baseMonthly + passengerSurcharge;

  return {
    baseMonthly: Math.round(baseMonthly),
    passengerSurcharge: Math.round(passengerSurcharge),
    totalMonthly: Math.round(totalMonthly),
    roundTripKm: Math.round(roundTripKm * 10) / 10,
    totalKmPerMonth: Math.round(totalKmPerMonth),
  };
}
