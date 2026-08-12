import React, { useEffect, useRef } from 'react';
import type L from 'leaflet';

interface LeafletFarmMapProps {
  latitude: number;
  longitude: number;
  locationName?: string;
  onSelectCoordinates: (lat: number, lon: number) => void;
}

export const LeafletFarmMap: React.FC<LeafletFarmMapProps> = ({
  latitude,
  longitude,
  locationName = 'Selected Location',
  onSelectCoordinates,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically import leaflet to avoid SSR issues
    import('leaflet').then((LModule) => {
      if (!isMounted || !mapContainerRef.current) return;

      const L = LModule.default;

      // Fix Leaflet marker icon URLs
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Initialize map instance if not already created
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([latitude, longitude], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Marker
        const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
        marker.bindPopup(`<b>${locationName}</b><br/>Click map or drag to set location`).openPopup();

        // Drag marker handler
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onSelectCoordinates(pos.lat, pos.lng);
        });

        // Click map handler
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          marker.bindPopup(`<b>Selected Location</b><br/>Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`).openPopup();
          onSelectCoordinates(lat, lng);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      } else {
        // Update existing map view & marker
        mapInstanceRef.current.setView([latitude, longitude], 11);
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
          markerRef.current.bindPopup(`<b>${locationName}</b><br/>Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, locationName]);

  // Clean up map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[280px] sm:h-[320px] rounded-xl overflow-hidden border border-[#ebebeb]">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      <div className="absolute bottom-2 left-2 z-20 bg-white/90 backdrop-blur-xs border border-[#ebebeb] px-2.5 py-1 rounded-md text-[11px] text-[#4d4d4d]">
        📍 Click on map or drag pin to select farm location
      </div>
    </div>
  );
};
