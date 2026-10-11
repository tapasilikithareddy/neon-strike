import React, { useState } from 'react';
import {
  Copy,
  Check,
  Share2,
  Users,
  Shield,
  Wifi,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { PlayerInfo } from '../types/game';

interface WaitingLobbyProps {
  roomCode: string;
  localPlayer: PlayerInfo;
  remotePlayer: PlayerInfo | null;
  countdown: number | null;
  onToggleReady: (isReady: boolean) => void;
  onLeave: () => void;
}

export const WaitingLobby: React.FC<WaitingLobbyProps> = ({
  roomCode,
  localPlayer,
  remotePlayer,
  countdown,
  onToggleReady,
  onLeave,
}) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const inviteUrl = `${window.location.origin}/?room=${roomCode}`;

  const handleCopyLink = async () => {
    setCopyError(null);
    let success = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        success = true;
      } catch (err) {
        console.warn('Async clipboard write failed, trying fallback...', err);
      }
    }

    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = inviteUrl;
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '1px';
        textarea.style.height = '1px';
        textarea.style.background = 'transparent';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (err) {
        console.error('execCommand copy failed:', err);
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      setCopyError('Copy failed');
      setTimeout(() => setCopyError(null), 3000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NEON STRIKE — Air Hockey Arena',
          text: `Challenge me in Neon Strike! Join room: ${roomCode}`,
          url: inviteUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Determine host and guest based on roles
  const hostPlayer = localPlayer.isHost ? localPlayer : remotePlayer;
  const guestPlayer = !localPlayer.isHost ? localPlayer : remotePlayer;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex flex-col items-center justify-center relative z-10">
      <div className="w-full max-w-2xl glass-panel-elevated p-6 sm:p-10 border border-[rgba(255,255,255,0.12)] relative">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[rgba(255,255,255,0.08)]">
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#94a3b8] hover:text-white text-xs font-heading font-bold uppercase transition-all"
          >
            <ArrowLeft size={16} />
            Leave Lobby
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]" />
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-green-400">
              Lobby Active
            </span>
          </div>
        </div>

        {/* Room Code Showcase */}
        <div className="text-center mb-10">
          <span className="text-xs font-heading font-bold uppercase tracking-widest text-[#94a3b8] mb-2 block">
            ARENA ACCESS CODE
          </span>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-[rgba(10,15,29,0.95)] border border-[rgba(0,240,255,0.35)] shadow-[0_0_30px_rgba(0,240,255,0.15)] mb-3">
            <span className="font-display font-black text-3xl sm:text-4xl text-[#00f0ff] tracking-widest select-all">
              {roomCode}
            </span>
            <button
              onClick={handleCopyLink}
              className={`cyber-copy-btn ${copied ? 'copied' : copyError ? 'error' : ''}`}
              title="Copy Room Link"
            >
              {copied ? (
                <>
                  <Check size={18} strokeWidth={2.5} />
                  <span>COPIED!</span>
                </>
              ) : copyError ? (
                <span>FAILED</span>
              ) : (
                <>
                  <Copy size={18} />
                  <span>COPY CODE</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleShare}
              className="text-xs font-heading font-bold uppercase tracking-wider text-[#00f0ff] hover:underline flex items-center gap-1.5"
            >
              <Share2 size={13} />
              Share Battle Link
            </button>
          </div>
        </div>

        {/* Two Player Slots & Animated VS */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-6 mb-10">
          {/* Player 1 (Host - Cyan) */}
          <div className="glass-panel p-5 rounded-2xl border border-[rgba(0,240,255,0.3)] bg-[rgba(0,240,255,0.03)] flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-2 left-3 text-[10px] font-heading font-bold uppercase tracking-wider text-[#00f0ff]">
              HOST / P1
            </div>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00f0ff] to-[#0077b6] p-[2px] shadow-[0_0_20px_rgba(0,240,255,0.35)] my-3">
              <div className="w-full h-full bg-[#060913] rounded-[14px] flex items-center justify-center font-display font-bold text-xl text-white">
                {hostPlayer?.name.slice(0, 2).toUpperCase() || 'P1'}
              </div>
            </div>

            <h3 className="font-heading font-bold text-lg text-white tracking-wider mb-2 max-w-[150px] truncate">
              {hostPlayer?.name || 'Waiting...'}
            </h3>

            <div className="flex items-center gap-1.5">
              {hostPlayer?.isReady ? (
                <span className="flex items-center gap-1 text-xs font-heading font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/30">
                  <CheckCircle2 size={13} /> READY
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-heading font-bold text-[#94a3b8] bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                  <Clock size={13} /> NOT READY
                </span>
              )}
            </div>
          </div>

          {/* Animated VS Badge */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00f0ff] via-[#8b5cf6] to-[#ff007f] p-[2px] shadow-[0_0_25px_rgba(139,92,246,0.5)]">
              <div className="w-full h-full bg-[#060913] rounded-full flex items-center justify-center font-display font-black text-xs text-white tracking-tighter">
                VS
              </div>
            </div>
          </div>

          {/* Player 2 (Guest - Magenta) */}
          <div className={`glass-panel p-5 rounded-2xl flex flex-col items-center text-center relative overflow-hidden ${
            guestPlayer
              ? 'border-[rgba(255,0,127,0.3)] bg-[rgba(255,0,127,0.03)]'
              : 'border-[rgba(255,255,255,0.08)] border-dashed bg-transparent'
          }`}>
            <div className="absolute top-2 left-3 text-[10px] font-heading font-bold uppercase tracking-wider text-[#ff007f]">
              CHALLENGER / P2
            </div>

            {guestPlayer ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff007f] to-[#7928ca] p-[2px] shadow-[0_0_20px_rgba(255,0,127,0.35)] my-3">
                  <div className="w-full h-full bg-[#060913] rounded-[14px] flex items-center justify-center font-display font-bold text-xl text-white">
                    {guestPlayer.name.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <h3 className="font-heading font-bold text-lg text-white tracking-wider mb-2 max-w-[150px] truncate">
                  {guestPlayer.name}
                </h3>

                <div className="flex items-center gap-1.5">
                  {guestPlayer.isReady ? (
                    <span className="flex items-center gap-1 text-xs font-heading font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/30">
                      <CheckCircle2 size={13} /> READY
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-heading font-bold text-[#94a3b8] bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                      <Clock size={13} /> NOT READY
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="my-6 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mb-3">
                  <Loader2 size={22} className="animate-spin text-[#94a3b8]" />
                </div>
                <span className="font-heading font-bold text-sm text-[#94a3b8] uppercase tracking-wider">
                  WAITING FOR OPPONENT
                </span>
                <span className="text-[11px] text-[#64748b] mt-1 font-sans">
                  Share arena link to invite
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Ready Action Bar / Countdown */}
        {countdown !== null ? (
          <div className="p-6 rounded-2xl bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.3)] text-center animate-pulse">
            <span className="text-xs font-heading font-bold uppercase tracking-widest text-[#00f0ff] mb-1 block">
              MATCH STARTING IN
            </span>
            <span className="font-display font-black text-5xl text-white">
              {countdown === 0 ? 'GO!' : countdown}
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
            <div className="text-xs text-[#94a3b8] font-sans text-center sm:text-left">
              {remotePlayer
                ? 'Both players must toggle READY to initiate match countdown.'
                : 'Waiting for a second striker to connect via room code...'}
            </div>

            <button
              onClick={() => onToggleReady(!localPlayer.isReady)}
              disabled={!remotePlayer}
              className={`cyber-btn w-full sm:w-auto px-8 py-3.5 text-base transition-all ${
                localPlayer.isReady
                  ? 'cyber-btn-outline border-green-500/40 text-green-400 hover:bg-green-500/10'
                  : 'cyber-btn-cyan shadow-[0_0_20px_rgba(0,240,255,0.4)]'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {localPlayer.isReady ? (
                <>
                  <CheckCircle2 size={18} />
                  READY! (CANCEL)
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  READY UP
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
