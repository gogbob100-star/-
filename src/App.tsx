import React, { useState, useEffect, useRef } from 'react';
import { CheckCheck } from 'lucide-react';
import { Novel, Chapter, Character, WorldNote, PlotBeat, EditorSettings, ChapterSnapshot } from './types/novel';
import { INITIAL_NOVEL } from './data/initialNovel';
import { Navbar, ActiveTab } from './components/Navbar';
import { ChapterSidebar } from './components/ChapterSidebar';
import { EditorView } from './components/EditorView';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { CharacterBible } from './components/CharacterBible';
import { WorldBuildingView } from './components/WorldBuildingView';
import { PlotOutlinerView } from './components/PlotOutlinerView';
import { ExportModal } from './components/ExportModal';
import { ZenModeModal } from './components/ZenModeModal';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { NovelSearchModal } from './components/NovelSearchModal';
import { ProofreadDrawer } from './components/ProofreadDrawer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ChapterHistoryModal } from './components/ChapterHistoryModal';
import { PomodoroWidget } from './components/PomodoroWidget';
import { CreativePromptWidget } from './components/CreativePromptWidget';
import { ChapterTemplatesModal } from './components/ChapterTemplatesModal';
import { StoryWorldDrawer } from './components/StoryWorldDrawer';
import { ChapterOutlinerModal } from './components/ChapterOutlinerModal';
import { AuthModal } from './components/AuthModal';
import { GuestBanner } from './components/GuestBanner';
import { ToastNotification, ToastType } from './components/ToastNotification';
import {
  saveNovelToFirestore,
  loadNovelFromFirestore,
  saveChapterSnapshotToFirestore,
  auth,
  onAuthStateChanged,
  FirebaseUser,
} from './services/firebase';
import { enqueueOfflineChange, processOfflineQueue } from './services/offlineSyncService';
import { playSound } from './services/soundService';

const STORAGE_KEY_NOVEL = 'rawi_current_novel_v1';
const STORAGE_KEY_SETTINGS = 'rawi_editor_settings_v1';

