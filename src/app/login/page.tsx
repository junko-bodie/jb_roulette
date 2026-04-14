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
      <div className="relative z-10 w-full max-w-2xl px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full backdrop-blur-3xl bg-black/40 rounded-[4rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05), 0 35px 70px -15px rgba(0, 0, 0, 0.8)'
          }}
        >
          {/* Header Section */}
          <div className="pt-48 pb-32 px-12 text-center relative">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-[#f0e6c8] to-[#c9a44c] tracking-[0.25em] mb-14" 
                  style={{ fontFamily: "'Bodoni Moda', serif", filter: 'drop-shadow(0 0 40px rgba(201, 164, 76, 0.5))' }}>
                JUNKO BODIE
              </h1>
              <div className="flex items-center justify-center gap-8">
                <div className="h-px w-32 bg-gradient-to-r from-transparent to-[#c9a44c]" />
                <span className="text-sm uppercase tracking-[1.2em] text-[#c9a44c] font-black opacity-80">Roulette Royale</span>
                <div className="h-px w-32 bg-gradient-to-l from-transparent to-[#c9a44c]" />
              </div>
            </motion.div>
          </div>

          <div className="px-20 pb-48 space-y-24">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-8 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center font-bold"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-12">
              {/* Google Login */}
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,1)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-6 py-8 px-10 rounded-3xl bg-white text-black font-black transition-all shadow-2xl group relative overflow-hidden"
              >
                <img src="https://www.google.com/favicon.ico" alt="google" className="w-7 h-7" />
                <span className="text-xl tracking-tight">Continue with Google</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </motion.button>

              {/* Guest Login */}
              <motion.button
                onClick={handleGuestLogin}
                disabled={isLoading}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(201, 164, 76, 0.1)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-8 rounded-3xl border-2 border-[#c9a44c]/30 text-[#c9a44c] transition-all text-base font-black tracking-[0.5em] uppercase hover:border-[#c9a44c]/60"
              >
                Enter as Guest
              </motion.button>
            </div>

            <div className="flex flex-col items-center gap-14 pt-10">
              <div className="flex gap-6 opacity-50">
                {[...Array(3)].map((_, i) => (
                  <motion.div 
                    key={i} 
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3] 
                    }}
                    transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.4 }}
                    className="w-2.5 h-2.5 rounded-full bg-[#c9a44c]" 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="py-14 bg-black/50 text-center border-t border-white/10 mt-auto">
            <p className="text-[11px] text-white/30 uppercase tracking-[0.25em] font-medium px-16 leading-relaxed">
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
