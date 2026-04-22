import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    
    // Check if id is a valid ObjectId
    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      // Fallback to supabase_id
      query = { supabase_id: id };
    }

    const player = await db.collection('players').findOne(query);
    
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    // Fetch recent tournament history
    const history = await db.collection('tournaments')
      .find({ "players.player_id": player._id, status: "completed" })
      .sort({ completed_at: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({
      ...player,
      history: history.map((t: any) => {
        const me = t.players.find((p: any) => p.player_id.toString() === player._id.toString());
        return {
          id: t._id,
          completed_at: t.completed_at,
          position: me?.final_position,
          chips: me?.current_chips
        };
      })
    });
  } catch (error: any) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
