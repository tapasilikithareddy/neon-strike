import { describe, it, expect } from 'vitest';
import { createMultiplayerTransport } from '../src/multiplayer/transportFactory';
import { SocketTransport } from '../src/multiplayer/socketTransport';
import { PeerTransport } from '../src/multiplayer/peerTransport';
import { GameRoom } from '../server/gameRoom';
import { PlayerInfo } from '../src/types/game';

describe('Server & Transport Production Architecture', () => {
  const mockHost: PlayerInfo = {
    id: 'host_p1',
    name: 'CyberStriker',
    side: 'bottom',
    isHost: true,
    isReady: false,
    avatarSeed: 'seed_h',
  };

  const mockGuest: PlayerInfo = {
    id: 'guest_p2',
    name: 'NeonPhantom',
    side: 'top',
    isHost: false,
    isReady: false,
    avatarSeed: 'seed_g',
  };

  it('creates SocketTransport by default for production reliability', () => {
    const transport = createMultiplayerTransport();
    expect(transport).toBeInstanceOf(SocketTransport);
    expect(transport.getStatus()).toBe('disconnected');
  });

  it('preserves PeerTransport when webrtc mode is requested', () => {
    const originalEnv = process.env.VITE_MULTIPLAYER_TRANSPORT;
    try {
      (import.meta.env as any).VITE_MULTIPLAYER_TRANSPORT = 'webrtc';
      const transport = createMultiplayerTransport();
      expect(transport).toBeInstanceOf(PeerTransport);
      expect(transport.getStatus()).toBe('disconnected');
    } finally {
      (import.meta.env as any).VITE_MULTIPLAYER_TRANSPORT = originalEnv;
    }
  });

  it('tracks room active timestamp and cleans up upon player removal', () => {
    const packets: any[] = [];
    const room = new GameRoom('ROOM_PROD', mockHost, (p) => packets.push(p));

    const initialActive = room.lastActive;
    expect(initialActive).toBeGreaterThan(0);

    // Guest enters
    expect(room.setGuest(mockGuest)).toBe(true);
    expect(room.guest?.name).toBe('NeonPhantom');

    // Guest leaves
    const removedGuest = room.removePlayer('guest_p2');
    expect(removedGuest).toBe('guest');
    expect(room.guest).toBeNull();

    // Host leaves
    const removedHost = room.removePlayer('host_p1');
    expect(removedHost).toBe('host');
  });
});
