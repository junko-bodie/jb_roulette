import { ObjectId } from 'mongodb';

export interface TournamentPlayer {
  player_id: ObjectId;
  username: string;
  avatar_url: string;
  is_bot: boolean;
  starting_chips: number;
  current_chips: number;
  status: "active" | "eliminated";
  eliminated_round: number | null;
  final_position: number | null;
  points_earned: number | null;
  has_champion_badge?: boolean;
  pending_bets?: any[];
  bust_spin?: number | null;
  chips_before_bust?: number | null;
}

export interface Tournament {
  _id?: ObjectId;
  status: "waiting" | "active" | "completed";
  created_at: Date;
  completed_at?: Date;
  current_round: number;
  winner_id: ObjectId | null;
  players: TournamentPlayer[];
  wheel_type?: 'american' | 'european';
}
