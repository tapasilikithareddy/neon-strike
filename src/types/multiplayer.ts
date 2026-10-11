import { GameState, PlayerInfo, PlayerSide } from './game';

export type TransportType = 'webrtc' | 'websocket';

export type ConnectionStatus = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface RoomMeta {
  code: string;
  host: PlayerInfo;
  guest?: PlayerInfo;
  createdAt: number;
}

// Network Packets
export type PacketType =
  | 'JOIN_REQUEST'
  | 'JOIN_ACCEPT'
  | 'JOIN_REJECT'
  | 'READY_TOGGLE'
  | 'COUNTDOWN_START'
  | 'GAME_START'
  | 'PADDLE_UPDATE'
  | 'GAME_SYNC'
  | 'GOAL_EVENT'
  | 'REMATCH_REQUEST'
  | 'REMATCH_ACCEPT'
  | 'PING'
  | 'PONG'
  | 'PLAYER_LEFT';

export interface BasePacket {
  type: PacketType;
  timestamp: number;
}

export interface JoinRequestPacket extends BasePacket {
  type: 'JOIN_REQUEST';
  player: PlayerInfo;
}

export interface JoinAcceptPacket extends BasePacket {
  type: 'JOIN_ACCEPT';
  roomCode: string;
  host: PlayerInfo;
  guest: PlayerInfo;
  assignedSide: PlayerSide;
}

export interface JoinRejectPacket extends BasePacket {
  type: 'JOIN_REJECT';
  reason: string;
}

export interface ReadyTogglePacket extends BasePacket {
  type: 'READY_TOGGLE';
  playerId: string;
  isReady: boolean;
}

export interface CountdownStartPacket extends BasePacket {
  type: 'COUNTDOWN_START';
  count: number;
}

export interface GameStartPacket extends BasePacket {
  type: 'GAME_START';
  initialState: GameState;
}

export interface PaddleUpdatePacket extends BasePacket {
  type: 'PADDLE_UPDATE';
  side: PlayerSide;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GameSyncPacket extends BasePacket {
  type: 'GAME_SYNC';
  state: GameState;
}

export interface GoalEventPacket extends BasePacket {
  type: 'GOAL_EVENT';
  scorer: PlayerSide;
  scoreBottom: number;
  scoreTop: number;
}

export interface RematchRequestPacket extends BasePacket {
  type: 'REMATCH_REQUEST';
  senderSide: PlayerSide;
}

export interface RematchAcceptPacket extends BasePacket {
  type: 'REMATCH_ACCEPT';
}

export interface PingPacket extends BasePacket {
  type: 'PING';
  clientTime: number;
}

export interface PongPacket extends BasePacket {
  type: 'PONG';
  clientTime: number;
}

export interface PlayerLeftPacket extends BasePacket {
  type: 'PLAYER_LEFT';
  reason: string;
}

export type NetworkPacket =
  | JoinRequestPacket
  | JoinAcceptPacket
  | JoinRejectPacket
  | ReadyTogglePacket
  | CountdownStartPacket
  | GameStartPacket
  | PaddleUpdatePacket
  | GameSyncPacket
  | GoalEventPacket
  | RematchRequestPacket
  | RematchAcceptPacket
  | PingPacket
  | PongPacket
  | PlayerLeftPacket;
