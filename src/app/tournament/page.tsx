'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';
import { createClient } from '@/lib/supabase/client';
import { soundEngine } from '@/lib/audioEngine';
import styles from './tournament.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, VolumeX, SkipForward } from 'lucide-react';

export default function TournamentLobby() {
  const { user, userProfile, isLoading: isGameLoading, isSoundEnabled, isMusicEnabled } = useGame();
  const router = useRouter();
  const supabase = createClient();
  const [isCreating, setIsCreating] = useState(false);
  const [wheelType, setWheelType] = useState<'american' | 'european'>('american');

  // Video intro state
  const [viewMode, setViewMode] = useState<'loading' | 'movie' | 'lobby'>('loading');
  const [isMuted, setIsMuted] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isGameLoading && !user) {
      router.push('/');
    }
  }, [isGameLoading, user, router]);

  useEffect(() => {
    if (!isGameLoading && user) {
      const skipVideo = localStorage.getItem('hideTournamentVideo') === 'true';
      setViewMode(skipVideo ? 'lobby' : 'movie');
      setIsMuted(!isSoundEnabled);
    }
  }, [isGameLoading, user, isSoundEnabled]);

  const handleSkipIntro = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideTournamentVideo', 'true');
    }
    setViewMode('lobby');
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleStartTournament = async () => {
    setIsCreating(true);
    if (isSoundEnabled) {
      soundEngine?.playClick();
    }
    if (isMusicEnabled) {
      soundEngine?.playWaitingBackgroundMusic();
    }
    try {
      const response = await fetch('/api/tournament/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wheel_type: wheelType })
      });
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

  if (isGameLoading || !user || viewMode === 'loading') {
    return (
      <div className={styles.page} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#c9a44c', letterSpacing: '0.3em', fontWeight: 800 }}>LOADING...</span>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {viewMode === 'movie' ? (
        <motion.div
          key="movie"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
          className={styles.videoIntroContainer}
        >
          <div className={styles.videoFrame}>
            <div className={styles.videoHeader}>
              <div className={styles.videoTitleGroup}>
                <span className={styles.videoPreTitle}>BRIEFING ROOM</span>
                <h2 className={styles.videoMainTitle}>The Arena Awaits</h2>
              </div>
              <button
                onClick={() => router.push('/lobby')}
                className={styles.controlBtn}
                title="Back to Lobby"
              >
                <ChevronLeft size={14} strokeWidth={2.5} />
                <span>LOBBY</span>
              </button>
            </div>

            <div className={styles.videoWrapper}>
              <video
                ref={videoRef}
                autoPlay
                muted={isMuted}
                playsInline
                className={styles.videoElement}
                onEnded={handleSkipIntro}
              >
                <source src="/videos/export-2.mp4" type="video/mp4" />
              </video>
            </div>

            <div className={styles.videoFooter}>
              <div
                className={styles.checkboxContainer}
                onClick={() => setDontShowAgain(prev => !prev)}
              >
                <div className={`${styles.checkboxCustom} ${dontShowAgain ? styles.checkboxActive : ''}`}>
                  {dontShowAgain && (
                    <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
                      <polyline points="1.5,5 4,7.5 8.5,2" stroke="#c9a44c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className={styles.checkboxLabel}>Skip on future visits</span>
              </div>

              <div className={styles.videoControls}>
                <button
                  onClick={toggleMute}
                  className={`${styles.controlBtn} ${styles.volumeBtn}`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <button
                  onClick={handleSkipIntro}
                  className={`${styles.controlBtn} ${styles.skipBtn}`}
                >
                  <span>SKIP BRIEFING</span>
                  <SkipForward size={13} fill="currentColor" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="lobby"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={styles.page}
        >
          {/* Thin dark header */}
          <header className={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => router.push('/lobby')}
                className={styles.backBtn}
                title="Back to Lobby"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <div className={styles.logoGroup}>
                <span className={styles.logoText}>JUNKO BODIE ROULETTE</span>
                <span className={styles.logoSeparator}>|</span>
                <span className={styles.logoSub}>PRO TOURNAMENT SERIES</span>
              </div>
            </div>
            <button className={styles.signOutBtn} onClick={handleSignOut}>SIGN OUT</button>
          </header>

          <main className={styles.main}>
            <div className={styles.card}>
              {/* Gold border frame */}
              <div className={styles.cardBorder} />

              {/* Corner notch decorations */}
              <div className={styles.cornerTL} />
              <div className={styles.cornerTR} />
              <div className={styles.cornerBL} />
              <div className={styles.cornerBR} />

              {/* Compass / roulette watermark */}
              <div className={styles.watermark}>
                <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="250" cy="250" r="230" fill="none" stroke="#c9a44c" strokeWidth="1.5" strokeOpacity="0.35" />
                  <circle cx="250" cy="250" r="180" fill="none" stroke="#c9a44c" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="5 5" />
                  <circle cx="250" cy="250" r="120" fill="none" stroke="#c9a44c" strokeWidth="2" strokeOpacity="0.3" />
                  <circle cx="250" cy="250" r="30" fill="none" stroke="#c9a44c" strokeWidth="2" strokeOpacity="0.4" />
                  <circle cx="250" cy="250" r="12" fill="#c9a44c" fillOpacity="0.5" />
                  {/* Compass spikes */}
                  <path d="M250 20 L262 240 L250 250 L238 240 Z" fill="#c9a44c" fillOpacity="0.45" />
                  <path d="M250 480 L262 260 L250 250 L238 260 Z" fill="#c9a44c" fillOpacity="0.25" />
                  <path d="M20 250 L240 238 L250 250 L240 262 Z" fill="#c9a44c" fillOpacity="0.25" />
                  <path d="M480 250 L260 238 L250 250 L260 262 Z" fill="#c9a44c" fillOpacity="0.45" />
                  {/* Diagonal lines */}
                  <path d="M95 95 L244 244 M405 95 L256 244 M95 405 L244 256 M405 405 L256 256" stroke="#c9a44c" strokeWidth="1" strokeOpacity="0.2" />
                  {/* Tick marks */}
                  {Array.from({ length: 36 }).map((_, i) => {
                    const angle = (i * 10 * Math.PI) / 180;
                    const isMajor = i % 9 === 0;
                    const r1 = isMajor ? 195 : 205;
                    const r2 = 230;
                    return (
                      <line
                        key={i}
                        x1={250 + r1 * Math.cos(angle)}
                        y1={250 + r1 * Math.sin(angle)}
                        x2={250 + r2 * Math.cos(angle)}
                        y2={250 + r2 * Math.sin(angle)}
                        stroke="#c9a44c"
                        strokeWidth={isMajor ? 1.5 : 0.8}
                        strokeOpacity="0.3"
                      />
                    );
                  })}
                </svg>
              </div>

              <div className={styles.cardContent}>
                {/* Top label with flanking lines */}
                <div className={styles.topLabelRow}>
                  <div className={styles.labelLine} />
                  <span className={styles.topLabel}>THE CALM BEFORE THE STORM</span>
                  <div className={styles.labelLine} />
                </div>

                {/* Main title */}
                <h1 className={styles.title}>Ready To Prove You&rsquo;re the Best?</h1>

                {/* Separator */}
                <div className={styles.separator}>
                  <div className={styles.sepLine} />
                  <div className={styles.sepDiamond} />
                  <div className={styles.sepLine} />
                </div>

                {/* Subtitle */}
                <p className={styles.subtitle}>
                  You&rsquo;ve learned the rules. Now it&rsquo;s time to test your strategy and skill
                  <br />against other players in a combat format.
                </p>

                {/* Wheel Selection Toggle */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  width: '100%',
                  maxWidth: '420px',
                  position: 'relative',
                  zIndex: 5
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#8b6914',
                    textTransform: 'uppercase',
                    letterSpacing: '0.25em',
                    opacity: 0.7,
                    marginBottom: '4px'
                  }}>
                    Select Wheel Variant
                  </span>
                  <div style={{
                    display: 'flex',
                    background: 'rgba(15, 35, 24, 0.15)',
                    padding: '6px',
                    borderRadius: '100px',
                    border: '1.5px solid rgba(201, 164, 76, 0.25)',
                    width: '100%',
                    boxSizing: 'border-box',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <button
                      onClick={() => setWheelType('american')}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: '100px',
                        fontSize: '11px',
                        fontWeight: 900,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        transition: 'all 0.25s ease',
                        border: 'none',
                        cursor: 'pointer',
                        background: wheelType === 'american' ? '#c9a44c' : 'rgba(201, 164, 76, 0.08)',
                        color: wheelType === 'american' ? '#0f2318' : '#8b6914',
                        boxShadow: wheelType === 'american' ? '0 4px 15px rgba(201, 164, 76, 0.4)' : 'none',
                      }}
                    >
                      American (00)
                    </button>
                    <button
                      onClick={() => setWheelType('european')}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: '100px',
                        fontSize: '11px',
                        fontWeight: 900,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        transition: 'all 0.25s ease',
                        border: 'none',
                        cursor: 'pointer',
                        background: wheelType === 'european' ? '#c9a44c' : 'rgba(201, 164, 76, 0.08)',
                        color: wheelType === 'european' ? '#0f2318' : '#8b6914',
                        boxShadow: wheelType === 'european' ? '0 4px 15px rgba(201, 164, 76, 0.4)' : 'none',
                      }}
                    >
                      European (0)
                    </button>
                  </div>
                </div>

                {/* CTA Button */}
                <motion.button
                  className={styles.enterButton}
                  onClick={handleStartTournament}
                  disabled={isCreating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isCreating ? 'PREPARING ARENA...' : 'ENTER TOURNAMENT'}
                </motion.button>

                {/* Bottom info section ("6 Players" and below) */}
                <div className={styles.bottomSection}>
                  {/* Stats row */}
                  <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                      <svg className={styles.statIcon} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                      </svg>
                      <span className={styles.statText}>6 PLAYERS</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.statItem}>
                      <svg className={styles.statIcon} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                      </svg>
                      <span className={styles.statText}>PRIZE: CHAMPIONSHIP POINTS</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.statItem}>
                      <svg className={styles.statIcon} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.92 5H5L14 12 5 19h2l9-7z M19 5h-2L8 12l9 7h2L10 12z" opacity="0.9" />
                      </svg>
                      <span className={styles.statText}>5 ROUND ELIMINATION</span>
                    </div>
                  </div>

                  {/* Championship points card */}
                  <div className={styles.champCard}>
                    <div className={styles.champTop}>
                      <div className={styles.champIconCircle}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                          <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                        </svg>
                      </div>
                      <div className={styles.champInfo}>
                        <div className={styles.champTitle}>CHAMPIONSHIP POINTS</div>
                        <div className={styles.champDesc}>
                          Only the Top 3 players with a positive chip balance earn championship points.
                        </div>
                      </div>
                    </div>

                    <div className={styles.champPoints}>
                      <div className={styles.champCol}>
                        <div className={styles.champPlace}>1ST PLACE</div>
                        <div className={`${styles.champValue} ${styles.champGold}`}>+1000</div>
                        <LaurelIcon />
                        <div className={styles.champUnit}>POINTS</div>
                      </div>
                      <div className={styles.champDivider} />
                      <div className={styles.champCol}>
                        <div className={styles.champPlace}>2ND PLACE</div>
                        <div className={`${styles.champValue} ${styles.champGold}`}>+100</div>
                        <LaurelIcon />
                        <div className={styles.champUnit}>POINTS</div>
                      </div>
                      <div className={styles.champDivider} />
                      <div className={styles.champCol}>
                        <div className={styles.champPlace}>3RD PLACE</div>
                        <div className={`${styles.champValue} ${styles.champGold}`}>+50</div>
                        <LaurelIcon />
                        <div className={styles.champUnit}>POINTS</div>
                      </div>
                      <div className={styles.champDivider} />
                      <div className={styles.champCol}>
                        <div className={styles.champPlace}>BUSTED (0 CHIPS)</div>
                        <div className={`${styles.champValue} ${styles.champRed}`}>-50</div>
                        <LaurelIcon dimmed />
                        <div className={styles.champUnit}>POINTS</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* ═══ TRANSITION OVERLAY — Loading Arena ═══ */}
          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f2318]/95 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-24 h-24 mb-8 relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 rounded-full border-4 border-dashed border-[#c9a44c]/30"
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-2 rounded-full border-4 border-[#c9a44c] border-t-transparent shadow-[0_0_20px_rgba(201,164,76,0.4)]"
                    />
                  </div>
                  <motion.h2
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-3xl font-black text-white tracking-[0.3em] uppercase italic text-center px-6"
                    style={{ fontFamily: "'Georgia', serif", textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
                  >
                    Preparing Arena
                  </motion.h2>
                  <span className="text-[#c9a44c] text-[11px] uppercase tracking-[0.5em] mt-6 font-bold opacity-80">
                    Sharpening your chips...
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LaurelIcon({ dimmed = false }: { dimmed?: boolean }) {
  return (
    <svg
      viewBox="0 0 80 24"
      width="56"
      height="16"
      style={{ opacity: dimmed ? 0.35 : 0.75, margin: '4px auto 0' }}
    >
      {/* Left laurel */}
      <path d="M8 12 Q4 8 2 4 Q6 5 8 9 Q6 4 7 1 Q10 4 9 8 Q11 3 13 2 Q13 6 10 9 Q14 5 16 5 Q14 9 11 11" fill="none" stroke="#c9a44c" strokeWidth="1.2" strokeLinecap="round" />
      {/* Right laurel (mirrored) */}
      <path d="M72 12 Q76 8 78 4 Q74 5 72 9 Q74 4 73 1 Q70 4 71 8 Q69 3 67 2 Q67 6 70 9 Q66 5 64 5 Q66 9 69 11" fill="none" stroke="#c9a44c" strokeWidth="1.2" strokeLinecap="round" />
      {/* Center stem */}
      <path d="M36 18 Q40 14 44 18" fill="none" stroke="#c9a44c" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}