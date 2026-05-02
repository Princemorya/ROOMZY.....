import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '@/src/types';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';

// Fix for default marker icons in Leaflet + React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PropertyMapProps {
  properties: Property[];
  center?: [number, number];
  zoom?: number;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.setView(center, zoom, { animate: false });
    }
  }, [center, zoom, map]);
  return null;
}

export default function PropertyMap({ properties, center = [20.5937, 78.9629], zoom = 5 }: PropertyMapProps) {
  const navigate = useNavigate();

  // If we have properties, focus on the first one or average location
  const mapCenter = properties.length > 0 && properties[0].location.lat && properties[0].location.lng
    ? [properties[0].location.lat, properties[0].location.lng] as [number, number]
    : center;

  const mapZoom = properties.length > 0 ? 12 : zoom;

  return (
    <div className="h-full w-full rounded-3xl overflow-hidden border border-neutral-100 shadow-sm relative z-0">
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <ChangeView center={mapCenter} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {properties.map(property => {
          if (!property.location.lat || !property.location.lng) return null;
          
          return (
            <Marker 
              key={property.id} 
              position={[property.location.lat, property.location.lng]}
            >
              <Popup>
                <div 
                  className="w-48 cursor-pointer group"
                  onClick={() => navigate(`/property/${property.id}`)}
                >
                  <img 
                    src={property.images?.[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=200'} 
                    alt={property.title}
                    className="h-24 w-full rounded-xl object-cover mb-2"
                  />
                  <div className="space-y-1">
                    <h3 className="font-bold text-neutral-900 group-hover:text-orange-600 line-clamp-1">{property.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-600">₹{Math.round(property.price / 30).toLocaleString()}/d</span>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600">
                        <Star className="h-3 w-3 fill-orange-600" />
                        {property.rating || 'New'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                      <MapPin className="h-3 w-3" />
                      {property.location.city}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
