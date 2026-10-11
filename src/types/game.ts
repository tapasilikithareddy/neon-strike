export interface Vector2D {
  x: number;
  y: number;
}

export interface Puck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
}

export interface Paddle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  side: 'bottom' | 'top'; // 'bottom' = Player 1 / Local host, 'top' = Player 2 / Opponent
}

export type PlayerSide = 'bottom' | 'top';

export interface PlayerInfo {
  id: string;
  name: string;
  side: PlayerSide;
  isHost: boolean;
  isReady: boolean;
  avatarSeed: string;
  pingMs?: number;
}

export type MatchStatus = 
  | 'idle'
  | 'waiting'
  | 'starting'
  | 'playing'
  | 'goal_scored'
  | 'paused'
  | 'game_over';

export interface MatchStats {
  goalsBottom: number;
  goalsTop: number;
  shotsBottom: number;
  shotsTop: number;
  savesBottom: number;
  savesTop: number;
  maxPuckSpeed: number;
  startTime: number;
  endTime?: number;
}

export interface GameState {
  status: MatchStatus;
  scoreBottom: number; // Host / Player 1 score
  scoreTop: number;    // Guest / Player 2 score
  puck: Puck;
  paddleBottom: Paddle;
  paddleTop: Paddle;
  winner: PlayerSide | null;
  countdown: number | null; // e.g. 3, 2, 1, 0
  lastGoalScorer: PlayerSide | null;
  round: number;
  stats: MatchStats;
}

export type AIDifficulty = 'EASY' | 'MEDIUM' | 'CYBER_ELITE';
