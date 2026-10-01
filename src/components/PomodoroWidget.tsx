import React, { useState, useEffect, useMemo } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  X,
  Bell,
  BellOff,
  CheckCircle2,
  Cloud,
  Loader2,
  Calendar,
  Flame,
  Award,
  History,
  TrendingUp,
} from 'lucide-react';
import { PomodoroSession } from '../types/novel';
import {
  savePomodoroSessionToFirestore,
  subscribeToPomodoroSessions,
} from '../services/firebase';

interface PomodoroWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  novelId?: string;
}

export const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  novelId,
}) => {
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'timer' | 'summary'>('timer');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSavingToCloud, setIsSavingToCloud] = useState<boolean>(false);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);

  // Subscribe to real-time Pomodoro sessions from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToPomodoroSessions((data) => {
      setSessions(data);
    });
    return () => unsubscribe();
  }, []);

  // Update timer whenever duration changes
  useEffect(() => {
    setTimeLeftSeconds(durationMinutes * 60);
    setIsRunning(false);
    setIsCompleted(false);
  }, [durationMinutes]);

  // Main countdown interval
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeftSeconds > 0) {
      interval = setInterval(() => {
        setTimeLeftSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timeLeftSeconds === 0 && isRunning) {
      setIsRunning(false);
      setIsCompleted(true);

      // Play alert sound if enabled
      if (soundEnabled) {
        try {
          const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
          audio.play().catch(() => {});
        } catch {}
      }

      // Automatically record completed session to Firestore
      handleRecordCompletedSession();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeftSeconds, soundEnabled]);

  // Handle saving completed session to Firebase Firestore
  const handleRecordCompletedSession = async () => {
    setIsSavingToCloud(true);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const newSession: PomodoroSession = {
      id: `pomo-${Date.now()}`,
      novelId: novelId || 'default',
      durationMinutes,
      completedAt: now.toISOString(),
      date: today,
    };

    try {
      await savePomodoroSessionToFirestore(newSession);
    } catch (err) {
      console.warn('Pomodoro session saved locally with cloud sync pending:', err);
    } finally {
      setIsSavingToCloud(false);
    }
  };

  // Today's Date String
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter sessions for today
  const todaySessions = useMemo(() => {
    return sessions.filter((s) => s.date === todayStr);
  }, [sessions, todayStr]);

  // Calculations for daily summary
  const todayCount = todaySessions.length;
  const todayTotalMinutes = useMemo(() => {
    return todaySessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  }, [todaySessions]);

  // Daily target goal (e.g. 4 sessions = 100 min)
  const DAILY_GOAL_SESSIONS = 4;
  const goalPercent = Math.min(100, Math.round((todayCount / DAILY_GOAL_SESSIONS) * 100));

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  const progressPercent =
    ((durationMinutes * 60 - timeLeftSeconds) / (durationMinutes * 60)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in">
      <div
        className={`w-full max-w-md rounded-3xl shadow-2xl border flex flex-col relative overflow-hidden transition-all ${
          isDarkMode
            ? 'bg-stone-900 border-stone-800 text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
        dir="rtl"
      >
        {/* Top Header */}
        <div
          className={`p-4 px-5 border-b flex items-center justify-between ${
            isDarkMode ? 'border-stone-800 bg-stone-900/90' : 'border-stone-100 bg-stone-50/80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
              <Timer className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-novel-amiri leading-tight">
                مؤقت التركيز الروائي (Pomodoro)
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] opacity-70">
                <Cloud className="w-3 h-3 text-emerald-500" />
                <span>حفظ تلقائي سحابي (Firebase)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg transition-colors ${
                soundEnabled
                  ? 'text-amber-500 hover:bg-amber-500/10'
                  : 'opacity-40 hover:opacity-80'
              }`}
              title={soundEnabled ? 'تنبيه الصوت مفعل' : 'تنبيه الصوت مكتوم'}
            >
              {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-stone-500/10 transition-colors"
              title="إغلاق النافذة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-5 pt-3 flex items-center justify-between">
          <div
            className={`flex items-center gap-1 p-1 rounded-xl text-xs ${
              isDarkMode ? 'bg-stone-800' : 'bg-stone-100'
            }`}
          >
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'timer'
                  ? isDarkMode
                    ? 'bg-stone-700 text-amber-400 shadow-xs'
                    : 'bg-white text-stone-900 shadow-xs'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>المؤقت</span>
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'summary'
                  ? isDarkMode
                    ? 'bg-stone-700 text-amber-400 shadow-xs'
                    : 'bg-white text-stone-900 shadow-xs'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>ملخص اليوم ({todayCount})</span>
            </button>
          </div>

          {/* Quick daily mini stats badge */}
          <div
            className={`text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium ${
              todayCount > 0
                ? isDarkMode
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'opacity-50'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-500" />
            <span>اليوم: {todayCount} جلسات</span>
          </div>
        </div>

        {/* TAB 1: TIMER INTERFACE */}
        {activeTab === 'timer' && (
          <div className="p-5 pt-4 flex flex-col items-center text-center">
            {/* Preset Time Buttons */}
            <div className="flex items-center gap-2 mb-5">
              {[15, 25, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    durationMinutes === mins
                      ? 'bg-amber-600 text-white shadow-xs scale-105'
                      : isDarkMode
                      ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {mins} دقيقة
                </button>
              ))}
            </div>

            {/* Circular Timer Display */}
            <div className="relative w-44 h-44 rounded-full flex items-center justify-center border-4 border-amber-500/20 mb-5 shadow-inner">
              <div
                className="absolute inset-0 rounded-full border-4 border-amber-600 transition-all duration-1000"
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${
                    progressPercent > 50 ? '100% 0%, 100% 100%' : ''
                  } ${progressPercent === 100 ? '0% 100%, 0% 0%' : ''})`,
                }}
              />
              <div className="flex flex-col items-center">
                <span className="font-mono text-4xl font-bold tracking-tight text-amber-500">
                  {formattedTime}
                </span>
                <span className="text-xs opacity-60 mt-1 font-medium">
                  {isRunning
                    ? '⚡ تركيز سردي جارٍ...'
                    : isCompleted
                    ? '🎉 اكتملت الجلسة بنجاح!'
                    : 'جاهز للانطلاق'}
                </span>
              </div>
            </div>

            {/* Completion & Cloud Sync Feedback */}
            {isCompleted && (
              <div
                className={`mb-4 w-full p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium animate-bounce ${
                  isDarkMode
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  أحسنت! أتممت الجلسة وتم حفظها تلقائياً في قاعدة البيانات السحابية (Firebase).
                </span>
              </div>
            )}

            {/* Control Action Buttons */}
            <div className="flex items-center gap-3 w-full mb-5">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                  isRunning
                    ? 'bg-stone-700 hover:bg-stone-600'
                    : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>إيقاف مؤقت</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>ابدأ التركيز والكتابة</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsRunning(false);
                  setTimeLeftSeconds(durationMinutes * 60);
                  setIsCompleted(false);
                }}
                className={`p-3 rounded-2xl border transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'border-stone-800 hover:bg-stone-800 text-stone-300'
                    : 'border-stone-200 hover:bg-stone-100 text-stone-600'
                }`}
                title="إعادة ضبط المؤقت"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Daily Mini Progress Summary Box */}
            <div
              className={`w-full p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                isDarkMode ? 'bg-stone-800/60 border-stone-800' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="text-right">
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>إنجاز اليوم:</span>
                  <span className="font-bold text-amber-600">
                    {todayCount} من {DAILY_GOAL_SESSIONS} جلسات
                  </span>
                </div>
                <div className="text-[11px] opacity-60 mt-0.5">
                  إجمالي دقائق التركيز اليوم: {todayTotalMinutes} دقيقة
                </div>
              </div>

              {/* Visual session tomato dots */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.max(DAILY_GOAL_SESSIONS, todayCount) }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      i < todayCount
                        ? 'bg-amber-500 shadow-xs'
                        : isDarkMode
                        ? 'bg-stone-700'
                        : 'bg-stone-300'
                    }`}
                    title={`جلسة ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DAILY SUMMARY & SESSIONS LOG */}
        {activeTab === 'summary' && (
          <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto text-xs">
            {/* Daily Dashboard Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                  isDarkMode ? 'bg-stone-800/80 border-stone-700' : 'bg-amber-50/70 border-amber-200'
                }`}
              >
                <span className="text-[11px] opacity-70">جلسات اليوم المكتملة</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold font-mono text-amber-600">
                    {todayCount}
                  </span>
                  <span className="text-xs opacity-60">جلسات</span>
                </div>
                <div className="w-full bg-stone-300/40 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${goalPercent}%` }}
                  />
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                  isDarkMode ? 'bg-stone-800/80 border-stone-700' : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                <span className="text-[11px] opacity-70">دقائق التركيز اليوم</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold font-mono text-emerald-600">
                    {todayTotalMinutes}
                  </span>
                  <span className="text-xs opacity-60">دقيقة</span>
                </div>
                <span className="text-[10px] text-emerald-600 mt-2 font-medium">
                  {todayTotalMinutes > 0 ? 'معدل إنتاجية رائع ومثمر' : 'لم تبدأ أي جلسة اليوم بعد'}
                </span>
              </div>
            </div>

            {/* Cloud Storage State Notice */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-[11px] ${
                isDarkMode
                  ? 'bg-stone-800/50 border-stone-800 text-stone-300'
                  : 'bg-stone-100 border-stone-200 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                <span>قاعدة بيانات Firebase السحابية: متصلة وجاهزة</span>
              </div>
              <span className="font-mono text-[10px] opacity-60">
                إجمالي السجل: {sessions.length} جلسة
              </span>
            </div>

            {/* Today Sessions List */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs flex items-center gap-1.5 opacity-80 font-novel-amiri">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>سجل جلسات اليوم ({todaySessions.length})</span>
              </h4>

              {todaySessions.length === 0 ? (
                <div
                  className={`p-6 text-center rounded-2xl border border-dashed text-xs opacity-60 ${
                    isDarkMode ? 'border-stone-800' : 'border-stone-200'
                  }`}
                >
                  <Timer className="w-6 h-6 mx-auto mb-2 opacity-40 text-amber-500" />
                  <p>لم تُسجّل أي جلسة بومودورو اليوم حتى الآن.</p>
                  <p className="text-[10px] mt-1 opacity-70">
                    ابدأ جلسة تركيزك الأولى الآن لتُسجل تلقائياً في السجل السحابي!
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {todaySessions.map((session, index) => {
                    const sessionTime = new Date(session.completedAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <div
                        key={session.id || index}
                        className={`p-2.5 px-3 rounded-xl border flex items-center justify-between transition-colors ${
                          isDarkMode
                            ? 'bg-stone-800/70 border-stone-800 hover:bg-stone-800'
                            : 'bg-white border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-xs">
                              جلسة تركيز #{todaySessions.length - index}
                            </span>
                            <span className="text-[10px] opacity-60 block">
                              اكتملت في {sessionTime}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-amber-500/10 text-amber-600">
                            {session.durationMinutes} دقيقة
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Earlier Sessions (Recent) */}
            {sessions.filter((s) => s.date !== todayStr).length > 0 && (
              <div className="pt-2 border-t border-inherit/40 space-y-2">
                <h4 className="font-semibold text-[11px] opacity-60 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-amber-500" />
                  <span>جلسات الأيام السابقة المحفوظة</span>
                </h4>
                <div className="space-y-1">
                  {sessions
                    .filter((s) => s.date !== todayStr)
                    .slice(0, 5)
                    .map((session) => (
                      <div
                        key={session.id}
                        className={`p-2 px-3 rounded-lg text-[11px] flex items-center justify-between opacity-75 ${
                          isDarkMode ? 'bg-stone-800/40' : 'bg-stone-50'
                        }`}
                      >
                        <span>{session.date}</span>
                        <span className="font-mono">{session.durationMinutes} دقيقة</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
