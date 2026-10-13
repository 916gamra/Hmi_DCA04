import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/95 backdrop-blur-md border border-[#e2e8f0] shadow-xl text-xs font-bold text-[#0f172a] animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
};
