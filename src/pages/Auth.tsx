import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Home, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { UserRole, UserProfile } from '@/src/types';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUp = location.pathname === '/signup';
  const [role, setRole] = useState<UserRole>((searchParams.get('role') as UserRole) || UserRole.TENANT);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const syncUserProfile = async (user: any, name: string, userRole: UserRole) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        role: userRole,
        displayName: name || user.displayName || 'User',
        photoURL: user.photoURL || '',
        createdAt: Date.now(),
      };
      try {
        await setDoc(userRef, profile);
        
        // Bootstrap admin marker if matches email or role is admin
        if (profile.email === 'pmconsultancy2024@gmail.com' || userRole === UserRole.ADMIN) {
          try {
            const adminRef = doc(db, 'admins', user.uid);
            await setDoc(adminRef, { role: 'admin' });
          } catch (adminErr) {
            console.error("Optional admin marker creation failed:", adminErr);
            // Non-blocking for the main signup flow
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    } else if (userRole === UserRole.ADMIN || user.email === 'pmconsultancy2024@gmail.com') {
       // Ensure marker document exists for admins even if profile exists
       const adminRef = doc(db, 'admins', user.uid);
       const adminSnap = await getDoc(adminRef);
       if (!adminSnap.exists()) {
         await setDoc(adminRef, { role: 'admin' });
       }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.displayName });
        await syncUserProfile(userCredential.user, formData.displayName, role);
        navigate(role === UserRole.ADMIN ? '/admin' : role === UserRole.OWNER ? '/owner' : '/tenant');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        // Fetch profile to know where to navigate
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          const userProfile = userDoc.data() as UserProfile;
          navigate(userProfile.role === UserRole.ADMIN ? '/admin' : userProfile.role === UserRole.OWNER ? '/owner' : '/tenant');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled in the Firebase Console. Please go to Authentication > Sign-in method and enable it.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error: This usually happens when third-party cookies or cross-site tracking are blocked. Please try: \n1. Using a non-incognito window\n2. Selecting "Allow all cookies" in browser settings\n3. Checking your internet connection.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(result.user, result.user.displayName || 'User', role);
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists()) {
        const userProfile = userDoc.data() as UserProfile;
        navigate(userProfile.role === UserRole.ADMIN ? '/admin' : userProfile.role === UserRole.OWNER ? '/owner' : '/tenant');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled in the Firebase Console. Please go to Authentication > Sign-in method and enable Google.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Google login network error: This almost always means third-party cookies are blocked or you are in private/incognito mode. Please try using a standard browser window.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8 rounded-3xl border border-neutral-100 bg-white p-8 shadow-2xl shadow-neutral-200"
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <Home className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            {isSignUp ? 'Join thousands of users on RoomZy' : 'Sign in to manage your bookings'}
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-2 rounded-xl bg-neutral-100 p-1">
          {[UserRole.TENANT, UserRole.OWNER, UserRole.ADMIN].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              type="button"
              className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                role === r ? 'bg-white text-orange-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
              <input
                name="displayName"
                type="text"
                placeholder="Full Name"
                required
                value={formData.displayName}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-4 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
            <input
              name="email"
              type="email"
              placeholder="Email address"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-4 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-4 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {!isSignUp && (
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-neutral-500 hover:text-orange-600 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-4 font-bold text-white transition-all hover:bg-orange-700 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                {isSignUp ? 'Get Started' : 'Sign In'}
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-neutral-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link
              to={isSignUp ? '/login' : '/signup'}
              className="font-bold text-orange-600 hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </Link>
          </p>
        </div>

        <div className="mt-6 border-t pt-6">
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 py-3 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </motion.div>
    </div>
  );
}
