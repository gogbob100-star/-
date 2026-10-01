export interface ChapterVersion {
  id: string;
  timestamp: string;
  content: string;
  title: string;
}

export interface Chapter {
  id: string;
  title: string;
  act: string; // e.g. "الجزء الأول" or "الفصل التمهيدي"
  content: string;
  synopsis: string;
  status: 'draft' | 'revising' | 'completed';
  targetWords: number;
  order: number;
  tags?: string[]; // e.g. ["حواري", "وصفي", "درامي"]
  notes?: string;
  versions?: ChapterVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  age?: string;
  archetype: string;
  externalGoal: string; // الهدف الخارجي الملموس
  internalNeed: string; // الحاجة الداخلية / الجرح القديم
  fatalFlaw: string; // نقطة الضعف / العيب القاتل
  voiceAndQuirks: string; // طريقة الحوار ونبرة الصوت
  backstory: string; // الخلفية
  color: string;
  linkedChapterIds?: string[]; // ربط الشخصية بفصول معينة
  linkedPlotBeatIds?: string[]; // ربط الشخصية بنقاط تحول الحبكة
  relationshipTypeWithProtagonist?: RelationshipType; // نوع العلاقة
}

export type RelationshipType =
  | 'friend'
  | 'enemy'
  | 'family'
  | 'mentor'
  | 'rival'
  | 'love'
  | 'secret';

export interface CharacterRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  label: string;
  notes?: string;
}

export interface WorldNote {
  id: string;
  title: string;
  category: 'location' | 'lore' | 'timeline' | 'rules' | 'research';
  content: string;
  updatedAt: string;
}

export interface PlotBeat {
  id: string;
  title: string;
  act: 'act1' | 'act2a' | 'act2b' | 'act3';
  description: string;
  resolved: boolean;
  linkedChapterId?: string;
}

export interface Novel {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  genre: string;
  synopsis: string;
  targetWordCount: number;
  coverImage?: string;
  chapters: Chapter[];
  characters: Character[];
  relationships?: CharacterRelationship[];
  worldNotes: WorldNote[];
  plotBeats: PlotBeat[];
  createdAt: string;
  updatedAt: string;
}

export interface PomodoroSession {
  id: string;
  novelId?: string;
  durationMinutes: number;
  completedAt: string;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface ChapterSnapshot {
  id: string;
  novelId: string;
  chapterId: string;
  chapterTitle: string;
  content: string;
  wordsCount: number;
  createdAt: string;
  label?: string;
  type: 'auto' | 'manual';
}

export type EditorTheme = 'paper' | 'midnight' | 'sepia' | 'clean';
export type NovelFont = 'amiri' | 'scheherazade' | 'cairo';

export interface NotificationSettings {
  toastEnabled: boolean; // الإشعارات المنبثقة
  soundEnabled: boolean; // التنبيهات الصوتية
  autoSaveNotifications: boolean; // إشعارات الحفظ التلقائي
}

export interface EditorSettings {
  theme: EditorTheme;
  font: NovelFont;
  fontSize: number; // in px: 16 to 26
  lineHeight: number; // 1.6 to 2.4
  firstLineIndent: boolean;
  typewriterSounds: boolean;
  textDirection: 'rtl' | 'ltr';
  paperDarkMode?: boolean;
  notifications?: NotificationSettings;
}
