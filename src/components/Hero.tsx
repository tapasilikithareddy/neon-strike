import React, { useEffect, useRef } from 'react';
import { Plus, LogIn, Bot, Zap, Trophy, Users, Wifi } from 'lucide-react';
import {
  COLOR_CYAN,
  COLOR_MAGENTA,
  COLOR_BG,
  COLOR_RINK,
  GOAL_WIDTH,
  GOAL_X_MIN,
  GOAL_X_MAX,
} from '../engine/constants';

interface HeroProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onStartPractice: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onCreateRoom,
  onJoinRoom,
  onStartPractice,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated arena preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = 360;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    // Simulation state for hero demo
    let puck = { x: width / 2, y: height / 2, vx: 3.5, vy: 4.2, r: 10 };
    let paddleBottom = { x: width / 2, y: height * 0.82, r: 18 };
    let paddleTop = { x: width / 2, y: height * 0.18, r: 18 };
    let trail: Array<{ x: number; y: number; alpha: number }> = [];

    const loop = () => {
      // AI rally logic for preview
      paddleBottom.x += (puck.x - paddleBottom.x) * 0.08;
      paddleTop.x += (puck.x - paddleTop.x) * 0.08;

      puck.x += puck.vx;
      puck.y += puck.vy;

      // Wall bounces
      if (puck.x - puck.r < 10) {
        puck.x = 10 + puck.r;
        puck.vx *= -1;
      }
      if (puck.x + puck.r > width - 10) {
        puck.x = width - 10 - puck.r;
        puck.vx *= -1;
      }

      // Paddle hit checks
      const dBottom = Math.hypot(puck.x - paddleBottom.x, puck.y - paddleBottom.y);
      if (dBottom < paddleBottom.r + puck.r) {
        puck.vy = -Math.abs(puck.vy);
        puck.vx += (puck.x - paddleBottom.x) * 0.15;
      }

      const dTop = Math.hypot(puck.x - paddleTop.x, puck.y - paddleTop.y);
      if (dTop < paddleTop.r + puck.r) {
        puck.vy = Math.abs(puck.vy);
        puck.vx += (puck.x - paddleTop.x) * 0.15;
      }

      // Respawn if past goal lines
      if (puck.y < 5 || puck.y > height - 5) {
        puck.x = width / 2;
        puck.y = height / 2;
        puck.vy = puck.y < 5 ? 3.5 : -3.5;
        puck.vx = (Math.random() - 0.5) * 4;
      }

      // Trail
      if (trail.length > 10) trail.shift();
      trail.push({ x: puck.x, y: puck.y, alpha: 0.7 });
      trail.forEach((t) => (t.alpha *= 0.85));

      // Clear & Draw
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, width, height);

      // Arena borders & glow
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // Center line & circle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(10, height / 2);
      ctx.lineTo(width - 10, height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 45, 0, Math.PI * 2);
      ctx.stroke();

      // Goal markings
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.fillRect(width / 2 - 40, height - 12, 80, 8);
      ctx.fillStyle = 'rgba(255, 0, 127, 0.15)';
      ctx.fillRect(width / 2 - 40, 4, 80, 8);

      // Puck Trail
      trail.forEach((t) => {
        ctx.fillStyle = `rgba(0, 240, 255, ${t.alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, puck.r * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Puck
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(puck.x, puck.y, puck.r, 0, Math.PI * 2);
      ctx.fill();

      // Paddles
      // Bottom Paddle (Cyan)
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(paddleBottom.x, paddleBottom.y, paddleBottom.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(paddleBottom.x, paddleBottom.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Top Paddle (Magenta)
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(paddleTop.x, paddleTop.y, paddleTop.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(paddleTop.x, paddleTop.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <section className="relative pt-28 pb-16 px-4 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 z-10">
      {/* Left Column: Headlines & Actions */}
      <div className="flex-1 text-center lg:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.25)] text-[#00f0ff] text-xs font-heading font-bold uppercase tracking-widest mb-6">
          <Zap size={14} className="fill-[#00f0ff]" />
          Real-Time Cross-Device Esports Arena
        </div>

        <h1 className="font-display font-black text-4xl sm:text-6xl xl:text-7xl tracking-tight text-white uppercase leading-[1.05] mb-6">
          ENTER THE <span className="gradient-text-cyan">ARENA.</span>
        </h1>

        <p className="text-lg sm:text-xl text-[#94a3b8] font-heading font-medium tracking-wide max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
          Challenge your friends. Own the table. Claim the crown. High-velocity
          physics with instant zero-lag peer synchronization.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
          <button
            onClick={onCreateRoom}
            className="w-full sm:w-auto cyber-btn cyber-btn-cyan text-base px-8 py-4 shadow-[0_0_25px_rgba(0,240,255,0.4)]"
          >
            <Plus size={20} strokeWidth={2.5} />
            CREATE ROOM
          </button>

          <button
            onClick={onJoinRoom}
            className="w-full sm:w-auto cyber-btn cyber-btn-magenta text-base px-8 py-4 shadow-[0_0_25px_rgba(255,0,127,0.4)]"
          >
            <LogIn size={20} strokeWidth={2.5} />
            JOIN WITH CODE
          </button>

          <button
            onClick={onStartPractice}
            className="w-full sm:w-auto cyber-btn cyber-btn-outline text-base px-6 py-4"
            title="Single-player practice match against Cyber-Bot"
          >
            <Bot size={20} />
            SOLO DRILL
          </button>
        </div>

        {/* Value Props Bar */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0 pt-4 border-t border-[rgba(255,255,255,0.08)]">
          <div className="flex flex-col items-center lg:items-start">
            <span className="font-display font-bold text-lg text-white">60 FPS</span>
            <span className="text-[11px] text-[#94a3b8] uppercase tracking-wider font-heading">
              Physics Engine
            </span>
          </div>
          <div className="flex flex-col items-center lg:items-start">
            <span className="font-display font-bold text-lg text-[#00f0ff]">&lt; 30ms</span>
            <span className="text-[11px] text-[#94a3b8] uppercase tracking-wider font-heading">
              P2P WebRTC Sync
            </span>
          </div>
          <div className="flex flex-col items-center lg:items-start">
            <span className="font-display font-bold text-lg text-[#ff007f]">FIRST TO 5</span>
            <span className="text-[11px] text-[#94a3b8] uppercase tracking-wider font-heading">
              Crown Victory
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Live Animated Arena Preview */}
      <div className="flex-1 flex justify-center w-full max-w-md lg:max-w-none">
        <div className="relative p-3 rounded-3xl bg-gradient-to-b from-[rgba(0,240,255,0.25)] via-[rgba(255,0,127,0.15)] to-transparent border border-[rgba(255,255,255,0.1)] shadow-[0_0_60px_rgba(0,240,255,0.15)]">
          <div className="relative rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.12)]">
            <canvas
              ref={canvasRef}
              className="w-full max-w-[340px] sm:max-w-[380px] h-auto block"
            />
            {/* Live Preview Floating Tag */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(6,9,19,0.85)] border border-[rgba(0,240,255,0.4)] text-[10px] font-heading font-bold text-[#00f0ff] uppercase tracking-widest backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
              SIMULATION ACTIVE
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
