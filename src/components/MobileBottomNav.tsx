import React from 'react';
import {
  FileText,
  PenTool,
  Users,
  Compass,
  Sparkles,
  BookMarked,
  Download,
} from 'lucide-react';
import { ActiveTab } from './Navbar';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onToggleChapterDrawer: () => void;
  isChapterDrawerOpen: boolean;
  onToggleAIAssistant: () => void;
  isAIAssistantOpen: boolean;
  isDarkMode: boolean;
  chaptersCount: number;
  onOpenExport?: () => void;
  cloudSyncStatus?: 'synced' | 'saving' | 'error' | 'offline';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onToggleChapterDrawer,
  isChapterDrawerOpen,
  onToggleAIAssistant,
  isAIAssistantOpen,
  isDarkMode,
  chaptersCount,
  onOpenExport,
  cloudSyncStatus = 'synced',
}) => {
  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl px-1.5 py-1 flex items-center justify-around select-none transition-colors ${
        isDarkMode
          ? 'bg-stone-900/95 border-stone-800 text-stone-300'
          : 'bg-white/95 border-stone-200 text-stone-700'
      }`}
    >
      {/* 1. Chapters Drawer Toggle */}
      <button
        onClick={onToggleChapterDrawer}
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all relative ${
          isChapterDrawerOpen
            ? 'text-amber-600 dark:text-amber-400 font-bold scale-105'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
        }`}
      >
        <div className="relative">
          <FileText className="w-4.5 h-4.5" />
          <span className="absolute -top-1 -right-1.5 px-1 py-0.2 bg-amber-600 text-white rounded-full text-[9px] font-mono leading-none">
            {chaptersCount}
          </span>
        </div>
        <span className="text-[10px] mt-0.5">الفصول</span>
      </button>

      {/* 2. Editor Tab */}
      <button
        onClick={() => {
          setActiveTab('editor');
        }}
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all relative ${
          activeTab === 'editor' && !isChapterDrawerOpen
            ? 'text-amber-600 dark:text-amber-400 font-bold scale-105'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
        }`}
        title={
          cloudSyncStatus === 'saving'
            ? 'المحرر - جارٍ الحفظ...'
            : cloudSyncStatus === 'synced'
            ? 'المحرر - تم الحفظ'
            : 'المحرر - غير متصل'
        }
      >
        <div className="relative">
          <PenTool className="w-4.5 h-4.5" />
          <span
            className={`absolute -top-0.5 -right-1 w-2 h-2 rounded-full border border-white dark:border-stone-900 ${
              cloudSyncStatus === 'saving'
                ? 'bg-amber-500 animate-ping'
                : cloudSyncStatus === 'synced'
                ? 'bg-emerald-500'
                : 'bg-rose-500'
            }`}
          />
        </div>
        <span className="text-[10px] mt-0.5 flex items-center gap-0.5">
          <span>المحرر</span>
          {cloudSyncStatus === 'saving' && (
            <span className="text-[9px] text-amber-500 animate-pulse font-bold">●</span>
          )}
          {cloudSyncStatus === 'synced' && (
            <span className="text-[9px] text-emerald-500 font-bold">✓</span>
          )}
          {(cloudSyncStatus === 'error' || cloudSyncStatus === 'offline') && (
            <span className="text-[9px] text-rose-500 font-bold">!</span>
          )}
        </span>
      </button>

      {/* 3. Characters Bible Tab */}
      <button
        onClick={() => {
          setActiveTab('characters');
        }}
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${
          activeTab === 'characters'
            ? 'text-amber-600 dark:text-amber-400 font-bold scale-105'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
        }`}
      >
        <Users className="w-4.5 h-4.5" />
        <span className="text-[10px] mt-0.5">الشخصيات</span>
      </button>

      {/* 4. World Notes Tab */}
      <button
        onClick={() => {
          setActiveTab('world');
        }}
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${
          activeTab === 'world'
            ? 'text-amber-600 dark:text-amber-400 font-bold scale-105'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
        }`}
      >
        <BookMarked className="w-4.5 h-4.5" />
        <span className="text-[10px] mt-0.5">العوالم</span>
      </button>

      {/* 5. Plot Outline Tab */}
      <button
        onClick={() => {
          setActiveTab('plot');
        }}
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${
          activeTab === 'plot'
            ? 'text-amber-600 dark:text-amber-400 font-bold scale-105'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
        }`}
      >
        <Compass className="w-4.5 h-4.5" />
        <span className="text-[10px] mt-0.5">الحبكة</span>
      </button>

      {/* 6. Export Button */}
      {onOpenExport && (
        <button
          onClick={onOpenExport}
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-amber-700 dark:text-amber-400 font-semibold"
        >
          <Download className="w-4.5 h-4.5" />
          <span className="text-[10px] mt-0.5">تصدير</span>
        </button>
      )}

      {/* 7. AI Assistant Trigger */}
      <button
        onClick={onToggleAIAssistant}
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${
          isAIAssistantOpen
            ? 'text-amber-600 dark:text-amber-400 font-bold scale-105'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
        }`}
      >
        <Sparkles className="w-4.5 h-4.5 text-amber-500" />
        <span className="text-[10px] mt-0.5">المساعد</span>
      </button>
    </nav>
  );
};
