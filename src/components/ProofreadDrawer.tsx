import React, { useState, useEffect } from 'react';
import {
  CheckCheck,
  X,
  AlertCircle,
  Check,
  RotateCcw,
  Sparkles,
  Loader2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Chapter } from '../types/novel';
import { requestAIAssist } from '../services/aiService';

export interface ProofreadSuggestion {
  id: string;
  original: string;
  replacement: string;
  type: 'إملائي' | 'نحوي' | 'ترقيم' | 'أسلوبي' | string;
  explanation: string;
}

interface ProofreadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: Chapter;
  onApplyCorrection: (original: string, replacement: string) => void;
  onApplyAllCorrections: (corrections: Array<{ original: string; replacement: string }>) => void;
}

export const ProofreadDrawer: React.FC<ProofreadDrawerProps> = ({
  isOpen,
  onClose,
  chapter,
  onApplyCorrection,
  onApplyAllCorrections,
}) => {
  const [suggestions, setSuggestions] = useState<ProofreadSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  // Trigger scan whenever the drawer is opened or user requests re-scan
  const handleScan = async () => {
    if (!chapter.content.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    setAppliedIds(new Set());

    try {
      const responseStr = await requestAIAssist({
        action: 'proofread_text',
        context: {
          chapterTitle: chapter.title,
          chapterContent: chapter.content,
        },
      });

      let parsed: any[] = [];
      try {
        parsed = JSON.parse(responseStr);
      } catch {
        const match = responseStr.match(/\[[\s\S]*\]/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          parsed = [];
        }
      }

      const formatted: ProofreadSuggestion[] = parsed.map((item, idx) => ({
        id: `sug-${idx}-${Date.now()}`,
        original: item.original || '',
        replacement: item.replacement || '',
        type: item.type || 'إملائي',
        explanation: item.explanation || 'تصحيح لغوي مقترح لسلامة الصياغة.',
      }));

      setSuggestions(formatted);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء فحص النص.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleScan();
    }
  }, [isOpen, chapter.id]);

  if (!isOpen) return null;

  const handleApplySingle = (item: ProofreadSuggestion) => {
    onApplyCorrection(item.original, item.replacement);
    setAppliedIds((prev) => new Set(prev).add(item.id));
  };

  const handleApplyAll = () => {
    const unapplied = suggestions.filter((s) => !appliedIds.has(s.id));
    if (unapplied.length === 0) return;

    onApplyAllCorrections(
      unapplied.map((u) => ({ original: u.original, replacement: u.replacement }))
    );

    const allSet = new Set(appliedIds);
    unapplied.forEach((u) => allSet.add(u.id));
    setAppliedIds(allSet);
  };

  const handleDismiss = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const filteredSuggestions = suggestions.filter((s) => {
    if (selectedFilter === 'all') return true;
    return s.type === selectedFilter;
  });

  const remainingCount = suggestions.filter((s) => !appliedIds.has(s.id)).length;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'نحوي':
        return { label: 'خطأ نحوي', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'ترقيم':
        return { label: 'علامات ترقيم', color: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'أسلوبي':
        return { label: 'تحسين أسلوبي', color: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 'إملائي':
      default:
        return { label: 'خطأ إملائي', color: 'bg-rose-100 text-rose-900 border-rose-300' };
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="md:hidden fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      <aside className="fixed md:static inset-y-0 left-0 z-50 md:z-20 w-full sm:w-96 max-w-full h-full md:h-[calc(100vh-4rem)] border-r border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex flex-col shrink-0 select-none overflow-hidden shadow-2xl md:shadow-xl transition-transform">
        {/* Header */}
        <div className="p-3.5 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-800 flex items-center justify-center">
              <CheckCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-stone-900 dark:text-stone-100 font-novel-amiri">
                المدقق اللغوي والإملائي الذكي
              </h3>
              <p className="text-[11px] text-stone-500">فحص فوري لقواعد الفصحى والإملاء والترقيم</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleScan}
              disabled={isLoading}
              className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-md transition-colors disabled:opacity-50"
              title="إعادة فحص النص"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* Filter Tabs & Bulk Actions */}
      <div className="p-3 border-b border-stone-200/80 bg-stone-100/60 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-stone-800">
              {remainingCount} ملاحظات متبقية
            </span>
          </div>

          {remainingCount > 0 && (
            <button
              onClick={handleApplyAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-medium transition-colors shadow-2xs"
              title="تطبيق كافة التصحيحات في النص الحالي"
            >
              <Check className="w-3 h-3" />
              <span>تطبيق الكل ({remainingCount})</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px]">
          {['all', 'إملائي', 'نحوي', 'ترقيم', 'أسلوبي'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
                selectedFilter === filter
                  ? 'bg-white text-stone-900 font-semibold shadow-2xs border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              {filter === 'all' ? 'كافة الملاحظات' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-stone-500 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-emerald-700" />
            <p className="font-novel-amiri text-sm">جاري تدقيق الفصل بالذكاء الاصطناعي لغوياً ونحوياً...</p>
            <p className="text-[11px] text-stone-400">فحص الهمزات، حركات الإعراب، وعلامات الترقيم</p>
          </div>
        ) : error ? (
          <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              <span>تعذر إتمام التدقيق</span>
            </div>
            <p className="text-[11px] opacity-90">{error}</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-20 text-center text-xs text-stone-600 space-y-3 bg-white rounded-2xl border border-stone-200/80 p-6 mx-1 shadow-2xs">
            <ShieldCheck className="w-10 h-10 mx-auto text-emerald-600" />
            <h4 className="font-bold text-stone-900 font-novel-amiri text-base">
              النص سليم وخالٍ من الأخطاء!
            </h4>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              لم يعثر المدقق اللغوي على أي أخطاء إملائية أو نحوية في هذا الفصل.
            </p>
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-400">
            لا توجد ملاحظات من نوع «{selectedFilter}».
          </div>
        ) : (
          filteredSuggestions.map((item) => {
            const isApplied = appliedIds.has(item.id);
            const badge = getTypeBadge(item.type);

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border text-right transition-all space-y-2.5 ${
                  isApplied
                    ? 'bg-emerald-50/40 border-emerald-200/80 opacity-70'
                    : 'bg-white border-stone-200 shadow-2xs hover:shadow-xs'
                }`}
              >
                {/* Top Badge + Dismiss */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badge.color}`}
                  >
                    {badge.label}
                  </span>

                  {!isApplied && (
                    <button
                      onClick={() => handleDismiss(item.id)}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
                      title="تجاهل هذه الملاحظة"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Diff Comparison */}
                <div className="p-2.5 rounded-xl bg-stone-50/80 border border-stone-100 text-xs font-novel-amiri space-y-1.5">
                  <div className="flex items-center gap-1.5 text-stone-600">
                    <span className="text-[10px] text-stone-600 font-sans">الأصل:</span>
                    <del className="bg-rose-100 text-rose-900 px-1 py-0.5 rounded-sm line-through">
                      {item.original}
                    </del>
                  </div>

                  <div className="flex items-center gap-1.5 text-stone-900">
                    <span className="text-[10px] text-emerald-800 font-sans font-semibold">
                      التصحيح:
                    </span>
                    <ins className="bg-emerald-100 text-emerald-950 px-1.5 py-0.5 rounded-sm font-bold no-underline">
                      {item.replacement}
                    </ins>
                  </div>
                </div>

                {/* Explanation */}
                <p className="text-[11px] text-stone-600 leading-relaxed font-novel-amiri">
                  {item.explanation}
                </p>

                {/* Bottom Action */}
                <div className="flex items-center justify-end pt-1">
                  {isApplied ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تم تطبيق التصحيح</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApplySingle(item)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-colors shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تطبيق التصحيح</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-stone-200 bg-white flex items-center justify-between text-[11px] text-stone-500">
        <span>مدعوم بقواعد النحو والإملاء العربي</span>
        <button
          onClick={handleScan}
          disabled={isLoading}
          className="text-stone-700 hover:text-stone-950 font-medium transition-colors"
        >
          تحديث الفحص
        </button>
      </div>
    </aside>
  </>
  );
};
