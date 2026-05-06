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

  const currentYear = new Date().getFullYear();
  const playersWithPoints = tournament.players.map((p: any) => {
    const position = p.player_id.toString() === winner.player_id.toString() ? 1 : 
                     (runnerUp && p.player_id.toString() === runnerUp.player_id.toString()) ? 2 : 
                     (p.final_position || 6);
    
    // RULE: Must have chips > 0 to receive positive points
    const basePoints = TOURNAMENT_POINTS[position] || -100;
    const finalPoints = p.current_chips > 0 ? basePoints : Math.min(0, basePoints);

    return {
      player_id: p.player_id,
      username: p.username,
      is_bot: p.is_bot,
      position,
      total_points: finalPoints,
      final_chips: p.current_chips,
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

  // Update Real Player Profile
  const realPlayerResult = playersWithPoints.find((p: any) => !p.is_bot);
  if (realPlayerResult) {
    const profile = await db.collection('user_profiles').findOne({ 
      $or: [
        { _id: realPlayerResult.player_id },
        { supabase_id: realPlayerResult.supabase_id }
      ].filter(q => q._id || q.supabase_id)
    });

    if (profile) {
      const isWinner = realPlayerResult.position === 1;
      const newPoints = (profile.season?.points || 0) + realPlayerResult.total_points;
      const totalWins = (profile.stats?.tournaments_won || 0) + (isWinner ? 1 : 0);
      
      // Use threshold from points.ts if available, else 5000
      const eliteThreshold = 5000; 
      const hasEliteStatus = newPoints >= eliteThreshold;

      const updateFields: any = {
        "stats.tournaments_played": (profile.stats?.tournaments_played || 0) + 1,
        "stats.tournaments_won": totalWins,
        "stats.best_finish": Math.min(profile.stats?.best_finish || 6, realPlayerResult.position),
        "season.points": newPoints,
        "season.year": currentYear,
        "updated_at": new Date()
      };

      if (isWinner && realPlayerResult.final_chips > 0) updateFields["badges.champion"] = true;
      if (hasEliteStatus) updateFields["badges.elite_status"] = true;

      await db.collection('user_profiles').updateOne({ _id: profile._id }, { $set: updateFields });

      // Update Season Rankings
      await db.collection('season_rankings').updateOne(
        { year: currentYear },
        { 
          $set: { updated_at: new Date() },
          $pull: { rankings: { username: profile.name } } as any
        },
        { upsert: true }
      );

      await db.collection('season_rankings').updateOne(
        { year: currentYear },
        { 
          $push: { 
            rankings: {
              player_id: profile._id,
              username: profile.name,
              points: newPoints,
              tournaments_played: (profile.stats?.tournaments_played || 0) + 1,
              tournaments_won: totalWins,
              rank: 0
            }
          }
        } as any
      );
    }
  }

  return {
    winner,
    standings: playersWithPoints.sort((a: any, b: any) => a.position - b.position)
  };
}
