import {
  TABLE_WIDTH,
  TABLE_HEIGHT,
  GOAL_WIDTH,
  GOAL_X_MIN,
  GOAL_X_MAX,
  PUCK_RADIUS,
  PADDLE_RADIUS,
  PUCK_MAX_SPEED,
  PUCK_MIN_SPEED,
  PUCK_FRICTION,
  WALL_RESTITUTION,
  PADDLE_RESTITUTION,
} from './constants';
import { GameState, Paddle, PlayerSide, Puck, Vector2D } from '../types/game';

export interface CollisionEvent {
  type: 'paddle_hit' | 'wall_hit' | 'goal';
  x: number;
  y: number;
  intensity: number;
  side?: PlayerSide;
}

/**
 * Clamps paddle position to its legal table half and inner borders.
 */
export function clampPaddlePosition(paddle: Paddle, side: PlayerSide): Vector2D {
  const minX = paddle.radius;
  const maxX = TABLE_WIDTH - paddle.radius;

  let minY = 0;
  let maxY = 0;

  if (side === 'bottom') {
    // Player 1 (Bottom Half): must stay between centerline and bottom wall
    minY = TABLE_HEIGHT / 2 + paddle.radius;
    maxY = TABLE_HEIGHT - paddle.radius;
  } else {
    // Player 2 (Top Half): must stay between top wall and centerline
    minY = paddle.radius;
    maxY = TABLE_HEIGHT / 2 - paddle.radius;
  }

  return {
    x: Math.max(minX, Math.min(maxX, paddle.x)),
    y: Math.max(minY, Math.min(maxY, paddle.y)),
  };
}

/**
 * Resolves continuous elastic collision between paddle and puck.
 */
export function handlePaddlePuckCollision(
  paddle: Paddle,
  puck: Puck
): CollisionEvent | null {
  const dx = puck.x - paddle.x;
  const dy = puck.y - paddle.y;
  const dist = Math.hypot(dx, dy);
  const minDist = paddle.radius + puck.radius;

  if (dist >= minDist) {
    return null;
  }

  // Normal vector from paddle to puck
  const nx = dist === 0 ? 0 : dx / dist;
  const ny = dist === 0 ? 1 : dy / dist;

  // Push puck outside the paddle circle to prevent overlap
  puck.x = paddle.x + nx * minDist;
  puck.y = paddle.y + ny * minDist;

  // Relative velocity
  const rvx = puck.vx - paddle.vx;
  const rvy = puck.vy - paddle.vy;

  // Velocity along normal
  const velAlongNormal = rvx * nx + rvy * ny;

  // If moving toward each other, apply elastic collision impulse
  if (velAlongNormal < 0) {
    const impulse = -(1 + PADDLE_RESTITUTION) * velAlongNormal;

    // Apply impulse along collision normal + transfer paddle momentum
    puck.vx += nx * impulse + paddle.vx * 0.45;
    puck.vy += ny * impulse + paddle.vy * 0.45;
  } else {
    // If overlapping but moving away/slow, ensure puck clears paddle along normal
    puck.vx += nx * 6 + paddle.vx * 0.4;
    puck.vy += ny * 6 + paddle.vy * 0.4;
  }

  // Minimum hit impulse so puck never gets stuck
  const speed = Math.hypot(puck.vx, puck.vy);
  if (speed < 5) {
    puck.vx = (nx === 0 ? 0 : nx) * 8;
    puck.vy = (ny === 0 ? 1 : ny) * 8;
  }

  // Clamp to maximum speed
  clampPuckSpeed(puck);

  return {
    type: 'paddle_hit',
    x: puck.x,
    y: puck.y,
    intensity: Math.min(1, Math.max(0.2, speed / PUCK_MAX_SPEED)),
    side: paddle.side,
  };
}

/**
 * Resolves puck collisions against table boundaries and goal mouth openings.
 */
export function handleWallCollisions(puck: Puck): CollisionEvent | null {
  let event: CollisionEvent | null = null;

  // Left wall
  if (puck.x - puck.radius < 0) {
    puck.x = puck.radius;
    puck.vx = -puck.vx * WALL_RESTITUTION;
    event = {
      type: 'wall_hit',
      x: 0,
      y: puck.y,
      intensity: Math.min(1, Math.abs(puck.vx) / 20),
    };
  }

  // Right wall
  if (puck.x + puck.radius > TABLE_WIDTH) {
    puck.x = TABLE_WIDTH - puck.radius;
    puck.vx = -puck.vx * WALL_RESTITUTION;
    event = {
      type: 'wall_hit',
      x: TABLE_WIDTH,
      y: puck.y,
      intensity: Math.min(1, Math.abs(puck.vx) / 20),
    };
  }

  // Top boundary (Top Goal area vs Wall)
  const isTopGoalMouth =
    puck.x >= GOAL_X_MIN + puck.radius * 0.5 &&
    puck.x <= GOAL_X_MAX - puck.radius * 0.5;

  if (puck.y - puck.radius < 0) {
    if (!isTopGoalMouth) {
      // Bounces off top wall
      puck.y = puck.radius;
      puck.vy = -puck.vy * WALL_RESTITUTION;
      event = {
        type: 'wall_hit',
        x: puck.x,
        y: 0,
        intensity: Math.min(1, Math.abs(puck.vy) / 20),
      };
    }
  }

  // Bottom boundary (Bottom Goal area vs Wall)
  const isBottomGoalMouth =
    puck.x >= GOAL_X_MIN + puck.radius * 0.5 &&
    puck.x <= GOAL_X_MAX - puck.radius * 0.5;

  if (puck.y + puck.radius > TABLE_HEIGHT) {
    if (!isBottomGoalMouth) {
      // Bounces off bottom wall
      puck.y = TABLE_HEIGHT - puck.radius;
      puck.vy = -puck.vy * WALL_RESTITUTION;
      event = {
        type: 'wall_hit',
        x: puck.x,
        y: TABLE_HEIGHT,
        intensity: Math.min(1, Math.abs(puck.vy) / 20),
      };
    }
  }

  // Corner post collisions (goal edges)
  checkGoalPostCollision(puck, GOAL_X_MIN, 0);
  checkGoalPostCollision(puck, GOAL_X_MAX, 0);
  checkGoalPostCollision(puck, GOAL_X_MIN, TABLE_HEIGHT);
  checkGoalPostCollision(puck, GOAL_X_MAX, TABLE_HEIGHT);

  return event;
}

