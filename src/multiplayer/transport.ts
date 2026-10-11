import { ConnectionStatus, NetworkPacket } from '../types/multiplayer';
import { PlayerInfo } from '../types/game';

export interface IMultiplayerTransport {
  connect(roomCode: string, player: PlayerInfo, isHost: boolean): Promise<void>;
  send(packet: NetworkPacket): void;
  onPacket(handler: (packet: NetworkPacket) => void): void;
  onStatusChange(handler: (status: ConnectionStatus) => void): void;
  disconnect(): void;
  getPing(): number;
  getStatus(): ConnectionStatus;
}
