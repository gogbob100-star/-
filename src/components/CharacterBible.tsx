import React, { useState } from 'react';
import {
  Users,
  Plus,
  Sparkles,
  Trash2,
  Edit3,
  Heart,
  Target,
  AlertTriangle,
  Mic,
  Loader2,
  X,
  Check,
  Tag,
  Copy,
  BookOpen,
  Compass,
  Wand2,
  LayoutGrid,
  Share2,
} from 'lucide-react';
import { Character, CharacterRelationship, Novel } from '../types/novel';
import { requestAIAssist } from '../services/aiService';
import { CharacterRelationshipMap } from './CharacterRelationshipMap';

interface CharacterBibleProps {
  novel: Novel;
  onUpdateCharacters: (characters: Character[]) => void;
  onUpdateRelationships: (relationships: CharacterRelationship[]) => void;
}

interface GeneratedCharacterName {
  name: string;
  gender: string;
  meaning: string;
  vibe: string;
  suggestedRole: string;
}

export const CharacterBible: React.FC<CharacterBibleProps> = ({
  novel,
  onUpdateCharacters,
  onUpdateRelationships,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [addRelTrigger, setAddRelTrigger] = useState<number>(0);

  // Full character generator state
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAIPromptModal, setShowAIPromptModal] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Smart Name Generator state
  const [showNameGenModal, setShowNameGenModal] = useState(false);
  const [nameGenEra, setNameGenEra] = useState('الأندلس والعصر الذهبي الإسلامي');
  const [nameGenCulture, setNameGenCulture] = useState('عربية أندلسية / مغاربية');
  const [nameGenGenre, setNameGenGenre] = useState(novel.genre || 'غموض وتاريخ / تشويق نفسي');
  const [nameGenGender, setNameGenGender] = useState('متنوع (ذكور وإناث)');
  const [nameGenVibe, setNameGenVibe] = useState('نبيل ووقور وذو هيبة');
  const [nameGenExtra, setNameGenExtra] = useState('');
  const [isGeneratingNames, setIsGeneratingNames] = useState(false);
  const [generatedNames, setGeneratedNames] = useState<GeneratedCharacterName[]>([]);
  const [nameGenError, setNameGenError] = useState<string | null>(null);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const roles = [
    { id: 'all', label: 'كافة الشخصيات' },
    { id: 'protagonist', label: 'الأبطال' },
    { id: 'antagonist', label: 'الخصوم' },
    { id: 'supporting', label: 'شخصيات مساندة' },
    { id: 'minor', label: 'شخصيات ثانوية' },
  ];

  const filteredCharacters = novel.characters.filter((c) => {
    if (selectedRole === 'all') return true;
    return c.role === selectedRole;
  });

  const getRoleBadge = (role: Character['role']) => {
    switch (role) {
      case 'protagonist':
        return { label: 'بطل الرواية', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'antagonist':
        return { label: 'الخصم', color: 'bg-red-100 text-red-900 border-red-300' };
      case 'supporting':
        return { label: 'شخصية مساندة', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'minor':
      default:
        return { label: 'شخصية ثانوية', color: 'bg-stone-100 text-stone-700 border-stone-300' };
    }
  };

  const handleSaveCharacter = (char: Character) => {
    const exists = novel.characters.some((c) => c.id === char.id);
    if (exists) {
      onUpdateCharacters(novel.characters.map((c) => (c.id === char.id ? char : c)));
    } else {
      onUpdateCharacters([...novel.characters, char]);
    }
    setEditingCharacter(null);
    setIsCreatingNew(false);
  };

  const handleDeleteCharacter = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الشخصية؟')) {
      onUpdateCharacters(novel.characters.filter((c) => c.id !== id));
      if (editingCharacter?.id === id) setEditingCharacter(null);
    }
  };

  const startNewCharacter = (prefillName = '', prefillRole = 'supporting', prefillNotes = '') => {
    const newChar: Character = {
      id: `char-${Date.now()}`,
      name: prefillName,
      role: prefillRole as Character['role'],
      age: '',
      archetype: prefillNotes || '',
      externalGoal: '',
      internalNeed: '',
      fatalFlaw: '',
      voiceAndQuirks: '',
      backstory: '',
      color: '#d97706',
    };
    setEditingCharacter(newChar);
    setIsCreatingNew(true);
  };

  // Dynamic Context-Aware Add Button Info
  const getDynamicButtonInfo = () => {
    if (viewMode === 'map') {
      return {
        label: '+ إضافة رابطة/علاقة جديدة',
        role: 'supporting' as Character['role'],
        subtext: 'ربط شخصيتين برابطة درامية في شبكة العلاقات (صداقة، عداء، قرابة، حب، صراع...)',
        isRelationship: true,
      };
    }

    switch (selectedRole) {
      case 'protagonist':
        return {
          label: '+ إضافة بطل جديد',
          role: 'protagonist' as Character['role'],
          subtext: 'إضافة بطل أو شخصية رئيسية تقود خطوط الحبكة والصراع الرئيسي',
          isRelationship: false,
        };
      case 'antagonist':
        return {
          label: '+ إضافة خصم جديد',
          role: 'antagonist' as Character['role'],
          subtext: 'إضافة خصم أو منافس رئيسي يعيق مسيرة الأبطال ويصنع التوتر',
          isRelationship: false,
        };
      case 'supporting':
        return {
          label: '+ إضافة شخصية مساندة',
          role: 'supporting' as Character['role'],
          subtext: 'إضافة حليف، رفيق درب، أو مرشد يوجه البطل ويثري الأحداث',
          isRelationship: false,
        };
      case 'minor':
        return {
          label: '+ إضافة شخصية ثانوية',
          role: 'minor' as Character['role'],
          subtext: 'إضافة شخصية ثانوية أو عابرة تعطي حيوية وعمقاً للمشاهد',
          isRelationship: false,
        };
      case 'all':
      default:
        return {
          label: '+ إضافة شخصية',
          role: 'protagonist' as Character['role'],
          subtext: 'إضافة شخصية جديدة إلى بنك وموسوعة شخصيات الرواية',
          isRelationship: false,
        };
    }
  };

  const dynamicInfo = getDynamicButtonInfo();

  const handleDynamicAdd = () => {
    if (dynamicInfo.isRelationship) {
      setAddRelTrigger((prev) => prev + 1);
    } else {
      startNewCharacter('', dynamicInfo.role);
    }
  };

  // Generate full character profile from brief prompt
  const handleAIGenerateCharacter = async () => {
    if (!aiPrompt.trim()) return;
    setIsAIGenerating(true);
    setAiError(null);

    try {
      const result = await requestAIAssist({
        action: 'develop_character',
        context: {
          novelTitle: novel.title,
          genre: novel.genre,
          instructions: aiPrompt,
          characters: novel.characters.map((c) => ({
            name: c.name,
            role: c.role,
            description: `${c.archetype} - ${c.externalGoal}`,
          })),
        },
      });

      const newChar: Character = {
        id: `char-${Date.now()}`,
        name: aiPrompt.split(/[\s,]+/)[0] || 'شخصية جديدة',
        role: 'supporting',
        age: 'غير محدد',
        archetype: 'مبتكر بالذكاء الاصطناعي',
        externalGoal: 'مبين في التحليل النفسي أدناه',
        internalNeed: 'مبين في التحليل النفسي أدناه',
        fatalFlaw: 'مبين في التحليل النفسي أدناه',
        voiceAndQuirks: 'نبرة مميزة بحسب السياق',
        backstory: result,
        color: '#059669',
      };

      onUpdateCharacters([...novel.characters, newChar]);
      setShowAIPromptModal(false);
      setAiPrompt('');
      setEditingCharacter(newChar);
    } catch (err: any) {
      setAiError(err.message || 'فشل التوليد.');
    } finally {
      setIsAIGenerating(false);
    }
  };

  // Generate character names based on Era, Culture, Genre, Gender, and Vibe
  const handleGenerateNames = async () => {
    setIsGeneratingNames(true);
    setNameGenError(null);

    try {
      const resultStr = await requestAIAssist({
        action: 'generate_character_names',
        context: {
          novelTitle: novel.title,
          genre: nameGenGenre,
          era: nameGenEra,
          culture: nameGenCulture,
          gender: nameGenGender,
          nameVibe: nameGenVibe,
          instructions: nameGenExtra.trim() || undefined,
          characters: novel.characters.map((c) => ({
            name: c.name,
            role: c.role,
          })),
        },
      });

      // Parse JSON array of names
      let parsed: GeneratedCharacterName[] = [];
      try {
        parsed = JSON.parse(resultStr);
      } catch {
        // Fallback regex extraction if model returned wrapped markdown json block
        const match = resultStr.match(/\[[\s\S]*\]/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error('تعذر تنسيق قائمة الأسماء المولدة.');
        }
      }

      setGeneratedNames(parsed);
    } catch (err: any) {
      setNameGenError(err.message || 'حدث خطأ أثناء توليد الأسماء.');
    } finally {
      setIsGeneratingNames(false);
    }
  };

  const handleCopyName = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedName(name);
    setTimeout(() => setCopiedName(null), 2000);
  };

  const handleUseNameForNewCharacter = (item: GeneratedCharacterName) => {
    setShowNameGenModal(false);
    startNewCharacter(item.name, 'supporting', item.suggestedRole);
  };

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto bg-stone-100 dark:bg-stone-950 p-3 sm:p-6 md:p-10 pb-24 md:pb-10 select-none transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-stone-900 font-novel-amiri">
              موسوعة وبنك شخصيات الرواية
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              تطوير الشخصيات، صراعاتها الباطنة، أهدافها، وتوليد الأسماء الذكية الملائمة لحقبة وثقافة الرواية
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* AI Name Generator Trigger Button */}
            <button
              onClick={() => {
                setShowNameGenModal(true);
                if (generatedNames.length === 0) {
                  handleGenerateNames();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-950 text-xs font-medium transition-colors shadow-2xs"
              title="توليد أسماء شخصيات تلائم الحقبة الزمنية والثقافة والتصنيف"
            >
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>مولّد الأسماء (حقبة / ثقافة)</span>
            </button>

            {/* AI Full Character Profile Generator */}
            <button
              onClick={() => setShowAIPromptModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-medium transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>ابتكار أبعاد شخصية بالذكاء الاصطناعي</span>
            </button>

            {/* Dynamic Context-Aware Add Button */}
            <button
              onClick={handleDynamicAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title={dynamicInfo.label}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{dynamicInfo.label}</span>
            </button>
          </div>
        </div>

        {/* View Switcher: Cards vs Relationship Map */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 bg-stone-200/80 p-1 rounded-xl w-fit text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>بطاقات الشخصيات ({novel.characters.length})</span>
            </button>

            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-white text-amber-950 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-amber-600" />
              <span>شبكة وخريطة العلاقات ({novel.relationships?.length || 0})</span>
            </button>
          </div>

          {viewMode === 'cards' && (
            /* Role Filters */
            <div className="flex items-center gap-1 bg-stone-200/70 p-1 rounded-xl w-fit text-xs">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedRole === r.id
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contextual Quick Add Action Card placed directly under active filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 px-4.5 rounded-2xl border border-dashed border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent text-stone-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold font-novel-amiri flex items-center gap-2">
                <span>{dynamicInfo.label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 font-sans font-medium">
                  {viewMode === 'map'
                    ? 'شبكة العلاقات'
                    : roles.find((r) => r.id === selectedRole)?.label}
                </span>
              </h4>
              <p className="text-[11px] text-stone-600 mt-0.5">
                {dynamicInfo.subtext}
              </p>
            </div>
          </div>

          <button
            onClick={handleDynamicAdd}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{dynamicInfo.label}</span>
          </button>
        </div>

        {/* View Mode Rendering: Relationship Map OR Character Cards Grid */}
        {viewMode === 'map' ? (
          <CharacterRelationshipMap
            characters={novel.characters}
            relationships={novel.relationships || []}
            novelTitle={novel.title}
            genre={novel.genre}
            onUpdateRelationships={onUpdateRelationships}
            onSelectCharacter={(char) => {
              setEditingCharacter(char);
              setIsCreatingNew(false);
            }}
            externalOpenAddModalTrigger={addRelTrigger}
          />
        ) : (
          /* Character Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCharacters.length === 0 ? (
              <div className="col-span-full py-16 text-center text-xs text-stone-500 bg-white rounded-2xl border border-stone-200/70 space-y-3">
                <Users className="w-10 h-10 mx-auto opacity-30 text-amber-600" />
                <p className="font-semibold text-sm">
                  لا توجد شخصيات مسجلة ضمن تصنيف (
                  {roles.find((r) => r.id === selectedRole)?.label}) حتى الآن.
                </p>
                <button
                  onClick={handleDynamicAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{dynamicInfo.label}</span>
                </button>
              </div>
            ) : null}
            {filteredCharacters.map((char) => {
              const roleBadge = getRoleBadge(char.role);
              return (
                <div
                  key={char.id}
                  className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top: Color avatar & Name & Role */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-2xs"
                          style={{ backgroundColor: char.color || '#d97706' }}
                        >
                          {char.name ? char.name[0] : '؟'}
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-900 text-base">{char.name || 'دون اسم'}</h3>
                          <p className="text-xs text-stone-600">{char.archetype || 'النمط السردي'}</p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    </div>

                    {char.age && (
                      <div className="text-[11px] text-stone-600 mb-3">
                        <span>العمر التقريبي: </span>
                        <span className="font-medium text-stone-700">{char.age}</span>
                      </div>
                    )}

                    {/* Character Dimensions */}
                    <div className="space-y-2.5 text-xs text-stone-700 my-4 border-t border-b border-stone-100 py-3">
                      {char.externalGoal && (
                        <div className="flex items-start gap-2">
                          <Target className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-stone-900">الهدف الخارجي: </span>
                            <span className="text-stone-600">{char.externalGoal}</span>
                          </div>
                        </div>
                      )}

                      {char.internalNeed && (
                        <div className="flex items-start gap-2">
                          <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-stone-900">الحاجة الداخلية: </span>
                            <span className="text-stone-600">{char.internalNeed}</span>
                          </div>
                        </div>
                      )}

                      {char.fatalFlaw && (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-stone-900">العيب القاتل: </span>
                            <span className="text-stone-600">{char.fatalFlaw}</span>
                          </div>
                        </div>
                      )}

                      {char.voiceAndQuirks && (
                        <div className="flex items-start gap-2">
                          <Mic className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-stone-900">طريقة النطق: </span>
                            <span className="text-stone-600">{char.voiceAndQuirks}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {char.backstory && (
                      <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed mb-4">
                        {char.backstory}
                      </p>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => handleDeleteCharacter(char.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="حذف الشخصية"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingCharacter(char);
                        setIsCreatingNew(false);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل التفاصيل</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Smart Character Names Generator Modal */}
      {showNameGenModal && (
        <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200">
            {/* Header */}
            <div className="p-5 border-b border-stone-100 bg-stone-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900 font-novel-amiri">
                    مولّد أسماء الشخصيات بالذكاء الاصطناعي
                  </h3>
                  <p className="text-xs text-stone-500">
                    توليد أسماء ملهمة ومتقنة مع معانيها وأدوارها بحسب الحقبة والثقافة والتصنيف
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNameGenModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Parameters */}
            <div className="p-5 border-b border-stone-100 bg-white space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Era / Time Period */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    الحقبة الزمنية للرواية
                  </label>
                  <select
                    value={nameGenEra}
                    onChange={(e) => setNameGenEra(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:border-indigo-400"
                  >
                    <option value="الأندلس والعصر الذهبي الإسلامي">الأندلس والعصر الإسلامي الكلاسيكي</option>
                    <option value="العصر العباسي والفاطمي الذهبي">العصر العباسي والفاطمي (بغداد/القاهرة)</option>
                    <option value="العصر الجاهلي وصحراء العرب القديمة">العصر الجاهلي وشبه الجزيرة القديمة</option>
                    <option value="القرن التاسع عشر والنهضة (عصر الباشوات)">القرن الـ 19 وعصر النهضة</option>
                    <option value="العصر الحديث والمعاصر">عالم عربي حديث ومعاصر</option>
                    <option value="فانتزيا وميثولوجيا خيالية عربية">فانتزيا وميثولوجيا أسطورية (ألف ليلة)</option>
                    <option value="تاريخي أوروبي / عالمي (قرون وسطى)">تاريخي أوروبي (قرون وسطى / فيكتوري)</option>
                    <option value="مستقبل وفضاء وخيال علمي">مستقبل وخيال علمي (Sci-Fi)</option>
                  </select>
                </div>

                {/* Culture / Origin */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    الثقافة والبيئة الجغرافية
                  </label>
                  <select
                    value={nameGenCulture}
                    onChange={(e) => setNameGenCulture(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:border-indigo-400"
                  >
                    <option value="عربية أندلسية / مغاربية">عربية أندلسية / مغاربية</option>
                    <option value="عربية شامية ومقدسية">عربية شامية</option>
                    <option value="عربية مصرية نيلية">عربية مصرية</option>
                    <option value="عربية خليجية وبحرية">عربية خليجية وبدوية</option>
                    <option value="عربية عراقية وفراتية">عربية عراقية وفراتية</option>
                    <option value="أمازيغية ونوبية عريقة">أمازيغية / نوبية</option>
                    <option value="فارسية وشرقية إسلامية">فارسية / شرقية</option>
                    <option value="عثمانية وسلجوقية">عثمانية وسلجوقية</option>
                    <option value="عالم متخيل بأسماء إيقاعية">عالم متخيل أصيل</option>
                  </select>
                </div>

                {/* Literary Genre */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    التصنيف الأدبي (Genre)
                  </label>
                  <input
                    type="text"
                    value={nameGenGenre}
                    onChange={(e) => setNameGenGenre(e.target.value)}
                    placeholder="مثال: غموض تاريخي، واقعية سحرية..."
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Gender */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">جنس الشخصيات</label>
                  <select
                    value={nameGenGender}
                    onChange={(e) => setNameGenGender(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:border-indigo-400"
                  >
                    <option value="متنوع (ذكور وإناث)">متنوع (ذكور وإناث)</option>
                    <option value="ذكور فقط">ذكور فقط</option>
                    <option value="إناث فقط">إناث فقط</option>
                  </select>
                </div>

                {/* Vibe / Tone */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">طابع ونبرة الاسم</label>
                  <select
                    value={nameGenVibe}
                    onChange={(e) => setNameGenVibe(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:border-indigo-400"
                  >
                    <option value="نبيل ووقور وذو هيبة (أسر كبرى وحكام)">نبيل ووقور وذو هيبة</option>
                    <option value="غامض ومظلم ومريب (جواسيس، قتلة، أسرار)">غامض ومظلم ومريب</option>
                    <option value="شعبي وبسيط وحميمي (حرفيون، سوقة)">شعبي وبسيط وحميمي</option>
                    <option value="حاد ومحارب وشجاع (فرسان وجنود)">حاد ومحارب وشجاع</option>
                    <option value="شاعري ورقيق وفني (أدباء، فنانون)">شاعري ورقيق ولطيف</option>
                    <option value="حكيم وعالم وفيلسوف (أطباء ونساخ)">حكيم وفيلسوف وعالم</option>
                  </select>
                </div>

                {/* Extra Instructions */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    طلب إضافي محدد (اختياري)
                  </label>
                  <input
                    type="text"
                    value={nameGenExtra}
                    onChange={(e) => setNameGenExtra(e.target.value)}
                    placeholder="مثال: ركز على ألقاب وكنى غريبة..."
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Generate Trigger Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-stone-500">
                  انقر لتوليد باقة جديدة متوافقة مع إعدادات روايتك
                </span>

                <button
                  onClick={handleGenerateNames}
                  disabled={isGeneratingNames}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-xs"
                >
                  {isGeneratingNames ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري التوليد بالذكاء الاصطناعي...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>توليد باقة أسماء جديدة</span>
                    </>
                  )}
                </button>
              </div>

              {nameGenError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">
                  {nameGenError}
                </div>
              )}
            </div>

            {/* Generated Names Grid */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-stone-50/50">
              {isGeneratingNames ? (
                <div className="py-20 text-center text-xs text-stone-500 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                  <p>جاري البحث في بطون المعاجم والتاريخ الأدبي لتوليد أسماء ملهمة ومتقنة...</p>
                </div>
              ) : generatedNames.length === 0 ? (
                <div className="py-16 text-center text-xs text-stone-400">
                  انقر على زر «توليد باقة أسماء جديدة» لبدء اقتراح الأسماء.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {generatedNames.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        {/* Name + Gender & Vibe badge */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold text-base text-stone-900 font-novel-amiri">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
                              {item.gender}
                            </span>
                            {item.vibe && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] text-stone-600 bg-stone-100">
                                {item.vibe}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Meaning / Etymology */}
                        <p className="text-xs text-stone-700 leading-relaxed font-novel-amiri mb-2">
                          <span className="font-semibold text-stone-900">المعنى والدلالة: </span>
                          <span>{item.meaning}</span>
                        </p>

                        {/* Suggested Role */}
                        {item.suggestedRole && (
                          <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              <strong>الدور المقترح:</strong> {item.suggestedRole}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                        <button
                          onClick={() => handleCopyName(item.name)}
                          className="flex items-center gap-1 px-2.5 py-1 text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100 transition-colors"
                          title="نسخ الاسم"
                        >
                          {copiedName === item.name ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedName === item.name ? 'تم النسخ' : 'نسخ'}</span>
                        </button>

                        <button
                          onClick={() => handleUseNameForNewCharacter(item)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-colors shadow-2xs"
                          title="إنشاء ملف شخصية جديد بهذا الاسم فوراً"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>استخدام وإنشاء شخصية</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-stone-100 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
              <span>يمكنك نسخ أي اسم أو النقر على «استخدام وإنشاء شخصية» لبدء كتابة قصتها فوراً.</span>
              <button
                onClick={() => setShowNameGenModal(false)}
                className="px-4 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Character Modal */}
      {editingCharacter && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-base text-stone-900 font-novel-amiri">
                {isCreatingNew ? 'إضافة شخصية جديدة' : 'تعديل ملف الشخصية'}
              </h3>
              <button
                onClick={() => setEditingCharacter(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-900 mb-1">اسم الشخصية *</label>
                  <input
                    type="text"
                    value={editingCharacter.name}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
                    placeholder="مثال: زياد بن طارق"
                    className="w-full p-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-900 mb-1">الدور السردي</label>
                  <select
                    value={editingCharacter.role}
                    onChange={(e) =>
                      setEditingCharacter({
                        ...editingCharacter,
                        role: e.target.value as Character['role'],
                      })
                    }
                    className="w-full p-2.5 bg-white text-gray-900 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
                  >
                    <option value="protagonist" className="text-gray-900 bg-white">بطل الرواية</option>
                    <option value="antagonist" className="text-gray-900 bg-white">الخصم</option>
                    <option value="supporting" className="text-gray-900 bg-white">شخصية مساندة</option>
                    <option value="minor" className="text-gray-900 bg-white">شخصية ثانوية</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-900 mb-1">العمر / المظهر</label>
                  <input
                    type="text"
                    value={editingCharacter.age || ''}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, age: e.target.value })}
                    placeholder="مثال: 24 سنة، عيون حادة، ثياب صوفية"
                    className="w-full p-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-900 mb-1">النمط الأصلي (Archetype)</label>
                  <input
                    type="text"
                    value={editingCharacter.archetype || ''}
                    onChange={(e) =>
                      setEditingCharacter({ ...editingCharacter, archetype: e.target.value })
                    }
                    placeholder="مثال: الباحث عن الحقيقة المغمور"
                    className="w-full p-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  الهدف الخارجي (ماذا يريد في العالم المادي؟)
                </label>
                <input
                  type="text"
                  value={editingCharacter.externalGoal}
                  onChange={(e) =>
                    setEditingCharacter({ ...editingCharacter, externalGoal: e.target.value })
                  }
                  placeholder="مثال: فك شفرة المخطوط وإثبات براءته"
                  className="w-full p-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  الحاجة الداخلية / الجرح القديم (ماذا يحتاج نفسياً؟)
                </label>
                <input
                  type="text"
                  value={editingCharacter.internalNeed}
                  onChange={(e) =>
                    setEditingCharacter({ ...editingCharacter, internalNeed: e.target.value })
                  }
                  placeholder="مثال: إيجاد شجاعته والتغلب على عقدة النقص"
                  className="w-full p-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  نقطة الضعف القاتلة / العيب السري
                </label>
                <input
                  type="text"
                  value={editingCharacter.fatalFlaw}
                  onChange={(e) =>
                    setEditingCharacter({ ...editingCharacter, fatalFlaw: e.target.value })
                  }
                  placeholder="مثال: التردد في اتخاذ القرارات الحاسمة"
                  className="w-full p-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  طريقة الحوار ونبرة الصوت المميزة
                </label>
                <input
                  type="text"
                  value={editingCharacter.voiceAndQuirks}
                  onChange={(e) =>
                    setEditingCharacter({ ...editingCharacter, voiceAndQuirks: e.target.value })
                  }
                  placeholder="مثال: صوت هادئ، يفرك إبهامه عند التوتر، يقتبس أمثالاً شعبية"
                  className="w-full p-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-1">الخلفية والماضي</label>
                <textarea
                  value={editingCharacter.backstory}
                  onChange={(e) =>
                    setEditingCharacter({ ...editingCharacter, backstory: e.target.value })
                  }
                  rows={3}
                  placeholder="قصة نشأته وكيف وصل إلى مجرى أحداث الرواية..."
                  className="w-full p-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-medium leading-relaxed"
                />
              </div>

              {/* Character Linking & Lore Network */}
              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                  <Share2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>شبكة الربط والعلاقات الدرامية (Character Lore & Links)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-800 mb-1">
                      طبيعة العلاقة الرئيسية
                    </label>
                    <select
                      value={editingCharacter.relationshipTypeWithProtagonist || 'friend'}
                      onChange={(e) =>
                        setEditingCharacter({
                          ...editingCharacter,
                          relationshipTypeWithProtagonist: e.target.value as any,
                        })
                      }
                      className="w-full p-2 bg-white text-gray-900 border border-stone-300 rounded-lg text-xs font-medium focus:outline-hidden focus:border-amber-600"
                    >
                      <option value="friend">حليف وصديق مقرب</option>
                      <option value="enemy">غريم وعدو لدود</option>
                      <option value="rival">منافس ندي</option>
                      <option value="mentor">معلم ومرشد حكيم</option>
                      <option value="family">عائلة وقرابة دم</option>
                      <option value="love">عاطفة وحب</option>
                      <option value="secret">سر ولغز غامض</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-800 mb-1">
                      الربط بنقطة تحول في الحبكة
                    </label>
                    <select
                      value={editingCharacter.linkedPlotBeatIds?.[0] || ''}
                      onChange={(e) =>
                        setEditingCharacter({
                          ...editingCharacter,
                          linkedPlotBeatIds: e.target.value ? [e.target.value] : [],
                        })
                      }
                      className="w-full p-2 bg-white text-gray-900 border border-stone-300 rounded-lg text-xs font-medium focus:outline-hidden focus:border-amber-600"
                    >
                      <option value="">بدون ربط بنقطة تحول</option>
                      {novel.plotBeats.map((pb) => (
                        <option key={pb.id} value={pb.id}>
                          {pb.title || pb.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-800 mb-1">
                    الفصول المرتبطة بظهور الشخصية
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white border border-stone-200 rounded-lg">
                    {novel.chapters.map((ch) => {
                      const isLinked = (editingCharacter.linkedChapterIds || []).includes(ch.id);
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => {
                            const current = editingCharacter.linkedChapterIds || [];
                            const updated = isLinked
                              ? current.filter((id) => id !== ch.id)
                              : [...current, ch.id];
                            setEditingCharacter({
                              ...editingCharacter,
                              linkedChapterIds: updated,
                            });
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all cursor-pointer ${
                            isLinked
                              ? 'bg-amber-600 text-white border-amber-600 font-bold'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-amber-500'
                          }`}
                        >
                          {ch.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                onClick={() => setEditingCharacter(null)}
                className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 text-xs font-medium"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleSaveCharacter(editingCharacter)}
                className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium shadow-xs"
              >
                حفظ الشخصية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Full Character Profile Generator Modal */}
      {showAIPromptModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-stone-900">ابتكار أبعاد شخصية بالذكاء الاصطناعي</h3>
              </div>
              <button
                onClick={() => setShowAIPromptModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              صف فكرة الشخصية أو دورها بإيجاز، وسيتولى الذكاء الاصطناعي بناء ملف نفسي متكامل يتضمن
              أهدافها ونقاط ضعفها وصراعها الدرامي.
            </p>

            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              placeholder="مثال: تاجر أدوية متجول يدعي النزاهة ولكنه يبيع السموم سراً للقصر، ولديه ابنة مريضة يبحث عن علاج لها..."
              className="w-full p-3 border border-stone-200 rounded-xl text-xs placeholder:text-stone-400 text-stone-800 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />

            {aiError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">
                {aiError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setShowAIPromptModal(false)}
                className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 text-xs font-medium"
              >
                إلغاء
              </button>
              <button
                onClick={handleAIGenerateCharacter}
                disabled={isAIGenerating || !aiPrompt.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium shadow-xs disabled:opacity-50"
              >
                {isAIGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الابتكار...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>توليد وإضافة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
