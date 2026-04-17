'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className={styles.page}>
      {/* Animated background orbs */}
      <div className={styles.bgOrbs}>
        <div className={styles.orbGold} />
        <div className={styles.orbGreen} />
        <div className={styles.orbAccent} />
      </div>

      {/* Floating decorative dots */}
      <div className={styles.floatingDots}>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={styles.dot}
            animate={{
              y: [0, -12, 0],
              opacity: [0.15, 0.4, 0.15],
            }}
            transition={{
              repeat: Infinity,
              duration: 3 + i * 0.5,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Top decorative line */}
        <motion.div
          className={styles.topLine}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
        />

        {/* Header */}
        <div className={styles.header}>
          <motion.h1
            className={styles.title}
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            JUNKO<br />BODIE
          </motion.h1>

          <motion.div
            className={styles.subtitleRow}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <span className={styles.subtitleLine} />
            <span className={styles.subtitleText}>Roulette Royale</span>
            <span className={styles.subtitleLineRight} />
          </motion.div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              className={styles.error}
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons */}
        <div className={styles.actions}>
          <motion.button
            className={styles.btnGoogle}
            whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogleLogin}
            disabled={isLoading}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className={styles.btnIcon} />
            <span>Continue with Google</span>
            <div className={styles.btnShimmer} />
          </motion.button>

          <motion.button
            className={styles.btnGuest}
            whileHover={{ scale: 1.03, borderColor: 'rgba(201, 164, 76, 0.6)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGuestLogin}
            disabled={isLoading}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            Enter as Guest
          </motion.button>
        </div>

        {/* Loading dots */}
        <div className={styles.dotsRow}>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.pulseDot}
              animate={{
                scale: [1, 1.6, 1],
                opacity: [0.25, 1, 0.25],
              }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.35 }}
            />
          ))}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Membership implies agreement to our<br />
            <span className={styles.footerLink}>Terms of Protocol</span> &amp;{' '}
            <span className={styles.footerLink}>Privacy Charter</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
