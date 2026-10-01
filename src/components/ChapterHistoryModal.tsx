import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  X,
  RotateCcw,
  Save,
  Clock,
  FileText,
  Check,
  Cloud,
  Loader2,
  Calendar,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { Chapter, ChapterSnapshot } from '../types/novel';
import {
  saveChapterSnapshotToFirestore,
  subscribeToChapterSnapshots,
} from '../services/firebase';

interface ChapterHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: Chapter;
  novelId: string;
  onUpdateChapter: (updates: Partial<Chapter>) => void;
  isDarkMode: boolean;
}

export const ChapterHistoryModal: React.FC<ChapterHistoryModalProps> = ({
  isOpen,
  onClose,
  chapter,
  novelId,
  onUpdateChapter,
  isDarkMode,
}) => {
  const [snapshots, setSnapshots] = useState<ChapterSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [isSavingManual, setIsSavingManual] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoredSuccess, setRestoredSuccess] = useState<string | null>(null);

  // Subscribe to real-time snapshots in Firestore for this chapter
  useEffect(() => {
    if (!chapter?.id) return;
    const unsubscribe = subscribeToChapterSnapshots(chapter.id, (loadedSnaps) => {
      // Also combine with legacy local versions if present
      const legacyVersions: ChapterSnapshot[] = (chapter.versions || []).map((v) => ({
        id: v.id,
        novelId: novelId || 'default',
        chapterId: chapter.id,
        chapterTitle: v.title || chapter.title,
        content: v.content,
        wordsCount: v.content.trim() ? v.content.trim().split(/\s+/).length : 0,
        createdAt: new Date().toISOString(),
        label: 'نسخة سابقة',
        type: 'manual',
      }));

      // Deduplicate by ID
      const all = [...loadedSnaps];
      for (const leg of legacyVersions) {
        if (!all.some((s) => s.id === leg.id)) {
          all.push(leg);
        }
      }

      // Sort by creation date descending
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSnapshots(all);

      if (!selectedSnapshotId && all.length > 0) {
        setSelectedSnapshotId(all[0].id);
      }
    });

    return () => unsubscribe();
  }, [chapter?.id, novelId]);

  if (!isOpen) return null;

  const currentWordsCount = chapter.content.trim()
    ? chapter.content.trim().split(/\s+/).length
    : 0;

  // Manual snapshot creation
  const handleSaveManualSnapshot = async () => {
    if (isSavingManual) return;
    setIsSavingManual(true);
    const now = new Date();
    const words = chapter.content.trim() ? chapter.content.trim().split(/\s+/).length : 0;

    const newSnapshot: ChapterSnapshot = {
      id: `snap-manual-${Date.now()}`,
      novelId: novelId || 'default',
      chapterId: chapter.id,
      chapterTitle: chapter.title || 'فصل بدون عنوان',
      content: chapter.content,
      wordsCount: words,
      createdAt: now.toISOString(),
      label: 'نسخة يدوية للكاتب',
      type: 'manual',
    };

    try {
      await saveChapterSnapshotToFirestore(newSnapshot);
      setSelectedSnapshotId(newSnapshot.id);
    } catch (err) {
      console.warn('Failed to save manual snapshot to Firestore:', err);
    } finally {
      setIsSavingManual(false);
    }
  };

  // Restore previous snapshot
  const handleRestore = async (snap: ChapterSnapshot) => {
    const formattedDate = new Date(snap.createdAt).toLocaleString('ar-EG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    if (
      !window.confirm(
        `هل تريد بالتأكيد استعادة هذه النسخة المؤرخة في (${formattedDate})؟\n\nستقوم المنظومة أولاً بحفظ نسخة أمان لعملك الحالي في Firestore تلقائياً حتى لا تفقد أي سطر.`
      )
    ) {
      return;
    }

    setIsRestoring(true);

    try {
      // 1. Take a safety backup of current state first
      const safetySnapshot: ChapterSnapshot = {
        id: `snap-safety-${Date.now()}`,
        novelId: novelId || 'default',
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        content: chapter.content,
        wordsCount: currentWordsCount,
        createdAt: new Date().toISOString(),
        label: `نسخة أمان قبل الاستعادة`,
        type: 'manual',
      };
      await saveChapterSnapshotToFirestore(safetySnapshot);

      // 2. Apply restored content and title to chapter
      onUpdateChapter({
        content: snap.content,
        title: snap.chapterTitle || chapter.title,
      });

      setRestoredSuccess(formattedDate);
      setTimeout(() => setRestoredSuccess(null), 4000);
    } catch (err) {
      console.error('Error during snapshot restoration:', err);
    } finally {
      setIsRestoring(false);
    }
  };

  const activeSnapshot =
    snapshots.find((s) => s.id === selectedSnapshotId) || snapshots[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs select-none animate-fade-in">
      <div
        className={`w-full max-w-5xl h-[88vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden transition-all ${
          isDarkMode
            ? 'bg-stone-900 border-stone-800 text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
        dir="rtl"
      >
        {/* Modal Top Header */}
        <div
          className={`p-4 px-6 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDarkMode ? 'border-stone-800 bg-stone-900/90' : 'border-stone-100 bg-stone-50/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base font-novel-amiri leading-tight">
                  النسخ الاحتياطية الدورية للفصل (Cloud Snapshots)
                </h2>
                <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Cloud className="w-3 h-3" />
                  <span>Firestore سحابي</span>
                </span>
              </div>
              <p className="text-xs opacity-60 mt-0.5">
                الفصل: <span className="font-semibold">{chapter.title}</span> — إجمالي اللقطات المحفوظة: {snapshots.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto backup info pill */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${
                isDarkMode ? 'bg-stone-800 text-stone-300' : 'bg-stone-200/70 text-stone-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>نسخ دوري تلقائي كل 3 دقائق</span>
            </div>

            {/* Manual snapshot button */}
            <button
              onClick={handleSaveManualSnapshot}
              disabled={isSavingManual}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="أخذ لقطة فورية لعملك الآن وحفظها في Firestore"
            >
              {isSavingManual ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>أخذ لقطة الآن</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl opacity-70 hover:opacity-100 hover:bg-stone-500/10 transition-colors"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner on Restore */}
        {restoredSuccess && (
          <div className="bg-emerald-600 text-white text-xs py-2.5 px-6 text-center font-bold flex items-center justify-center gap-2 shadow-inner animate-fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>
              تمت استعادة العمل بنجاح من النسخة المؤرخة في ({restoredSuccess}) مع حفظ نسخة أمان احترازية تلقائياً!
            </span>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Timeline list of snapshots */}
          <div
            className={`w-full md:w-80 border-b md:border-b-0 md:border-l flex flex-col overflow-hidden ${
              isDarkMode ? 'border-stone-800 bg-stone-900/50' : 'border-stone-200 bg-stone-50/50'
            }`}
          >
            <div className="p-3 px-4 border-b border-inherit flex items-center justify-between text-xs font-semibold opacity-70">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>الجدول الزمني للّقطات</span>
              </span>
              <span className="font-mono text-[11px]">{snapshots.length} نسخة</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {snapshots.length === 0 ? (
                <div className="p-8 text-center text-xs opacity-50 space-y-2">
                  <Clock className="w-10 h-10 mx-auto opacity-30 text-amber-500" />
                  <p className="font-semibold">لا توجد نسخ احتياطية مسجلة بعد.</p>
                  <p className="text-[11px]">
                    يقوم النظام بحفظ لقطة تلقائية دورياً في Firestore أثناء الكتابة، أو يمكنك الضغط على "أخذ لقطة الآن".
                  </p>
                </div>
              ) : (
                snapshots.map((snap, idx) => {
                  const isSelected = (selectedSnapshotId || snapshots[0]?.id) === snap.id;
                  const dateObj = new Date(snap.createdAt);
                  const formattedTime = dateObj.toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const formattedDate = dateObj.toLocaleDateString('ar-EG', {
                    month: 'short',
                    day: 'numeric',
                  });

                  const diffWords = (snap.wordsCount || 0) - currentWordsCount;

                  return (
                    <div
                      key={snap.id}
                      onClick={() => setSelectedSnapshotId(snap.id)}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                        isSelected
                          ? isDarkMode
                            ? 'bg-amber-500/15 border-amber-500/60 shadow-xs'
                            : 'bg-amber-50 border-amber-300 shadow-xs'
                          : isDarkMode
                          ? 'border-stone-800 hover:bg-stone-800/60'
                          : 'border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="truncate max-w-[150px]">
                          {snap.chapterTitle || 'بدون عنوان'}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                            snap.label?.includes('أمان')
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : snap.type === 'auto'
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                              : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                          }`}
                        >
                          {snap.label || (snap.type === 'auto' ? 'دورية تلقائية' : 'يدوية')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] opacity-70 mt-1.5">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{formattedDate}، {formattedTime}</span>
                        </div>
                        <span className="font-mono text-[10px]">
                          {(snap.wordsCount || 0).toLocaleString('ar-EG')} كلمة
                        </span>
                      </div>

                      {diffWords !== 0 && (
                        <div className="flex items-center gap-1 text-[10px] mt-1 font-mono">
                          {diffWords > 0 ? (
                            <span className="text-emerald-600 flex items-center gap-0.5">
                              <TrendingUp className="w-2.5 h-2.5" />
                              +{diffWords} كلمة مقارنة بالحالي
                            </span>
                          ) : (
                            <span className="text-stone-400 flex items-center gap-0.5">
                              <TrendingDown className="w-2.5 h-2.5" />
                              {diffWords} كلمة مقارنة بالحالي
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Preview of the selected Snapshot */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6">
            {!activeSnapshot ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 text-xs">
                <FileText className="w-14 h-14 mb-2 opacity-30 text-amber-500" />
                <p className="font-semibold text-sm">اختر لقطة من القائمة لمعاينتها واستعادتها</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                {/* Snapshot metadata header */}
                <div
                  className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                    isDarkMode ? 'bg-stone-800/80 border-stone-700' : 'bg-stone-100/90 border-stone-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">
                        معاينة النسخة: {activeSnapshot.chapterTitle}
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-600">
                        {activeSnapshot.wordsCount || 0} كلمة
                      </span>
                    </div>
                    <p className="text-xs opacity-60 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        تاريخ الحفظ في السحابة: {new Date(activeSnapshot.createdAt).toLocaleString('ar-EG', {
                          dateStyle: 'full',
                          timeStyle: 'medium',
                        })}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleRestore(activeSnapshot)}
                    disabled={isRestoring}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    <span>استعادة العمل من هذه النقطة الزمنية</span>
                  </button>
                </div>

                {/* Snapshot Full Content Preview Area */}
                <div
                  className={`flex-1 overflow-y-auto p-5 rounded-2xl border font-novel-amiri text-base leading-loose whitespace-pre-wrap ${
                    isDarkMode
                      ? 'bg-stone-950/60 border-stone-800 text-stone-200'
                      : 'bg-white border-stone-200 text-stone-900 shadow-inner'
                  }`}
                >
                  {activeSnapshot.content ? (
                    activeSnapshot.content
                  ) : (
                    <span className="opacity-40 italic">(هذه النسخة فارغة من النصوص)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
