import React from 'react';
import { X, Sparkles, FileText, Zap, MessageSquare, Compass, Flame } from 'lucide-react';

interface ChapterTemplate {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  content: string;
  act: string;
}

interface ChapterTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: { title: string; content: string; act: string }) => void;
}

export const CHAPTER_TEMPLATES: ChapterTemplate[] = [
  {
    id: 'blank',
    title: 'فصل فارغ قياسي',
    icon: <FileText className="w-4 h-4 text-stone-600" />,
    description: 'فصل جديد بنية نظيفة جاهز لكتابة السرد الحر.',
    content: '',
    act: 'الجزء الأول',
  },
  {
    id: 'twist',
    title: 'فصل حدث مفاجئ (Plot Twist)',
    icon: <Zap className="w-4 h-4 text-amber-600" />,
    description: 'هيكل سردي مصمم خصيصاً لمفاجأة القارئ وانقلاب مجرى الأحداث.',
    content: `# [عنوان حدث مفاجئ]\n\n**هيكل الفصل (Outline المقترح):**\n1. الهدوء الذي يسبق العاصفة (تهيئة الأجواء وبناء التوقعات الطبيعية).\n2. المؤشر أو التلميح الخفي (ظهور تفاصيل غير مألوفة تدل على تغير قادم).\n3. الصدمة / الحدث المفاجئ (انقلاب الأحداث وانكشاف الحقيقة في اللحظة الحاسمة).\n4. تداعيات الصدمة، رد فعل الشخصيات، والتساؤلات المفتوحة للمشهد التالي.\n\n---`,
    act: 'العقدة والأحداث المتصاعدة',
  },
  {
    id: 'dialogue',
    title: 'فصل حوار مكثف (Intense Dialogue)',
    icon: <MessageSquare className="w-4 h-4 text-blue-600" />,
    description: 'يركز على الصراع اللفظي، كشف الأسرار، وتبادل الحجج بين الشخصيات.',
    content: `# [عنوان مشهد الحوار]\n\n**هيكل الفصل (Outline المقترح):**\n1. نقطة الخلاف أو التوتر الأساسية التي تجمع الشخصيات.\n2. تبادل الحجج، المناورات الكلامية، والصراعات الخفية والعلنية (التصعيد الدرامي).\n3. الكشف عن سر أو معلومة جوهرية غير متوقعة عبر الكلمات.\n4. ذروة الحوار ونقطة التحول الحاسمة في العلاقة بين أطراف النزاع.\n\n---`,
    act: 'الصراع وتطوير الشخصيات',
  },
  {
    id: 'environment',
    title: 'فصل وصف بيئة وأجواء (Atmosphere)',
    icon: <Compass className="w-4 h-4 text-emerald-600" />,
    description: 'يغوص في وصف تفاصيل المكان، الأجواء النفسية، والعمق البصري.',
    content: `# [عنوان المكان / البيئة]\n\n**هيكل الفصل (Outline المقترح):**\n1. اللمحة البصرية الأولى والانطباع العام للمكان والزمان.\n2. التفاصيل الدقيقة (الأصوات، الروائح، الإضاءة، وحركة العناصر المحيطة).\n3. انعكاس البيئة على الحالة النفسية والذاكرة الخاصة للشخصية الرئيسية.\n4. حدث عابر يربط المكان بالحبكة الرئيسية ويدفع السرد للأمام.\n\n---`,
    act: 'التمهيد والوصف البصري',
  },
  {
    id: 'climax',
    title: 'فصل ذروة درامية (Climax)',
    icon: <Flame className="w-4 h-4 text-red-600" />,
    description: 'ذروة الصراع الدرامي للمتن الروائي ومواجهة المصير.',
    content: `# [عنوان الذروة الدرامية]\n\n**هيكل الفصل (Outline المقترح):**\n1. المواجهة الحاسمة الكبرى أو الوصول للهدف المنشود بعد عناء.\n2. الذروة القصوى للصراع (نقطة اللاعودة والخيارات الصعبة).\n3. التضحية، القرار المصيري، أو دفع الثمن الباهظ.\n4. النتيجة المباشرة وسقوط الستار ممهداً الطريق لفصل الخاتمة أو التداعيات.\n\n---`,
    act: 'ذروة الصراع (Climax)',
  },
];

export const ChapterTemplatesModal: React.FC<ChapterTemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 font-novel-amiri">
                مكتبة قوالب فصول الرواية
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">اختر قالب الفصل المناسب لهيكلك السردي لتبدأ الكتابة فوراً</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {CHAPTER_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => {
                onSelectTemplate({
                  title: tmpl.id === 'blank' ? `الفصل الجديد` : tmpl.title.split(' ')[1] || 'فصل جديد',
                  content: tmpl.content,
                  act: tmpl.act,
                });
                onClose();
              }}
              className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-700/50 transition-all cursor-pointer flex items-start gap-3.5 group"
            >
              <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                {tmpl.icon}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm font-novel-amiri group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
                    {tmpl.title}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-200/60 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                    {tmpl.act}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 text-xs font-medium transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
