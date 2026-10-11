import { describe, it, expect } from 'vitest';
import {
  clampPaddlePosition,
  handlePaddlePuckCollision,
  handleWallCollisions,
  clampPuckSpeed,
  stepPuckPhysics,
} from '../src/engine/physics';
import {
  TABLE_WIDTH,
  TABLE_HEIGHT,
  PADDLE_RADIUS,
  PUCK_RADIUS,
  PUCK_MAX_SPEED,
} from '../src/engine/constants';
import { Paddle, Puck } from '../src/types/game';

describe('Physics Engine', () => {
  it('strictly clamps bottom paddle to bottom half of the arena', () => {
    const bottomPaddle: Paddle = {
      x: 100,
      y: 100, // Illegal: inside top half!
      vx: 0,
      vy: 0,
      radius: PADDLE_RADIUS,
      side: 'bottom',
    };

    const clamped = clampPaddlePosition(bottomPaddle, 'bottom');
    // Must be pushed below centerline
    expect(clamped.y).toBeGreaterThanOrEqual(TABLE_HEIGHT / 2 + PADDLE_RADIUS);
    expect(clamped.x).toBeGreaterThanOrEqual(PADDLE_RADIUS);
  });

  it('strictly clamps top paddle to top half of the arena', () => {
    const topPaddle: Paddle = {
      x: TABLE_WIDTH + 100, // Illegal: past right wall
      y: TABLE_HEIGHT * 0.9, // Illegal: inside bottom half
      vx: 0,
      vy: 0,
      radius: PADDLE_RADIUS,
      side: 'top',
    };

    const clamped = clampPaddlePosition(topPaddle, 'top');
    expect(clamped.x).toBeLessThanOrEqual(TABLE_WIDTH - PADDLE_RADIUS);
    expect(clamped.y).toBeLessThanOrEqual(TABLE_HEIGHT / 2 - PADDLE_RADIUS);
  });

  it('detects paddle-puck collision and pushes puck out to prevent overlap', () => {
    const paddle: Paddle = {
      x: 300,
      y: 800,
      vx: 0,
      vy: -10, // moving upward into puck
      radius: PADDLE_RADIUS,
      side: 'bottom',
    };

    const puck: Puck = {
      x: 300,
      y: 770, // overlapping paddle from above (dy = -30, minDist = 62)
      vx: 0,
      vy: 2,
      radius: PUCK_RADIUS,
      trail: [],
    };

    const collision = handlePaddlePuckCollision(paddle, puck);
    expect(collision).not.toBeNull();
    expect(collision?.type).toBe('paddle_hit');

    // Distance between centers must now be >= sum of radii
    const dist = Math.hypot(puck.x - paddle.x, puck.y - paddle.y);
    expect(dist).toBeGreaterThanOrEqual(PADDLE_RADIUS + PUCK_RADIUS - 0.001);

    // Puck must have acquired upward momentum (negative vy)
    expect(puck.vy).toBeLessThan(0);
  });

  it('clamps puck speed to PUCK_MAX_SPEED', () => {
    const puck: Puck = {
      x: 300,
      y: 500,
      vx: 50,
      vy: 60,
      radius: PUCK_RADIUS,
      trail: [],
    };

    clampPuckSpeed(puck);
    const speed = Math.hypot(puck.vx, puck.vy);
    expect(speed).toBeLessThanOrEqual(PUCK_MAX_SPEED + 0.001);
  });

  it('reflects puck off side walls cleanly', () => {
    const puck: Puck = {
      x: -5, // past left wall
      y: 500,
      vx: -15,
      vy: 5,
      radius: PUCK_RADIUS,
      trail: [],
    };

    const event = handleWallCollisions(puck);
    expect(event).not.toBeNull();
    expect(event?.type).toBe('wall_hit');
    expect(puck.x).toBe(PUCK_RADIUS);
    expect(puck.vx).toBeGreaterThan(0); // bounced to the right
  });
});
