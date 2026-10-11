import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, LogOut, Award, Flame, Zap, Clock } from 'lucide-react';
import { MatchStats, PlayerInfo, PlayerSide } from '../types/game';
import { soundEngine } from '../engine/soundEngine';

interface GameOverModalProps {
  winner: PlayerSide;
  localPlayer: PlayerInfo;
  remotePlayer: PlayerInfo | null;
  scoreBottom: number;
  scoreTop: number;
  stats: MatchStats;
  isPractice?: boolean;
  onRematch: () => void;
  onLeave: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  localPlayer,
  remotePlayer,
  scoreBottom,
  scoreTop,
  stats,
  isPractice = false,
  onRematch,
  onLeave,
}) => {
  const isWinner = winner === localPlayer.side;
  const winnerName = isWinner
    ? localPlayer.name
    : isPractice
    ? 'Cyber-Bot 9000'
    : remotePlayer?.name || 'Opponent';

  const myScore = localPlayer.side === 'bottom' ? scoreBottom : scoreTop;
  const oppScore = localPlayer.side === 'bottom' ? scoreTop : scoreBottom;

  useEffect(() => {
    if (isWinner) {
      soundEngine.playVictory();
      // Fire victory confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#ff007f', '#7928ca', '#ffffff'],
        });
      } catch {
        // ignore
      }
    }
  }, [isWinner]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className={`glass-panel-elevated w-full max-w-lg p-6 sm:p-8 text-center relative border ${
        isWinner
          ? 'border-[rgba(0,240,255,0.4)] shadow-[0_0_60px_rgba(0,240,255,0.25)]'
          : 'border-[rgba(255,0,127,0.4)] shadow-[0_0_60px_rgba(255,0,127,0.25)]'
      }`}>
        {/* Crown / Trophy Icon */}
        <div className={`w-20 h-20 mx-auto rounded-3xl p-[2px] mb-5 shadow-2xl ${
          isWinner
            ? 'bg-gradient-to-br from-[#00f0ff] via-[#8b5cf6] to-[#ffb703]'
            : 'bg-gradient-to-br from-[#ff007f] to-[#475569]'
        }`}>
          <div className="w-full h-full bg-[#060913] rounded-[22px] flex items-center justify-center">
            {isWinner ? (
              <Trophy size={36} className="text-[#ffb703] drop-shadow-[0_0_12px_#ffb703]" />
            ) : (
              <Award size={36} className="text-[#ff007f]" />
            )}
          </div>
        </div>

        {/* Title */}
        <span className={`text-xs font-heading font-bold uppercase tracking-widest block mb-1 ${
          isWinner ? 'text-[#00f0ff]' : 'text-[#ff007f]'
        }`}>
          {isWinner ? 'CHAMPION OF THE ARENA' : 'MATCH CONCLUDED'}
        </span>

        <h2 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight mb-2">
          {isWinner ? 'VICTORY SECURED' : 'DEFEATED'}
        </h2>

        <p className="font-heading font-semibold text-lg text-[#94a3b8] mb-6">
          <span className="text-white font-bold">{winnerName.toUpperCase()}</span> takes the crown!
        </p>

        {/* Final Scoreboard Banner */}
        <div className="glass-panel p-4 rounded-2xl border border-[rgba(255,255,255,0.1)] mb-6 flex items-center justify-around">
          <div>
            <span className="text-[11px] font-heading font-bold uppercase text-[#00f0ff] block mb-1">
              YOU
            </span>
            <span className="font-display font-black text-4xl text-white">
              {myScore}
            </span>
          </div>
          <div className="font-display font-bold text-2xl text-[#64748b] opacity-50">
            VS
          </div>
          <div>
            <span className="text-[11px] font-heading font-bold uppercase text-[#ff007f] block mb-1">
              OPPONENT
            </span>
            <span className="font-display font-black text-4xl text-white">
              {oppScore}
            </span>
          </div>
        </div>

        {/* Match Statistics */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="glass-panel p-3 rounded-xl border border-[rgba(255,255,255,0.06)] flex items-center gap-3 text-left">
            <Flame className="text-[#ffb703]" size={20} />
            <div>
              <span className="text-[10px] text-[#94a3b8] font-heading uppercase block">Max Puck Speed</span>
              <span className="font-display font-bold text-sm text-white">
                {Math.round(stats.maxPuckSpeed || 28)} px/s
              </span>
            </div>
          </div>
          <div className="glass-panel p-3 rounded-xl border border-[rgba(255,255,255,0.06)] flex items-center gap-3 text-left">
            <Clock className="text-[#00f0ff]" size={20} />
            <div>
              <span className="text-[10px] text-[#94a3b8] font-heading uppercase block">Match Duration</span>
              <span className="font-display font-bold text-sm text-white">
                {Math.max(12, Math.round(((stats.endTime || Date.now()) - stats.startTime) / 1000))}s
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onRematch}
            className="w-full cyber-btn cyber-btn-cyan text-base py-3.5"
          >
            <RefreshCw size={18} />
            REMATCH BATTLE
          </button>
          <button
            onClick={onLeave}
            className="w-full cyber-btn cyber-btn-outline text-base py-3.5"
          >
            <LogOut size={18} />
            RETURN TO LOBBY
          </button>
        </div>
      </div>
    </div>
  );
};
