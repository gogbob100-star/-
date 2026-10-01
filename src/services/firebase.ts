import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  setLogLevel,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { Novel, PomodoroSession, ChapterSnapshot } from '../types/novel';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth safely
let authInstance: ReturnType<typeof getAuth>;
try {
  authInstance = getAuth(app);
} catch {
  authInstance = {} as any;
}
export const auth = authInstance;
export type { FirebaseUser };
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
};

// Set SDK log level to silent to prevent internal network log spam
setLogLevel('silent');

// Intercept console.error and console.warn to suppress internal Firestore offline/connection log messages
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: any[]) => {
    if (
      args.some(
        (arg) =>
          typeof arg === 'string' &&
          (arg.includes('Could not reach Cloud Firestore backend') ||
            arg.includes('@firebase/firestore'))
      )
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    if (
      args.some(
        (arg) =>
          typeof arg === 'string' &&
          (arg.includes('Could not reach Cloud Firestore backend') ||
            arg.includes('@firebase/firestore'))
      )
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Initialize Firestore with local persistence cache enabled
export const db = firebaseConfig.firestoreDatabaseId
  ? initializeFirestore(app, { localCache: persistentLocalCache({}) }, firebaseConfig.firestoreDatabaseId)
  : initializeFirestore(app, { localCache: persistentLocalCache({}) });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
    },
    operationType,
    path,
  };
  // Log formatted notice without triggering app failure
  if (process.env.NODE_ENV === 'development') {
    console.info('Firestore Notice:', errInfo.error);
  }
}

