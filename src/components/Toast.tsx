import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-md shadow-2xl border text-sm font-heading font-bold tracking-wide transition-all animate-bounce-short ${
            t.type === 'success'
              ? 'bg-[rgba(6,9,19,0.92)] text-green-400 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
              : t.type === 'error'
              ? 'bg-[rgba(6,9,19,0.92)] text-red-400 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
              : 'bg-[rgba(6,9,19,0.92)] text-[#00f0ff] border-[rgba(0,240,255,0.4)] shadow-[0_0_20px_rgba(0,240,255,0.2)]'
          }`}
        >
          {t.type === 'success' && <CheckCircle2 size={18} className="shrink-0" />}
          {t.type === 'error' && <AlertCircle size={18} className="shrink-0" />}
          {t.type === 'info' && <Info size={18} className="shrink-0" />}

          <span>{t.text}</span>

          <button
            onClick={() => onDismiss(t.id)}
            className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white ml-2"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
