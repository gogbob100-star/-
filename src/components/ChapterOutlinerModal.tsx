import React, { useState } from 'react';
import {
  X,
  GripVertical,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit3,
  BookOpen,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  Eye,
  ListOrdered,
} from 'lucide-react';
import { Chapter, Novel } from '../types/novel';

interface ChapterOutlinerModalProps {
  isOpen: boolean;
  onClose: () => void;
  novel: Novel;
  onUpdateChapters: (chapters: Chapter[]) => void;
  onSelectChapter: (id: string) => void;
  onAddChapter: () => void;
}

export const ChapterOutlinerModal: React.FC<ChapterOutlinerModalProps> = ({
  isOpen,
  onClose,
  novel,
  onUpdateChapters,
  onSelectChapter,
  onAddChapter,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  if (!isOpen) return null;

  const sortedChapters = [...novel.chapters].sort((a, b) => a.order - b.order);

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...sortedChapters];
    const [movedChapter] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, movedChapter);

    // Update order indices
    const updatedOrder = reordered.map((ch, idx) => ({
      ...ch,
      order: idx + 1,
    }));

    onUpdateChapters(updatedOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Move Chapter Up or Down via buttons
  const moveChapter = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sortedChapters.length) return;

    const reordered = [...sortedChapters];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;

    const updatedOrder = reordered.map((ch, idx) => ({
      ...ch,
      order: idx + 1,
    }));

    onUpdateChapters(updatedOrder);
  };

  const handleDeleteChapter = (id: string) => {
    if (sortedChapters.length <= 1) {
      alert('لا يمكن حذف جميع الفصول! يجب الإبقاء على فصل واحد على الأقل.');
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذا الفصل ومحتواه بالكامل؟')) {
      const remaining = sortedChapters
        .filter((c) => c.id !== id)
        .map((c, idx) => ({ ...c, order: idx + 1 }));
      onUpdateChapters(remaining);
    }
  };

  const handleSaveChapterEdit = (updated: Chapter) => {
    onUpdateChapters(
      novel.chapters.map((c) => (c.id === updated.id ? updated : c))
    );
    setEditingChapter(null);
  };

  const getWordCount = (content: string) => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  };

  const totalNovelWords = sortedChapters.reduce(
    (sum, ch) => sum + getWordCount(ch.content),
    0
  );

  return (
    <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 select-none animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200 dark:border-stone-800">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-novel-amiri">
                لوحة تخطيط الفصول وإعادة الترتيب (Drag & Drop)
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                اسحب بطاقة الفصل وأفلتها لتغيير تسلسل الأحداث والرواية بكل سهولة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAddChapter}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>فصل جديد</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="px-6 py-3 bg-stone-100/80 dark:bg-stone-800/40 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              إجمالي الفصول: {sortedChapters.length}
            </span>
            <span>·</span>
            <span className="font-mono tabular-nums">
              إجمالي الكلمات: {totalNovelWords.toLocaleString('ar-EG')} كلمة
            </span>
          </div>
          <span className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">
            💡 نصيحة: انقر مع الاستمرار وسحب المقبض ⠿ لإعادة الترتيب
          </span>
        </div>

        {/* Chapter Cards List (Draggable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-stone-50/50 dark:bg-stone-950/50">
          {sortedChapters.map((chapter, idx) => {
            const wordCount = getWordCount(chapter.content);
            const isDragging = draggedIndex === idx;
            const isDragOver = dragOverIndex === idx;

            return (
              <div
                key={chapter.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`
                  p-4 rounded-2xl border transition-all duration-200 bg-white dark:bg-stone-900 shadow-2xs
                  flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
                  ${
                    isDragging
                      ? 'opacity-40 scale-98 border-dashed border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                      : isDragOver
                      ? 'border-2 border-amber-500 scale-[1.01] shadow-md'
                      : 'border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600'
                  }
                `}
              >
                {/* Right: Drag Grip & Number & Title Info */}
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  {/* Drag Handle Icon */}
                  <div
                    className="p-2 cursor-grab active:cursor-grabbing text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 shrink-0"
                    title="انقر واسحب لإعادة الترتيب"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Order Number Badge */}
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/20">
                    #{idx + 1}
                  </div>

                  {/* Title & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-novel-amiri truncate">
                        {chapter.title || `الفصل ${idx + 1}`}
                      </h3>

                      {chapter.act && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {chapter.act}
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                          chapter.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                            : chapter.status === 'revising'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400'
                        }`}
                      >
                        {chapter.status === 'completed'
                          ? 'مكتمل'
                          : chapter.status === 'revising'
                          ? 'قيد التحرير'
                          : 'مسودة'}
                      </span>

                      {chapter.tags && chapter.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          {chapter.tags.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {chapter.synopsis ? (
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mt-1 font-novel-amiri">
                        {chapter.synopsis}
                      </p>
                    ) : (
                      <p className="text-[11px] text-stone-400 dark:text-stone-500 italic mt-0.5">
                        لا تزال مسودة دون نبذة...
                      </p>
                    )}
                  </div>
                </div>

                {/* Left: Stats & Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                  {/* Word Count */}
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono tabular-nums">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span>{wordCount.toLocaleString('ar-EG')} كلمة</span>
                  </div>

                  {/* Up / Down Move Buttons */}
                  <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg">
                    <button
                      onClick={() => moveChapter(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-30 rounded transition-colors"
                      title="تحريك لأعلى"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveChapter(idx, 'down')}
                      disabled={idx === sortedChapters.length - 1}
                      className="p-1 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-30 rounded transition-colors"
                      title="تحريك لأسفل"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Actions: Edit info, Open Chapter, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingChapter(chapter)}
                      className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      title="تعديل معلومات الفصل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectChapter(chapter.id);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors shadow-2xs"
                      title="فتح الفصل في المحرر الآن"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>كتابة</span>
                    </button>

                    <button
                      onClick={() => handleDeleteChapter(chapter.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="حذف الفصل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Edit Chapter Info Modal */}
      {editingChapter && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-5 space-y-3 shadow-2xl border border-stone-200 dark:border-stone-800 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-novel-amiri">
                تعديل بيانات الفصل (#{editingChapter.order})
              </h4>
              <button onClick={() => setEditingChapter(null)} className="p-1 text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-900 mb-1">
                عنوان الفصل *
              </label>
              <input
                type="text"
                value={editingChapter.title}
                onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })}
                className="w-full p-2 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-xl text-xs font-novel-amiri text-sm focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-900 mb-1">
                  المرحلة / القسم (Act)
                </label>
                <input
                  type="text"
                  value={editingChapter.act || ''}
                  onChange={(e) => setEditingChapter({ ...editingChapter, act: e.target.value })}
                  placeholder="مثال: الفصل الأول - التقديم"
                  className="w-full p-2 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-900 mb-1">
                  حالة الفصل
                </label>
                <select
                  value={editingChapter.status}
                  onChange={(e) => setEditingChapter({ ...editingChapter, status: e.target.value as any })}
                  className="w-full p-2 bg-white text-gray-900 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
                >
                  <option value="draft" className="text-gray-900 bg-white">مسودة جديدة</option>
                  <option value="revising" className="text-gray-900 bg-white">قيد التحرير والتعديل</option>
                  <option value="completed" className="text-gray-900 bg-white">مكتمل ومراجع</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-900 mb-1">
                نبذة ملخصة عن أحداث الفصل
              </label>
              <textarea
                value={editingChapter.synopsis || ''}
                onChange={(e) => setEditingChapter({ ...editingChapter, synopsis: e.target.value })}
                rows={3}
                placeholder="أهم الصراعات والأحداث التي تقع في هذا الفصل..."
                className="w-full p-2 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-xl text-xs font-novel-amiri focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={() => setEditingChapter(null)}
                className="px-3 py-1.5 rounded-lg text-stone-600 dark:text-stone-400"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleSaveChapterEdit(editingChapter)}
                className="px-4 py-1.5 rounded-xl bg-amber-800 text-white font-semibold shadow-xs"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
