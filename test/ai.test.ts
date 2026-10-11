import { describe, it, expect } from 'vitest';
import { CyberBotAI } from '../src/engine/ai';
import { Paddle, Puck } from '../src/types/game';
import { TABLE_WIDTH, TABLE_HEIGHT, PADDLE_RADIUS, PUCK_RADIUS } from '../src/engine/constants';

describe('CyberBotAI Solo Drill Engine', () => {
  const createMockPaddle = (): Paddle => ({
    x: TABLE_WIDTH / 2,
    y: 120,
    vx: 0,
    vy: 0,
    radius: PADDLE_RADIUS,
    side: 'top',
  });

  const createMockPuck = (x: number = TABLE_WIDTH / 2, y: number = 200): Puck => ({
    x,
    y,
    vx: 0,
    vy: 0,
    radius: PUCK_RADIUS,
    trail: [],
  });

  it('defaults to EASY difficulty', () => {
    const bot = new CyberBotAI();
    expect(bot.getDifficulty()).toBe('EASY');
  });

  it('allows changing difficulty to MEDIUM and CYBER_ELITE', () => {
    const bot = new CyberBotAI('EASY');
    bot.setDifficulty('MEDIUM');
    expect(bot.getDifficulty()).toBe('MEDIUM');
    bot.setDifficulty('CYBER_ELITE');
    expect(bot.getDifficulty()).toBe('CYBER_ELITE');
  });

  it('strictly restricts bot paddle to the top half of the arena', () => {
    const bot = new CyberBotAI('CYBER_ELITE');
    const paddle = createMockPaddle();
    // Puck placed deep in bottom half
    const puck = createMockPuck(TABLE_WIDTH / 2, TABLE_HEIGHT * 0.9);

    // Run multiple update frames
    for (let i = 0; i < 60; i++) {
      bot.update(paddle, puck, 0.016);
      expect(paddle.y).toBeLessThanOrEqual(TABLE_HEIGHT / 2 - PADDLE_RADIUS);
      expect(paddle.x).toBeGreaterThanOrEqual(PADDLE_RADIUS);
      expect(paddle.x).toBeLessThanOrEqual(TABLE_WIDTH - PADDLE_RADIUS);
    }
  });

  it('enforces maximum movement speed limits per difficulty level', () => {
    const dt = 0.016; // 60 FPS frame time

    const testBotMaxSpeed = (diff: 'EASY' | 'MEDIUM' | 'CYBER_ELITE') => {
      const bot = new CyberBotAI(diff);
      const paddle = createMockPaddle();
      paddle.x = 100;
      // Target far away to provoke max speed movement
      const puck = createMockPuck(TABLE_WIDTH - 100, 200);

      bot.update(paddle, puck, dt);
      const speed = Math.hypot(paddle.vx, paddle.vy);
      return speed;
    };

    const speedEasy = testBotMaxSpeed('EASY');
    const speedMedium = testBotMaxSpeed('MEDIUM');
    const speedElite = testBotMaxSpeed('CYBER_ELITE');

    // Easy must be noticeably slower than Medium and Elite
    expect(speedEasy).toBeLessThan(speedMedium);
    expect(speedMedium).toBeLessThan(speedElite);

    // Speed in pixels per second:
    // Easy capped at 280 px/s
    expect(speedEasy).toBeLessThanOrEqual(280 + 1);
    // Medium capped at 480 px/s
    expect(speedMedium).toBeLessThanOrEqual(480 + 1);
    // Elite capped at 680 px/s
    expect(speedElite).toBeLessThanOrEqual(680 + 1);
  });

  it('scales movement displacement with elapsed delta-time (time-based physics)', () => {
    const bot = new CyberBotAI('MEDIUM');
    const paddle1 = createMockPaddle();
    const paddle2 = createMockPaddle();
    paddle1.x = 100;
    paddle2.x = 100;
    const puck = createMockPuck(TABLE_WIDTH - 100, 200);

    // Small frame dt
    bot.update(paddle1, puck, 0.01);
    const distSmall = Math.hypot(paddle1.x - 100, paddle1.y - 120);

    // 2x frame dt
    const bot2 = new CyberBotAI('MEDIUM');
    bot2.update(paddle2, puck, 0.02);
    const distLarge = Math.hypot(paddle2.x - 100, paddle2.y - 120);

    // 2x dt should cover approximately 2x distance
    expect(distLarge).toBeGreaterThan(distSmall * 1.8);
    expect(distLarge).toBeLessThan(distSmall * 2.2);
  });
});
