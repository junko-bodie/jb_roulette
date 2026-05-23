'use client';

import { motion, AnimatePresence } from 'framer-motion';
import styles from '../homepage.module.css';
import { useGame } from '@/context/GameContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SettingsModal from '@/components/ui/SettingsModal';
import dynamic from 'next/dynamic';
import Avatar from '@/components/ui/Avatar';
const WelcomeVideoModal = dynamic(() => import('@/components/ui/WelcomeVideoModal'), { ssr: false, loading: () => null });
import { User, Settings, BarChart2, LogOut, Play, Trophy, ChevronLeft } from 'lucide-react';
import { soundEngine } from '@/lib/audioEngine';

export default function Home() {
  const { user, isLoading, userProfile, balance, isSoundEnabled, isMusicEnabled } = useGame();
  const router = useRouter();
  const supabase = createClient();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);
  const [isWelcomeVideoOpen, setIsWelcomeVideoOpen] = useState(false);
  const [videoDestination, setVideoDestination] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleContactSupport = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      navigator.clipboard.writeText('support@junkobodiegaming.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy support email:', err);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth <= 768);
    updateMobile();
    window.addEventListener('resize', updateMobile);

    return () => window.removeEventListener('resize', updateMobile);
  }, []);

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
      localStorage.removeItem('local_guest_session');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const formattedBalance = new Intl.NumberFormat('en-US').format(balance);

  return (
    <div className={styles.page}>
      {/* Background accents */}
      <div className={styles.bgAccents} />

      <div className={styles.lobbyCard}>
        {/* Annual Championship Banner */}
        {userProfile?.annual_championship_qualified && (
          <div style={{
            background: '#c9a44c',
            color: '#111',
            padding: '12px',
            textAlign: 'center',
            fontWeight: 900,
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            boxShadow: '0 0 30px rgba(201,164,76,0.4)'
          }}>
            🏆 You have qualified for the Junko Bodie Annual Championship 🏆
          </div>
        )}

        {/* Header */}
        <header className={styles.header} style={{ marginTop: userProfile?.annual_championship_qualified ? '40px' : '0' }}>
          <div
            className={styles.profileCard}
            onClick={() => router.push('/profile')}
            style={{ cursor: 'pointer' }}
          >
            <Avatar
              type={userProfile?.avatar || 'default'}
              className="w-[52px] h-[52px] border border-[#c9a44c]/40 shadow-lg"
            />
            <div className={styles.profileInfo}>
              <div className="flex items-center gap-2">
                <span className={styles.playerName}>{userProfile?.name || 'Player'}</span>
              </div>
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
            <div className={styles.separator}>
              <div className={styles.sepLine} />
              <div className={styles.separatorDiamond} />
              <div className={styles.sepLine} />
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.headerBtnDanger}
              onClick={handleSignOut}
              title="Sign Out"
            >
              <LogOut size={24} strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className={styles.main}>
          <div className={styles.gameGrid}>
            {/* Solo Mode */}
            <motion.div
              className={styles.playCard}
              onClick={() => {
                if (isSoundEnabled) {
                  soundEngine?.playClick();
                }
                // if (isMusicEnabled) {
                //   soundEngine?.playBackgroundMusic();
                // }
                // router.push('/game');
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={`${styles.playIconWrap} ${styles.iconSolo}`}>
                <Play className={styles.playIconSolo} strokeWidth={1.5} fill="currentColor" />
              </div>
              <div>
                <div className={styles.playLabel}>SOLO PLAY</div>
                <div className={styles.playDesc}>
                  Classic American and European Roulette. <br /> Test Your Skill Against The House.
                </div>
              </div>
            </motion.div>

            {/* Tournament Mode */}
            {<motion.div
              className={styles.playCard}
              onClick={() => {
                if (isSoundEnabled) {
                  soundEngine?.playClick();
                }
                router.push('/tournament');
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={`${styles.playIconWrap} ${styles.iconTournament}`}>
                <Trophy className={styles.playIconTourney} strokeWidth={1.5} />
              </div>
              <div>
                <div className={styles.playLabel}>TOURNAMENT</div>
                <div className={styles.playDesc}>
                  Test Yourself Against Other Top Players In A Live Tournament Experience.
                </div>
              </div>
            </motion.div>}
          </div>

          <motion.div
            className={styles.quickActions}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.quickBtn} onClick={() => router.push('/profile')}>
              <User className={styles.quickBtnIcon} strokeWidth={1.5} />
              <span className={styles.quickBtnLabel}>PROFILE</span>
            </div>


            <div className={styles.quickBtn} onClick={() => router.push('/rankings')}>
              <BarChart2 className={styles.quickBtnIcon} strokeWidth={1.5} />
              <span className={styles.quickBtnLabel}>RANKINGS</span>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <div className={styles.footer}>
          <a
            href="mailto:support@junkobodiegaming.com"
            className={styles.supportLink}
            onClick={handleContactSupport}
          >
            {copied ? 'Email Copied!' : 'Contact Support'}
          </a>
        </div>
      </div>

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

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <WelcomeVideoModal
        isOpen={isWelcomeVideoOpen}
        onClose={() => {
          setIsWelcomeVideoOpen(false);
          if (videoDestination) {
            router.push(videoDestination);
            setVideoDestination(null);
          }
        }}
      />
    </div>
  );
}
