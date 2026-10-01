import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  FileText,
  Clock,
  Sparkles,
  X,
  ListOrdered,
  Tag,
  Filter,
} from 'lucide-react';
import { Chapter } from '../types/novel';

export const TAG_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  حواري: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/25',
  },
  وصفي: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/25',
  },
  درامي: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500/25',
  },
  تشويق: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/25',
  },
  صراع: {
    bg: 'bg-red-500/10 dark:bg-red-500/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-500/25',
  },
  رومانسي: {
    bg: 'bg-pink-500/10 dark:bg-pink-500/20',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-500/25',
  },
  تمهيد: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/25',
  },
  ذروة: {
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-500/25',
  },
  استرجاع: {
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-500/25',
  },
};

export const getTagBadgeStyle = (tag: string) => {
  return (
    TAG_STYLES[tag] || {
      bg: 'bg-stone-500/10 dark:bg-stone-500/20',
      text: 'text-stone-700 dark:text-stone-300',
      border: 'border-stone-500/25',
    }
  );
};

interface ChapterSidebarProps {
  chapters: Chapter[];
  currentChapterId: string;
  onSelectChapter: (id: string) => void;
  onAddChapter: () => void;
  onDeleteChapter: (id: string) => void;
  onDuplicateChapter: (id: string) => void;
  onMoveChapter: (id: string, direction: 'up' | 'down') => void;
  onQuickAIOutline?: () => void;
  onOpenChapterOutliner?: () => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const ChapterSidebar: React.FC<ChapterSidebarProps> = ({
  chapters,
  currentChapterId,
  onSelectChapter,
  onAddChapter,
  onDeleteChapter,
  onDuplicateChapter,
  onMoveChapter,
  onQuickAIOutline,
  onOpenChapterOutliner,
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => a.order - b.order);
  }, [chapters]);

  // Aggregate all unique tags present across chapters + standard suggestions
  const allAvailableTags = useMemo(() => {
    const set = new Set<string>(['حواري', 'وصفي', 'درامي']);
    chapters.forEach((ch) => {
      ch.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [chapters]);

  // Tag usage counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    chapters.forEach((ch) => {
      ch.tags?.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return counts;
  }, [chapters]);

  // Filter chapters by both search query and tag selection
  const filteredChapters = useMemo(() => {
    return sortedChapters.filter((ch) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ch.title.toLowerCase().includes(q) ||
        (ch.act && ch.act.toLowerCase().includes(q)) ||
        (ch.synopsis && ch.synopsis.toLowerCase().includes(q)) ||
        (ch.tags && ch.tags.some((t) => t.toLowerCase().includes(q)));

      const matchesTag = selectedTag ? ch.tags?.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    });
  }, [sortedChapters, searchQuery, selectedTag]);

  const getWordCount = (content: string) => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  };

  const getStatusLabel = (status: Chapter['status']) => {
    switch (status) {
      case 'completed':
        return {
          text: 'مكتمل',
          color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'revising':
        return {
          text: 'قيد التحرير',
          color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'draft':
      default:
        return {
          text: 'مسودة',
          color: 'text-stone-600 bg-stone-100 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700',
        };
    }
  };

  const handleSelect = (id: string) => {
    onSelectChapter(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenOnMobile && (
        <div
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 right-0 z-50 md:z-auto
          w-80 max-w-[85vw] h-full md:h-[calc(100vh-4rem)]
          border-l border-stone-200 dark:border-stone-800
          bg-stone-50 dark:bg-stone-900
          flex flex-col shrink-0 select-none transition-transform duration-300
          ${isOpenOnMobile ? 'translate-x-0 shadow-2xl' : 'translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile Header with Close Button */}
        <div className="md:hidden flex items-center justify-between p-3.5 border-b border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-800/70">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-sm text-stone-900 dark:text-stone-100 font-novel-amiri">
              فهرس فصول الرواية
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Header & Controls */}
        <div className="p-3.5 border-b border-stone-200 dark:border-stone-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              <span className="font-semibold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                فصول الرواية ({chapters.length})
              </span>
            </div>

            <button
              onClick={onAddChapter}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer"
              title="إضافة فصل جديد"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>فصل جديد</span>
            </button>
          </div>

          {/* Drag & Drop Chapter Outliner Board Trigger */}
          {onOpenChapterOutliner && (
            <button
              onClick={onOpenChapterOutliner}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/25 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              title="فتح لوحة تخطيط وإعادة ترتيب الفصول بالسحب والإفلات"
            >
              <ListOrdered className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>لوحة إعادة الترتيب (Drag & Drop)</span>
            </button>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في العناوين والوسوم..."
              className="w-full pl-3 pr-8 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs placeholder:text-stone-400 text-stone-800 dark:text-stone-100 focus:outline-hidden focus:border-amber-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Tags Filter Chips Bar */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1 font-medium">
                <Tag className="w-3 h-3 text-amber-600" />
                <span>تصفية بحسب الوسم:</span>
              </span>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-amber-600 hover:underline text-[10px]"
                >
                  إلغاء التصفية
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
              {/* "All" button */}
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-all cursor-pointer ${
                  selectedTag === null
                    ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                    : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                الكل ({chapters.length})
              </button>

              {/* Tag Chips */}
              {allAvailableTags.map((tag) => {
                const count = tagCounts[tag] || 0;
                const isSelected = selectedTag === tag;
                const style = getTagBadgeStyle(tag);

                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-all border cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-bold'
                        : `${style.bg} ${style.text} ${style.border} hover:opacity-100 opacity-80`
                    }`}
                  >
                    <span>{tag}</span>
                    {count > 0 && (
                      <span
                        className={`text-[9px] px-1 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-stone-500/10 dark:bg-stone-400/20'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {/* Active Filter notice */}
          {selectedTag && (
            <div className="p-2 px-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-200">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-amber-600" />
                <span>
                  تصفية: <strong>{selectedTag}</strong> ({filteredChapters.length} فصل)
                </span>
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className="hover:bg-amber-500/20 p-0.5 rounded text-stone-500 hover:text-stone-800"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {filteredChapters.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400 space-y-1.5">
              <FileText className="w-8 h-8 mx-auto opacity-30 text-stone-400" />
              <p>لا توجد فصول مطابقة للبحث أو الوسم المختار</p>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-amber-600 underline text-[11px] mt-1 block mx-auto"
                >
                  إظهار كافة الفصول
                </button>
              )}
            </div>
          ) : (
            filteredChapters.map((chapter, index) => {
              const isSelected = chapter.id === currentChapterId;
              const words = getWordCount(chapter.content);
              const status = getStatusLabel(chapter.status);
              const approxReadTime = Math.max(1, Math.round(words / 200));

              return (
                <div
                  key={chapter.id}
                  onClick={() => handleSelect(chapter.id)}
                  className={`group relative p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-stone-800 border-amber-500/60 shadow-xs ring-1 ring-amber-500/30'
                      : 'bg-stone-50/60 dark:bg-stone-900/60 border-stone-200/70 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  {/* Header row: Order + Act + Actions */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-stone-300 font-mono">
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        #{chapter.order}
                      </span>
                      {chapter.act && (
                        <>
                          <span>·</span>
                          <span className="text-stone-600 dark:text-stone-400 font-sans truncate max-w-[120px]">
                            {chapter.act}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Actions on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveChapter(chapter.id, 'up');
                        }}
                        disabled={index === 0}
                        className="p-1 text-stone-600 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 disabled:opacity-30 rounded hover:bg-stone-100 dark:hover:bg-stone-700"
                        title="تحريك لأعلى"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveChapter(chapter.id, 'down');
                        }}
                        disabled={index === filteredChapters.length - 1}
                        className="p-1 text-stone-600 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 disabled:opacity-30 rounded hover:bg-stone-100 dark:hover:bg-stone-700"
                        title="تحريك لأسفل"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateChapter(chapter.id);
                        }}
                        className="p-1 text-stone-600 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 rounded hover:bg-stone-100 dark:hover:bg-stone-700"
                        title="تكرار الفصل"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {chapters.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`هل أنت متأكد من حذف "${chapter.title}"؟`)) {
                              onDeleteChapter(chapter.id);
                            }
                          }}
                          className="p-1 text-stone-600 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="حذف الفصل"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chapter Title */}
                  <h4
                    className={`text-sm font-medium line-clamp-1 mb-1.5 ${
                      isSelected
                        ? 'text-amber-950 dark:text-amber-200 font-semibold'
                        : 'text-stone-800 dark:text-stone-100'
                    }`}
                  >
                    {chapter.title || 'فصل دون عنوان'}
                  </h4>

                  {/* Chapter Tags Row */}
                  {chapter.tags && chapter.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mb-2">
                      {chapter.tags.map((t) => {
                        const style = getTagBadgeStyle(t);
                        return (
                          <span
                            key={t}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTag(t === selectedTag ? null : t);
                            }}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${style.bg} ${style.text} ${style.border} hover:opacity-100`}
                            title={`تصفية الفصول بالوسم: ${t}`}
                          >
                            #{t}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Metadata row: Word count + Read time + Status */}
                  <div className="flex items-center justify-between text-[11px] text-stone-700 dark:text-stone-300">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-stone-600 dark:text-stone-400">
                        {words.toLocaleString('ar-EG')} كلمة
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-stone-600 dark:text-stone-400">
                        <Clock className="w-3 h-3" />
                        <span>{approxReadTime} د</span>
                      </span>
                    </div>

                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${status.color}`}
                    >
                      {status.text}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        {onQuickAIOutline && (
          <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-800/50">
            <button
              onClick={onQuickAIOutline}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>اقتراح تخطيط فصول بالذكاء الاصطناعي</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
