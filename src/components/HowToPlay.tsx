import React from 'react';
import { Smartphone, MousePointer, ShieldCheck, Zap, X } from 'lucide-react';

interface HowToPlayProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const HowToPlay: React.FC<HowToPlayProps> = ({ onClose, isModal = false }) => {
  const steps = [
    {
      step: '01',
      title: 'CREATE OR JOIN',
      desc: 'Launch a private arena or join using a 6-character room code or one-click battle link. Play from separate phones, tablets, or computers across any internet connection.',
      icon: <Zap className="text-[#00f0ff]" size={26} />,
      color: 'border-[rgba(0,240,255,0.3)] shadow-[0_0_20px_rgba(0,240,255,0.15)]',
    },
    {
      step: '02',
      title: 'CONTROL YOUR MALLET',
      desc: 'Drag your glowing paddle with your finger on mobile or glide with mouse/WASD on desktop. Your movement is legally clamped to your defensive half of the table.',
      icon: <MousePointer className="text-[#8b5cf6]" size={26} />,
      color: 'border-[rgba(139,92,246,0.3)] shadow-[0_0_20px_rgba(139,92,246,0.15)]',
    },
    {
      step: '03',
      title: 'STRIKE & SCORE',
      desc: 'Defend your goal line, unleash velocity bank-shots off the neon walls, and punch the puck into the enemy net. The first striker to score 5 goals claims the crown!',
      icon: <ShieldCheck className="text-[#ff007f]" size={26} />,
      color: 'border-[rgba(255,0,127,0.3)] shadow-[0_0_20px_rgba(255,0,127,0.15)]',
    },
  ];

  return (
    <section id="how-to-play" className={`relative z-10 ${isModal ? 'p-6 sm:p-8' : 'py-20 px-4 max-w-7xl mx-auto'}`}>
      {isModal && (
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
            <h2 className="font-display font-black text-2xl text-white uppercase tracking-wider">
              RULES & CONTROLS
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#94a3b8] hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>
      )}

      {!isModal && (
        <div className="text-center mb-16">
          <span className="text-xs font-heading font-bold uppercase tracking-widest text-[#00f0ff] mb-2 block">
            ARENA COMBAT GUIDE
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-white uppercase tracking-tight">
            HOW TO <span className="gradient-text-cyan">PLAY</span>
          </h2>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {steps.map((item, idx) => (
          <div
            key={idx}
            className={`glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden border ${item.color} transition-all hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-black text-3xl text-white opacity-20">
                {item.step}
              </span>
              <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">
                {item.icon}
              </div>
            </div>
            <h3 className="font-heading font-bold text-xl text-white uppercase tracking-wider mb-3">
              {item.title}
            </h3>
            <p className="text-sm text-[#94a3b8] leading-relaxed font-sans">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Controls Quick Sheet */}
      <div className="glass-panel p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.2)] text-[#00f0ff]">
            <MousePointer size={22} />
          </div>
          <div>
            <h4 className="font-heading font-bold text-white text-base uppercase tracking-wider">
              Desktop Controls
            </h4>
            <p className="text-xs text-[#94a3b8]">
              Move mouse / cursor to steer paddle. Arrow keys or W/A/S/D supported for keyboard input.
            </p>
          </div>
        </div>

        <div className="h-[1px] sm:h-10 w-full sm:w-[1px] bg-[rgba(255,255,255,0.08)]" />

        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[rgba(255,0,127,0.08)] border border-[rgba(255,0,127,0.2)] text-[#ff007f]">
            <Smartphone size={22} />
          </div>
          <div>
            <h4 className="font-heading font-bold text-white text-base uppercase tracking-wider">
              Mobile Touch Controls
            </h4>
            <p className="text-xs text-[#94a3b8]">
              Direct touch and drag. Table auto-locks screen to eliminate accidental page scroll.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
