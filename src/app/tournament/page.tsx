'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/ui/Avatar';
import styles from './tournament.module.css';

export default function TournamentLobby() {
  const { user, userProfile, isLoading: isGameLoading, setUserProfile } = useGame();
  const router = useRouter();
  const supabase = createClient();
  const [isCreating, setIsCreating] = useState(false);
  const [bots, setBots] = useState<{ username: string; avatar: string }[]>([]);

  // Generate deterministic bots for the lobby preview
  useEffect(() => {
    const generatedBots = Array.from({ length: 5 }).map((_, i) => ({
      username: `Bot_${1000 + i * 237 + Math.floor(Math.random() * 100)}`,
      avatar: 'chip', // Use 'chip' icon for bots from Avatar.tsx
    }));
    setBots(generatedBots);
  }, []);

  useEffect(() => {
    if (!isGameLoading && !user) {
      router.push('/');
    }
  }, [isGameLoading, user, router]);

  const handleStartTournament = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/tournament/create', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create tournament');
      }

      const tournament = await response.json();
      router.push(`/tournament/${tournament._id}`);
    } catch (error) {
      console.error('Error starting tournament:', error);
      alert('Failed to start tournament. Please try again.');
      setIsCreating(false);
    }
  };

  if (isGameLoading || !user) {
    return (
      <div className={styles.page} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ color: '#c9a44c', letterSpacing: '0.3em', fontWeight: 800 }}
        >
          LOADING LOBBY...
        </motion.span>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('local_guest_session');
      window.location.href = '/';
    } catch (e) {
      window.location.href = '/';
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgAccents}>
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
      </div>
      <div className={styles.bgGrid} />

      <header className={styles.header}>
        <div className={styles.logoText}>JUNKO BODIE ROULETTE</div>
        <div style={{ color: 'rgba(201,164,76,0.6)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em' }}>
          PRO TOURNAMENT SERIES
        </div>
        <button
          onClick={handleSignOut}
          style={{
            background: 'none', border: '1px solid rgba(255,100,100,0.3)', color: '#ff6b6b',
            padding: '8px 16px', borderRadius: '12px', fontSize: '10px', cursor: 'pointer',
            textTransform: 'uppercase', letterSpacing: '0.15em', marginLeft: 'auto',
            fontWeight: 800
          }}
        >
          Sign Out
        </button>
      </header>

      <main className={styles.main}>
        <motion.div
          className={styles.lobbyContainer}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              style={{ color: '#c9a44c', fontWeight: 900, letterSpacing: '0.4em', fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px' }}
            >
              The Calm Before The Storm
            </motion.div>
            <h1 className={`${styles.title} ${styles.shimmerText}`} style={{ fontSize: '48px', marginBottom: '4px', lineHeight: 1 }}>
              Elite Roulette Tournament
            </h1>
            <div style={{ height: '2px', width: '40px', background: '#c9a44c', margin: '14px auto' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: '500px' }}>
              <p className={styles.subtitle} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0 }}>
                Step into the high-stakes arena where legends are made.
                Test your luck and strategy against the finest players.
              </p>
            </div>

            {/* ARE YOU READY HYPE SECTION */}
            <motion.div
              className={styles.readySection}
              animate={{ scale: [1, 1.01, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              style={{
                background: 'linear-gradient(180deg, rgba(201,164,76,0.08) 0%, transparent 100%)',
                padding: '24px 32px',
                borderRadius: '24px',
                border: '1px solid rgba(201,164,76,0.12)',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar type={userProfile.avatar} size="lg" />
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>CHALLENGER</div>
                  <div style={{ color: '#fff', fontSize: '20px', fontWeight: 900, fontFamily: 'Bodoni, serif' }}>{userProfile.name}</div>
                </div>
              </div>

              <div style={{ width: '1px', height: '30px', background: 'rgba(201,164,76,0.15)' }} />

              <div style={{ textAlign: 'left' }}>
                <motion.div
                  className={styles.shimmerText}
                  style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', fontStyle: 'italic' }}
                >
                  Are You Ready?
                </motion.div>
                <div style={{ color: '#c9a44c', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em' }}>PRECISION • GLORY</div>
              </div>
            </motion.div>

            <div className={styles.slotFooter} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <button
                className={styles.startButton}
                onClick={handleStartTournament}
                disabled={isCreating}
                style={{
                  width: '100%',
                  maxWidth: '360px',
                  height: '56px',
                  fontSize: '16px',
                  borderRadius: '14px',
                  boxShadow: '0 15px 30px rgba(0,0,0,0.4), 0 0 15px rgba(201,164,76,0.15)'
                }}
              >
                {isCreating ? (
                  <>
                    <span className={styles.loadingSpinner}></span>
                    PREPARING ARENA...
                  </>
                ) : (
                  'ENTER TOURNAMENT'
                )}
              </button>
              <div style={{ fontSize: '11px', color: 'rgba(201,164,76,0.7)', fontWeight: 800, letterSpacing: '0.25em' }}>
                ENTRY: FREE • PRIZE: GLORY & GOLD
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <footer style={{ padding: '40px', textAlign: 'center', fontSize: '10px', color: 'rgba(201,164,76,0.3)', letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 800 }}>
        Professional Roulette Tournament • Join the Elite League
      </footer>
    </div>
  );
}
