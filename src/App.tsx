import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import SearchResults from './pages/SearchResults';
import PropertyDetails from './pages/PropertyDetails';
import About from './pages/About';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import TenantDashboard from './pages/TenantDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRole } from './types';

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
      </div>
    );
  }

  const isUnverified = user && !user.emailVerified;

  return (
    <Layout 
      user={profile ? { role: profile.role, displayName: profile.displayName } : null}
      isVerified={user?.emailVerified}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/login" element={profile ? (
          isUnverified ? <Navigate to="/verify-email" /> :
          profile.role === UserRole.ADMIN ? <Navigate to="/admin" /> : 
          profile.role === UserRole.OWNER ? <Navigate to="/owner" /> : 
          <Navigate to="/tenant" />
        ) : <Auth />} />
        <Route path="/signup" element={profile ? (
          isUnverified ? <Navigate to="/verify-email" /> :
          profile.role === UserRole.ADMIN ? <Navigate to="/admin" /> : 
          profile.role === UserRole.OWNER ? <Navigate to="/owner" /> : 
          <Navigate to="/tenant" />
        ) : <Auth />} />
        
        <Route path="/search" element={<SearchResults />} />
        <Route path="/property/:id" element={<PropertyDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Routes */}
        <Route path="/profile" element={user ? (isUnverified ? <Navigate to="/verify-email" /> : <Profile />) : <Navigate to="/login" />} />
        <Route path="/messages" element={user ? (isUnverified ? <Navigate to="/verify-email" /> : <Messages />) : <Navigate to="/login" />} />
        
        {/* Dashboards (Role Protected) */}
        <Route 
          path="/tenant/*" 
          element={
            profile?.role === UserRole.TENANT 
              ? (isUnverified ? <Navigate to="/verify-email" /> : <TenantDashboard />)
              : <Navigate to={profile?.role === UserRole.OWNER ? "/owner" : "/"} />
          } 
        />
        <Route 
          path="/owner/*" 
          element={
            profile?.role === UserRole.OWNER 
              ? (isUnverified ? <Navigate to="/verify-email" /> : <OwnerDashboard />)
              : <Navigate to={profile?.role === UserRole.TENANT ? "/tenant" : "/"} />
          } 
        />
        <Route 
          path="/admin/*" 
          element={
            profile?.role === UserRole.ADMIN 
              ? (isUnverified ? <Navigate to="/verify-email" /> : <AdminDashboard />)
              : <Navigate to="/" />
          } 
        />
        
        <Route path="/logout" element={<LogoutAction />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function LogoutAction() {
  const { signOut } = useAuth();
  React.useEffect(() => {
    signOut().then(() => window.location.href = '/');
  }, [signOut]);
  return null;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
