import React, { useState } from 'react';
import { Lightbulb, Sparkles, RefreshCw, X, ArrowLeft, BookOpen } from 'lucide-react';

interface CreativePromptWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertPrompt: (promptText: string) => void;
  isDarkMode: boolean;
}

const PROMPTS = [
  {
    title: 'سر الصندوق المنسي',
    prompt: 'يجد البطل في علية منزل جده صندوقاً خشبياً مغلقاً بإحكام، وعند فتحه يجد رسالة مؤرخة بخط يده هو شخصياً، لكنه لا يتذكر كتابتها أبداً.',
  },
  {
    title: 'صمت المدينة المفاجئ',
    prompt: 'في تمام الساعة الثالثة فجراً، تنطفئ جميع الأضواء في المدينة ويتوقف كل صوت بشري وآلي تماماً لمدة 10 دقائق كاملة، باستثناء صوت دقات قلب البطل.',
  },
  {
    title: 'اللقاء على رصيف المطر',
    prompt: 'يجلس شخصان على مقعد حديقة تحت المطر الغزير، كلاهما ينتظر شخصاً غاب لسنوات، ليكتشفا تدريجياً أنهما ينتظران نفس الشخص.',
  },
  {
    title: 'الكلمة الأخيرة',
    prompt: 'عالم يكتشف تقنية لقراءة آخر كلمة نطقها أي شخص قبل وفاته، وعندما يجربها على شخصية عزيزة، تتغير قناعته بالكامل.',
  },
  {
    title: 'مفترق الطرق في الصحراء',
    prompt: 'سيارة تعطلت في منتصف طريق صحراوي مقفر، ويظهر طفل صغير يسأل البطل سؤالاً غريباً وغير متوقع بالمرة.',
  },
  {
    title: 'اللوحة التي تتغير',
    prompt: 'لوحة زيتية معلقة في صالون العائلة يلاحظ الرسام أن تفاصيل خلفيتها تتغير كل ليلة تدريجياً لتعكس جريمة غامضة.',
  },
];

export const CreativePromptWidget: React.FC<CreativePromptWidgetProps> = ({
  isOpen,
  onClose,
  onInsertPrompt,
  isDarkMode,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  if (!isOpen) return null;

  const current = PROMPTS[currentIndex];

  const handleShuffle = () => {
    let next = Math.floor(Math.random() * PROMPTS.length);
    if (next === currentIndex) {
      next = (currentIndex + 1) % PROMPTS.length;
    }
    setCurrentIndex(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl border p-6 flex flex-col relative ${
          isDarkMode
            ? 'bg-stone-900 border-stone-800 text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
        dir="rtl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-stone-500/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm font-novel-amiri">
              تلميح إبداعي لتجاوز قفلة الكاتب (Writer's Block)
            </h3>
            <p className="text-[11px] opacity-60">
              أفكار وحبكات سريعة تطلق العنان لخيالك السردي
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-inherit bg-stone-500/5 mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>{current.title}</span>
            <span className="text-[10px] font-mono opacity-50">
              #{currentIndex + 1} من {PROMPTS.length}
            </span>
          </div>
          <p className="font-novel-amiri text-sm leading-relaxed opacity-90 text-justify">
            "{current.prompt}"
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-inherit text-xs font-medium opacity-80 hover:opacity-100 hover:bg-stone-500/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تلميح آخر</span>
          </button>

          <button
            onClick={() => {
              onInsertPrompt(`\n\n[إلهام سردي / تلميح إبداعي]: ${current.prompt}\n\n`);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>استخدام هذا التلميح في الفصل</span>
          </button>
        </div>
      </div>
    </div>
  );
};
