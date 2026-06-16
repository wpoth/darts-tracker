export type Player = {
  id: string;
  name: string;
  remaining: number;
};

export type Turn = {
  playerId: string;
  playerName: string;
  score: number;
  remainingBefore: number;
  remainingAfter: number;
  bust: boolean;
};