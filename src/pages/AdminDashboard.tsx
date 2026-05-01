import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { 
  Users, Home, Shield, AlertTriangle, 
  Trash2, CheckCircle, Search, Database, Plus, IndianRupee, CreditCard, Smartphone
} from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, updateDoc, setDoc, query, where, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { UserProfile, Property, PropertyStatus, UserRole, Booking } from '@/src/types';
import { cn, formatDate, getTimestamp } from '@/src/lib/utils';
import { CITIES } from '@/src/constants';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'properties' | 'payments'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<(Booking & { tenant?: any; property?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userSnap = await getDocs(collection(db, 'users'));
      setUsers(userSnap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile)));

      const propSnap = await getDocs(collection(db, 'properties'));
      setProperties(propSnap.docs.map(d => ({ ...d.data(), id: d.id } as Property)));

      const payQuery = query(collection(db, 'bookings'), where('paid', '==', true));
      const paySnap = await getDocs(payQuery);
      const payData = await Promise.all(paySnap.docs.map(async d => {
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
      setPayments(payData.sort((a, b) => getTimestamp(b.paymentDate) - getTimestamp(a.paymentDate)));
    } catch (err: any) {
      console.error(err);
      setError("Permission denied: You do not have administrative privileges to access this data.");
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    if (!profile) return;
    setSeedLoading(true);
    try {
      const sampleProperties = [
        {
          title: "Luxury Penthouse with City View",
          price: 45000,
          type: "flat",
          location: { city: "Bangalore", address: "Koramangala 4th Block", lat: 12.9352, lng: 77.6245 },
          description: "High-end penthouse with floor-to-ceiling windows and premium amenities. Features 24/7 power backup and high-speed fiber internet.",
          amenities: ["WiFi", "AC", "Laundry", "Gym", "Parking", "Power Backup", "CCTV"],
          images: [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1000"
          ]
        },
        {
          title: "Cozy Studio near Metro",
          price: 15000,
          type: "studio",
          location: { city: "Delhi", address: "Lajpat Nagar II", lat: 28.5677, lng: 77.2435 },
          description: "Perfect for students or working professionals. Fully furnished and well-connected to Delhi Metro. Includes daily cleaning.",
          amenities: ["WiFi", "Laundry", "Kitchen", "Cleaning Service", "Hot Water"],
          images: [
            "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=1000"
          ]
        },
        {
          title: "Modern 2BHK in Gated Community",
          price: 28000,
          type: "flat",
          location: { city: "Mumbai", address: "Powai Hiranandani", lat: 19.1176, lng: 72.9060 },
          description: "Spacious house with modern fittings and access to clubhouse amenities. Very secure area with CCTV.",
          amenities: ["WiFi", "AC", "Parking", "Gym", "Pool", "CCTV", "Power Backup"],
          images: [
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&q=80&w=1000"
          ]
        },
        {
          title: "Premium PG for Women",
          price: 12000,
          type: "pg",
          location: { city: "Pune", address: "Viman Nagar", lat: 18.5679, lng: 73.9143 },
          description: "Safe and well-maintained PG for female residents. Includes healthy meals and 24/7 security.",
          amenities: ["WiFi", "Laundry", "AC", "Meals Included", "CCTV", "Cleaning Service"],
          images: [
            "https://images.unsplash.com/photo-1555854817-5b2336a751be?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1536376073347-457393240b06?auto=format&fit=crop&q=80&w=1000"
          ]
        },
        {
          title: "Premium 1BHK Apartment",
          price: 22000,
          type: "flat",
          location: { city: "Hyderabad", address: "Gachibowli", lat: 17.4401, lng: 78.3489 },
          description: "Executive 1BHK close to IT Hub. Modern decor and high-speed internet.",
          amenities: ["WiFi", "AC", "Laundry", "Gym"],
          images: [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=1000"
          ]
        },
        {
          title: "Independent Floor with Terrace",
          price: 35000,
          type: "house",
          location: { city: "Gurgaon", address: "Sector 45", lat: 28.4418, lng: 77.0620 },
          description: "Large independent floor with a private terrace and 24/7 security.",
          amenities: ["WiFi", "AC", "Laundry", "Parking", "Gym"],
          images: [
            "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1464890100898-a385f744067f?auto=format&fit=crop&q=80&w=1000"
          ]
        },
        {
          title: "Budget Bunk Bed in Hostel",
          price: 5000,
          type: "pg",
          location: { city: "Bangalore", address: "PG Road, Whitefield", lat: 12.9698, lng: 77.7499 },
          description: "Affordable shared accommodation for bachelor students.",
          amenities: ["WiFi", "Laundry"],
          images: [
            "https://images.unsplash.com/photo-1596272875729-ed2ff7d6d9c5?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1632733711679-5292d6863f10?auto=format&fit=crop&q=80&w=1000"
          ]
        },
        {
          title: "Artistic Studio in Heritage Area",
          price: 32000,
          type: "studio",
          location: { city: "Mumbai", address: "Colaba", lat: 18.9067, lng: 72.8147 },
          description: "Unique studio apartment with vintage furniture and artistic vibes.",
          amenities: ["WiFi", "AC", "Kitchen"],
          images: [
            "https://images.unsplash.com/photo-1560448204-61dc36dc98c8?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1502672023488-70e25813efdf?auto=format&fit=crop&q=80&w=1000"
          ]
        },
        {
          title: "Spacious Bungalow Wing",
          price: 60000,
          type: "house",
          location: { city: "Chennai", address: "Adyar", lat: 13.0012, lng: 80.2565 },
          description: "Entire wing of a classic bungalow available for rent. Lush green surroundings.",
          amenities: ["WiFi", "AC", "Laundry", "Parking", "Gym", "Pool"],
          images: [
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000"
          ]
        },
        {
          title: "Smart Bachelor Flat - Tech Park Side",
          price: 25000,
          type: "flat",
          location: { city: "Bangalore", address: "Electronic City", lat: 12.8452, lng: 77.6602 },
          description: "Modern apartment with smart home controls and proximity to major tech parks.",
          amenities: ["WiFi", "AC", "Laundry", "Gym"],
          images: [
            "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1536376073347-457393240b06?auto=format&fit=crop&q=80&w=1000"
          ]
        }
      ];

      for (const p of sampleProperties) {
        const id = `seed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await setDoc(doc(db, 'properties', id), {
          ...p,
          ownerId: profile.uid,
          status: PropertyStatus.ACTIVE,
          isAvailable: true,
          createdAt: Date.now(),
          address: p.location.address // duplicated for compatibility
        });
      }
      
      alert("Successfully seeded 10 properties!");
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Seeding failed: " + err.message);
    } finally {
      setSeedLoading(false);
    }
  };

  useEffect(() => {
    const isActuallyAdmin = profile?.role === UserRole.ADMIN || user?.email === 'pmconsultancy2024@gmail.com';
    if (isActuallyAdmin) {
      fetchData();
    } else if (profile) {
      setError("Access Denied: You do not have permissions to view this dashboard.");
      setLoading(false);
    }
  }, [profile, user]);

  const handleDeleteUser = async (uid: string) => {
    const isActuallyAdmin = profile?.role === UserRole.ADMIN || user?.email === 'pmconsultancy2024@gmail.com';
    if (!isActuallyAdmin) {
      alert("Permission denied in UI: You are not recognized as an admin.");
      return;
    }
    if (uid === user?.uid) return alert("You cannot delete your own admin account.");
    if (!window.confirm("Are you sure you want to delete this user? This action is irreversible.")) return;
    
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(prev => prev.filter(u => u.uid !== uid));
      alert("User deleted successfully.");
    } catch (err: any) {
      console.error("Delete User Error:", err);
      alert("Delete User Failed: " + (err.message || "Unknown error"));
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    const isActuallyAdmin = profile?.role === UserRole.ADMIN || user?.email === 'pmconsultancy2024@gmail.com';
    if (!isActuallyAdmin) {
      alert("Permission denied in UI: You are not recognized as an admin.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this property?")) return;
    
    try {
      await deleteDoc(doc(db, 'properties', id));
      setProperties(prev => prev.filter(p => p.id !== id));
      alert("Property deleted successfully.");
    } catch (err: any) {
      console.error("Delete Property Error:", err);
      alert("Delete Property Failed: " + (err.message || "Unknown error"));
      handleFirestoreError(err, OperationType.DELETE, `properties/${id}`);
    }
  };

  const handleToggleUserRole = async (uid: string, currentRole: UserRole) => {
    const isActuallyAdmin = profile?.role === UserRole.ADMIN || user?.email === 'pmconsultancy2024@gmail.com';
    if (!isActuallyAdmin) {
      alert("Permission denied in UI: You are not recognized as an admin.");
      return;
    }
    const newRole = currentRole === UserRole.TENANT ? UserRole.OWNER : UserRole.TENANT;
    
    try {
      await updateDoc(doc(db, 'users', uid), { 
        role: newRole,
        updatedAt: Date.now()
      });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
      alert(`User role updated to ${newRole}`);
    } catch (err: any) {
      console.error("Toggle Role Error:", err);
      alert("Update Role Failed: " + (err.message || "Unknown error"));
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleMakeMainAdmin = async () => {
    if (user?.email !== 'pmconsultancy2024@gmail.com' || !user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { 
        role: UserRole.ADMIN,
        updatedAt: Date.now()
      });
      alert("Admin status fixed! Your account is now a full administrator in the database.");
      window.location.reload();
    } catch (err: any) {
      console.error("Repair Admin Error:", err);
      // Fallback for first-time setup if doc doesn't exist
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Main Admin',
          role: UserRole.ADMIN,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        alert("Admin profile created successfully!");
        window.location.reload();
      } catch (err2: any) {
        handleFirestoreError(err2, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  };

  if (profile?.role !== UserRole.ADMIN && user?.email !== 'pmconsultancy2024@gmail.com') {
    return <div className="p-20 text-center font-bold text-red-600">Access Denied</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-orange-600" />
            Admin Control Center
          </h1>
          {user?.email === 'pmconsultancy2024@gmail.com' && profile?.role !== UserRole.ADMIN && (
            <button 
              onClick={handleMakeMainAdmin}
              className="mt-2 text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
            >
              <Shield className="h-3 w-3" />
              Repair My Admin Permissions (Profile says {profile?.role || 'Guest'})
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={seedData}
            disabled={seedLoading}
            className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-800 transition-all disabled:opacity-50"
          >
            {seedLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Database className="h-4 w-4" />}
            Seed Data
          </button>
          <button 
            onClick={fetchData}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-bold hover:bg-neutral-50 transition-all"
          >
            Refresh Data
          </button>
        </div>
      </div>
      
      {error && (
        <div className="rounded-2xl bg-red-50 p-6 text-center border border-red-100 italic font-medium text-red-600">
          {error}
          <p className="mt-2 text-xs font-normal">Please ensure you are logged in with the correct credentials or that the admin marker is set in Firestore.</p>
        </div>
      )}

      <div className="flex gap-4 border-b border-neutral-100">
        <button 
          onClick={() => setActiveTab('users')}
          className={cn("pb-4 text-sm font-bold transition-all px-2", activeTab === 'users' ? "text-orange-600 border-b-2 border-orange-600" : "text-neutral-400 hover:text-neutral-900")}
        >
          Manage Users ({users.length})
        </button>
        <button 
          onClick={() => setActiveTab('properties')}
          className={cn("pb-4 text-sm font-bold transition-all px-2", activeTab === 'properties' ? "text-orange-600 border-b-2 border-orange-600" : "text-neutral-400 hover:text-neutral-900")}
        >
          Manage Properties ({properties.length})
        </button>
        <button 
          onClick={() => setActiveTab('payments')}
          className={cn("pb-4 text-sm font-bold transition-all px-2", activeTab === 'payments' ? "text-orange-600 border-b-2 border-orange-600" : "text-neutral-400 hover:text-neutral-900")}
        >
          Payments ({payments.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" /></div>
      ) : activeTab === 'users' ? (
        <UserTable users={users} onToggleRole={handleToggleUserRole} onDeleteUser={handleDeleteUser} />
      ) : activeTab === 'properties' ? (
        <PropertyTable properties={properties} onDelete={handleDeleteProperty} />
      ) : (
        <PaymentTable payments={payments} />
      )}
    </div>
  );
}

function PaymentTable({ payments }: { payments: (Booking & { tenant?: any; property?: any })[] }) {
  const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Total Platform Revenue</p>
          <div className="mt-2 text-3xl font-black text-neutral-900 italic tracking-tighter">₹{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Successful Transactions</p>
          <div className="mt-2 text-3xl font-black text-neutral-900 italic tracking-tighter">{payments.length}</div>
        </div>
        <div className="rounded-3xl border border-orange-100 bg-orange-50/50 p-6 shadow-sm">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-widest italic">Platform Commission (Sim)</p>
          <div className="mt-2 text-3xl font-black text-orange-600 italic tracking-tighter">₹{(totalRevenue * 0.1).toLocaleString()}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Transaction</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Property / Owner</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Amount</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {payments.map(pay => (
              <tr key={pay.id} className="hover:bg-neutral-50/50">
                <td className="px-6 py-4">
                  <div className="font-bold text-neutral-900">{pay.tenant?.displayName || 'Unknown Tenant'}</div>
                  <div className="text-[10px] font-mono text-neutral-400">{pay.transactionId || pay.id}</div>
                  <div className="mt-1 flex items-center gap-1 text-[8px] font-bold text-orange-600 uppercase tracking-widest italic">
                    {pay.paymentMethod === 'card' ? <CreditCard className="h-2 w-2" /> : <Smartphone className="h-2 w-2" />}
                    {pay.paymentMethod}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-neutral-700">{pay.property?.title}</div>
                  <div className="text-[10px] text-neutral-400">Owner ID: {pay.ownerId.slice(0, 8)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-black text-neutral-900 text-lg">₹{pay.amount.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 text-sm text-neutral-500 font-medium">
                  {formatDate(pay.paymentDate)}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-neutral-400 font-bold italic">
                  No payments have been processed yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserTable({ users, onToggleRole, onDeleteUser }: { users: UserProfile[], onToggleRole: (uid: string, role: UserRole) => void, onDeleteUser: (uid: string) => void }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-100 bg-white">
      <table className="w-full text-left">
        <thead className="bg-neutral-50 border-b border-neutral-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">User</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Role</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Joined</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {users.map(user => (
            <tr key={user.uid} className="hover:bg-neutral-50/50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                    {user.displayName ? user.displayName[0] : 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900">{user.displayName || 'User'}</div>
                    <div className="text-xs text-neutral-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <button 
                  onClick={() => onToggleRole(user.uid, user.role)}
                  className={cn("rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider", 
                    user.role === 'admin' ? "bg-purple-50 text-purple-600 cursor-not-allowed" : 
                    user.role === 'owner' ? "bg-blue-50 text-blue-600" : "bg-neutral-50 text-neutral-600"
                  )}
                >
                  {user.role}
                </button>
              </td>
              <td className="px-6 py-4 text-sm text-neutral-500">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4">
                 {user.role !== 'admin' && (
                  <button 
                    onClick={() => onDeleteUser(user.uid)}
                    className="flex items-center gap-1 text-red-400 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Delete</span>
                  </button>
                 )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PropertyTable({ properties, onDelete }: { properties: Property[], onDelete: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-neutral-50 border-b border-neutral-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Property</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">City</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Status</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {properties.map(p => (
            <tr key={p.id} className="hover:bg-neutral-50/50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img 
                    referrerPolicy="no-referrer"
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=200'} 
                    className="h-10 w-10 rounded-lg object-cover shadow-sm border border-neutral-100" 
                    alt="p" 
                  />
                  <div className="font-bold text-neutral-900 group-hover:text-orange-600 transition-colors">{p.title}</div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-neutral-500">{p.location.city}</td>
              <td className="px-6 py-4">
                <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider", 
                  p.status === PropertyStatus.ACTIVE ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                )}>
                  {p.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <button 
                  onClick={() => onDelete(p.id)}
                  className="flex items-center gap-1 text-red-400 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Delete</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

