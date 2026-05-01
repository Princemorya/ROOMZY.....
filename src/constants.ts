export const AMENITIES_LIST = [
  'WiFi',
  'AC',
  'CCTV',
  'Laundry',
  'Parking',
  'Power Backup',
  'Hot Water',
  'Attached Bathroom',
  'Meals Included',
  'Cleaning Service',
];

export const CITIES = [
  'Mumbai',
  'Bangalore',
  'Delhi',
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Jaipur',
  'Lucknow',
];

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
};

export const PROPERTY_TYPES = [
  { value: 'room', label: 'Single/Shared Room' },
  { value: 'pg', label: 'Paying Guest (PG)' },
  { value: 'flat', label: 'Apartment/Flat' },
  { value: 'studio', label: 'Studio Apartment' },
  { value: 'house', label: 'Independent House' },
];
