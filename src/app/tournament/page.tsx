'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';
import { createClient } from '@/lib/supabase/client';
import styles from './tournament.module.css';

export default function TournamentLobby() {
  const { user, userProfile, isLoading: isGameLoading } = useGame();
  const router = useRouter();
  const supabase = createClient();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isGameLoading && !user) {
      router.push('/');
    }
  }, [isGameLoading, user, router]);

  const handleStartTournament = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/tournament/create', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to create tournament');
      const tournament = await response.json();
      router.push(`/tournament/${tournament._id}`);
    } catch (error) {
      console.error('Error starting tournament:', error);
      alert('Failed to start tournament. Please try again.');
      setIsCreating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('local_guest_session');
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  };

  if (isGameLoading || !user) {
    return (
      <div className={styles.page} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#c9a44c', letterSpacing: '0.3em', fontWeight: 800 }}>LOADING...</span>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.windowFrame}>
        <header className={styles.header}>
          <div className={styles.logoGroup}>
            <span className={styles.logoText}>JUNKO BODIE ROULETTE</span>
            <span className={styles.logoSub}>PRO TOURNAMENT SERIES</span>
          </div>
          <button className={styles.signOutBtn} onClick={handleSignOut}>SIGN OUT</button>
        </header>

        <main className={styles.main}>
          <div className={styles.ivoryCard}>
            <div className={styles.ivoryCardInner}>
              <div className={styles.watermark}>
                 <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style={{opacity: 0.1, width: '100%', height: '100%'}}>
                   <circle cx="200" cy="200" r="180" fill="none" stroke="#8b7355" strokeWidth="2" />
                   <circle cx="200" cy="200" r="140" fill="none" stroke="#8b7355" strokeWidth="1" strokeDasharray="4 4"/>
                   <circle cx="200" cy="200" r="100" fill="none" stroke="#8b7355" strokeWidth="4" />
                   <path d="M 200 20 L 200 380 M 20 200 L 380 200 M 70 70 L 330 330 M 70 330 L 330 70" stroke="#8b7355" strokeWidth="1" />
                   <path d="M 200 0 L 210 30 L 190 30 Z" fill="#8b7355" />
                   <path d="M 200 400 L 210 370 L 190 370 Z" fill="#8b7355" />
                   <path d="M 0 200 L 30 190 L 30 210 Z" fill="#8b7355" />
                   <path d="M 400 200 L 370 190 L 370 210 Z" fill="#8b7355" />
                 </svg>
              </div>

              {/* Decorative Scooped Corners */}
              <div className={styles.cornerTL} />
              <div className={styles.cornerTR} />
              <div className={styles.cornerBL} />
              <div className={styles.cornerBR} />
              
              <div className={styles.cardContent}>
                <div className={styles.topLabel}>THE CALM BEFORE THE STORM</div>
                <h1 className={styles.title}>ELITE TOURNAMENT</h1>
                
                <div className={styles.separator}>
                  <div className={styles.sepLine} />
                  <div className={styles.sepDiamond} />
                  <div className={styles.sepLine} />
                </div>
                
                <p className={styles.subtitle}>
                  Step into the high-stakes arena where legends are made.<br />
                  Test your luck and strategy against the finest players.
                </p>

                <div className={styles.playerBanner}>
                  <div className={styles.bannerLeft}>
                    <div className={styles.trophyIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#d4bc81', fill: 'rgba(212,188,129,0.1)' }}>
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                        <path d="M4 22h16" />
                        <path d="M10 14.66V17c0 .55-.47.98-1 1h6c-.53-.02-1-.45-1-1v-2.34" />
                        <path d="M8 4h8l-1 10.66A2 2 0 0 1 13.01 16h-2.02A2 2 0 0 1 9 14.66L8 4z" />
                      </svg>
                    </div>
                    <div className={styles.playerInfo}>
                      <div className={styles.challengerLabel}>CHALLENGER</div>
                      <div className={styles.playerName}>{userProfile.name}</div>
                    </div>
                  </div>
                  
                  <div className={styles.bannerDivider} />
                  
                  <div className={styles.bannerRight}>
                    <div className={styles.readyText}>Are You Ready?</div>
                    <div className={styles.precisionText}>PRECISION • GLORY</div>
                  </div>
                </div>

                <button
                  className={styles.enterButton}
                  onClick={handleStartTournament}
                  disabled={isCreating}
                >
                  {isCreating ? 'PREPARING ARENA...' : 'ENTER TOURNAMENT'}
                </button>

                <div className={styles.footerText}>
                  ENTRY: FREE <span className={styles.dot}>•</span> PRIZE: GLORY & GOLD
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
