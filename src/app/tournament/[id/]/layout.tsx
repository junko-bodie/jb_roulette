'use client';

import { TournamentProvider } from '@/lib/tournament/TournamentContext';
import React from 'react';

export default function TournamentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TournamentProvider>
      {children}
    </TournamentProvider>
  );
}
