import React from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { PlayerSide } from '../types/game';

interface GoalBannerProps {
  scorerSide: PlayerSide | null;
  localSide: PlayerSide;
  scorerName: string;
}

export const GoalBanner: React.FC<GoalBannerProps> = ({
  scorerSide,
  localSide,
  scorerName,
}) => {
  if (!scorerSide) return null;

  const isYou = scorerSide === localSide;
  const accentColor = isYou ? '#00f0ff' : '#ff007f';

  return (
    <div className="goal-banner-overlay">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={20} style={{ color: accentColor }} />
        <span
          className="text-xs font-heading font-bold uppercase tracking-widest"
          style={{ color: accentColor }}
        >
          {isYou ? 'POINT SECURED!' : 'DEFENSE BREACHED!'}
        </span>
      </div>

      <div
        className="goal-banner-title"
        style={{
          color: '#ffffff',
          textShadow: `0 0 25px ${accentColor}, 0 0 50px ${accentColor}`,
        }}
      >
        GOAL!
      </div>

      <div className="font-heading font-bold text-lg text-[#f8fafc] tracking-wider mt-1">
        SCORED BY <span style={{ color: accentColor }}>{scorerName.toUpperCase()}</span>
      </div>
    </div>
  );
};
