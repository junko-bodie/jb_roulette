'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { createClient } from '@/lib/supabase/client';
import styles from './modal.module.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_AVATARS = [
  'default', 'crown', 'diamond', 'star', 'spade', 'heart',
  'club', 'dice', 'chip', 'trophy', 'bolt'
];

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { userProfile, setUserProfile, user } = useGame();
  const supabase = createClient();
  const [name, setName] = useState(userProfile.name);
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setName(userProfile.name);
      setSelectedAvatar(userProfile.avatar);
    }
  }, [isOpen, userProfile.name, userProfile.avatar]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await setUserProfile({ name: name.trim(), avatar: selectedAvatar });
      onClose();
    } catch (error) {
      console.error('Failed to save profile', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type and size (2MB)
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit.');
        return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setSelectedAvatar(publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const isCustomAvatar = selectedAvatar.startsWith('http') || selectedAvatar.startsWith('/');
  const isPresetAvatar = AVAILABLE_AVATARS.includes(selectedAvatar);

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
            className={styles.cardProfile}
          >
            <div className={styles.header}>
              <div>
                <h2 className={styles.headerTitle}>Your Profile</h2>
                <p className={styles.headerSub}>Casino Identity</p>
              </div>
              <button onClick={onClose} className={styles.closeBtn}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={styles.content}>
              <div className={styles.field}>
                <label className={styles.label}>Player Handle</label>
                <input
                  type="text"
                  maxLength={20}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  placeholder="High Roller"
                />
              </div>

              <div className={styles.field}>
                <div className="flex items-center justify-between">
                  <label className={styles.label}>Choose your Avatar</label>
                  <button 
                    onClick={handleFileClick} 
                    disabled={isUploading}
                    className="text-[10px] font-black text-[#c9a44c] hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1.5"
                  >
                    {isUploading ? 'Uploading...' : 'Upload Custom'}
                    {!isUploading && (
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                        <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                <div className={styles.avatarGrid}>
                  {/* Custom Avatar Preview (Only if selected) */}
                  {(isCustomAvatar && !isPresetAvatar) && (
                    <button
                      onClick={() => setSelectedAvatar(selectedAvatar)}
                      className={styles.avatarOptionActive}
                    >
                      <img src={selectedAvatar} alt="custom" className="w-full h-full object-cover rounded-full" />
                    </button>
                  )}

                  {AVAILABLE_AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={selectedAvatar === avatar ? styles.avatarOptionActive : styles.avatarOption}
                    >
                      <AvatarIcon type={avatar} className={styles.avatarIcon} />
                    </button>
                  ))}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            <div className={styles.footer}>
              <button onClick={onClose} className={styles.btnCancel}>Discard</button>
              <button
                onClick={handleSave}
                disabled={isSaving || isUploading || !name.trim()}
                className={styles.btnConfirm}
              >
                {isSaving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function AvatarIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'default': return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg>;
    case 'crown': return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" /></svg>;
    case 'diamond': return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2L4.5 9.5L12 17l7.5-7.5L12 2zM19,11H5c-1.1,0-2,0.9-2,2v5c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2v-5C21,11.9,20.1,11,19,11z" /></svg>;
    case 'star': return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>;
    case 'spade': return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2C9 2 7 4.5 7 7s2 6 5 10c3-4 5-7.5 5-10s-2-5-5-5zM7 19h10v2H7v-2z" /></svg>;
    case 'heart': return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>;
    case 'club': return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2a4 4 0 00-4 4 4 4 0 004 4 4 4 0 004-4 4 4 0 00-4-4zm-4 8a4 4 0 00-4 4 4 4 0 004 4 4 4 0 004-4 4 4 0 00-4-4zm8 0a4 4 0 00-4 4 4 4 0 004 4 4 4 0 004-4 4 4 0 00-4-4zM10 22h4v-2h-4v2z" /></svg>;
    case 'dice': return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm10 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm5-5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" /></svg>;
    case 'chip': return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" /></svg>;
    case 'trophy': return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 12.9V18H9v2h6v-2h-2v-5.1a5.01 5.01 0 003.61-2.96C19.08 6.63 21 4.55 21 2V2c0-1.1-.9-2-2-2h-1zm-6 8c-1.65 0-3-1.35-3-3V4h6v3c0 1.65-1.35 3-3 3z" /></svg>;
    case 'bolt': return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8H7z" /></svg>;
    default: return <div className={className + " font-bold flex items-center justify-center uppercase"}>{type[0]}</div>;
  }
}
