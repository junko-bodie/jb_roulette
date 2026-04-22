import { ObjectId } from 'mongodb';

export interface SpinResult {
  number: number;
  color: string;
  parity: string;
  dozen: string;
  column: string;
  half: string;
}

export interface PlayerResult {
  player_id: ObjectId;
  bets_placed: Record<string, any>;
  chips_before: number;
  chips_after: number;
  net_change: number;
}

export interface Spin {
  _id?: ObjectId;
  tournament_id: ObjectId;
  round_id: ObjectId;
  spin_number: number;
  result: SpinResult;
  player_results: PlayerResult[];
  created_at: Date;
}
