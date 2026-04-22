import { ObjectId } from 'mongodb';

export interface PlayerStats {
  tournaments_played: number;
  tournaments_won: number;
  best_finish: number;
}

export interface PlayerBadges {
  champion: boolean;
  elite_status: boolean;
  all_time_champion: boolean;
}

export interface SeasonInfo {
  year: number;
  points: number;
  rank: number;
}

export interface Player {
  _id?: ObjectId;
  supabase_id: string;
  username: string;
  email: string;
  avatar_url: string;
  created_at: Date;
  stats: PlayerStats;
  badges: PlayerBadges;
  season: SeasonInfo;
  annual_championship_qualified: boolean;
}
