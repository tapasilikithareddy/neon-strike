import { AIDifficulty, Paddle, Puck, Vector2D } from '../types/game';
import { TABLE_WIDTH, TABLE_HEIGHT, PADDLE_RADIUS, GOAL_X_MIN, GOAL_X_MAX } from './constants';
import { clampPaddlePosition } from './physics';

export class CyberBotAI {
  private difficulty: AIDifficulty;
  private currentTarget: Vector2D = { x: TABLE_WIDTH / 2, y: 120 };
  private lastDecisionTime: number = 0;
  private decisionIntervalMs: number = 320;
  private aimOffset: number = 0;

  constructor(difficulty: AIDifficulty = 'EASY') {
    this.difficulty = difficulty;
    this.applyDifficultyConfig();
  }

  public getDifficulty(): AIDifficulty {
    return this.difficulty;
  }

  public setDifficulty(difficulty: AIDifficulty) {
    this.difficulty = difficulty;
    this.applyDifficultyConfig();
  }

  private applyDifficultyConfig() {
    switch (this.difficulty) {
      case 'EASY':
        this.decisionIntervalMs = 320;
        break;
      case 'MEDIUM':
        this.decisionIntervalMs = 160;
        break;
      case 'CYBER_ELITE':
        this.decisionIntervalMs = 70;
        break;
      default:
        this.decisionIntervalMs = 320;
    }
  }

  /**
   * Time-based AI update step.
   * @param botPaddle The top player paddle
   * @param puck Current puck state
   * @param dt Elapsed delta time in seconds (clamped)
   */
  public update(botPaddle: Paddle, puck: Puck, dt: number): void {
    const now = performance.now();
    const isPuckInBotHalf = puck.y < TABLE_HEIGHT / 2;

    // Movement speeds in pixels per second (purely time-based, frame-rate independent)
    let speedPxPerSec = 280; // Easy: ~4.6 px/frame at 60fps
    let anticipationFactor = 0.0;
    let aggression = 0.3;
    let maxErrorPx = 35;
    let missChance = 0.25;

    switch (this.difficulty) {
      case 'EASY':
        speedPxPerSec = 280;
        anticipationFactor = 0.0;
        aggression = 0.25;
        maxErrorPx = 35;
        missChance = 0.25;
        break;
      case 'MEDIUM':
        speedPxPerSec = 480; // ~8.0 px/frame at 60fps
        anticipationFactor = 0.25;
        aggression = 0.6;
        maxErrorPx = 14;
        missChance = 0.05;
        break;
      case 'CYBER_ELITE':
        speedPxPerSec = 680; // ~11.3 px/frame at 60fps
        anticipationFactor = 0.55;
        aggression = 0.9;
        maxErrorPx = 4;
        missChance = 0.0;
        break;
    }

    // Human-like reaction delay: only re-evaluate target position at decision intervals
    if (now - this.lastDecisionTime >= this.decisionIntervalMs) {
      this.lastDecisionTime = now;
      this.aimOffset = (Math.random() - 0.5) * 2 * maxErrorPx;

      let targetX = TABLE_WIDTH / 2;
      let targetY = 130;

      const puckSpeed = Math.hypot(puck.vx, puck.vy);
      const isFastShot = puckSpeed > 10;
      const willMiss = isFastShot && Math.random() < missChance;

      if (isPuckInBotHalf) {
        if (willMiss) {
          // Delayed or misplaced defensive stance on fast shots
          targetX = puck.x + (Math.random() > 0.5 ? 60 : -60);
          targetY = 110;
        } else {
          // Track and strike puck
          const predictedX = puck.x + puck.vx * (anticipationFactor * 8);
          targetX = predictedX + this.aimOffset;

          // Strike from above puck
          targetY = Math.min(
            TABLE_HEIGHT / 2 - PADDLE_RADIUS - 15,
            Math.max(PADDLE_RADIUS + 20, puck.y - 25 * aggression)
          );
        }
      } else {
        // Defensive shadowing along goal mouth when puck is on bottom player's side
        const goalCenter = (GOAL_X_MIN + GOAL_X_MAX) / 2;
        // Shadow puck horizontally within goal zone
        targetX = goalCenter + (puck.x - goalCenter) * (0.35 + aggression * 0.25) + this.aimOffset;
        targetY = 120;
      }

      // Clamp target to legal top half space
      targetX = Math.max(PADDLE_RADIUS, Math.min(TABLE_WIDTH - PADDLE_RADIUS, targetX));
      targetY = Math.max(PADDLE_RADIUS, Math.min(TABLE_HEIGHT / 2 - PADDLE_RADIUS, targetY));

      this.currentTarget = { x: targetX, y: targetY };
    }

    // Move smoothly towards currentTarget using speedPxPerSec * dt
    const dx = this.currentTarget.x - botPaddle.x;
    const dy = this.currentTarget.y - botPaddle.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 1) {
      const maxMove = speedPxPerSec * dt;
      const actualMove = Math.min(dist, maxMove);
      const vx = (dx / dist) * actualMove;
      const vy = (dy / dist) * actualMove;

      botPaddle.vx = vx / Math.max(0.016, dt); // normalize velocity vector for collision momentum
      botPaddle.vy = vy / Math.max(0.016, dt);
      botPaddle.x += vx;
      botPaddle.y += vy;
    } else {
      botPaddle.vx = 0;
      botPaddle.vy = 0;
    }

    // Strictly enforce legal area clamping (never cross centerline, never leave rink)
    const clamped = clampPaddlePosition(botPaddle, 'top');
    botPaddle.x = clamped.x;
    botPaddle.y = clamped.y;
  }
}
