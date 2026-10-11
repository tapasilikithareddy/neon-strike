import { describe, it, expect } from 'vitest';
import { checkGoal, createResetPuck, createInitialGameState } from '../src/engine/physics';
import {
  TABLE_WIDTH,
  TABLE_HEIGHT,
  GOAL_X_MIN,
  GOAL_X_MAX,
  PUCK_RADIUS,
  WINNING_SCORE,
} from '../src/engine/constants';
import { Puck } from '../src/types/game';

describe('Scoring & Match Rules', () => {
  it('detects goal for bottom player when puck crosses top goal line within goal mouth', () => {
    const puck: Puck = {
      x: (GOAL_X_MIN + GOAL_X_MAX) / 2, // centered in goal mouth
      y: -5,                            // crosses top line (y < 0)
      vx: 0,
      vy: -10,
      radius: PUCK_RADIUS,
      trail: [],
    };

    const scorer = checkGoal(puck);
    expect(scorer).toBe('bottom');
  });

  it('detects goal for top player when puck crosses bottom goal line within goal mouth', () => {
    const puck: Puck = {
      x: (GOAL_X_MIN + GOAL_X_MAX) / 2, // centered in goal mouth
      y: TABLE_HEIGHT + 5,             // crosses bottom line (y > TABLE_HEIGHT)
      vx: 0,
      vy: 10,
      radius: PUCK_RADIUS,
      trail: [],
    };

    const scorer = checkGoal(puck);
    expect(scorer).toBe('top');
  });

  it('does NOT register goal when puck hits top wall outside goal mouth', () => {
    const puck: Puck = {
      x: 50, // far away from goal mouth (GOAL_X_MIN is ~190)
      y: -5,
      vx: 0,
      vy: -10,
      radius: PUCK_RADIUS,
      trail: [],
    };

    const scorer = checkGoal(puck);
    expect(scorer).toBeNull();
  });

  it('initializes game state with score 0-0 and no winner', () => {
    const state = createInitialGameState();
    expect(state.scoreBottom).toBe(0);
    expect(state.scoreTop).toBe(0);
    expect(state.winner).toBeNull();
    expect(state.status).toBe('idle');
  });

  it('winning score threshold is exactly 5', () => {
    expect(WINNING_SCORE).toBe(5);
  });

  it('creates reset puck properly centered', () => {
    const resetPuck = createResetPuck();
    expect(resetPuck.x).toBe(TABLE_WIDTH / 2);
    expect(resetPuck.radius).toBe(PUCK_RADIUS);
  });
});
