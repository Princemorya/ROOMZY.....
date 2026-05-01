import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({
        type: 'success',
        text: 'Password reset email sent! Please check your inbox and follow the instructions.'
      });
      setEmail('');
    } catch (err: any) {
      console.error('Password reset error:', err);
      let errorText = 'Failed to send reset email. Please try again.';
      
      if (err.code === 'auth/user-not-found') {
        errorText = 'No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        errorText = 'Please enter a valid email address.';
      } else if (err.code === 'auth/network-request-failed') {
        errorText = 'Network error: This usually happens when third-party cookies or cross-site tracking are blocked in your browser. Please try using a standard (non-incognito) window.';
      } else if (err.code === 'auth/too-many-requests') {
        errorText = 'Too many requests. Please wait a moment and try again.';
      } else if (err.code === 'auth/internal-error') {
        errorText = 'Internal Firebase error. This usually resolves after a few minutes, or check your internet connection.';
      } else if (err.message) {
        errorText = err.message;
      }
      
      setMessage({ type: 'error', text: errorText });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-3xl border border-neutral-100 bg-white p-8 shadow-2xl shadow-neutral-200"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Reset Password</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <p className="mt-4 text-xs text-neutral-400 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
            Note: If you signed up using <strong>Google Login</strong>, you must manage your password through your Google Account settings.
          </p>
        </div>

        {message && (
          <div className={`rounded-xl p-4 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-4 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-4 font-bold text-white transition-all hover:bg-orange-700 disabled:opacity-50 shadow-lg shadow-orange-200"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Send Reset Link
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
