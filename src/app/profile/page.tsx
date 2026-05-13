'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRef } from 'react';
import { 
  User, 
  Trophy, 
  Star, 
  Camera, 
  Award, 
  ShieldCheck, 
  Target,
  Crown,
  Zap,
  ChevronLeft
} from 'lucide-react';
import styles from '@/app/tournament/tournament.module.css';

const AVAILABLE_AVATARS = [
  'default', 'crown', 'diamond', 'star', 'spade', 'heart',
  'club', 'dice', 'chip', 'trophy', 'bolt'
];

export default function ProfilePage() {
  const { user, userProfile, setUserProfile, isLoading } = useGame();
  const router = useRouter();
  
  const [name, setName] = useState(userProfile?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.avatar || 'default');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setSelectedAvatar(userProfile.avatar);
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await setUserProfile({ ...userProfile, name: name.trim(), avatar: selectedAvatar });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/lobby');
      }, 1500);
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

  const generateRandomAvatar = () => {
    const others = AVAILABLE_AVATARS.filter(a => a !== selectedAvatar);
    const random = others[Math.floor(Math.random() * others.length)];
    setSelectedAvatar(random);
  };

  const generateDynamicAvatar = () => {
    const styles = ['avataaars', 'bottts', 'pixel-art', 'lorelei', 'notionists'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const seed = Math.random().toString(36).substring(7);
    const url = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${seed}`;
    setSelectedAvatar(url);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8d9b8]">
        <div className="text-[#0f2318] font-bold tracking-widest uppercase">Loading Registry...</div>
      </div>
    );
  }

  const isCustomAvatar = selectedAvatar?.startsWith('http') || selectedAvatar?.startsWith('/');

  return (
    <div className={styles.page} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
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
            <span className={styles.logoText}>JUNKO BODIE</span>
            <span className={styles.logoSeparator}>|</span>
            <span className={styles.logoSub}>Member Registry</span>
          </div>
        </div>
        <div /> {/* Spacer for flex-between */}
      </header>

      <main className={styles.main} style={{ padding: '0vh 20px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          className={styles.card}
          style={{ maxWidth: '1100px', width: '95%' }}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Corner Notches */}
          <div className={styles.cornerTL} />
          <div className={styles.cornerTR} />
          <div className={styles.cornerBL} />
          <div className={styles.cornerBR} />

          <div className={styles.cardContent} style={{ padding: '4vh 50px', display: 'flex', flexDirection: 'column', gap: '4vh' }}>
            {/* 1. Header Section */}
            <div className="flex flex-col items-center">
               <div className="flex items-center gap-6 mb-2 opacity-30">
                  <div className="w-20 h-[1px] bg-[#c9a44c]" />
                  <span className="text-[10px] font-bold text-[#8b6914] uppercase tracking-[0.5em]">Official Protocol ID</span>
                  <div className="w-20 h-[1px] bg-[#c9a44c]" />
               </div>
               <h1 className="text-5xl md:text-6xl font-bold text-[#0f2318] m-0 leading-none" style={{ fontFamily: 'Georgia, serif', fontVariant: 'small-caps' }}>
                 Member Profile
               </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
              {/* Left Column: Avatar & Name & Merits */}
              <div className="md:col-span-5 flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-36 h-36 md:w-48 md:h-48 rounded-full bg-white border-8 border-[#c9a44c] shadow-xl overflow-hidden flex items-center justify-center">
                    {isCustomAvatar ? (
                      <img src={selectedAvatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <AvatarIcon type={selectedAvatar} size={72} color="#0f2318" />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-[#c9a44c] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleFileClick}
                    disabled={isUploading}
                    className="absolute bottom-1 right-1 bg-[#0f2318] p-2.5 rounded-full border-2 border-[#c9a44c] text-[#c9a44c] hover:bg-[#c9a44c] hover:text-[#0f2318] transition-all cursor-pointer shadow-lg active:scale-95"
                  >
                    <Camera size={16} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                <div className="w-full space-y-2">
                  <label className="text-[10px] font-bold text-[#8b6914] uppercase tracking-[0.4em] block text-center opacity-50">Identity Name</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    className="w-full bg-[#0f2318]/5 border-b-2 border-[#c9a44c] px-6 py-3 text-3xl font-bold text-[#0f2318] text-center focus:outline-none focus:bg-white transition-all rounded-t-xl"
                    style={{ fontFamily: 'Georgia, serif' }}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-bold text-[#8b6914] uppercase tracking-[0.2em] opacity-50">Merits:</span>
                  <div className="flex gap-3">
                    <BadgeIcon active={userProfile?.badges?.champion} type="champion" />
                    <BadgeIcon active={userProfile?.badges?.elite_status} type="elite" />
                    <BadgeIcon active={userProfile?.badges?.all_time_champion} type="all_time" />
                  </div>
                </div>
              </div>

              {/* Right Column: Stats & Picker */}
              <div className="md:col-span-7 flex flex-col gap-8">
                {/* Stats Ledger - INCREASED HEIGHT */}
                <div className={styles.champCard} style={{ background: 'white', transform: 'none', margin: 0 }}>
                  <div className="p-4 border-b border-[#c9a44c]/20 flex items-center gap-4">
                    <Award size={18} className="text-[#0f2318]" />
                    <h3 className="text-sm font-bold text-[#0f2318] uppercase tracking-[0.2em] m-0">Season Standings</h3>
                  </div>
                  <div className="flex">
                    <div className="flex-1 p-8 text-center border-r border-[#c9a44c]/10">
                      <span className="text-[10px] font-bold text-[#8b6914] uppercase tracking-widest block mb-1 opacity-60">Global Rank</span>
                      <span className="text-5xl font-bold text-[#b8892e] block" style={{ fontFamily: 'Georgia, serif' }}>#{userProfile?.season?.rank || '—'}</span>
                    </div>
                    <div className="flex-1 p-8 text-center">
                      <span className="text-[10px] font-bold text-[#8b6914] uppercase tracking-widest block mb-1 opacity-60">Total Points</span>
                      <span className="text-5xl font-bold text-[#0f2318] block" style={{ fontFamily: 'Georgia, serif' }}>{(userProfile?.season?.points || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Icon Picker - INCREASED HEIGHT */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-[#8b6914] uppercase tracking-[0.3em] px-2 opacity-50">Select Protocol Icon</label>
                  <div className="grid grid-cols-6 sm:grid-cols-11 gap-3 p-5 bg-white/40 rounded-2xl border border-[#c9a44c]/20 shadow-inner">
                    {AVAILABLE_AVATARS.map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all ${
                          selectedAvatar === avatar 
                            ? 'bg-[#c9a44c] text-[#0f2318] shadow-lg scale-110 z-10' 
                            : 'bg-white/60 text-[#0f2318]/30 hover:bg-white/80 hover:text-[#0f2318]'
                        }`}
                      >
                        <AvatarIcon type={avatar} size={20} color="currentColor" />
                      </button>
                    ))}
                    <button
                      onClick={generateRandomAvatar}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-white/60 text-[#0f2318]/30 hover:bg-[#c9a44c]/20 hover:text-[#0f2318] transition-all border border-dashed border-[#c9a44c]/40"
                      title="Generate Random Icon"
                    >
                      <Zap size={20} />
                    </button>
                    <button
                      onClick={generateDynamicAvatar}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-white/60 text-[#0f2318]/30 hover:bg-[#c9a44c]/20 hover:text-[#0f2318] transition-all border border-dashed border-[#c9a44c]/40"
                      title="Create Unique Avatar"
                    >
                      <User size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Action Section */}
            <div className="flex justify-center mt-2">
               <button 
                 className={styles.enterButton}
                 style={{ maxWidth: '480px', width: '100%', padding: '20px 48px', fontSize: '16px' }}
                 onClick={handleSave}
                 disabled={isSaving || isUploading || !name.trim()}
               >
                 {isSaving ? 'Verifying Identity...' : showSuccess ? 'Identity Verified ✓' : 'Authorize & Update Registry'}
               </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function AvatarIcon({ type, size, color }: { type: string; size: number; color: string }) {
  const iconProps = { size, color };
  switch (type) {
    case 'default': return <User {...iconProps} />;
    case 'crown': return <Crown {...iconProps} />;
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

function BadgeIcon({ active, type }: { active?: boolean; type: string }) {
  const getIcon = () => {
    switch (type) {
      case 'champion': return <Trophy size={16} />;
      case 'elite': return <ShieldCheck size={16} />;
      case 'all_time': return <Star size={16} />;
      default: return null;
    }
  };

  return (
    <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
      active 
        ? 'bg-[#c9a44c]/10 border-[#c9a44c] text-[#8b6914]' 
        : 'bg-black/5 border-black/10 text-black/10 grayscale'
    }`}>
      {getIcon()}
    </div>
  );
}
