import React, { useState } from 'react';
import { X, Bot, Zap, Play, Shield, Gauge } from 'lucide-react';
import { AIDifficulty } from '../types/game';

interface PracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (difficulty: AIDifficulty) => void;
}

export const PracticeModal: React.FC<PracticeModalProps> = ({
  isOpen,
  onClose,
  onStart,
}) => {
  const [difficulty, setDifficulty] = useState<AIDifficulty>('EASY');

  if (!isOpen) return null;

  const handleLaunch = () => {
    onStart(difficulty);
    onClose();
  };

  const options: Array<{
    id: AIDifficulty;
    title: string;
    badge: string;
    speed: string;
    desc: string;
    activeClass: string;
    glowBorder: string;
  }> = [
    {
      id: 'EASY',
      title: 'CASUAL DRILL',
      badge: 'RECOMMENDED',
      speed: '280 px/s · 320ms reaction',
      desc: 'Relaxed speed, delayed human-like reactions, and imperfect aim. Ideal for casual rallies and practice.',
      activeClass: 'active-easy',
      glowBorder: 'border-[#00f0ff] bg-[rgba(0,240,255,0.08)] shadow-[0_0_20px_rgba(0,240,255,0.25)]',
    },
    {
      id: 'MEDIUM',
      title: 'PRO CIRCUIT',
      badge: 'BALANCED',
      speed: '480 px/s · 160ms reaction',
      desc: 'Active defensive shadowing, moderate speed, and strategic counter-strikes along the centerline.',
      activeClass: 'active-medium',
      glowBorder: 'border-[#ffb703] bg-[rgba(255,183,3,0.08)] shadow-[0_0_20px_rgba(255,183,3,0.25)]',
    },
    {
      id: 'CYBER_ELITE',
      title: 'CYBER-ELITE',
      badge: 'HARDCORE',
      speed: '680 px/s · 70ms reaction',
      desc: 'Rapid bank shot anticipation, fast counter-attacks, and aggressive net coverage for masters.',
      activeClass: 'active-hard',
      glowBorder: 'border-[#ff007f] bg-[rgba(255,0,127,0.08)] shadow-[0_0_20px_rgba(255,0,127,0.25)]',
    },
  ];

  return (
    <div className="modal-overlay">
      <div className="glass-panel-elevated w-full max-w-lg p-6 sm:p-8 relative border border-[rgba(0,240,255,0.3)] shadow-[0_0_50px_rgba(0,240,255,0.2)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#94a3b8] hover:text-white transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-2">
          <Bot className="text-[#00f0ff]" size={20} />
          <span className="text-xs font-heading font-bold uppercase tracking-widest text-[#00f0ff]">
            SINGLE PLAYER SIMULATION
          </span>
        </div>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight mb-2">
          SOLO <span className="gradient-text-cyan">DRILL</span>
        </h2>
        <p className="text-xs text-[#94a3b8] font-sans mb-6">
          Choose your sparring bot intensity before entering the rink.
        </p>

        {/* Difficulty Cards */}
        <div className="flex flex-col gap-3 mb-6">
          {options.map((opt) => {
            const isSelected = difficulty === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setDifficulty(opt.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? opt.glowBorder
                    : 'border-[rgba(255,255,255,0.08)] bg-[rgba(14,22,40,0.5)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(20,30,55,0.6)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-base text-white uppercase tracking-wider">
                      {opt.title}
                    </span>
                    <span
                      className={`text-[9px] font-heading font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        opt.id === 'EASY'
                          ? 'bg-[rgba(0,240,255,0.15)] text-[#00f0ff] border border-[rgba(0,240,255,0.3)]'
                          : opt.id === 'MEDIUM'
                          ? 'bg-[rgba(255,183,3,0.15)] text-[#ffb703] border border-[rgba(255,183,3,0.3)]'
                          : 'bg-[rgba(255,0,127,0.15)] text-[#ff007f] border border-[rgba(255,0,127,0.3)]'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#94a3b8] font-heading uppercase flex items-center gap-1">
                    <Gauge size={12} />
                    {opt.speed}
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8] font-sans leading-relaxed">
                  {opt.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Launch Button */}
        <button
          onClick={handleLaunch}
          className="w-full cyber-btn cyber-btn-cyan text-base py-3.5 cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.4)]"
        >
          <Play size={18} className="fill-[#060913]" />
          LAUNCH {difficulty === 'CYBER_ELITE' ? 'ELITE' : difficulty} MATCH
        </button>
      </div>
    </div>
  );
};
