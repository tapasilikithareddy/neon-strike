export const TABLE_WIDTH = 600;
export const TABLE_HEIGHT = 1000;

export const GOAL_WIDTH = 220;
export const GOAL_DEPTH = 25;
export const GOAL_X_MIN = (TABLE_WIDTH - GOAL_WIDTH) / 2; // 190
export const GOAL_X_MAX = GOAL_X_MIN + GOAL_WIDTH;       // 410

export const PUCK_RADIUS = 24;
export const PADDLE_RADIUS = 38;

export const PUCK_MAX_SPEED = 36;
export const PUCK_MIN_SPEED = 0.05;
export const PUCK_FRICTION = 0.993; // Air table surface low friction

export const WALL_RESTITUTION = 0.94;
export const PADDLE_RESTITUTION = 1.10; // Extra punch on paddle strikes

export const WINNING_SCORE = 5;
export const COUNTDOWN_DURATION = 3;
export const GOAL_RESET_DELAY_MS = 2200;

export const COLOR_CYAN = '#00f0ff';
export const COLOR_MAGENTA = '#ff007f';
export const COLOR_ULTRAVIOLET = '#7928ca';
export const COLOR_BG = '#060913';
export const COLOR_RINK = '#0a0f1d';
export const COLOR_PUCK = '#00f0ff';
export const COLOR_PUCK_GLOW = 'rgba(0, 240, 255, 0.6)';
export const COLOR_PADDLE_BOTTOM = '#00f0ff';
export const COLOR_PADDLE_TOP = '#ff007f';
