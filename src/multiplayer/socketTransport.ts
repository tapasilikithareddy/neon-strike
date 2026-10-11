import { io, Socket } from 'socket.io-client';
import { ConnectionStatus, NetworkPacket } from '../types/multiplayer';
import { PlayerInfo } from '../types/game';
import { IMultiplayerTransport } from './transport';

export class SocketTransport implements IMultiplayerTransport {
  private socket: Socket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private packetHandlers: Array<(packet: NetworkPacket) => void> = [];
  private statusHandlers: Array<(status: ConnectionStatus) => void> = [];
  private pingMs: number = 0;
  private pingInterval: number | null = null;
  private serverUrl: string;

  constructor(serverUrl?: string) {
    const envUrl = import.meta.env.VITE_WS_SERVER_URL;
    // In production without env override, connect to current origin (same host & port)
    this.serverUrl = serverUrl || (envUrl ? envUrl : typeof window !== 'undefined' ? window.location.origin : '');
  }

  private setStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    this.statusHandlers.forEach((h) => h(newStatus));
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getPing(): number {
    return this.pingMs;
  }

  public onPacket(handler: (packet: NetworkPacket) => void): void {
    this.packetHandlers.push(handler);
  }

  public onStatusChange(handler: (status: ConnectionStatus) => void): void {
    this.statusHandlers.push(handler);
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = window.setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping_check', Date.now());
      }
    }, 2000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public async connect(
    roomCode: string,
    player: PlayerInfo,
    isHost: boolean
  ): Promise<void> {
    this.setStatus('connecting');

    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl || undefined, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        this.setStatus('connected');
        this.startPing();
        this.socket?.emit('join_room', {
          roomCode: roomCode.toUpperCase(),
          player,
          isHost,
        });
        resolve();
      });

      this.socket.on('game_packet', (packet: NetworkPacket) => {
        this.packetHandlers.forEach((h) => h(packet));
      });

      this.socket.on('pong_latency', (latency: number) => {
        this.pingMs = latency;
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[Socket Connection Error]:', err);
        this.setStatus('error');
        reject(err);
      });

      this.socket.on('disconnect', () => {
        this.setStatus('disconnected');
        this.stopPing();
      });
    });
  }

  public send(packet: NetworkPacket): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('game_packet', packet);
    }
  }

  public disconnect(): void {
    this.stopPing();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.setStatus('disconnected');
    this.packetHandlers = [];
    this.statusHandlers = [];
  }
}
