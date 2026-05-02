import React from 'react';
import { MapPin, Star } from 'lucide-react';
import { Property } from '@/src/types';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
  key?: React.Key;
}

export default function PropertyCard({ property, onClick }: PropertyCardProps) {
  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-3xl border border-neutral-100 bg-white transition-all hover:shadow-xl hover:shadow-neutral-200"
    >
      <div className="relative h-56 w-full overflow-hidden">
        <img 
          src={property.images?.[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800'} 
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-neutral-900 shadow-sm">
          ₹{Math.round(property.price / 30).toLocaleString()}/day
        </div>
        <div className="absolute left-4 top-4 rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white shadow-sm uppercase tracking-wider">
          {property.type}
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-400">
          <MapPin className="h-3 w-3" />
          {property.location.area || property.address?.split(',')[0] || property.location.city}, {property.location.city}
        </div>
        <h3 className="mt-2 text-lg font-bold text-neutral-900 line-clamp-1">{property.title}</h3>
        <div className="mt-4 flex items-center justify-between border-t border-neutral-50 pt-4">
          <div className="flex items-center gap-1 text-sm font-bold text-orange-600">
            <Star className="h-4 w-4 fill-orange-600" />
            {property.rating || 'New'}
          </div>
          <button className="text-sm font-bold text-neutral-900 hover:text-orange-600">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
