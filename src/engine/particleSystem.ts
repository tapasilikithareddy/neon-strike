import { COLOR_CYAN, COLOR_MAGENTA } from './constants';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

const MAX_PARTICLES = 45;

export class ParticleSystem {
  private particles: Particle[] = [];
  public shakeAmount: number = 0;
  private prefersReducedMotion: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  public triggerImpact(x: number, y: number, color: string = COLOR_CYAN, count: number = 8) {
    if (this.prefersReducedMotion) return;

    // Do not exceed max particle capacity
    const available = MAX_PARTICLES - this.particles.length;
    const spawnCount = Math.min(count, available);
    if (spawnCount <= 0) return;

    for (let i = 0; i < spawnCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 2,
        color,
        alpha: 1,
        life: 0,
        maxLife: 16 + Math.random() * 10,
      });
    }
  }

  public triggerGoalExplosion(x: number, y: number, scorerColor: string) {
    if (!this.prefersReducedMotion) {
      this.shakeAmount = 10;
    }

    const count = this.prefersReducedMotion ? 12 : 30;
    const colors = [scorerColor, '#ffffff', COLOR_CYAN, COLOR_MAGENTA];

    // Clear older particles to give priority to goal explosion
    this.particles = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 9;
      const chosenColor = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color: chosenColor,
        alpha: 1,
        life: 0,
        maxLife: 35 + Math.random() * 20,
      });
    }
  }

  public update(dt: number) {
    // Decay screen shake
    if (this.shakeAmount > 0) {
      this.shakeAmount *= 0.85;
      if (this.shakeAmount < 0.2) this.shakeAmount = 0;
    }

    const timeScale = Math.min(2.0, dt * 60);

    // Update active particles in-place
    let writeIdx = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life += timeScale;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life < p.maxLife && p.alpha > 0.05) {
        this.particles[writeIdx++] = p;
      }
    }
    this.particles.length = writeIdx;
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (this.particles.length === 0) return;

    ctx.save();
    // Fast GPU-accelerated additive blend mode without expensive shadowBlur
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  public clear() {
    this.particles = [];
    this.shakeAmount = 0;
  }
}
