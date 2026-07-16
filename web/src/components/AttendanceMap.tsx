"use client";

import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const employeeIcon = L.divIcon({
  className: "custom-employee-marker",
  html: `<div style="background-color: #123c8c; width: 14px; height: 14px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(18,60,140,0.5);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const officeIcon = L.divIcon({
  className: "custom-office-marker",
  html: `<div style="background-color: #10b981; width: 20px; height: 20px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 12px rgba(16,185,129,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; line-height: 20px;">🏢</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

export type AttendanceMapProps = {
  userLat?: number;
  userLng?: number;
  officeLat?: number;
  officeLng?: number;
  officeRadius?: number;
  officeName?: string;

  userLocation?: {
    lat: number;
    lng: number;
  };
  userAccuracy?: number;
  offices?: any[];
  matchedOfficeId?: string | null;
};

export default function AttendanceMap({
  userLat,
  userLng,
  officeLat,
  officeLng,
  officeRadius,
  officeName,
  userLocation,
  userAccuracy,
  offices,
  matchedOfficeId,
}: AttendanceMapProps) {
  const uLat = userLat || userLocation?.lat || 0;
  const uLng = userLng || userLocation?.lng || 0;

  let officeList: any[] = [];
  if (offices && offices.length > 0) {
    officeList = offices.map((o: any) => ({
      name: o.office.name,
      lat: o.office.latitude,
      lng: o.office.longitude,
      radius: o.office.radius_meters || o.office.radiusMeters || 100,
      isMatched: o.office.id === matchedOfficeId,
    }));
  } else if (officeLat && officeLng) {
    officeList = [{
      name: officeName || "Kantor Asal",
      lat: officeLat,
      lng: officeLng,
      radius: officeRadius || 100,
      isMatched: true,
    }];
  }

  const centerLat = uLat || officeList[0]?.lat || 0;
  const centerLng = uLng || officeList[0]?.lng || 0;

  return (
    <div className="w-full h-64 rounded-3xl overflow-hidden border border-blue-100 shadow-sm relative z-10">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={16}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {uLat && uLng && (
          <Marker position={[uLat, uLng]} icon={employeeIcon}>
            <Popup>Lokasi Anda saat ini</Popup>
          </Marker>
        )}
        {officeList.map((office, idx) => (
          <div key={idx}>
            <Marker position={[office.lat, office.lng]} icon={officeIcon}>
              <Popup>{office.name}</Popup>
            </Marker>
            <Circle
              center={[office.lat, office.lng]}
              radius={office.radius}
              pathOptions={{
                fillColor: office.isMatched ? "#10b981" : "#3b82f6",
                fillOpacity: 0.15,
                color: office.isMatched ? "#10b981" : "#123c8c",
                weight: 2,
                dashArray: "4 4",
              }}
            />
          </div>
        ))}
      </MapContainer>
    </div>
  );
}
