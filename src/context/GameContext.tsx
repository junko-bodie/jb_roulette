'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UserProfile {
  name: string;
  avatar: string;
}

interface GameContextType {
  balance: number;
  setBalance: (value: number | ((prev: number) => number)) => void;
  isSoundEnabled: boolean;
  setIsSoundEnabled: (value: boolean) => void;
  isTimerEnabled: boolean;
  setIsTimerEnabled: (value: boolean) => void;
  isTournamentMode: boolean;
  setIsTournamentMode: (value: boolean) => void;
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState(1000);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isTimerEnabled, setIsTimerEnabled] = useState(true);
  const [isTournamentMode, setIsTournamentMode] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Player',
    avatar: '/avatars/default.png',
  });

  // Load profile and balance from DB or local storage
  useEffect(() => {
    async function loadProfile() {
      if (status === 'authenticated') {
        try {
          const res = await fetch('/api/user/profile');
          const data = await res.json();
          if (data && !data.error) {
            setBalance(Number(data.balance) || 1000);
            setIsSoundEnabled(data.is_sound_enabled ?? true);
            setIsTimerEnabled(data.is_timer_enabled ?? true);
            setUserProfile({
              name: data.name,
              avatar: data.avatar_url || '/avatars/default.png'
            });
            return;
          }
        } catch (e) {
          console.error('Failed to load DB profile', e);
        }
      }

      // Fallback to local storage
      const saved = localStorage.getItem('roulette_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setBalance(parsed.balance ?? 1000);
          setIsSoundEnabled(parsed.isSoundEnabled ?? true);
          setIsTimerEnabled(parsed.isTimerEnabled ?? true);
          setUserProfile(parsed.userProfile ?? { name: 'Player', avatar: '/avatars/default.png' });
        } catch (e) {
          console.error('Failed to parse settings', e);
        }
      }
    }
    loadProfile();
  }, [status]);

  // Save changes to DB or local storage
  useEffect(() => {
    const settings = {
      balance,
      isSoundEnabled,
      isTimerEnabled: isTournamentMode ? true : isTimerEnabled,
      userProfile,
    };
    
    localStorage.setItem('roulette_settings', JSON.stringify(settings));

    if (status === 'authenticated') {
      fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userProfile.name,
          avatar_url: userProfile.avatar,
          is_sound_enabled: isSoundEnabled,
          is_timer_enabled: isTimerEnabled
        })
      }).catch(e => console.error('Failed to save DB profile', e));
      
      // Update balance separately to avoid race conditions or use a queue
      fetch('/api/user/balance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: balance, action: 'set' })
      }).catch(e => console.error('Failed to sync DB balance', e));
    }

    import('@/lib/audioEngine').then(({ soundEngine }) => {
      if (soundEngine) soundEngine.setEnabled(isSoundEnabled);
    });
  }, [balance, isSoundEnabled, isTimerEnabled, userProfile, isTournamentMode, status]);

  return (
    <GameContext.Provider
      value={{
        balance,
        setBalance,
        isSoundEnabled,
        setIsSoundEnabled,
        isTimerEnabled: isTournamentMode ? true : isTimerEnabled,
        setIsTimerEnabled,
        isTournamentMode,
        setIsTournamentMode,
        userProfile,
        setUserProfile,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
