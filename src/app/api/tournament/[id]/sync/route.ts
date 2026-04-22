import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { player_chips, current_round } = await request.json();
    
    const db = await getDb();
    
    // Update player chip counts
    if (player_chips) {
      const updateOps = Object.entries(player_chips).map(([playerId, chips]) => ({
        updateOne: {
          filter: { 
            _id: new ObjectId(id), 
            "players.player_id": new ObjectId(playerId) 
          },
          update: { 
            $set: { "players.$.current_chips": chips } 
          }
        }
      }));

      if (updateOps.length > 0) {
        await db.collection('tournaments').bulkWrite(updateOps);
      }
    }

    // Update current round if provided
    if (current_round !== undefined) {
      await db.collection('tournaments').updateOne(
        { _id: new ObjectId(id) },
        { $set: { current_round } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Sync tournament error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
