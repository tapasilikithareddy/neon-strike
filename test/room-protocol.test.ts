import { describe, it, expect, vi } from 'vitest';
import { GameRoom } from '../server/gameRoom';
import { PlayerInfo } from '../src/types/game';
import { NetworkPacket } from '../src/types/multiplayer';

describe('GameRoom & Multiplayer Protocol', () => {
  const mockHost: PlayerInfo = {
    id: 'p1_host',
    name: 'CyberStriker',
    side: 'bottom',
    isHost: true,
    isReady: false,
    avatarSeed: 'alpha',
  };

  const mockGuest: PlayerInfo = {
    id: 'p2_guest',
    name: 'NeonViper',
    side: 'top',
    isHost: false,
    isReady: false,
    avatarSeed: 'beta',
  };

  it('creates room with host in bottom position', () => {
    const packets: NetworkPacket[] = [];
    const room = new GameRoom('ROOM1', mockHost, (p) => packets.push(p));

    expect(room.code).toBe('ROOM1');
    expect(room.host.name).toBe('CyberStriker');
    expect(room.guest).toBeNull();
  });

  it('allows one guest to join, but rejects a second guest (max 2 players)', () => {
    const packets: NetworkPacket[] = [];
    const room = new GameRoom('ROOM2', mockHost, (p) => packets.push(p));

    const joinedFirst = room.setGuest(mockGuest);
    expect(joinedFirst).toBe(true);

    const mockThirdPlayer: PlayerInfo = {
      id: 'p3_intruder',
      name: 'Intruder',
      side: 'top',
      isHost: false,
      isReady: false,
      avatarSeed: 'gamma',
    };

    const joinedSecond = room.setGuest(mockThirdPlayer);
    expect(joinedSecond).toBe(false);
  });

  it('clamps illegal paddle coordinates submitted over network', () => {
    const packets: NetworkPacket[] = [];
    const room = new GameRoom('ROOM3', mockHost, (p) => packets.push(p));
    room.setGuest(mockGuest);

    // Guest tries to move into Host's bottom half (illegal)
    room.updatePaddle('top', 300, 850, 0, 0);

    // Server must enforce clamping into top half
    expect(room.state.paddleTop.y).toBeLessThan(500);
  });

  it('handles clean removal when guest leaves', () => {
    const packets: NetworkPacket[] = [];
    const room = new GameRoom('ROOM4', mockHost, (p) => packets.push(p));
    room.setGuest(mockGuest);

    const removed = room.removePlayer('p2_guest');
    expect(removed).toBe('guest');
    expect(room.guest).toBeNull();
  });
});
