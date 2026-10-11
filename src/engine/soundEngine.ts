class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    // Read user preference from localStorage if available
    try {
      const stored = localStorage.getItem('neon_strike_muted');
      if (stored !== null) {
        this.isMuted = stored === 'true';
      }
    } catch {
      // ignore
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.isInitialized = true;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('neon_strike_muted', String(this.isMuted));
    } catch {
      // ignore
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('neon_strike_muted', String(muted));
    } catch {
      // ignore
    }
  }

  // --- Sound synthesizers ---

  public playPaddleHit(intensity: number = 0.5) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Thumping mallet punch
    const baseFreq = 220 + intensity * 260;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);

    const volume = Math.min(0.4, 0.15 + intensity * 0.25);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playWallHit(intensity: number = 0.5) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Metallic chime
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480 + intensity * 300, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);

    const volume = Math.min(0.25, 0.08 + intensity * 0.15);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playGoal() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Rich dual-synth cyber horn
    [261.63, 392.00, 523.25].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.6);

      gain.gain.setValueAtTime(0.2, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.05);
      osc.stop(t + 0.9);
    });
  }

  public playCountdown(num: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const isGo = num === 0;
    osc.type = isGo ? 'square' : 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, t);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isGo ? 0.35 : 0.15));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + (isGo ? 0.35 : 0.15));
  }

  public playVictory() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Ascending neon fanfare: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.14);

      gain.gain.setValueAtTime(0.25, t + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.14 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.14);
      osc.stop(t + idx * 0.14 + 0.4);
    });
  }
}

export const soundEngine = new SoundEngine();
