import { io, Socket } from 'socket.io-client';

async function runMultiplayerE2ETest() {
  console.log('--- Starting Two Independent Clients E2E Test against http://localhost:3001 ---');

  const serverUrl = 'http://localhost:3001';
  const roomCode = 'E2E99';

  let hostSocket: Socket;
  let guestSocket: Socket;

  try {
    // 1. Connect Host
    hostSocket = io(serverUrl, { transports: ['websocket'] });
    await new Promise<void>((resolve, reject) => {
      hostSocket.on('connect', () => {
        console.log('✓ Host connected to server with socket id:', hostSocket.id);
        resolve();
      });
      hostSocket.on('connect_error', reject);
    });

    // 2. Connect Guest
    guestSocket = io(serverUrl, { transports: ['websocket'] });
    await new Promise<void>((resolve, reject) => {
      guestSocket.on('connect', () => {
        console.log('✓ Guest connected to server with socket id:', guestSocket.id);
        resolve();
      });
      guestSocket.on('connect_error', reject);
    });

    // 3. Host creates room
    const hostPlayer = {
      id: 'host_p1',
      name: 'CyberStriker',
      side: 'bottom' as const,
      isHost: true,
      isReady: false,
      avatarSeed: 'seed_h',
    };

    hostSocket.emit('join_room', {
      roomCode,
      player: hostPlayer,
      isHost: true,
    });
    console.log('✓ Host emitted join_room to create:', roomCode);

    // 4. Guest joins room
    const guestPlayer = {
      id: 'guest_p2',
      name: 'NeonPhantom',
      side: 'top' as const,
      isHost: false,
      isReady: false,
      avatarSeed: 'seed_g',
    };

    // Prepare promises for mutual discovery
    const hostDiscoversGuestPromise = new Promise<any>((resolve) => {
      hostSocket.on('game_packet', (packet: any) => {
        if (packet.type === 'JOIN_REQUEST') {
          console.log('✓ Host received JOIN_REQUEST packet from guest:', packet.player.name);
          resolve(packet);
        }
      });
    });

    const guestReceivesAcceptPromise = new Promise<any>((resolve) => {
      guestSocket.on('game_packet', (packet: any) => {
        if (packet.type === 'JOIN_ACCEPT') {
          console.log('✓ Guest received JOIN_ACCEPT packet for room:', packet.roomCode);
          resolve(packet);
        }
      });
    });

    guestSocket.emit('join_room', {
      roomCode,
      player: guestPlayer,
      isHost: false,
    });

    await Promise.all([hostDiscoversGuestPromise, guestReceivesAcceptPromise]);
    console.log('✓ Mutual player discovery confirmed between Host and Guest!');

    // 5. Ready Up toggle
    const hostReceivesReadyPromise = new Promise<any>((resolve) => {
      hostSocket.on('game_packet', (packet: any) => {
        if (packet.type === 'READY_TOGGLE') {
          console.log('✓ Host received READY_TOGGLE from guest. isReady:', packet.isReady);
          resolve(packet);
        }
      });
    });

    guestSocket.emit('game_packet', {
      type: 'READY_TOGGLE',
      playerId: 'guest_p2',
      isReady: true,
      timestamp: Date.now(),
    });

    await hostReceivesReadyPromise;

    // 6. Paddle movement synchronization
    const hostReceivesPaddlePromise = new Promise<any>((resolve) => {
      hostSocket.on('game_packet', (packet: any) => {
        if (packet.type === 'PADDLE_UPDATE') {
          console.log(`✓ Host received PADDLE_UPDATE from guest at (x:${packet.x}, y:${packet.y})`);
          resolve(packet);
        }
      });
    });

    guestSocket.emit('game_packet', {
      type: 'PADDLE_UPDATE',
      side: 'top',
      x: 380,
      y: 120,
      vx: 4,
      vy: 2,
      timestamp: Date.now(),
    });

    await hostReceivesPaddlePromise;

    // 7. Authoritative Game State Sync (Host -> Guest)
    const guestReceivesSyncPromise = new Promise<any>((resolve) => {
      guestSocket.on('game_packet', (packet: any) => {
        if (packet.type === 'GAME_SYNC') {
          console.log(`✓ Guest received GAME_SYNC. Score: ${packet.state.scoreBottom} - ${packet.state.scoreTop}`);
          resolve(packet);
        }
      });
    });

    hostSocket.emit('game_packet', {
      type: 'GAME_SYNC',
      state: {
        scoreBottom: 1,
        scoreTop: 0,
        status: 'playing',
        winner: null,
        countdown: null,
        lastGoalScorer: 'bottom',
      },
      timestamp: Date.now(),
    });

    await guestReceivesSyncPromise;

    // 8. Goal Event Broadcast
    const guestReceivesGoalPromise = new Promise<any>((resolve) => {
      guestSocket.on('game_packet', (packet: any) => {
        if (packet.type === 'GOAL_EVENT') {
          console.log(`✓ Guest received GOAL_EVENT from scorer: ${packet.scorer}`);
          resolve(packet);
        }
      });
    });

    hostSocket.emit('game_packet', {
      type: 'GOAL_EVENT',
      scorer: 'bottom',
      scoreBottom: 2,
      scoreTop: 0,
      timestamp: Date.now(),
    });

    await guestReceivesGoalPromise;

    // 9. Disconnect handling
    const hostReceivesPlayerLeftPromise = new Promise<any>((resolve) => {
      hostSocket.on('game_packet', (packet: any) => {
        if (packet.type === 'PLAYER_LEFT') {
          console.log(`✓ Host received PLAYER_LEFT alert: ${packet.reason}`);
          resolve(packet);
        }
      });
    });

    guestSocket.disconnect();
    console.log('✓ Guest socket disconnected deliberately to test drop handling');

    await hostReceivesPlayerLeftPromise;

    hostSocket.disconnect();
    console.log('=== ALL MULTIPLAYER E2E TESTS PASSED SUCCESSFULLY! ===');
    process.exit(0);
  } catch (err) {
    console.error('❌ E2E Test Failed:', err);
    process.exit(1);
  }
}

runMultiplayerE2ETest();
