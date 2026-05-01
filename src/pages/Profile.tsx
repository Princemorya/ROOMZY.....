import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Wallet, Shield, MapPin, Camera, Lock, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { UserRole } from '@/src/types';
import { cn } from '@/src/lib/utils';

export default function Profile() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    upiId: '',
    bio: ''
  });

  const isGoogleUser = user?.providerData.some(p => p.providerId === 'google.com');

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        phone: profile.phone || '',
        upiId: profile.upiId || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: Date.now()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    setResetSent(false);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetSent(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploading(true);
    setError(null);
    try {
      const fileRef = ref(storage, `profiles/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
      await updateProfile(user, { photoURL: url });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-20">
      <div className="flex items-center gap-6">
        <div className="relative group">
          <div className="h-24 w-24 rounded-3xl bg-orange-100 flex items-center justify-center text-3xl font-bold text-orange-600 shadow-xl shadow-orange-100 overflow-hidden">
            {profile?.photoURL ? (
              <img referrerPolicy="no-referrer" src={profile.photoURL} className="h-full w-full object-cover" alt="avatar" />
            ) : (
              profile?.displayName?.[0] || 'U'
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl border border-neutral-100 shadow-sm text-neutral-500 hover:text-orange-600 cursor-pointer transition-all hover:scale-110">
            {uploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </label>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900">{profile?.displayName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="rounded-full bg-neutral-100 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-neutral-500">
              {profile?.role}
            </span>
            <span className="text-sm text-neutral-400 font-medium">Joined {new Date(profile?.createdAt || 0).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 text-lg font-bold text-neutral-900 border-b border-neutral-50 pb-4">
            <User className="h-5 w-5 text-orange-600" />
            Basic Information
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input 
                  value={formData.displayName}
                  onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full rounded-2xl border border-neutral-200 py-4 pl-12 pr-4 focus:border-orange-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Email (read only)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input 
                  disabled
                  value={profile?.email}
                  className="w-full rounded-2xl border border-neutral-100 py-4 pl-12 pr-4 bg-neutral-50 text-neutral-400"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-2xl border border-neutral-200 py-4 pl-12 pr-4 focus:border-orange-500 outline-none transition-all"
                  placeholder="+91"
                />
              </div>
            </div>
            {profile?.role === UserRole.OWNER && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-900 uppercase tracking-wide">UPI ID (for payments)</label>
                <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input 
                    value={formData.upiId}
                    onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                    className="w-full rounded-2xl border border-neutral-200 py-4 pl-12 pr-4 focus:border-orange-500 outline-none transition-all"
                    placeholder="yourname@upi"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Bio</label>
            <textarea 
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              className="w-full rounded-2xl border border-neutral-200 p-4 focus:border-orange-500 outline-none transition-all h-32"
              placeholder="Tell us a bit about yourself..."
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="rounded-2xl bg-orange-600 px-8 py-4 font-bold text-white hover:bg-orange-700 disabled:opacity-50 transition-all shadow-lg shadow-orange-100"
            >
              {loading ? 'Saving Changes...' : 'Save Profile'}
            </button>
            {success && (
              <span className="flex items-center gap-2 text-sm font-bold text-green-600">
                <CheckCircle className="h-4 w-4" />
                Profile updated successfully!
              </span>
            )}
          </div>
        </form>

        {/* Security Section */}
        <div className="rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 text-lg font-bold text-neutral-900 border-b border-neutral-50 pb-4">
            <Shield className="h-5 w-5 text-orange-600" />
            Security & Account
          </div>

          <div className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  isGoogleUser ? "bg-white text-neutral-900" : "bg-orange-600 text-white"
                )}>
                  {isGoogleUser ? (
                    <img src="https://www.google.com/favicon.ico" className="h-5 w-5" alt="Google" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900">
                    {isGoogleUser ? 'Google Account' : 'Email & Password'}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {isGoogleUser 
                      ? 'Your security is managed by Google.' 
                      : 'You manage your own account password.'}
                  </p>
                </div>
              </div>

              {!isGoogleUser && (
                <button 
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-900 hover:bg-neutral-50 transition-all disabled:opacity-50"
                >
                  {resetLoading ? 'Sending...' : 'Reset Password'}
                </button>
              )}
            </div>

            {isGoogleUser && (
              <div className="flex gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-800 italic">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm leading-relaxed">
                  Note: Since you signed in with Google, you cannot reset your password here. To change your Google password, 
                  please visit your <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="font-bold underline inline-flex items-center gap-1">Google Security Settings <ExternalLink className="h-3 w-3" /></a>.
                </p>
              </div>
            )}

            {resetSent && (
              <div className="flex gap-3 p-4 rounded-2xl bg-green-50 border border-green-100 text-green-800">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-bold">Reset Email Sent!</p>
                  <p className="text-sm">Please check your inbox (and spam folder) for further instructions.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-800">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
