import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Calendar, Clock, CheckCircle2, XCircle, Search, IndianRupee, CreditCard, ShieldCheck, Smartphone, X, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { Booking, BookingStatus, Property } from '@/src/types';
import { cn } from '@/src/lib/utils';

export default function TenantDashboard() {
  const location = useLocation();

  const navItems = [
    { name: 'My Bookings', path: '/tenant', icon: Home },
    { name: 'Payment History', path: '/tenant/payments', icon: IndianRupee },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-extrabold text-neutral-900">Tenant Dashboard</h1>
        <div className="flex gap-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all",
                location.pathname === item.path 
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-100" 
                  : "bg-white text-neutral-500 border border-neutral-100 hover:border-orange-200 hover:text-orange-600"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      <Routes>
        <Route path="/" element={<BookingsList />} />
        <Route path="/payments" element={<PaymentHistory />} />
      </Routes>
    </div>
  );
}

function BookingsList() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<(Booking & { property?: Property; owner?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'bookings'), where('tenantId', '==', user.uid));
      const snap = await getDocs(q);
      const bookingData = await Promise.all(snap.docs.map(async d => {
        const b = { id: d.id, ...d.data() } as Booking;
        const propSnap = await getDoc(doc(db, 'properties', b.propertyId));
        return { 
          ...b, 
          property: propSnap.exists() ? propSnap.data() as Property : undefined
        };
      }));
      setBookings(bookingData.sort((a, b) => {
        const d1 = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt as any)?.toMillis?.() || 0;
        const d2 = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt as any)?.toMillis?.() || 0;
        return d2 - d1;
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handlePayment = async (bookingId: string, method: 'upi' | 'debit' | 'credit') => {
    try {
      const transactionId = `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: BookingStatus.COMPLETED,
        updatedAt: serverTimestamp(),
        paymentDate: serverTimestamp(),
        paid: true,
        paymentMethod: method,
        transactionId
      });
      await fetchBookings();
    } catch (err) {
      console.error(err);
      alert("Payment failed. Please try again.");
      throw err;
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) return;
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: BookingStatus.CANCELLED,
        updatedAt: serverTimestamp()
      });
      alert("Booking cancelled successfully.");
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert("Failed to cancel booking. Please try again.");
    }
  };

  if (loading) return <div className="flex py-20 justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" /></div>;

  return (
    <div className="grid gap-6">
      {bookings.length > 0 ? (
        bookings.map(booking => (
          <BookingCard 
            key={booking.id} 
            booking={booking} 
            onPay={() => setPayingBooking(booking)} 
            onCancel={() => handleCancel(booking.id)}
          />
        ))
      ) : (
        <div className="rounded-3xl border border-neutral-100 bg-white p-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-50 text-neutral-400">
            <Calendar className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-neutral-900">No bookings yet</h2>
          <p className="mt-2 text-neutral-500">Explore rooms and start your first booking!</p>
          <Link to="/search" className="mt-8 inline-block rounded-xl bg-orange-600 px-8 py-3 font-bold text-white hover:bg-orange-700">
            Browse Properties
          </Link>
        </div>
      )}

      {payingBooking && (
        <PaymentModal 
          booking={payingBooking} 
          onClose={() => setPayingBooking(null)} 
          onConfirm={(method) => handlePayment(payingBooking.id, method)} 
        />
      )}
    </div>
  );
}

function PaymentModal({ booking, onClose, onConfirm }: { booking: Booking; onClose: () => void; onConfirm: (method: 'upi' | 'debit' | 'credit') => Promise<void> }) {
  const [method, setMethod] = useState<'upi' | 'debit' | 'credit'>('upi');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(method);
      setLoading(false);
      setSuccess(true);
      // Explicitly show success alert as requested
      alert("Your payment is successful!");
      setTimeout(() => {
        onClose();
      }, 4000);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        {!success ? (
          <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
              <button onClick={onClose} className="rounded-full bg-neutral-100 p-2 text-neutral-400 hover:text-neutral-900 transition-all">
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-black text-neutral-900 italic tracking-tighter uppercase text-center w-full pr-10">Select Payment Method</h2>
            </div>

            <div className="mb-6 rounded-2xl bg-orange-600 p-6 text-white shadow-lg shadow-orange-100 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 -rotate-12 translate-x-4 text-white">
                <ShieldCheck className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-200">Amount Due</p>
                <div className="text-4xl font-black italic tracking-tighter mt-1">₹{booking.amount.toLocaleString()}</div>
                <p className="text-[8px] opacity-60 mt-2 font-mono tracking-tighter">B-REF: {booking.id.toUpperCase()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => setMethod('upi')}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border-2 p-4 transition-all active:scale-95",
                  method === 'upi' ? "border-orange-600 bg-orange-50/50" : "border-neutral-100 hover:border-neutral-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className={cn("h-5 w-5", method === 'upi' ? "text-orange-600" : "text-neutral-400")} />
                  <span className="font-bold text-neutral-900 text-sm">UPI ID</span>
                </div>
                {method === 'upi' && <CheckCircle2 className="h-4 w-4 text-orange-600" />}
              </button>

              <button 
                onClick={() => setMethod('debit')}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border-2 p-4 transition-all active:scale-95",
                  method === 'debit' ? "border-orange-600 bg-orange-50/50" : "border-neutral-100 hover:border-neutral-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className={cn("h-5 w-5", method === 'debit' ? "text-orange-600" : "text-neutral-400")} />
                  <span className="font-bold text-neutral-900 text-sm">Debit Card</span>
                </div>
                {method === 'debit' && <CheckCircle2 className="h-4 w-4 text-orange-600" />}
              </button>

              <button 
                onClick={() => setMethod('credit')}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border-2 p-4 transition-all active:scale-95",
                  method === 'credit' ? "border-orange-600 bg-orange-50/50" : "border-neutral-100 hover:border-neutral-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className={cn("h-5 w-5", method === 'credit' ? "text-orange-600" : "text-neutral-400")} />
                  <span className="font-bold text-neutral-900 text-sm">Credit Card</span>
                </div>
                {method === 'credit' && <CheckCircle2 className="h-4 w-4 text-orange-600" />}
              </button>
            </div>

            <div className="mt-6">
              {method === 'upi' ? (
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">UPI Identity</p>
                  <input 
                    type="text" 
                    placeholder="testuser@upi" 
                    className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50 p-4 text-sm font-medium focus:border-orange-600 focus:outline-none transition-all"
                    defaultValue="testuser@upi"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Card details</p>
                  <input type="text" placeholder="Card Number" className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50 p-4 text-sm font-medium focus:border-orange-600 focus:outline-none transition-all" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="MM/YY" className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50 p-4 text-sm font-medium focus:border-orange-600 focus:outline-none transition-all" />
                    <input type="password" placeholder="CVV" className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50 p-4 text-sm font-medium focus:border-orange-600 focus:outline-none transition-all" />
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleConfirm}
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 font-black italic uppercase tracking-tighter text-white shadow-xl shadow-orange-100 transition-all hover:bg-orange-700 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
              ) : (
                `Pay ₹${booking.amount.toLocaleString()}`
              )}
            </button>
          </div>
        ) : (
          <div className="p-12 text-center space-y-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-green-600 border border-green-100 shadow-sm"
            >
              <CheckCircle2 className="h-12 w-12" />
            </motion.div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-neutral-900 italic tracking-tighter">Your payment is successful!</h3>
              <p className="text-neutral-500 font-medium px-4">Your stay has been secured at the property. Records are being updated...</p>
            </div>
            <div className="pt-6 flex items-center justify-center gap-2 text-[10px] text-neutral-300 font-black uppercase tracking-[0.2em]">
              <Loader2 className="h-3 w-3 animate-spin text-green-500" />
              Verifying Transaction
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentHistory() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<(Booking & { property?: Property })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'bookings'), 
          where('tenantId', '==', user.uid),
          where('paid', '==', true)
        );
        const snap = await getDocs(q);
        const payData = await Promise.all(snap.docs.map(async d => {
          const b = { id: d.id, ...d.data() } as any;
          const propSnap = await getDoc(doc(db, 'properties', b.propertyId));
          return { 
            ...b, 
            property: propSnap.exists() ? propSnap.data() as Property : undefined
          };
        }));
        setPayments(payData.sort((a, b) => {
          const d1 = a.paymentDate?.toMillis?.() || a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || a.paymentDate || a.updatedAt || a.createdAt || 0;
          const d2 = b.paymentDate?.toMillis?.() || b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || b.paymentDate || b.updatedAt || b.createdAt || 0;
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

  if (loading) return <div className="flex py-20 justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-neutral-100 bg-white p-8">
        <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-orange-600" />
          Recent Transactions
        </h2>
        
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-50 text-left text-xs font-bold uppercase tracking-wider text-neutral-400">
                  <th className="pb-4 pt-0">Property</th>
                  <th className="pb-4 pt-0">Date</th>
                  <th className="pb-4 pt-0">Amount</th>
                  <th className="pb-4 pt-0">Status</th>
                  <th className="pb-4 pt-0 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {payments.map(pay => (
                  <tr key={pay.id} className="group">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg overflow-hidden border border-neutral-100 shadow-sm">
                          <img 
                            referrerPolicy="no-referrer"
                            src={pay.property?.images?.[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=400'} 
                            className="h-full w-full object-cover"
                            alt="" 
                          />
                        </div>
                        <span className="font-bold text-neutral-900 line-clamp-1">{pay.property?.title || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-neutral-500 font-medium">
                      {new Date((pay.paymentDate as any)?.toMillis?.() || pay.paymentDate || (pay.updatedAt as any)?.toMillis?.() || pay.updatedAt || (pay.createdAt as any)?.toMillis?.() || pay.createdAt || Date.now()).toLocaleDateString()}
                      {pay.paymentMethod && <div className="text-[10px] uppercase tracking-tighter opacity-70">{pay.paymentMethod}</div>}
                    </td>
                    <td className="py-4 font-extrabold text-neutral-900">
                      ₹{pay.amount.toLocaleString()}
                      {pay.transactionId && <div className="text-[8px] font-mono opacity-40">ID: {pay.transactionId}</div>}
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        Paid
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button className="text-sm font-bold text-orange-600 hover:underline">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-neutral-500">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 text-neutral-300 mb-4">
              <IndianRupee className="h-6 w-6" />
            </div>
            <p className="font-bold">No payment history available yet.</p>
            <p className="text-sm">Once you complete a property payment, it will appear here.</p>
          </div>
        )}
      </div>
      
      {/* Simulation/Help Card */}
      <div className="rounded-3xl bg-neutral-900 p-8 text-white">
        <h3 className="text-lg font-bold">Billing & Payments</h3>
        <p className="mt-2 text-sm text-neutral-400">All payments are safely processed through direct UPI transfers to property owners. We keep a record of your transactions for your security and stay tracking.</p>
        <button className="mt-6 flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-700 transition-all">
          Contact Support
        </button>
      </div>
    </div>
  );
}

function BookingCard({ booking, onPay, onCancel }: { booking: Booking & { property?: Property }; onPay: () => void; onCancel: () => void; key?: React.Key }) {
  const statusColors = {
    [BookingStatus.PENDING]: 'bg-amber-50 text-amber-600 border-amber-100',
    [BookingStatus.CONFIRMED]: 'bg-green-50 text-green-600 border-green-100',
    [BookingStatus.CANCELLED]: 'bg-red-50 text-red-600 border-red-100',
    [BookingStatus.COMPLETED]: 'bg-blue-50 text-blue-600 border-blue-100',
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch(status) {
      case BookingStatus.PENDING: return <Clock className="h-4 w-4" />;
      case BookingStatus.CONFIRMED: return <CheckCircle2 className="h-4 w-4" />;
      case BookingStatus.CANCELLED: return <XCircle className="h-4 w-4" />;
      case BookingStatus.COMPLETED: return <CheckCircle2 className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-neutral-100 bg-white p-6 transition-all hover:shadow-lg sm:flex-row sm:items-center">
      <div className="h-32 w-full flex-shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-24 border border-neutral-100 shadow-sm">
        <img 
          referrerPolicy="no-referrer"
          src={booking.property?.images?.[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=400'} 
          className="h-full w-full object-cover transition-transform hover:scale-110"
          alt="property"
        />
      </div>
      
      <div className="flex-grow space-y-1">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-bold uppercase tracking-wider", statusColors[booking.status])}>
            {getStatusIcon(booking.status)}
            {booking.status}
          </span>
          <span className="text-xs font-medium text-neutral-400">
            Ref: #{booking.id.slice(0, 8)}
          </span>
        </div>
        <h3 className="text-lg font-bold text-neutral-900">{booking.property?.title || 'Unknown Property'}</h3>
        <p className="text-sm text-neutral-500 font-medium">Booked on {new Date(booking.createdAt).toLocaleDateString()}</p>
        
        {booking.status === BookingStatus.CONFIRMED && (
          <div className="mt-2 rounded-xl bg-neutral-900 p-4 flex flex-col gap-1 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 -rotate-12 translate-x-4">
              <ShieldCheck className="h-16 w-16 text-white" />
            </div>
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Payment Gateway Ready</span>
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-white">Centralized Secure Payment</span>
              <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">Verified</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 border-t pt-4 sm:border-none sm:pt-0">
        <div className="text-xl font-extrabold text-neutral-900">₹{booking.amount.toLocaleString()}</div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          {booking.status === BookingStatus.CONFIRMED && (
            <button 
              onClick={onPay}
              className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-black italic uppercase tracking-tighter text-white shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95 transition-all text-center"
            >
              Continue to Pay
            </button>
          )}
          {(booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PENDING) && (
            <button 
              onClick={onCancel}
              className="rounded-xl border border-neutral-200 px-6 py-2 text-xs font-bold text-neutral-400 hover:text-red-600 hover:border-red-100 transition-all text-center"
            >
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
