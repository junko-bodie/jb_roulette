'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, #1a4d3c 0%, #050f0d 100%)',
      }}
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-[#c9a44c]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[60%] h-[60%] bg-[#1a4d3c]/20 rounded-full blur-[150px]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full backdrop-blur-3xl bg-black/30 rounded-[3rem] border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05), 0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}
        >
          {/* Header Section */}
          <div className="pt-20 pb-12 px-10 text-center relative">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-[#f0e6c8] to-[#c9a44c] tracking-[0.25em] mb-6" 
                  style={{ fontFamily: "'Bodoni Moda', serif", filter: 'drop-shadow(0 0 30px rgba(201, 164, 76, 0.4))' }}>
                JUNKO BODIE
              </h1>
              <div className="flex items-center justify-center gap-6">
                <div className="h-px w-24 bg-gradient-to-r from-transparent to-[#c9a44c]" />
                <span className="text-xs uppercase tracking-[1em] text-[#c9a44c] font-black">Roulette Royale</span>
                <div className="h-px w-24 bg-gradient-to-l from-transparent to-[#c9a44c]" />
              </div>
            </motion.div>
          </div>

          <div className="px-16 pb-20 space-y-10">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center font-bold"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-6">
              {/* Google Login */}
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,1)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-5 py-5 px-8 rounded-2xl bg-white/95 text-black font-black transition-all shadow-2xl group relative overflow-hidden"
              >
                <img src="https://www.google.com/favicon.ico" alt="google" className="w-6 h-6" />
                <span className="text-lg tracking-tight">Continue with Google</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </motion.button>

              {/* Guest Login */}
              <motion.button
                onClick={handleGuestLogin}
                disabled={isLoading}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(201, 164, 76, 0.1)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-5 rounded-2xl border-2 border-[#c9a44c]/30 text-[#c9a44c] transition-all text-sm font-black tracking-[0.4em] uppercase hover:border-[#c9a44c]/60"
              >
                Enter as Guest
              </motion.button>
            </div>

            <div className="flex flex-col items-center gap-6 pt-4">
              <div className="flex gap-2 opacity-40">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#c9a44c]" />
                ))}
              </div>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="py-6 bg-black/40 text-center border-t border-white/5">
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium px-12 leading-relaxed">
              Membership implies agreement to our <br/>
              <span className="text-[#c9a44c]/60 underline cursor-pointer hover:text-[#c9a44c] transition-colors">Terms of Protocol</span> & <span className="text-[#c9a44c]/60 underline cursor-pointer hover:text-[#c9a44c] transition-colors">Privacy Charter</span>
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* Visual Accents */}
      <div className="absolute top-10 right-10 flex gap-2 opacity-20 hidden lg:flex">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#c9a44c]" />
        ))}
      </div>
    </div>
  );
}
