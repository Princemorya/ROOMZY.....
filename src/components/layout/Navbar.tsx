import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Search, MessageSquare, User, Menu, X, LogOut, ShieldCheck } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { UserRole } from '@/src/types';

interface NavbarProps {
  user?: {
    role: UserRole;
    displayName: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { title: 'Find Rooms', href: '/search', icon: Search, roles: [UserRole.TENANT, UserRole.ADMIN] },
    { title: 'About', href: '/about', icon: Home, roles: [UserRole.TENANT, UserRole.OWNER, UserRole.ADMIN] },
    { title: 'Contact', href: '/contact', icon: MessageSquare, roles: [UserRole.TENANT, UserRole.OWNER, UserRole.ADMIN] },
    { title: 'My Bookings', href: '/tenant/bookings', icon: Home, roles: [UserRole.TENANT] },
    { title: 'My Listings', href: '/owner/listings', icon: Home, roles: [UserRole.OWNER] },
    { title: 'Messages', href: '/messages', icon: MessageSquare, roles: [UserRole.TENANT, UserRole.OWNER] },
    { title: 'Admin Panel', href: '/admin', icon: ShieldCheck, roles: [UserRole.ADMIN] },
  ];

  const filteredLinks = navLinks.filter(link => 
    !user || link.roles.includes(user.role)
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-orange-600">
              <Home className="h-8 w-8" />
              <span>RoomZy</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:block">
            <div className="flex items-center gap-6">
              {filteredLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-orange-600"
                >
                  <link.icon className="h-4 w-4" />
                  {link.title}
                </Link>
              ))}
              {user ? (
                <div className="flex items-center gap-4 border-l pl-6 text-gray-600">
                  <Link to="/profile" className="flex items-center gap-2 text-sm font-medium hover:text-orange-600">
                    <User className="h-4 w-4" />
                    {user.displayName}
                  </Link>
                  <button 
                    onClick={() => navigate('/logout')}
                    className="text-sm font-medium text-red-500 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 pl-6">
                  <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-orange-600">
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="rounded-full bg-orange-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {isMenuOpen && (
        <div className="border-t bg-white md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-orange-600"
                onClick={() => setIsMenuOpen(false)}
              >
                <link.icon className="h-5 w-5" />
                {link.title}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-orange-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
                <button
                  onClick={() => navigate('/logout')}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-base font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-2">
                <Link
                  to="/login"
                  className="flex items-center justify-center rounded-md border py-2 text-sm font-medium text-gray-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center justify-center rounded-md bg-orange-600 py-2 text-sm font-medium text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
