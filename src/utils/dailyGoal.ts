// Helper for live tracking daily word goal progress in local storage

const STORAGE_KEY_DAILY_GOAL = 'rawi_daily_goal_v1';

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  wordsToday: number;
  dailyGoal: number;
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDailyProgress(): DailyProgress {
  const todayStr = getTodayDateString();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_GOAL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === todayStr) {
        return {
          date: todayStr,
          wordsToday: typeof parsed.wordsToday === 'number' ? parsed.wordsToday : 0,
          dailyGoal: typeof parsed.dailyGoal === 'number' ? parsed.dailyGoal : 500,
        };
      }
    }
  } catch {}

  // New day or first time
  const initial: DailyProgress = {
    date: todayStr,
    wordsToday: 0,
    dailyGoal: 500,
  };
  saveDailyProgress(initial);
  return initial;
}

export function saveDailyProgress(progress: DailyProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY_DAILY_GOAL, JSON.stringify(progress));
  } catch {}
}

export function updateWordsToday(wordsAddedDelta: number): DailyProgress {
  const current = getDailyProgress();
  const newWords = Math.max(0, current.wordsToday + wordsAddedDelta);
  const updated: DailyProgress = {
    ...current,
    wordsToday: newWords,
  };
  saveDailyProgress(updated);
  return updated;
}

export function setDailyGoalValue(goal: number): DailyProgress {
  const current = getDailyProgress();
  const updated: DailyProgress = {
    ...current,
    dailyGoal: Math.max(100, goal),
  };
  saveDailyProgress(updated);
  return updated;
}
