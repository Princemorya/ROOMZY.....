import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight, RefreshCw, LogOut, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';

export default function VerifyEmail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.emailVerified) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleResendEmail = async () => {
    if (!user) return;
    setIsResending(true);
    setMessage(null);
    try {
      await sendEmailVerification(user);
      setMessage({ type: 'success', text: 'Verification email resent successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to resend email.' });
    } finally {
      setIsResending(false);
    }
  };

  const checkVerificationStatus = async () => {
    if (!user) return;
    setIsChecking(true);
    setMessage(null);
    try {
      await user.reload();
      if (user.emailVerified) {
        navigate('/');
      } else {
        setMessage({ type: 'error', text: 'Email is not verified yet. Please check your inbox.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to check status.' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-orange-100 text-orange-600">
              <Mail className="h-12 w-12" />
            </div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-lg"
            >
              <ShieldCheck className="h-6 w-6" />
            </motion.div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-neutral-900 leading-none">
              Verify your<br/>
              <span className="text-orange-600 italic">Identity.</span>
            </h1>
            <p className="text-neutral-500 font-medium px-4">
              We've sent a verification link to <span className="text-neutral-900 font-bold">{user.email}</span>. Please click the link to activate your premium access.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <button
            onClick={checkVerificationStatus}
            disabled={isChecking}
            className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-900 py-5 font-black uppercase tracking-tighter text-white transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-50"
          >
            <AnimatePresence mode="wait">
              {isChecking ? (
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
                  Verify Status
                  <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-neutral-100 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 transition-all hover:border-orange-600 hover:text-orange-600 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", isResending && "animate-spin")} />
              Resend Link
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-neutral-100 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 transition-all hover:border-red-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-2xl p-4 text-[10px] font-bold uppercase tracking-widest border",
              message.type === 'success' 
                ? "bg-green-50 text-green-600 border-green-100" 
                : "bg-red-50 text-red-600 border-red-100"
            )}
          >
            {message.type === 'success' && <CheckCircle2 className="inline-block mr-2 h-4 w-4" />}
            {message.text}
          </motion.div>
        )}

        <div className="pt-12 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-300">
            Secure Authentication by <span className="text-neutral-400">RoomZy Identity</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
