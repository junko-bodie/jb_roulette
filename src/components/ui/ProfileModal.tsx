'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { createClient } from '@/lib/supabase/client';
import { Trophy, Star, ShieldCheck, User, X, Camera, Zap, ChevronRight } from 'lucide-react';
import { COLORS, FONTS } from '@/styles/theme';
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-[420px] rounded-2xl overflow-hidden"
            style={{
              background: '#0d0d0d',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.7)',
            }}
          >
            {/* Top accent line */}
            <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)' }} />

            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-6 pb-5">
              <span style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase' }}>
                Profile
              </span>
              <button
                onClick={onClose}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'color 0.15s'
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                <X size={13} />
              </button>
            </div>

            {/* Body */}
            <div className="px-7 pb-7 flex flex-col gap-6">

              {/* Avatar + Name */}
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    style={{
                      width: 72, height: 72, borderRadius: 16,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      overflow: 'hidden', position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    className="group"
                  >
                    {isCustomAvatar ? (
                      <img src={selectedAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <AvatarIcon type={selectedAvatar} size={24} color="rgba(212,175,55,0.6)" />
                    )}
                    <button
                      onClick={handleFileClick}
                      style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.65)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.15s', color: 'white', cursor: 'pointer'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                    >
                      <Camera size={16} />
                    </button>
                  </div>
                </div>

                {/* Name input */}
                <div className="flex flex-col flex-1 gap-1">
                  <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10, padding: '10px 12px',
                      color: 'white', fontSize: '14px', fontWeight: 600,
                      outline: 'none', width: '100%',
                      fontFamily: FONTS.primary,
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                    placeholder="Enter name…"
                  />
                </div>
              </div>

              {/* Avatar Picker */}
              <div>
                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
                  Icon
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                  {AVAILABLE_AVATARS.map((avatar) => {
                    const active = selectedAvatar === avatar;
                    return (
                      <button
                        key={avatar}
                        onClick={() => setSelectedAvatar(avatar)}
                        style={{
                          aspectRatio: '1',
                          borderRadius: 10,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: active ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                          border: active ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.05)',
                          color: active ? 'rgba(212,175,55,1)' : 'rgba(212,175,55,0.45)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(212,175,55,0.8)'; } }}
                        onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(212,175,55,0.45)'; } }}
                      >
                        <AvatarIcon type={avatar} size={14} color="currentColor" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <StatCell label="Points" value={userProfile.season?.points ?? 0} />
                <StatCell label="Global Rank" value={userProfile.season?.rank ? `#${userProfile.season.rank}` : '—'} accent />
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 12, padding: '14px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <MiniStat label="Played" value={userProfile.stats?.tournaments_played ?? 0} />
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.06)' }} />
                <MiniStat label="Won" value={userProfile.stats?.tournaments_won ?? 0} accent />
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.06)' }} />
                <MiniStat label="Best" value={userProfile.stats?.best_finish ? `#${userProfile.stats.best_finish}` : '—'} />
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <BadgeIcon active={userProfile.badges?.champion} type="champion" />
                <BadgeIcon active={userProfile.badges?.elite_status} type="elite" />
                <BadgeIcon active={userProfile.badges?.all_time_champion} type="all_time" />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>
                <button
                  onClick={handleSave}
                  disabled={isSaving || isUploading || !name.trim()}
                  style={{
                    width: '100%', padding: '13px 20px',
                    background: (isSaving || isUploading || !name.trim()) ? 'rgba(255,255,255,0.08)' : 'white',
                    color: (isSaving || isUploading || !name.trim()) ? 'rgba(255,255,255,0.2)' : 'black',
                    borderRadius: 12, fontSize: '11px', fontWeight: 800,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    cursor: (isSaving || isUploading || !name.trim()) ? 'not-allowed' : 'pointer',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSaving && !isUploading && name.trim()) e.currentTarget.style.background = 'rgba(212,175,55,1)'; }}
                  onMouseLeave={e => { if (!isSaving && !isUploading && name.trim()) e.currentTarget.style.background = 'white'; }}
                >
                  <span>{isSaving ? 'Saving…' : isUploading ? 'Uploading…' : 'Save Profile'}</span>
                  {!isSaving && !isUploading && <ChevronRight size={13} />}
                </button>

                <button
                  onClick={onClose}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)',
                    padding: '6px', transition: 'color 0.15s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.18)')}
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Bottom accent line */}
            <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)' }} />
          </motion.div>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCell({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 12, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
        {label}
      </span>
      <span style={{
        fontSize: '18px', fontWeight: 800, lineHeight: 1,
        color: accent ? 'rgba(212,175,55,1)' : 'white',
      }}>
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
        {label}
      </span>
      <span style={{ fontSize: '14px', fontWeight: 700, color: accent ? 'rgba(212,175,55,1)' : 'white' }}>
        {value}
      </span>
    </div>
  );
}

function BadgeIcon({ active, type }: { active?: boolean; type: string }) {
  const getIcon = () => {
    switch (type) {
      case 'champion': return <Trophy size={14} />;
      case 'elite': return <ShieldCheck size={14} />;
      case 'all_time': return <Star size={14} />;
      default: return null;
    }
  };

  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
      border: active ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.05)',
      color: active ? 'rgba(212,175,55,1)' : 'rgba(255,255,255,0.08)',
    }}>
      {getIcon()}
    </div>
  );
}

function AvatarIcon({ type, size, color }: { type: string; size: number; color: string }) {
  const style = { color, fontSize: size - 2 };
  const iconProps = { size, color };
  switch (type) {
    case 'default': return <User {...iconProps} />;
    case 'crown': return <Trophy {...iconProps} />;
    case 'diamond': return <Star {...iconProps} />;
    case 'star': return <Star {...iconProps} />;
    case 'spade': return <span style={style}>♠</span>;
    case 'heart': return <span style={style}>♥</span>;
    case 'club': return <span style={style}>♣</span>;
    case 'dice': return <Zap {...iconProps} />;
    case 'chip': return <Zap {...iconProps} />;
    case 'trophy': return <Trophy {...iconProps} />;
    case 'bolt': return <Zap {...iconProps} />;
    default: return <span style={{ ...style, fontWeight: 700 }}>{type[0].toUpperCase()}</span>;
  }
}