'use client';

import { motion, AnimatePresence } from 'framer-motion';
import styles from './homepage.module.css';
import { useGame } from '@/context/GameContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SettingsModal from '@/components/ui/SettingsModal';
import ProfileModal from '@/components/ui/ProfileModal';
import Avatar from '@/components/ui/Avatar';

export default function Home() {
  const { user, isLoading, userProfile, balance } = useGame();
  const router = useRouter();
  const supabase = createClient();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050d0a',
        color: '#c9a44c',
        fontSize: '14px',
        fontWeight: 800,
        letterSpacing: '0.3em',
        textTransform: 'uppercase' as const,
      }}>
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          Loading...
        </motion.span>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  const formattedBalance = new Intl.NumberFormat('en-US').format(balance);

  return (
    <div className={styles.page}>
      {/* Background accents */}
      <div className={styles.bgAccents}>
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
      </div>
      <div className={styles.bgGrid} />

      {/* Header */}
      <header className={styles.header}>
        <div
          className={styles.profileCard}
          onClick={() => setIsProfileOpen(true)}
        >
          <div className={styles.avatarBtn}>
            <Avatar type={userProfile.avatar} size="sm" />
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.playerName}>{userProfile.name}</span>
            <div className={styles.chipCount}>
              <svg viewBox="0 0 24 24" className={styles.chipIcon} fill="currentColor">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
              </svg>
              <span>{formattedBalance}</span>
            </div>
          </div>
        </div>

        <div className={styles.headerCenter}>
          <span className={styles.logoText}>JUNKO BODIE</span>
          <span className={styles.logoSub}>Roulette</span>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.headerBtn}
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L3.82 8.87c-.11.21-.06.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
          </button>
          <button
            className={styles.headerBtnDanger}
            onClick={handleSignOut}
            title="Sign Out"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        <div className={styles.gameGrid}>
          {/* Solo Mode */}
          <motion.div
            className={styles.playCard}
            onClick={() => router.push('/game')}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.playIconWrap}>
              <svg viewBox="0 0 24 24" className={styles.playIcon} fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className={styles.playLabel}>Solo Play</span>
            <span className={styles.playDesc}>
              Classic European roulette.<br />Place your bets and spin the wheel.
            </span>
          </motion.div>

          {/* Tournament Mode */}
          <motion.div
            className={`${styles.playCard} ${styles.cardDisabled}`}
            onClick={() => setShowComingSoon('Tournaments')}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.soonBadge}>Coming Soon</div>
            <div className={`${styles.playIconWrap} ${styles.iconTournament}`}>
              <svg viewBox="0 0 24 24" className={styles.playIconTournament} fill="currentColor">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 12.9V18H9v2h6v-2h-2v-5.1a5.01 5.01 0 003.61-2.96C19.08 6.63 21 4.55 21 2V2c0-1.1-.9-2-2-2h-1zm-6 8c-1.65 0-3-1.35-3-3V4h6v3c0 1.65-1.35 3-3 3z" />
              </svg>
            </div>
            <span className={styles.playLabel}>Tournament</span>
            <span className={styles.playDesc}>
              Daily high-stakes competitions.<br />Win massive chip pools and titles.
            </span>
          </motion.div>
        </div>

        <motion.div
          className={styles.quickActions}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.quickBtn} onClick={() => setIsProfileOpen(true)}>
            <svg viewBox="0 0 24 24" className={styles.quickBtnIcon} fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
            <span className={styles.quickBtnLabel}>Profile</span>
          </div>

          <div className={styles.quickBtn} onClick={() => setIsSettingsOpen(true)}>
            <svg viewBox="0 0 24 24" className={styles.quickBtnIcon} fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L3.82 8.87c-.11.21-.06.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
            <span className={styles.quickBtnLabel}>Settings</span>
          </div>
        </motion.div>
      </main>

      {/* Coming Soon Modal */}
      <AnimatePresence>
        {showComingSoon && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)'
            }}
            onClick={() => setShowComingSoon(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: '#111', borderRadius: '24px', padding: '40px', textAlign: 'center', border: '1px solid rgba(201, 164, 76, 0.3)', maxWidth: '400px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ width: '60px', height: '60px', background: 'rgba(201, 164, 76, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#c9a44c' }}>
                <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '8px', letterSpacing: '0.05em' }}>{showComingSoon}</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '24px' }}>This feature is currently under high-stakes development. Stay tuned for the next major tournament update.</p>
              <button
                onClick={() => setShowComingSoon(null)}
                style={{ background: '#c9a44c', color: '#111', border: 'none', padding: '12px 32px', borderRadius: '12px', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.1em' }}
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerDot} />
        <span className={styles.footerText}>Junko Bodie Roulette</span>
        <div className={styles.footerDot} />
      </div>

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}
