import React, { useState } from 'react';
import { Cloud, X, ShieldAlert, LogIn } from 'lucide-react';

interface GuestBannerProps {
  onOpenAuth: () => void;
  isDarkMode?: boolean;
}

export const GuestBanner: React.FC<GuestBannerProps> = ({ onOpenAuth, isDarkMode }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div
      className={`px-4 py-2 border-b text-xs flex items-center justify-between gap-3 transition-colors select-none ${
        isDarkMode
          ? 'bg-amber-950/40 border-amber-900/50 text-amber-200'
          : 'bg-amber-500/10 border-amber-500/20 text-amber-950'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-5 h-5 rounded-md bg-amber-600/20 text-amber-600 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-3.5 h-3.5" />
        </div>
        <p className="truncate text-[11px] sm:text-xs">
          <strong className="font-bold">أنت تعمل حالياً كزائر:</strong> يتم الحفظ في ذاكرة جهازك المحلية. سجل دخولك لمزامنة مشاريعك وحمايتها من الضياع.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold transition-colors shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
        >
          <LogIn className="w-3 h-3" />
          <span>تسجيل الدخول والمزامنة</span>
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          className={`p-1 rounded-md transition-colors ${
            isDarkMode
              ? 'text-amber-400/60 hover:text-amber-200 hover:bg-amber-900/40'
              : 'text-amber-800/60 hover:text-amber-950 hover:bg-amber-200/50'
          }`}
          title="إخفاء التنبيه مؤقتاً"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
