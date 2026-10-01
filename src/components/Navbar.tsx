import React from 'react';
import {
  BookOpen,
  Feather,
  PenTool,
  Users,
  Compass,
  GitBranch,
  Download,
  Maximize2,
  Settings,
  Sparkles,
  Search,
  Moon,
  Sun,
  Cloud,
  Loader2,
  AlertCircle,
  ListOrdered,
  Plus,
  Check,
  User,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import { Novel } from '../types/novel';
import { FirebaseUser } from '../services/firebase';

export type ActiveTab = 'editor' | 'characters' | 'world' | 'plot';

interface NavbarProps {
  novel: Novel;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenExport: () => void;
  onOpenZen: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenChapterOutliner?: () => void;
  onOpenWorldDrawer?: () => void;
  onToggleAIAssistant: () => void;
  isAIAssistantOpen: boolean;
  totalWords: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  cloudSyncStatus: 'synced' | 'saving' | 'error' | 'offline';
  onManualCloudSync?: () => void;
  currentUser?: FirebaseUser | null;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  novel,
  activeTab,
  setActiveTab,
  onOpenExport,
  onOpenZen,
  onOpenSettings,
  onOpenSearch,
  onOpenChapterOutliner,
  onOpenWorldDrawer,
  onToggleAIAssistant,
  isAIAssistantOpen,
  totalWords,
  isDarkMode,
  onToggleDarkMode,
  cloudSyncStatus,
  onManualCloudSync,
  currentUser,
  onOpenAuth,
}) => {
  const progressPercent = Math.min(
    100,
    Math.round((totalWords / (novel.targetWordCount || 50000)) * 100)
  );

  return (
    <header
      className={`h-16 border-b px-4 flex items-center justify-between md:justify-between sticky top-0 z-30 select-none backdrop-blur-md transition-colors overflow-x-auto whitespace-nowrap no-scrollbar gap-4 ${
        isDarkMode
          ? 'bg-stone-900/95 border-stone-800 text-stone-100'
          : 'bg-stone-100/90 border-stone-200 text-stone-900'
      }`}
    >
      {/* Brand & Novel Identity */}
      <div className="flex items-center gap-4 shrink-0 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
            <PenTool className="w-4.5 h-4.5" />
          </div>
          <div className="whitespace-nowrap">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span
                className={`font-bold text-base tracking-tight font-novel-amiri text-lg ${
                  isDarkMode ? 'text-stone-100' : 'text-stone-900'
                }`}
              >
                راوي
              </span>
              <span className="opacity-30">/</span>
              <button
                onClick={onOpenSettings}
                className={`font-medium text-sm transition-colors text-right flex items-center gap-1.5 max-w-[130px] sm:max-w-[200px] truncate ${
                  isDarkMode ? 'text-stone-200 hover:text-white' : 'text-stone-800 hover:text-stone-950'
                }`}
                title="تعديل تفاصيل الرواية"
              >
                <span className="truncate">{novel.title || 'رواية جديدة'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95 shrink-0 mr-1"
                title="إنشاء مشروع رواية جديدة وتحديد بياناتها"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ رواية جديدة</span>
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[11px] opacity-70 whitespace-nowrap">
              <span>{novel.author || 'المؤلف'}</span>
              <span>·</span>
              <span>{novel.genre || 'عام'}</span>
            </div>
          </div>
        </div>

        {/* Word progress indicator */}
        <div
          className={`hidden lg:flex items-center gap-2.5 mr-6 px-3 py-1.5 rounded-lg text-xs ${
            isDarkMode ? 'bg-stone-800/80 text-stone-300' : 'bg-stone-200/60 text-stone-600'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 opacity-60" />
          <span className="font-medium font-mono tabular-nums">
            {totalWords.toLocaleString('ar-EG')}
          </span>
          <span className="opacity-40">/</span>
          <span className="font-mono tabular-nums opacity-70">
            {(novel.targetWordCount || 50000).toLocaleString('ar-EG')} كلمة
          </span>
          <div
            className={`w-16 h-1.5 rounded-full overflow-hidden mr-1 ${
              isDarkMode ? 'bg-stone-700' : 'bg-stone-300'
            }`}
          >
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono tabular-nums text-[10px] text-amber-500 font-semibold">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Main Studio Navigation Tabs (Desktop only - Mobile uses bottom nav) */}
      <nav
        className={`hidden md:flex items-center gap-1 p-1 rounded-xl ${
          isDarkMode ? 'bg-stone-800/80' : 'bg-stone-200/70'
        }`}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'editor'
                ? isDarkMode
                  ? 'bg-stone-700 text-stone-50 shadow-xs font-semibold'
                  : 'bg-white text-stone-900 shadow-xs font-semibold'
                : isDarkMode
                ? 'text-stone-400 hover:text-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Feather className="w-3.5 h-3.5" />
            <span>الكتابة والتحرير</span>
          </button>

          {/* Visual Auto-Save Status Indicator beside the Editor button */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-300 border ${
              cloudSyncStatus === 'saving'
                ? isDarkMode
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800/80 shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 shadow-2xs'
                : cloudSyncStatus === 'synced'
                ? isDarkMode
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : isDarkMode
                ? 'bg-rose-950/60 text-rose-300 border-rose-800/80'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
            title={
              cloudSyncStatus === 'saving'
                ? 'جارٍ الحفظ التلقائي في السحابة...'
                : cloudSyncStatus === 'synced'
                ? 'تم حفظ جميع التعديلات سحابياً بأمان'
                : 'خطأ في الاتصال، النسخة محفوظة محلياً على جهازك'
            }
          >
            {cloudSyncStatus === 'saving' && (
              <>
                <Loader2 className="w-3 h-3 text-amber-500 animate-spin shrink-0" />
                <span className="font-semibold animate-pulse">جارٍ الحفظ...</span>
              </>
            )}
            {cloudSyncStatus === 'synced' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse" />
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>تم الحفظ</span>
              </>
            )}
            {(cloudSyncStatus === 'error' || cloudSyncStatus === 'offline') && (
              <>
                <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                <span>خطأ في الاتصال</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setActiveTab('characters')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'characters'
              ? isDarkMode
                ? 'bg-stone-700 text-stone-50 shadow-xs font-semibold'
                : 'bg-white text-stone-900 shadow-xs font-semibold'
              : isDarkMode
              ? 'text-stone-400 hover:text-stone-200'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>بنك الشخصيات</span>
          <span className="text-[10px] opacity-60 mr-0.5">({novel.characters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('world')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'world'
              ? isDarkMode
                ? 'bg-stone-700 text-stone-50 shadow-xs font-semibold'
                : 'bg-white text-stone-900 shadow-xs font-semibold'
              : isDarkMode
              ? 'text-stone-400 hover:text-stone-200'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>عوالم وملاحظات</span>
          <span className="text-[10px] opacity-60 mr-0.5">({novel.worldNotes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('plot')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'plot'
              ? isDarkMode
                ? 'bg-stone-700 text-stone-50 shadow-xs font-semibold'
                : 'bg-white text-stone-900 shadow-xs font-semibold'
              : isDarkMode
              ? 'text-stone-400 hover:text-stone-200'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>مخطط الحبكة</span>
        </button>
      </nav>

      {/* Actions: Cloud status, Dark Mode, Search, AI, Zen, Export, Settings */}
      <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
        {/* Auth / Account / Guest Status Button */}
        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors border cursor-pointer ${
              currentUser
                ? isDarkMode
                  ? 'bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-900/60'
                  : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                : isDarkMode
                ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
                : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
            }`}
            title={
              currentUser
                ? `مسجل باسم: ${currentUser.displayName || currentUser.email} - انقر لإدارة الحساب`
                : 'أنت في وضع الزائر (حفظ محلي) - انقر لتسجيل الدخول والمزامنة'
            }
          >
            {currentUser ? (
              <>
                <div className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email?.[0].toUpperCase() || 'ر'}
                </div>
                <span className="hidden md:inline text-[11px] font-semibold truncate max-w-[90px]">
                  {currentUser.displayName || 'حسابي'}
                </span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden md:inline text-[11px] font-semibold">
                  وضع الزائر
                </span>
              </>
            )}
          </button>
        )}

        {/* Cloud Database Sync Status */}
        <button
          onClick={onManualCloudSync}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors border ${
            cloudSyncStatus === 'synced'
              ? isDarkMode
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : cloudSyncStatus === 'saving'
              ? isDarkMode
                ? 'bg-amber-950/40 border-amber-800 text-amber-400'
                : 'bg-amber-50 border-amber-200 text-amber-700'
              : isDarkMode
              ? 'bg-stone-800 border-stone-700 text-stone-400'
              : 'bg-stone-100 border-stone-200 text-stone-500'
          }`}
          title={
            cloudSyncStatus === 'synced'
              ? 'متصل بقاعدة البيانات السحابية (Firestore) - تم الحفظ بنجاح'
              : cloudSyncStatus === 'saving'
              ? 'جاري حفظ التغييرات في قاعدة البيانات السحابية...'
              : 'قاعدة البيانات السحابية'
          }
        >
          {cloudSyncStatus === 'saving' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
          ) : cloudSyncStatus === 'synced' ? (
            <Cloud className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Cloud className="w-3.5 h-3.5 opacity-60" />
          )}
          <span className="hidden xl:inline text-[11px] font-medium">
            {cloudSyncStatus === 'saving'
              ? 'جاري الحفظ...'
              : cloudSyncStatus === 'synced'
              ? 'سحابة محفوظة'
              : 'سحابي'}
          </span>
        </button>

        {/* Night / Dark Mode Toggle Button */}
        <button
          onClick={onToggleDarkMode}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'text-amber-400 hover:text-amber-300 hover:bg-stone-800'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
          title={isDarkMode ? 'التحويل إلى الوضع النهاري' : 'تفعيل الوضع الليلي (Dark Mode)'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Smart Novel Search Button */}
        <button
          onClick={onOpenSearch}
          className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isDarkMode
              ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
              : 'bg-stone-200/80 hover:bg-stone-200 text-stone-700 hover:text-stone-950'
          }`}
          title="البحث الذكي في جميع نصوص فصول الرواية (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 opacity-70" />
          <span className="hidden md:inline">بحث في الرواية</span>
          <kbd
            className={`hidden lg:inline text-[10px] px-1.5 py-0.5 rounded font-mono ${
              isDarkMode ? 'bg-stone-700 text-stone-300' : 'bg-stone-300/70 text-stone-600'
            }`}
          >
            Ctrl+K
          </kbd>
        </button>

        {/* AI Assistant button (Desktop only - mobile has it in bottom nav) */}
        <button
          onClick={onToggleAIAssistant}
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            isAIAssistantOpen
              ? 'bg-amber-500/20 border-amber-500/60 text-amber-500 shadow-xs'
              : isDarkMode
              ? 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700'
              : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50 hover:text-stone-900'
          }`}
          title="المساعد الروائي الذكي"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>مساعد السرد</span>
        </button>

        {/* Story World Cards Drawer Trigger */}
        {onOpenWorldDrawer && (
          <button
            onClick={onOpenWorldDrawer}
            className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              isDarkMode
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
            }`}
            title="بطاقات عالم القصة والشخصيات السريعة"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>عالم القصة والشخصيات</span>
          </button>
        )}

        {/* Chapter Outlining & Reordering Drag & Drop Trigger */}
        {onOpenChapterOutliner && (
          <button
            onClick={onOpenChapterOutliner}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              isDarkMode
                ? 'bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-900/60'
                : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
            }`}
            title="تخطيط وإعادة ترتيب الفصول (Drag & Drop)"
          >
            <ListOrdered className="w-3.5 h-3.5 text-amber-600" />
            <span>تخطيط الفصول</span>
          </button>
        )}

        {/* Zen Mode */}
        <button
          onClick={onOpenZen}
          className={`hidden sm:flex p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'text-stone-300 hover:text-white hover:bg-stone-800'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
          title="وضع التركيز الخالص (زن)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-xs font-medium transition-colors shadow-xs"
          title="تصدير للـ PDF والصيغ المختلفة"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">تصدير</span>
        </button>

        <button
          onClick={onOpenSettings}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'text-stone-300 hover:text-white hover:bg-stone-800'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
          title="إعدادات الرواية والغلاف"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

