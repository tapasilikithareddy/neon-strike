import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  TABLE_WIDTH,
  TABLE_HEIGHT,
  GOAL_WIDTH,
  GOAL_DEPTH,
  GOAL_X_MIN,
  GOAL_X_MAX,
  PUCK_RADIUS,
  PADDLE_RADIUS,
  COLOR_BG,
  COLOR_RINK,
  COLOR_CYAN,
  COLOR_MAGENTA,
  WINNING_SCORE,
  COUNTDOWN_DURATION,
  GOAL_RESET_DELAY_MS,
} from '../engine/constants';
import {
  GameState,
  PlayerInfo,
  PlayerSide,
  Puck,
  Paddle,
  Vector2D,
  AIDifficulty,
} from '../types/game';
import {
  stepPuckPhysics,
  clampPaddlePosition,
  checkGoal,
  createResetPuck,
  createInitialGameState,
} from '../engine/physics';
import { ParticleSystem } from '../engine/particleSystem';
import { soundEngine } from '../engine/soundEngine';
import { CyberBotAI } from '../engine/ai';
import { IMultiplayerTransport } from '../multiplayer/transport';
import { NetworkPacket } from '../types/multiplayer';
import { GameHUD } from './GameHUD';
import { GoalBanner } from './GoalBanner';
import { GameOverModal } from './GameOverModal';

interface GameArenaProps {
  localPlayer: PlayerInfo;
  remotePlayer: PlayerInfo | null;
  transport?: IMultiplayerTransport | null;
  roomCode?: string;
  isPractice?: boolean;
  practiceDifficulty?: AIDifficulty;
  onLeave: () => void;
}

