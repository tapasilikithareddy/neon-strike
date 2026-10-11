import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Shield, Play, HelpCircle } from 'lucide-react';
import { soundEngine } from '../engine/soundEngine';

interface NavbarProps {
  onOpenHowToPlay: () => void;
  onStartPractice: () => void;
  inGame?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHowToPlay,
  onStartPractice,
  inGame = false,
}) => {
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());

  const handleToggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundEngine.playPaddleHit(0.4);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-opacity-70 bg-[#060913] backdrop-blur-md border-b border-[rgba(255,255,255,0.08)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 cursor-pointer select-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f0ff] to-[#7928ca] p-[2px] shadow-[0_0_15px_rgba(0,240,255,0.5)]">
            <div className="w-full h-full bg-[#060913] rounded-[10px] flex items-center justify-center">
              <span className="font-display font-black text-lg text-[#00f0ff] tracking-tighter">
                NS
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-xl tracking-wider text-white">
                NEON<span className="text-[#00f0ff]">STRIKE</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-heading font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[rgba(0,240,255,0.12)] text-[#00f0ff] border border-[rgba(0,240,255,0.3)]">
                PRO ARENA
              </span>
            </div>
            <p className="text-[11px] text-[#94a3b8] font-heading tracking-wide uppercase hidden sm:block">
              Multiplayer Air Hockey
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!inGame && (
            <button
              onClick={onStartPractice}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider text-[#00f0ff] bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.25)] hover:bg-[rgba(0,240,255,0.18)] transition-all"
              title="Practice vs Cyber AI"
            >
              <Play size={13} className="fill-[#00f0ff]" />
              Solo Drill
            </button>
          )}

          <button
            onClick={onOpenHowToPlay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider text-[#94a3b8] hover:text-white bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] transition-all"
          >
            <HelpCircle size={15} />
            <span className="hidden sm:inline">Rules</span>
          </button>

          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-lg border transition-all ${
              isMuted
                ? 'text-[#64748b] bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)]'
                : 'text-[#00f0ff] bg-[rgba(0,240,255,0.1)] border-[rgba(0,240,255,0.3)] shadow-[0_0_12px_rgba(0,240,255,0.25)]'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label="Sound Toggle"
          >
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
};
