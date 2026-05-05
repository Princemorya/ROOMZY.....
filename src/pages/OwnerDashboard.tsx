import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  BarChart3, Home, PlusCircle, Calendar, MessageSquare, 
  MapPin, Check, X, ArrowUpRight, TrendingUp, Users, Wallet, Trash2, IndianRupee, CreditCard, Smartphone,
  Shield, FileText, AlertCircle, CheckCircle
} from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { Property, Booking, BookingStatus, PropertyStatus, UserRole, VerificationStatus } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { AMENITIES_LIST, CITIES, PROPERTY_TYPES, CITY_COORDINATES } from '@/src/constants';
import { Upload, Camera } from 'lucide-react';

export default function OwnerDashboard() {
  const { profile } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Overview', path: '/owner', icon: BarChart3 },
    { name: 'My Listings', path: '/owner/listings', icon: Home },
    { name: 'Bookings', path: '/owner/bookings', icon: Calendar },
    { name: 'Identity', path: '/owner/identity', icon: Shield },
    { name: 'Earnings', path: '/owner/payments', icon: IndianRupee },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-extrabold text-neutral-900">Owner Dashboard</h1>
        <div className="flex gap-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all",
                location.pathname === item.path 
                  ? "bg-neutral-900 text-white shadow-lg shadow-neutral-200" 
                  : "bg-white text-neutral-500 border border-neutral-100 hover:border-neutral-900 hover:text-neutral-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
          <Link 
            to="/owner/listings/new"
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-orange-100 hover:bg-orange-700"
          >
            <PlusCircle className="h-4 w-4" />
            New Listing
          </Link>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/listings" element={<ListingsManagement />} />
        <Route path="/listings/new" element={<PropertyForm />} />
        <Route path="/bookings" element={<OwnerBookings />} />
        <Route path="/identity" element={<IdentityVerification />} />
        <Route path="/payments" element={<OwnerPayments />} />
      </Routes>
    </div>
  );
}

function Overview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ earnings: 0, active: 0, totalBookings: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const propsQuery = query(collection(db, 'properties'), where('ownerId', '==', user.uid));
        const propsSnap = await getDocs(propsQuery);
        const activeCount = propsSnap.docs.filter(d => (d.data() as Property).status === PropertyStatus.ACTIVE).length;
        
        const bookingsQuery = query(collection(db, 'bookings'), where('ownerId', '==', user.uid));
        const bookingsSnap = await getDocs(bookingsQuery);
        let earnings = 0;
        let totalBookings = bookingsSnap.size;
        
        bookingsSnap.docs.forEach(d => {
          const b = d.data() as Booking;
          if (b.paid) {
            earnings += Number(b.amount) || 0;
          }
        });
        
        setStats({ earnings, active: activeCount, totalBookings });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'properties/bookings');
      }
    };
    fetchStats();
  }, [user]);

  const cards = [
    { label: 'Total Earnings', value: `₹${stats.earnings.toLocaleString()}`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Listings', value: stats.active, icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Growth', value: '+12%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(card => (
          <div key={card.label} className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
            <div className={cn("inline-flex rounded-xl p-3", card.bg, card.color)}>
              <card.icon className="h-6 w-6" />
            </div>
            <div className="mt-4">
              <p className="text-sm font-bold uppercase tracking-wider text-neutral-400">{card.label}</p>
              <h3 className="mt-1 text-2xl font-black text-neutral-900">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-neutral-100 bg-white p-8">
        <h2 className="text-xl font-bold text-neutral-900">Recent Activity</h2>
        <div className="mt-6 flex h-64 items-center justify-center text-neutral-400 font-medium text-center max-w-sm mx-auto">
          Insights will appear here once you have more confirmed bookings.
        </div>
      </div>
    </div>
  );
}

