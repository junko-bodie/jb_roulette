import { ObjectId } from 'mongodb';

export interface RankingEntry {
  player_id: ObjectId;
  username: string;
  points: number;
  rank: number;
  tournaments_played: number;
  tournaments_won: number;
}

export interface SeasonRanking {
  _id?: ObjectId;
  year: number;
  rankings: RankingEntry[];
  updated_at: Date;
}
