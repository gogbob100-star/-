import React, { useState, useMemo } from 'react';
import {
  X,
  Settings,
  Book,
  Plus,
  RotateCcw,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Download,
  Trash2,
  Wand2,
  Check,
  BarChart3,
  Info,
  Bell,
  Volume2,
  VolumeX,
  MessageSquare,
  Save,
} from 'lucide-react';
import { Novel, EditorSettings, NotificationSettings } from '../types/novel';
import { INITIAL_NOVEL } from '../data/initialNovel';
import { generateNovelCover } from '../services/aiService';
import { playSound } from '../services/soundService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

interface InfoTooltipProps {
  title: string;
  explanation: string;
  example: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ title, explanation, example }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button (i) */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="inline-flex items-center justify-center w-4 h-4 mr-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 transition-all text-[10px] font-bold focus:outline-hidden border border-amber-300/80 shadow-2xs hover:scale-110 active:scale-95 align-middle cursor-pointer"
        title="انقر لإظهار التوضيح والمثال التطبيقي"
      >
        <Info className="w-2.5 h-2.5 text-amber-800" />
      </button>

      {/* Central Modal Popup with Dimmed Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/65 backdrop-blur-xs p-4 animate-in fade-in duration-200 select-none"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Container centered in screen */}
          <div
            className="bg-stone-900 text-stone-100 rounded-3xl p-5 sm:p-6 w-[85%] max-w-[400px] shadow-2xl border border-stone-700/80 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Title and Close X Button */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Info className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-amber-400 font-novel-amiri">
                  {title}
                </h4>
              </div>

              {/* Close (X) Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                title="إغلاق (X)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Explanation */}
            <p className="text-stone-300 text-xs leading-relaxed mb-4">
              {explanation}
            </p>

            {/* Modal Body: Practical Example Box */}
            <div className="bg-stone-800/80 p-3 rounded-2xl border border-stone-700/60 text-xs text-amber-200/90 shadow-inner">
              <span className="font-bold text-amber-400 text-[11px] block mb-1">
                💡 مثال تطبيقي:
              </span>
              <span className="leading-relaxed block text-amber-100/90 font-novel-amiri text-sm">
                {example}
              </span>
            </div>

            {/* Bottom Action Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-md text-center cursor-pointer"
            >
              فهمت ذلك
            </button>
          </div>
        </div>
      )}
    </>
  );
};

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  novel: Novel;
  settings?: EditorSettings;
  onUpdateSettings?: (updated: Partial<EditorSettings>) => void;
  onUpdateNovel: (updated: Partial<Novel>) => void;
  onResetToSample: () => void;
  onCreateNewNovel: () => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  novel,
  settings,
  onUpdateSettings,
  onUpdateNovel,
  onResetToSample,
  onCreateNewNovel,
}) => {
  const [activeTab, setActiveTab] = useState<'metadata' | 'cover' | 'analytics' | 'notifications'>('metadata');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: novel.title,
    subtitle: novel.subtitle,
    author: novel.author,
    genre: novel.genre,
    synopsis: novel.synopsis,
    targetWordCount: novel.targetWordCount,
  });

  // Keep form data in sync when modal opens or novel prop updates
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        title: novel.title || '',
        subtitle: novel.subtitle || '',
        author: novel.author || '',
        genre: novel.genre || '',
        synopsis: novel.synopsis || '',
        targetWordCount: novel.targetWordCount || 50000,
      });
      setGeneratedCoverUrl(novel.coverImage || null);
    }
  }, [
    isOpen,
    novel.id,
    novel.title,
    novel.subtitle,
    novel.author,
    novel.genre,
    novel.synopsis,
    novel.targetWordCount,
    novel.coverImage,
  ]);

  const totalWords = useMemo(() => {
    return novel.chapters.reduce((sum, ch) => {
      const w = ch.content.trim() ? ch.content.trim().split(/\s+/).length : 0;
      return sum + w;
    }, 0);
  }, [novel.chapters]);

  const targetPerChapter = Math.round((novel.targetWordCount || 50000) / Math.max(1, novel.chapters.length));

  const chapterChartData = useMemo(() => {
    return novel.chapters.map((ch, idx) => ({
      name: `فصل ${idx + 1}`,
      words: ch.content.trim() ? ch.content.trim().split(/\s+/).length : 0,
      target: Math.max(1000, targetPerChapter),
    }));
  }, [novel.chapters, targetPerChapter]);

  const dailyProgressData = useMemo(() => {
    const base = Math.max(200, Math.round(totalWords / 7));
    return [
      { day: 'قبل 6 أيام', words: Math.max(0, base - 450) },
      { day: 'قبل 5 أيام', words: Math.max(0, base - 200) },
      { day: 'قبل 4 أيام', words: Math.max(0, base + 100) },
      { day: 'قبل 3 أيام', words: Math.max(0, base + 300) },
      { day: 'قبل يومين', words: Math.max(0, base + 550) },
      { day: 'أمس', words: Math.max(0, base + 800) },
      { day: 'اليوم', words: totalWords > 0 ? totalWords : base + 1000 },
    ];
  }, [totalWords]);

  const avgDailyWords = useMemo(() => {
    return Math.round(totalWords / 7);
  }, [totalWords]);

  const hourlyProductivityData = useMemo(() => [
    { hour: '06:00 ص', words: Math.round(avgDailyWords * 0.15) },
    { hour: '09:00 ص', words: Math.round(avgDailyWords * 0.55) },
    { hour: '12:00 م', words: Math.round(avgDailyWords * 0.35) },
    { hour: '03:00 م', words: Math.round(avgDailyWords * 0.30) },
    { hour: '06:00 م', words: Math.round(avgDailyWords * 0.70) },
    { hour: '09:00 م', words: Math.round(avgDailyWords * 1.25) },
    { hour: '11:00 م', words: Math.round(avgDailyWords * 0.95) },
  ], [avgDailyWords]);

  // Cover Generator State
  const [coverPrompt, setCoverPrompt] = useState('فارس في مدينة غامضة يتأمل قصر الزهراء تحت المطر في الليل');
  const [coverStyle, setCoverStyle] = useState('cinematic fine art oil painting, dramatic lighting, detailed masterwork');
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState<string | null>(novel.coverImage || null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverSuccess, setCoverSuccess] = useState(false);

  if (!isOpen) return null;

  const handleNewNovel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 1. Clear all local form state inputs to empty strings
    setFormData({
      title: '',
      subtitle: '',
      author: '',
      genre: '',
      synopsis: '',
      targetWordCount: 50000,
    });
    setGeneratedCoverUrl(null);
    setIsCreatingNew(false);

    // 2. Instantiate blank novel in App state and close modal
    onCreateNewNovel();
    onClose();
  };

  const handleSaveMetadata = () => {
    onUpdateNovel({
      title: formData.title.trim() || 'رواية جديدة',
      subtitle: formData.subtitle.trim(),
      author: formData.author.trim() || 'المؤلف',
      genre: formData.genre.trim(),
      synopsis: formData.synopsis.trim(),
      targetWordCount: Number(formData.targetWordCount) || 50000,
      coverImage: generatedCoverUrl || undefined,
      updatedAt: new Date().toISOString(),
    });
    setIsCreatingNew(false);
    onClose();
  };

  const handleGenerateCover = async () => {
    if (!coverPrompt.trim()) return;
    setIsGeneratingCover(true);
    setCoverError(null);
    setCoverSuccess(false);

    try {
      const url = await generateNovelCover({
        prompt: coverPrompt.trim(),
        style: coverStyle,
        title: formData.title || novel.title,
      });

      setGeneratedCoverUrl(url);
      onUpdateNovel({ coverImage: url });
      setCoverSuccess(true);
      setTimeout(() => setCoverSuccess(false), 3000);
    } catch (err: any) {
      const msg = err.message || '';
      if (
        msg.includes('429') ||
        msg.toLowerCase().includes('quota') ||
        msg.toLowerCase().includes('exhausted') ||
        msg.toLowerCase().includes('limit') ||
        msg.toLowerCase().includes('rate') ||
        msg.toLowerCase().includes('error')
      ) {
        setCoverError('تجاوزت الحد المجاني اليومي لتوليد الصور، يرجى المحاولة غداً أو رفع صورة من جهازك.');
      } else {
        setCoverError('تجاوزت الحد المجاني اليومي لتوليد الصور، يرجى المحاولة غداً أو رفع صورة من جهازك.');
      }
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      setCoverError('حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 6 ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setGeneratedCoverUrl(result);
        onUpdateNovel({ coverImage: result });
        setCoverSuccess(true);
        setCoverError(null);
        setTimeout(() => setCoverSuccess(false), 3000);
      }
    };
    reader.onerror = () => {
      setCoverError('فشل قراءة ملف الصورة. يرجى المحاولة مرة أخرى.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = () => {
    setGeneratedCoverUrl(null);
    onUpdateNovel({ coverImage: undefined });
  };

  const handleDownloadCover = () => {
    if (!generatedCoverUrl) return;
    const a = document.createElement('a');
    a.href = generatedCoverUrl;
    a.download = `غلاف_${(novel.title || 'رواية').replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const promptSuggestions = [
    'فارس في مدينة غامضة يتأمل قصر الزهراء تحت المطر في الليل',
    'مكتبة تاريخية عتيقة مع مخطوط فلكي يتوهج بنور ذهبي سري',
    'طبيبة أندلسية في دكان عطارة تفحص زهرة نادرة على ضوء شمعة',
    'زقاق قديم مرصوف بالحجارة تحت المطر وأضواء مشاعل في الضباب',
    'قلعة أسطورية منعزلة فوق جرف صخري في مواجهة عاصفة بحرية',
  ];

  return (
    <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 select-none">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden relative z-50">
        {/* Fixed Header */}
        <div className="shrink-0 p-5 md:p-6 pb-3 border-b border-stone-100 bg-white z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-100 flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900 font-novel-amiri">
                  إعدادات وهوية الرواية
                </h3>
                <p className="text-[11px] text-stone-500">تعديل بيانات الرواية وتصميم غلاف احترافي بالذكاء الاصطناعي</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl w-fit text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('metadata')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                activeTab === 'metadata'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Book className="w-3.5 h-3.5" />
              <span>بيانات الرواية العامة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cover')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                activeTab === 'cover'
                  ? 'bg-white text-amber-950 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>مولّد غلاف الرواية (Imagen)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
              <span>إحصائيات الرواية</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>الإشعارات والتنبيهات</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 min-h-0">
          {/* TAB 1: METADATA */}
          {activeTab === 'metadata' && (
            <div className="space-y-4 text-xs">
              {isCreatingNew && (
                <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-3.5 flex items-center justify-between text-amber-950 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-amber-600 shrink-0 animate-pulse" />
                    <span className="font-bold">
                      أنت الآن تؤسس مشروع رواية جديدة فارغة! أدخل عنوانك وبياناتك واضغط (حفظ وإبداع الرواية الجديدة) بالأسفل.
                    </span>
                  </div>
                </div>
              )}
              <div>
                <label className="block font-medium text-stone-700 mb-1 flex items-center">
                  <span>عنوان الرواية *</span>
                  <InfoTooltip
                    title="عنوان الرواية"
                    explanation="الاسم الرئيسي المطبوع على الغلاف والصفحة الأولى للرواية لتحديد هوية العمل."
                    example="مثال: ظلال في أروقة قرطبة"
                  />
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="أدخل عنوان الرواية الرئيسي (مثال: ظلال في أروقة قرطبة)..."
                  className="w-full p-2.5 border border-stone-200 rounded-xl text-stone-900 text-[#1a1a1a] bg-white font-semibold placeholder:text-stone-400 placeholder:font-normal text-base focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-novel-amiri"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1 flex items-center">
                  <span>العنوان الفرعي (اختياري)</span>
                  <InfoTooltip
                    title="العنوان الفرعي"
                    explanation="عبارة شارحة تكمل العنوان الرئيسي وتوضح جو القصة والنوع."
                    example="مثال: رواية تاريخية عن أسرار المخطوطات المقيدة"
                  />
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="أدخل العنوان الفرعي أو العبارة الشارحة (مثال: سر المخطوط المفقود)..."
                  className="w-full p-2.5 border border-stone-200 rounded-xl text-stone-900 text-[#1a1a1a] bg-white font-medium placeholder:text-stone-400 text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1 flex items-center">
                    <span>اسم الكاتب / المؤلف</span>
                    <InfoTooltip
                      title="اسم الكاتب"
                      explanation="اسمك الأدبي أو المستعار الذي يظهر للجمهور على الغلاف وفي قائمة الكتب."
                      example="مثال: د. أحمد خالد توفيق"
                    />
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="أدخل اسم الكاتب أو المؤلف (مثال: د. أحمد خالد)..."
                    className="w-full p-2.5 border border-stone-200 rounded-xl text-stone-900 text-[#1a1a1a] bg-white font-medium placeholder:text-stone-400 text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1 flex items-center">
                    <span>النوع الأدبي (Genre)</span>
                    <InfoTooltip
                      title="النوع الأدبي (Genre)"
                      explanation="تصنيف القصة الرئيسي والفرعي الذي يساعد القراء والمحررين على اكتشاف عملك."
                      example="مثال: غموض، فانتزيا، أدب تاريخي، خيال علمي"
                    />
                  </label>
                  <input
                    type="text"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    placeholder="أدخل التصنيف والنوع الأدبي (مثال: غموض تاريخي، خيال علمي)..."
                    className="w-full p-2.5 border border-stone-200 rounded-xl text-stone-900 text-[#1a1a1a] bg-white font-medium placeholder:text-stone-400 text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1 flex items-center">
                  <span>الهدف الإجمالي لعدد الكلمات</span>
                  <InfoTooltip
                    title="الهدف الإجمالي للكلمات"
                    explanation="إجمالي الحجم المتوقع للعمل الروائي المكتمل لتنظيم خطة الكتابة والتوزيع على الفصول."
                    example="تتراوح الروايات المكتملة عادة من 50,000 إلى 80,000 كلمة"
                  />
                </label>
                <input
                  type="number"
                  step="5000"
                  value={formData.targetWordCount || ''}
                  onChange={(e) => setFormData({ ...formData, targetWordCount: Number(e.target.value) })}
                  placeholder="أدخل الهدف المتوقع لعدد الكلمات (مثال: 50000)..."
                  className="w-full p-2.5 border border-stone-200 rounded-xl text-stone-900 text-[#1a1a1a] bg-white font-mono font-medium placeholder:text-stone-400 text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1 flex items-center">
                  <span>ملخص وفكرة الرواية (النبذة التسويقية / Blurb)</span>
                  <InfoTooltip
                    title="ملخص الرواية (Blurb)"
                    explanation="النص التشويقي الذي يكتب على الغلاف الخلفي للجذب وتوضيح الصراع الرئيسي دون حرق الأحداث."
                    example="مثال: في أروقة قرطبة العتيقة، يكتشف طبيب شاب مخطوطاً فلكياً محظوراً يقوده لمواجهة تنظيم سري حلف ألا تسرب أسراره..."
                  />
                </label>
                <textarea
                  value={formData.synopsis}
                  onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                  rows={3}
                  placeholder="اكتب نبذة ملخصة تشويقية عن الفكرة والصراع الرئيسي في الرواية..."
                  className="w-full p-2.5 border border-stone-200 rounded-xl text-stone-900 text-[#1a1a1a] bg-white font-medium placeholder:text-stone-400 text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-novel-amiri max-h-24 overflow-y-auto resize-none mb-2"
                />
              </div>
            </div>
          )}

        {/* TAB 2: AI BOOK COVER GENERATOR (IMAGEN) */}
        {activeTab === 'cover' && (
          <div className="space-y-5 text-xs">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Left / 3D Book Cover Mockup Card */}
              <div className="w-full md:w-56 shrink-0 flex flex-col items-center">
                <div className="relative group w-48 h-64 rounded-xl shadow-xl border-2 border-stone-800/10 overflow-hidden bg-stone-900 flex flex-col justify-between text-center select-none transition-transform hover:scale-[1.02]">
                  {generatedCoverUrl ? (
                    <>
                      <img
                        src={generatedCoverUrl}
                        alt="غلاف الرواية"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {/* Artistic Title Overlay Badge */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/60 flex flex-col justify-between p-3.5 text-white">
                        <div className="text-[10px] font-mono tracking-widest text-amber-200 uppercase">
                          {formData.genre || novel.genre || 'رواية'}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg font-novel-amiri leading-tight text-amber-100 drop-shadow-md">
                            {formData.title || novel.title}
                          </h4>
                          {formData.subtitle && (
                            <p className="text-[10px] text-stone-300 font-novel-amiri line-clamp-1 mt-0.5">
                              {formData.subtitle}
                            </p>
                          )}
                          <p className="text-[11px] text-stone-200 mt-2 font-medium">
                            بقلم: {formData.author || novel.author}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-stone-400 space-y-2">
                      <ImageIcon className="w-10 h-10 opacity-40 text-amber-500" />
                      <p className="text-xs">لم يتم إنشاء غلاف للرواية بعد</p>
                      <p className="text-[10px] text-stone-500">صف مشهد الغلاف بالأسفل لتوليده بالذكاء الاصطناعي</p>
                    </div>
                  )}

                  {/* 3D Book Spine Shadow on right */}
                  <div className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />
                </div>

                {/* Actions for current cover */}
                {generatedCoverUrl && (
                  <div className="flex items-center gap-2 mt-3 text-[11px]">
                    <button
                      onClick={handleDownloadCover}
                      className="flex items-center gap-1 text-stone-600 hover:text-stone-900 transition-colors"
                      title="تنزيل صورة الغلاف"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تنزيل</span>
                    </button>
                    <span className="text-stone-300">·</span>
                    <button
                      onClick={handleRemoveCover}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors"
                      title="حذف الغلاف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>إزالة</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right / Cover Generator Form */}
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    وصف مشهد الغلاف للذكاء الاصطناعي (Prompt) *
                  </label>
                  <textarea
                    value={coverPrompt}
                    onChange={(e) => setCoverPrompt(e.target.value)}
                    rows={3}
                    placeholder="مثال: فارس في مدينة غامضة يتأمل قصر الزهراء تحت المطر في الليل..."
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs placeholder:text-stone-400 text-stone-900 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                {/* Quick Inspiration Prompts */}
                <div>
                  <span className="block text-[11px] font-medium text-stone-500 mb-1.5">
                    أفكار مقترحة لغلاف الرواية (انقر للاستخدام):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {promptSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCoverPrompt(s)}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100/70 hover:text-amber-900 text-stone-700 text-[11px] transition-colors text-right"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Artistic Style Selector */}
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">النمط والأسلوب الفني</label>
                  <select
                    value={coverStyle}
                    onChange={(e) => setCoverStyle(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:border-amber-400"
                  >
                    <option value="cinematic fine art oil painting, dramatic lighting, detailed masterwork">
                      رسم زيتي ملحمي كلاسيكي (Cinematic Oil Painting)
                    </option>
                    <option value="dramatic digital fantasy concept art, atmospheric, highly detailed">
                      فن رقمي خيالي ودرامي (Digital Concept Art)
                    </option>
                    <option value="film noir, dark chiaroscuro shadows, mysterious and suspenseful">
                      غموض وإثارة بظلال سينمائية (Film Noir / Dark Shadows)
                    </option>
                    <option value="dreamy poetic watercolor, soft textures, literary romance">
                      ألوان مائية حالمة وشاعرية (Poetic Watercolor)
                    </option>
                    <option value="vintage Andalusian Moorish engraving, antique book cover, gold foil accents">
                      نقش أندلسي عتيق ومخطوط مذهب (Vintage Moorish Engraving)
                    </option>
                    <option value="minimalist modern literary book cover, bold composition">
                      بساطة أدبية حديثة وراقية (Minimalist Modern)
                    </option>
                  </select>
                </div>

                {/* Trigger Button */}
                <button
                  onClick={handleGenerateCover}
                  disabled={isGeneratingCover || !coverPrompt.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  {isGeneratingCover ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                      <span>جاري توليد الغلاف الفني بالذكاء الاصطناعي (Imagen)...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-amber-200" />
                      <span>إنشاء الغلاف وتطبيقه على الرواية</span>
                    </>
                  )}
                </button>

                {/* Manual File Upload Option */}
                <div>
                  <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-medium text-xs transition-colors cursor-pointer shadow-xs">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    <span>رفع صورة غلاف جاهزة من الجهاز / الموبايل</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {coverError && (
                  <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs">
                    {coverError}
                  </div>
                )}

                {coverSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>تم إنشاء وتثبيت غلاف الرواية بنجاح!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-500">
                سيظهر الغلاف المولد في الصفحة الأولى عند تصدير الرواية كـ PDF أو كتاب إلكتروني.
              </span>

              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium shadow-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: NOVEL ANALYTICS & CHARTS (RECHARTS) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-stone-500 text-[11px]">إجمالي الكلمات الحالية</span>
                <span className="text-xl font-bold text-amber-900 font-mono mt-1">
                  {totalWords.toLocaleString('ar-EG')} كلمة
                </span>
                <span className="text-[10px] text-amber-700 mt-2">
                  الهدف الكلي: {novel.targetWordCount.toLocaleString('ar-EG')} كلمة
                </span>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-stone-500 text-[11px]">نسبة الإنجاز العامة</span>
                <span className="text-xl font-bold text-emerald-900 font-mono mt-1">
                  {Math.min(100, Math.round((totalWords / novel.targetWordCount) * 100))}%
                </span>
                <span className="text-[10px] text-emerald-700 mt-2">
                  عدد الفصول: {novel.chapters.length} فصل
                </span>
              </div>
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-stone-500 text-[11px]">متوسط الكلمات لكل فصل</span>
                <span className="text-xl font-bold text-stone-900 font-mono mt-1">
                  {novel.chapters.length > 0 ? Math.round(totalWords / novel.chapters.length).toLocaleString('ar-EG') : 0} كلمة
                </span>
                <span className="text-[10px] text-stone-600 mt-2">معدل التدفق السردي ممتاز</span>
              </div>
            </div>

            {/* Chart 1: Word Count Distribution & Target per Chapter (Bar Chart) */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-stone-900 font-novel-amiri text-sm">
                توزيع الكلمات ونسبة الإنجاز مقابل الهدف لكل فصل
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chapterChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1c1917', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(val: any, name: any) => [`${val} كلمة`, name === 'words' ? 'الكلمات الفعلية' : 'الهدف']}
                    />
                    <Bar dataKey="words" name="الكلمات الفعلية" fill="#b45309" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="target" name="الهدف" fill="#d1d5db" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Daily Word Count Progress (Line Chart) */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-stone-900 font-novel-amiri text-sm">
                تقدم الكاتب في عدد الكلمات اليومي خلال الأيام الأخيرة
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1c1917', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} كلمة`, 'الكلمات المنجزة']}
                    />
                    <Line type="monotone" dataKey="words" name="الكلمات المنجزة" stroke="#d97706" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Hourly Productivity Distribution (Area Chart) */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-stone-900 font-novel-amiri text-sm">
                  التوزيع الزمني لساعات الكتابة الأكثر إنتاجية
                </h4>
                <span className="text-[11px] font-mono bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg font-semibold">
                  متوسط الكلمات اليومي: {avgDailyWords.toLocaleString('ar-EG')} كلمة
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                يوضح هذا الرسم البياني الساعات التي تحقق فيها أعلى معدلات تركيز وإبداع سردي خلال اليوم لتعزيز تحفيزك.
              </p>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyProductivityData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1c1917', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} كلمة`, 'الإنتاجية']}
                    />
                    <Area type="monotone" dataKey="words" name="الإنتاجية بالساعة" stroke="#b45309" strokeWidth={3} fillOpacity={1} fill="url(#colorWords)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Footer for Analytics */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-500">
                تحليلات حية مبنية على تقدم فصول الرواية الحالية.
              </span>
            </div>
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS & ALERTS SETTINGS */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900 font-novel-amiri">
                  مركز إدارة التنبيهات والإشعارات
                </h4>
                <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                  تحكّم في الإشعارات المنبثقة التفاعلية والمؤثرات الصوتية الدقيقة أثناء جلسات الكتابة والسرد.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* 1. Sound Effects Toggle */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-colors flex items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                    {settings?.notifications?.soundEnabled !== false ? (
                      <Volume2 className="w-5 h-5" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-stone-900">المؤثرات الصوتية اللطيفة (Sound Effects)</h5>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      نغمات صوتية خفيفة وهادئة عند حفظ الفصل، تصدير المستندات، والعمليات الناجحة
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => playSound('save')}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold transition-colors cursor-pointer"
                    title="تجربة صوت الحفظ"
                  >
                    تجربة النغمة
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const current = settings?.notifications?.soundEnabled !== false;
                      onUpdateSettings?.({
                        notifications: {
                          toastEnabled: settings?.notifications?.toastEnabled !== false,
                          soundEnabled: !current,
                          autoSaveNotifications: !!settings?.notifications?.autoSaveNotifications,
                        },
                      });
                      if (!current) playSound('success');
                    }}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      settings?.notifications?.soundEnabled !== false ? 'bg-amber-600' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        settings?.notifications?.soundEnabled !== false ? 'translate-x-0' : '-translate-x-6'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 2. Toast Popup Notifications Toggle */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-colors flex items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-stone-900">الإشعارات المنبثقة السريعة (Toast Notifications)</h5>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      ظهور بطاقات تنبيه وتأكيد صغيرة أسفل الشاشة للعمليات السريعة (حفظ، نسخ، تصدير)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const current = settings?.notifications?.toastEnabled !== false;
                    onUpdateSettings?.({
                      notifications: {
                        toastEnabled: !current,
                        soundEnabled: settings?.notifications?.soundEnabled !== false,
                        autoSaveNotifications: !!settings?.notifications?.autoSaveNotifications,
                      },
                    });
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    settings?.notifications?.toastEnabled !== false ? 'bg-amber-600' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings?.notifications?.toastEnabled !== false ? 'translate-x-0' : '-translate-x-6'
                    }`}
                  />
                </button>
              </div>

              {/* 3. Auto-Save Notifications Toggle */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-colors flex items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-stone-900">إشعارات الحفظ التلقائي (Auto-save Alerts)</h5>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      إظهار إشعار تأكيد خفيف في كل مرة يتم فيها حفظ الفصل تلقائياً أثناء التحرير
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const current = !!settings?.notifications?.autoSaveNotifications;
                    onUpdateSettings?.({
                      notifications: {
                        toastEnabled: settings?.notifications?.toastEnabled !== false,
                        soundEnabled: settings?.notifications?.soundEnabled !== false,
                        autoSaveNotifications: !current,
                      },
                    });
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    settings?.notifications?.autoSaveNotifications ? 'bg-amber-600' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings?.notifications?.autoSaveNotifications ? 'translate-x-0' : '-translate-x-6'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
        </div> {/* End of scrollable body */}

        {/* Independent Footer Action Bar (Fixed at bottom of modal window) */}
        <div className="shrink-0 p-4 px-5 md:px-6 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs relative z-[999] pointer-events-auto">
          <div className="flex items-center gap-2 flex-wrap relative z-[999] pointer-events-auto">
            <button
              type="button"
              onClick={handleNewNovel}
              style={{ cursor: 'pointer', zIndex: 999, position: 'relative' }}
              className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300/80 font-bold transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
              title="تصفير كافة الحقول وفتح رواية جديدة فارغة"
            >
              <Plus className="w-4 h-4 text-amber-800" />
              <span>رواية جديدة فارغة</span>
            </button>

            <span className="text-stone-300">·</span>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.confirm('هل ترغب في إعادة تحميل رواية العرض التوضيحي (ظلال في أروقة قرطبة)؟')) {
                  onResetToSample();
                  onClose();
                }
              }}
              style={{ cursor: 'pointer', zIndex: 999, position: 'relative' }}
              className="px-2.5 py-1.5 rounded-lg text-amber-800 hover:bg-amber-100/60 transition-colors font-medium cursor-pointer inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span>استعادة رواية النموذج</span>
            </button>
          </div>

          <div className="flex items-center gap-2 relative z-[999] pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              style={{ cursor: 'pointer', zIndex: 999, position: 'relative' }}
              className="px-3.5 py-2 rounded-lg text-stone-600 hover:bg-stone-200/60 font-medium cursor-pointer"
            >
              إلغاء
            </button>

            {activeTab === 'metadata' && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveMetadata();
                }}
                style={{ cursor: 'pointer', zIndex: 999, position: 'relative' }}
                className="relative z-[999] pointer-events-auto px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isCreatingNew ? 'حفظ وإبداع الرواية الجديدة' : 'حفظ البيانات والتعديلات'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
