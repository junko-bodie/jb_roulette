import { TournamentPlayer } from '@/lib/models/Tournament';
import { ALL_OUTSIDE_BETS, ALL_STRAIGHT_BETS, ALL_SPLIT_BETS, ALL_CORNER_BETS } from '../bets';

const CHIP_VALUES = [1, 5, 25, 100, 500, 1000];

export function generateServerBotBets(bot: TournamentPlayer, spinNumber: number = 1) {
  const bets: any[] = [];
  const currentChips = bot.current_chips;

  if (currentChips <= 0) return [];

  // Bots wager between 10% and 25% of their chips for a balanced feel
  const wagerPercent = 0.1 + (Math.random() * 0.15);
  const maxWager = Math.max(5, Math.floor(currentChips * wagerPercent));
  if (maxWager < 1) return [];
 
  // Target moderate number of zones (3 to 7)
  const numZones = Math.floor(Math.random() * 5) + 3;
  let totalWagered = 0;

  for (let i = 0; i < numZones; i++) {
    const remainingAllowed = maxWager - totalWagered;
    if (remainingAllowed < 1) break;

    const isOutside = Math.random() < 0.5; // 50/50 mix
    let pool;

    if (isOutside) {
      pool = ALL_OUTSIDE_BETS;
    } else {
      const subType = Math.random();
      if (subType < 0.5) pool = ALL_STRAIGHT_BETS; // More straights
      else if (subType < 0.8) pool = ALL_SPLIT_BETS;
      else pool = ALL_CORNER_BETS;
    }

    const randomDef = pool[Math.floor(Math.random() * pool.length)];
    const betId = (randomDef as any).id;

    // To prevent betting on same zone multiple times in one generation pass
    if (bets.find(b => b.betId === betId)) continue;

    // Pick largest possible chips to reach a "bold" bet for this zone
    // Bots will try to spend about 1/4 of their remaining allowance on each new zone
    const targetForZone = Math.max(1, Math.floor(remainingAllowed / (numZones - i)));
    let zoneAmount = 0;
    const zoneChips: number[] = [];

    while (zoneAmount < targetForZone) {
      const possibleChars = CHIP_VALUES.filter(v => v <= (targetForZone - zoneAmount));
      if (possibleChars.length === 0) {
        // Just take the smallest 1 if we have room in total maxWager
        if (totalWagered + zoneAmount < maxWager) {
          zoneChips.push(1);
          zoneAmount += 1;
        }
        break;
      }
      const chip = possibleChars[possibleChars.length - 1]; // Pick largest available
      zoneChips.push(chip);
      zoneAmount += chip;
    }

    if (zoneAmount > 0) {
      // Reveal timing
      let revealAt = 0;
      if (spinNumber === 1) {
        revealAt = 200 + Math.floor(Math.random() * 18000); // 0.2-18s, very fast early activity
      } else {
        revealAt = 22000 + Math.floor(Math.random() * 20000); // 22-42s
      }

      bets.push({
        player_id: bot.player_id,
        username: bot.username,
        betId: betId,
        amount: zoneAmount,
        chips: zoneChips,
        reveal_at_ms: revealAt
      });
      totalWagered += zoneAmount;
    }
  }

  return bets;
}

export function generateAllRoundBotBets(bot: TournamentPlayer) {
  const allBets: any[] = [];
  for (let spin = 1; spin <= 5; spin++) {
    const spinBets = generateServerBotBets(bot, spin);
    spinBets.forEach(b => {
      allBets.push({ ...b, spin_number: spin });
    });
  }
  return allBets;
}
 
