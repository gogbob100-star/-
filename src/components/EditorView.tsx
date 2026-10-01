import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Type,
  Maximize2,
  Minimize2,
  Clock,
  BookOpen,
  AlignRight,
  Eye,
  ShieldAlert,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  X,
  Highlighter,
  CheckCheck,
  History,
  Timer,
  Lightbulb,
  Sun,
  Moon,
  Bold,
  Italic,
  Underline,
  Target,
  Compass,
  Check,
  Loader2,
  AlertCircle,
  Tag,
  Plus,
  PenTool,
  FileText,
  Calendar,
  Layers,
  Feather,
  AtSign,
  User,
  MapPin,
  Share2,
  Heart,
  Skull,
  Swords,
  HelpCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  Chapter,
  Character,
  WorldNote,
  PlotBeat,
  CharacterRelationship,
  EditorSettings,
  EditorTheme,
  NovelFont,
} from '../types/novel';
import { soundStudio, playSound } from '../services/soundService';
import { normalizeArabic } from '../utils/arabicSearch';
import { getDailyProgress, updateWordsToday, DailyProgress } from '../utils/dailyGoal';
import { getTagBadgeStyle } from './ChapterSidebar';

interface EditorViewProps {
  chapter: Chapter;
  characters: Character[];
  worldNotes?: WorldNote[];
  relationships?: CharacterRelationship[];
  plotBeats?: PlotBeat[];
  allChapters?: Chapter[];
  settings: EditorSettings;
  activeSearchQuery?: string;
  isProofreadOpen?: boolean;
  cloudSyncStatus?: 'synced' | 'saving' | 'error' | 'offline';
  onUpdateChapter: (updated: Partial<Chapter>) => void;
  onUpdateSettings: (settings: Partial<EditorSettings>) => void;
  onOpenAIAssist: (mode?: string) => void;
  onOpenZen: () => void;
  onOpenSearch: () => void;
  onClearSearch?: () => void;
  onOpenProofread: () => void;
  onOpenHistory: () => void;
  onOpenPomodoro: () => void;
  onOpenPrompt: () => void;
  onOpenWorldDrawer?: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  chapter,
  characters = [],
  worldNotes = [],
  relationships = [],
  plotBeats = [],
  allChapters = [],
  settings,
  activeSearchQuery = '',
  isProofreadOpen = false,
  cloudSyncStatus = 'synced',
  onUpdateChapter,
  onUpdateSettings,
  onOpenAIAssist,
  onOpenZen,
  onOpenSearch,
  onClearSearch,
  onOpenProofread,
  onOpenHistory,
  onOpenPomodoro,
  onOpenPrompt,
  onOpenWorldDrawer,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  // Collapsible Chapter Card State (default collapsed on overview, expanded when writing)
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [selectionInfo, setSelectionInfo] = useState<{ start: number; end: number; text: string } | null>(null);

  // @Mentions Auto-complete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState<number>(0);

  // Active Entity Popover Card State
  const [inspectedEntity, setInspectedEntity] = useState<{
    type: 'character' | 'world';
    data: Character | WorldNote;
  } | null>(null);

  // Daily Goal State
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(getDailyProgress());
  const prevChapterWordsRef = useRef<number>(
    chapter.content.trim() ? chapter.content.trim().split(/\s+/).length : 0
  );

  // Tags State & Helpers
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState<boolean>(false);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const PRESET_TAGS = ['حواري', 'وصفي', 'درامي', 'تشويق', 'صراع', 'رومانسي', 'تمهيد', 'ذروة', 'استرجاع'];

