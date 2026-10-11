import React, { useState, useEffect } from 'react';
import { X, LogIn, AlertCircle, Loader2 } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  initialRoomCode?: string;
  errorMessage?: string | null;
  isConnecting?: boolean;
  onClose: () => void;
  onJoin: (name: string, roomCode: string) => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  initialRoomCode = '',
  errorMessage = null,
  isConnecting = false,
  onClose,
  onJoin,
}) => {
  const [name, setName] = useState(() => {
    return localStorage.getItem('neon_player_name') || 'NeonViper';
  });

  const [roomCode, setRoomCode] = useState(initialRoomCode);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode.toUpperCase());
    }
  }, [initialRoomCode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || 'NeonViper';
    const cleanCode = roomCode.trim().toUpperCase();

    if (!cleanCode) return;

    localStorage.setItem('neon_player_name', cleanName);
    onJoin(cleanName, cleanCode);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel-elevated w-full max-w-md p-6 sm:p-8 relative border border-[rgba(255,0,127,0.3)] shadow-[0_0_50px_rgba(255,0,127,0.2)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isConnecting}
          className="absolute top-5 right-5 p-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#94a3b8] hover:text-white transition-all disabled:opacity-50"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-2">
          <LogIn className="text-[#ff007f]" size={18} />
          <span className="text-xs font-heading font-bold uppercase tracking-widest text-[#ff007f]">
            JOIN MULTIPLAYER BATTLE
          </span>
        </div>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight mb-6">
          CONNECT TO <span className="gradient-text-magenta">ARENA</span>
        </h2>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] flex items-start gap-3 text-red-400 text-xs font-heading font-bold">
            <AlertCircle size={17} className="shrink-0 mt-0.5" />
            <div>
              <p className="uppercase tracking-wider font-bold">Connection Failed</p>
              <p className="font-sans font-normal text-red-300 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-heading font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
              Your Striker Call-Sign
            </label>
            <input
              id="guest-striker-name"
              type="text"
              maxLength={14}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NeonViper"
              disabled={isConnecting}
              className="cyber-input cyber-input-magenta"
              autoComplete="off"
              spellCheck={false}
              required
            />
          </div>

          {/* Room Code */}
          <div>
            <label className="block text-xs font-heading font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
              Arena Room Code
            </label>
            <input
              id="guest-room-code"
              type="text"
              maxLength={10}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. NS-8492"
              disabled={isConnecting}
              className="cyber-input cyber-input-magenta font-display text-center uppercase tracking-widest text-xl"
              autoComplete="off"
              spellCheck={false}
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isConnecting || !roomCode.trim()}
            className="w-full cyber-btn cyber-btn-magenta text-base py-3.5 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                CONNECTING TO ARENA...
              </>
            ) : (
              <>
                ENTER ARENA
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