export default function App() {
  // Load novel from LocalStorage or fall back to rich sample novel
  const [novel, setNovel] = useState<Novel>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOVEL);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title && Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_NOVEL;
  });

  // Current active chapter ID
  const [currentChapterId, setCurrentChapterId] = useState<string>(() => {
    return novel.chapters[0]?.id || 'ch-01';
  });

  // Active view tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('editor');

  // Active search highlight query for editor
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');

  // Editor settings
  const [settings, setSettings] = useState<EditorSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      theme: 'paper',
      font: 'amiri',
      fontSize: 18,
      lineHeight: 2.1,
      firstLineIndent: true,
      typewriterSounds: false,
      textDirection: 'rtl',
      notifications: {
        toastEnabled: true,
        soundEnabled: true,
        autoSaveNotifications: false,
      },
    };
  });

  // Auth & Guest Mode State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    try {
      if (auth && typeof onAuthStateChanged === 'function') {
        const unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            setCurrentUser(user);
          },
          (err) => {
            console.warn('Auth listener notification:', err);
          }
        );
        return () => unsubscribe();
      }
    } catch (e) {
      console.warn('Auth subscription skipped:', e);
    }
  }, []);

  // Modals & Panels state
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isZenModeOpen, setIsZenModeOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProofreadOpen, setIsProofreadOpen] = useState(false);
  const [isMobileChapterDrawerOpen, setIsMobileChapterDrawerOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isWorldDrawerOpen, setIsWorldDrawerOpen] = useState(false);
  const [isChapterOutlinerOpen, setIsChapterOutlinerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    if (settings.notifications?.toastEnabled !== false) {
      setToast({ message, type });
    }
    if (settings.notifications?.soundEnabled !== false) {
      playSound(
        type === 'save'
          ? 'save'
          : type === 'export'
          ? 'export'
          : type === 'success'
          ? 'success'
          : type === 'delete'
          ? 'delete'
          : 'action'
      );
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Night / Dark Mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rawi_dark_mode');
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return false;
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rawi_dark_mode', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Cloud Database Sync state
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'saving' | 'error' | 'offline'>('synced');

  // Offline / Online Queue Sync Listener
  useEffect(() => {
    const handleOnline = async () => {
      setCloudSyncStatus('saving');
      try {
        const syncedCount = await processOfflineQueue(saveNovelToFirestore);
        if (syncedCount > 0) {
          showToast(`تمت مزامنة ${syncedCount} من التعديلات المعلقة مع سحاب Firebase بنجاح`, 'success');
        }
        setCloudSyncStatus('synced');
      } catch {
        setCloudSyncStatus('offline');
      }
    };

    const handleOffline = () => {
      setCloudSyncStatus('offline');
      showToast('انقطع الاتصال بالإنترنت - يتم تخزين التعديلات في طابور الانتظار المحلي', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setCloudSyncStatus('offline');
    } else {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Debounced cloud save to Firestore whenever novel changes (with offline queue fallback)
  useEffect(() => {
    setCloudSyncStatus('saving');
    const timer = setTimeout(async () => {
      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          throw new Error('Offline');
        }
        await saveNovelToFirestore(novel);
        setCloudSyncStatus('synced');
        if (settings.notifications?.autoSaveNotifications) {
          showToast('تم الحفظ التلقائي بنجاح', 'save');
        }
      } catch (err) {
        await enqueueOfflineChange(novel);
        setCloudSyncStatus('offline');
        showToast('وضع غير متصل - تم حفظ التعديلات في طابور الانتظار المحلي (IndexedDB)', 'info');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [novel, settings.notifications?.autoSaveNotifications]);

  // Initial cloud check
  useEffect(() => {
    async function loadCloud() {
      try {
        const cloudData = await loadNovelFromFirestore(novel.id);
        if (cloudData && cloudData.updatedAt && new Date(cloudData.updatedAt) > new Date(novel.updatedAt)) {
          setNovel(cloudData);
        } else if (!cloudData) {
          await saveNovelToFirestore(novel);
        }
      } catch (err) {
        console.warn('Initial cloud sync check:', err);
      }
    }
    loadCloud();
  }, []);

  const handleManualCloudSync = async () => {
    setCloudSyncStatus('saving');
    try {
      await saveNovelToFirestore(novel);
      setCloudSyncStatus('synced');
    } catch (err) {
      setCloudSyncStatus('offline');
    }
  };

  // Keyboard shortcut listener for Ctrl+K / Ctrl+F (or Cmd+K / Cmd+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOVEL, JSON.stringify(novel));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
  }, [novel]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.warn('LocalStorage settings save failed:', err);
    }
  }, [settings]);

  // Current Chapter helper
  const currentChapter =
    novel.chapters.find((c) => c.id === currentChapterId) || novel.chapters[0];

  // Periodic background auto-snapshot for the active chapter in Firestore
  const lastSnapshotContentRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!currentChapter || !currentChapter.content || !currentChapter.content.trim()) return;

    if (!lastSnapshotContentRef.current[currentChapter.id]) {
      lastSnapshotContentRef.current[currentChapter.id] = currentChapter.content;
    }

    // Every 3 minutes, if content has evolved, save a periodic snapshot to Firestore
    const interval = setInterval(async () => {
      const lastSaved = lastSnapshotContentRef.current[currentChapter.id];
      const currentText = currentChapter.content;

      if (currentText && currentText.trim().length > 0 && currentText !== lastSaved) {
        const words = currentText.trim().split(/\s+/).length;
        const autoSnap: ChapterSnapshot = {
          id: `snap-auto-${Date.now()}`,
          novelId: novel.id,
          chapterId: currentChapter.id,
          chapterTitle: currentChapter.title || 'فصل بدون عنوان',
          content: currentText,
          wordsCount: words,
          createdAt: new Date().toISOString(),
          label: 'نسخة دورية تلقائية',
          type: 'auto',
        };

        try {
          await saveChapterSnapshotToFirestore(autoSnap);
          lastSnapshotContentRef.current[currentChapter.id] = currentText;
        } catch (err) {
          console.warn('Auto chapter snapshot sync:', err);
        }
      }
    }, 180000); // 3 minutes

    return () => clearInterval(interval);
  }, [currentChapter?.id, currentChapter?.content, novel.id]);

  // Chapter Operations
  const handleUpdateChapter = (updated: Partial<Chapter>) => {
    setNovel((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      chapters: prev.chapters.map((ch) =>
        ch.id === currentChapterId ? { ...ch, ...updated, updatedAt: new Date().toISOString() } : ch
      ),
    }));
  };

  const handleAddChapter = () => {
    setIsTemplatesModalOpen(true);
  };

  const handleSelectTemplate = (template: { title: string; content: string; act: string }) => {
    const newOrder = novel.chapters.length + 1;
    const newId = `ch-${Date.now()}`;
    const newChapter: Chapter = {
      id: newId,
      title: `الفصل ${newOrder}: ${template.title}`,
      act: template.act || currentChapter?.act || 'الجزء الأول',
      content: template.content,
      synopsis: '',
      status: 'draft',
      targetWords: 2500,
      order: newOrder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNovel((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      chapters: [...prev.chapters, newChapter],
    }));
    setCurrentChapterId(newId);
  };

  const handleDeleteChapter = (id: string) => {
    if (novel.chapters.length <= 1) return;
    const remaining = novel.chapters.filter((ch) => ch.id !== id);
    setNovel((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      chapters: remaining,
    }));
    if (currentChapterId === id) {
      setCurrentChapterId(remaining[0].id);
    }
  };

  const handleDuplicateChapter = (id: string) => {
    const ch = novel.chapters.find((c) => c.id === id);
    if (!ch) return;

    const newId = `ch-${Date.now()}`;
    const duplicated: Chapter = {
      ...ch,
      id: newId,
      title: `${ch.title} (نسخة)`,
      order: ch.order + 0.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newChapters = [...novel.chapters, duplicated]
      .sort((a, b) => a.order - b.order)
      .map((item, idx) => ({ ...item, order: idx + 1 }));

    setNovel((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      chapters: newChapters,
    }));
    setCurrentChapterId(newId);
  };

  const handleMoveChapter = (id: string, direction: 'up' | 'down') => {
    const sorted = [...novel.chapters].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((c) => c.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = sorted[index];
      sorted[index] = sorted[index - 1];
      sorted[index - 1] = temp;
    } else if (direction === 'down' && index < sorted.length - 1) {
      const temp = sorted[index];
      sorted[index] = sorted[index + 1];
      sorted[index + 1] = temp;
    }

    const reordered = sorted.map((ch, idx) => ({ ...ch, order: idx + 1 }));
    setNovel((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      chapters: reordered,
    }));
  };

  const handleInsertText = (text: string) => {
    if (!currentChapter) return;
    const current = currentChapter.content || '';
    const trimmed = current.trimEnd();
    const separator = trimmed.length > 0 ? '\n\n' : '';
    const newContent = trimmed + separator + text.trim();

    handleUpdateChapter({
      content: newContent,
    });

    // Close the AI assistant drawer
    setIsAIAssistantOpen(false);

    // Make sure we are on the editor tab
    setActiveTab('editor');

    // Show toast notification
    showToast('تم إدراج النص في نهاية الفصل بنجاح');

    // Transfer focus and cursor to the end of the newly inserted text
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('rawi-focus-editor-end'));
      const textarea = document.getElementById('rawi-main-editor-textarea') as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.focus();
        const len = textarea.value.length;
        textarea.setSelectionRange(len, len);
        textarea.scrollTop = textarea.scrollHeight;
      }
    }, 120);
  };

  const handleResetToSample = () => {
    setNovel(INITIAL_NOVEL);
    setCurrentChapterId('ch-01');
    setActiveSearchQuery('');
  };

  const handleCreateNewNovel = () => {
    const blankNovel: Novel = {
      id: `novel-${Date.now()}`,
      title: '',
      subtitle: '',
      author: '',
      genre: '',
      synopsis: '',
      targetWordCount: 50000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters: [
        {
          id: `ch-${Date.now()}`,
          title: 'الفصل الأول',
          act: '',
          content: '',
          synopsis: '',
          status: 'draft',
          targetWords: 2000,
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      characters: [],
      worldNotes: [],
      plotBeats: [],
    };
    setNovel(blankNovel);
    setCurrentChapterId(blankNovel.chapters[0].id);
    setActiveSearchQuery('');
    setActiveTab('editor');
    setIsSettingsModalOpen(false);
  };

  // Jump to specific search match
  const handleSelectSearchMatch = (chapterId: string, charIndex: number, query: string) => {
    setActiveTab('editor');
    setCurrentChapterId(chapterId);
    setActiveSearchQuery(query);
  };

  // Batch Replace across novel or in specific chapter
  const handleBatchReplace = (searchTerm: string, replaceTerm: string, targetChapterId?: string) => {
    if (!searchTerm.trim()) return;

    setNovel((prev) => {
      const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapeRegExp(searchTerm), 'g');

      const updatedChapters = prev.chapters.map((ch) => {
        if (targetChapterId && ch.id !== targetChapterId) return ch;

        return {
          ...ch,
          title: ch.title.replace(regex, replaceTerm),
          content: ch.content.replace(regex, replaceTerm),
          synopsis: ch.synopsis ? ch.synopsis.replace(regex, replaceTerm) : ch.synopsis,
          updatedAt: new Date().toISOString(),
        };
      });

      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        chapters: updatedChapters,
      };
    });

    if (activeSearchQuery === searchTerm) {
      setActiveSearchQuery(replaceTerm);
    }
  };

  // Proofreading corrections
  const handleApplyCorrection = (original: string, replacement: string) => {
    if (!currentChapter || !original) return;
    const content = currentChapter.content || '';
    const newContent = content.replace(original, replacement);
    handleUpdateChapter({ content: newContent });
  };

  const handleApplyAllCorrections = (corrections: Array<{ original: string; replacement: string }>) => {
    if (!currentChapter || corrections.length === 0) return;
    let newContent = currentChapter.content || '';
    for (const c of corrections) {
      if (c.original && c.replacement) {
        newContent = newContent.replace(c.original, c.replacement);
      }
    }
    handleUpdateChapter({ content: newContent });
  };

  const totalWords = novel.chapters.reduce((sum, ch) => {
    return sum + (ch.content.trim() ? ch.content.trim().split(/\s+/).length : 0);
  }, 0);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans select-none overflow-hidden transition-colors ${
        isDarkMode ? 'dark bg-stone-950 text-stone-100' : 'bg-stone-100 text-stone-900'
      }`}
      dir="rtl"
    >
      {/* Top Navbar */}
      <Navbar
        novel={novel}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenZen={() => setIsZenModeOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onOpenChapterOutliner={() => setIsChapterOutlinerOpen(true)}
        onOpenWorldDrawer={() => setIsWorldDrawerOpen(true)}
        onToggleAIAssistant={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
        isAIAssistantOpen={isAIAssistantOpen}
        totalWords={totalWords}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        cloudSyncStatus={cloudSyncStatus}
        onManualCloudSync={handleManualCloudSync}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Guest Mode Reminder Banner */}
      {!currentUser && (
        <GuestBanner onOpenAuth={() => setIsAuthModalOpen(true)} isDarkMode={isDarkMode} />
      )}

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeTab === 'editor' && (
          <>
            {/* Chapters Sidebar on Right (in RTL) */}
            <ChapterSidebar
              chapters={novel.chapters}
              currentChapterId={currentChapterId}
              onSelectChapter={(id) => setCurrentChapterId(id)}
              onAddChapter={handleAddChapter}
              onDeleteChapter={handleDeleteChapter}
              onDuplicateChapter={handleDuplicateChapter}
              onMoveChapter={handleMoveChapter}
              onOpenChapterOutliner={() => setIsChapterOutlinerOpen(true)}
              isOpenOnMobile={isMobileChapterDrawerOpen}
              onCloseMobile={() => setIsMobileChapterDrawerOpen(false)}
              onQuickAIOutline={() => {
                setActiveTab('plot');
              }}
            />

            {/* Central Manuscript Editor */}
            {currentChapter ? (
              <EditorView
                chapter={currentChapter}
                characters={novel.characters}
                worldNotes={novel.worldNotes || []}
                relationships={novel.relationships || []}
                plotBeats={novel.plotBeats || []}
                allChapters={novel.chapters || []}
                settings={settings}
                activeSearchQuery={activeSearchQuery}
                cloudSyncStatus={cloudSyncStatus}
                onUpdateChapter={handleUpdateChapter}
                onUpdateSettings={(newSettings) =>
                  setSettings((prev) => ({ ...prev, ...newSettings }))
                }
                onOpenAIAssist={(mode) => {
                  setIsAIAssistantOpen(true);
                  setIsProofreadOpen(false);
                }}
                onOpenZen={() => setIsZenModeOpen(true)}
                onOpenSearch={() => setIsSearchModalOpen(true)}
                onClearSearch={() => setActiveSearchQuery('')}
                onOpenProofread={() => {
                  setIsProofreadOpen(!isProofreadOpen);
                  setIsAIAssistantOpen(false);
                }}
                isProofreadOpen={isProofreadOpen}
                onOpenHistory={() => setIsHistoryModalOpen(true)}
                onOpenPomodoro={() => setIsPomodoroOpen(true)}
                onOpenPrompt={() => setIsPromptOpen(true)}
                onOpenWorldDrawer={() => setIsWorldDrawerOpen(true)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-stone-500">
                لم يتم اختيار فصل
              </div>
            )}

            {/* Proofread Drawer on Left (in RTL) */}
            <ProofreadDrawer
              isOpen={isProofreadOpen}
              onClose={() => setIsProofreadOpen(false)}
              chapter={currentChapter}
              onApplyCorrection={handleApplyCorrection}
              onApplyAllCorrections={handleApplyAllCorrections}
            />

            {/* AI Assistant Drawer on Left (in RTL) */}
            <AIAssistantDrawer
              isOpen={isAIAssistantOpen}
              onClose={() => setIsAIAssistantOpen(false)}
              novel={novel}
              currentChapter={currentChapter}
              onInsertText={handleInsertText}
            />
          </>
        )}

        {activeTab === 'characters' && (
          <CharacterBible
            novel={novel}
            onUpdateCharacters={(characters) =>
              setNovel((prev) => ({ ...prev, characters, updatedAt: new Date().toISOString() }))
            }
            onUpdateRelationships={(relationships) =>
              setNovel((prev) => ({ ...prev, relationships, updatedAt: new Date().toISOString() }))
            }
          />
        )}

        {activeTab === 'world' && (
          <WorldBuildingView
            novel={novel}
            onUpdateNotes={(worldNotes) =>
              setNovel((prev) => ({ ...prev, worldNotes, updatedAt: new Date().toISOString() }))
            }
          />
        )}

        {activeTab === 'plot' && (
          <PlotOutlinerView
            novel={novel}
            onUpdateBeats={(plotBeats) =>
              setNovel((prev) => ({ ...prev, plotBeats, updatedAt: new Date().toISOString() }))
            }
          />
        )}
      </main>

      {/* Smart Novel Search Modal */}
      <NovelSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        novel={novel}
        onSelectMatch={handleSelectSearchMatch}
        onBatchReplace={handleBatchReplace}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        novel={novel}
        currentChapter={currentChapter}
        onImportNovel={(imported) => {
          setNovel(imported);
          if (imported.chapters[0]) {
            setCurrentChapterId(imported.chapters[0].id);
          }
        }}
      />

      {currentChapter && (
        <ZenModeModal
          isOpen={isZenModeOpen}
          onClose={() => setIsZenModeOpen(false)}
          chapter={currentChapter}
          characters={novel.characters || []}
          worldNotes={novel.worldNotes || []}
          relationships={novel.relationships || []}
          settings={settings}
          onUpdateChapter={handleUpdateChapter}
          onUpdateSettings={(newSettings) =>
            setSettings((prev) => ({ ...prev, ...newSettings }))
          }
        />
      )}

      <ProjectSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        novel={novel}
        settings={settings}
        onUpdateSettings={(newSettings) =>
          setSettings((prev) => ({ ...prev, ...newSettings }))
        }
        onUpdateNovel={(updated) => {
          setNovel((prev) => ({ ...prev, ...updated }));
          showToast('تم تحديث بيانات الرواية بنجاح', 'success');
        }}
        onResetToSample={handleResetToSample}
        onCreateNewNovel={handleCreateNewNovel}
      />

      {/* Auth & Guest Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onContinueAsGuest={() => {
          setIsAuthModalOpen(false);
        }}
        onSyncCurrentNovelToCloud={handleManualCloudSync}
        onShowToast={(msg, type) => showToast(msg, type)}
      />

      {/* Chapter Version History Modal */}
      {currentChapter && (
        <ChapterHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          chapter={currentChapter}
          novelId={novel.id}
          onUpdateChapter={handleUpdateChapter}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Pomodoro Focus Timer Modal */}
      <PomodoroWidget
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
        isDarkMode={isDarkMode}
        novelId={novel.id}
      />

      {/* Creative Prompt Widget */}
      <CreativePromptWidget
        isOpen={isPromptOpen}
        onClose={() => setIsPromptOpen(false)}
        onInsertPrompt={(text) => {
          handleInsertText(text);
        }}
        isDarkMode={isDarkMode}
      />

      {/* Chapter Templates Modal */}
      <ChapterTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Story World Quick Cards Drawer */}
      <StoryWorldDrawer
        isOpen={isWorldDrawerOpen}
        onClose={() => setIsWorldDrawerOpen(false)}
        novel={novel}
        onUpdateCharacters={(characters) =>
          setNovel((prev) => ({ ...prev, characters, updatedAt: new Date().toISOString() }))
        }
        onUpdateNotes={(worldNotes) =>
          setNovel((prev) => ({ ...prev, worldNotes, updatedAt: new Date().toISOString() }))
        }
        onInsertTextAtCursor={(text) => {
          handleInsertText(text);
        }}
      />

      {/* Chapter Outlining & Drag & Drop Reordering Board Modal */}
      <ChapterOutlinerModal
        isOpen={isChapterOutlinerOpen}
        onClose={() => setIsChapterOutlinerOpen(false)}
        novel={novel}
        onUpdateChapters={(chapters) =>
          setNovel((prev) => ({ ...prev, chapters, updatedAt: new Date().toISOString() }))
        }
        onSelectChapter={(id) => {
          setCurrentChapterId(id);
          setActiveTab('editor');
        }}
        onAddChapter={handleAddChapter}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileChapterDrawerOpen(false);
        }}
        onToggleChapterDrawer={() => setIsMobileChapterDrawerOpen(!isMobileChapterDrawerOpen)}
        isChapterDrawerOpen={isMobileChapterDrawerOpen}
        onToggleAIAssistant={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
        isAIAssistantOpen={isAIAssistantOpen}
        isDarkMode={isDarkMode}
        chaptersCount={novel.chapters.length}
        onOpenExport={() => setIsExportModalOpen(true)}
        cloudSyncStatus={cloudSyncStatus}
      />

      {/* Global Animated Toast Notification */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
