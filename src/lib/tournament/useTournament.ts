import { useTournamentContext } from './TournamentContext';

/**
 * useTournament hook
 * Main hook for accessing tournament state and actions.
 */
export function useTournament() {
  return useTournamentContext();
}
