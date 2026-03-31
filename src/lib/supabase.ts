import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client — singleton for browser usage.
 * 
 * Used for:
 * - Calling Edge Functions (RNG spin)
 * - Logging spin results
 * - Future: auth, realtime multiplayer (Week 4)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
