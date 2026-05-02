import React, { useEffect, useState } from 'react';
import { Search, MapPin, Shield, Star, MessageSquare, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { CITIES } from '@/src/constants';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { UserRole, Property } from '@/src/types';
import PropertyCard from '@/src/components/PropertyCard';
import ChatBot from '@/src/components/ChatBot';

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

      {/* Features Section - Visual Storytelling */}
      <section className="space-y-32 py-32 px-4 overflow-hidden">
        <div className="mx-auto max-w-7xl text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-black tracking-tight text-neutral-900 sm:text-7xl uppercase leading-none">
              A better way <br/> <span className="text-orange-500">to live.</span>
            </h2>
            <div className="mt-8 mx-auto h-1 w-24 bg-orange-500" />
          </motion.div>
        </div>

        {/* Feature 1: Verified */}
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16 lg:gap-24">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative aspect-square sm:aspect-video lg:aspect-square overflow-hidden rounded-[3rem] shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200"
                className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
                alt="Beautifully designed room"
              />
              <div className="absolute top-8 left-8 rounded-2xl bg-white/90 backdrop-blur-md px-6 py-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/20">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Status</p>
                    <p className="text-sm font-black text-neutral-900">Physically Verified</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-black uppercase tracking-widest text-orange-600">The Quality Standard</span>
              <h3 className="mt-4 text-4xl font-black uppercase italic leading-none lg:text-6xl text-neutral-900">
                Rooms you can <br/> <span className="text-orange-500">Trust</span>.
              </h3>
              <p className="mt-8 text-xl text-neutral-500 font-medium leading-relaxed">
                We've personally visited and verified every single property on RoomZy. 
                From the water pressure to the Wi-Fi speed, we check 42 key points 
                so you don't have to face any surprises on move-in day.
              </p>
              <ul className="mt-8 space-y-4">
                {['Verified Owner Profiles', 'Physical Site Inspections', 'Authentic Unedited Photos'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-neutral-900 font-bold">
                    <CheckCircle className="h-5 w-5 text-orange-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Feature 2: Connect - Reversed */}
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16 lg:gap-24">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:order-2 relative aspect-square sm:aspect-video lg:aspect-square overflow-hidden rounded-[3rem] shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=1200"
                className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
                alt="People interacting happily"
              />
              <div className="absolute bottom-8 right-8 rounded-2xl bg-neutral-900/90 backdrop-blur-md px-6 py-4 shadow-xl text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg shadow-orange-600/20">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Response</p>
                    <p className="text-sm font-black italic">Avg. 15 mins</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:order-1"
            >
              <span className="text-xs font-black uppercase tracking-widest text-orange-600">Pure Connection</span>
              <h3 className="mt-4 text-4xl font-black uppercase italic leading-none lg:text-6xl text-neutral-900">
                Direct to <br/> <span className="text-orange-500">Owners</span>.
              </h3>
              <p className="mt-8 text-xl text-neutral-500 font-medium leading-relaxed">
                Connect with property owners directly through our secure 
                messaging system. No agents, no brokers, and absolutely no 
                hidden fees. Negotiate, ask questions, and book instantly.
              </p>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="mt-10 group relative flex items-center gap-4 text-neutral-900 font-black uppercase tracking-tighter text-xl overflow-hidden"
              >
                Start Browsing
                <div className="h-px flex-1 bg-neutral-200 transition-all group-hover:bg-orange-500" />
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Feature 3: Secure */}
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16 lg:gap-24">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative aspect-square sm:aspect-video lg:aspect-square overflow-hidden rounded-[3rem] shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=1200"
                className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
                alt="Secure payment illustration"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-black uppercase tracking-widest text-orange-600">Ironclad Security</span>
              <h3 className="mt-4 text-4xl font-black uppercase italic leading-none lg:text-6xl text-neutral-900">
                Protected <br/> <span className="text-orange-500">Payments</span>.
              </h3>
              <p className="mt-8 text-xl text-neutral-500 font-medium leading-relaxed">
                Your money is safe with our secure escrow system. 
                Pay via any UPI app or bank transfer. Your payment is released 
                to the owner only after you've successfully moved in and 
                verified the room yourself.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                {['Bank Level Security', '100% Refund Policy', 'Direct Settlement'].map(badge => (
                  <span key={badge} className="rounded-full bg-neutral-100 px-6 py-2 text-xs font-black uppercase tracking-widest text-neutral-500">
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden rounded-[3rem] bg-neutral-900 px-8 py-24 text-center text-white">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000"
            className="h-full w-full object-cover opacity-40 brightness-75 transition-transform duration-1000 hover:scale-110"
            alt="Modern premium building"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/40 to-neutral-900" />
          <div className="absolute inset-0 bg-neutral-900/20" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-black italic tracking-tighter sm:text-6xl uppercase leading-none">
              Are you a <span className="text-orange-500">property owner</span>?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-300 font-medium leading-relaxed">
              Join India's fastest growing premium rental network. 
              Reach thousands of qualified tenants looking for high-quality rooms and smart management.
            </p>
            <div className="mt-12 flex flex-wrap justify-center gap-6">
              <button 
                onClick={() => navigate('/signup?role=owner')}
                className="group relative overflow-hidden rounded-full bg-white px-12 py-5 font-black uppercase text-neutral-900 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/5"
              >
                <span className="relative z-10">Start Listing for Free</span>
                <div className="absolute inset-0 -translate-x-full bg-orange-50 transition-transform group-hover:translate-x-0" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
      <ChatBot />
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
