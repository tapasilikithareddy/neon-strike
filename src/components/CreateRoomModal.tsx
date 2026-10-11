import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, ArrowRight, Shield } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, roomCode: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState(() => {
    return localStorage.getItem('neon_player_name') || 'CyberStriker';
  });

  const [generatedCode] = useState(() => {
    // Generate 6-char alphanumeric room code e.g. NS-8492
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `NS-${code}`;
  });

  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  if (!isOpen) return null;

  const inviteUrl = `${window.location.origin}/?room=${generatedCode}`;

  const handleCopyLink = async () => {
    setCopyError(null);
    let success = false;

    // Try modern Async Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        success = true;
      } catch (err) {
        console.warn('Async clipboard write failed, trying fallback...', err);
      }
    }

    // Fallback: document.execCommand('copy') via temporary textarea
    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = inviteUrl;
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '1px';
        textarea.style.height = '1px';
        textarea.style.padding = '0';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.boxShadow = 'none';
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
      setCopyError('Unable to copy link automatically. Please copy the code manually.');
      setTimeout(() => setCopyError(null), 4000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || 'CyberStriker';
    localStorage.setItem('neon_player_name', cleanName);
    onCreate(cleanName, generatedCode);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel-elevated w-full max-w-md p-6 sm:p-8 relative border border-[rgba(0,240,255,0.3)] shadow-[0_0_50px_rgba(0,240,255,0.2)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#94a3b8] hover:text-white transition-all"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-[#00f0ff]" size={18} />
          <span className="text-xs font-heading font-bold uppercase tracking-widest text-[#00f0ff]">
            HOST NEW MATCH
          </span>
        </div>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight mb-6">
          CREATE <span className="gradient-text-cyan">ARENA</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Host Display Name Input */}
          <div>
            <label className="block text-xs font-heading font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
              Your Striker Call-Sign
            </label>
            <input
              id="host-striker-name"
              type="text"
              maxLength={14}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CyberStriker"
              className="cyber-input"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              required
            />
          </div>

          {/* Room Code Display & Copy Link */}
          <div>
            <label className="block text-xs font-heading font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
              Arena Room Code
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 rounded-xl bg-[rgba(0,240,255,0.06)] border border-[rgba(0,240,255,0.3)] font-display font-black text-xl text-[#00f0ff] tracking-widest text-center select-all">
                {generatedCode}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`cyber-copy-btn ${copied ? 'copied' : copyError ? 'error' : ''}`}
                title="Copy Invite Link"
              >
                {copied ? (
                  <>
                    <Check size={17} strokeWidth={2.5} />
                    <span>COPIED!</span>
                  </>
                ) : copyError ? (
                  <span>FAILED</span>
                ) : (
                  <>
                    <Copy size={17} />
                    <span>COPY LINK</span>
                  </>
                )}
              </button>
            </div>
            {copyError ? (
              <p className="text-[11px] text-red-400 mt-1.5 font-sans font-semibold">
                {copyError}
              </p>
            ) : (
              <p className="text-[11px] text-[#64748b] mt-1.5 font-sans">
                Opponent can join by entering this code or opening your battle link directly.
              </p>
            )}
          </div>

          {/* Action Button */}
          <button
            type="submit"
            className="w-full cyber-btn cyber-btn-cyan text-base py-3.5 mt-4"
          >
            ENTER WAITING LOBBY
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
