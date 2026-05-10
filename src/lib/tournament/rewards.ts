import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { TOURNAMENT_POINTS } from './points';

export async function awardTournamentRewards(tournamentId: string | ObjectId) {
  const db = await getDb();
  const tId = typeof tournamentId === 'string' ? new ObjectId(tournamentId) : tournamentId;

  const tournament = await db.collection('tournaments').findOne({ _id: tId });
  if (!tournament) return null;

  const activePlayers = tournament.players.filter((p: any) => p.status === "active" || p.status === "completed");
  
  // Find winner (status: completed or highest chips)
  const sorted = [...activePlayers].sort((a: any, b: any) => {
    if (a.status === "completed" && b.status !== "completed") return -1;
    if (a.status !== "completed" && b.status === "completed") return 1;
    return b.current_chips - a.current_chips;
  });

  const winner = sorted[0];
  const runnerUp = sorted[1];
  const thirdPlace = sorted[2];

  const currentYear = new Date().getFullYear();
  const playersWithPoints = tournament.players.map((p: any) => {
    // Determine position from sorted list
    const positionIndex = sorted.findIndex((sp: any) => sp.player_id.toString() === p.player_id.toString());
    const position = positionIndex !== -1 ? positionIndex + 1 : (p.final_position || 6);
    
    // NEW RULES (May 2026):
    // 1. Must have balance > 0 to get positive points
    // 2. 1st: 1000, 2nd: 100, 3rd: 50
    // 3. Positive balance but outside Top 3: 0 points
    // 4. Zero balance (bust): -50 points, regardless of rank
    
    let finalPoints = 0;
    if (p.current_chips > 0) {
      finalPoints = TOURNAMENT_POINTS[position] || 0;
    } else {
      finalPoints = -50;
    }

    return {
      player_id: p.player_id,
      username: p.username,
      is_bot: p.is_bot,
      position,
      total_points: finalPoints,
      final_chips: Math.max(0, p.current_chips),
      supabase_id: p.supabase_id
    };
  });

  // Update Tournament document with calculated points for all players
  const bulkUpdateOps = playersWithPoints.map((p: any) => ({
    updateOne: {
      filter: { _id: tId, "players.player_id": p.player_id },
      update: { $set: { "players.$.points_earned": p.total_points } }
    }
  }));

  if (bulkUpdateOps.length > 0) {
    await db.collection('tournaments').bulkWrite(bulkUpdateOps);
  }

  // Update Real Player Profiles and Season Rankings
  const realPlayers = playersWithPoints.filter((p: any) => !p.is_bot);
  
  for (const playerResult of realPlayers) {
    const profile = await db.collection('user_profiles').findOne({ 
      $or: [
        { _id: playerResult.player_id },
        { supabase_id: playerResult.supabase_id }
      ].filter(q => q._id || q.supabase_id)
    });

    if (profile) {
      const isWinner = playerResult.position === 1;
      const newPoints = (profile.season?.points || 0) + playerResult.total_points;
      const totalWins = (profile.stats?.tournaments_won || 0) + (isWinner ? 1 : 0);
      
      const eliteThreshold = 5000; 
      const hasEliteStatus = newPoints >= eliteThreshold;

      const updateFields: any = {
        "stats.tournaments_played": (profile.stats?.tournaments_played || 0) + 1,
        "stats.tournaments_won": totalWins,
        "stats.best_finish": Math.min(profile.stats?.best_finish || 6, playerResult.position),
        "season.points": newPoints,
        "season.year": currentYear,
        "updated_at": new Date()
      };

      if (isWinner && playerResult.final_chips > 0) updateFields["badges.champion"] = true;
      if (hasEliteStatus) updateFields["badges.elite_status"] = true;

      await db.collection('user_profiles').updateOne({ _id: profile._id }, { $set: updateFields });

      // Update Season Rankings Ledger
      const rankingDoc = await db.collection('season_rankings').findOne({ year: currentYear });
      let currentRankings = rankingDoc?.rankings || [];
      
      // Remove existing entry for this player
      currentRankings = currentRankings.filter((r: any) => r.player_id.toString() !== profile._id.toString());
      
      // Add updated entry
      currentRankings.push({
        player_id: profile._id,
        username: profile.name,
        avatar_url: profile.avatar_url || profile.avatar,
        points: newPoints,
        tournaments_played: (profile.stats?.tournaments_played || 0) + 1,
        tournaments_won: totalWins,
        updated_at: new Date()
      });

      // Sort and update ranks
      currentRankings.sort((a: any, b: any) => b.points - a.points);
      currentRankings.forEach((r: any, idx: number) => {
        r.rank = idx + 1;
      });

      // Save back to season_rankings
      await db.collection('season_rankings').updateOne(
        { year: currentYear },
        { 
          $set: { 
            rankings: currentRankings,
            updated_at: new Date() 
          }
        },
        { upsert: true }
      );

      // Update player's individual season rank in their profile
      const myUpdatedEntry = currentRankings.find((r: any) => r.player_id.toString() === profile._id.toString());
      if (myUpdatedEntry) {
        await db.collection('user_profiles').updateOne(
          { _id: profile._id },
          { $set: { "season.rank": myUpdatedEntry.rank } }
        );
      }
    }
  }

  return {
    winner,
    standings: playersWithPoints.sort((a: any, b: any) => a.position - b.position)
  };
}
