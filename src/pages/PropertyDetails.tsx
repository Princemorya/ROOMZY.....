import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  MapPin, IndianRupee, Wifi, Coffee, Shield, CheckCircle2, 
  MessageSquare, Calendar as CalendarIcon, ChevronLeft, Star, User, Map as MapIcon,
  CreditCard, Smartphone, X, Loader2
} from 'lucide-react';
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { Property, BookingStatus, UserRole, Review } from '@/src/types';
import { cn } from '@/src/lib/utils';
import PropertyMap from '@/src/components/PropertyMap';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import { format, addDays, differenceInDays } from 'date-fns';

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [owner, setOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState<'idle' | 'summary' | 'payment' | 'success'>('idle');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [hasCompletedBooking, setHasCompletedBooking] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 30)
  });

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'debit' | 'credit'>('upi');
  const [upiId, setUpiId] = useState('testuser@upi');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '' });

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        const propSnap = await getDoc(doc(db, 'properties', id));
        if (propSnap.exists()) {
          const data = propSnap.data() as Property;
          setProperty({ id: propSnap.id, ...data });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        const reviewsRef = collection(db, 'properties', id, 'reviews');
        const q = query(reviewsRef, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const fetchedReviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        setReviews(fetchedReviews);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      }
    };

    const checkBooking = async () => {
      if (!id || !user) return;
      try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(
          bookingsRef, 
          where('propertyId', '==', id),
          where('tenantId', '==', user.uid),
          where('status', '==', BookingStatus.COMPLETED)
        );
        const snap = await getDocs(q);
        setHasCompletedBooking(!snap.empty);
      } catch (err) {
        console.error("Error checking booking:", err);
      }
    };

    fetchReviews();
    checkBooking();
  }, [id, user]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !profile) return;
    if (newReview.comment.length < 5) return alert("Please leave a detailed comment.");

    setIsSubmittingReview(true);
    try {
      const reviewData = {
        propertyId: id,
        tenantId: user.uid,
        tenantName: profile.displayName || 'Anonymous',
        tenantPhoto: profile.photoURL || '',
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: Date.now()
      };

      const docRef = await addDoc(collection(db, 'properties', id, 'reviews'), reviewData);
      const submittedReview = { id: docRef.id, ...reviewData };
      setReviews(prev => [submittedReview, ...prev]);
      setNewReview({ rating: 5, comment: '' });
      alert("Thank you for your review!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `properties/${id}/reviews`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleBookNow = async () => {
    if (!user) return navigate('/login');
    
    // Ensure we wait for profile to load or check if it exists
    if (!profile) {
      alert("Loading user profile... please try again in a moment.");
      return;
    }

    if (profile.role !== UserRole.TENANT) {
      alert("Only tenants can book rooms. Please log in with a tenant account.");
      return;
    }
    
    setBookingStep('summary');
  };

  const confirmBooking = async () => {
    if (!property) return;
    const nightsCount = dateRange?.from && dateRange?.to 
      ? Math.max(1, differenceInDays(dateRange.to, dateRange.from)) 
      : 30; // Default to 30 days if range is partially selected
    const dailyRate = property.price / 30;
    const totalAmount = Math.round(dailyRate * nightsCount);

    setBookingLoading(true);
    try {
      const transactionId = `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      await addDoc(collection(db, 'bookings'), {
        propertyId: id,
        tenantId: user!.uid,
        ownerId: property.ownerId,
        status: BookingStatus.COMPLETED,
        amount: totalAmount,
        startDate: dateRange?.from?.toISOString() || new Date().toISOString(),
        endDate: dateRange?.to?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: serverTimestamp(),
        paid: true,
        paymentDate: serverTimestamp(),
        paymentMethod: paymentMethod,
        transactionId
      });
      setBookingStep('success');
      alert("Your payment is successful!");
      setTimeout(() => {
        setBookingStep('idle');
        navigate('/tenant');
      }, 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'bookings');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleMessageOwner = async () => {
    if (!user) return navigate('/login');
    if (!property) return;
    if (user.uid === property.ownerId) {
      alert("You cannot chat with yourself.");
      return;
    }

    setChatLoading(true);
    try {
      // Find existing chat
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef, 
        where('participants', 'array-contains', user.uid)
      );
      const snap = await getDocs(q);
      let existingChat = snap.docs.find(d => {
        const data = d.data();
        return data.participants.includes(property.ownerId);
      });

      let chatId = existingChat?.id;

      if (!existingChat) {
        // Create new chat
        const newChat = {
          participants: [user.uid, property.ownerId],
          updatedAt: Date.now(),
          lastMessage: '',
          typing: {
            [user.uid]: false,
            [property.ownerId]: false
          }
        };
        const docRef = await addDoc(collection(db, 'chats'), newChat);
        chatId = docRef.id;
      }

      navigate(`/messages?chatId=${chatId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to initialize chat.");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-6 h-4 w-32 rounded bg-neutral-200" />
        
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Image Skeleton */}
            <div className="grid grid-cols-2 gap-4 lg:h-[400px]">
              <div className="h-full w-full rounded-3xl bg-neutral-200 col-span-2 lg:col-span-1" />
              <div className="hidden grid-rows-2 gap-4 lg:grid">
                <div className="h-full w-full rounded-3xl bg-neutral-100" />
                <div className="h-full w-full rounded-3xl bg-neutral-100" />
              </div>
            </div>

            {/* Info Skeleton */}
            <div className="space-y-4">
              <div className="h-4 w-24 rounded bg-orange-100" />
              <div className="h-10 w-3/4 rounded bg-neutral-200" />
              <div className="flex gap-4">
                <div className="h-4 w-48 rounded bg-neutral-100" />
                <div className="h-4 w-32 rounded bg-neutral-100" />
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-8 space-y-4">
              <div className="h-6 w-40 rounded bg-neutral-200" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-neutral-100" />
                <div className="h-4 w-full rounded bg-neutral-100" />
                <div className="h-4 w-2/3 rounded bg-neutral-100" />
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-8 space-y-6">
              <div className="h-6 w-32 rounded bg-neutral-200" />
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-neutral-100" />
                    <div className="h-4 w-24 rounded bg-neutral-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-3xl border border-neutral-100 bg-white p-8 space-y-6">
              <div className="h-8 w-32 rounded bg-neutral-200" />
              <div className="h-16 w-full rounded-xl bg-neutral-50" />
              <div className="h-14 w-full rounded-2xl bg-neutral-200" />
              <div className="h-14 w-full rounded-2xl bg-neutral-100" />
              <div className="pt-8 border-t border-neutral-50 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-neutral-200" />
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-neutral-200" />
                  <div className="h-3 w-24 rounded bg-neutral-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="rounded-full bg-neutral-100 p-8">
          <MapPin className="h-12 w-12 text-neutral-400" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900">Property Not Found</h2>
          <p className="mt-2 text-neutral-500">The listing you're looking for might have been removed or is unavailable.</p>
        </div>
        <button 
          onClick={() => navigate('/search')}
          className="rounded-2xl bg-neutral-900 px-8 py-4 font-bold text-white transition-all hover:bg-neutral-800"
        >
          View All Listings
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-6xl pb-20"
    >
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to search
      </button>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Left Column: Images & Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-2 gap-4 lg:h-[400px]">
            <img 
              referrerPolicy="no-referrer"
              src={property.images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=1200'} 
              className={cn("h-full w-full rounded-3xl object-cover shadow-sm", property.images.length > 1 ? "col-span-2 lg:col-span-1" : "col-span-2")}
              alt="main"
            />
            {property.images.length > 1 && (
              <div className="hidden grid-rows-2 gap-4 lg:grid">
                <img referrerPolicy="no-referrer" src={property.images[1] || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=600'} className="h-full w-full rounded-3xl object-cover shadow-sm" alt="alt1" />
                <img referrerPolicy="no-referrer" src={property.images[2] || property.images[0]} className="h-full w-full rounded-3xl object-cover shadow-sm" alt="alt2" />
              </div>
            )}
            {property.images.length > 3 && (
              <div className="col-span-2 grid grid-cols-4 gap-4 mt-4">
                {property.images.slice(3).map((img, idx) => (
                  <img key={idx} referrerPolicy="no-referrer" src={img} className="h-24 w-full rounded-xl object-cover cursor-pointer hover:opacity-80 transition-all shadow-sm border border-neutral-100" alt={`thumb-${idx}`} />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-orange-600">
              <Star className="h-4 w-4 fill-orange-600" />
              {property.rating || 'New'} Listing
            </div>
            <h1 className="mt-2 text-4xl font-extrabold text-neutral-900">{property.title}</h1>
            <div className="mt-4 flex items-center gap-4 text-neutral-500">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {property.address}
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-8">
            <h2 className="text-xl font-bold text-neutral-900">About this place</h2>
            <p className="mt-4 leading-relaxed text-neutral-600">{property.description}</p>
          </div>

          <div className="border-t border-neutral-100 pt-8">
            <h2 className="text-xl font-bold text-neutral-900">Amenities</h2>
            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
              {property.amenities.map(amenity => (
                <div key={amenity} className="flex items-center gap-3 text-neutral-600">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-8">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-orange-600" />
              Location
            </h2>
            <div className="mt-6 h-80 w-full overflow-hidden rounded-3xl border border-neutral-100">
              <PropertyMap 
                properties={[property]} 
                center={property.location.lat && property.location.lng ? [property.location.lat, property.location.lng] : undefined}
                zoom={15}
              />
            </div>
            <p className="mt-4 text-sm text-neutral-500 italic flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Approximate location in {property.location.area}, {property.location.city}
            </p>
          </div>

          <div className="border-t border-neutral-100 pt-8 space-y-8">
            <h2 className="text-xl font-bold text-neutral-900">Reviews & Ratings</h2>
            
            {hasCompletedBooking && (
              <form onSubmit={handleSubmitReview} className="rounded-2xl border border-orange-100 bg-orange-50/30 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-neutral-900">Share your experience</h3>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                        className="transition-transform hover:scale-110"
                      >
                        <Star 
                          className={cn(
                            "h-6 w-6 transition-all",
                            star <= newReview.rating ? "fill-orange-500 text-orange-500" : "text-neutral-300"
                          )} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  required
                  placeholder="What did you like about this place? (Min 5 characters)"
                  className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-sm focus:border-orange-500 focus:outline-none transition-all min-h-[100px]"
                  value={newReview.comment}
                  onChange={e => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                />
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-bold text-white transition-all hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isSubmittingReview ? "Submitting..." : "Post Review"}
                </button>
              </form>
            )}

            <div className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review.id} className="space-y-3 pb-6 border-b border-neutral-50 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 overflow-hidden">
                          {review.tenantPhoto ? (
                            <img src={review.tenantPhoto} className="h-full w-full object-cover" alt="tenant" />
                          ) : (
                            <User className="h-5 w-5 text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900">{review.tenantName}</p>
                          <p className="text-xs text-neutral-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={cn(
                              "h-3 w-3",
                              s <= review.rating ? "fill-orange-500 text-orange-500" : "text-neutral-200"
                            )} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed italic">"{review.comment}"</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-neutral-50 rounded-3xl border border-dashed border-neutral-200">
                  <Star className="h-10 w-10 text-neutral-200 mx-auto mb-3" />
                  <p className="text-sm text-neutral-400">No reviews yet. Be the first to stay and share your experience!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Booking Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-3xl border border-neutral-100 bg-white p-8 shadow-2xl shadow-neutral-100">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-neutral-900">₹{Math.round(property.price / 30).toLocaleString()}</span>
              <span className="text-neutral-500">/ day</span>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-orange-600" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Stay Duration</span>
                    <span className="text-sm font-bold text-neutral-700">
                      {dateRange?.from && dateRange?.to ? (
                        `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                      ) : (
                        property.isAvailable ? 'Immediate Possession' : 'Occupied'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleBookNow}
              disabled={bookingLoading || !property.isAvailable}
              className="mt-8 w-full rounded-2xl bg-orange-600 py-4 font-bold text-white transition-all hover:bg-orange-700 disabled:opacity-50"
            >
              {bookingLoading ? 'Processing...' : 'Reserve Now'}
            </button>

            <button 
              onClick={handleMessageOwner}
              disabled={chatLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-neutral-900 py-4 font-bold text-neutral-900 transition-all hover:bg-neutral-900 hover:text-white disabled:opacity-50"
            >
              {chatLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
              {chatLoading ? 'Initializing...' : 'Chat with Owner'}
            </button>

            <p className="mt-6 text-center text-xs text-neutral-400">
              Payments are secured via our integrated simulated gateway.
            </p>

            {/* Owner Info */}
            <div className="mt-8 border-t border-neutral-100 pt-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600 font-bold overflow-hidden">
                  {property.ownerPhoto ? (
                    <img referrerPolicy="no-referrer" src={property.ownerPhoto} className="h-full w-full object-cover" alt="owner" />
                  ) : (
                    (property.ownerName?.[0] || 'O')
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900">{property.ownerName || 'Property Owner'}</h3>
                  <p className="text-xs text-neutral-500">Host Member</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Flow Modal */}
      {bookingStep !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            {bookingStep === 'summary' && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-neutral-900 italic tracking-tighter">Reservation Summary</h3>
                  <button onClick={() => setBookingStep('idle')} className="rounded-full p-2 hover:bg-neutral-100">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mt-6 space-y-6">
                  {/* Calendar Integration */}
                  <div className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4">
                    <div className="flex items-center gap-2 mb-3 text-sm font-bold text-neutral-900">
                      <CalendarIcon className="h-4 w-4 text-orange-600" />
                      Select Booking Dates
                    </div>
                    <div className="flex justify-center bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden calendar-container scale-90 origin-top">
                      <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        disabled={{ before: new Date() }}
                        footer={
                          <div className="p-3 border-t border-neutral-50 text-[10px] text-neutral-500 font-bold uppercase tracking-wider text-center">
                            {dateRange?.from ? (
                              dateRange.to ? (
                                `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`
                              ) : (
                                `Check-in: ${format(dateRange.from, 'PP')}`
                              )
                            ) : (
                              "Please select a range"
                            )}
                          </div>
                        }
                      />
                    </div>
                    {dateRange?.from && dateRange?.to && (
                      <div className="mt-2 text-center text-xs font-bold text-orange-600">
                        {differenceInDays(dateRange.to, dateRange.from)} Nights Stay
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <img 
                      referrerPolicy="no-referrer"
                      src={property.images[0]} 
                      className="h-20 w-20 rounded-2xl object-cover border border-neutral-100 shadow-sm" 
                      alt="thumb" 
                    />
                    <div className="py-1">
                      <h4 className="font-bold text-neutral-900 line-clamp-1">{property.title}</h4>
                      <p className="text-[10px] uppercase font-black tracking-widest text-orange-600 mt-1">{property.type}</p>
                      <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {property.location.city}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-100/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500 font-medium items-center flex gap-1">
                        Daily Rate 
                        <span className="text-[10px] text-neutral-400 font-normal">(Monthly ₹{property.price.toLocaleString()} / 30)</span>
                      </span>
                      <span className="font-bold text-neutral-900">₹{Math.round(property.price / 30).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500 font-medium">Nights count</span>
                      <span className="font-bold text-neutral-900">
                        {dateRange?.from && dateRange?.to ? differenceInDays(dateRange.to, dateRange.from) : '0'} Nights
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500 font-medium">Platform Fee</span>
                      <span className="font-bold text-neutral-900">₹0</span>
                    </div>
                    <div className="border-t border-neutral-200/50 pt-3 flex justify-between items-center">
                      <span className="font-black text-neutral-900 italic tracking-tight uppercase text-xs">Total Amount</span>
                      <span className="text-2xl font-black text-orange-600 italic tracking-tighter">
                        ₹{Math.round((property.price / 30) * (dateRange?.from && dateRange?.to ? Math.max(1, differenceInDays(dateRange.to, dateRange.from)) : 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    onClick={() => setBookingStep('payment')}
                    disabled={!dateRange?.from || !dateRange?.to}
                    className="w-full rounded-2xl bg-orange-600 py-4 font-black italic uppercase tracking-tighter text-white hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 active:scale-95 disabled:opacity-50"
                  >
                    Confirm & Proceed to Pay
                  </button>
                </div>
              </>
            )}

            {bookingStep === 'payment' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setBookingStep('summary')}
                      className="rounded-full p-2 hover:bg-neutral-100 text-neutral-400 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h3 className="text-xl font-black text-neutral-900 italic tracking-tighter uppercase text-center w-full">Select Payment Method</h3>
                  </div>
                </div>
                
                <div className="mt-8 space-y-6">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => setPaymentMethod('upi')}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                          paymentMethod === 'upi' ? "border-orange-600 bg-orange-50/50" : "border-neutral-100 hover:border-neutral-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Smartphone className={cn("h-5 w-5", paymentMethod === 'upi' ? "text-orange-600" : "text-neutral-400")} />
                          <span className="font-bold text-neutral-900 text-sm">UPI ID</span>
                        </div>
                        {paymentMethod === 'upi' && <CheckCircle2 className="h-4 w-4 text-orange-600" />}
                      </button>

                      <button 
                        onClick={() => setPaymentMethod('debit')}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                          paymentMethod === 'debit' ? "border-orange-600 bg-orange-50/50" : "border-neutral-100 hover:border-neutral-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className={cn("h-5 w-5", paymentMethod === 'debit' ? "text-orange-600" : "text-neutral-400")} />
                          <span className="font-bold text-neutral-900 text-sm">Debit Card</span>
                        </div>
                        {paymentMethod === 'debit' && <CheckCircle2 className="h-4 w-4 text-orange-600" />}
                      </button>

                      <button 
                        onClick={() => setPaymentMethod('credit')}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                          paymentMethod === 'credit' ? "border-orange-600 bg-orange-50/50" : "border-neutral-100 hover:border-neutral-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className={cn("h-5 w-5", paymentMethod === 'credit' ? "text-orange-600" : "text-neutral-400")} />
                          <span className="font-bold text-neutral-900 text-sm">Credit Card</span>
                        </div>
                        {paymentMethod === 'credit' && <CheckCircle2 className="h-4 w-4 text-orange-600" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    {paymentMethod === 'upi' ? (
                      <div className="relative group">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">UPI Identity</p>
                        <input 
                          type="text" 
                          placeholder="testuser@upi" 
                          className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50 p-4 text-sm font-medium focus:border-orange-600 focus:outline-none transition-all"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Card details</p>
                        <input 
                          type="text" 
                          placeholder="Card Number" 
                          className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50 p-4 text-sm font-medium focus:border-orange-600 focus:outline-none transition-all"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input 
                            type="text" 
                            placeholder="MM/YY" 
                            className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50 p-4 text-sm font-medium focus:border-orange-600 focus:outline-none transition-all"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                          />
                          <input 
                            type="password" 
                            placeholder="CVV" 
                            className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50 p-4 text-sm font-medium focus:border-orange-600 focus:outline-none transition-all"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={confirmBooking}
                    disabled={bookingLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 font-black italic uppercase tracking-tighter text-white hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 disabled:opacity-50 active:scale-95"
                  >
                    {bookingLoading ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                    ) : (
                      `Pay ₹${Math.round((property.price / 30) * (dateRange?.from && dateRange?.to ? Math.max(1, differenceInDays(dateRange.to, dateRange.from)) : 0)).toLocaleString()}`
                    )}
                  </button>
                </div>
              </>
            )}

            {bookingStep === 'success' && (
              <div className="text-center py-10 space-y-6">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-green-600 shadow-sm border border-green-100"
                >
                  <CheckCircle2 className="h-12 w-12" />
                </motion.div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-neutral-900 italic tracking-tighter">Your payment is successful!</h3>
                  <p className="text-neutral-500 font-medium px-4">Your property index has been secured. Redirecting you to your bookings dashboard...</p>
                </div>
                <div className="pt-6 flex items-center justify-center gap-2 text-[10px] text-neutral-300 font-black uppercase tracking-[0.2em]">
                  <Loader2 className="h-3 w-3 animate-spin text-green-500" />
                  Generating Entry Pass
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
