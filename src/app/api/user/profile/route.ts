import { getUser, ensureUserProfile } from '@/lib/auth';
import { getDb } from '@/lib/db/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure profile exists
    const profile = await ensureUserProfile(user);

    return NextResponse.json({
      name: profile.name,
      balance: profile.balance,
      is_sound_enabled: profile.is_sound_enabled,
      is_timer_enabled: profile.is_timer_enabled,
      avatar_url: profile.avatar_url,
      tier: profile.tier,
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ 
      error: 'Database connection failed', 
      message: error.message 
    }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure profile exists first
    await ensureUserProfile(user);

    const { name, avatar_url, is_sound_enabled, is_timer_enabled } = await req.json();
    const db = await getDb();

    const updateFields: Record<string, any> = { updated_at: new Date() };
    if (name !== undefined) updateFields.name = name;
    if (avatar_url !== undefined) updateFields.avatar_url = avatar_url;
    if (is_sound_enabled !== undefined) updateFields.is_sound_enabled = is_sound_enabled;
    if (is_timer_enabled !== undefined) updateFields.is_timer_enabled = is_timer_enabled;

    await db.collection('user_profiles').updateOne(
      { supabase_id: user.id },
      { $set: updateFields }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update profile', 
      message: error.message 
    }, { status: 500 });
  }
}
