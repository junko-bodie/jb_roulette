'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/" });
  };

  const handleGuestLogin = () => {
    setIsLoading(true);
    signIn("guest", { callbackUrl: "/" });
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    signIn("credentials", { email, password, callbackUrl: "/" });
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
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#c9a44c]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#1a4d3c]/20 rounded-full blur-[150px]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full backdrop-blur-xl bg-black/40 rounded-[2.5rem] border border-white/10 shadow-[0_22px_70px_4px_rgba(0,0,0,0.56)] overflow-hidden"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05), 0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}
        >
          {/* Header Section */}
          <div className="pt-12 pb-8 px-10 text-center relative">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-[#f0e6c8] to-[#c9a44c] tracking-[0.2em] mb-4" 
                  style={{ fontFamily: "'Bodoni Moda', serif", filter: 'drop-shadow(0 0 20px rgba(201, 164, 76, 0.3))' }}>
                JUNKO BODIE
              </h1>
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#c9a44c]" />
                <span className="text-sm uppercase tracking-[0.6em] text-[#c9a44c] font-bold">Roulette Royale</span>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#c9a44c]" />
              </div>
            </motion.div>
          </div>

          <div className="px-12 pb-14 space-y-8">
            {/* Social Login */}
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-4 py-4 px-8 rounded-2xl bg-white text-black font-bold transition-all shadow-xl group"
            >
              <img src="https://www.google.com/favicon.ico" alt="google" className="w-6 h-6" />
              <span className="text-base">Continue with Google</span>
            </motion.button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-6 text-[11px] font-black uppercase tracking-[0.3em] text-white/30">Executive Entry</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            {/* Email Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1">
                <input
                  type="email"
                  placeholder="Official Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#c9a44c]/30 focus:border-[#c9a44c]/50 transition-all text-base"
                />
              </div>
              <div className="space-y-1">
                <input
                  type="password"
                  placeholder="Secured Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#c9a44c]/30 focus:border-[#c9a44c]/50 transition-all text-base"
                />
              </div>
              
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.01, filter: 'brightness(1.1)' }}
                whileTap={{ scale: 0.99 }}
                onMouseEnter={() => setHoveredButton('login')}
                onMouseLeave={() => setHoveredButton(null)}
                className="w-full py-5 rounded-2xl bg-gradient-to-b from-[#c9a44c] to-[#8b6b22] text-white font-black tracking-[0.2em] uppercase text-base shadow-[0_10px_30px_rgba(139,107,34,0.3)] transition-all border-b-4 border-[#5a461b] mt-4 relative overflow-hidden"
              >
                <span className="relative z-10">Log In</span>
                <AnimatePresence>
                  {hoveredButton === 'login' && (
                    <motion.div 
                      initial={{ left: '-100%' }}
                      animate={{ left: '100%' }}
                      exit={{ left: '100%' }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            </form>

            <div className="pt-2">
              <motion.button
                onClick={handleGuestLogin}
                disabled={isLoading}
                whileHover={{ backgroundColor: 'rgba(201, 164, 76, 0.15)' }}
                className="w-full py-4 rounded-2xl border border-[#c9a44c]/40 text-[#c9a44c] transition-all text-sm font-bold tracking-[0.25em] uppercase"
              >
                Enter as Guest
              </motion.button>
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
