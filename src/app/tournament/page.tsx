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
        <div className={styles.logoText}>JUNKO BODIE</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em' }}>
          TOURNAMENT SYSTEM v1.0
        </div>
        <button 
          onClick={handleSignOut}
          style={{ 
            background: 'none', border: '1px solid rgba(255,100,100,0.3)', color: '#ff6b6b', 
            padding: '6px 12px', borderRadius: '8px', fontSize: '10px', cursor: 'pointer',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: 'auto'
          }}
        >
          Sign Out
        </button>
      </header>

      <main className={styles.main}>
        <motion.div 
          className={styles.lobbyContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ color: '#c9a44c', fontWeight: 900, letterSpacing: '0.4em', fontSize: '12px', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>
            The Arena Awaits
          </div>
          <h1 className={styles.title} style={{ textAlign: 'center', fontSize: '48px', marginBottom: '16px' }}>
            Elite Tournament
          </h1>
          <p className={styles.subtitle} style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto 40px', lineHeight: 1.6 }}>
            Join the global arena and compete against real players. Winners take all. 
            Search for opponents or challenge the house.
          </p>

          <div style={{ 
            background: 'rgba(201,164,76,0.05)', 
            border: '1px solid rgba(201,164,76,0.2)', 
            borderRadius: '20px', 
            padding: '32px',
            marginBottom: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <Avatar type={userProfile.avatar} size="lg" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: '20px', fontWeight: 900 }}>{userProfile.name}</div>
              <div style={{ color: '#c9a44c', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>READY FOR COMPETITION</div>
            </div>
          </div>

          <div className={styles.slotFooter} style={{ display: 'flex', justifyContent: 'center' }}>
            <button 
              className={styles.startButton}
              onClick={handleStartTournament}
              disabled={isCreating}
              style={{ width: '100%', maxWidth: '300px' }}
            >
              {isCreating ? (
                <>
                  <span className={styles.loadingSpinner}></span>
                  FINDING LOBBY...
                </>
              ) : (
                'JOIN TOURNAMENT'
              )}
            </button>
          </div>
          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
             ENTRY FEE: FREE • STARTING STACK: $2,000
          </p>
        </motion.div>
      </main>

      <footer style={{ padding: '20px', textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        Professional Roulette Tournament • Join the Elite
      </footer>
    </div>
  );
}
