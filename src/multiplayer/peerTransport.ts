import Peer, { DataConnection } from 'peerjs';
import { ConnectionStatus, NetworkPacket, PingPacket, PongPacket } from '../types/multiplayer';
import { PlayerInfo } from '../types/game';
import { IMultiplayerTransport } from './transport';

const PEER_PREFIX = 'neon-strike-v1-';

export class PeerTransport implements IMultiplayerTransport {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private status: ConnectionStatus = 'disconnected';
  private packetHandlers: Array<(packet: NetworkPacket) => void> = [];
  private statusHandlers: Array<(status: ConnectionStatus) => void> = [];
  private pingMs: number = 0;
  private pingInterval: number | null = null;
  private isHost: boolean = false;
  private localPlayer: PlayerInfo | null = null;

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

  public async connect(
    roomCode: string,
    player: PlayerInfo,
    isHost: boolean
  ): Promise<void> {
    this.isHost = isHost;
    this.localPlayer = player;
    this.setStatus('connecting');

    const cleanCode = roomCode.trim().toUpperCase();
    const targetPeerId = `${PEER_PREFIX}${cleanCode}`;

    // STUN configuration for NAT traversal across different mobile/broadband networks
    const peerConfig = {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
      },
    };

    return new Promise((resolve, reject) => {
      let isResolved = false;

      if (isHost) {
        // Host creates peer with specific ID
        this.peer = new Peer(targetPeerId, peerConfig);

        this.peer.on('open', () => {
          this.setStatus('connected');
          if (!isResolved) {
            isResolved = true;
            resolve();
          }
        });

        this.peer.on('connection', (conn) => {
          // If already connected to a guest, reject second incoming connection
          if (this.connection && this.connection.open) {
            conn.on('open', () => {
              conn.send({
                type: 'JOIN_REJECT',
                reason: 'Arena is full. Maximum 2 players allowed.',
                timestamp: Date.now(),
              });
              setTimeout(() => conn.close(), 500);
            });
            return;
          }

          this.setupDataConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.error('[PeerJS Host Error]:', err);
          if (err.type === 'unavailable-id') {
            this.setStatus('error');
            if (!isResolved) {
              isResolved = true;
              reject(new Error('Room code already in use. Please create a new arena.'));
            }
          } else {
            this.setStatus('error');
            if (!isResolved) {
              isResolved = true;
              reject(err);
            }
          }
        });
      } else {
        // Guest creates random peer ID and connects to Host's peer ID
        this.peer = new Peer(peerConfig);

        this.peer.on('open', () => {
          if (!this.peer) return;
          const conn = this.peer.connect(targetPeerId, {
            reliable: true,
          });

          this.setupDataConnection(conn);

          conn.on('open', () => {
            this.setStatus('connected');
            // Send JOIN_REQUEST
            this.send({
              type: 'JOIN_REQUEST',
              player,
              timestamp: Date.now(),
            });

            if (!isResolved) {
              isResolved = true;
              resolve();
            }
          });
        });

        this.peer.on('error', (err) => {
          console.error('[PeerJS Guest Error]:', err);
          this.setStatus('error');
          if (!isResolved) {
            isResolved = true;
            reject(new Error(`Failed to connect to arena: ${err.message}`));
          }
        });
      }

      this.peer.on('disconnected', () => {
        this.setStatus('reconnecting');
      });

      this.peer.on('close', () => {
        this.setStatus('disconnected');
      });
    });
  }

  private setupDataConnection(conn: DataConnection) {
    this.connection = conn;

    conn.on('open', () => {
      this.setStatus('connected');
      this.startPingHeartbeat();
    });

    conn.on('data', (data) => {
      const packet = data as NetworkPacket;
      this.handleIncomingPacket(packet);
    });

    conn.on('close', () => {
      this.setStatus('disconnected');
      this.stopPingHeartbeat();
      this.connection = null;
      // Notify handlers of disconnect
      this.packetHandlers.forEach((h) =>
        h({
          type: 'PLAYER_LEFT',
          reason: 'Opponent disconnected from the arena.',
          timestamp: Date.now(),
        })
      );
    });

    conn.on('error', (err) => {
      console.warn('[DataConnection Error]:', err);
      this.setStatus('error');
    });
  }

  private handleIncomingPacket(packet: NetworkPacket) {
    if (packet.type === 'PING') {
      const ping = packet as PingPacket;
      this.send({
        type: 'PONG',
        clientTime: ping.clientTime,
        timestamp: Date.now(),
      });
      return;
    }

    if (packet.type === 'PONG') {
      const pong = packet as PongPacket;
      const now = Date.now();
      this.pingMs = Math.max(1, Math.round((now - pong.clientTime) / 2));
      return;
    }

    this.packetHandlers.forEach((h) => h(packet));
  }

  public send(packet: NetworkPacket): void {
    if (this.connection && this.connection.open) {
      this.connection.send(packet);
    }
  }

  private startPingHeartbeat() {
    this.stopPingHeartbeat();
    this.pingInterval = window.setInterval(() => {
      if (this.connection && this.connection.open) {
        this.send({
          type: 'PING',
          clientTime: Date.now(),
          timestamp: Date.now(),
        });
      }
    }, 2000);
  }

  private stopPingHeartbeat() {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public disconnect(): void {
    this.stopPingHeartbeat();
    if (this.connection) {
      try {
        this.connection.close();
      } catch {
        // ignore
      }
      this.connection = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // ignore
      }
      this.peer = null;
    }
    this.setStatus('disconnected');
    this.packetHandlers = [];
    this.statusHandlers = [];
  }
}