  const handleToggleTag = (tag: string) => {
    const currentTags = chapter.tags || [];
    const exists = currentTags.includes(tag);
    const updated = exists ? currentTags.filter((t) => t !== tag) : [...currentTags, tag];
    onUpdateChapter({ tags: updated });
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim().replace(/^#/, '');
    if (!trimmed) return;
    const currentTags = chapter.tags || [];
    if (!currentTags.includes(trimmed)) {
      onUpdateChapter({ tags: [...currentTags, trimmed] });
    }
    setCustomTagInput('');
    setIsTagsDropdownOpen(false);
  };

  // Helper: Smoothly scroll the editor to the bottom of the manuscript
  const scrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      if (editorWrapperRef.current) {
        editorWrapperRef.current.scrollTo({
          top: editorWrapperRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        });
      }
      if (textareaRef.current) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    });
  };

  // Helper: Set focus and place cursor at the very end of the text
  const focusAtEnd = (smoothScroll = true) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    const length = textarea.value.length;
    textarea.setSelectionRange(length, length);
    scrollToBottom(smoothScroll);
  };

  // Expand editor and focus at end
  const handleExpandAndEdit = () => {
    setIsExpanded(true);
    playSound('tap');
    setTimeout(() => {
      focusAtEnd(true);
    }, 80);
  };

  // Collapse editor back to compact card
  const handleCollapse = () => {
    setIsExpanded(false);
    playSound('tap');
  };

  useEffect(() => {
    prevChapterWordsRef.current = chapter.content.trim()
      ? chapter.content.trim().split(/\s+/).length
      : 0;
  }, [chapter.id]);

  // If active search query is present, automatically expand to show search matches
  useEffect(() => {
    if (activeSearchQuery.trim()) {
      setIsExpanded(true);
    }
  }, [activeSearchQuery]);

  // Handle external focus requests (e.g. from AI Assistant / drawers)
  useEffect(() => {
    const handleFocusEnd = () => {
      setIsExpanded(true);
      setTimeout(() => {
        focusAtEnd(true);
      }, 60);
    };

    window.addEventListener('rawi-focus-editor-end', handleFocusEnd);
    return () => {
      window.removeEventListener('rawi-focus-editor-end', handleFocusEnd);
    };
  }, []);

  // Handle mobile visual viewport resize (e.g. virtual keyboard appearing)
  useEffect(() => {
    const handleViewportResize = () => {
      if (isExpanded && document.activeElement === textareaRef.current) {
        scrollToBottom(true);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      }
    };
  }, [isExpanded]);

  const handleSelectionChange = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== null && end !== null && end > start) {
      const text = textarea.value.substring(start, end);
      setSelectionInfo({ start, end, text });
    } else {
      setSelectionInfo(null);
    }

    // Check for @mention trigger
    checkMentionTrigger(textarea);
  };

  // Detect if cursor is preceded by @ for autocompletion
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

  // Filtered mentions (characters + world notes)
  const filteredMentions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = normalizeArabic(mentionQuery.toLowerCase());

    const charMatches = characters
      .filter((c) => !q || normalizeArabic(c.name.toLowerCase()).includes(q))
      .map((c) => ({ type: 'character' as const, item: c, title: c.name, sub: c.archetype || c.role }));

    const worldMatches = worldNotes
      .filter((w) => !q || normalizeArabic(w.title.toLowerCase()).includes(q))
      .map((w) => ({ type: 'world' as const, item: w, title: w.title, sub: w.category }));

    return [...charMatches, ...worldMatches].slice(0, 8);
  }, [mentionQuery, characters, worldNotes]);

  // Insert mention into textarea
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

  // Handle key navigation inside @mention dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  const applyFormatting = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = chapter.content || '';
    const selected = current.substring(start, end);
    const replacement = `${prefix}${selected}${suffix}`;
    const newContent = current.substring(0, start) + replacement + current.substring(end);
    onUpdateChapter({ content: newContent });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
      handleSelectionChange();
    }, 10);
  };

  // Auto-resize textarea to fit content or stay roomy
  useEffect(() => {
    if (textareaRef.current && isExpanded) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(600, textareaRef.current.scrollHeight)}px`;
    }
  }, [chapter.content, isExpanded]);

  // Find all match positions for the active search query in the current chapter
  const matches = useMemo(() => {
    const q = activeSearchQuery.trim();
    if (!q || !chapter.content) return [];

    const normQ = normalizeArabic(q);
    const normText = normalizeArabic(chapter.content);
    if (!normQ) return [];

    const list: Array<{ start: number; end: number }> = [];
    let pos = 0;
    while (pos < normText.length) {
      const idx = normText.indexOf(normQ, pos);
      if (idx === -1) break;

      const len = q.length;
      list.push({ start: idx, end: idx + len });
      pos = idx + Math.max(1, len);
    }
    return list;
  }, [activeSearchQuery, chapter.content]);

  // Jump to specific match
  const jumpToMatch = (idx: number) => {
    if (!matches.length || !textareaRef.current) return;
    const boundedIdx = (idx + matches.length) % matches.length;
    setCurrentMatchIndex(boundedIdx);

    const m = matches[boundedIdx];
    if (m) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.setSelectionRange(m.start, m.end);

      const textBefore = chapter.content.substring(0, m.start);
      const lines = textBefore.split('\n').length;
      const lineHeightPx = settings.fontSize * settings.lineHeight;
      const targetScrollTop = lines * lineHeightPx - 150;

      window.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    }
  };

  // When active search query changes, jump to first match
  useEffect(() => {
    if (matches.length > 0) {
      jumpToMatch(0);
    }
  }, [activeSearchQuery, matches.length]);

  const ensureCaretVisibleAboveKeyboard = () => {
    const textarea = textareaRef.current;
    const wrapper = editorWrapperRef.current;
    if (!textarea || !wrapper) return;

    const caretPos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, caretPos);
    const lineNum = textBefore.split('\n').length;
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight) || (settings.fontSize * settings.lineHeight);
    const caretYInTextarea = lineNum * lineHeight;

    const wrapperHeight = wrapper.clientHeight;
    const currentScroll = wrapper.scrollTop;

    const targetMinScroll = caretYInTextarea - wrapperHeight * 0.35;
    if (currentScroll < targetMinScroll - 60 || currentScroll > targetMinScroll + 160) {
      wrapper.scrollTo({
        top: Math.max(0, targetMinScroll),
        behavior: 'smooth',
      });
    }
  };

  // Handle typing with typewriter sound if enabled
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

  // Text formatting insert helpers
  const insertTextAtCursor = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = chapter.content || '';
    const selected = current.substring(start, end);
    const replacement = `${prefix}${selected}${suffix}`;

    const newContent = current.substring(0, start) + replacement + current.substring(end);
    onUpdateChapter({ content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
      handleSelectionChange();
    }, 10);
  };

  const wordCount = chapter.content.trim() ? chapter.content.trim().split(/\s+/).length : 0;
  const charCount = chapter.content.length;
  const approxReadTime = Math.max(1, Math.round(wordCount / 200));

  // Determine which characters and world locations are present in this chapter
  const mentionedEntities = useMemo(() => {
    const text = chapter.content || '';
    const normText = normalizeArabic(text);

    const chars = characters.filter((c) => {
      const name = normalizeArabic(c.name);
      return name && (normText.includes(`@${name}`) || normText.includes(name));
    });

    const locations = worldNotes.filter((w) => {
      const title = normalizeArabic(w.title);
      return title && (normText.includes(`@${title}`) || normText.includes(title));
    });

    return { chars, locations };
  }, [chapter.content, characters, worldNotes]);

  // Determine theme styles
  const getThemeClasses = (theme: EditorTheme) => {
    switch (theme) {
      case 'paper':
        return {
          wrapper: 'bg-[#fbf7ee] text-[#2c2416]',
          card: 'bg-[#fffef9] border-[#ede5d3] shadow-md text-[#2b241b]',
          page: 'bg-[#fffef9] border-[#ede5d3] shadow-sm text-[#2b241b]',
          border: 'border-[#ede5d3]',
          accent: 'text-amber-800',
        };
      case 'sepia':
        return {
          wrapper: 'bg-[#f4ecd8] text-[#433422]',
          card: 'bg-[#f9f3e4] border-[#e2d5bd] shadow-md text-[#3e3020]',
          page: 'bg-[#f9f3e4] border-[#e2d5bd] shadow-sm text-[#3e3020]',
          border: 'border-[#e2d5bd]',
          accent: 'text-amber-900',
        };
      case 'midnight':
        return {
          wrapper: 'bg-[#18181b] text-[#f4f4f5]',
          card: 'bg-[#212126] border-[#313138] shadow-md text-[#f4f4f5]',
          page: 'bg-[#212126] border-[#313138] shadow-sm text-[#f4f4f5]',
          border: 'border-[#313138]',
          accent: 'text-amber-400',
        };
      case 'clean':
      default:
        return {
          wrapper: 'bg-stone-100 text-stone-900',
          card: 'bg-white border-stone-200/80 shadow-md text-stone-900',
          page: 'bg-white border-stone-200/80 shadow-xs text-stone-900',
          border: 'border-stone-200',
          accent: 'text-stone-900',
        };
    }
  };

  const themeStyles = getThemeClasses(settings.theme);

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

  const statusLabel = {
    draft: 'مسودة',
    revising: 'قيد التحرير',
    completed: 'مكتمل',
  }[chapter.status || 'draft'];

  const statusColor = {
    draft: 'bg-stone-500/10 text-stone-600 dark:text-stone-300 border-stone-400/20',
    revising: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  }[chapter.status || 'draft'];

  // Preview excerpt from content
  const previewExcerpt = useMemo(() => {
    const clean = chapter.content.replace(/[#*`_❦✦—«»@]/g, '').trim();
    if (!clean) return 'فصل فارغ... انقر للبدء في تدوين هذا المشهد وصياغة أحداثه.';
    return clean.slice(0, 160) + (clean.length > 160 ? '...' : '');
  }, [chapter.content]);

  return (
    <div
      ref={editorWrapperRef}
      className={`flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto pb-24 md:pb-16 transition-colors duration-200 ${themeStyles.wrapper}`}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. COLLAPSED VIEW: Elegant Compact Chapter Card */}
      {/* ------------------------------------------------------------- */}
      {!isExpanded && (
        <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-200">
          {/* Main Collapsible Chapter Card */}
          <div
            className={`w-full rounded-2xl border transition-all duration-300 hover:shadow-xl relative overflow-hidden ${themeStyles.card}`}
          >
            {/* Top Accent Gradient Bar */}
            <div className="h-1.5 w-full bg-linear-to-r from-amber-600 via-amber-400 to-amber-700" />

            <div className="p-6 sm:p-8 space-y-6">
              {/* Header: Act + Status + Cloud Sync */}
              <div className="flex flex-wrap items-center justify-between gap-3 select-none">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                    <Feather className="w-3.5 h-3.5" />
                    <span>{chapter.act || 'الفصل'}</span>
                  </span>

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                </div>

                {/* Cloud Sync Status */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                    cloudSyncStatus === 'saving'
                      ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                      : cloudSyncStatus === 'synced'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                  }`}
                >
                  {cloudSyncStatus === 'saving' && (
                    <>
                      <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                      <span>جارٍ الحفظ...</span>
                    </>
                  )}
                  {cloudSyncStatus === 'synced' && (
                    <>
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>محفوظ سحابياً</span>
                    </>
                  )}
                  {(cloudSyncStatus === 'error' || cloudSyncStatus === 'offline') && (
                    <>
                      <AlertCircle className="w-3 h-3 text-rose-500" />
                      <span>محلي فقط</span>
                    </>
                  )}
                </div>
              </div>

              {/* Title Section (Clickable to edit title or open editor) */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={chapter.title}
                  onChange={(e) => onUpdateChapter({ title: e.target.value })}
                  placeholder="عنوان الفصل..."
                  className={`w-full font-bold text-xl sm:text-3xl bg-transparent border-b border-dashed border-stone-500/20 pb-2 focus:outline-hidden focus:border-amber-500 transition-colors ${getFontFamily(
                    settings.font
                  )}`}
                />
              </div>

              {/* Tags Section */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  <span>الوسوم:</span>
                </span>

                {chapter.tags && chapter.tags.length > 0 ? (
                  chapter.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTagBadgeStyle(
                        tag
                      )}`}
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => handleToggleTag(tag)}
                        className="p-0.5 hover:text-rose-600 transition-colors"
                        title="إزالة الوسم"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-stone-400 italic">لا توجد وسوم محددة</span>
                )}

                {/* Add Tag Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsTagsDropdownOpen(!isTagsDropdownOpen)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-500/10 hover:bg-stone-500/20 text-stone-700 dark:text-stone-300 border border-stone-500/20 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة وسم</span>
                  </button>

                  {isTagsDropdownOpen && (
                    <div className="absolute top-full mt-1.5 right-0 w-56 p-2 rounded-xl shadow-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 z-50 animate-in fade-in">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {PRESET_TAGS.map((tag) => {
                          const isSelected = (chapter.tags || []).includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleToggleTag(tag)}
                              className={`px-2 py-0.5 text-xs rounded-full border transition-all ${
                                isSelected
                                  ? 'bg-amber-600 text-white border-amber-600 font-bold'
                                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-500'
                              }`}
                            >
                              #{tag}
                            </button>
                          );
                        })}
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddCustomTag();
                        }}
                        className="flex items-center gap-1"
                      >
                        <input
                          type="text"
                          value={customTagInput}
                          onChange={(e) => setCustomTagInput(e.target.value)}
                          placeholder="وسم مخصص..."
                          className="flex-1 px-2 py-1 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent focus:outline-hidden focus:border-amber-500 text-gray-900 bg-white placeholder:text-gray-400"
                        />
                        <button
                          type="submit"
                          disabled={!customTagInput.trim()}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold disabled:opacity-40"
                        >
                          إضافة
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-stone-500/5 border border-stone-500/10 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-400 block">عدد الكلمات</span>
                    <span className="font-bold tabular-nums text-sm">{wordCount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-400 block">عدد الحروف</span>
                    <span className="font-bold tabular-nums text-sm">{charCount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-400 block">وقت القراءة</span>
                    <span className="font-bold text-sm">~{approxReadTime} دقيقة</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-400 block">آخر تعديل</span>
                    <span className="font-semibold text-xs text-stone-600 dark:text-stone-300">
                      {new Date(chapter.updatedAt || chapter.createdAt || Date.now()).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Characters & Lore present in this chapter preview badge */}
              {(mentionedEntities.chars.length > 0 || mentionedEntities.locations.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <span className="text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1">
                    <AtSign className="w-3.5 h-3.5" />
                    <span>عناصر المشهد المرتبطة:</span>
                  </span>
                  {mentionedEntities.chars.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setInspectedEntity({ type: 'character', data: c })}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-stone-800 border border-amber-400 text-stone-800 dark:text-stone-200 text-xs hover:scale-105 transition-all shadow-2xs cursor-pointer font-medium"
                    >
                      <User className="w-3 h-3 text-amber-600" />
                      <span>{c.name}</span>
                    </button>
                  ))}
                  {mentionedEntities.locations.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setInspectedEntity({ type: 'world', data: w })}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-stone-800 border border-stone-300 text-stone-800 dark:text-stone-200 text-xs hover:scale-105 transition-all shadow-2xs cursor-pointer font-medium"
                    >
                      <MapPin className="w-3 h-3 text-purple-600" />
                      <span>{w.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Content Teaser Preview */}
              <div
                onClick={handleExpandAndEdit}
                className="p-4 rounded-xl border border-dashed border-stone-500/20 bg-stone-500/5 cursor-pointer hover:border-amber-500/50 transition-all group"
                title="انقر لفتح المحرر وبدء الكتابة"
              >
                <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1.5">
                  <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>مقتطف السرد:</span>
                  </span>
                  <span className="group-hover:text-amber-600 transition-colors font-medium flex items-center gap-1">
                    <span>انقر للمتابعة والكتابة</span>
                    <ChevronDown className="w-3 h-3" />
                  </span>
                </div>
                <p
                  className={`text-sm italic text-stone-600 dark:text-stone-300 leading-relaxed ${getFontFamily(
                    settings.font
                  )}`}
                >
                  « {previewExcerpt} »
                </p>
              </div>

              {/* Primary Call-to-Action Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-500/10">
                {/* Big Primary Edit Button */}
                <button
                  onClick={handleExpandAndEdit}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <PenTool className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span>فتح المحرر والكتابة</span>
                  <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                </button>

                {/* Secondary Quick Action Tools */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                  <button
                    onClick={onOpenZen}
                    className="p-2.5 rounded-xl bg-stone-500/10 hover:bg-amber-600/10 text-stone-700 dark:text-stone-200 hover:text-amber-700 border border-stone-500/15 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    title="وضع التركيز الكامل (Zen Mode)"
                  >
                    <Eye className="w-4 h-4 text-amber-600" />
                    <span className="hidden md:inline">وضع التركيز</span>
                  </button>

                  <button
                    onClick={() => onOpenAIAssist('continue_scene')}
                    className="p-2.5 rounded-xl bg-amber-700/10 hover:bg-amber-700/20 text-amber-900 dark:text-amber-300 border border-amber-700/20 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    title="المساعد الذكي للسرد (AI)"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span className="hidden md:inline">المساعد الروائي</span>
                  </button>

                  <button
                    onClick={onOpenHistory}
                    className="p-2.5 rounded-xl bg-stone-500/10 hover:bg-stone-500/20 text-stone-700 dark:text-stone-200 border border-stone-500/15 transition-colors cursor-pointer"
                    title="سجل النسخ الاحتياطية"
                  >
                    <History className="w-4 h-4 text-stone-600 dark:text-stone-300" />
                  </button>

                  <button
                    onClick={onOpenPomodoro}
                    className="p-2.5 rounded-xl bg-stone-500/10 hover:bg-stone-500/20 text-stone-700 dark:text-stone-200 border border-stone-500/15 transition-colors cursor-pointer"
                    title="مؤقت بومودورو للتركيز"
                  >
                    <Timer className="w-4 h-4 text-amber-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. EXPANDED / EDIT MODE: Full Rich Manuscript Paper Editor */}
      {/* ------------------------------------------------------------- */}
      {isExpanded && (
        <div className="flex-1 flex flex-col animate-in fade-in duration-200 relative">
          {/* Top Formatting & Settings Bar */}
          <div
            className={`min-h-14 border-b ${themeStyles.border} px-3 sm:px-6 py-2 flex items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur-md bg-inherit/95 select-none overflow-x-auto`}
          >
            {/* Left/Start: Collapse Button + Format Tools */}
            <div className="flex items-center gap-1.5">
              {/* Collapse Editor Button */}
              <button
                onClick={handleCollapse}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold text-xs shadow-sm hover:opacity-90 transition-all cursor-pointer mr-1"
                title="طي المحرر والعودة إلى البطاقة المدمجة"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>طي المحرر</span>
              </button>

              <div className="h-4 w-px bg-stone-500/20 mx-1" />

              <button
                onClick={() => insertTextAtCursor('— ')}
                className="px-2.5 py-1 rounded-md text-xs font-semibold hover:bg-stone-500/10 transition-colors cursor-pointer"
                title="شرطة حوار روائي (—)"
              >
                — شرطة حوار
              </button>

              <button
                onClick={() => insertTextAtCursor('«', '»')}
                className="px-2.5 py-1 rounded-md text-xs font-semibold hover:bg-stone-500/10 transition-colors cursor-pointer"
                title="أقواس تنصيص عربية («...»)"
              >
                « »
              </button>

              <button
                onClick={() => insertTextAtCursor('\n\n❦ ✦ ❦\n\n')}
                className="px-2 py-1 rounded-md text-xs hover:bg-stone-500/10 transition-colors text-amber-600 cursor-pointer"
                title="فاصل مشهد مزخرف"
              >
                ❦ فاصل مشهد
              </button>

              {/* Quick @Mention Trigger Button */}
              <button
                onClick={() => {
                  const textarea = textareaRef.current;
                  if (textarea) {
                    textarea.focus();
                    const pos = textarea.selectionStart;
                    const content = textarea.value;
                    const newContent = content.slice(0, pos) + '@' + content.slice(pos);
                    onUpdateChapter({ content: newContent });
                    setMentionQuery('');
                    setMentionStartIndex(pos);
                    setTimeout(() => {
                      textarea.setSelectionRange(pos + 1, pos + 1);
                    }, 20);
                  }
                }}
                className="px-2.5 py-1 rounded-md text-xs font-semibold hover:bg-stone-500/10 transition-colors text-amber-700 dark:text-amber-400 flex items-center gap-1 cursor-pointer border border-amber-500/30"
                title="إشارة سريعة لشخصية أو مكان (@Mentions)"
              >
                <AtSign className="w-3.5 h-3.5" />
                <span>إشارة (@)</span>
              </button>

              <div className="h-4 w-px bg-stone-500/20 mx-1" />

              {/* Search Trigger Button */}
              <button
                onClick={onOpenSearch}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors border cursor-pointer ${
                  activeSearchQuery
                    ? 'bg-amber-100/90 border-amber-300 text-amber-900 font-semibold'
                    : 'border-transparent text-stone-600 dark:text-stone-300 hover:bg-stone-500/10'
                }`}
                title="البحث الذكي في جميع فصول الرواية (Ctrl+F)"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">بحث</span>
              </button>

              {/* Proofread Trigger Button */}
              <button
                onClick={onOpenProofread}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors border cursor-pointer ${
                  isProofreadOpen
                    ? 'bg-emerald-100/90 border-emerald-300 text-emerald-900 font-semibold'
                    : 'border-transparent text-stone-600 dark:text-stone-300 hover:bg-stone-500/10'
                }`}
                title="التدقيق اللغوي والإملائي بالذكاء الاصطناعي"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">تدقيق</span>
              </button>

              {/* Version History Button */}
              <button
                onClick={onOpenHistory}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors border border-transparent text-stone-600 dark:text-stone-300 hover:bg-stone-500/10 cursor-pointer"
                title="سجل النسخ الاحتياطية وإصدارات الفصل"
              >
                <History className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden lg:inline">الإصدارات</span>
              </button>

              {/* Pomodoro Timer Button */}
              <button
                onClick={onOpenPomodoro}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors border border-transparent text-stone-600 dark:text-stone-300 hover:bg-stone-500/10 cursor-pointer"
                title="مؤقت التركيز (بومودورو)"
              >
                <Timer className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden lg:inline">بومودورو</span>
              </button>

              {/* Paper Dark Mode Toggle */}
              <button
                onClick={() => onUpdateSettings({ paperDarkMode: !settings.paperDarkMode })}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors border cursor-pointer ${
                  settings.paperDarkMode
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                    : 'border-transparent text-stone-600 dark:text-stone-300 hover:bg-stone-500/10'
                }`}
                title={settings.paperDarkMode ? 'إلغاء وضع الكتابة الليلي للورقة' : 'تفعيل وضع الكتابة الليلي للورقة'}
              >
                {settings.paperDarkMode ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-amber-600" />
                )}
              </button>
            </div>

            {/* Right/End: Font, Theme, Zen mode, Auto-Save status */}
            <div className="flex items-center gap-2">
              {/* Cloud Sync Status Indicator */}
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium border ${
                  cloudSyncStatus === 'saving'
                    ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                    : cloudSyncStatus === 'synced'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                }`}
              >
                {cloudSyncStatus === 'saving' && <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />}
                {cloudSyncStatus === 'synced' && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                <span className="hidden xl:inline">
                  {cloudSyncStatus === 'saving' ? 'جارٍ الحفظ' : cloudSyncStatus === 'synced' ? 'تم الحفظ' : 'خطأ'}
                </span>
              </div>

              {/* Font Selector */}
              <div className="flex items-center gap-1">
                <Type className="w-3.5 h-3.5 opacity-50" />
                <select
                  value={settings.font}
                  onChange={(e) => onUpdateSettings({ font: e.target.value as NovelFont })}
                  className="bg-transparent border border-stone-500/20 rounded-md px-2 py-1 text-xs focus:outline-hidden text-gray-900 bg-white"
                >
                  <option value="amiri" className="bg-white text-stone-900">
                    خط أميري
                  </option>
                  <option value="scheherazade" className="bg-white text-stone-900">
                    شهرزاد
                  </option>
                  <option value="cairo" className="bg-white text-stone-900">
                    خط حديث
                  </option>
                </select>
              </div>

              {/* Theme Selector */}
              <div className="flex items-center gap-1 bg-stone-500/10 p-0.5 rounded-lg">
                <button
                  onClick={() => onUpdateSettings({ theme: 'paper' })}
                  className={`w-5 h-5 rounded-md bg-[#fffef9] border border-[#ede5d3] transition-transform ${
                    settings.theme === 'paper' ? 'scale-110 ring-1 ring-amber-700' : 'opacity-70'
                  }`}
                  title="ورق دافئ"
                />
                <button
                  onClick={() => onUpdateSettings({ theme: 'sepia' })}
                  className={`w-5 h-5 rounded-md bg-[#f4ecd8] border border-[#e2d5bd] transition-transform ${
                    settings.theme === 'sepia' ? 'scale-110 ring-1 ring-amber-800' : 'opacity-70'
                  }`}
                  title="سيبيا"
                />
                <button
                  onClick={() => onUpdateSettings({ theme: 'clean' })}
                  className={`w-5 h-5 rounded-md bg-white border border-stone-300 transition-transform ${
                    settings.theme === 'clean' ? 'scale-110 ring-1 ring-stone-900' : 'opacity-70'
                  }`}
                  title="أبيض"
                />
                <button
                  onClick={() => onUpdateSettings({ theme: 'midnight' })}
                  className={`w-5 h-5 rounded-md bg-[#212126] border border-[#313138] transition-transform ${
                    settings.theme === 'midnight' ? 'scale-110 ring-1 ring-amber-400' : 'opacity-70'
                  }`}
                  title="ليلي"
                />
              </div>

              {/* Zen Mode Button */}
              <button
                onClick={onOpenZen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                title="وضع التركيز الكامل الخالي من التشتيت (Zen Mode)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>وضع التركيز (Zen)</span>
              </button>
            </div>
          </div>

          {/* Active Search & Highlight Banner */}
          {activeSearchQuery && (
            <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-amber-900 font-semibold">
                  <Search className="w-3.5 h-3.5 text-amber-700" />
                  <span>بحث نشط في النص:</span>
                  <span className="font-novel-amiri bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded-md font-bold">
                    «{activeSearchQuery}»
                  </span>
                </div>

                <span className="text-stone-500 font-mono tabular-nums">
                  {matches.length > 0
                    ? `(تطابق ${currentMatchIndex + 1} من ${matches.length})`
                    : '(لا توجد تطابقات في هذا الفصل)'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {matches.length > 0 && (
                  <>
                    <button
                      onClick={() => jumpToMatch(currentMatchIndex - 1)}
                      className="px-2 py-1 rounded-md bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 flex items-center gap-1 transition-colors text-[11px] cursor-pointer"
                    >
                      <ChevronRight className="w-3 h-3" />
                      <span>السابق</span>
                    </button>
                    <button
                      onClick={() => jumpToMatch(currentMatchIndex + 1)}
                      className="px-2 py-1 rounded-md bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 flex items-center gap-1 transition-colors text-[11px] cursor-pointer"
                    >
                      <span>التالي</span>
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  </>
                )}

                {onClearSearch && (
                  <button
                    onClick={onClearSearch}
                    className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors mr-1 cursor-pointer"
                    title="إلغاء تمييز البحث"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Mentions Shelf (Quick lore chips in current chapter) */}
          {(mentionedEntities.chars.length > 0 || mentionedEntities.locations.length > 0) && (
            <div className="bg-stone-500/5 border-b border-stone-500/10 px-4 sm:px-6 py-1.5 flex items-center gap-2 overflow-x-auto text-xs select-none">
              <span className="text-[11px] font-semibold text-stone-500 shrink-0 flex items-center gap-1">
                <AtSign className="w-3 h-3 text-amber-600" />
                <span>شخصيات وأماكن الفصل:</span>
              </span>
              {mentionedEntities.chars.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setInspectedEntity({ type: 'character', data: c })}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white dark:bg-stone-800 border border-amber-400/50 text-stone-800 dark:text-stone-200 text-xs hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all shrink-0 cursor-pointer shadow-2xs font-medium"
                >
                  <User className="w-3 h-3 text-amber-600" />
                  <span>{c.name}</span>
                </button>
              ))}
              {mentionedEntities.locations.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setInspectedEntity({ type: 'world', data: w })}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white dark:bg-stone-800 border border-purple-400/50 text-stone-800 dark:text-stone-200 text-xs hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all shrink-0 cursor-pointer shadow-2xs font-medium"
                >
                  <MapPin className="w-3 h-3 text-purple-600" />
                  <span>{w.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Main Manuscript Paper Sheet Area */}
          <div className="flex-1 py-4 sm:py-8 px-2 sm:px-4 pb-24 md:pb-12 flex flex-col items-center relative">
            {/* Floating Selection Formatting Toolbar */}
            {selectionInfo && (
              <div className="sticky top-20 z-40 flex justify-center px-4 mb-4 animate-in fade-in pointer-events-none">
                <div className="pointer-events-auto bg-stone-900/95 dark:bg-stone-800/95 text-white shadow-2xl rounded-2xl px-3.5 py-2 flex items-center gap-2.5 border border-stone-700/60 backdrop-blur-md">
                  <span className="text-[11px] text-amber-300 font-medium px-1">تنسيق التحديد:</span>
                  <button
                    onClick={() => applyFormatting('**', '**')}
                    className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    title="خط عريض"
                  >
                    <Bold className="w-3.5 h-3.5 text-amber-400" />
                    <span>عريض</span>
                  </button>
                  <button
                    onClick={() => applyFormatting('*', '*')}
                    className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-xs italic transition-colors flex items-center gap-1 cursor-pointer"
                    title="خط مائل"
                  >
                    <Italic className="w-3.5 h-3.5 text-amber-400" />
                    <span>مائل</span>
                  </button>
                  <button
                    onClick={() => applyFormatting('<u>', '</u>')}
                    className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-xs underline transition-colors flex items-center gap-1 cursor-pointer"
                    title="تسطير"
                  >
                    <Underline className="w-3.5 h-3.5 text-amber-400" />
                    <span>تسطير</span>
                  </button>
                  <button
                    onClick={() => setSelectionInfo(null)}
                    className="p-1 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors mr-1 cursor-pointer"
                    title="إغلاق"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Manuscript Paper Container */}
            <div
              className={`w-full max-w-3xl rounded-xl sm:rounded-2xl border p-4 sm:p-8 md:p-14 transition-all duration-200 flex flex-col min-h-[80vh] relative ${
                settings.paperDarkMode
                  ? 'bg-[#121212] border-[#2a2a2a] text-[#E0E0E0]'
                  : themeStyles.page
              }`}
            >
              {/* Paper Top Navigation & Quick Collapse Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-500/15">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chapter.act || ''}
                    onChange={(e) => onUpdateChapter({ act: e.target.value })}
                    placeholder="الفصل / المشهد..."
                    className="text-xs font-semibold px-2.5 py-1 rounded-md bg-stone-500/10 border border-stone-500/15 focus:outline-hidden focus:border-amber-500"
                  />
                  <span className="text-xs text-stone-400 tabular-nums">({wordCount} كلمة)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenZen}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                    title="الانتقال إلى وضع التركيز الكامل"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>وضع التركيز</span>
                  </button>

                  <button
                    onClick={handleCollapse}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-500/10 transition-colors cursor-pointer"
                    title="طي والعودة إلى البطاقة المدمجة"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>طي المحرر</span>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <input
                type="text"
                value={chapter.title}
                onChange={(e) => onUpdateChapter({ title: e.target.value })}
                placeholder="عنوان الفصل..."
                className={`w-full font-bold text-xl sm:text-2xl mb-6 bg-transparent border-b border-stone-500/20 pb-2 focus:outline-hidden focus:border-amber-500 text-center ${getFontFamily(
                  settings.font
                )}`}
              />

              {/* Main Text Content Area */}
              <div
                className="flex-1 relative cursor-text"
                onClick={(e) => {
                  if (e.target === e.currentTarget && textareaRef.current) {
                    focusAtEnd(true);
                  }
                }}
              >
                <textarea
                  ref={textareaRef}
                  id="rawi-main-editor-textarea"
                  value={chapter.content}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                  onFocus={(e) => {
                    const len = e.currentTarget.value.length;
                    e.currentTarget.setSelectionRange(len, len);
                    scrollToBottom(true);
                  }}
                  onSelect={handleSelectionChange}
                  onMouseUp={handleSelectionChange}
                  onKeyUp={handleSelectionChange}
                  placeholder="ابدأ بكتابة السرد هنا... اكتب @ للإشارة إلى الشخصيات والأماكن مباشرة، أو استعن بمساعد السرد الذكي."
                  dir={settings.textDirection}
                  style={{
                    fontSize: `${settings.fontSize}px`,
                    lineHeight: settings.lineHeight,
                    textIndent: settings.firstLineIndent ? '2em' : '0',
                  }}
                  className={`w-full bg-transparent resize-none focus:outline-hidden text-justify ${
                    settings.paperDarkMode || settings.theme === 'midnight'
                      ? 'text-white dark:text-white placeholder:text-stone-400'
                      : 'text-stone-900 dark:text-white placeholder:text-stone-400'
                  } ${getFontFamily(settings.font)}`}
                />

                {/* Floating @Mentions Autocomplete Dropdown Popover */}
                {mentionQuery !== null && filteredMentions.length > 0 && (
                  <div className="absolute top-20 right-4 z-50 w-72 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
                    <div className="p-2.5 bg-stone-100 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-200">
                      <div className="flex items-center gap-1.5">
                        <AtSign className="w-3.5 h-3.5 text-amber-600" />
                        <span>إدراج شخصية أو مكان</span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-normal">Enter / Tab للاختيار</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                      {filteredMentions.map((m, idx) => {
                        const isSelected = idx === selectedMentionIndex;
                        return (
                          <div
                            key={m.type + m.title}
                            onClick={() => insertMention(m.title)}
                            onMouseEnter={() => setSelectedMentionIndex(idx)}
                            className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-600 text-white font-bold shadow-xs'
                                : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                                  m.type === 'character'
                                    ? isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-amber-500/20 text-amber-800'
                                    : isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-purple-500/20 text-purple-800'
                                }`}
                              >
                                {m.type === 'character' ? (
                                  <User className="w-3.5 h-3.5" />
                                ) : (
                                  <MapPin className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <span className="text-xs truncate">{m.title}</span>
                            </div>

                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                              }`}
                            >
                              {m.sub}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick AI Trigger Shelf at bottom of manuscript */}
              <div className="mt-8 pt-3 border-t border-stone-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 select-none">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap max-w-full">
                  <span className="text-[10px] font-semibold opacity-60 shrink-0 ml-1">إلهام سريع:</span>

                  <button
                    onClick={() => onOpenAIAssist('continue_scene')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-700/10 hover:bg-amber-700/20 text-amber-900 dark:text-amber-300 text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                    <span>أكمل المشهد</span>
                  </button>

                  <button
                    onClick={() => onOpenAIAssist('enhance_prose')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-700/10 hover:bg-emerald-700/20 text-emerald-900 dark:text-emerald-300 text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
                  >
                    <Eye className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                    <span>إثراء حسي</span>
                  </button>

                  <button
                    onClick={() => onOpenAIAssist('critique_chapter')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-700/10 hover:bg-purple-700/20 text-purple-900 dark:text-purple-300 text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
                  >
                    <Compass className="w-3 h-3 text-purple-700 dark:text-purple-400" />
                    <span>نقد أدبي</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 shrink-0 justify-end">
                  <button
                    onClick={handleCollapse}
                    className="text-amber-700 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>طي المحرر</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. ENTITY QUICK-INSPECT POPOVER CARD MODAL */}
      {/* ------------------------------------------------------------- */}
      {inspectedEntity && (
        <div
          className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 select-none"
          onClick={() => setInspectedEntity(null)}
        >
          <div
            className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[85vh] overflow-y-auto text-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Icon & Type */}
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-xs ${
                    inspectedEntity.type === 'character' ? 'bg-amber-600' : 'bg-purple-600'
                  }`}
                >
                  {inspectedEntity.type === 'character' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <MapPin className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg font-novel-amiri text-stone-900 dark:text-stone-100">
                    {inspectedEntity.type === 'character'
                      ? (inspectedEntity.data as Character).name
                      : (inspectedEntity.data as WorldNote).title}
                  </h3>
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    {inspectedEntity.type === 'character'
                      ? `${(inspectedEntity.data as Character).archetype || 'شخصية'} · ${(inspectedEntity.data as Character).role}`
                      : `عالم الرواية · ${(inspectedEntity.data as WorldNote).category}`}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setInspectedEntity(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body: Character Lore Details */}
            {inspectedEntity.type === 'character' && (
              <div className="space-y-3 text-xs">
                {/* Goals & Internal Need */}
                {((inspectedEntity.data as Character).externalGoal ||
                  (inspectedEntity.data as Character).internalNeed) && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                    {(inspectedEntity.data as Character).externalGoal && (
                      <div>
                        <span className="font-bold text-amber-900 dark:text-amber-300 block">
                          🎯 الهدف الخارجي الملموس:
                        </span>
                        <p className="text-stone-700 dark:text-stone-300">
                          {(inspectedEntity.data as Character).externalGoal}
                        </p>
                      </div>
                    )}
                    {(inspectedEntity.data as Character).internalNeed && (
                      <div>
                        <span className="font-bold text-amber-900 dark:text-amber-300 block">
                          🌱 الحاجة الداخلية / الجرح:
                        </span>
                        <p className="text-stone-700 dark:text-stone-300">
                          {(inspectedEntity.data as Character).internalNeed}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Fatal Flaw & Voice */}
                {(inspectedEntity.data as Character).fatalFlaw && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <span className="font-bold text-rose-800 dark:text-rose-300 block mb-0.5">
                      ⚡ نقطة الضعف القاتلة:
                    </span>
                    <p className="text-stone-700 dark:text-stone-300">
                      {(inspectedEntity.data as Character).fatalFlaw}
                    </p>
                  </div>
                )}

                {(inspectedEntity.data as Character).voiceAndQuirks && (
                  <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800">
                    <span className="font-bold text-stone-800 dark:text-stone-200 block mb-0.5">
                      🗣️ نبرة الصوت وطريقة الحوار:
                    </span>
                    <p className="text-stone-600 dark:text-stone-300">
                      {(inspectedEntity.data as Character).voiceAndQuirks}
                    </p>
                  </div>
                )}

                {/* Backstory */}
                {(inspectedEntity.data as Character).backstory && (
                  <div>
                    <span className="font-bold text-stone-800 dark:text-stone-200 block mb-1">
                      📜 الخلفية والماضي:
                    </span>
                    <p className="text-stone-600 dark:text-stone-300 leading-relaxed font-novel-amiri text-sm p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                      {(inspectedEntity.data as Character).backstory}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Body: World Location Lore Details */}
            {inspectedEntity.type === 'world' && (
              <div className="space-y-3 text-xs">
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-novel-amiri text-sm p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                  {(inspectedEntity.data as WorldNote).content}
                </p>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={() => {
                  const title =
                    inspectedEntity.type === 'character'
                      ? (inspectedEntity.data as Character).name
                      : (inspectedEntity.data as WorldNote).title;
                  insertTextAtCursor(`@${title} `);
                  setInspectedEntity(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إدراج في موضع المؤشر</span>
              </button>

              <button
                onClick={() => setInspectedEntity(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
