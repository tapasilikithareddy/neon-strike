import { GameState, PlayerInfo, PlayerSide } from '../src/types/game';
import {
  TABLE_WIDTH,
  TABLE_HEIGHT,
  WINNING_SCORE,
  COUNTDOWN_DURATION,
  GOAL_RESET_DELAY_MS,
} from '../src/engine/constants';
import {
  stepPuckPhysics,
  clampPaddlePosition,
  checkGoal,
  createResetPuck,
  createInitialGameState,
} from '../src/engine/physics';
import { NetworkPacket } from '../src/types/multiplayer';

export class GameRoom {
  public code: string;
  public host: PlayerInfo;
  public guest: PlayerInfo | null = null;
  public state: GameState;
  private loopInterval: NodeJS.Timeout | null = null;
  private broadcastFn: (packet: NetworkPacket) => void;
  public lastActive: number = Date.now();

  constructor(
    code: string,
    host: PlayerInfo,
    broadcastFn: (packet: NetworkPacket) => void
  ) {
    this.code = code;
    this.host = host;
    this.broadcastFn = broadcastFn;
    this.state = createInitialGameState();
  }

  public setGuest(guest: PlayerInfo): boolean {
    if (this.guest) return false;
    this.guest = guest;
    this.lastActive = Date.now();
    return true;
  }

  public removePlayer(playerId: string): 'host' | 'guest' | null {
    if (this.host.id === playerId) {
      this.stopGameLoop();
      return 'host';
    }
    if (this.guest?.id === playerId) {
      this.guest = null;
      this.stopGameLoop();
      this.state.status = 'waiting';
      return 'guest';
    }
    return null;
  }

  public toggleReady(playerId: string, isReady: boolean) {
    if (this.host.id === playerId) {
      this.host.isReady = isReady;
    } else if (this.guest?.id === playerId) {
      this.guest.isReady = isReady;
    }
    this.lastActive = Date.now();
  }

  public startMatchCountdown() {
    let count = COUNTDOWN_DURATION;
    this.state.status = 'starting';
    this.state.countdown = count;

    this.broadcastFn({
      type: 'COUNTDOWN_START',
      count,
      timestamp: Date.now(),
    });

    const timer = setInterval(() => {
      count--;
      this.state.countdown = count;

      this.broadcastFn({
        type: 'COUNTDOWN_START',
        count,
        timestamp: Date.now(),
      });

      if (count <= 0) {
        clearInterval(timer);
        this.startGame();
      }
    }, 1000);
  }

  public startGame() {
    this.state.status = 'playing';
    this.state.countdown = null;
    this.state.scoreBottom = 0;
    this.state.scoreTop = 0;
    this.state.winner = null;
    this.state.puck = createResetPuck();

    this.broadcastFn({
      type: 'GAME_START',
      initialState: this.state,
      timestamp: Date.now(),
    });

    this.startGameLoop();
  }

  public updatePaddle(side: PlayerSide, x: number, y: number, vx: number, vy: number) {
    const paddle = side === 'bottom' ? this.state.paddleBottom : this.state.paddleTop;
    paddle.x = x;
    paddle.y = y;
    paddle.vx = vx;
    paddle.vy = vy;

    // Enforce server-side boundary clamp
    const clamped = clampPaddlePosition(paddle, side);
    paddle.x = clamped.x;
    paddle.y = clamped.y;

    this.lastActive = Date.now();
  }

  private startGameLoop() {
    this.stopGameLoop();
    let lastTime = Date.now();

    this.loopInterval = setInterval(() => {
      if (this.state.status !== 'playing') return;

      const now = Date.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      // Authoritative physics step
      stepPuckPhysics(
        this.state.puck,
        this.state.paddleBottom,
        this.state.paddleTop,
        dt
      );

      // Check for goal
      const goalScorer = checkGoal(this.state.puck);
      if (goalScorer) {
        this.handleGoal(goalScorer);
      }

      // Sync state at 45Hz
      this.broadcastFn({
        type: 'GAME_SYNC',
        state: this.state,
        timestamp: Date.now(),
      });
    }, 1000 / 45);
  }

  private handleGoal(scorer: PlayerSide) {
    this.state.status = 'goal_scored';
    this.state.lastGoalScorer = scorer;

    if (scorer === 'bottom') {
      this.state.scoreBottom++;
    } else {
      this.state.scoreTop++;
    }

    this.broadcastFn({
      type: 'GOAL_EVENT',
      scorer,
      scoreBottom: this.state.scoreBottom,
      scoreTop: this.state.scoreTop,
      timestamp: Date.now(),
    });

    // Check winner (First to 5)
    if (this.state.scoreBottom >= WINNING_SCORE) {
      this.endGame('bottom');
      return;
    }
    if (this.state.scoreTop >= WINNING_SCORE) {
      this.endGame('top');
      return;
    }

    // Reset puck after delay
    setTimeout(() => {
      if (this.state.status === 'goal_scored') {
        this.state.puck = createResetPuck(scorer === 'bottom' ? 'top' : 'bottom');
        this.state.status = 'playing';
      }
    }, GOAL_RESET_DELAY_MS);
  }

  private endGame(winner: PlayerSide) {
    this.state.status = 'game_over';
    this.state.winner = winner;
    this.stopGameLoop();

    this.broadcastFn({
      type: 'GAME_SYNC',
      state: this.state,
      timestamp: Date.now(),
    });
  }

  public handleRematch(senderSide: PlayerSide) {
    // Start fresh game
    this.startGame();
  }

  public stopGameLoop() {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }
}
