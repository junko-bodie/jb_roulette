import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import styles from './modal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSession?: () => void;
}

export default function SettingsModal({ isOpen, onClose, onResetSession }: SettingsModalProps) {
  const { 
    isSoundEnabled, 
    setIsSoundEnabled, 
    isTimerEnabled, 
    setIsTimerEnabled, 
    isPopupEnabled,
    setIsPopupEnabled,
    isTournamentMode,
    startingBalance,
    setStartingBalance,
    setBalance,
  } = useGame();

  const [resetState, setResetState] = useState<'idle' | 'resetting' | 'success'>('idle');
  const [resetSessionState, setResetSessionState] = useState<'idle' | 'resetting' | 'success'>('idle');

  const handleResetBalance = async () => {
    setResetState('resetting');
    // Simulate a brief premium "thinking" time
    await new Promise(r => setTimeout(r, 600));
    setBalance(startingBalance);
    setResetState('success');
    
    // Return to idle after feedback
    setTimeout(() => setResetState('idle'), 2000);
  };

  const handleResetSession = async () => {
    if (!onResetSession) return;
    setResetSessionState('resetting');
    await new Promise(r => setTimeout(r, 400));
    onResetSession();
    setResetSessionState('success');
    setTimeout(() => setResetSessionState('idle'), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={styles.cardSettings}
          >
            <div className={styles.header}>
              <div>
                <h2 className={styles.headerTitle}>Game Settings</h2>
                <p className={styles.headerSub}>Preferences</p>
              </div>
              <button onClick={onClose} className={styles.closeBtn}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={styles.content}>
              <div className={styles.settingsRow}>
                <div className={styles.settingsInfo}>
                  <span className={styles.settingsLabel}>Sound Effects</span>
                  <span className={styles.settingsDesc}>Game audio & clicks</span>
                </div>
                <button
                  onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                  className={`${styles.toggle} ${isSoundEnabled ? styles.toggleActive : ''}`}
                >
                  <motion.div
                    className={styles.toggleThumb}
                    animate={{ x: isSoundEnabled ? 22 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <div className={styles.settingsRow}>
                <div className={styles.settingsInfo}>
                  <span className={styles.settingsLabel}>Betting Timer</span>
                  <span className={styles.settingsDesc}>Auto-spin protection</span>
                  {isTournamentMode && (
                    <span className="text-[10px] text-[#c9a44c] font-black uppercase mt-1 tracking-wider">Mandatory in Tournament</span>
                  )}
                </div>
                <button
                  disabled={isTournamentMode}
                  onClick={() => setIsTimerEnabled(!isTimerEnabled)}
                  className={`${styles.toggle} ${isTimerEnabled ? styles.toggleActive : ''} ${isTournamentMode ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <motion.div
                    className={styles.toggleThumb}
                    animate={{ x: isTimerEnabled ? 22 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <div className={styles.settingsRow}>
                <div className={styles.settingsInfo}>
                  <span className={styles.settingsLabel}>Popup Screen</span>
                  <span className={styles.settingsDesc}>Winning number result</span>
                </div>
                <button
                  onClick={() => setIsPopupEnabled(!isPopupEnabled)}
                  className={`${styles.toggle} ${isPopupEnabled ? styles.toggleActive : ''}`}
                >
                  <motion.div
                    className={styles.toggleThumb}
                    animate={{ x: isPopupEnabled ? 22 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <div className={styles.field}>
                <div className={styles.settingsInfo}>
                  <span className={styles.settingsLabel}>Starting Bankroll</span>
                  <span className={styles.settingsDesc}>Default balance for new sessions</span>
                </div>
                <div className={styles.segmented}>
                  {[500, 1000, 2000, 5000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setStartingBalance(amount)}
                      className={`${styles.segmentBtn} ${startingBalance === amount ? styles.segmentBtnActive : ''}`}
                    >
                      ${amount < 1000 ? amount : `${amount / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.settingsRow} style={{ marginTop: '4px', border: '1px solid rgba(201, 164, 76, 0.2)', background: 'rgba(201, 164, 76, 0.05)' }}>
                <div className={styles.settingsInfo}>
                  <span className={styles.settingsLabel} style={{ color: '#c9a44c' }}>Reset Account</span>
                  <span className={styles.settingsDesc}>Set balance back to starting amount</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResetBalance}
                  disabled={resetState !== 'idle'}
                  className={styles.btnAction}
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: '11px', 
                    background: resetState === 'success' ? '#22c55e' : 'rgba(201, 164, 76, 0.1)', 
                    color: resetState === 'success' ? '#fff' : '#c9a44c',
                    border: `1px solid ${resetState === 'success' ? '#22c55e' : 'rgba(201, 164, 76, 0.3)'}`,
                    minWidth: '100px',
                    transition: 'background 0.3s, color 0.3s, border-color 0.3s'
                  }}
                >
                  <AnimatePresence mode="wait">
                    {resetState === 'idle' && (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                      >
                        Reset Now
                      </motion.span>
                    )}
                    {resetState === 'resetting' && (
                      <motion.span
                        key="resetting"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                      >
                        Resetting...
                      </motion.span>
                    )}
                    {resetState === 'success' && (
                      <motion.span
                        key="success"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                      >
                        Done!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>

              {onResetSession && (
                <div className={styles.settingsRow} style={{ marginTop: '4px', border: '1px solid rgba(201, 164, 76, 0.2)', background: 'rgba(201, 164, 76, 0.05)' }}>
                  <div className={styles.settingsInfo}>
                    <span className={styles.settingsLabel} style={{ color: '#c9a44c' }}>Reset Session Stats</span>
                    <span className={styles.settingsDesc}>Clear session win/loss totals</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleResetSession}
                    disabled={resetSessionState !== 'idle'}
                    className={styles.btnAction}
                    style={{ 
                      padding: '8px 16px', 
                      fontSize: '11px', 
                      background: resetSessionState === 'success' ? '#22c55e' : 'rgba(201, 164, 76, 0.1)', 
                      color: resetSessionState === 'success' ? '#fff' : '#c9a44c',
                      border: `1px solid ${resetSessionState === 'success' ? '#22c55e' : 'rgba(201, 164, 76, 0.3)'}`,
                      minWidth: '100px',
                      transition: 'background 0.3s, color 0.3s, border-color 0.3s'
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {resetSessionState === 'idle' && (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          Clear Now
                        </motion.span>
                      )}
                      {resetSessionState === 'resetting' && (
                        <motion.span
                          key="resetting"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          Clearing...
                        </motion.span>
                      )}
                      {resetSessionState === 'success' && (
                        <motion.span
                          key="success"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          Done!
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              )}
            </div>

            <div className={styles.footer}>
              <button onClick={onClose} className={styles.btnConfirm}>Done</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
