'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { createClient } from '@/lib/supabase/client';
import { Trophy, Star, ShieldCheck, User, X, Camera, Zap, ChevronRight, Award, Target } from 'lucide-react';
import { COLORS, FONTS } from '@/styles/theme';
import styles from '@/app/tournament/tournament.module.css';


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
  const [name, setName] = useState(userProfile?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.avatar || 'default');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && userProfile) {
      setName(userProfile.name);
      setSelectedAvatar(userProfile.avatar);
    }
  }, [isOpen, userProfile]);

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

  const isCustomAvatar = selectedAvatar?.startsWith('http') || selectedAvatar?.startsWith('/');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#06140e]/90 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Card (Using Tournament Aesthetic) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={styles.card}
            style={{ maxWidth: '500px', background: '#f5edd5' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Corner Notches */}
            <div className={styles.cornerTL} />
            <div className={styles.cornerTR} />
            <div className={styles.cornerBL} />
            <div className={styles.cornerBR} />

            <div className={styles.cardContent} style={{ padding: '32px' }}>
              {/* Header */}
              <div className="w-full flex items-center justify-between mb-6">
                <span className="text-[10px] font-bold text-[#8b6914] uppercase tracking-[0.2em]">Member ID Card</span>
                <button onClick={onClose} className="text-[#0f2318]/40 hover:text-[#0f2318] transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Identity Section */}
              <div className="flex flex-col items-center gap-6 w-full mb-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-white border-2 border-[#c9a44c] shadow-lg overflow-hidden flex items-center justify-center">
                    {isCustomAvatar ? (
                      <img src={selectedAvatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <AvatarIcon type={selectedAvatar} size={40} color="#0f2318" />
                    )}
                  </div>
                  <button 
                    onClick={handleFileClick}
                    className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera size={18} />
                  </button>
                </div>

                <div className="w-full">
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    className="w-full bg-transparent border-b border-[#c9a44c] py-2 text-center text-xl font-bold text-[#0f2318] focus:outline-none focus:border-[#0f2318] transition-all"
                    placeholder="Enter Name..."
                    style={{ fontFamily: 'Georgia, serif' }}
                  />
                  <div className="text-[9px] font-bold text-[#c9a44c] uppercase tracking-widest text-center mt-2">Display Name</div>
                </div>
              </div>

              {/* Avatar Picker */}
              <div className="w-full mb-8">
                <div className="grid grid-cols-6 gap-2 p-3 bg-black/5 rounded-xl border border-[#c9a44c]/20">
                  {AVAILABLE_AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                        selectedAvatar === avatar 
                          ? 'bg-[#c9a44c] text-[#0f2318] shadow-md scale-110' 
                          : 'bg-white/40 text-[#0f2318]/40 hover:bg-white/60'
                      }`}
                    >
                      <AvatarIcon type={avatar} size={14} color="currentColor" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="w-full grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/50 border border-[#c9a44c]/20 p-3 rounded-lg text-center">
                  <span className="text-[8px] font-bold text-[#8b6914] uppercase tracking-widest block mb-1">Season Rank</span>
                  <span className="text-xl font-bold text-[#0f2318]" style={{ fontFamily: 'Georgia, serif' }}>
                    #{userProfile?.season?.rank || '—'}
                  </span>
                </div>
                <div className="bg-white/50 border border-[#c9a44c]/20 p-3 rounded-lg text-center">
                  <span className="text-[8px] font-bold text-[#8b6914] uppercase tracking-widest block mb-1">Season Points</span>
                  <span className="text-xl font-bold text-[#0f2318]" style={{ fontFamily: 'Georgia, serif' }}>
                    {(userProfile?.season?.points || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <button 
                className={styles.enterButton}
                onClick={handleSave}
                disabled={isSaving || isUploading || !name.trim()}
              >
                {isSaving ? 'Saving...' : 'Update Member ID'}
              </button>
            </div>
          </motion.div>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
        </div>
      )}
    </AnimatePresence>
  );
}

function AvatarIcon({ type, size, color }: { type: string; size: number; color: string }) {
  const iconProps = { size, color };
  switch (type) {
    case 'default': return <User {...iconProps} />;
    case 'crown': return <Trophy {...iconProps} />;
    case 'diamond': return <Star {...iconProps} />;
    case 'star': return <Star {...iconProps} />;
    case 'spade': return <span style={{ color, fontSize: size, fontWeight: 900 }}>♠</span>;
    case 'heart': return <span style={{ color, fontSize: size, fontWeight: 900 }}>♥</span>;
    case 'club': return <span style={{ color, fontSize: size, fontWeight: 900 }}>♣</span>;
    case 'dice': return <Award {...iconProps} />;
    case 'chip': return <Target {...iconProps} />;
    case 'trophy': return <Trophy {...iconProps} />;
    case 'bolt': return <ShieldCheck {...iconProps} />;
    default: return <User {...iconProps} />;
  }
}