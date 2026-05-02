import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, Filter, IndianRupee, Star, X, Check, Map as MapIcon, List } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Property, PropertyStatus } from '@/src/types';
import { CITIES, PROPERTY_TYPES, AMENITIES_LIST } from '@/src/constants';
import PropertyCard from '@/src/components/PropertyCard';
import PropertyMap from '@/src/components/PropertyMap';
import { cn } from '@/src/lib/utils';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'map'>('list');

  // Filter states
  const city = searchParams.get('city') || '';
  const selectedTypes = searchParams.getAll('type');
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const selectedAmenities = searchParams.getAll('amenity');
  const minRating = searchParams.get('rating') || '';

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        let q = query(
          collection(db, 'properties'), 
          where('status', '==', PropertyStatus.ACTIVE),
          where('isAvailable', '==', true)
        );

        if (city) {
          q = query(q, where('location.city', '==', city));
        }

        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        
        // Client-side filtering for complex criteria
        let filtered = results;

        // Filter by types
        if (selectedTypes.length > 0) {
          filtered = filtered.filter(p => selectedTypes.includes(p.type));
        }

        // Filter by price
        if (minPrice) filtered = filtered.filter(p => (p.price / 30) >= Number(minPrice));
        if (maxPrice) filtered = filtered.filter(p => (p.price / 30) <= Number(maxPrice));

        // Filter by rating
        if (minRating) {
          filtered = filtered.filter(p => (p.rating || 0) >= Number(minRating));
        }

        // Filter by amenities (must have ALL selected amenities)
        if (selectedAmenities.length > 0) {
          filtered = filtered.filter(p => 
            selectedAmenities.every(a => p.amenities?.includes(a))
          );
        }

        setProperties(filtered);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [city, JSON.stringify(selectedTypes), minPrice, maxPrice, JSON.stringify(selectedAmenities), minRating]);

  const toggleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    const existing = params.getAll(key);
    
    if (existing.includes(value)) {
      // Remove specific value
      const updated = existing.filter(v => v !== value);
      params.delete(key);
      updated.forEach(v => params.append(key, v));
    } else {
      // Add value
      params.append(key, value);
    }
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    if (city) newParams.set('city', city);
    setSearchParams(newParams);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-6 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-neutral-900 text-lg">
              <Filter className="h-5 w-5" />
              Filters
            </div>
            {(selectedTypes.length > 0 || selectedAmenities.length > 0 || minPrice || maxPrice || minRating) && (
              <button 
                onClick={clearAllFilters}
                className="text-xs font-bold text-orange-600 hover:text-orange-700"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* City Search */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">City</label>
              <select 
                value={city}
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams);
                  if (e.target.value) params.set('city', e.target.value);
                  else params.delete('city');
                  setSearchParams(params);
                }}
                className="mt-1 w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-orange-500"
              >
                <option value="">All Cities</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Property Type */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Property Type</label>
              <div className="mt-2 space-y-2">
                {PROPERTY_TYPES.map(pt => (
                  <label 
                    key={pt.value} 
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${
                      selectedTypes.includes(pt.value) 
                        ? 'border-orange-200 bg-orange-50 text-orange-700' 
                        : 'border-neutral-100 hover:border-neutral-200 text-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={selectedTypes.includes(pt.value)}
                        onChange={() => toggleFilter('type', pt.value)}
                        className="hidden"
                      />
                      <span className="text-sm font-medium">{pt.label}</span>
                    </div>
                    {selectedTypes.includes(pt.value) && <Check className="h-4 w-4" />}
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Price Range (₹ / Day)</label>
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-neutral-400 text-xs">₹</span>
                    <input 
                      type="number" 
                      placeholder="Min/Day"
                      value={minPrice}
                      onChange={(e) => {
                        const params = new URLSearchParams(searchParams);
                        if (e.target.value) params.set('minPrice', e.target.value);
                        else params.delete('minPrice');
                        setSearchParams(params);
                      }}
                      className="w-full rounded-xl border border-neutral-200 py-2 pl-6 pr-2 text-sm outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-neutral-400 text-xs">₹</span>
                    <input 
                      type="number" 
                      placeholder="Max/Day"
                      value={maxPrice}
                      onChange={(e) => {
                        const params = new URLSearchParams(searchParams);
                        if (e.target.value) params.set('maxPrice', e.target.value);
                        else params.delete('maxPrice');
                        setSearchParams(params);
                      }}
                      className="w-full rounded-xl border border-neutral-200 py-2 pl-6 pr-2 text-sm outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Amenities</label>
              <div className="mt-2 grid grid-cols-1 gap-2">
                {AMENITIES_LIST.map(amenity => (
                  <label 
                    key={amenity}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg py-1 px-2 text-sm transition-colors ${
                      selectedAmenities.includes(amenity)
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => toggleFilter('amenity', amenity)}
                      className="hidden"
                    />
                    <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                      selectedAmenities.includes(amenity) ? 'border-transparent' : 'border-neutral-300'
                    }`}>
                      {selectedAmenities.includes(amenity) && <Check className="h-3 w-3" />}
                    </div>
                    {amenity}
                  </label>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Minimum Rating</label>
              <div className="mt-2 space-y-2">
                {[4, 3, 2].map(rating => (
                  <label 
                    key={rating}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${
                      minRating === rating.toString() 
                        ? 'border-orange-200 bg-orange-50 text-orange-700' 
                        : 'border-neutral-100 hover:border-neutral-200 text-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="rating"
                        checked={minRating === rating.toString()}
                        onChange={() => {
                          const params = new URLSearchParams(searchParams);
                          if (minRating === rating.toString()) {
                            params.delete('rating');
                          } else {
                            params.set('rating', rating.toString());
                          }
                          setSearchParams(params);
                        }}
                        className="hidden"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{rating}+ Stars</span>
                        <Star className={cn("h-3 w-3", minRating === rating.toString() ? "fill-current" : "text-neutral-400")} />
                      </div>
                    </div>
                    {minRating === rating.toString() && <Check className="h-4 w-4" />}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Main */}
      <div className="lg:col-span-3">
        <div className="mb-6 flex flex-wrap gap-2">
          {selectedTypes.map(t => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
              {PROPERTY_TYPES.find(pt => pt.value === t)?.label || t}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter('type', t)} />
            </span>
          ))}
          {selectedAmenities.map(a => (
            <span key={a} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-700">
              {a}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter('amenity', a)} />
            </span>
          ))}
          {minRating && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
              {minRating}+ Stars
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete('rating');
                setSearchParams(params);
              }} />
            </span>
          )}
          {(minPrice || maxPrice) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-700">
              ₹{minPrice || 0}/d - ₹{maxPrice || '∞'}/d
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete('minPrice');
                params.delete('maxPrice');
                setSearchParams(params);
              }} />
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">
            {loading ? (
              <div className="h-8 w-48 animate-pulse rounded bg-neutral-100"></div>
            ) : (
              `${properties.length} ${properties.length === 1 ? 'place' : 'places'} found`
            )}
          </h1>
          <div className="flex rounded-xl border border-neutral-100 bg-white p-1 shadow-sm">
            <button 
              onClick={() => setView('list')}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all",
                view === 'list' ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button 
              onClick={() => setView('map')}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all",
                view === 'map' ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              <MapIcon className="h-4 w-4" />
              Map
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 w-full animate-pulse rounded-3xl bg-neutral-50"></div>
            ))}
          </div>
        ) : view === 'map' ? (
          <div className="mt-8 h-[calc(100vh-20rem)] min-h-[500px]">
            <PropertyMap properties={properties} />
          </div>
        ) : properties.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {properties.map(property => (
              <PropertyCard 
                key={property.id} 
                property={property} 
                onClick={() => navigate(`/property/${property.id}`)} 
              />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-3xl border-2 border-dashed border-neutral-100 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-50 text-neutral-400">
              <Search className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-neutral-900">No matches found</h2>
            <p className="mt-2 text-neutral-500">Try removing some filters to see more results.</p>
            <button 
              onClick={clearAllFilters}
              className="mt-6 rounded-xl bg-neutral-900 px-6 py-2 font-bold text-white transition-colors hover:bg-neutral-800"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
