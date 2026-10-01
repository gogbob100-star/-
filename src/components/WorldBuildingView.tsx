import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Trash2,
  Edit3,
  MapPin,
  BookOpen,
  Calendar,
  Shield,
  FileSearch,
  Sparkles,
  Loader2,
  X,
} from 'lucide-react';
import { Novel, WorldNote } from '../types/novel';
import { requestAIAssist } from '../services/aiService';

interface WorldBuildingViewProps {
  novel: Novel;
  onUpdateNotes: (notes: WorldNote[]) => void;
}

export const WorldBuildingView: React.FC<WorldBuildingViewProps> = ({
  novel,
  onUpdateNotes,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [editingNote, setEditingNote] = useState<WorldNote | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  const categories = [
    { id: 'all', label: 'كل الملاحظات', icon: Compass },
    { id: 'location', label: 'أماكن وبيئات', icon: MapPin },
    { id: 'lore', label: 'أساطير وقواعد', icon: Shield },
    { id: 'timeline', label: 'تسلسل زمني', icon: Calendar },
    { id: 'research', label: 'بحوث ومراجع', icon: FileSearch },
  ];

  const filteredNotes = novel.worldNotes.filter((n) => {
    if (activeCategory === 'all') return true;
    return n.category === activeCategory;
  });

  const getCategoryMeta = (cat: WorldNote['category']) => {
    switch (cat) {
      case 'location':
        return { label: 'مكان وبيئة', icon: MapPin, color: 'text-emerald-700 bg-emerald-50' };
      case 'timeline':
        return { label: 'تسلسل زمني', icon: Calendar, color: 'text-blue-700 bg-blue-50' };
      case 'rules':
      case 'lore':
        return { label: 'قواعد وأساطير', icon: Shield, color: 'text-amber-700 bg-amber-50' };
      case 'research':
      default:
        return { label: 'بحث ومرجع', icon: FileSearch, color: 'text-stone-700 bg-stone-100' };
    }
  };

  const handleSaveNote = (note: WorldNote) => {
    const exists = novel.worldNotes.some((n) => n.id === note.id);
    if (exists) {
      onUpdateNotes(novel.worldNotes.map((n) => (n.id === note.id ? note : n)));
    } else {
      onUpdateNotes([...novel.worldNotes, note]);
    }
    setEditingNote(null);
    setIsCreatingNew(false);
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
      onUpdateNotes(novel.worldNotes.filter((n) => n.id !== id));
      if (editingNote?.id === id) setEditingNote(null);
    }
  };

  const getDynamicButtonInfo = () => {
    switch (activeCategory) {
      case 'location':
        return {
          label: '+ إضافة مكان/عالم جديد',
          category: 'location' as WorldNote['category'],
          subtext: 'توثيق مدينة، قصر، تضاريس، أو بيئة مكانية تجري فيها أحداث الرواية',
        };
      case 'lore':
        return {
          label: '+ إضافة أسطورة أو قانون جديد',
          category: 'lore' as WorldNote['category'],
          subtext: 'توثيق أنظمة السحر، القوانين الدينية، الأعراف الاجتماعية، أو الأساطير',
        };
      case 'timeline':
        return {
          label: '+ إضافة حدث زمني جديد',
          category: 'timeline' as WorldNote['category'],
          subtext: 'توثيق تسلسل الأحداث والمحطات التاريخية والسنوات الفارقة في العالم',
        };
      case 'research':
        return {
          label: '+ إضافة بحث أو مرجع جديد',
          category: 'research' as WorldNote['category'],
          subtext: 'تدوين مصطلحات لغوية، مراجع تاريخية، مقتنيات، أو وثائق ملهمة',
        };
      case 'all':
      default:
        return {
          label: '+ إضافة مدخل لعالم الرواية',
          category: 'location' as WorldNote['category'],
          subtext: 'إضافة عنصر بناء عالم جديد (مكان، قانون، حدث تاريخي، أو بحث)',
        };
    }
  };

  const dynamicInfo = getDynamicButtonInfo();

  const startNewNote = (overrideCategory?: WorldNote['category']) => {
    const cat = overrideCategory || dynamicInfo.category;
    const newNote: WorldNote = {
      id: `wn-${Date.now()}`,
      title: '',
      category: cat,
      content: '',
      updatedAt: new Date().toISOString(),
    };
    setEditingNote(newNote);
    setIsCreatingNew(true);
  };

  // AI expansion of world note
  const handleAIBrainstormLore = async (note: WorldNote) => {
    setIsAIGenerating(true);
    try {
      const result = await requestAIAssist({
        action: 'custom_prompt',
        context: {
          novelTitle: novel.title,
          genre: novel.genre,
          instructions: `توسيع وتعميق عالم الرواية في الملاحظة المعنونة بـ "${note.title}".
المحتوى الحالي:
${note.content}

المطلوب:
أضف تفاصيل بصرية وحسية إضافية (أصوات، روائح، تاريخ محلي، أسرار دفينة، شائعات يتناقلها الناس) تجعل هذا العنصر ينبض بالحياة داخل الرواية.`,
        },
      });

      const updated = {
        ...note,
        content: `${note.content}\n\n[إضافات وتفاصيل مقترحة]:\n${result}`,
        updatedAt: new Date().toISOString(),
      };
      onUpdateNotes(novel.worldNotes.map((n) => (n.id === note.id ? updated : n)));
      if (editingNote?.id === note.id) setEditingNote(updated);
    } catch (err: any) {
      alert(err.message || 'فشل التوسيع بالذكاء الاصطناعي.');
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
              عوالم الرواية والمشاهد والبحوث
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              توثيق الأماكن، القواعد، الحقب التاريخية، والملاحظات المرجعية لضمان اتساق عالم الرواية
            </p>
          </div>

          <button
            onClick={() => startNewNote()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title={dynamicInfo.label}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{dynamicInfo.label}</span>
          </button>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex items-center gap-1 bg-stone-200/70 p-1 rounded-xl w-fit flex-wrap">
          {categories.map((c) => {
            const Icon = c.icon;
            const isSelected = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Contextual Quick Add Action Card placed directly under active category tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 px-4.5 rounded-2xl border border-dashed border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent text-stone-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold font-novel-amiri flex items-center gap-2">
                <span>{dynamicInfo.label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 font-sans font-medium">
                  {categories.find((c) => c.id === activeCategory)?.label}
                </span>
              </h4>
              <p className="text-[11px] text-stone-600 mt-0.5">
                {dynamicInfo.subtext}
              </p>
            </div>
          </div>

          <button
            onClick={() => startNewNote()}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{dynamicInfo.label}</span>
          </button>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-stone-500 bg-white rounded-2xl border border-stone-200/70 space-y-3">
              <Compass className="w-10 h-10 mx-auto opacity-30 text-amber-600" />
              <p className="font-semibold text-sm">
                لا توجد عناصر مسجلة ضمن تصنيف (
                {categories.find((c) => c.id === activeCategory)?.label}) حتى الآن.
              </p>
              <button
                onClick={() => startNewNote()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{dynamicInfo.label}</span>
              </button>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const meta = getCategoryMeta(note.category);
              const Icon = meta.icon;

              return (
                <div
                  key={note.id}
                  className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top: Category Tag + Title */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-bold text-stone-900 text-base font-novel-amiri">
                        {note.title || 'مدخل بدون عنوان'}
                      </h3>
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium shrink-0 ${meta.color}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{meta.label}</span>
                      </span>
                    </div>

                    {/* Note Content */}
                    <div className="text-xs text-stone-600 leading-relaxed font-novel-amiri line-clamp-6 text-justify whitespace-pre-line mb-4">
                      {note.content || 'لا يوجد وصف بعد...'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs">
                    <button
                      onClick={() => handleAIBrainstormLore(note)}
                      disabled={isAIGenerating}
                      className="flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 font-medium disabled:opacity-50"
                      title="إثراء تفاصيل هذا المكان أو العنصر بالذكاء الاصطناعي"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>إثراء بالذكاء الاصطناعي</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-md transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingNote(note);
                          setIsCreatingNew(false);
                        }}
                        className="p-1.5 text-stone-600 hover:text-stone-900 rounded-md transition-colors"
                        title="تعديل"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit / Create Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-base text-stone-900 font-novel-amiri">
                {isCreatingNew ? 'إضافة مدخل لعالم الرواية' : 'تعديل بيانات المدخل'}
              </h3>
              <button
                onClick={() => setEditingNote(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-900 mb-1">العنوان أو المكان *</label>
                <input
                  type="text"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  placeholder="مثال: سراديب قصر الزهراء المهجورة"
                  className="w-full p-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-1">القسم والتصنيف</label>
                <select
                  value={editingNote.category}
                  onChange={(e) =>
                    setEditingNote({
                      ...editingNote,
                      category: e.target.value as WorldNote['category'],
                    })
                  }
                  className="w-full p-2.5 bg-white text-gray-900 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
                >
                  <option value="location" className="text-gray-900 bg-white">أماكن وبيئات</option>
                  <option value="lore" className="text-gray-900 bg-white">أساطير وقواعد العالم</option>
                  <option value="timeline" className="text-gray-900 bg-white">تسلسل زمني وأحداث تاريخية</option>
                  <option value="research" className="text-gray-900 bg-white">بحوث ومصادر ووثائق</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  الوصف والتفاصيل الحسية والمعلومات المرجعية
                </label>
                <textarea
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  rows={6}
                  placeholder="اكتب كل ما يخص هذا العنصر: أبعاده، أسراره، تاريخه، الروائح المميزة، المشاعر التي يثيرها في الشخصيات..."
                  className="w-full p-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                onClick={() => setEditingNote(null)}
                className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 text-xs font-medium"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleSaveNote(editingNote)}
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
