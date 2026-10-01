import React, { useState } from 'react';
import {
  X,
  User,
  LogIn,
  UserPlus,
  Lock,
  Mail,
  ShieldCheck,
  Cloud,
  LogOut,
  Sparkles,
  AlertCircle,
  HardDrive,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  firebaseSignOut,
  updateProfile,
  FirebaseUser,
} from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  onContinueAsGuest: () => void;
  onSyncCurrentNovelToCloud: () => Promise<void>;
  onShowToast: (message: string, type?: 'success' | 'info' | 'save') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onContinueAsGuest,
  onSyncCurrentNovelToCloud,
  onShowToast,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!email.trim() || !password.trim()) {
          setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
          setLoading(false);
          return;
        }
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName.trim() && userCred.user) {
          await updateProfile(userCred.user, { displayName: displayName.trim() });
        }
        onShowToast('تم إنشاء الحساب وتسجيل الدخول بنجاح!', 'success');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onShowToast('تم تسجيل الدخول بنجاح ومزامنة الرواية!', 'success');
      }
      // Sync local novel upon sign-in
      await onSyncCurrentNovelToCloud();
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('هذا البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول');
      } else if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential'
      ) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (err.code === 'auth/invalid-email') {
        setError('صيغة البريد الإلكتروني غير صالحة');
      } else {
        setError(err.message || 'حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة ثانية');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onShowToast('تم تسجيل الدخول عبر Google بنجاح!', 'success');
      await onSyncCurrentNovelToCloud();
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('تعذر تسجيل الدخول عبر Google، يرجى المحاولة ثانية');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      onShowToast('تم تسجيل الخروج والتحويل إلى وضع الزائر المحلي', 'info');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await onSyncCurrentNovelToCloud();
      onShowToast('تمت مزامنة جميع الفصول والملاحظات سحابياً بنجاح!', 'save');
    } catch {
      onShowToast('حدث خطأ أثناء المزامنة السحابية', 'info');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 font-novel-amiri">
                {currentUser ? 'حساب الكاتب والمزامنة' : 'تسجيل الدخول والمزامنة'}
              </h2>
              <p className="text-xs text-stone-500">
                {currentUser
                  ? 'إدارة حسابك وحفظ أعمالك الروائية سحابياً'
                  : 'احفظ رواياتك سحابياً أو تابع كزائر محلياً'}
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

        {/* LOGGED IN USER PROFILE VIEW */}
        {currentUser ? (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-lg font-bold shadow-xs shrink-0">
                {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email?.[0].toUpperCase() || 'ر'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-stone-900 truncate">
                    {currentUser.displayName || 'الكاتب الروائي'}
                  </h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> متصل
                  </span>
                </div>
                <p className="text-xs text-stone-500 truncate mt-0.5">{currentUser.email}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Cloud className="w-4 h-4 text-emerald-700" />
                <span>المزامنة السحابية النشطة (Firestore)</span>
              </div>
              <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                رواياتك وفصولك وملاحظاتك محفوظة بشكل دائم وآمن على السحابة، ويمكنك الوصول إليها من أي جهاز.
              </p>
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري المزامنة الآن...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>مزامنة الرواية الحالية يدوياً الآن</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          /* NOT LOGGED IN - LOGIN / SIGN UP / GUEST CHOICE */
          <div className="space-y-5">
            {/* Quick Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-2xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>تسجيل الدخول السريع بحساب Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-stone-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-stone-400 uppercase font-semibold">أو عبر البريد</span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-900 mb-1">اسم الكاتب / المستعار</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="مثال: أحمد نجيب"
                      className="w-full pr-9 pl-3 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-xl text-xs font-medium focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-900 mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pr-9 pl-3 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-xl text-xs font-medium focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-900 mb-1">كلمة المرور</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-9 pl-3 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-stone-300 rounded-xl text-xs font-medium focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSignUp ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>إنشاء حساب جديد</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                  }}
                  className="text-xs text-amber-800 hover:text-amber-900 font-semibold underline underline-offset-4 cursor-pointer"
                >
                  {isSignUp
                    ? 'لديك حساب بالفعل؟ تسجيل الدخول'
                    : 'ليس لديك حساب؟ إنشاء حساب كاتب جديد'}
                </button>
              </div>
            </form>

            {/* PROMINENT GUEST MODE / CONTINUE AS GUEST OPTION */}
            <div className="pt-3 border-t border-stone-100">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-amber-800" />
                    <span className="font-bold text-xs text-amber-950">المتابعة كزائر (Guest Mode)</span>
                  </div>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                    حفظ محلي كامل
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  يمكنك الكتابة واستخدام كافة ميزات راوي بدون تسجيل، مع حفظ كل الفصول محلياً في ذاكرة جهازك.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onContinueAsGuest();
                    onShowToast('أنت الآن تعمل كزائر مع الحفظ المحلي على جهازك', 'info');
                    onClose();
                  }}
                  className="w-full py-2 px-3 bg-white hover:bg-amber-100/50 border border-amber-300/80 text-amber-950 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer text-center"
                >
                  المتابعة كزائر الآن ←
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
