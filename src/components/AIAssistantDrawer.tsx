import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Copy,
  Check,
  PlusCircle,
  HelpCircle,
  Flame,
  MessageSquare,
  Eye,
  ShieldAlert,
  Compass,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Novel, Chapter } from '../types/novel';
import { requestAIAssist } from '../services/aiService';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  novel: Novel;
  currentChapter: Chapter;
  onInsertText: (text: string) => void;
}

type AssistMode =
  | 'continue_scene'
  | 'brainstorm_ideas'
  | 'generate_dialogue'
  | 'enhance_prose'
  | 'critique_chapter'
  | 'develop_character'
  | 'custom_prompt';

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  novel,
  currentChapter,
  onInsertText,
}) => {
  const [mode, setMode] = useState<AssistMode>('continue_scene');
  const [tone, setTone] = useState('أدبي عميق ومؤثر');
  const [pov, setPov] = useState('راوٍ عليم (ضمير الغائب)');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setRetryStatus(null);
    try {
      const output = await requestAIAssist(
        {
          action: mode,
          context: {
            novelTitle: novel.title,
            genre: novel.genre,
            summary: novel.synopsis,
            chapterTitle: currentChapter.title,
            chapterContent: currentChapter.content,
            characters: novel.characters.map((c) => ({
              name: c.name,
              role: c.role,
              description: `${c.archetype}. الهدف: ${c.externalGoal}. نقطة الضعف: ${c.fatalFlaw}`,
            })),
            tone,
            pov,
            instructions: customPrompt.trim() || undefined,
          },
        },
        {
          maxRetries: 3,
          onRetry: (attempt, maxRetries, msg) => {
            setRetryStatus(`${msg} (المحاولة ${attempt} من ${maxRetries})`);
          },
        }
      );

      setResult(output);
    } catch (err: any) {
      setError(
        err.message ||
          'الخادم مشغول حالياً بسبب ضغط الطلبات، يرجى المحاولة بعد لحظات.'
      );
    } finally {
      setIsLoading(false);
      setRetryStatus(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!result.trim()) return;
    onInsertText(result.trim());
    onClose();
  };

  const modesList = [
    {
      id: 'continue_scene' as AssistMode,
      label: 'إكمال المشهد',
      icon: Sparkles,
      desc: 'استكمال السرد من آخر فكرة بتناغم تام',
    },
    {
      id: 'generate_dialogue' as AssistMode,
      label: 'حوار مشحون',
      icon: MessageSquare,
      desc: 'صياغة حوار ذكي بمشاعر ولغة جسد باطنة',
    },
    {
      id: 'enhance_prose' as AssistMode,
      label: 'إثراء حسي وأدبي',
      icon: Eye,
      desc: 'تحسين الوصف بتقنية (Show, Don\'t Tell)',
    },
    {
      id: 'brainstorm_ideas' as AssistMode,
      label: 'عصف للحبكة والمفاجآت',
      icon: Flame,
      desc: 'اقتراح انعطافات درامية وأزمات مفاجئة',
    },
    {
      id: 'critique_chapter' as AssistMode,
      label: 'مراجعة المحرر الأدبي',
      icon: ShieldAlert,
      desc: 'تحليل دقيق للإيقاع والتوتر وتماسك الفصل',
    },
    {
      id: 'develop_character' as AssistMode,
      label: 'تطوير شخصية',
      icon: Compass,
      desc: 'بناء أبعاد نفسية وجروح ودوافع خفية',
    },
    {
      id: 'custom_prompt' as AssistMode,
      label: 'استشارة حرة',
      icon: HelpCircle,
      desc: 'اسأل المستشار الروائي أي سؤال تريده',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="md:hidden fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      <aside className="fixed md:static inset-y-0 left-0 z-50 md:z-20 w-full sm:w-96 max-w-full h-full md:h-[calc(100vh-4rem)] border-r border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex flex-col shrink-0 select-none overflow-hidden shadow-2xl md:shadow-lg transition-transform">
        {/* Header */}
        <div className="p-3.5 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-stone-900 dark:text-stone-100">المساعد الروائي الذكي</h3>
              <p className="text-[11px] text-stone-500">رفيقك الإبداعي في السرد والحبكة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Mode Selector Tabs */}
        <div>
          <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-2">
            نوع المساعدة السردية
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {modesList.map((m) => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`p-2 rounded-lg border text-right transition-all flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400/80 dark:border-amber-600 text-amber-950 dark:text-amber-200 ring-1 ring-amber-400/30'
                      : 'bg-white dark:bg-stone-800 border-stone-200/80 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium text-xs">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-700 dark:text-amber-400' : 'text-stone-400'}`} />
                    <span>{m.label}</span>
                  </div>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-1">{m.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Narrative Parameters */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/70 dark:border-stone-700 text-xs">
          <div>
            <label className="block text-[10px] font-medium text-stone-500 dark:text-stone-400 mb-1">النبرة والأسلوب</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-md p-1.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-hidden focus:border-stone-400"
            >
              <option value="أدبي عميق ومؤثر">أدبي عميق ومؤثر</option>
              <option value="تشويق وغموض وتوتر عالي">تشويق وغموض</option>
              <option value="شاعري ورومانسي رقيق">شاعري ورقيق</option>
              <option value="فلسفي وتأملي">فلسفي وتأملي</option>
              <option value="تاريخي كلاسيكي رصين">تاريخي كلاسيكي</option>
              <option value="واقعي وحاد">واقعي وحاد</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-stone-500 dark:text-stone-400 mb-1">زاوية السرد (POV)</label>
            <select
              value={pov}
              onChange={(e) => setPov(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-md p-1.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-hidden focus:border-stone-400"
            >
              <option value="راوٍ عليم (ضمير الغائب)">راوٍ عليم (الغائب)</option>
              <option value="ضمير المتكلم (أنا)">ضمير المتكلم (أنا)</option>
              <option value="الغائب المحدود (وجهة نظر بطل واحد)">الغائب المحدود</option>
            </select>
          </div>
        </div>

        {/* Custom Prompt or Context Instruction */}
        <div>
          <label className="block text-[11px] font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            {mode === 'custom_prompt'
              ? 'سؤالك أو طلبك للمستشار الروائي'
              : 'توجيه إضافي خاص (اختياري)'}
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            placeholder={
              mode === 'continue_scene'
                ? 'مثال: ركز على اكتشاف زياد لرائحة السم، واجعل المشهد ينتهي بقرع عنيف على الباب...'
                : mode === 'generate_dialogue'
                  ? 'مثال: حوار بين زياد ومريم مشحون بالشك والرهبة...'
                  : mode === 'enhance_prose'
                    ? 'مثال: أضف تفاصيل بصرية عن المطر المنهمر ورائحة الورق القديم...'
                    : 'اكتب توجيهاتك المحددة...'
            }
            className="w-full p-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs placeholder:text-stone-400 dark:placeholder:text-stone-500 text-stone-900 dark:text-white focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          />
        </div>

        {/* Dynamic Retry Notice while retrying */}
        {retryStatus && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs flex items-center gap-2.5 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold">{retryStatus}</span>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
              <span>
                {retryStatus ? retryStatus : 'جاري الصياغة الأدبية بالذكاء الاصطناعي...'}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>توليد المقترح الأدبي</span>
            </>
          )}
        </button>

        {/* Friendly Error Message with Retry Action */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium leading-relaxed">{error}</p>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة المحاولة الآن</span>
              </button>
            </div>
          </div>
        )}

        {/* AI Output Result Box */}
        {result && (
          <div className="p-3.5 bg-white dark:bg-stone-800 rounded-xl border border-stone-200/90 dark:border-stone-700 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-700 pb-2">
              <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">المقترح السردي المُولَّد</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  title="نسخ النص"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                </button>
                <button
                  onClick={handleInsert}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  title="إدراج النص في نهاية الفصل الحالي"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>إدراج في الفصل</span>
                </button>
              </div>
            </div>

            <div className="text-xs leading-relaxed font-novel-amiri text-stone-900 dark:text-stone-100 whitespace-pre-wrap max-h-72 overflow-y-auto p-1 text-justify">
              {result}
            </div>
          </div>
        )}
      </div>
    </aside>
  </>
  );
};
