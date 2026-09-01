import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

export type ClubPin = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  freeSlots: number;
  totalSlots: number;
};

function pinIcon(active: boolean, free: number) {
  return L.divIcon({
    className: "",
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    html: `<div style="width:46px;height:46px;display:grid;place-items:center;border:3px solid #211f1a;font-family:'Space Mono',monospace;font-size:11px;font-weight:700;background:${
      active ? "#211f1a" : free > 0 ? "#d6f24a" : "#c4612a"
    };color:${active ? "#d6f24a" : free > 0 ? "#211f1a" : "#f3ece0"}">${free}</div>`,
  });
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export default function ClubMap({
  pins,
  activeId,
  onSelect,
}: {
  pins: ClubPin[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const active = pins.find((p) => p.id === activeId) ?? pins[0];
  if (!active) return null;

  return (
    <MapContainer
      center={[active.latitude, active.longitude]}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={active.latitude} lng={active.longitude} />
      {pins.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          icon={pinIcon(p.id === activeId, p.freeSlots)}
          eventHandlers={{ click: () => onSelect(p.id) }}
        >
          <Popup>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11 }}>
              <strong>{p.name}</strong>
              <br />
              {p.address ?? ""}
              <br />
              {p.freeSlots} of {p.totalSlots} slots free today
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
