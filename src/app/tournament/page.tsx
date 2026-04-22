'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';
import Avatar from '@/components/ui/Avatar';
import styles from './tournament.module.css';

export default function TournamentLobby() {
  const { user, userProfile, isLoading: isGameLoading } = useGame();
  const router = useRouter();
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
      router.push('/login');
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
      </header>

      <main className={styles.main}>
        <motion.div 
          className={styles.lobbyContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className={styles.title}>Tournament Lobby</h1>
          <p className={styles.subtitle}>Waiting for players to join. High-stakes competition awaits.</p>

          <div className={styles.slotsGrid}>
            {/* Slot 1: Real Player */}
            <motion.div 
              className={`${styles.slot} ${styles.slotActive}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Avatar type={userProfile.avatar} size="md" />
              <div className={styles.slotInfo}>
                <span className={styles.playerName}>{userProfile.name}</span>
                <span className={styles.playerBalance}>$2,000.00</span>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#c9a44c', fontWeight: 800 }}>YOU</span>
            </motion.div>

            {/* Slots 2-6: Bots */}
            {bots.map((bot, index) => (
              <motion.div 
                key={index} 
                className={styles.slot}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Avatar type={bot.avatar} size="md" />
                <div className={styles.slotInfo}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={styles.playerName}>{bot.username}</span>
                    <span className={styles.botBadge}>BOT</span>
                  </div>
                  <span className={styles.playerBalance}>$2,000.00</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className={styles.slotFooter}>
            <button 
              className={styles.startButton}
              onClick={handleStartTournament}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <span className={styles.loadingSpinner}></span>
                  Creating Tournament...
                </>
              ) : (
                'Start Tournament'
              )}
            </button>
          </div>
        </motion.div>
      </main>

      <footer style={{ padding: '20px', textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        Professional Roulette Tournament • Join the Elite
      </footer>
    </div>
  );
}
