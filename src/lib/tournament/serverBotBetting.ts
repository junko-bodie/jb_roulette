import { TournamentPlayer } from '@/lib/models/Tournament';
import { ALL_OUTSIDE_BETS, ALL_STRAIGHT_BETS, ALL_SPLIT_BETS, ALL_CORNER_BETS } from '../bets';

const CHIP_VALUES = [1, 5, 25, 100, 500, 1000];

export function generateServerBotBets(bot: TournamentPlayer) {
  const bets: any[] = [];
  const currentChips = bot.current_chips;

  if (currentChips <= 0) return [];

  const maxWager = currentChips < 100 ? 1 : Math.floor(currentChips * 0.1);
  if (maxWager < 1) return [];

  const numZones = Math.floor(Math.random() * 3) + 1;
  let totalWagered = 0;

  for (let i = 0; i < numZones; i++) {
    const remainingAllowed = maxWager - totalWagered;
    if (remainingAllowed < 1) break;

    const isOutside = Math.random() < 0.6;
    let pool;

    if (isOutside) {
      pool = ALL_OUTSIDE_BETS;
    } else {
      const subType = Math.random();
      if (subType < 0.4) pool = ALL_STRAIGHT_BETS;
      else if (subType < 0.8) pool = ALL_SPLIT_BETS;
      else pool = ALL_CORNER_BETS;
    }

    const randomDef = pool[Math.floor(Math.random() * pool.length)];
    const possibleChips = CHIP_VALUES.filter(v => v <= remainingAllowed);
    let betAmount = 1;

    if (currentChips >= 100 && possibleChips.length > 0) {
      betAmount = possibleChips[Math.floor(Math.random() * possibleChips.length)];
    } else {
      betAmount = 1;
    }

    if (totalWagered + betAmount > maxWager && currentChips >= 100) {
      betAmount = remainingAllowed;
    }

    if (betAmount > 0) {
      if (!bets.find(b => b.betId === (randomDef as any).id)) {
        // Assign a reveal delay between 1 and 25 seconds
        const revealDelayMs = Math.floor(Math.random() * 24000) + 1000;

        bets.push({
          player_id: bot.player_id,
          username: bot.username,
          betId: (randomDef as any).id,
          amount: betAmount,
          chips: [betAmount],
          reveal_at_ms: revealDelayMs
        });
        totalWagered += betAmount;
      }
    }
  }

  return bets;
}

export function generateAllRoundBotBets(bot: TournamentPlayer) {
  const allBets: any[] = [];
  for (let spin = 1; spin <= 5; spin++) {
    const spinBets = generateServerBotBets(bot);
    spinBets.forEach(b => {
      allBets.push({ ...b, spin_number: spin });
    });
  }
  return allBets;
}