// Save Novel to Firestore
export async function saveNovelToFirestore(novel: Novel): Promise<void> {
  if (!novel || !novel.id) return;
  const path = `novels/${novel.id}`;
  try {
    const novelRef = doc(db, 'novels', novel.id);
    const payload = {
      ...novel,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(novelRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Load Novel from Firestore
export async function loadNovelFromFirestore(novelId: string): Promise<Novel | null> {
  if (!novelId) return null;
  const path = `novels/${novelId}`;
  try {
    const novelRef = doc(db, 'novels', novelId);
    const snap = await getDoc(novelRef);
    if (snap.exists()) {
      return snap.data() as Novel;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
  return null;
}

// Subscribe to real-time changes
export function subscribeToNovelFromFirestore(
  novelId: string,
  onUpdate: (novel: Novel) => void,
  onError?: (err: Error) => void
) {
  if (!novelId) return () => {};
  const path = `novels/${novelId}`;
  const novelRef = doc(db, 'novels', novelId);
  return onSnapshot(
    novelRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as Novel);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
      if (onError) onError(err);
    }
  );
}

// -------------------------------------------------------------
// Pomodoro Sessions Firestore Integration
// -------------------------------------------------------------

const LOCAL_STORAGE_POMODORO_KEY = 'rawi_pomodoro_sessions';

// Helper to get local sessions
function getLocalPomodoroSessions(): PomodoroSession[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_POMODORO_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

// Helper to save local sessions
function saveLocalPomodoroSessions(sessions: PomodoroSession[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_POMODORO_KEY, JSON.stringify(sessions));
  } catch {}
}

// Save a completed Pomodoro session to Firestore
export async function savePomodoroSessionToFirestore(session: PomodoroSession): Promise<void> {
  if (!session || !session.id) return;

  // Optimistically cache locally
  const current = getLocalPomodoroSessions();
  const exists = current.some((s) => s.id === session.id);
  if (!exists) {
    saveLocalPomodoroSessions([session, ...current]);
  }

  const path = `pomodoroSessions/${session.id}`;
  try {
    const sessionRef = doc(db, 'pomodoroSessions', session.id);
    await setDoc(sessionRef, session, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Load Pomodoro sessions from Firestore with local fallback
export async function loadPomodoroSessionsFromFirestore(): Promise<PomodoroSession[]> {
  const path = 'pomodoroSessions';
  try {
    const sessionsCol = collection(db, 'pomodoroSessions');
    const q = query(sessionsCol, orderBy('completedAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const items: PomodoroSession[] = [];
      snap.forEach((docSnap) => {
        items.push(docSnap.data() as PomodoroSession);
      });
      // Sync local cache
      saveLocalPomodoroSessions(items);
      return items;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
  return getLocalPomodoroSessions();
}

// Subscribe in real-time to Pomodoro sessions from Firestore
export function subscribeToPomodoroSessions(
  onUpdate: (sessions: PomodoroSession[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'pomodoroSessions';
  try {
    const sessionsCol = collection(db, 'pomodoroSessions');
    const q = query(sessionsCol, orderBy('completedAt', 'desc'), limit(100));
    return onSnapshot(
      q,
      (snap) => {
        const items: PomodoroSession[] = [];
        snap.forEach((docSnap) => {
          items.push(docSnap.data() as PomodoroSession);
        });
        saveLocalPomodoroSessions(items);
        onUpdate(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, path);
        // Fallback to local
        onUpdate(getLocalPomodoroSessions());
        if (onError) onError(err);
      }
    );
  } catch (err) {
    onUpdate(getLocalPomodoroSessions());
    return () => {};
  }
}

// -------------------------------------------------------------
// Chapter Periodic Snapshots Firestore Integration
// -------------------------------------------------------------

const LOCAL_STORAGE_SNAPSHOTS_PREFIX = 'rawi_chapter_snapshots_';

function getLocalChapterSnapshots(chapterId: string): ChapterSnapshot[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SNAPSHOTS_PREFIX + chapterId);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLocalChapterSnapshots(chapterId: string, snapshots: ChapterSnapshot[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SNAPSHOTS_PREFIX + chapterId, JSON.stringify(snapshots.slice(0, 30)));
  } catch {}
}

// Save a Chapter Snapshot to Firestore
export async function saveChapterSnapshotToFirestore(snapshot: ChapterSnapshot): Promise<void> {
  if (!snapshot || !snapshot.id || !snapshot.chapterId) return;

  // Optimistically cache locally
  const current = getLocalChapterSnapshots(snapshot.chapterId);
  const exists = current.some((s) => s.id === snapshot.id);
  if (!exists) {
    saveLocalChapterSnapshots(snapshot.chapterId, [snapshot, ...current]);
  }

  const path = `chapterSnapshots/${snapshot.id}`;
  try {
    const snapRef = doc(db, 'chapterSnapshots', snapshot.id);
    await setDoc(snapRef, snapshot, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Load Chapter Snapshots from Firestore with local fallback
export async function loadChapterSnapshotsFromFirestore(chapterId: string): Promise<ChapterSnapshot[]> {
  if (!chapterId) return [];
  const path = 'chapterSnapshots';
  try {
    const snapsCol = collection(db, 'chapterSnapshots');
    const q = query(
      snapsCol,
      where('chapterId', '==', chapterId),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const items: ChapterSnapshot[] = [];
      snap.forEach((docSnap) => {
        items.push(docSnap.data() as ChapterSnapshot);
      });
      saveLocalChapterSnapshots(chapterId, items);
      return items;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
  return getLocalChapterSnapshots(chapterId);
}

// Subscribe in real-time to Chapter Snapshots from Firestore
export function subscribeToChapterSnapshots(
  chapterId: string,
  onUpdate: (snapshots: ChapterSnapshot[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!chapterId) {
    onUpdate([]);
    return () => {};
  }
  const path = 'chapterSnapshots';
  try {
    const snapsCol = collection(db, 'chapterSnapshots');
    const q = query(
      snapsCol,
      where('chapterId', '==', chapterId),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    return onSnapshot(
      q,
      (snap) => {
        const items: ChapterSnapshot[] = [];
        snap.forEach((docSnap) => {
          items.push(docSnap.data() as ChapterSnapshot);
        });
        saveLocalChapterSnapshots(chapterId, items);
        onUpdate(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, path);
        onUpdate(getLocalChapterSnapshots(chapterId));
        if (onError) onError(err);
      }
    );
  } catch (err) {
    onUpdate(getLocalChapterSnapshots(chapterId));
    return () => {};
  }
}


