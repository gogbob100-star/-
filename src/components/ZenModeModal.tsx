import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  CloudRain,
  Flame,
  Waves,
  Target,
  Edit2,
  Sparkles,
  ChevronDown,
  AtSign,
  User,
  MapPin,
  X,
} from 'lucide-react';
import {
  Chapter,
  Character,
  WorldNote,
  CharacterRelationship,
  EditorSettings,
  NovelFont,
} from '../types/novel';
import { soundStudio, playSound } from '../services/soundService';
import { normalizeArabic } from '../utils/arabicSearch';
import {
  getDailyProgress,
  updateWordsToday,
  setDailyGoalValue,
  DailyProgress,
} from '../utils/dailyGoal';

interface ZenModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: Chapter;
  characters?: Character[];
  worldNotes?: WorldNote[];
  relationships?: CharacterRelationship[];
  settings: EditorSettings;
  onUpdateChapter: (updated: Partial<Chapter>) => void;
  onUpdateSettings: (settings: Partial<EditorSettings>) => void;
}

export const ZenModeModal: React.FC<ZenModeModalProps> = ({
  isOpen,
  onClose,
  chapter,
  characters = [],
  worldNotes = [],
  relationships = [],
  settings,
  onUpdateChapter,
  onUpdateSettings,
}) => {
  const [ambientSound, setAmbientSound] = useState<'rain' | 'fire' | 'stream' | 'none'>('none');
  const [sprintMinutes, setSprintMinutes] = useState(20);
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [initialSessionWords, setInitialSessionWords] = useState(0);

  // Daily Goal State
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(getDailyProgress());
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInputValue, setGoalInputValue] = useState('500');

  // Auto-hide toolbar states
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // @Mentions Auto-complete state in Zen mode
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState<number>(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const prevChapterWordsRef = useRef<number>(0);

  // Initialize initial words on open & focus textarea at end
  useEffect(() => {
    if (isOpen) {
      const words = chapter.content.trim() ? chapter.content.trim().split(/\s+/).length : 0;
      setInitialSessionWords(words);
      prevChapterWordsRef.current = words;
      setTimeLeft(sprintMinutes * 60);
      setIsTimerRunning(false);
      setIsToolbarVisible(false);
      setDailyProgress(getDailyProgress());

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const len = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(len, len);
          if (canvasContainerRef.current) {
            canvasContainerRef.current.scrollTo({
              top: canvasContainerRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }
        }
      }, 100);
    } else {
      soundStudio.stopAmbient();
      setAmbientSound('none');
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    }
  }, [isOpen]);

  // Sprint timer tick
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      try {
        new Audio('data:audio/wav;base64,UklGRl9vT19teleXAAAA').play();
      } catch {}
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered mentions (characters + world notes) - must be declared before any early return!
  const filteredMentions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = normalizeArabic(mentionQuery.toLowerCase());

    const charMatches = characters
      .filter((c) => !q || normalizeArabic(c.name.toLowerCase()).includes(q))
      .map((c) => ({ type: 'character' as const, title: c.name, sub: c.archetype || c.role }));

    const worldMatches = worldNotes
      .filter((w) => !q || normalizeArabic(w.title.toLowerCase()).includes(q))
      .map((w) => ({ type: 'world' as const, title: w.title, sub: w.category }));

    return [...charMatches, ...worldMatches].slice(0, 6);
  }, [mentionQuery, characters, worldNotes]);

  if (!isOpen) return null;

  const currentWords = chapter.content.trim() ? chapter.content.trim().split(/\s+/).length : 0;

  // Auto-scroll caret visibility
  const ensureCaretVisibleAboveKeyboard = () => {
    const textarea = textareaRef.current;
    const container = canvasContainerRef.current;
    if (!textarea || !container) return;

    const caretPos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, caretPos);
    const lineNum = textBefore.split('\n').length;

    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight) || (settings.fontSize * 2.1);
    const caretY = lineNum * lineHeight;

    const containerHeight = container.clientHeight;
    const currentScroll = container.scrollTop;

    const targetMinScroll = caretY - containerHeight * 0.35;
    if (currentScroll < targetMinScroll - 60 || currentScroll > targetMinScroll + 160) {
      container.scrollTo({
        top: Math.max(0, targetMinScroll),
        behavior: 'smooth',
      });
    }
  };

  // Check mention trigger
  const checkMentionTrigger = (textarea: HTMLTextAreaElement) => {
    const cursor = textarea.selectionStart;
    const text = textarea.value;
    const textBefore = text.slice(0, cursor);
    const lastAtIndex = textBefore.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const charBeforeAt = lastAtIndex > 0 ? textBefore[lastAtIndex - 1] : ' ';
      const isWordBoundary = /\s|[\n\r(«"']/.test(charBeforeAt) || lastAtIndex === 0;
      const query = textBefore.slice(lastAtIndex + 1);

      if (isWordBoundary && !query.includes(' ') && !query.includes('\n')) {
        setMentionQuery(query);
        setMentionStartIndex(lastAtIndex);
        setSelectedMentionIndex(0);
        return;
      }
    }

    setMentionQuery(null);
    setMentionStartIndex(-1);
  };

  const insertMention = (title: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = mentionStartIndex !== -1 ? mentionStartIndex : textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = chapter.content || '';
    const mentionText = `@${title} `;

    const newContent = current.slice(0, start) + mentionText + current.slice(end);
    onUpdateChapter({ content: newContent });
    setMentionQuery(null);
    setMentionStartIndex(-1);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + mentionText.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 20);

    playSound('tap');
  };

  // Handle typing in Zen mode
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (settings.typewriterSounds) {
      soundStudio.playTypewriterKey();
    }

    const newContent = e.target.value;
    const newWords = newContent.trim() ? newContent.trim().split(/\s+/).length : 0;
    const wordDelta = newWords - prevChapterWordsRef.current;

    if (wordDelta !== 0) {
      const updated = updateWordsToday(wordDelta);
      setDailyProgress(updated);
      prevChapterWordsRef.current = newWords;
    }

    onUpdateChapter({ content: newContent });
    ensureCaretVisibleAboveKeyboard();
    checkMentionTrigger(e.target);
  };

  const handleZenKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % filteredMentions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev - 1 + filteredMentions.length) % filteredMentions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = filteredMentions[selectedMentionIndex];
        if (selected) {
          insertMention(selected.title);
        }
        return;
      }
      if (e.key === 'Escape') {
        setMentionQuery(null);
        setMentionStartIndex(-1);
        return;
      }
    }
  };

  // Ambient sound handler
  const toggleAmbient = (type: 'rain' | 'fire' | 'stream') => {
    if (ambientSound === type) {
      soundStudio.stopAmbient();
      setAmbientSound('none');
    } else {
      soundStudio.setAmbient(type, 0.15);
      setAmbientSound(type);
    }
  };

  const minutesFormatted = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0');
  const secondsFormatted = (timeLeft % 60).toString().padStart(2, '0');
  const goalPercent = Math.min(100, Math.round((dailyProgress.wordsToday / dailyProgress.dailyGoal) * 100));

  const bgStyles = settings.paperDarkMode
    ? 'bg-[#0f0f10] text-[#e0e0e0]'
    : settings.theme === 'sepia'
    ? 'bg-[#f4ecd8] text-[#433422]'
    : settings.theme === 'midnight'
    ? 'bg-[#121214] text-[#f4f4f5]'
    : 'bg-[#fffef9] text-[#2c2416]';

  const getFontFamily = (font: NovelFont) => {
    switch (font) {
      case 'scheherazade':
        return 'font-novel-scheherazade';
      case 'cairo':
        return 'font-novel-sans';
      case 'amiri':
      default:
        return 'font-novel-amiri';
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-colors duration-300 ${bgStyles} overflow-hidden select-none`}
      onPointerMove={(e) => {
        if (e.clientY < 90) {
          setIsToolbarVisible(true);
        }
      }}
    >
      {/* Subtle Floating Corner Exit Button (Always accessible) */}
      <button
        onClick={onClose}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-full bg-black/20 hover:bg-black/40 text-stone-300 hover:text-white backdrop-blur-md border border-white/10 transition-all opacity-40 hover:opacity-100 shadow-md flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        title="الخروج من وضع التركيز (Esc)"
      >
        <Minimize2 className="w-4 h-4" />
        <span className="hidden sm:inline">إنهاء التركيز (Esc)</span>
      </button>

      {/* Invisible Touch Sensor Zone at Top Edge */}
      <div
        className="fixed top-0 inset-x-0 h-10 z-40 cursor-pointer"
        onMouseEnter={() => setIsToolbarVisible(true)}
        onTouchStart={() => setIsToolbarVisible(true)}
      />

      {/* Ultra-thin Collapsed Indicator Pill when hidden */}
      <div
        onClick={() => setIsToolbarVisible(true)}
        className={`fixed top-2 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ease-in-out cursor-pointer group flex flex-col items-center gap-1 ${
          !isToolbarVisible
            ? 'opacity-80 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-6 scale-90 pointer-events-none'
        }`}
        title="انقر أو المس لإظهار أدوات الجلسة"
      >
        <div className="w-20 sm:w-28 h-1.5 rounded-full bg-amber-500/60 group-hover:bg-amber-500 transition-colors shadow-lg backdrop-blur-md flex items-center justify-center">
          <ChevronDown className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="text-[10px] font-mono text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/90 text-amber-300 px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-md">
          {dailyProgress.wordsToday} / {dailyProgress.dailyGoal} كلمة
        </span>
      </div>

      {/* Auto-Hiding Top Control Bar & Exit Button */}
      <div
        className={`fixed top-0 inset-x-0 z-40 p-3 sm:p-4 md:px-8 transition-all duration-300 ease-in-out ${
          isToolbarVisible
            ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
            : '-translate-y-[120%] opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-current/10 backdrop-blur-xl border border-current/15 shadow-2xl">
          {/* Chapter & Exit */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-current/15 hover:bg-current/25 transition-all text-xs font-semibold shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
              title="الخروج من وضع التركيز (Esc)"
            >
              <Minimize2 className="w-4 h-4" />
              <span>إنهاء التركيز</span>
            </button>

            <span className="opacity-30">|</span>
            <span className="text-xs font-bold font-novel-amiri opacity-80 truncate max-w-[150px] sm:max-w-xs">
              {chapter.title}
            </span>
          </div>

          {/* Right Controls: Daily Goal Counter, Sprint Timer, Ambient Sounds */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs flex-wrap">
            {/* Live Daily Goal Counter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-current/10 border border-current/10 font-mono text-xs">
              <Target className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              {isEditingGoal ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={goalInputValue}
                    onChange={(e) => setGoalInputValue(e.target.value)}
                    className="w-16 bg-white dark:bg-stone-800 text-gray-900 dark:text-stone-100 px-1.5 py-0.5 rounded text-xs text-center font-bold"
                    min="50"
                    step="50"
                  />
                  <button
                    onClick={() => {
                      const val = parseInt(goalInputValue, 10);
                      if (val > 0) {
                        setDailyGoalValue(val);
                        setDailyProgress(getDailyProgress());
                      }
                      setIsEditingGoal(false);
                    }}
                    className="px-2 py-0.5 bg-amber-600 text-white rounded text-[11px] font-semibold"
                  >
                    حفظ
                  </button>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 cursor-pointer group"
                  onClick={() => {
                    setGoalInputValue(dailyProgress.dailyGoal.toString());
                    setIsEditingGoal(true);
                  }}
                  title="انقر لتعديل الهدف اليومي للكلمات"
                >
                  <span className="font-bold tabular-nums">
                    الهدف: {dailyProgress.wordsToday} / {dailyProgress.dailyGoal} كلمة
                  </span>
                  <span className="text-[10px] opacity-70">({goalPercent}%)</span>
                  <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>

            {/* Word Sprint Timer */}
            <div className="flex items-center gap-2 bg-current/10 px-2.5 py-1.5 rounded-xl font-mono">
              <span className="font-semibold text-xs tabular-nums">
                {minutesFormatted}:{secondsFormatted}
              </span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1 hover:text-amber-500 transition-colors cursor-pointer"
                title={isTimerRunning ? 'إيقاف مؤقت' : 'بدء جولة الكتابة'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimeLeft(sprintMinutes * 60);
                }}
                className="p-1 hover:opacity-100 opacity-60 cursor-pointer"
                title="إعادة ضبط المؤقت"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Ambient Sound Presets */}
            <div className="flex items-center gap-1 bg-current/10 p-1 rounded-xl">
              <button
                onClick={() => toggleAmbient('rain')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  ambientSound === 'rain' ? 'bg-amber-600 text-white shadow-xs' : 'hover:bg-current/15 opacity-70'
                }`}
                title="صوت المطر الهادئ"
              >
                <CloudRain className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => toggleAmbient('fire')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  ambientSound === 'fire' ? 'bg-amber-600 text-white shadow-xs' : 'hover:bg-current/15 opacity-70'
                }`}
                title="صوت المدفأة الخشبية"
              >
                <Flame className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => toggleAmbient('stream')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  ambientSound === 'stream' ? 'bg-amber-600 text-white shadow-xs' : 'hover:bg-current/15 opacity-70'
                }`}
                title="صوت تدفق الماء الطبيعي"
              >
                <Waves className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Typewriter sound toggle */}
            <button
              onClick={() => onUpdateSettings({ typewriterSounds: !settings.typewriterSounds })}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                settings.typewriterSounds ? 'bg-amber-600/30 text-amber-500' : 'opacity-40 hover:opacity-100'
              }`}
              title="صوت الآلة الكاتبة"
            >
              {settings.typewriterSounds ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Zen Text Writing Canvas */}
      <div
        ref={canvasContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-16 pt-24 sm:pt-32 pb-[50vh] scroll-smooth relative"
      >
        <div className="max-w-3xl mx-auto flex flex-col min-h-[60vh] relative">
          <textarea
            ref={textareaRef}
            value={chapter.content}
            onChange={handleContentChange}
            onKeyDown={handleZenKeyDown}
            onKeyUp={ensureCaretVisibleAboveKeyboard}
            onClick={ensureCaretVisibleAboveKeyboard}
            onSelect={ensureCaretVisibleAboveKeyboard}
            placeholder="اكتب هنا بحرية تامة دون مشتتات... استخدم @ للإشارة للشخصيات والأماكن."
            dir={settings.textDirection}
            style={{
              fontSize: `${Math.max(18, settings.fontSize + 2)}px`,
              lineHeight: 2.1,
              textIndent: settings.firstLineIndent ? '2em' : '0',
            }}
            className={`w-full min-h-[60vh] bg-transparent resize-none focus:outline-hidden text-justify ${
              settings.paperDarkMode || settings.theme === 'midnight'
                ? 'text-white dark:text-white placeholder:text-stone-400'
                : 'text-stone-900 dark:text-white placeholder:text-stone-400'
            } ${getFontFamily(settings.font)} pb-20`}
          />

          {/* Floating @Mentions Autocomplete in Zen Mode */}
          {mentionQuery !== null && filteredMentions.length > 0 && (
            <div className="absolute top-12 right-2 z-50 w-72 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
              <div className="p-2.5 bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-200">
                <div className="flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-amber-600" />
                  <span>إشارة سريعة</span>
                </div>
                <span className="text-[10px] text-stone-400 font-normal">Enter للاختيار</span>
              </div>

              <div className="max-h-52 overflow-y-auto p-1.5 space-y-1">
                {filteredMentions.map((m, idx) => {
                  const isSelected = idx === selectedMentionIndex;
                  return (
                    <div
                      key={m.type + m.title}
                      onClick={() => insertMention(m.title)}
                      onMouseEnter={() => setSelectedMentionIndex(idx)}
                      className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-600 text-white font-bold'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {m.type === 'character' ? (
                          <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        )}
                        <span className="text-xs truncate">{m.title}</span>
                      </div>
                      <span className="text-[10px] opacity-75">{m.sub}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
