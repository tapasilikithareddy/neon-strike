import React from 'react';
import { Globe2, ShieldCheck, Zap, Cpu, Sparkles, RefreshCw } from 'lucide-react';

export const Features: React.FC = () => {
  const list = [
    {
      title: 'CROSS-NETWORK MULTIPLAYER',
      desc: 'Powered by WebRTC DataChannels with STUN NAT traversal. Two players can duel from different mobile carriers, home Wi-Fi, or continents with direct UDP peer latency.',
      icon: <Globe2 className="text-[#00f0ff]" size={22} />,
    },
    {
      title: 'AUTHORITATIVE ANTI-CHEAT',
      desc: 'Paddle coordinates are mathematically clamped on both ends to legal half-court zones. Puck speed, wall reflections, and goals are validated authoritatively.',
      icon: <ShieldCheck className="text-[#8b5cf6]" size={22} />,
    },
    {
      title: 'SUB-30MS RESPONSIVENESS',
      desc: '60 FPS client prediction and elastic vector physics provide instant tactile mallet strikes, bank shots, and aggressive cross-table smashes.',
      icon: <Zap className="text-[#ffb703]" size={22} />,
    },
    {
      title: 'ADAPTIVE CYBER-BOT DRILL',
      desc: 'No waiting for an opponent. Practice your reflexes against three distinct AI difficulties ranging from Casual to Grandmaster Cyber-Elite.',
      icon: <Cpu className="text-[#ff007f]" size={22} />,
    },
    {
      title: 'PROCEDURAL SYNTHESIZER',
      desc: 'Pure Web Audio API procedural sound engine with mallet hit thumps, metallic wall chimes, siren goal horns, and victory fanfares without asset bloat.',
      icon: <Sparkles className="text-[#00f0ff]" size={22} />,
    },
    {
      title: 'INSTANT REMATCH ENGINE',
      desc: 'Crown the victor at 5 goals. Jump directly into a rematch with synchronized score resets or return to lobby with a single tap.',
      icon: <RefreshCw className="text-[#8b5cf6]" size={22} />,
    },
  ];

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto relative z-10">
      <div className="text-center mb-16">
        <span className="text-xs font-heading font-bold uppercase tracking-widest text-[#ff007f] mb-2 block">
          ENGINE SPECIFICATIONS
        </span>
        <h2 className="font-display font-black text-3xl sm:text-5xl text-white uppercase tracking-tight">
          NEXT-GEN <span className="gradient-text-magenta">EXPERIENCE</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((item, idx) => (
          <div
            key={idx}
            className="glass-panel p-6 rounded-2xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,240,255,0.25)] transition-all hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] group"
          >
            <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] w-fit mb-4 group-hover:scale-105 transition-transform">
              {item.icon}
            </div>
            <h3 className="font-heading font-bold text-lg text-white uppercase tracking-wider mb-2">
              {item.title}
            </h3>
            <p className="text-sm text-[#94a3b8] font-sans leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
