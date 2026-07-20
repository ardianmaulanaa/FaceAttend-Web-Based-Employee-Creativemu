export type GeoPoint = {
  lat: number;
  lng: number;
};

export type OfficeGeofence = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
};

export function getDistanceInMeters(from: GeoPoint, to: GeoPoint) {
  const earthRadius = 6371000;

  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;

  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

export function isValidGpsCoordinate(point: GeoPoint) {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

export function isValidGeofence(office: OfficeGeofence) {
  return (
    isValidGpsCoordinate({
      lat: office.latitude,
      lng: office.longitude,
    }) &&
    Number.isFinite(office.radius_meters) &&
    office.radius_meters > 0
  );
}

export function findNearestValidOffice(
  userLocation: GeoPoint,
  offices: OfficeGeofence[]
) {
  if (!isValidGpsCoordinate(userLocation)) return null;

  const validOffices = offices
    .filter(isValidGeofence)
    .map((office) => {
      const distance = getDistanceInMeters(userLocation, {
        lat: office.latitude,
        lng: office.longitude,
      });

      return {
        office,
        distance,
        isWithinRadius: distance <= office.radius_meters,
      };
    })
    .filter((item) => item.isWithinRadius)
    .sort((a, b) => a.distance - b.distance);

  return validOffices[0] ?? null;
}

export function isGpsAccuracyAllowed(accuracy: number, maxAccuracy = 100) {
  return (
    Number.isFinite(accuracy) &&
    accuracy > 0 &&
    accuracy <= maxAccuracy
  );
}
