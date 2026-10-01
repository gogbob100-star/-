import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  FileText,
  ArrowRight,
  ArrowLeft,
  Replace,
  Check,
  AlertCircle,
  Hash,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Novel, Chapter } from '../types/novel';
import { searchInText, countMatchesInText, ChapterSearchResult } from '../utils/arabicSearch';

interface NovelSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  novel: Novel;
  onSelectMatch: (chapterId: string, charIndex: number, query: string) => void;
  onBatchReplace?: (searchTerm: string, replaceTerm: string, targetChapterId?: string) => void;
}

export const NovelSearchModal: React.FC<NovelSearchModalProps> = ({
  isOpen,
  onClose,
  novel,
  onSelectMatch,
  onBatchReplace,
}) => {
  const [query, setQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<'all' | string>('all');
  const [replaceStatus, setReplaceStatus] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setReplaceStatus(null);
    }
  }, [isOpen]);

  // Compute search results across all chapters
  const searchResults: ChapterSearchResult[] = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const sortedChapters = [...novel.chapters].sort((a, b) => a.order - b.order);
    const results: ChapterSearchResult[] = [];

    for (const chapter of sortedChapters) {
      const fullText = `${chapter.title}\n\n${chapter.content}`;
      const totalMatches = countMatchesInText(fullText, trimmed);

      if (totalMatches > 0) {
        const snippets = searchInText(chapter.content, trimmed, 6);
        results.push({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterOrder: chapter.order,
          act: chapter.act,
          totalMatches,
          snippets,
        });
      }
    }

    return results;
  }, [novel.chapters, query]);

  const totalMatchesAcrossAllChapters = useMemo(() => {
    return searchResults.reduce((acc, curr) => acc + curr.totalMatches, 0);
  }, [searchResults]);

  if (!isOpen) return null;

  const handleExecuteReplace = () => {
    if (!query.trim() || !onBatchReplace) return;

    onBatchReplace(query.trim(), replaceQuery, replaceTarget === 'all' ? undefined : replaceTarget);
    setReplaceStatus(`تم استبدال كل تكرارات "${query}" بنجاح!`);
    setTimeout(() => setReplaceStatus(null), 3000);
  };

  return (
    <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200">
        {/* Search Header */}
        <div className="p-5 border-b border-stone-100 bg-stone-50/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900 font-novel-amiri">
                  البحث الذكي في جميع فصول الرواية
                </h3>
                <p className="text-[11px] text-stone-500">
                  بحث فوري وشامل في نصوص الرواية مع تمييز التطابقات واستبدال الكلمات
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن كلمة، شخصية، جملة، أو تفصيلة سردية..."
              className="w-full pl-24 pr-10 py-2.5 bg-white border border-stone-300 rounded-xl text-sm placeholder:text-stone-400 text-stone-900 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-novel-amiri text-base"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute left-10 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                title="مسح"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setShowReplace(!showReplace)}
              className={`absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                showReplace
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
              }`}
              title="أداة استبدال الكلمات"
            >
              <Replace className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">استبدال</span>
            </button>
          </div>

          {/* Collapsible Replace Sub-bar */}
          {showReplace && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2.5 text-xs animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    placeholder="الكلمة البديلة الجديدة..."
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <select
                    value={replaceTarget}
                    onChange={(e) => setReplaceTarget(e.target.value)}
                    className="p-2 bg-white border border-amber-300 rounded-lg text-xs text-stone-800 focus:outline-hidden"
                  >
                    <option value="all">في جميع فصول الرواية</option>
                    {novel.chapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        في: {ch.title}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleExecuteReplace}
                    disabled={!query.trim()}
                    className="px-3 py-2 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors shrink-0 shadow-xs"
                  >
                    استبدال الكل
                  </button>
                </div>
              </div>

              {replaceStatus && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{replaceStatus}</span>
                </div>
              )}
            </div>
          )}

          {/* Query Stats Banner */}
          {query.trim() && (
            <div className="flex items-center justify-between text-xs text-stone-600 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-800">
                  {totalMatchesAcrossAllChapters.toLocaleString('ar-EG')} تطابق
                </span>
                <span>في</span>
                <span className="font-semibold text-stone-800">
                  {searchResults.length.toLocaleString('ar-EG')} فصول
                </span>
              </div>
              <span className="text-[11px] text-stone-400">انقر على أي تطابق للانتقال إليه مباشرة</span>
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-16 text-center text-xs text-stone-400 space-y-2">
              <Search className="w-8 h-8 mx-auto opacity-30 text-stone-600" />
              <p>اكتب كلمة أو اسماً للبحث الفوري داخل كافة فصول الرواية</p>
              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500 pt-2 flex-wrap">
                <span>اقتراحات للبحث:</span>
                {novel.characters.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setQuery(c.name)}
                    className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px]"
                  >
                    {c.name}
                  </button>
                ))}
                <button
                  onClick={() => setQuery('المخطوط')}
                  className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px]"
                >
                  المخطوط
                </button>
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-500 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto opacity-40 text-stone-400" />
              <p>لم يتم العثور على أي نتائج لكلمة «{query}» في فصول الرواية.</p>
              <p className="text-[11px] text-stone-400">جرب البحث بكلمة أو مرادف آخر.</p>
            </div>
          ) : (
            searchResults.map((res) => (
              <div
                key={res.chapterId}
                className="bg-stone-50/70 rounded-2xl border border-stone-200/80 p-4 space-y-3"
              >
                {/* Chapter Title & Match count */}
                <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-stone-500">
                      #{res.chapterOrder}
                    </span>
                    <h4 className="font-bold text-sm text-stone-900 font-novel-amiri">
                      {res.chapterTitle}
                    </h4>
                    {res.act && <span className="text-[11px] text-stone-500 font-sans">({res.act})</span>}
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-[11px] font-semibold">
                    {res.totalMatches} تطابق
                  </span>
                </div>

                {/* Match Snippets */}
                <div className="space-y-2">
                  {res.snippets.map((snip, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelectMatch(res.chapterId, snip.index, query.trim());
                        onClose();
                      }}
                      className="w-full text-right p-2.5 rounded-xl bg-white hover:bg-amber-50/50 border border-stone-200/80 hover:border-amber-300 transition-all group flex items-start gap-2 text-xs leading-relaxed font-novel-amiri"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1 text-stone-700">
                        <span>{snip.before}</span>
                        <mark className="bg-amber-200/90 text-amber-950 font-bold px-1 rounded-sm mx-0.5">
                          {snip.match}
                        </mark>
                        <span>{snip.after}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-100 bg-stone-50 flex items-center justify-between text-[11px] text-stone-500">
          <span>اختصار لوحة المفاتيح: اضغط Esc للإغلاق</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
