import React from 'react';
import { Volume2, VolumeX, LogOut, Wifi, Trophy } from 'lucide-react';
import { AIDifficulty, PlayerInfo, PlayerSide } from '../types/game';
import { soundEngine } from '../engine/soundEngine';

interface GameHUDProps {
  scoreBottom: number;
  scoreTop: number;
  localPlayer: PlayerInfo;
  remotePlayer: PlayerInfo | null;
  roomCode?: string;
  pingMs?: number;
  isPractice?: boolean;
  practiceDifficulty?: AIDifficulty;
  onLeave: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  scoreBottom,
  scoreTop,
  localPlayer,
  remotePlayer,
  roomCode,
  pingMs = 18,
  isPractice = false,
  practiceDifficulty = 'EASY',
  onLeave,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundEngine.getMuted());

  const handleToggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundEngine.playPaddleHit(0.5);
    }
  };

  const diffLabel = practiceDifficulty === 'CYBER_ELITE' ? 'ELITE' : practiceDifficulty === 'MEDIUM' ? 'PRO' : 'EASY';

  // Bottom player is localPlayer on their screen
  const bottomName = localPlayer.name;
  const topName = isPractice
    ? `[${diffLabel}] Cyber-Bot`
    : remotePlayer?.name || 'Opponent';

  const bottomScore = localPlayer.side === 'bottom' ? scoreBottom : scoreTop;
  const topScore = localPlayer.side === 'bottom' ? scoreTop : scoreBottom;

  return (
    <div className="fixed top-3 left-0 right-0 z-30 px-3 sm:px-6 pointer-events-none">
      <div className="max-w-4xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Left: Arena Info & Ping */}
        <div className="flex items-center gap-3">
          <div className="glass-panel px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.08)] flex items-center gap-2">
            <span className="font-display font-black text-xs text-white">
              {roomCode ? roomCode : 'SOLO DRILL'}
            </span>
            {!isPractice && (
              <div className="flex items-center gap-1.5 border-l border-[rgba(255,255,255,0.1)] pl-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    pingMs < 50
                      ? 'bg-green-400'
                      : pingMs < 120
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }`}
                />
                <span className="text-[10px] font-heading font-bold text-[#94a3b8]">
                  {pingMs}ms
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Live Esports Scoreboard */}
        <div className="glass-panel-elevated px-4 sm:px-6 py-2 rounded-full border border-[rgba(255,255,255,0.12)] flex items-center gap-3 sm:gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
          {/* Top Player (Opponent) */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff007f] shadow-[0_0_8px_#ff007f]" />
            <span className="font-heading font-bold text-xs sm:text-sm text-white max-w-[80px] sm:max-w-[120px] truncate">
              {topName}
            </span>
          </div>

          {/* Score Numbers */}
          <div className="flex items-center gap-2 font-display font-black text-2xl sm:text-3xl">
            <span className="text-[#ff007f]">{topScore}</span>
            <span className="text-[#64748b] text-lg opacity-60">:</span>
            <span className="text-[#00f0ff]">{bottomScore}</span>
          </div>

          {/* Bottom Player (You) */}
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-xs sm:text-sm text-white max-w-[80px] sm:max-w-[120px] truncate text-right">
              {bottomName} (YOU)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
          </div>
        </div>

        {/* Right Controls: Sound & Leave */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border transition-all ${
              isMuted
                ? 'text-[#64748b] bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)]'
                : 'text-[#00f0ff] bg-[rgba(0,240,255,0.1)] border-[rgba(0,240,255,0.3)]'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          <button
            onClick={onLeave}
            className="p-2 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(239,68,68,0.2)] border border-[rgba(255,255,255,0.1)] text-[#94a3b8] hover:text-red-400 transition-all"
            title="Leave Match"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </div>
  );
};
