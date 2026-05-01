import React, { useEffect, useState } from 'react';
import { Search, MapPin, Shield, Star, MessageSquare, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { CITIES } from '@/src/constants';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { UserRole, Property } from '@/src/types';
import PropertyCard from '@/src/components/PropertyCard';

export default function Home() {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [propsLoading, setPropsLoading] = useState(true);

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === UserRole.ADMIN) navigate('/admin');
      else if (profile.role === UserRole.OWNER) navigate('/owner');
      else if (profile.role === UserRole.TENANT) navigate('/tenant');
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const q = query(collection(db, 'properties'), limit(3));
        const snap = await getDocs(q);
        setFeaturedProperties(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)));
      } catch (err) {
        console.error("Error fetching featured properties:", err);
      } finally {
        setPropsLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (loading) return null;

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative flex min-h-[700px] flex-col lg:flex-row items-center justify-between gap-12 pt-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="z-10 max-w-2xl px-4 lg:text-left text-center"
        >
          <h1 className="text-5xl font-extrabold tracking-tight text-neutral-900 sm:text-7xl leading-[1.1]">
            Find Your Perfect <span className="text-orange-600">Home</span> Away From Home
          </h1>
          <p className="mt-6 text-xl text-neutral-600 max-w-xl lg:mx-0 mx-auto">
            India's most trusted platform for premium PGs and student housings. 
            Verified owners, secure bookings, and a hassle-free experience.
          </p>

          <div className="mt-10 mx-auto lg:mx-0 max-w-xl">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const city = formData.get('city');
                navigate(`/search?city=${city}`);
              }}
              className="flex flex-col gap-4 rounded-3xl bg-white p-2 shadow-2xl shadow-neutral-200 sm:flex-row border border-neutral-100"
            >
              <div className="flex flex-1 items-center gap-3 px-4 py-3 sm:py-0">
                <MapPin className="h-5 w-5 text-orange-600" />
                <select 
                  name="city"
                  className="w-full bg-transparent font-bold text-neutral-900 outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select City</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button 
                type="submit"
                className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-10 py-4 font-bold text-white transition-all hover:bg-orange-700 active:scale-95"
              >
                <Search className="h-5 w-5" />
                Search Rooms
              </button>
            </form>
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start justify-center">
            <button 
              onClick={() => navigate('/signup')}
              className="rounded-full bg-neutral-900 px-10 py-4 text-lg font-bold text-white transition-all hover:bg-neutral-800 hover:scale-105"
            >
              Get Started
            </button>
            <button 
              onClick={() => navigate('/signup?role=owner')}
              className="rounded-full border-2 border-neutral-900 px-8 py-4 text-lg font-bold text-neutral-900 transition-all hover:bg-neutral-900 hover:text-white"
            >
              List Your Property
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative lg:block hidden flex-1 h-[600px] w-full"
        >
          <div className="relative h-full w-full rounded-[4rem] overflow-hidden shadow-2xl shadow-orange-100 border-8 border-white">
            <img 
              src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=2000" 
              alt="Premium Room"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          
          {/* Floating detail boxes */}
          <div className="absolute -left-12 top-20 rounded-3xl bg-white p-6 shadow-xl shadow-neutral-200 border border-neutral-50 animate-bounce-slow">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">Verified Listing</p>
                <p className="text-xs text-neutral-500">100% Quality Checked</p>
              </div>
            </div>
          </div>

          <div className="absolute -right-8 bottom-20 rounded-3xl bg-white p-6 shadow-xl shadow-neutral-200 border border-neutral-50 animate-bounce-slow-reverse">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                <Star className="h-6 w-6 fill-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">4.9/5 Rating</p>
                <p className="text-xs text-neutral-500">From 1k+ Students</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-orange-100/50 blur-3xl" />
        <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-blue-50/50 blur-3xl" />
      </section>

      {/* Featured Properties */}
      {featuredProperties.length > 0 && (
        <section className="px-4">
          <div className="flex items-end justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-neutral-900">Featured Accommodations</h2>
              <p className="mt-4 text-neutral-500">Hand-picked premium listings in top educational hubs.</p>
            </div>
            <button 
              onClick={() => navigate('/search')}
              className="hidden sm:block text-sm font-bold text-orange-600 hover:text-orange-700"
            >
              View all properties →
            </button>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProperties.map((property) => (
              <PropertyCard 
                key={property.id} 
                property={property} 
                onClick={() => navigate(`/property/${property.id}`)} 
              />
            ))}
          </div>
          
          <button 
            onClick={() => navigate('/search')}
            className="mt-8 w-full sm:hidden rounded-xl bg-neutral-50 py-4 text-sm font-bold text-neutral-900"
          >
            View all properties →
          </button>
        </section>
      )}

      {/* Features Grid */}
      <section className="px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900">Why choose RoomZy?</h2>
          <p className="mt-4 text-neutral-500">We prioritize your comfort and safety above all else.</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Verified Listings',
              desc: 'Every property is hand-picked and verified for quality and safety.',
              icon: Shield,
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
            {
              title: 'Instant Messaging',
              desc: 'Chat directly with owners to get all your questions answered.',
              icon: MessageSquare,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              title: 'Secure Payments',
              desc: 'Hassle-free booking with transparent UPI-based direct payments.',
              icon: Star,
              color: 'text-orange-600',
              bg: 'bg-orange-50',
            },
            {
              title: 'Vibrant Locations',
              desc: 'Find accommodations in the most student-friendly hubs across India.',
              icon: MapPin,
              color: 'text-purple-600',
              bg: 'bg-purple-50',
            },
            {
              title: 'Real-time Updates',
              desc: 'Get notified instantly about booking approvals and messages.',
              icon: Clock,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
            {
              title: 'Community Driven',
              desc: 'Read genuine reviews from thousands of happy tenants.',
              icon: UserIcon,
              color: 'text-pink-600',
              bg: 'bg-pink-50',
            },
          ].map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-2xl border border-neutral-100 bg-white p-8 transition-shadow hover:shadow-lg"
            >
              <div className={cn("inline-flex rounded-xl p-3", feature.bg, feature.color)}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-neutral-900">{feature.title}</h3>
              <p className="mt-2 text-neutral-500">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="rounded-3xl bg-neutral-900 px-8 py-16 text-center text-white">
        <h2 className="text-3xl font-bold sm:text-4xl">Are you a property owner?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-neutral-400">
          Reach thousands of qualified tenants looking for high-quality PGs and rooms. 
          Manage your listings, track earnings, and communicate easily.
        </p>
        <button 
          onClick={() => navigate('/signup?role=owner')}
          className="mt-8 rounded-full bg-white px-10 py-4 font-bold text-neutral-900 transition-colors hover:bg-orange-50"
        >
          Start Listing for Free
        </button>
      </section>
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
