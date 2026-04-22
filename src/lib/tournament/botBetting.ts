import { TournamentPlayer } from '@/lib/models/Tournament';
import { PlacedBet, ALL_OUTSIDE_BETS, ALL_STRAIGHT_BETS, ALL_SPLIT_BETS, ALL_CORNER_BETS } from '../bets';

// Standard chip denominations
const CHIP_VALUES = [1, 5, 25, 100, 500, 1000];

/**
 * Generates automated bets for a bot based on the rules:
 * - 1-3 random zones
 * - 60% Outside bets / 40% Inside bets
 * - Max 10% of balance per spin
 * - Minimum $1 if balance < $100
 */
export function generateBotBets(bot: TournamentPlayer): PlacedBet[] {
  const bets: PlacedBet[] = [];
  const currentChips = bot.current_chips;
  
  if (currentChips <= 0) return [];

  // Determine max allowed wager for this spin
  const maxWager = currentChips < 100 ? 1 : Math.floor(currentChips * 0.1);
  if (maxWager < 1) return [];

  // Randomly select between 1 and 3 bet zones
  const numZones = Math.floor(Math.random() * 3) + 1;
  let totalWagered = 0;

  for (let i = 0; i < numZones; i++) {
    const remainingAllowed = maxWager - totalWagered;
    if (remainingAllowed < 1) break;

    // Determine category: 60% Outside, 40% Inside
    const isOutside = Math.random() < 0.6;
    let pool;

    if (isOutside) {
      pool = ALL_OUTSIDE_BETS;
    } else {
      // Pick from Straight Up, Split, Corner
      const subType = Math.random();
      if (subType < 0.4) pool = ALL_STRAIGHT_BETS;
      else if (subType < 0.8) pool = ALL_SPLIT_BETS;
      else pool = ALL_CORNER_BETS;
    }

    const randomDef = pool[Math.floor(Math.random() * pool.length)];
    
    // Select a chip denomination from available chips
    const possibleChips = CHIP_VALUES.filter(v => v <= remainingAllowed);
    let betAmount = 1;

    if (currentChips >= 100 && possibleChips.length > 0) {
      betAmount = possibleChips[Math.floor(Math.random() * possibleChips.length)];
    } else {
      // If balance < 100, bet the minimum $1 only
      betAmount = 1;
    }

    // Ensure we don't exceed maxWager
    if (totalWagered + betAmount > maxWager && currentChips >= 100) {
      betAmount = remainingAllowed;
    }

    if (betAmount > 0) {
      // Prevent duplicate bets on same zone for simplicity in this generation
      if (!bets.find(b => b.betId === randomDef.id)) {
        bets.push({
          betId: randomDef.id,
          amount: betAmount,
          chips: [betAmount]
        });
        totalWagered += betAmount;
      }
    }
  }

  return bets;
}
