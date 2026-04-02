// Haversine formula — returns distance in feet between two lat/lng points
export function haversineDistanceFeet(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 20902464; // Earth radius in feet
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const CHECK_IN_RADIUS_FEET =
  Number(process.env.CHECK_IN_RADIUS_FEET) || 300;
