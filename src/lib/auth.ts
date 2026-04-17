import { createClient } from '@/lib/supabase/server';
import { getDb } from '@/lib/db/mongodb';

/**
 * Get the current authenticated user from Supabase.
 * Returns null if not authenticated.
 */
export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Ensure a user profile exists in MongoDB.
 * Called on first sign-in or when profile is missing.
 */
export async function ensureUserProfile(supabaseUser: {
  id: string;
  email?: string;
  is_anonymous?: boolean;
  user_metadata?: Record<string, any>;
}) {
  const db = await getDb();
  const profiles = db.collection('user_profiles');

  const existing = await profiles.findOne({ supabase_id: supabaseUser.id });
  if (existing) return existing;

  // Create profile with defaults
  const profile = {
    supabase_id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.full_name || 
          supabaseUser.user_metadata?.name || 
          supabaseUser.email?.split('@')[0] || 
          'Player',
    avatar_url: supabaseUser.user_metadata?.avatar_url || 
                supabaseUser.user_metadata?.picture || 
                '/avatars/default.png',
    balance: 1000.00,
    starting_balance: 1000,
    is_sound_enabled: true,
    is_timer_enabled: true,
    is_popup_enabled: true,
    tier: 'High Roller',
    provider: supabaseUser.user_metadata?.iss ? 'google' : 
              supabaseUser.is_anonymous ? 'guest' : 'credentials',
    created_at: new Date(),
    updated_at: new Date(),
  };

  await profiles.insertOne(profile);
  return profile;
}
