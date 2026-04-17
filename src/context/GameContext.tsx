'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

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
  isPopupEnabled: boolean;
  setIsPopupEnabled: (value: boolean) => void;
  isTournamentMode: boolean;
  setIsTournamentMode: (value: boolean) => void;
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  startingBalance: number;
  setStartingBalance: (value: number) => void;
  user: User | null;
  isLoading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState(1000);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isTimerEnabled, setIsTimerEnabled] = useState(true);
  const [isPopupEnabled, setIsPopupEnabled] = useState(true);
  const [isTournamentMode, setIsTournamentMode] = useState(false);
  const [startingBalance, setStartingBalance] = useState(1000);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Player',
    avatar: '/avatars/default.png',
  });

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load profile and balance from DB or local storage
  useEffect(() => {
    async function loadProfile() {
      if (user) {
        // Set initial name/avatar from user metadata while we wait for DB
        setUserProfile(prev => ({
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || prev.name,
          avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || prev.avatar,
        }));

        try {
          const res = await fetch('/api/user/profile');
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`API error (${res.status}): ${text.substring(0, 100)}`);
          }
          const data = await res.json();
          if (data && !data.error) {
            setBalance(Number(data.balance) || 1000);
            setIsSoundEnabled(data.is_sound_enabled ?? true);
            setIsTimerEnabled(data.is_timer_enabled ?? true);
            setIsPopupEnabled(data.is_popup_enabled ?? true);
            setStartingBalance(data.starting_balance ?? 1000);
            setUserProfile({
              name: data.name || user.user_metadata?.full_name || 'Player',
              avatar: data.avatar_url || user.user_metadata?.avatar_url || '/avatars/default.png',
            });
            return;
          }
        } catch (e) {
          console.warn('Failed to load DB profile, falling back to local storage:', e);
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
          setIsPopupEnabled(parsed.isPopupEnabled ?? true);
          setStartingBalance(parsed.startingBalance ?? 1000);
          setUserProfile(parsed.userProfile ?? { name: 'Player', avatar: '/avatars/default.png' });
        } catch (e) {
          console.error('Failed to parse settings', e);
        }
      }
    }
    loadProfile();
  }, [user]);

  // Save changes to DB or local storage
  useEffect(() => {
    const settings = {
      balance,
      isSoundEnabled,
      isTimerEnabled: isTournamentMode ? true : isTimerEnabled,
      isPopupEnabled,
      startingBalance,
      userProfile,
    };
    
    localStorage.setItem('roulette_settings', JSON.stringify(settings));

    if (user) {
      fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userProfile.name,
          avatar_url: userProfile.avatar,
          is_sound_enabled: isSoundEnabled,
          is_timer_enabled: isTimerEnabled,
          is_popup_enabled: isPopupEnabled,
          starting_balance: startingBalance,
        }),
      }).catch(e => console.error('Failed to save DB profile', e));
      
      if (balance !== undefined) {
        fetch('/api/user/balance', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: balance, action: 'set' }),
        }).catch(e => console.error('Failed to sync DB balance', e));
      }
    }

    import('@/lib/audioEngine').then(({ soundEngine }) => {
      if (soundEngine) soundEngine.setEnabled(isSoundEnabled);
    });
  }, [balance, isSoundEnabled, isTimerEnabled, userProfile, isTournamentMode, user]);

  return (
    <GameContext.Provider
      value={{
        balance,
        setBalance,
        isSoundEnabled,
        setIsSoundEnabled,
        isTimerEnabled: isTournamentMode ? true : isTimerEnabled,
        setIsTimerEnabled,
        isPopupEnabled,
        setIsPopupEnabled,
        isTournamentMode,
        setIsTournamentMode,
        startingBalance,
        setStartingBalance,
        userProfile,
        setUserProfile,
        user,
        isLoading,
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
