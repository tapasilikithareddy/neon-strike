import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GameRoom } from './gameRoom';
import { PlayerInfo } from '../src/types/game';
import { NetworkPacket } from '../src/types/multiplayer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
app.use(cors());
app.use(express.json());

// Serve Vite production build assets if dist exists
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 20000,
  pingInterval: 10000,
});

const rooms: Map<string, GameRoom> = new Map();
const socketToRoom: Map<string, { roomCode: string; playerId: string }> = new Map();

// REST Health Check & Active Rooms count
app.get('/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'NEON STRIKE Game Server',
    roomsActive: rooms.size,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: Date.now(),
  });
});

// Single Page Application (SPA) fallback to index.html
app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('⚡ NEON STRIKE Server is online. Build the frontend with `npm run build` to serve the web arena.');
  }
});

io.on('connection', (socket: Socket) => {
  console.log(`[Socket Connected]: ${socket.id}`);

  // Latency ping-pong probe
  socket.on('ping_check', (clientTimestamp: number) => {
    socket.emit('pong_latency', Date.now() - clientTimestamp);
  });

  socket.on('join_room', ({ roomCode, player, isHost }: { roomCode: string; player: PlayerInfo; isHost: boolean }) => {
    const code = roomCode.toUpperCase().trim();

    if (isHost) {
      // Create new room
      const existing = rooms.get(code);
      if (existing) {
        socket.emit('game_packet', {
          type: 'JOIN_REJECT',
          reason: 'Arena code already active. Please generate a new arena code.',
          timestamp: Date.now(),
        });
        return;
      }

      const room = new GameRoom(code, player, (packet: NetworkPacket) => {
        io.to(code).emit('game_packet', packet);
      });
      rooms.set(code, room);
      socket.join(code);
      socketToRoom.set(socket.id, { roomCode: code, playerId: player.id });

      console.log(`[Room Created]: ${code} by ${player.name}`);
      return;
    }

    // Joining existing room
    const room = rooms.get(code);
    if (!room) {
      socket.emit('game_packet', {
        type: 'JOIN_REJECT',
        reason: 'Arena not found or room code expired.',
        timestamp: Date.now(),
      });
      return;
    }

    if (room.guest) {
      socket.emit('game_packet', {
        type: 'JOIN_REJECT',
        reason: 'Arena is full. Maximum 2 players allowed.',
        timestamp: Date.now(),
      });
      return;
    }

    // Add guest player
    const guestPlayer: PlayerInfo = {
      ...player,
      side: 'top',
      isHost: false,
    };
    room.setGuest(guestPlayer);
    socket.join(code);
    socketToRoom.set(socket.id, { roomCode: code, playerId: player.id });

    // Notify guest of successful join
    socket.emit('game_packet', {
      type: 'JOIN_ACCEPT',
      roomCode: code,
      host: room.host,
      guest: guestPlayer,
      assignedSide: 'top',
      timestamp: Date.now(),
    });

    // Notify host that guest entered
    socket.to(code).emit('game_packet', {
      type: 'JOIN_REQUEST',
      player: guestPlayer,
      timestamp: Date.now(),
    });

    console.log(`[Guest Joined]: ${code} - ${player.name}`);
  });

  socket.on('game_packet', (packet: NetworkPacket) => {
    const mapping = socketToRoom.get(socket.id);
    if (!mapping) return;
    const room = rooms.get(mapping.roomCode);
    if (!room) return;

    room.lastActive = Date.now();

    if (packet.type === 'PADDLE_UPDATE') {
      room.updatePaddle(packet.side, packet.x, packet.y, packet.vx, packet.vy);
      socket.to(mapping.roomCode).emit('game_packet', packet);
    } else if (packet.type === 'READY_TOGGLE') {
      room.toggleReady(packet.playerId, packet.isReady);
      socket.to(mapping.roomCode).emit('game_packet', packet);
    } else if (packet.type === 'REMATCH_REQUEST') {
      room.handleRematch(packet.senderSide);
      socket.to(mapping.roomCode).emit('game_packet', packet);
    } else {
      // Forward all game packets (GAME_SYNC, GOAL_EVENT, COUNTDOWN_START, GAME_START, REMATCH_ACCEPT, etc.)
      socket.to(mapping.roomCode).emit('game_packet', packet);
    }
  });

  socket.on('disconnect', () => {
    const mapping = socketToRoom.get(socket.id);
    if (mapping) {
      const room = rooms.get(mapping.roomCode);
      if (room) {
        const removed = room.removePlayer(mapping.playerId);
        if (removed === 'host') {
          io.to(mapping.roomCode).emit('game_packet', {
            type: 'PLAYER_LEFT',
            reason: 'Host left the arena. Game ended.',
            timestamp: Date.now(),
          });
          rooms.delete(mapping.roomCode);
        } else if (removed === 'guest') {
          io.to(mapping.roomCode).emit('game_packet', {
            type: 'PLAYER_LEFT',
            reason: 'Opponent left the arena.',
            timestamp: Date.now(),
          });
        }
      }
      socketToRoom.delete(socket.id);
    }
    console.log(`[Socket Disconnected]: ${socket.id}`);
  });
});

// Periodic inactive room garbage collection (every 5 minutes, removes rooms inactive for 30m)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActive > 30 * 60 * 1000) {
      rooms.delete(code);
      console.log(`[Room Cleaned Up]: ${code} (inactive)`);
    }
  }
}, 5 * 60 * 1000);

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`⚡ NEON STRIKE Game Server listening on http://${HOST}:${PORT}`);
});
