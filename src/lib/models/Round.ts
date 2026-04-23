import { ObjectId } from 'mongodb';

export interface Round {
  _id?: ObjectId;
  tournament_id: ObjectId;
  round_number: number;
  status: "active" | "completed";
  spins_completed: number;
  players_remaining: ObjectId[];
  eliminated_player_id: ObjectId | null;
  created_at: Date;
  betting_ends_at: Date;
  completed_at?: Date;
  bot_bets?: any[];
}
