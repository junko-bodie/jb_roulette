# Roulette Tournament Implementation Audit Report
**Date:** April 24, 2026  
**Project:** roulette_demo  
**Status:** Mixed Compliance

---

## Executive Summary

Your tournament implementation is **~80% complete** with the core mechanic foundation solid. The main discrepancies are:
- ⚠️ **Spin count mismatch:** Implemented as 5 spins/round, not 10 (spec requirement)
- ⚠️ **Reward points calculation:** Using complex bonuses instead of simple tier allocation
- ✅ **Chip allocation, elimination, bot integration:** All working correctly

---

## 1. TOURNAMENT STRUCTURE ❌ PARTIAL (5/10 Spins Per Round)

### Specification Requirement
- 6 players (including bots)
- 5 rounds
- **10 spins per round** ← NOT MET

### Current Implementation

**File:** [src/lib/tournament/TournamentContext.tsx](src/lib/tournament/TournamentContext.tsx)
```typescript
const totalSpins = 20; // 5 spins × 4 rounds = 20 total
```

**File:** [src/app/api/tournament/[id]/start/route.ts](src/app/api/tournament/[id]/start/route.ts)
```typescript
const round = {
  round_number: 1,
  status: "active",
  spins_completed: 0,  // ← Goes 0→5, not 0→10
  // ...
};
```

**Elimination Logic:** After 5 spins (not 10), player with lowest chips is eliminated.

### Issues Found

1. **Spin Limit:** Code checks `if (activeRound.spins_completed >= 5)` for elimination trigger
   - Should be `>= 10` if spec requires 10 spins/round
   
2. **UI Display:** Scoreboard shows `Spin {currentSpin}/5`
   - Should be `Spin {currentSpin}/10`

3. **Timing Calculation:** Each spin cycle is 50s (30s betting + 20s spin/result)
   - 5 spins = 250s per round
   - 10 spins = 500s per round (8+ minutes)

### Verdict
**Status:** ❌ **NOT IMPLEMENTED AS SPECIFIED**

**Recommendation:**
- Decide: Keep 5 spins (simpler, 4 rounds total) or implement 10 spins per spec?
- If changing to 10: Update spin limit checks and UI throughout codebase

---

## 2. START CONDITIONS ✅ FULLY IMPLEMENTED

### Specification Requirement
- All players start with exactly $2,000 in chips

### Current Implementation

