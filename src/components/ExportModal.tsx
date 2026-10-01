import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  FileText,
  FileCode,
  Book,
  Download,
  Upload,
  Check,
  Loader2,
} from 'lucide-react';
import { Novel, Chapter } from '../types/novel';
import {
  exportChapterToPdf,
  exportChapterToWord,
  exportChapterToTxt,
  exportChapterToEpubHtml,
  exportChapterToMarkdown,
  exportToJson,
  sanitizeFilename,
} from '../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  novel: Novel;
  currentChapter?: Chapter;
  onImportNovel: (imported: Novel) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  novel,
  currentChapter,
  onImportNovel,
}) => {
  // Default to the currently active chapter in the editor
  const [selectedChapterId, setSelectedChapterId] = useState<string>(() => {
    return currentChapter?.id || novel.chapters[0]?.id || '';
  });

  const [pdfPageSize, setPdfPageSize] = useState<'A4' | 'A5' | '6x9'>('A4');
  const [pdfFont, setPdfFont] = useState<'amiri' | 'scheherazade' | 'cairo'>('amiri');
  const [pdfFontSize, setPdfFontSize] = useState<number>(12);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Active targeted chapter object
  const activeChapter =
    novel.chapters.find((ch) => ch.id === selectedChapterId) ||
    currentChapter ||
    novel.chapters[0];

  const wordsCount = activeChapter?.content?.trim()
    ? activeChapter.content.trim().split(/\s+/).length
    : 0;

  const cleanName = sanitizeFilename(activeChapter?.title || 'فصل');

  const triggerToast = (msg: string) => {
    setDownloadSuccessMessage(msg);
    setTimeout(() => {
      setDownloadSuccessMessage(null);
    }, 3200);
  };

  const handleExportPdf = async () => {
    if (!activeChapter || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const success = await exportChapterToPdf(activeChapter, novel, {
        pageSize: pdfPageSize === '6x9' ? '152mm 228mm' : pdfPageSize,
        font: pdfFont,
        fontSize: pdfFontSize,
      });
      if (success) {
        triggerToast(`تم تنزيل مستند PDF بنجاح: ${cleanName}.pdf`);
      }
    } catch {
      triggerToast(`حدث خطأ أثناء تنزيل PDF، يرجى إعادة المحاولة`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportWord = () => {
    if (!activeChapter) return;
    exportChapterToWord(activeChapter, novel);
    triggerToast(`تم تنزيل مستند Word بنجاح: ${cleanName}.docx`);
  };

  const handleExportTxt = () => {
    if (!activeChapter) return;
    exportChapterToTxt(activeChapter, novel);
    triggerToast(`تم تنزيل النص المجرد: ${cleanName}.txt`);
  };

  const handleExportHtml = () => {
    if (!activeChapter) return;
    exportChapterToEpubHtml(activeChapter, novel);
    triggerToast(`تم تنزيل الكتاب الإلكتروني: ${cleanName}.html`);
  };

  const handleExportMarkdown = () => {
    if (!activeChapter) return;
    exportChapterToMarkdown(activeChapter, novel);
    triggerToast(`تم تنزيل ملف الماركداون: ${cleanName}.md`);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.title && Array.isArray(json.chapters)) {
          onImportNovel(json);
          setImportSuccess(true);
          setTimeout(() => {
            setImportSuccess(false);
            onClose();
          }, 1500);
        } else {
          alert('ملف المشروع غير صالح أو لا يحتوي على بنية رواية راوي الصحيحة.');
        }
      } catch {
        alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl border border-stone-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 font-novel-amiri">
                تصدير واستخراج الفصل
              </h2>
              <p className="text-xs text-stone-500">
                تنزيل مباشر للفصل النشط في المحرر بصيغ متعددة جاهزة للطباعة أو التعديل
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Chapter Highlight Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {activeChapter ? activeChapter.order : 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-950 text-sm font-novel-amiri">
                  {activeChapter?.title || 'الفصل النشط'}
                </span>
                {activeChapter?.act && (
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md font-medium">
                    {activeChapter.act}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                نطاق التصدير: الفصل الحالي ({wordsCount.toLocaleString('ar-EG')} كلمة) · اسم الملف: <code className="bg-amber-100/90 text-amber-950 px-1.5 py-0.2 rounded font-mono text-[10px] font-bold">{cleanName}.[صيغة]</code>
              </p>
            </div>
          </div>

          {/* Quick Chapter Switcher */}
          {novel.chapters.length > 1 && (
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="p-1.5 px-2.5 rounded-xl border border-amber-300/80 bg-white text-stone-800 text-xs font-semibold focus:outline-hidden cursor-pointer"
            >
              {novel.chapters.map((ch, idx) => (
                <option key={ch.id} value={ch.id}>
                  الفصل {idx + 1}: {ch.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Notification Toast for Downloads */}
        {downloadSuccessMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{downloadSuccessMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* Export Cards - In Precise Ordered Priority Requested   */}
        {/* ======================================================== */}
        <div className="space-y-3">
          {/* 1. مستند PDF (PDF Document) - Direct Blob Download */}
          <div className="p-4 rounded-2xl border-2 border-amber-500/30 hover:border-amber-500 bg-amber-50/30 transition-all shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-stone-900 font-novel-amiri">
                      1. مستند PDF (PDF Document)
                    </h3>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded-md">
                      تنزيل مباشر للذاكرة
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    توليد ملف PDF حقيقي في الذاكرة وتنزيله مباشرة للجهاز مع دعم متكامل للخط العربي (RTL)
                  </p>
                </div>
              </div>

              <button
                onClick={handleExportPdf}
                disabled={isGeneratingPdf}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shrink-0"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري إنشاء PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>تنزيل مستند PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* Inline PDF customization options */}
            <div className="pt-2 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-600 shrink-0">حجم الصفحة:</span>
                <select
                  value={pdfPageSize}
                  onChange={(e) => setPdfPageSize(e.target.value as any)}
                  className="bg-white border border-amber-200 rounded-lg p-1 text-xs text-stone-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="A4">ورق قياسي A4</option>
                  <option value="A5">حجم رواية A5</option>
                  <option value="6x9">كتاب جيب (6×9 إنش)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-stone-600 shrink-0">نوع الخط:</span>
                <select
                  value={pdfFont}
                  onChange={(e) => setPdfFont(e.target.value as any)}
                  className="bg-white border border-amber-200 rounded-lg p-1 text-xs text-stone-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="amiri">خط أميري (Amiri)</option>
                  <option value="scheherazade">شهرزاد (نسخ)</option>
                  <option value="cairo">خط حديث (Cairo)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-stone-600 shrink-0">حجم الخط:</span>
                <select
                  value={pdfFontSize}
                  onChange={(e) => setPdfFontSize(Number(e.target.value))}
                  className="bg-white border border-amber-200 rounded-lg p-1 text-xs text-stone-800 focus:outline-hidden cursor-pointer"
                >
                  <option value={11}>11pt (كتاب قياسي)</option>
                  <option value={12}>12pt (مريح وواضح)</option>
                  <option value={13}>13pt (كبير)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. مستند وورد (DOCX) */}
          <div className="p-4 rounded-2xl border border-stone-200 hover:border-blue-400 bg-white transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900 font-novel-amiri">
                  2. مستند وورد (DOCX)
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  ملف قابل للتعديل والتنسيق مستقبلاً في Microsoft Word و Google Docs (.docx)
                </p>
              </div>
            </div>

            <button
              onClick={handleExportWord}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل DOCX</span>
            </button>
          </div>

          {/* 3. نص مجرد (TXT) */}
          <div className="p-4 rounded-2xl border border-stone-200 hover:border-stone-400 bg-white transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900 font-novel-amiri">
                  3. نص مجرد (TXT)
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  نص خفيف وسريع بدون تنسيقات متوافق مع كافة المحررات والأجهزة (.txt)
                </p>
              </div>
            </div>

            <button
              onClick={handleExportTxt}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل TXT</span>
            </button>
          </div>

          {/* 4. كتاب إلكتروني (eBook / EPUB أو HTML) */}
          <div className="p-4 rounded-2xl border border-stone-200 hover:border-emerald-400 bg-white transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Book className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900 font-novel-amiri">
                  4. كتاب إلكتروني (eBook / EPUB أو HTML)
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  للعرض المتجاوب على شاشات القراءة الإلكترونية والمتصفحات (.html)
                </p>
              </div>
            </div>

            <button
              onClick={handleExportHtml}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل HTML / eBook</span>
            </button>
          </div>

          {/* 5. ملف ماركداون (Markdown - MD) */}
          <div className="p-4 rounded-2xl border border-stone-200 hover:border-purple-400 bg-white transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900 font-novel-amiri">
                  5. ملف ماركداون (Markdown - MD)
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  لتطبيقات التدوين والتنسيق النصي مثل Notion و Obsidian و Bear (.md)
                </p>
              </div>
            </div>

            <button
              onClick={handleExportMarkdown}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل Markdown</span>
            </button>
          </div>
        </div>

        {/* SECTION: Full Project Backup JSON (Safe Storage) */}
        <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <h4 className="font-bold text-stone-800">نسخة احتياطية كاملة للمشروع (JSON)</h4>
            <p className="text-[11px] text-stone-500">
              حفظ أو استعادة الرواية بجميع فصولها وملاحظاتها
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>استعادة</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>

            <button
              onClick={() => exportToJson(novel)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>نسخ المشروع كامل</span>
            </button>
          </div>
        </div>

        {importSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>تم استيراد المشروع بنجاح وفتح الرواية!</span>
          </div>
        )}
      </div>
    </div>
  );
};
