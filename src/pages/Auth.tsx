import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Home, ArrowRight, Shield, CheckCircle2, Sparkles, Smartphone, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  updateProfile,
  ConfirmationResult
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, RecaptchaVerifier, signInWithPhoneNumber } from '@/src/lib/firebase';
import { UserRole, UserProfile } from '@/src/types';
import { cn } from '@/src/lib/utils';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUp = location.pathname === '/signup';
  const [role, setRole] = useState<UserRole>((searchParams.get('role') as UserRole) || UserRole.TENANT);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    phoneNumber: '',
    otp: ''
  });

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    return () => {
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const syncUserProfile = async (user: any, name: string, userRole: UserRole) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        role: userRole,
        displayName: name || user.displayName || 'User',
        photoURL: user.photoURL || '',
        createdAt: Date.now(),
      };
      try {
        await setDoc(userRef, profile);
        
        if (profile.email === 'pmconsultancy2024@gmail.com' || userRole === UserRole.ADMIN) {
          try {
            const adminRef = doc(db, 'admins', user.uid);
            await setDoc(adminRef, { role: 'admin' });
          } catch (adminErr) {
            console.error("Optional admin marker creation failed:", adminErr);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    } else if (userRole === UserRole.ADMIN || user.email === 'pmconsultancy2024@gmail.com') {
       const adminRef = doc(db, 'admins', user.uid);
       const adminSnap = await getDoc(adminRef);
       if (!adminSnap.exists()) {
         await setDoc(adminRef, { role: 'admin' });
       }
    }
  };

  const initRecaptcha = () => {
    try {
      // 1. Defensively clear existing verifier
      if (recaptchaVerifier.current) {
        try {
          recaptchaVerifier.current.clear();
        } catch (e) {
          // Ignore clearing errors
        }
        recaptchaVerifier.current = null;
      }

      // 2. Reset the DOM container with a fresh target ID
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.innerHTML = '<div id="recaptcha-target"></div>';
      }

      // 3. Initialize on the fresh element
      recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-target', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
          initRecaptcha();
        }
      });
    } catch (err) {
      console.error("Critical Recaptcha init error:", err);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phoneNumber) return setError("Phone number is required");
    
    setIsLoading(true);
    setError(null);

    try {
      initRecaptcha();
      if (!recaptchaVerifier.current) {
        throw new Error("Safety check failed to load. Please refresh the page.");
      }
      const appVerifier = recaptchaVerifier.current;
      const result = await signInWithPhoneNumber(auth, formData.phoneNumber, appVerifier);
      setConfirmationResult(result);
    } catch (err: any) {
      console.error("Phone Auth Error Breakdown:", err);
      
      const isBillingError = err.code === 'auth/billing-not-enabled';
      const isRateLimit = err.code === 'auth/too-many-requests';

      if (isBillingError) {
        setError(
          "🚨 ACTION REQUIRED: Firebase Billing (Blaze Plan) is not enabled for SMS. " +
          "To fix this WITHOUT paying: 1. Go to Firebase Console > Auth > Sign-in Method. " +
          "2. Scroll to 'Phone numbers for testing'. " +
          "3. Add your number (e.g. +91 99999 99999) and a fixed code (e.g. 123456). " +
          "4. Use that test number here."
        );
      } else if (isRateLimit) {
        setError(
          "Rate Limit Exceeded. Firebase blocks frequent requests to prevent spam. " +
          "Please wait 5-10 minutes or use a 'Test Phone Number' in your Firebase Console to bypass limits."
        );
      } else {
        setError(err.message || "An error occurred during verification.");
      }
      
      // Cleanup on error to prevent broken states
      if (recaptchaVerifier.current) {
        try { recaptchaVerifier.current.clear(); } catch (e) {}
        recaptchaVerifier.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || !formData.otp) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await confirmationResult.confirm(formData.otp);
      if (isSignUp) {
        await updateProfile(result.user, { displayName: formData.displayName });
      }
      await syncUserProfile(result.user, formData.displayName, role);
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists()) {
        const userProfile = userDoc.data() as UserProfile;
        navigate(userProfile.role === UserRole.ADMIN ? '/admin' : userProfile.role === UserRole.OWNER ? '/owner' : '/tenant');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === 'phone') {
      if (!confirmationResult) return handlePhoneAuth(e);
      return handleOtpVerify(e);
    }

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
        setError('Auth not enabled in console.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Check cookies.');
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
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-white">
      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      {/* Visual Side */}
      <div className="relative hidden w-1/2 lg:block">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000"
          className="h-full w-full object-cover"
          alt="Premium workspace"
        />
        <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 flex flex-col justify-between p-16 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 shadow-xl shadow-orange-600/20">
              <Home className="h-6 w-6" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter italic">RoomZy</span>
          </div>
          
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-7xl font-black uppercase italic leading-[0.8] tracking-tighter"
            >
              Elite <br/> 
              <span className="text-orange-500">Rental</span> <br/>
              Network.
            </motion.h1>
            <p className="mt-8 max-w-md text-lg font-medium text-neutral-200">
              Experience the next generation of property management. 
              Secure, fast, and completely transparent.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {[
              { label: 'Active Direct Listings', value: '12k+' },
              { label: 'Verified Communities', value: '450+' }
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-3xl font-black">{stat.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-20 lg:w-1/2 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md space-y-10"
        >
          {/* Mobile Header */}
          <div className="flex items-center gap-2 lg:hidden mb-10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white">
              <Home className="h-5 w-5" />
            </div>
            <span className="text-lg font-black uppercase tracking-tighter italic">RoomZy</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-5xl font-black uppercase tracking-tighter text-neutral-900 leading-none">
                {isSignUp ? 'Create' : 'Sign In'}<br/>
                <span className="text-orange-600 italic">Account.</span>
              </h2>
              <p className="mt-4 text-neutral-500 font-medium">
                {isSignUp ? 'Join the most elite rental network.' : 'Welcome back to your dashboard.'}
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-1 bg-neutral-100 rounded-2xl">
            <button
              onClick={() => { setAuthMethod('email'); setConfirmationResult(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                authMethod === 'email' ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              onClick={() => { setAuthMethod('phone'); setConfirmationResult(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                authMethod === 'phone' ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              <Smartphone className="h-4 w-4" />
              Phone
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Account Type</label>
                <div className="flex gap-4">
                  {[
                    { id: UserRole.TENANT, icon: User, label: 'Tenant' },
                    { id: UserRole.OWNER, icon: Home, label: 'Owner' },
                    { id: UserRole.ADMIN, icon: Shield, label: 'Admin' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      type="button"
                      className={cn(
                        "flex h-20 flex-1 flex-col items-center justify-center rounded-2xl border-2 transition-all group",
                        role === r.id 
                          ? "border-orange-600 bg-orange-50 text-orange-600" 
                          : "border-neutral-100 bg-white text-neutral-400 hover:border-neutral-200"
                      )}
                    >
                      <r.icon className={cn("h-6 w-6 mb-1 transition-transform group-hover:scale-110", role === r.id && "animate-pulse")} />
                      <span className="text-[10px] font-black uppercase tracking-tighter">{r.label}</span>
                      <div className={cn("mt-1 h-1 w-1 rounded-full", role === r.id ? "bg-orange-600" : "bg-transparent")} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {isSignUp && (
                <div className="group space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-focus-within:text-orange-600">Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 h-5 w-5 text-neutral-300 group-focus-within:text-orange-600" />
                    <input
                      name="displayName"
                      type="text"
                      placeholder="Enter your full name"
                      required
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50/50 py-4 pl-12 pr-4 text-sm font-bold outline-none transition-all focus:border-orange-600 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {authMethod === 'email' ? (
                <>
                  <div className="group space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-focus-within:text-orange-600">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 h-5 w-5 text-neutral-300 group-focus-within:text-orange-600" />
                      <input
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50/50 py-4 pl-12 pr-4 text-sm font-bold outline-none transition-all focus:border-orange-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="group space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-focus-within:text-orange-600">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-4 h-5 w-5 text-neutral-300 group-focus-within:text-orange-600" />
                      <input
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50/50 py-4 pl-12 pr-4 text-sm font-bold outline-none transition-all focus:border-orange-600 focus:bg-white"
                      />
                    </div>
                    {!isSignUp && (
                      <div className="flex justify-end pt-2">
                        <Link to="/forgot-password" title="Recover Access" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-orange-600 transition-colors">
                          Recover Access
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="group space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-focus-within:text-orange-600">Phone Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-4 h-5 w-5 text-neutral-300 group-focus-within:text-orange-600" />
                      <input
                        name="phoneNumber"
                        type="tel"
                        disabled={!!confirmationResult}
                        placeholder="+91 98765 43210"
                        required
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50/50 py-4 pl-12 pr-4 text-sm font-bold outline-none transition-all focus:border-orange-600 focus:bg-white disabled:opacity-50"
                      />
                      {confirmationResult && (
                        <button 
                          type="button"
                          onClick={() => setConfirmationResult(null)}
                          className="absolute right-4 top-4 text-xs font-bold text-orange-600 underline"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {confirmationResult && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="group space-y-1"
                      >
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-focus-within:text-orange-600">OTP Code</label>
                        <div className="relative">
                          <Check className="absolute left-4 top-4 h-5 w-5 text-neutral-300 group-focus-within:text-orange-600" />
                          <input
                            name="otp"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            required
                            maxLength={6}
                            value={formData.otp}
                            onChange={handleInputChange}
                            className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50/50 py-4 pl-12 pr-4 text-sm font-bold outline-none transition-all focus:border-orange-600 focus:bg-white"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={cn(
                  "rounded-2xl p-4 text-[10px] font-bold uppercase tracking-widest border",
                  error.includes("ACTION REQUIRED") ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-red-50 text-red-600 border-red-100"
                )}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className={cn("h-4 w-4 shrink-0", error.includes("ACTION REQUIRED") ? "text-orange-600" : "text-red-500")} />
                  <p className="leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-900 py-5 font-black uppercase tracking-tighter text-white transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-50"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
                  />
                ) : (
                  <motion.div
                    key="text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-lg"
                  >
                    {authMethod === 'phone' 
                      ? (confirmationResult ? 'Verify OTP' : 'Send OTP')
                      : (isSignUp ? 'Initialize Account' : 'Authenticate')}
                    <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </form>

          <div className="space-y-6">
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-neutral-100"></div>
              <span className="mx-4 flex-shrink text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300">OR</span>
              <div className="flex-grow border-t border-neutral-100"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-neutral-100 py-4 text-sm font-black uppercase tracking-tighter text-neutral-900 transition-all hover:border-neutral-900 active:scale-95 disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google Identity
            </button>

            <p className="text-center text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              {isSignUp ? 'Already specialized?' : "New to the network?"}{' '}
              <Link
                to={isSignUp ? '/login' : '/signup'}
                className="text-orange-600 hover:underline"
              >
                {isSignUp ? 'Switch to Sign In' : 'Establish Account'}
              </Link>
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 py-8 text-neutral-300">
              <Shield className="h-4 w-4" />
              <CheckCircle2 className="h-4 w-4" />
              <Sparkles className="h-4 w-4" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