**File:** [src/app/api/tournament/[id]/start/route.ts](src/app/api/tournament/[id]/start/route.ts#L35-L45)
```typescript
const currentPlayer: TournamentPlayer = {
  player_id: profile._id,
  username: profile.name || profile.username || 'Player',
  avatar_url: profile.avatar_url || '/avatars/default.png',
  is_bot: false,
  starting_chips: 2000,      // ← CORRECT
  current_chips: 2000,       // ← CORRECT
  status: "active",
  eliminated_round: null,
  final_position: null,
  points_earned: null
};
```

**File:** [src/app/api/tournament/[id]/start/route.ts](src/app/api/tournament/[id]/start/route.ts#L85-L98)
```typescript
// Bot allocation
const bots: TournamentPlayer[] = Array.from({ length: neededBots }).map(() => ({
  player_id: new ObjectId(),
  username: `Bot_${botId}`,
  avatar_url: '/avatars/bot.png',
  is_bot: true,
  starting_chips: 2000,  // ← CORRECT for bots too
  current_chips: 2000,   // ← CORRECT
  status: "active",
  // ...
}));
```

### Verification
- ✅ Real player: 2000
- ✅ All bots: 2000
- ✅ No chips reset between rounds
- ✅ Database persists starting amount

### Verdict
**Status:** ✅ **FULLY IMPLEMENTED AND CORRECT**

---

## 3. ELIMINATION LOGIC ✅ FULLY IMPLEMENTED

### Specification Requirement
1. Player with lowest chip count eliminated at end of each round
2. Chip counts carry over between rounds (no reset)

### Current Implementation

**File:** [src/app/api/tournament/[id]/round/[roundId]/eliminate/route.ts](src/app/api/tournament/[id]/round/[roundId]/eliminate)
```typescript
// Step 1: Identify active players
const activePlayersWithIndex = activePlayers.map((player: any) => {
  const originalIndex = tournament.players.findIndex((p: any) => 
    p.player_id.toString() === player.player_id.toString()
  );
  return { ...player, originalIndex };
});

// Step 2: Sort by chip count (ascending)
activePlayersWithIndex.sort((a: any, b: any) => {
  if (a.current_chips !== b.current_chips) {
    return a.current_chips - b.current_chips; // ← LOWEST FIRST
  }
  return b.originalIndex - a.originalIndex; // ← Tie-break by player index
});

// Step 3: Eliminate lowest chips
const playerToEliminate = activePlayersWithIndex[0];
const finalPosition = 7 - currentRound; // ← 6 for Round 1, 5 for Round 2, etc.

// Step 4: Update tournament
await db.collection('tournaments').updateOne(
  { 
    _id: new ObjectId(id),
    "players.player_id": playerToEliminate.player_id
  },
  {
    $set: {
      "players.$.status": "eliminated",
      "players.$.eliminated_round": currentRound,
      "players.$.final_position": finalPosition
    },
    $inc: { current_round: 1 }  // ← Move to next round
  }
);
```

### Chip Carry-Over Verification

**File:** [src/lib/tournament/TournamentContext.tsx](src/lib/tournament/TournamentContext.tsx#L380-L400)
```typescript
const completeSpin = useCallback(() => {
  // Update local chip counts from API result
  setTournament(prev => {
    if (!prev) return null;
    const updatedPlayers = prev.players.map(p => ({
      ...p,
      current_chips: data.chip_updates?.[p.player_id.toString()] ?? p.current_chips
      // ← NO RESET HERE - just update with spin result
    }));
    return { ...prev, players: updatedPlayers };
  });
}, [pendingSpinData]);
```

**File:** [src/app/api/tournament/[id]/spin/route.ts](src/app/api/tournament/[id]/spin/route.ts#L120-L130)
```typescript
// Payout calculation
const newChips = player.current_chips + payout.netResult; // ← ADD TO CURRENT

// Bulk update
const updateOps = Object.entries(chipUpdates).map(([playerId, chips]) => {
  return {
    updateOne: {
      filter: { 
        _id: new ObjectId(id), 
        "players.player_id": new ObjectId(playerId) 
      },
      update: { 
        $set: { "players.$.current_chips": chips }  // ← PERSIST
      }
    }
  };
});
```

### Verification
- ✅ Lowest chip player identified correctly
- ✅ Tie-breaks handled (original index)
- ✅ Final position assigned (6→2)
- ✅ Chip amounts carry over (no reset)
- ✅ Multiple rounds supported (rounds increment)

### Verdict
**Status:** ✅ **FULLY IMPLEMENTED AND CORRECT**

---

## 4. BOT INTEGRATION ✅ FULLY IMPLEMENTED

### Specification Requirement
1. Bots fill empty slots automatically
2. Bots bet randomly

### Current Implementation

#### A. Bot Auto-Fill

**File:** [src/app/api/tournament/[id]/start/route.ts](src/app/api/tournament/[id]/start/route.ts#L80-L110)
```typescript
// Calculate needed bots
const currentPlayers = tournament.players || [];
const neededBots = Math.max(0, 6 - currentPlayers.length); // ← EXACT COUNT

if (neededBots > 0) {
  const bots: TournamentPlayer[] = Array.from({ length: neededBots }).map(() => {
    const botId = Math.floor(1000 + Math.random() * 9000);
    return {
      player_id: new ObjectId(),
      username: `Bot_${botId}`,
      avatar_url: '/avatars/bot.png',
      is_bot: true,
      starting_chips: 2000,
      current_chips: 2000,
      status: "active"
    };
  });
  
  // Insert bots into tournament
  await db.collection('tournaments').updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: { status: 'active' },
      $push: { players: { $each: bots } }
    }
  );
}
```

#### B. Random Bot Betting

**File:** [src/lib/tournament/serverBotBetting.ts](src/lib/tournament/serverBotBetting.ts)
```typescript
export function generateServerBotBets(bot: TournamentPlayer, spinNumber: number = 1) {
  const bets: any[] = [];
  const currentChips = bot.current_chips;
  
  if (currentChips <= 0) return [];

  // MAX WAGER: 10% of balance
  const maxWager = currentChips < 100 ? 1 : Math.floor(currentChips * 0.1);
  if (maxWager < 1) return [];

  // Randomly select 1-3 bet zones
  const numZones = Math.floor(Math.random() * 3) + 1;
  
  for (let i = 0; i < numZones; i++) {
    // Random bet type distribution:
    // - 60% Outside bets (Red/Black, Odd/Even, High/Low)
    // - 40% Inside bets
    //   - 40% Straight (single number)
    //   - 40% Split (two numbers)
    //   - 20% Corner (four numbers)
    
    const isOutside = Math.random() < 0.6;
    let pool;

    if (isOutside) {
      pool = ALL_OUTSIDE_BETS;  // [Red, Black, Odd, Even, High, Low]
    } else {
      const subType = Math.random();
      if (subType < 0.4) pool = ALL_STRAIGHT_BETS;
      else if (subType < 0.8) pool = ALL_SPLIT_BETS;
      else pool = ALL_CORNER_BETS;
    }

    // Select random bet from pool
    const randomDef = pool[Math.floor(Math.random() * pool.length)];
    
    // Random chip denomination (1, 5, 25, 100, 500, 1000)
    const possibleChips = [1, 5, 25, 100, 500, 1000].filter(v => v <= remainingAllowed);
    const betAmount = possibleChips[Math.floor(Math.random() * possibleChips.length)] || 1;

    // Prevent duplicates on same zone
    if (!bets.find(b => b.betId === randomDef.id)) {
      bets.push({
        betId: randomDef.id,
        amount: betAmount,
        chips: [betAmount],
        spin_number: spinNumber,
        reveal_at_ms: calculateRevealTiming(spinNumber)  // ← Staggered reveal
      });
    }
  }

  return bets;
}
```

#### C. Pre-Generated Bot Bets (All 5 Spins)

**File:** [src/app/api/tournament/[id]/start/route.ts](src/app/api/tournament/[id]/start/route.ts#L130-L145)
```typescript
// Pre-generate ALL bot bets for entire round (all 5 spins)
const activeBots = tournamentForRound.players.filter((p: any) => p.is_bot && p.status === "active");
const allBotBets: any[] = [];

activeBots.forEach((bot: any) => {
  const bets = generateAllRoundBotBets(bot);  // ← All spins pre-generated
  allBotBets.push(...bets);
});

const round = {
  tournament_id: new ObjectId(id),
  round_number: 1,
  status: "active",
  spins_completed: 0,
  players_remaining: tournamentForRound.players.filter((p: any) => p.status === "active").map((p: any) => p.player_id),
  bot_bets: allBotBets  // ← Stored in round document
};
```

#### D. Staggered Bot Bet Reveal Timing

**File:** [src/lib/tournament/TournamentContext.tsx](src/lib/tournament/TournamentContext.tsx#L520-L560)
```typescript
// Reveal Bot bets based on server-provided reveal_at_ms
useEffect(() => {
  if (phase === "betting" && currentRoundData?.bot_bets) {
    const sessionBotBets = (currentRoundData.bot_bets || [])
      .filter((b: any) => b.spin_number === currentSpin);
    
    sessionBotBets.forEach((bet: any) => {
      const revealTime = baseTime + (bet.reveal_at_ms || 0);
      const now = Date.now();
      const delay = Math.max(0, revealTime - now);
      
      const timerId = setTimeout(() => {
        setBotBets(prev => [...prev, {
          player_id: bet.player_id,
          username: bet.username,
          betId: bet.betId,
          amount: bet.amount,
          chips: bet.chips
        }]);
      }, delay);  // ← Random stagger, not all at once
    });
  }
}, [phase, currentRound, currentSpin, currentRoundData?._id]);
```

### Verification
- ✅ Exactly 6 players (1 real + 5 bots)
- ✅ Bots auto-fill to reach 6 total
- ✅ Random betting strategy implemented
- ✅ 10% of balance wager limit
- ✅ 60% outside / 40% inside distribution
- ✅ Pre-generated for all spins
- ✅ Staggered reveal timing (realistic)

### Verdict
**Status:** ✅ **FULLY IMPLEMENTED AND CORRECT**

---

## 5. SCORING/REWARDS ❌ INCORRECT CALCULATION

### Specification Requirement
**Tier 2 Season Ranking Points Allocation:**
- 1st place: **100 points**
- 2nd place: **60 points**
- 3rd place: **40 points**
- 4th place: **25 points**
- 5th place: **10 points**
- 6th place: **5 points**

### Current Implementation

**File:** [src/app/api/tournament/[id]/complete/route.ts](src/app/api/tournament/[id]/complete)
```typescript
// Define reward points
export const TOURNAMENT_POINTS: Record<number, number> = {
  1: 100, // ← CORRECT
  2: 60,  // ← CORRECT
  3: 40,  // ← CORRECT
  4: 25,  // ← CORRECT
  5: 10,  // ← CORRECT
  6: 5    // ← CORRECT
};
```

✅ **The constant is correct!** But...

### Issues Found

**File:** [src/app/api/tournament/[id]/complete/route.ts](src/app/api/tournament/[id]/complete)
```typescript
// ❌ PROBLEM: Different calculation used instead of simple tier lookup

const playersWithPoints = tournament.players.map((p: any) => {
  // Wrong: Using rank bonus formula instead of TOURNAMENT_POINTS
  const rankBonus = (7 - position) * 250;  // ← WRONG!
  // Calculates: Pos 1: 1500, Pos 2: 1250, Pos 3: 1000, etc.
  
  const chipBonus = Math.floor(p.current_chips / 10);  // ← Extra bonus not in spec
  const totalPoints = rankBonus + chipBonus;  // ← Combines wrong values
  
  return {
    // ...
    total_points: totalPoints  // ← Result is 1500+chips/10, NOT 100
  };
});
```

### The Problem

| Position | Specified Points | Current Calculation | Actual Result |
|----------|------------------|---------------------|---------------|
| 1st      | **100**          | (7-1)×250 + chips/10 | **1500+** |
| 2nd      | **60**           | (7-2)×250 + chips/10 | **1250+** |
| 3rd      | **40**           | (7-3)×250 + chips/10 | **1000+** |
| 4th      | **25**           | (7-4)×250 + chips/10 | **750+** |
| 5th      | **10**           | (7-5)×250 + chips/10 | **500+** |
| 6th      | **5**            | (7-6)×250 + chips/10 | **250+** |

### Verdict
**Status:** ❌ **NOT IMPLEMENTED AS SPECIFIED**

**Evidence:** The code uses a complex ranking formula (1500/1250/1000 points) instead of simple tier allocation (100/60/40/25/10/5).

---

## 6. SCOREBOARD DISPLAY ✅ PARTIALLY CORRECT

### Specification Requirement
- Display rank
- Display chip counts
- Display remaining spins after every spin

### Current Implementation

**File:** [src/components/tournament/Scoreboard.tsx](src/components/tournament/Scoreboard.tsx)

```typescript
export default function Scoreboard() {
  const { scores, currentSpin, currentRound, phase, totalSpins } = useTournament();
  
  return (
    <div className="sticky top-4 self-start z-40 w-80">
      <motion.div className="bg-[#0a0a0a]/90 border border-gold/30 rounded-3xl p-6">
        
        {/* HEADER: Shows round and spin */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2>Round {currentRound}/5</h2>
            <h3>Live Ranking</h3>
          </div>
          <div>
            <span>Spin {currentSpin}/5</span>  {/* ← SHOWS CURRENT SPIN */}
          </div>
        </div>

        {/* PLAYER LIST */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {scores.map((s) => {
              const isMe = !s.is_bot;
              const isEliminated = s.status === "eliminated";

              return (
                <motion.div
                  key={s.player_id.toString()}
                  layout
                  className={`${...}`}
                >
                  {/* RANK BADGE */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center">
                    {isEliminated ? (
                      <Skull className="w-4 h-4" />  {/* ← Skull for eliminated */}
                    ) : (
                      <span>{s.rank}</span>  {/* ← Shows rank 1-5 */}
                    )}
                  </div>

                  {/* CHIP DISPLAY */}
                  <span>{s.chips.toLocaleString()}</span>  {/* ← Shows current chips */}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
```

### Verification Checklist

| Element | Status | Location |
|---------|--------|----------|
| ✅ **Rank Display** | Works | Badge shows 1-5 for active, Skull for eliminated |
| ✅ **Chip Counts** | Works | Localized number display per player |
| ⚠️ **Current Spin** | Works but limited | Shows "Spin 1/5" (should be "Spin 1/10" if spec is 10 spins) |
| ✅ **Round Number** | Works | Shows "Round 1/5" |
| ✅ **Real-Time Updates** | Works | Animated transitions on chip changes and eliminations |
| ✅ **Player Status** | Works | Eliminated players shown with skull, grayed out |

### Key Features

**File:** [src/components/tournament/Scoreboard.tsx](src/components/tournament/Scoreboard.tsx#L100-L130)
```typescript
// Real-time ranking movement tracking
const movement: Record<string, 'up' | 'down' | null> = {};

scores.forEach(s => {
  if (s.status !== "active") return;
  
  const pid = s.player_id.toString();
  const prevRank = prevRanks[pid];
  
  if (prevRank !== undefined) {
    if (s.rank < prevRank) {
      movement[pid] = 'up';   // ← Visual indicator for ranking changes
    } else if (s.rank > prevRank) {
      movement[pid] = 'down';
    }
  }
});
```

### Verdict
**Status:** ✅ **MOSTLY CORRECT** (with spin count caveat)

---

## SUMMARY TABLE

| Feature | Specification | Implementation | Status | Issues |
|---------|---|---|---|---|
| **Players per Tournament** | 6 (1 real + 5 bots) | 6 players | ✅ | None |
| **Starting Chips** | $2,000 each | $2,000 each | ✅ | None |
| **Rounds** | 5 rounds | 5 rounds | ✅ | None |
| **Spins per Round** | **10 spins** | **5 spins** | ❌ | Mismatch: code uses 5 |
| **Elimination Logic** | Lowest chips at round end | Lowest chips trigger | ✅ | None |
| **Chip Carry-Over** | No reset between rounds | Chips accumulate | ✅ | None |
| **Bot Auto-Fill** | Fill to 6 players | Auto-creates bots | ✅ | None |
| **Bot Betting** | Random placement | 60% outside / 40% inside | ✅ | None |
| **Reward Points** | 100/60/40/25/10/5 | 1500+/1250+/1000+/750+/500+/250+ | ❌ | Wrong formula used |
| **Scoreboard Rank** | Display rank | Shows 1-5 | ✅ | None |
| **Scoreboard Chips** | Display chip count | Shows localized | ✅ | None |
| **Scoreboard Spins** | Display remaining spins | Shows current/5 | ⚠️ | Should be current/10 |

---

## CRITICAL FIXES NEEDED

### Priority 1 (Blocking Spec Compliance)
1. **Spins Per Round:** Change from 5 to 10 (if spec requires it)
   - Update spin limit in eliminate condition
   - Update UI display (Spin X/10)
   - Adjust betting windows

2. **Reward Points Calculation:** Use simple tier lookup instead of formula
   - Replace `(7 - position) * 250` logic
   - Use `TOURNAMENT_POINTS[position]` directly

### Priority 2 (Nice to Have)
- Verify chip bonus calculation (10% of final chips) aligns with spec
- Document final position mapping (current: 6→2 for eliminations)

---

## FILES REQUIRING CHANGES

- [ ] `src/app/api/tournament/[id]/round/[roundId]/eliminate/route.ts` - Spin limit check
- [ ] `src/app/api/tournament/[id]/start/route.ts` - Round structure
- [ ] `src/lib/tournament/TournamentContext.tsx` - UI constants
- [ ] `src/app/api/tournament/[id]/complete/route.ts` - Reward calculation
- [ ] `src/components/tournament/Scoreboard.tsx` - Spin display