export const GameArena: React.FC<GameArenaProps> = ({
  localPlayer,
  remotePlayer,
  transport,
  roomCode,
  isPractice = false,
  practiceDifficulty = 'EASY',
  onLeave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRinkRef = useRef<HTMLCanvasElement | null>(null);
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());
  const cyberBotRef = useRef<CyberBotAI>(new CyberBotAI(practiceDifficulty));

  // Sync AI difficulty changes
  useEffect(() => {
    if (cyberBotRef.current) {
      cyberBotRef.current.setDifficulty(practiceDifficulty);
    }
  }, [practiceDifficulty]);

  // Local authoritative or mirrored state
  const gameStateRef = useRef<GameState>(createInitialGameState());
  const [hudState, setHudState] = useState<{
    scoreBottom: number;
    scoreTop: number;
    status: GameState['status'];
    winner: PlayerSide | null;
    countdown: number | null;
    lastGoalScorer: PlayerSide | null;
  }>({
    scoreBottom: 0,
    scoreTop: 0,
    status: 'starting',
    winner: null,
    countdown: 3,
    lastGoalScorer: null,
  });

  const [pingMs, setPingMs] = useState(18);

  // Dragging & Input State
  const isDraggingRef = useRef(false);
  const lastPointerPosRef = useRef<Vector2D>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT * 0.85 });
  const localSide = localPlayer.side; // 'bottom' or 'top'
  const isHost = localPlayer.isHost || isPractice;

  // Rematch request state
  const [rematchRequested, setRematchRequested] = useState(false);

  // --- Network synchronization handlers ---
  useEffect(() => {
    if (!transport || isPractice) return;

    const handlePacket = (packet: NetworkPacket) => {
      if (packet.type === 'PADDLE_UPDATE') {
        // Received opponent paddle update
        const state = gameStateRef.current;
        if (packet.side === 'top') {
          state.paddleTop.x = packet.x;
          state.paddleTop.y = packet.y;
          state.paddleTop.vx = packet.vx;
          state.paddleTop.vy = packet.vy;
        } else if (packet.side === 'bottom') {
          state.paddleBottom.x = packet.x;
          state.paddleBottom.y = packet.y;
          state.paddleBottom.vx = packet.vx;
          state.paddleBottom.vy = packet.vy;
        }
      } else if (packet.type === 'GAME_SYNC') {
        // Guest receives authoritative state from Host
        if (!isHost) {
          const incoming = packet.state;
          const current = gameStateRef.current;

          // Sound triggers on score changes
          if (
            incoming.scoreBottom !== current.scoreBottom ||
            incoming.scoreTop !== current.scoreTop
          ) {
            soundEngine.playGoal();
            if (incoming.lastGoalScorer) {
              const color = incoming.lastGoalScorer === 'bottom' ? COLOR_CYAN : COLOR_MAGENTA;
              particleSystemRef.current.triggerGoalExplosion(
                TABLE_WIDTH / 2,
                incoming.lastGoalScorer === 'bottom' ? 20 : TABLE_HEIGHT - 20,
                color
              );
            }
          }

          gameStateRef.current = incoming;

          // Guard: Only trigger React reconciliation when HUD state changes
          setHudState((prev) => {
            if (
              prev.scoreBottom === incoming.scoreBottom &&
              prev.scoreTop === incoming.scoreTop &&
              prev.status === incoming.status &&
              prev.winner === incoming.winner &&
              prev.countdown === incoming.countdown &&
              prev.lastGoalScorer === incoming.lastGoalScorer
            ) {
              return prev; // Bail out of React re-render
            }
            return {
              scoreBottom: incoming.scoreBottom,
              scoreTop: incoming.scoreTop,
              status: incoming.status,
              winner: incoming.winner,
              countdown: incoming.countdown,
              lastGoalScorer: incoming.lastGoalScorer,
            };
          });
        }
      } else if (packet.type === 'GOAL_EVENT') {
        soundEngine.playGoal();
        const color = packet.scorer === 'bottom' ? COLOR_CYAN : COLOR_MAGENTA;
        particleSystemRef.current.triggerGoalExplosion(
          TABLE_WIDTH / 2,
          packet.scorer === 'bottom' ? 20 : TABLE_HEIGHT - 20,
          color
        );
      } else if (packet.type === 'COUNTDOWN_START') {
        soundEngine.playCountdown(packet.count);
        setHudState((prev) => ({ ...prev, countdown: packet.count }));
      } else if (packet.type === 'REMATCH_ACCEPT') {
        startMatchCountdown();
      }
    };

    transport.onPacket(handlePacket);

    const pingInterval = setInterval(() => {
      setPingMs(transport.getPing());
    }, 1000);

    return () => {
      clearInterval(pingInterval);
    };
  }, [transport, isHost, isPractice]);

  // --- Countdown & Match Initialization ---
  const startMatchCountdown = useCallback(() => {
    let count = COUNTDOWN_DURATION;
    const state = gameStateRef.current;
    state.status = 'starting';
    state.countdown = count;
    state.scoreBottom = 0;
    state.scoreTop = 0;
    state.winner = null;
    state.puck = createResetPuck();
    setRematchRequested(false);

    soundEngine.playCountdown(count);
    setHudState({
      scoreBottom: 0,
      scoreTop: 0,
      status: 'starting',
      winner: null,
      countdown: count,
      lastGoalScorer: null,
    });

    if (transport && isHost) {
      transport.send({
        type: 'COUNTDOWN_START',
        count,
        timestamp: Date.now(),
      });
    }

    const timer = setInterval(() => {
      count--;
      state.countdown = count;
      soundEngine.playCountdown(count);

      setHudState((prev) => ({
        ...prev,
        countdown: count,
      }));

      if (transport && isHost) {
        transport.send({
          type: 'COUNTDOWN_START',
          count,
          timestamp: Date.now(),
        });
      }

      if (count <= 0) {
        clearInterval(timer);
        state.status = 'playing';
        state.countdown = null;
        setHudState((prev) => ({
          ...prev,
          status: 'playing',
          countdown: null,
        }));
      }
    }, 1000);
  }, [transport, isHost]);

  useEffect(() => {
    startMatchCountdown();
  }, [startMatchCountdown]);

  // --- Main 60 FPS Game Loop & Canvas Rendering ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let syncTimer = 0;

    const getOrCreateRinkCanvas = () => {
      if (offscreenRinkRef.current) return offscreenRinkRef.current;
      const offscreen = document.createElement('canvas');
      offscreen.width = TABLE_WIDTH;
      offscreen.height = TABLE_HEIGHT;
      const oCtx = offscreen.getContext('2d');
      if (oCtx) {
        oCtx.fillStyle = COLOR_RINK;
        oCtx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
        drawRink(oCtx);
        drawGoals(oCtx);
      }
      offscreenRinkRef.current = offscreen;
      return offscreen;
    };

    const render = (time: number) => {
      const dt = Math.min(0.04, (time - lastTime) / 1000);
      lastTime = time;

      const state = gameStateRef.current;
      const particles = particleSystemRef.current;

      // Authoritative Simulation (Host or Solo Practice)
      if (isHost && state.status === 'playing') {
        // AI Update if in Solo Practice Mode
        if (isPractice) {
          cyberBotRef.current.update(state.paddleTop, state.puck, dt);
        }

        // Physics step
        const events = stepPuckPhysics(
          state.puck,
          state.paddleBottom,
          state.paddleTop,
          dt
        );

        // Track max puck speed in stats
        const currentSpeed = Math.hypot(state.puck.vx, state.puck.vy);
        if (currentSpeed > state.stats.maxPuckSpeed) {
          state.stats.maxPuckSpeed = currentSpeed;
        }

        // Process audio & particle events
        events.forEach((ev) => {
          if (ev.type === 'paddle_hit') {
            soundEngine.playPaddleHit(ev.intensity);
            particles.triggerImpact(
              ev.x,
              ev.y,
              ev.side === 'bottom' ? COLOR_CYAN : COLOR_MAGENTA,
              12
            );
          } else if (ev.type === 'wall_hit') {
            soundEngine.playWallHit(ev.intensity);
            particles.triggerImpact(ev.x, ev.y, '#ffffff', 8);
          }
        });

        // Check goal condition
        const scorer = checkGoal(state.puck);
        if (scorer) {
          state.status = 'goal_scored';
          state.lastGoalScorer = scorer;

          if (scorer === 'bottom') {
            state.scoreBottom++;
          } else {
            state.scoreTop++;
          }

          soundEngine.playGoal();
          const goalColor = scorer === 'bottom' ? COLOR_CYAN : COLOR_MAGENTA;
          particles.triggerGoalExplosion(
            TABLE_WIDTH / 2,
            scorer === 'bottom' ? 20 : TABLE_HEIGHT - 20,
            goalColor
          );

          setHudState({
            scoreBottom: state.scoreBottom,
            scoreTop: state.scoreTop,
            status: 'goal_scored',
            winner: null,
            countdown: null,
            lastGoalScorer: scorer,
          });

          if (transport) {
            transport.send({
              type: 'GOAL_EVENT',
              scorer,
              scoreBottom: state.scoreBottom,
              scoreTop: state.scoreTop,
              timestamp: Date.now(),
            });
          }

          // Check Win Condition (First to 5)
          if (state.scoreBottom >= WINNING_SCORE || state.scoreTop >= WINNING_SCORE) {
            const winner = state.scoreBottom >= WINNING_SCORE ? 'bottom' : 'top';
            state.status = 'game_over';
            state.winner = winner;
            state.stats.endTime = Date.now();

            setHudState((prev) => ({
              ...prev,
              status: 'game_over',
              winner,
            }));
          } else {
            // Reset puck after 2-second goal pause
            setTimeout(() => {
              if (gameStateRef.current.status === 'goal_scored') {
                gameStateRef.current.puck = createResetPuck(
                  scorer === 'bottom' ? 'top' : 'bottom'
                );
                gameStateRef.current.status = 'playing';
                gameStateRef.current.lastGoalScorer = null;
                setHudState((prev) => ({
                  ...prev,
                  status: 'playing',
                  lastGoalScorer: null,
                }));
              }
            }, GOAL_RESET_DELAY_MS);
          }
        }

        // Broadcast authoritative state at 45Hz to guest
        syncTimer += dt;
        if (syncTimer >= 1 / 45 && transport) {
          syncTimer = 0;
          transport.send({
            type: 'GAME_SYNC',
            state,
            timestamp: Date.now(),
          });
        }
      }

      // Update particle physics
      particles.update(dt);

      // --- Draw Canvas Frame ---
      ctx.save();

      // Screen Shake
      if (particles.shakeAmount > 0) {
        const shakeX = (Math.random() - 0.5) * particles.shakeAmount;
        const shakeY = (Math.random() - 0.5) * particles.shakeAmount;
        ctx.translate(shakeX, shakeY);
      }

      // Pre-rendered Static Rink & Goal Grates from Offscreen Canvas
      const rinkCanvas = getOrCreateRinkCanvas();
      ctx.drawImage(rinkCanvas, 0, 0);

      // Draw Puck Trail
      state.puck.trail.forEach((t) => {
        ctx.fillStyle = `rgba(0, 240, 255, ${t.alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, state.puck.radius * 0.85, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Puck
      drawPuck(ctx, state.puck);

      // Draw Paddles
      drawPaddle(ctx, state.paddleBottom, COLOR_CYAN, 'bottom');
      drawPaddle(ctx, state.paddleTop, COLOR_MAGENTA, 'top');

      // Draw Particles
      particles.render(ctx);

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isHost, isPractice, transport]);

  // --- Drawing Helpers ---
  const drawRink = (ctx: CanvasRenderingContext2D) => {
    ctx.save();

    // Subtle table grid texture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let x = 40; x < TABLE_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, TABLE_HEIGHT);
      ctx.stroke();
    }
    for (let y = 40; y < TABLE_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(TABLE_WIDTH, y);
      ctx.stroke();
    }

    // Outer table border with neon glow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, TABLE_WIDTH - 8, TABLE_HEIGHT - 8);

    // Cyan Bottom half glow line
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.shadowColor = COLOR_CYAN;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.strokeRect(10, TABLE_HEIGHT / 2, TABLE_WIDTH - 20, TABLE_HEIGHT / 2 - 14);

    // Magenta Top half glow line
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.35)';
    ctx.shadowColor = COLOR_MAGENTA;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 14, TABLE_WIDTH - 20, TABLE_HEIGHT / 2 - 14);

    // Center dividing line & circle
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, TABLE_HEIGHT / 2);
    ctx.lineTo(TABLE_WIDTH - 10, TABLE_HEIGHT / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 75, 0, Math.PI * 2);
    ctx.stroke();

    // Center point
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawGoals = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    // Top Goal (Opponent Net - Magenta)
    ctx.fillStyle = 'rgba(255, 0, 127, 0.15)';
    ctx.fillRect(GOAL_X_MIN, 0, GOAL_WIDTH, GOAL_DEPTH);
    ctx.strokeStyle = COLOR_MAGENTA;
    ctx.lineWidth = 3;
    ctx.shadowColor = COLOR_MAGENTA;
    ctx.shadowBlur = 15;
    ctx.strokeRect(GOAL_X_MIN, 0, GOAL_WIDTH, GOAL_DEPTH);

    // Bottom Goal (Your Net - Cyan)
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.fillRect(GOAL_X_MIN, TABLE_HEIGHT - GOAL_DEPTH, GOAL_WIDTH, GOAL_DEPTH);
    ctx.strokeStyle = COLOR_CYAN;
    ctx.lineWidth = 3;
    ctx.shadowColor = COLOR_CYAN;
    ctx.shadowBlur = 15;
    ctx.strokeRect(GOAL_X_MIN, TABLE_HEIGHT - GOAL_DEPTH, GOAL_WIDTH, GOAL_DEPTH);

    ctx.restore();
  };

  const drawPuck = (ctx: CanvasRenderingContext2D, puck: Puck) => {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = COLOR_CYAN;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(puck.x, puck.y, puck.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner neon concentric circle
    ctx.strokeStyle = COLOR_CYAN;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(puck.x, puck.y, puck.radius * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  };

  const drawPaddle = (
    ctx: CanvasRenderingContext2D,
    paddle: Paddle,
    glowColor: string,
    side: PlayerSide
  ) => {
    ctx.save();
    // Outer glow aura
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(paddle.x, paddle.y, paddle.radius, 0, Math.PI * 2);
    ctx.fill();

    // Darker inner striker body
    ctx.fillStyle = '#060913';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(paddle.x, paddle.y, paddle.radius * 0.72, 0, Math.PI * 2);
    ctx.fill();

    // Center handle knob
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(paddle.x, paddle.y, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // --- Input Handling: Touch & Pointer Controls ---
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    updatePaddleFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    updatePaddleFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    isDraggingRef.current = false;
  };

  const updatePaddleFromPointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = TABLE_WIDTH / rect.width;
    const scaleY = TABLE_HEIGHT / rect.height;

    let targetX = (clientX - rect.left) * scaleX;
    let targetY = (clientY - rect.top) * scaleY;

    // Both players intuitively play from the bottom of their screen
    // If localSide === 'top', we mirror the target position
    if (localSide === 'top') {
      targetX = TABLE_WIDTH - targetX;
      targetY = TABLE_HEIGHT - targetY;
    }

    const paddle = localSide === 'bottom'
      ? gameStateRef.current.paddleBottom
      : gameStateRef.current.paddleTop;

    // Calculate movement impulse / velocity
    const vx = targetX - paddle.x;
    const vy = targetY - paddle.y;

    paddle.x = targetX;
    paddle.y = targetY;
    paddle.vx = vx;
    paddle.vy = vy;

    // Enforce strict clamping
    const clamped = clampPaddlePosition(paddle, localSide);
    paddle.x = clamped.x;
    paddle.y = clamped.y;

    // Send update over network if multiplayer guest or host
    if (transport && !isPractice) {
      transport.send({
        type: 'PADDLE_UPDATE',
        side: localSide,
        x: paddle.x,
        y: paddle.y,
        vx: paddle.vx,
        vy: paddle.vy,
        timestamp: Date.now(),
      });
    }
  };

  // Keyboard navigation fallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const paddle = localSide === 'bottom'
        ? gameStateRef.current.paddleBottom
        : gameStateRef.current.paddleTop;

      const step = 18;
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dx -= step;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dx += step;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dy -= step;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dy += step;

      if (dx !== 0 || dy !== 0) {
        paddle.x += dx;
        paddle.y += dy;
        paddle.vx = dx;
        paddle.vy = dy;

        const clamped = clampPaddlePosition(paddle, localSide);
        paddle.x = clamped.x;
        paddle.y = clamped.y;

        if (transport && !isPractice) {
          transport.send({
            type: 'PADDLE_UPDATE',
            side: localSide,
            x: paddle.x,
            y: paddle.y,
            vx: paddle.vx,
            vy: paddle.vy,
            timestamp: Date.now(),
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localSide, transport, isPractice]);

  const handleRematch = () => {
    if (isPractice) {
      startMatchCountdown();
      return;
    }

    setRematchRequested(true);
    if (transport) {
      transport.send({
        type: 'REMATCH_REQUEST',
        senderSide: localSide,
        timestamp: Date.now(),
      });
      if (isHost) {
        transport.send({
          type: 'REMATCH_ACCEPT',
          timestamp: Date.now(),
        });
        startMatchCountdown();
      }
    }
  };

  return (
    <div className="arena-layout-container">
      {/* Top HUD */}
      <GameHUD
        scoreBottom={hudState.scoreBottom}
        scoreTop={hudState.scoreTop}
        localPlayer={localPlayer}
        remotePlayer={remotePlayer}
        roomCode={roomCode}
        pingMs={pingMs}
        isPractice={isPractice}
        practiceDifficulty={practiceDifficulty}
        onLeave={onLeave}
      />

      {/* Canvas Wrapper */}
      <div className="arena-canvas-wrapper mt-12 sm:mt-16">
        <canvas
          ref={canvasRef}
          width={TABLE_WIDTH}
          height={TABLE_HEIGHT}
          className="arena-canvas"
          style={{
            width: '100%',
            maxWidth: '520px',
            height: 'auto',
            aspectRatio: `${TABLE_WIDTH} / ${TABLE_HEIGHT}`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* 3... 2... 1... Countdown Overlay */}
        {hudState.countdown !== null && (
          <div className="countdown-overlay">
            <span className="text-sm font-heading font-bold uppercase tracking-widest text-[#00f0ff] mb-2">
              ARENA ENGAGED
            </span>
            <div className="countdown-number">
              {hudState.countdown === 0 ? 'GO!' : hudState.countdown}
            </div>
          </div>
        )}

        {/* Goal Banner Alert */}
        {hudState.status === 'goal_scored' && hudState.lastGoalScorer && (
          <GoalBanner
            scorerSide={hudState.lastGoalScorer}
            localSide={localSide}
            scorerName={
              hudState.lastGoalScorer === localSide
                ? localPlayer.name
                : isPractice
                ? `Cyber-Bot (${practiceDifficulty === 'EASY' ? 'Easy' : practiceDifficulty === 'MEDIUM' ? 'Pro' : 'Elite'})`
                : remotePlayer?.name || 'Opponent'
            }
          />
        )}
      </div>

      {/* Game Over Modal */}
      {hudState.status === 'game_over' && hudState.winner && (
        <GameOverModal
          winner={hudState.winner}
          localPlayer={localPlayer}
          remotePlayer={remotePlayer}
          scoreBottom={hudState.scoreBottom}
          scoreTop={hudState.scoreTop}
          stats={gameStateRef.current.stats}
          isPractice={isPractice}
          onRematch={handleRematch}
          onLeave={onLeave}
        />
      )}
    </div>
  );
};
