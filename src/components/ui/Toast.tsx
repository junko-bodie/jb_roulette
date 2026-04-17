'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'error' | 'success' | 'info';
  duration?: number;
}

export default function Toast({ message, isVisible, onClose, type = 'error', duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  const bgColors = {
    error: 'linear-gradient(135deg, #441a1a 0%, #2a0a0a 100%)',
    success: 'linear-gradient(135deg, #1a442b 0%, #0a2a1a 100%)',
    info: 'linear-gradient(135deg, #1a2b44 0%, #0a1a2a 100%)',
  };

  const borderColors = {
    error: '#c73c4d',
    success: '#2b5a26',
    info: '#1e5a8a',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl border-2 shadow-2xl pointer-events-none"
          style={{
            background: bgColors[type],
            borderColor: borderColors[type],
            color: '#fff',
            fontFamily: 'var(--font-inter)',
            fontWeight: 600,
            letterSpacing: '0.05em',
            boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 15px ${borderColors[type]}44`,
          }}
        >
          <div className="flex items-center gap-3">
            {type === 'error' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#c73c4d]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
