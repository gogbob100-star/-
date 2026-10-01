import React from 'react';
import { CheckCircle2, Save, FileDown, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'save' | 'export' | 'info' | 'warning' | 'delete';

interface ToastNotificationProps {
  message: string | null;
  type?: ToastType;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type = 'info',
  onClose,
  isDarkMode = false,
}) => {
  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'save':
        return <Save className="w-4 h-4 text-emerald-500" />;
      case 'export':
        return <FileDown className="w-4 h-4 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'warning':
      case 'delete':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 select-none animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-sm">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
          isDarkMode
            ? 'bg-stone-900/95 border-stone-700 text-stone-100 shadow-black/40'
            : 'bg-white/95 border-stone-200 text-stone-900 shadow-stone-900/10'
        }`}
      >
        <div className="shrink-0">{getIcon()}</div>
        <p className="text-xs font-semibold text-right leading-snug flex-1">{message}</p>
        <button
          onClick={onClose}
          className={`p-1 rounded-lg transition-colors shrink-0 ${
            isDarkMode ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-400'
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
