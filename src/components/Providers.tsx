'use client';

import { GameProvider } from '@/context/GameContext';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GameProvider>
      {children}
    </GameProvider>
  );
}