function checkGoalPostCollision(puck: Puck, postX: number, postY: number) {
  const postRadius = 6;
  const dx = puck.x - postX;
  const dy = puck.y - postY;
  const dist = Math.hypot(dx, dy);
  const minDist = puck.radius + postRadius;

  if (dist < minDist && dist > 0) {
    const nx = dx / dist;
    const ny = dy / dist;
    puck.x = postX + nx * minDist;
    puck.y = postY + ny * minDist;

    const dot = puck.vx * nx + puck.vy * ny;
    if (dot < 0) {
      puck.vx -= 2 * dot * nx;
      puck.vy -= 2 * dot * ny;
    }
  }
}

/**
 * Checks if puck has entered top or bottom goal.
 * Returns 'bottom' if bottom player scored (into top goal),
 * or 'top' if top player scored (into bottom goal).
 */
export function checkGoal(puck: Puck): PlayerSide | null {
  // Inside horizontal goal mouth
  const inGoalMouth = puck.x >= GOAL_X_MIN && puck.x <= GOAL_X_MAX;

  if (inGoalMouth) {
    // Crosses top goal line -> Bottom player scored!
    if (puck.y < 0) {
      return 'bottom';
    }
    // Crosses bottom goal line -> Top player scored!
    if (puck.y > TABLE_HEIGHT) {
      return 'top';
    }
  }

  return null;
}

export function clampPuckSpeed(puck: Puck) {
  const speed = Math.hypot(puck.vx, puck.vy);
  if (speed > PUCK_MAX_SPEED) {
    puck.vx = (puck.vx / speed) * PUCK_MAX_SPEED;
    puck.vy = (puck.vy / speed) * PUCK_MAX_SPEED;
  }
}

/**
 * Updates puck movement, friction, trail, and sub-stepped physics.
 */
export function stepPuckPhysics(
  puck: Puck,
  paddleBottom: Paddle,
  paddleTop: Paddle,
  dt: number
): CollisionEvent[] {
  const events: CollisionEvent[] = [];

  // Apply friction
  const frictionFactor = Math.pow(PUCK_FRICTION, dt * 60);
  puck.vx *= frictionFactor;
  puck.vy *= frictionFactor;

  if (Math.hypot(puck.vx, puck.vy) < PUCK_MIN_SPEED) {
    puck.vx = 0;
    puck.vy = 0;
  }

  // 3 sub-steps to eliminate tunneling at 36px/frame
  const steps = 3;
  const subDt = dt / steps;

  for (let i = 0; i < steps; i++) {
    puck.x += puck.vx * subDt * 60;
    puck.y += puck.vy * subDt * 60;

    // Paddle collisions
    const hitBottom = handlePaddlePuckCollision(paddleBottom, puck);
    if (hitBottom) events.push(hitBottom);

    const hitTop = handlePaddlePuckCollision(paddleTop, puck);
    if (hitTop) events.push(hitTop);

    // Wall collisions
    const hitWall = handleWallCollisions(puck);
    if (hitWall) events.push(hitWall);
  }

  // Trail management
  if (puck.trail.length > 12) {
    puck.trail.shift();
  }
  puck.trail.push({ x: puck.x, y: puck.y, alpha: 0.8 });
  for (let i = 0; i < puck.trail.length; i++) {
    puck.trail[i].alpha *= 0.85;
  }

  return events;
}

/**
 * Resets puck to center table or serves toward player.
 */
export function createResetPuck(towardsSide?: PlayerSide): Puck {
  return {
    x: TABLE_WIDTH / 2,
    y: towardsSide === 'bottom' ? TABLE_HEIGHT / 2 - 40 : TABLE_HEIGHT / 2 + 40,
    vx: (Math.random() - 0.5) * 2,
    vy: towardsSide === 'bottom' ? -4 : towardsSide === 'top' ? 4 : 0,
    radius: PUCK_RADIUS,
    trail: [],
  };
}

export function createInitialGameState(): GameState {
  return {
    status: 'idle',
    scoreBottom: 0,
    scoreTop: 0,
    winner: null,
    countdown: null,
    lastGoalScorer: null,
    round: 1,
    puck: createResetPuck(),
    paddleBottom: {
      x: TABLE_WIDTH / 2,
      y: TABLE_HEIGHT * 0.85,
      vx: 0,
      vy: 0,
      radius: PADDLE_RADIUS,
      side: 'bottom',
    },
    paddleTop: {
      x: TABLE_WIDTH / 2,
      y: TABLE_HEIGHT * 0.15,
      vx: 0,
      vy: 0,
      radius: PADDLE_RADIUS,
      side: 'top',
    },
    stats: {
      goalsBottom: 0,
      goalsTop: 0,
      shotsBottom: 0,
      shotsTop: 0,
      savesBottom: 0,
      savesTop: 0,
      maxPuckSpeed: 0,
      startTime: Date.now(),
    },
  };
}
