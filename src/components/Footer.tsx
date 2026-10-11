import React from 'react';
import { ShieldCheck, Wifi, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 border-t border-[rgba(255,255,255,0.08)] py-12 px-4 bg-[#060913]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Brand */}
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <span className="font-display font-black text-lg text-white">
              NEON<span className="text-[#00f0ff]">STRIKE</span>
            </span>
            <span className="text-[10px] font-heading font-bold text-[#8b5cf6] px-2 py-0.5 rounded bg-[rgba(139,92,246,0.12)] border border-[rgba(139,92,246,0.3)]">
              v1.0.0 ESPORTS
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] font-sans">
            Competitive Real-Time Multiplayer Air Hockey Arena. Designed for mobile & desktop.
          </p>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(0,240,255,0.06)] border border-[rgba(0,240,255,0.2)] text-xs text-[#00f0ff] font-heading font-bold">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            STUN SIGNALING ONLINE
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-xs text-[#94a3b8] font-heading">
            <ShieldCheck size={14} className="text-green-400" />
            ANTI-CHEAT SECURED
          </div>
        </div>
      </div>
    </footer>
  );
};