function ListingsManagement() {
  const { user, profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'properties'), where('ownerId', '==', user.uid));
        const snap = await getDocs(q);
        setProperties(snap.docs.map(d => ({ id: d.id, ...d.data() } as Property)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [user]);

  const toggleAvailability = async (id: string, current: boolean) => {
    if (profile?.role !== UserRole.OWNER) {
      alert("Access denied: You must be an owner to perform this action.");
      return;
    }
    try {
      await updateDoc(doc(db, 'properties', id), { isAvailable: !current });
      setProperties(prev => prev.map(p => p.id === id ? { ...p, isAvailable: !current } : p));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `properties/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      await deleteDoc(doc(db, 'properties', id));
      setProperties(prev => prev.filter(p => p.id !== id));
      alert("Listing deleted successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `properties/${id}`);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" /></div>;

  return (
    <div className="grid gap-6">
      {properties.length > 0 ? (
        properties.map(p => (
          <div key={p.id} className="flex flex-col gap-6 rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow sm:flex-row sm:items-center">
            <img referrerPolicy="no-referrer" src={p.images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=400'} className="h-20 w-20 rounded-2xl object-cover shadow-sm" alt="p" />
            <div className="flex-grow">
              <h3 className="text-lg font-bold text-neutral-900">{p.title}</h3>
              <p className="flex items-center gap-1 text-sm text-neutral-500"><MapPin className="h-3 w-3" /> {p.location.city}, {p.location.area}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Status</span>
                <button 
                  onClick={() => toggleAvailability(p.id, p.isAvailable)}
                  className={cn("mt-1 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all", p.isAvailable ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}
                >
                  <div className={cn("h-1.5 w-1.5 rounded-full", p.isAvailable ? "bg-green-600" : "bg-red-600")} />
                  {p.isAvailable ? 'Available' : 'Occupied'}
                </button>
              </div>
              <div className="flex gap-2">
                <Link to={`/property/${p.id}`} className="rounded-xl border border-neutral-200 p-2 text-neutral-500 hover:text-neutral-900">
                  <ArrowUpRight className="h-5 w-5" />
                </Link>
                <button 
                  onClick={() => handleDelete(p.id)}
                  className="rounded-xl border border-neutral-200 p-2 text-neutral-400 hover:text-red-600 hover:border-red-100 transition-all font-bold"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-neutral-200">
          <div className="h-16 w-16 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400 mb-4">
            <Home className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">No listings yet</h3>
          <p className="text-neutral-500 text-sm mt-1 max-w-xs text-center mx-auto mb-6">Create your first listing to start reaching thousands of prospective tenants.</p>
          <Link 
            to="/owner/listings/new"
            className="flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-2 text-sm font-bold text-white hover:bg-neutral-800 transition-all font-bold"
          >
            Create First Listing
          </Link>
        </div>
      )}
    </div>
  );
}

function PropertyForm() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: 'Mumbai',
    area: '',
    address: '',
    price: 0,
    type: 'room' as 'room' | 'pg',
    amenities: [] as string[]
  });
  const [images, setImages] = useState<string[]>(['']);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || profile?.role !== UserRole.OWNER) {
      alert("Access denied: You must be an owner to list properties.");
      return;
    }
    
    setLoading(true);
    
    try {
      // Handle image uploads to Firebase Storage
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploading(true);
        uploadedUrls = await Promise.all(
          selectedFiles.map(async (file, idx) => {
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
            const fileRef = ref(storage, `properties/${user.uid}/${fileName}`);
            await uploadBytes(fileRef, file);
            return getDownloadURL(fileRef);
          })
        );
        setUploading(false);
      }

      const manualImages = images.filter(img => img.trim() !== '');
      const validImages = [...manualImages, ...uploadedUrls];

      if (validImages.length === 0) {
        alert("Please add at least one image (either upload or URL).");
        setLoading(false);
        return;
      }

      // Default coordinates if not provided (simulating map pick)
      const cityCoords = CITY_COORDINATES[formData.city] || { lat: 20.5937, lng: 78.9629 };
      const randomOffset = () => (Math.random() - 0.5) * 0.05; // Add small randomness for pins nearby

      await addDoc(collection(db, 'properties'), {
        ...formData,
        ownerId: user.uid,
        ownerName: profile?.displayName || 'Owner',
        ownerPhoto: profile?.photoURL || '',
        ownerUpiId: profile?.upiId || '',
        location: { 
          city: formData.city, 
          area: formData.area,
          lat: cityCoords.lat + randomOffset(),
          lng: cityCoords.lng + randomOffset()
        },
        images: validImages,
        isAvailable: true,
        status: PropertyStatus.ACTIVE,
        createdAt: Date.now()
      });
      setSuccess(true);
      alert("Property listed successfully!");
      setTimeout(() => {
        navigate('/owner/listings');
      }, 1000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'properties');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (name: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(name) 
        ? prev.amenities.filter(a => a !== name) 
        : [...prev.amenities, name]
    }));
  };

  return (
    <div className="mx-auto max-w-2xl">
      {success ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center space-y-6 rounded-3xl border border-green-100 bg-green-50/50 p-12 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Check className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Listing Successful!</h2>
            <p className="mt-2 text-neutral-500">Your property has been listed and is now visible to prospective tenants.</p>
          </div>
          <p className="text-sm text-neutral-400 italic">Redirecting to your listings...</p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 rounded-3xl border border-neutral-100 bg-white p-8">
      <div className="space-y-4">
        <label className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Property Title</label>
        <input 
          required 
          placeholder="Cozy Single Room near Metro" 
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          className="w-full rounded-xl border border-neutral-200 p-4 focus:border-orange-500 outline-none" 
        />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-neutral-900 uppercase tracking-wide">City</label>
            <select 
              className="mt-2 w-full rounded-xl border border-neutral-200 p-4"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Area</label>
            <input 
              required 
              placeholder="e.g. Andheri West" 
              value={formData.area}
              onChange={e => setFormData({ ...formData, area: e.target.value })}
              className="mt-2 w-full rounded-xl border border-neutral-200 p-4 outline-none focus:border-orange-500" 
            />
            <p className="mt-1 text-[10px] text-neutral-400 italic">Approximate location will be shown on the map view.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Monthly Base Rent (₹)</label>
            <input 
              type="number" 
              required 
              placeholder="e.g. 15000"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
              className="mt-2 w-full rounded-xl border border-neutral-200 p-4" 
            />
            <p className="mt-1 text-[10px] text-neutral-400 italic">This will be displayed as ~₹{Math.round(formData.price / 30)}/day</p>
          </div>
          <div>
            <label className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Type</label>
            <select 
              className="mt-2 w-full rounded-xl border border-neutral-200 p-4"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as any })}
            >
              {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Property Images</label>
            <p className="mt-1 text-xs text-neutral-500">Upload high-quality images of your property to attract more tenants.</p>
            
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative aspect-square rounded-2xl border-2 border-dashed border-neutral-100 bg-neutral-50 group overflow-hidden">
                  <img 
                    src={URL.createObjectURL(file)} 
                    className="h-full w-full rounded-2xl object-cover transition-transform group-hover:scale-105" 
                    alt="preview" 
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      className="bg-white/90 p-2 rounded-full text-red-600 hover:bg-white shadow-sm transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-white transition-all hover:border-orange-500 hover:bg-orange-50 group">
                <div className="flex flex-col items-center justify-center transition-transform group-hover:-translate-y-1">
                  <Upload className="h-6 w-6 text-neutral-400 group-hover:text-orange-500" />
                  <span className="mt-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest group-hover:text-orange-600">Upload</span>
                </div>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Or add image URLs</label>
              <button 
                type="button" 
                onClick={() => setImages([...images, ''])}
                className="text-[10px] font-bold text-orange-600 hover:text-orange-700 uppercase flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg transition-all active:scale-95"
              >
                <PlusCircle className="h-3 w-3" />
                Add Row
              </button>
            </div>
            <div className="space-y-3">
              {images.map((url, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2">
                    <input 
                      placeholder="https://images.unsplash.com/..."
                      value={url}
                      onChange={e => {
                        const newImages = [...images];
                        newImages[index] = e.target.value;
                        setImages(newImages);
                      }}
                      className="w-full rounded-xl border border-neutral-200 p-4 text-xs focus:border-orange-500 outline-none transition-all focus:ring-2 focus:ring-orange-100" 
                    />
                    {images.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => setImages(images.filter((_, i) => i !== index))}
                        className="flex items-center justify-center rounded-xl border border-neutral-200 px-4 text-neutral-400 hover:border-red-500 hover:text-red-500 transition-all active:scale-95"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {url.trim() && (url.startsWith('http') || url.startsWith('https')) && (
                    <div className="ml-1 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg border border-neutral-100 overflow-hidden bg-neutral-50">
                        <img 
                          referrerPolicy="no-referrer"
                          src={url} 
                          className="h-full w-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Invalid';
                          }}
                          alt="preview" 
                        />
                      </div>
                      <span className="text-[10px] text-neutral-400">Preview</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Amenities</label>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {AMENITIES_LIST.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-bold border transition-all",
                  formData.amenities.includes(a) ? "bg-orange-600 text-white border-orange-600" : "bg-white text-neutral-500 border-neutral-100 hover:border-orange-600"
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading || uploading}
        className="w-full rounded-2xl bg-orange-600 py-4 font-bold text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {uploading ? 'Uploading Images...' : loading ? 'Submitting...' : 'List Property'}
      </button>
    </form>
    )}
    </div>
  );
}

function OwnerBookings() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<(Booking & { tenant?: any })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'bookings'), where('ownerId', '==', user.uid));
        const snap = await getDocs(q);
        const results = await Promise.all(snap.docs.map(async d => {
          const b = { id: d.id, ...d.data() } as Booking;
          const userSnap = await getDoc(doc(db, 'users', b.tenantId));
          return { ...b, tenant: userSnap.data() };
        }));
        setBookings(results.sort((a, b) => {
          const d1 = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt as any)?.toMillis?.() || 0;
          const d2 = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt as any)?.toMillis?.() || 0;
          return d2 - d1;
        }));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  const updateStatus = async (id: string, status: BookingStatus) => {
    if (status === BookingStatus.CANCELLED) {
      if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    }
    try {
      const updateData: any = { status, updatedAt: serverTimestamp() };
      
      await updateDoc(doc(db, 'bookings', id), updateData);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updateData, updatedAt: Date.now() } : b));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" /></div>;

  return (
    <div className="grid gap-6">
      {bookings.length > 0 ? (
        bookings.map(b => (
          <div key={b.id} className="flex flex-col gap-6 rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow sm:flex-row sm:items-center">
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Request from</span>
                <h3 className="font-bold text-neutral-900">{b.tenant?.displayName}</h3>
              </div>
              <p className="mt-1 text-sm text-neutral-500">Booked for ₹{b.amount} on {new Date(b.createdAt).toLocaleDateString()}</p>
              {b.paid && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600 uppercase">
                  Paid via {b.paymentMethod}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 items-center">
              {b.status === BookingStatus.PENDING ? (
                <>
                  <button 
                    onClick={() => updateStatus(b.id, BookingStatus.CONFIRMED)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm shadow-green-100"
                    title="Confirm Booking"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => updateStatus(b.id, BookingStatus.CANCELLED)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm shadow-red-100"
                    title="Reject Booking"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <span className={cn("rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider text-center min-w-[80px]", 
                    b.status === BookingStatus.CONFIRMED ? "bg-green-50 text-green-600" : 
                    b.status === BookingStatus.COMPLETED ? "bg-blue-50 text-blue-600" :
                    "bg-red-50 text-red-600"
                  )}>
                    {b.status}
                  </span>
                  {b.status === BookingStatus.CONFIRMED && !b.paid && (
                    <button 
                      onClick={() => updateStatus(b.id, BookingStatus.CANCELLED)}
                      className="text-[10px] font-bold text-neutral-400 hover:text-red-500 uppercase tracking-widest transition-all"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-neutral-200">
           <div className="h-16 w-16 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400 mb-4">
            <Calendar className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">No booking requests</h3>
          <p className="text-neutral-500 text-sm mt-1 max-w-xs text-center mx-auto">When tenants request stays at your properties, they will appear here for confirmation.</p>
        </div>
      )}
    </div>
  );
}

function OwnerPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<(Booking & { tenant?: any; property?: Property })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'bookings'), 
          where('ownerId', '==', user.uid),
          where('paid', '==', true)
        );
        const snap = await getDocs(q);
        const results = await Promise.all(snap.docs.map(async d => {
          const b = { id: d.id, ...d.data() } as Booking;
          const [uSnap, pSnap] = await Promise.all([
            getDoc(doc(db, 'users', b.tenantId)),
            getDoc(doc(db, 'properties', b.propertyId))
          ]);
          return { 
            ...b, 
            tenant: uSnap.data(),
            property: pSnap.exists() ? pSnap.data() as Property : undefined
          };
        }));
        setPayments(results.sort((a, b) => {
          const d1 = (a.paymentDate as any)?.toMillis?.() || a.paymentDate || 0;
          const d2 = (b.paymentDate as any)?.toMillis?.() || b.paymentDate || 0;
          return Number(d2) - Number(d1);
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-neutral-100 bg-white p-8">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2 mb-6">
          <IndianRupee className="h-5 w-5 text-orange-600" />
          Earnings History
        </h2>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-50 text-left text-xs font-bold uppercase tracking-wider text-neutral-400">
                  <th className="pb-4 pt-0">Tenant</th>
                  <th className="pb-4 pt-0">Property</th>
                  <th className="pb-4 pt-0">Date</th>
                  <th className="pb-4 pt-0">Amount</th>
                  <th className="pb-4 pt-0">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {payments.map(pay => (
                  <tr key={pay.id}>
                    <td className="py-4">
                      <div className="font-bold text-neutral-900">{pay.tenant?.displayName || 'Unknown User'}</div>
                      <div className="text-[10px] text-neutral-400">ID: {pay.tenantId.slice(0, 8)}</div>
                    </td>
                    <td className="py-4">
                      <div className="text-sm font-medium text-neutral-700">{pay.property?.title}</div>
                    </td>
                    <td className="py-4 text-sm text-neutral-500">
                      {new Date((pay.paymentDate as any)?.toMillis?.() || pay.paymentDate || 0).toLocaleDateString()}
                    </td>
                    <td className="py-4 font-black text-green-600">+₹{pay.amount.toLocaleString()}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-600">
                        {pay.paymentMethod === 'card' ? <CreditCard className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                        {pay.paymentMethod}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-neutral-400">
            No completed payments received yet.
          </div>
        )}
      </div>
    </div>
  );
}

function IdentityVerification() {
  const { user, profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async () => {
    if (!user || !file) {
      console.warn("Upload aborted: No user or file selected.");
      return;
    }
    
    console.log("Starting upload for file:", file.name, "Size:", file.size);
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const { uploadBytes, getDownloadURL } = await import('firebase/storage');
      const fileName = `id_${user.uid}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const storagePath = `verifications/${user.uid}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      console.log("Starting Direct Upload to:", storagePath);
      
      // Use a timeout for the entire upload operation
      const uploadPromise = uploadBytes(storageRef, file);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("STORAGE_STALLED")), 300000)
      );

      setUploadProgress(40);
      const snapshot = await Promise.race([uploadPromise, timeoutPromise]) as any;
      console.log("Upload completed:", snapshot);

      setUploadProgress(80);
      const downloadUrl = await getDownloadURL(storageRef);
      console.log("Download URL obtained:", downloadUrl);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        governmentIdUrl: downloadUrl,
        verificationStatus: VerificationStatus.PENDING,
        updatedAt: serverTimestamp()
      });
      
      setUploadProgress(100);
      await new Promise(res => setTimeout(res, 1000));
      setIsSubmitted(true);
      setFile(null);
    } catch (err: any) {
      console.error("Upload Error Details:", err);
      
      let message = err.message || "Unknown error";
      const isStalled = err.message === "STORAGE_STALLED" || err.code === "storage/retry-limit-exceeded";

      if (isStalled) {
        const bucket = storage.app.options.storageBucket || 'unknown-bucket';
        const projectId = storage.app.options.projectId;
        message = `Firebase Storage is NOT enabled or is still provisioning.
        
CRITICAL STEPS TO FIX:
1. Open this link: https://console.firebase.google.com/project/${projectId}/storage
2. If you see "Get Started", click it and follow the setup (use Default location).
3. If it is already enabled, go to the "Rules" tab and ensure they look like:
   allow read, write: if request.auth != null;
4. Wait 1-2 minutes for changes to propagate, then try again.`;
        setError(message);
      } else {
        try {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/verification`);
        } catch (handleErr: any) {
          message = handleErr.message;
        }
        alert("Verification Failed: " + (message.includes('{') ? "Permission Denied" : message));
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const status = profile?.verificationStatus || VerificationStatus.UNVERIFIED;

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-neutral-100 bg-white p-12 text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-neutral-900">Document Submitted</h2>
          <p className="mt-4 text-neutral-500">Your government ID has been securely uploaded. Our administrative team will verify your identity within 24-48 hours.</p>
          <button 
            onClick={() => setIsSubmitted(false)}
            className="mt-8 rounded-2xl bg-neutral-900 px-8 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-orange-600 transition-all"
          >
            Back to Identity
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="rounded-3xl border border-neutral-100 bg-white p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <Shield className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Identity Verification</h2>
            <p className="text-sm text-neutral-500">Verify your identity to increase trust and unlock premium features.</p>
          </div>
        </div>

        <div className="mt-10 space-y-6">
          {error && (
            <div className="rounded-2xl bg-red-50 p-6 border border-red-100 overflow-hidden">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-2">Upload Issue</h3>
                  <div className="text-sm text-red-700 whitespace-pre-wrap font-medium break-words leading-relaxed">{error}</div>
                  <button 
                    onClick={() => { setError(null); handleUpload(); }}
                    className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                  >
                    Retry Now
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className={cn(
            "rounded-2xl p-6 flex items-center justify-between",
            status === 'verified' ? "bg-green-50 border border-green-100" :
            status === 'pending' ? "bg-orange-50 border border-orange-100" :
            status === 'rejected' ? "bg-red-50 border border-red-100" :
            "bg-neutral-50 border border-neutral-100"
          )}>
            <div className="flex items-center gap-3">
              {status === 'verified' ? <CheckCircle className="h-5 w-5 text-green-600" /> : 
               status === 'pending' ? <Calendar className="h-5 w-5 text-orange-600 animate-pulse" /> :
               status === 'rejected' ? <X className="h-5 w-5 text-red-600" /> :
               <AlertCircle className="h-5 w-5 text-neutral-400" />}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-0.5">Current Status</span>
                <span className={cn("text-xs font-black uppercase tracking-tighter", 
                  status === 'verified' ? "text-green-600" : 
                  status === 'pending' ? "text-orange-600" :
                  status === 'rejected' ? "text-red-600" : "text-neutral-500"
                )}>
                  {status}
                </span>
              </div>
            </div>
            {status === 'unverified' || status === 'rejected' ? (
              <label className="cursor-pointer bg-neutral-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition-all uppercase tracking-widest shadow-lg shadow-neutral-100">
                {status === 'rejected' ? 'Re-upload ID' : 'Upload ID'}
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
              </label>
            ) : status === 'pending' ? (
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 italic">Review in progress</span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest text-green-600 italic">Identity Secured</span>
            )}
          </div>

          {profile?.verificationComment && status === 'rejected' && (
            <div className="rounded-2xl bg-red-50 p-6 border border-red-100">
               <div className="flex items-center gap-2 mb-2">
                 <AlertCircle className="h-4 w-4 text-red-600" />
                 <p className="text-xs font-black text-red-600 uppercase tracking-widest">Rejection Reason</p>
               </div>
               <p className="text-sm text-red-700 font-medium">{profile.verificationComment}</p>
            </div>
          )}

          {profile?.governmentIdUrl && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Uploaded Document</h3>
                {status === 'verified' && (
                   <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 uppercase">
                     <Check className="h-3 w-3" /> Encrypted & Secured
                   </span>
                )}
              </div>
              <div className="relative aspect-video rounded-3xl border border-neutral-100 bg-neutral-50 overflow-hidden group shadow-inner">
                <img 
                  referrerPolicy="no-referrer"
                  src={profile.governmentIdUrl} 
                  alt="Government ID" 
                  className={cn(
                    "h-full w-full object-contain transition-all duration-500",
                    status === 'verified' ? "blur-sm grayscale opacity-50" : ""
                  )}
                />
                {status === 'verified' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/10 backdrop-blur-[2px]">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-xl shadow-green-100 animate-bounce-slow">
                      <Shield className="h-8 w-8" />
                    </div>
                    <p className="mt-4 text-xs font-black text-neutral-900 uppercase tracking-widest">Verified Identity</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                <a 
                  href={profile.governmentIdUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="absolute bottom-6 right-6 flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md px-6 py-3 text-xs font-black text-neutral-900 shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  View Original
                </a>
              </div>
            </div>
          )}

          {file && (status === 'unverified' || status === 'rejected') && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-6"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-bold text-neutral-900 truncate">{file.name}</p>
                  <p className="text-xs text-neutral-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button 
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-orange-600 text-white px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-orange-700 disabled:opacity-50 relative overflow-hidden"
                >
                  <span className="relative z-10">
                    {uploading ? `Uploading ${uploadProgress}%` : 'Submit'}
                  </span>
                  {uploading && (
                    <motion.div 
                      className="absolute inset-0 bg-orange-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </button>
              </div>
            </motion.div>
          )}

          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Guidelines</h3>
            <ul className="space-y-3">
              {[
                { label: 'Document Type', value: 'Government issued Aadhaar, PAN, or Passport.' },
                { label: 'Quality', value: 'Ensure the image is clear and text is readable.' },
                { label: 'Privacy', value: 'We use 256-bit encryption. Your document is safe.' }
              ].map(item => (
                <li key={item.label} className="flex items-start gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-600 mt-1.5 shrink-0" />
                  <div>
                    <span className="text-xs font-black uppercase text-neutral-900">{item.label}:</span>
                    <span className="text-xs text-neutral-500 ml-1">{item.value}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
