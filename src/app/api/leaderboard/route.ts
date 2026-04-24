import { getDb } from '@/lib/db/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = await getDb();
    
    // Fetch top 100 players by balance, excluding anonymous users if needed
    // However, ensureUserProfile marks provider: 'credentials' or 'google' for signed up users.
    // Provider 'guest' is for anonymous.
    
    const topPlayers = await db.collection('user_profiles')
      .find({ 
        provider: { $ne: 'guest' },
        name: { $ne: 'Player' } // Exclude default unnamed players
      })
      .sort({ balance: -1 })
      .limit(100)
      .project({
        name: 1,
        balance: 1,
        avatar_url: 1,
        badges: 1,
        'stats.tournaments_won': 1,
        'stats.tournaments_played': 1,
        created_at: 1
      })
      .toArray();

    return NextResponse.json({
      leaderboard: topPlayers.map((p, idx) => ({
        rank: idx + 1,
        id: p._id,
        name: p.name,
        balance: p.balance,
        avatar: p.avatar_url,
        tournaments_won: p.stats?.tournaments_won || 0,
        badges: p.badges || {},
        is_pro: (p.stats?.tournaments_played || 0) > 10
      }))
    });
  } catch (error: any) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
