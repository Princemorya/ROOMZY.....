import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link as RouterLink } from 'react-router-dom';
import Navbar from './Navbar';
import { UserRole } from '@/src/types';
import { Mail, MapPin } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user?: {
    role: UserRole;
    displayName: string;
  } | null;
  isVerified?: boolean;
}

export default function Layout({ children, user, isVerified }: LayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 selection:bg-orange-100 selection:text-orange-900">
      <Navbar user={user} isVerified={isVerified} />
      <main className="mx-auto max-w-7xl">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="px-4 py-8 sm:px-6 lg:px-8"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <footer className="mt-20 border-t bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
            <div className="col-span-1 md:col-span-1">
              <h2 className="text-xl font-bold text-orange-600">RoomZy</h2>
              <p className="mt-4 text-sm text-gray-500">
                Finding your perfect home away from home. India's most trusted network of rooms and PGs.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">Quick Links</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-500">
                <li><RouterLink to="/about" className="hover:text-orange-600">About Us</RouterLink></li>
                <li><RouterLink to="/contact" className="hover:text-orange-600">Contact Us</RouterLink></li>
                <li><RouterLink to="/search" className="hover:text-orange-600">Search Rooms</RouterLink></li>
              </ul>
            </div>

            <div className="col-span-1 md:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">Contact Information</h3>
              <div className="mt-4 grid gap-4 text-sm text-gray-500 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-orange-600" />
                  <span>Roomzy@gmail.com</span>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  <span>Greater Noida, Uttar Pradesh, India</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} RoomZy Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function Link({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <RouterLink to={to} className="hover:text-orange-600 transition-colors">
      {children}
    </RouterLink>
  );
}
