import React, { useState } from 'react';
import {
  GitBranch,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Sparkles,
  Link as LinkIcon,
  X,
  Loader2,
} from 'lucide-react';
import { Novel, PlotBeat } from '../types/novel';
import { requestAIAssist } from '../services/aiService';

interface PlotOutlinerViewProps {
  novel: Novel;
  onUpdateBeats: (beats: PlotBeat[]) => void;
}

export const PlotOutlinerView: React.FC<PlotOutlinerViewProps> = ({
  novel,
  onUpdateBeats,
}) => {
  const [editingBeat, setEditingBeat] = useState<PlotBeat | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  const actColumns = [
    { id: 'act1', label: 'الفصل الأول: التهيئة والبداية', subtitle: 'الخطاف والحدث المفجر ونقطة اللاعودة' },
    { id: 'act2a', label: 'الفصل الثاني (أ): تصاعد الصراع', subtitle: 'المطاردة والعقبات وبلوغ نقطة المنتصف' },
    { id: 'act2b', label: 'الفصل الثاني (ب): الأزمة والانهيار', subtitle: 'لحظة الظلام الدامس وفقدان الأمل' },
    { id: 'act3', label: 'الفصل الثالث: الذروة والحل', subtitle: 'المواجهة الكبرى وحل العقدة والختام' },
  ];

  const handleToggleResolved = (id: string) => {
    onUpdateBeats(
      novel.plotBeats.map((b) => (b.id === id ? { ...b, resolved: !b.resolved } : b))
    );
  };

  const handleDeleteBeat = (id: string) => {
    onUpdateBeats(novel.plotBeats.filter((b) => b.id !== id));
    if (editingBeat?.id === id) setEditingBeat(null);
  };

  const handleSaveBeat = (beat: PlotBeat) => {
    const exists = novel.plotBeats.some((b) => b.id === beat.id);
    if (exists) {
      onUpdateBeats(novel.plotBeats.map((b) => (b.id === beat.id ? beat : b)));
    } else {
      onUpdateBeats([...novel.plotBeats, beat]);
    }
    setEditingBeat(null);
    setIsCreatingNew(false);
  };

  const startNewBeat = (act: PlotBeat['act'] = 'act1') => {
    const newBeat: PlotBeat = {
      id: `pb-${Date.now()}`,
      title: '',
      act,
      description: '',
      resolved: false,
    };
    setEditingBeat(newBeat);
    setIsCreatingNew(true);
  };

  const handleAIGenerateBeats = async () => {
    setIsAIGenerating(true);
    try {
      const result = await requestAIAssist({
        action: 'brainstorm_ideas',
        context: {
          novelTitle: novel.title,
          genre: novel.genre,
          summary: novel.synopsis,
          instructions:
            'اقترح توزيعاً درامياً لنقاط الحبكة وفق هيكل الفصول الثلاثة الكلاسيكي (Three-Act Structure)، مقسمة إلى: 1. البداية والحدث المفجر، 2. نقطة المنتصف، 3. لحظة الانهيار، 4. الذروة والحل.',
        },
      });

      // Add a comprehensive plot outline beat note
      const generatedBeat: PlotBeat = {
        id: `pb-${Date.now()}`,
        title: 'مخطط الحبكة المقترح بالذكاء الاصطناعي',
        act: 'act2a',
        description: result,
        resolved: false,
      };

      onUpdateBeats([...novel.plotBeats, generatedBeat]);
    } catch (err: any) {
      alert(err.message || 'فشل توليد المخطط.');
    } finally {
      setIsAIGenerating(false);
    }
  };

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto bg-stone-100 dark:bg-stone-950 p-3 sm:p-6 md:p-10 pb-24 md:pb-10 select-none transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-stone-900 font-novel-amiri">
              مخطط الحبكة وقوس السرد الدرامي
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              تنظيم نقاط التحول المفصلية على هيكل الفصول الثلاثة لضمان ذروة وتصاعد سردي متقن
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAIGenerateBeats}
              disabled={isAIGenerating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
            >
              {isAIGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري هندسة الحبكة...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>اقتراح حبكة بالذكاء الاصطناعي</span>
                </>
              )}
            </button>

            <button
              onClick={() => startNewBeat('act1')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة نقطة تحول</span>
            </button>
          </div>
        </div>

        {/* 4 Column Acts Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actColumns.map((col) => {
            const colBeats = novel.plotBeats.filter((b) => b.act === col.id);

            return (
              <div
                key={col.id}
                className="bg-stone-200/50 rounded-2xl p-3.5 border border-stone-200 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="mb-3 px-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-stone-900">{col.label}</h3>
                    <span className="text-[11px] font-mono text-stone-500">({colBeats.length})</span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-0.5">{col.subtitle}</p>
                </div>

                {/* Beats List */}
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {colBeats.map((beat) => (
                    <div
                      key={beat.id}
                      className={`bg-white rounded-xl p-3.5 border transition-all text-right ${
                        beat.resolved
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-stone-200 hover:border-stone-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <button
                          onClick={() => handleToggleResolved(beat.id)}
                          className="text-stone-400 hover:text-emerald-600 transition-colors mt-0.5"
                          title={beat.resolved ? 'مكتمل في الرواية' : 'تعليم كمكتمل'}
                        >
                          {beat.resolved ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <h4
                          className={`font-semibold text-xs flex-1 ${
                            beat.resolved ? 'line-through text-stone-400' : 'text-stone-900'
                          }`}
                        >
                          {beat.title || 'نقطة تحول دون عنوان'}
                        </h4>
                      </div>

                      <p className="text-[11px] text-stone-600 leading-relaxed font-novel-amiri whitespace-pre-line line-clamp-4 mb-3">
                        {beat.description}
                      </p>

                      {/* Footer actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[10px] text-stone-400">
                        {beat.linkedChapterId ? (
                          <div className="flex items-center gap-1 text-stone-600">
                            <LinkIcon className="w-3 h-3 text-amber-600" />
                            <span>مرتبط بفصل</span>
                          </div>
                        ) : (
                          <span />
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteBeat(beat.id)}
                            className="p-1 hover:text-red-600 rounded"
                            title="حذف"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingBeat(beat);
                              setIsCreatingNew(false);
                            }}
                            className="p-1 hover:text-stone-800 rounded"
                            title="تعديل"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => startNewBeat(col.id as PlotBeat['act'])}
                    className="w-full py-2 border border-dashed border-stone-300 rounded-xl text-stone-500 hover:text-stone-800 hover:border-stone-400 hover:bg-white text-xs font-medium transition-all flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة نقطة</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit/Create Beat Modal */}
      {editingBeat && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900 font-novel-amiri">
                {isCreatingNew ? 'إضافة نقطة تحول جديدة' : 'تعديل نقطة التحول'}
              </h3>
              <button
                onClick={() => setEditingBeat(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-900 mb-1">عنوان نقطة التحول *</label>
                <input
                  type="text"
                  value={editingBeat.title}
                  onChange={(e) => setEditingBeat({ ...editingBeat, title: e.target.value })}
                  placeholder="مثال: الخيانة الكبرى واكتشاف هوية القاتل"
                  className="w-full p-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-1">مرحلة الفصول (Act)</label>
                <select
                  value={editingBeat.act}
                  onChange={(e) =>
                    setEditingBeat({ ...editingBeat, act: e.target.value as PlotBeat['act'] })
                  }
                  className="w-full p-2.5 bg-white text-gray-900 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
                >
                  <option value="act1" className="text-gray-900 bg-white">الفصل الأول: التهيئة والبداية</option>
                  <option value="act2a" className="text-gray-900 bg-white">الفصل الثاني (أ): تصاعد الصراع وبلوغ المنتصف</option>
                  <option value="act2b" className="text-gray-900 bg-white">الفصل الثاني (ب): الأزمة ولحظة الظلام الدامس</option>
                  <option value="act3" className="text-gray-900 bg-white">الفصل الثالث: الذروة والحل النهائي</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-1">ربط بفصل معين (اختياري)</label>
                <select
                  value={editingBeat.linkedChapterId || ''}
                  onChange={(e) =>
                    setEditingBeat({
                      ...editingBeat,
                      linkedChapterId: e.target.value || undefined,
                    })
                  }
                  className="w-full p-2.5 bg-white text-gray-900 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
                >
                  <option value="" className="text-gray-900 bg-white">بدون ربط بفصل محدد</option>
                  {novel.chapters.map((ch) => (
                    <option key={ch.id} value={ch.id} className="text-gray-900 bg-white">
                      {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  شرح ما يحدث في هذه النقطة وتأثيرها على الشخصيات
                </label>
                <textarea
                  value={editingBeat.description}
                  onChange={(e) => setEditingBeat({ ...editingBeat, description: e.target.value })}
                  rows={5}
                  placeholder="ما هو الفعل الدرامي الرئيسي؟ من يخسر ومن يكسب؟ وكيف تتغير خطط البطل؟..."
                  className="w-full p-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                onClick={() => setEditingBeat(null)}
                className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 text-xs font-medium"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleSaveBeat(editingBeat)}
                className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium shadow-xs"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
