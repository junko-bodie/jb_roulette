'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './homepage.module.css';
import { useGame } from '@/context/GameContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SettingsModal from '@/components/ui/SettingsModal';
import ProfileModal from '@/components/ui/ProfileModal';

export default function Home() {
  const { user, isLoading, userProfile, balance } = useGame();
  const router = useRouter();
  const supabase = createClient();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1f1a]">
        <div className="text-[#c9a44c] text-2xl font-black tracking-widest animate-pulse">
          LOADING CASINO...
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Format balance with commas
  const formattedBalance = new Intl.NumberFormat('en-US').format(balance);
  
  return (
    <main className={styles.container}>
      <div className={styles.innerFrame}>
        {/* Felt Background Pattern */}
        <div className={styles.feltBackground} />

        {/* Decorative corner */}
        <div className={styles.decorCorner} />

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.profileCard}>
            <button 
              onClick={() => setIsProfileOpen(true)}
              className={styles.avatar}
            >
              <img 
                src={userProfile.avatar.startsWith('/') ? userProfile.avatar : '/avatars/default.png'} 
                alt="Avatar" 
                className="w-full h-full object-cover rounded-full"
                onError={(e) => (e.currentTarget.src = '/avatars/default.png')}
              />
            </button>
            <div className={styles.profileInfo}>
              <button 
                onClick={() => setIsProfileOpen(true)}
                className={styles.playerName}
              >
                {userProfile.name}
              </button>
              <div className={styles.chipCount}>
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#c9a44c]" fill="currentColor">
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
                </svg>
                {formattedBalance}
              </div>
              <div className={styles.levelContainer}>
                <div className={styles.levelStar} />
                <span className="text-[10px] text-white font-bold ml-1">1</span>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} />
                </div>
                <span className="text-[10px] text-white/70 ml-1">83.3%</span>
              </div>
            </div>
          </div>

          <div className={styles.centralLogo}>B</div>

          <button 
            onClick={handleSignOut}
            className={styles.headerRight}
            title="Sign Out"
          >
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-red-500 hover:text-red-400 transition-colors" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
          </button>
        </header>

        {/* Main Content Areas */}
        <section className={styles.mainActions}>
          <Link href="/game" className={styles.tile}>
            <div className={styles.tileIcon}>
              <svg viewBox="0 0 24 24" className="w-16 h-16 ml-2" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className={styles.tileLabel}>SOLO</span>
          </Link>
        </section>

        {/* Sidebar Icons */}
        <aside className={styles.sidebarRight}>
          <div className={styles.sidebarIcon}>
            <div className={styles.iconCircle}>
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-red-600" fill="currentColor">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none" />
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
              </svg>
              <div className="absolute top-0 right-0 w-6 h-6 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-sm">+</div>
            </div>
            <span className={styles.iconLabel}>CHIPS, NO ADS</span>
          </div>

          <div className={styles.sidebarIcon}>
            <div className={styles.iconCircle}>
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-red-600" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="2" fill="white" />
              </svg>
            </div>
            <span className={styles.iconLabel}>STRATEGY</span>
          </div>

          <div 
            onClick={() => setIsSettingsOpen(true)}
            className={styles.sidebarIcon}
          >
            <div className={styles.iconCircle}>
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-slate-700" fill="currentColor">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L3.82 8.87c-.11.21-.06.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </div>
            <span className={styles.iconLabel}>SETTINGS</span>
          </div>
        </aside>

        {/* Bottom Left Icons */}
        <div className={styles.bottomLeftActions}>
          <div className={styles.smallIcon}>
            <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
              <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
            </svg>
          </div>
          <div className={styles.smallIcon}>
            <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
              <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-8 15c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm2-15h-4V4h4v2z" />
            </svg>
          </div>
          <div className={styles.smallIcon}>
            <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
              <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
            </svg>
          </div>
        </div>

        {/* Modals */}
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      </div>
    </main>
  );
}
