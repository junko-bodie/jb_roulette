'use client';

import { SessionProvider } from "next-auth/react";
import { GameProvider } from "@/context/GameContext";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GameProvider>
        {children}
      </GameProvider>
    </SessionProvider>
  );
}
