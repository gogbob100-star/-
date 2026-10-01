import React, { useState } from 'react';
import {
  X,
  Users,
  MapPin,
  Plus,
  Compass,
  Edit3,
  Trash2,
  CornerDownLeft,
  Search,
  Sparkles,
  Tag,
  Shield,
  Heart,
  Target,
} from 'lucide-react';
import { Novel, Character, WorldNote } from '../types/novel';

interface StoryWorldDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  novel: Novel;
  onUpdateCharacters: (characters: Character[]) => void;
  onUpdateNotes: (notes: WorldNote[]) => void;
  onInsertTextAtCursor?: (text: string) => void;
}

export const StoryWorldDrawer: React.FC<StoryWorldDrawerProps> = ({
  isOpen,
  onClose,
  novel,
  onUpdateCharacters,
  onUpdateNotes,
  onInsertTextAtCursor,
}) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'locations'>('characters');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [editingLocation, setEditingNote] = useState<WorldNote | null>(null);

  if (!isOpen) return null;

  // Filter characters
  const filteredCharacters = novel.characters.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.archetype && c.archetype.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter location notes
  const locationNotes = novel.worldNotes.filter((n) => n.category === 'location' || n.category === 'lore');
  const filteredLocations = locationNotes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveCharacter = (char: Character) => {
    const exists = novel.characters.some((c) => c.id === char.id);
    if (exists) {
      onUpdateCharacters(novel.characters.map((c) => (c.id === char.id ? char : c)));
    } else {
      onUpdateCharacters([...novel.characters, char]);
    }
    setEditingCharacter(null);
  };

  const handleDeleteCharacter = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الشخصية؟')) {
      onUpdateCharacters(novel.characters.filter((c) => c.id !== id));
      if (editingCharacter?.id === id) setEditingCharacter(null);
    }
  };

  const handleSaveLocation = (note: WorldNote) => {
    const exists = novel.worldNotes.some((n) => n.id === note.id);
    if (exists) {
      onUpdateNotes(novel.worldNotes.map((n) => (n.id === note.id ? note : n)));
    } else {
      onUpdateNotes([...novel.worldNotes, note]);
    }
    setEditingNote(null);
  };

  const handleDeleteLocation = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المكان؟')) {
      onUpdateNotes(novel.worldNotes.filter((n) => n.id !== id));
      if (editingLocation?.id === id) setEditingNote(null);
    }
  };

  const startNewCharacterCard = () => {
    const newChar: Character = {
      id: `char-${Date.now()}`,
      name: '',
      role: 'supporting',
      age: '',
      archetype: 'شخصية جديدة',
      externalGoal: '',
      internalNeed: '',
      fatalFlaw: '',
      voiceAndQuirks: '',
      backstory: '',
      color: '#d97706',
    };
    setEditingCharacter(newChar);
  };

  const startNewLocationCard = () => {
    const newNote: WorldNote = {
      id: `wn-${Date.now()}`,
      title: '',
      category: 'location',
      content: '',
      updatedAt: new Date().toISOString(),
    };
    setEditingNote(newNote);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs z-40 transition-opacity animate-in fade-in"
      />

      {/* Drawer Container */}
      <aside className="fixed inset-y-0 left-0 z-50 w-full sm:w-96 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col select-none transition-transform animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-novel-amiri">
                عالم القصة وبنك الشخصيات
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">مرجع سريع للكاتب أثناء تحرير النص</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher & Search */}
        <div className="p-3 border-b border-stone-100 dark:border-stone-800 space-y-2 bg-white dark:bg-stone-900">
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('characters')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'characters'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>الشخصيات ({novel.characters.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('locations')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'locations'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>الأماكن والمعالم ({locationNotes.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'characters' ? 'بحث عن شخصية...' : 'بحث عن مكان أو معلَم...'}
              className="w-full pr-8 pl-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {activeTab === 'characters' ? (
            <>
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                <span>بطاقات الشخصيات الحالية:</span>
                <button
                  onClick={startNewCharacterCard}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-all shadow-2xs cursor-pointer hover:scale-[1.02]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ إضافة شخصية جديدة</span>
                </button>
              </div>

              {filteredCharacters.length === 0 ? (
                <div className="text-center py-12 text-xs text-stone-400">
                  لا توجد شخصيات طابق بحثك.
                </div>
              ) : (
                filteredCharacters.map((char) => (
                  <div
                    key={char.id}
                    className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 space-y-2 hover:border-amber-500/50 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0"
                          style={{ backgroundColor: char.color || '#d97706' }}
                        >
                          {char.name ? char.name[0] : '؟'}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100">
                            {char.name || 'دون اسم'}
                          </h4>
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                            {char.role === 'protagonist'
                              ? 'البطل الرئيسي'
                              : char.role === 'antagonist'
                              ? 'الخصم'
                              : 'شخصية مساندة'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingCharacter(char)}
                          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                          title="تعديل"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCharacter(char.id)}
                          className="p-1 text-stone-400 hover:text-rose-600"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {char.archetype && (
                      <p className="text-[11px] text-stone-600 dark:text-stone-300">
                        <strong>النمط:</strong> {char.archetype}
                      </p>
                    )}

                    {char.externalGoal && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2">
                        <strong>الهدف:</strong> {char.externalGoal}
                      </p>
                    )}

                    {/* Insert Action */}
                    {onInsertTextAtCursor && (
                      <button
                        onClick={() => onInsertTextAtCursor(char.name + ' ')}
                        className="w-full mt-1 py-1 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                        title="إدراج اسم الشخصية مباشرة في النص"
                      >
                        <CornerDownLeft className="w-3 h-3 text-amber-600" />
                        <span>إدراج الاسم في النص</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                <span>بطاقات الأماكن والمعالم:</span>
                <button
                  onClick={startNewLocationCard}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-all shadow-2xs cursor-pointer hover:scale-[1.02]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ إضافة مكان/عالم جديد</span>
                </button>
              </div>

              {filteredLocations.length === 0 ? (
                <div className="text-center py-12 text-xs text-stone-400">
                  لا توجد أماكن مطابقة.
                </div>
              ) : (
                filteredLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 space-y-2 hover:border-emerald-500/50 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100">
                          {loc.title || 'مكان دون عنوان'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingNote(loc)}
                          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(loc.id)}
                          className="p-1 text-stone-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {loc.content && (
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed">
                        {loc.content}
                      </p>
                    )}

                    {/* Insert Action */}
                    {onInsertTextAtCursor && (
                      <button
                        onClick={() => onInsertTextAtCursor(loc.title + ' ')}
                        className="w-full mt-1 py-1 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                        title="إدراج اسم المكان في النص"
                      >
                        <CornerDownLeft className="w-3 h-3 text-emerald-600" />
                        <span>إدراج اسم المكان في النص</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </aside>

      {/* Edit Character Card Modal */}
      {editingCharacter && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-5 space-y-3 shadow-2xl border border-stone-200 dark:border-stone-800 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-novel-amiri">
                بطاقة شخصية سريعة
              </h4>
              <button onClick={() => setEditingCharacter(null)} className="p-1 text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                اسم الشخصية *
              </label>
              <input
                type="text"
                value={editingCharacter.name}
                onChange={(e) => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
                placeholder="مثال: زياد الأندلسي"
                className="w-full p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  الدور السردي
                </label>
                <select
                  value={editingCharacter.role}
                  onChange={(e) =>
                    setEditingCharacter({ ...editingCharacter, role: e.target.value as any })
                  }
                  className="w-full p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                >
                  <option value="protagonist">البطل الرئيسي</option>
                  <option value="antagonist">الخصم</option>
                  <option value="supporting">شخصية مساندة</option>
                  <option value="minor">ثانوية</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  العمر / المظهر
                </label>
                <input
                  type="text"
                  value={editingCharacter.age || ''}
                  onChange={(e) => setEditingCharacter({ ...editingCharacter, age: e.target.value })}
                  placeholder="مثال: 25 سنة، عينان حادتان"
                  className="w-full p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                النمط والصفات الرئيسية
              </label>
              <input
                type="text"
                value={editingCharacter.archetype || ''}
                onChange={(e) => setEditingCharacter({ ...editingCharacter, archetype: e.target.value })}
                placeholder="مثال: باحث حذر عن الحقائق، وفي لأصدقائه"
                className="w-full p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={() => setEditingCharacter(null)}
                className="px-3 py-1.5 rounded-lg text-stone-600 dark:text-stone-400"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleSaveCharacter(editingCharacter)}
                className="px-4 py-1.5 rounded-xl bg-amber-600 text-white font-semibold shadow-xs"
              >
                حفظ البطاقة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Location Card Modal */}
      {editingLocation && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-5 space-y-3 shadow-2xl border border-stone-200 dark:border-stone-800 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-novel-amiri">
                بطاقة مكان / معلَم سريعة
              </h4>
              <button onClick={() => setEditingNote(null)} className="p-1 text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                اسم المكان / المعلم *
              </label>
              <input
                type="text"
                value={editingLocation.title}
                onChange={(e) => setEditingNote({ ...editingLocation, title: e.target.value })}
                placeholder="مثال: مكتبة قصر الزهراء السرية"
                className="w-full p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                وصف البيئة والأجواء والمعالم
              </label>
              <textarea
                value={editingLocation.content}
                onChange={(e) => setEditingNote({ ...editingLocation, content: e.target.value })}
                rows={4}
                placeholder="تفاصيل المكان، الروائح، الإضاءة، الأثر الدرامي على المشاهد..."
                className="w-full p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={() => setEditingNote(null)}
                className="px-3 py-1.5 rounded-lg text-stone-600 dark:text-stone-400"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleSaveLocation(editingLocation)}
                className="px-4 py-1.5 rounded-xl bg-emerald-700 text-white font-semibold shadow-xs"
              >
                حفظ المكان
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
