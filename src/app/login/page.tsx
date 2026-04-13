'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ 
        backgroundImage: 'radial-gradient(circle at center, #1a4d3c 0%, #0a1f1a 100%)',
        backgroundColor: '#0a1f1a'
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-8 rounded-3xl border-2 border-[#c9a44c]/30 shadow-2xl bg-[#1c100a]/90 overflow-hidden"
        style={{
          boxShadow: '0 0 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(201, 164, 76, 0.1)'
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-4xl font-black italic text-[#f0e6c8] tracking-widest mb-2" style={{ fontFamily: "'Bodoni Moda', serif" }}>
            JUNKO BODIE
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-[#c9a44c]" />
            <span className="text-xs uppercase tracking-[0.4em] text-[#c9a44c] font-bold">Roulette Royale</span>
            <div className="h-px w-8 bg-[#c9a44c]" />
          </div>
        </div>

        <div className="space-y-4">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-100 transition-all shadow-lg text-sm"
          >
            <img src="https://www.google.com/favicon.ico" alt="google" className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Email/Pass Login */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-[#c9a44c]/20 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a44c] transition-all text-sm"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-[#c9a44c]/20 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a44c] transition-all text-sm"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-b from-[#c9a44c] to-[#8b6b22] text-white font-black tracking-widest uppercase text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all border-b-4 border-[#5a461b]"
            >
              Log In
            </button>
          </form>

          <div className="pt-4">
            <button
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full py-3 rounded-xl border border-[#c9a44c]/40 text-[#c9a44c] hover:bg-[#c9a44c]/10 transition-all text-xs font-bold tracking-widest uppercase"
            >
              Play as Guest
            </button>
          </div>
        </div>

        <p className="mt-8 text-[10px] text-center text-white/40 leading-relaxed uppercase tracking-widest">
          By continuing, you agree to our <br/>
          <span className="text-[#c9a44c]/60 underline cursor-pointer">Terms of Service</span> and <span className="text-[#c9a44c]/60 underline cursor-pointer">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
}
