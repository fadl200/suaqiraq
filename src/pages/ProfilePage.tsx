import { useMemo, useState, type ReactNode } from 'react';
import {
  User,
  Store,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Moon,
  Globe,
  Smartphone,
  Package,
  BarChart3,
  Plus,
  Camera,
  CheckCircle2,
  TrendingUp,
  Eye,
  X,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useStore, type AppState } from '../store/useStore';
import { useCart } from '../contexts/CartContext';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { openSupportWhatsApp } from '../config/support';
import type { ThemePreference } from '../utils/theme';

type ProfileTab = 'buyer' | 'seller';
type ModalId = 'notifications' | 'language' | 'appearance' | 'install' | 'signout' | null;

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X size={18} className="text-gray-500 dark:text-gray-300" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const { configured, user: authUser, isGoogleUser, loading: authLoading, error: authError, signInWithGoogle, signOut } = useSupabaseAuth();
  const {
    language,
    themePreference,
    setLanguage,
    setThemePreference,
    logout,
    navigate,
    authNextPage,
    setAuthNextPage,
    isAuthenticated,
  } = useStore(
    useShallow((state: AppState) => ({
      language: state.language,
      themePreference: state.themePreference,
      setLanguage: state.setLanguage,
      setThemePreference: state.setThemePreference,
      logout: state.logout,
      navigate: state.navigate,
      authNextPage: state.authNextPage,
      setAuthNextPage: state.setAuthNextPage,
      isAuthenticated: state.isAuthenticated,
    })),
  );
  const { clearCart } = useCart();

  const [activeTab, setActiveTab] = useState<ProfileTab>('buyer');
  const [openModal, setOpenModal] = useState<ModalId>(null);

  const [showSellerSignup, setShowSellerSignup] = useState(false);
  const [sellerRegistered, setSellerRegistered] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeCity, setStoreCity] = useState('');
  const [storeCategory, setStoreCategory] = useState('');

  const languageLabel = language === 'ar' ? t('common.arabic') : t('common.english');
  const themeLabel = useMemo(() => {
    switch (themePreference) {
      case 'light':
        return t('profile.lightTheme');
      case 'dark':
        return t('profile.darkTheme');
      case 'system':
      default:
        return t('profile.systemTheme');
    }
  }, [themePreference, t]);

  const handleRegister = () => {
    if (storeName && storePhone && storeCity && storeCategory) {
      setSellerRegistered(true);
      setShowSellerSignup(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      clearCart();
      logout();
      navigate('home');
      setOpenModal(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      if (authUser && !isGoogleUser) {
        await signOut();
      }
      const next = authNextPage ?? 'home';
      setAuthNextPage(next);
      await signInWithGoogle(next);
    } catch {
      // errors are shown via authError in context
    }
  };

  const buyerMenuItems = [
    {
      icon: Bell,
      label: t('profile.notifications'),
      sub: '',
      color: 'text-red-500',
      onClick: () => setOpenModal('notifications'),
    },
    {
      icon: Globe,
      label: t('profile.language'),
      sub: languageLabel,
      color: 'text-blue-500',
      onClick: () => setOpenModal('language'),
    },
    {
      icon: Moon,
      label: t('profile.appearance'),
      sub: themeLabel,
      color: 'text-purple-500',
      onClick: () => setOpenModal('appearance'),
    },
    {
      icon: Smartphone,
      label: t('profile.installApp'),
      sub: '',
      color: 'text-emerald-500',
      onClick: () => setOpenModal('install'),
    },
    {
      icon: HelpCircle,
      label: t('profile.help'),
      sub: '',
      color: 'text-amber-500',
      onClick: () => openSupportWhatsApp(language),
    },
  ];

  const sellerQuickActions = [
    {
      icon: Plus,
      label: t('profile.addNewProduct'),
      sub: t('profile.comingSoon'),
      color: 'text-emerald-500',
      onClick: () => navigate('sellerDashboard'),
    },
    {
      icon: Package,
      label: t('profile.myProducts'),
      sub: t('profile.comingSoon'),
      color: 'text-blue-500',
      onClick: () => navigate('sellerDashboard'),
    },
    {
      icon: BarChart3,
      label: t('profile.analytics'),
      sub: t('profile.comingSoon'),
      color: 'text-purple-500',
      onClick: () => navigate('sellerDashboard'),
    },
    {
      icon: Shield,
      label: t('profile.verification'),
      sub: '',
      color: 'text-amber-500',
      onClick: () => navigate('verify'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-4 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10">
          <h1 className="text-white text-lg font-bold mb-4">{t('profile.title')}</h1>

          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <User size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-white text-base font-bold">
                {authLoading ? t('common.loading') : isAuthenticated ? (authUser?.email ?? t('profile.title')) : t('profile.guestUser')}
              </h2>
              <p className="text-emerald-100 text-xs mt-0.5">{t('profile.welcomeSubtitle')}</p>
            </div>
          </div>

          {/* Google Login */}
          {!isAuthenticated ? (
            <div className="mt-4">
              <div className="text-[11px] text-white/80 mb-2">
                {authUser && !isGoogleUser
                  ? 'حسابك الحالي مو Google. لازم تسجيل دخول بجوجل حتى تقدر تستخدم السلة/المفضلة/البيع.'
                  : 'تقدر تتصفح كضيف، لكن السلة/المفضلة/البيع تحتاج تسجيل دخول بجوجل.'}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!configured}
                  onClick={handleGoogleSignIn}
                  className="flex-1 bg-white text-emerald-700 font-bold py-2.5 rounded-xl hover:bg-emerald-50 transition-colors disabled:opacity-60"
                >
                  تسجيل دخول بجوجل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem('iraq_marketplace_pending_action');
                    setAuthNextPage(null);
                    navigate('home');
                  }}
                  className="flex-1 bg-white/15 text-white font-semibold py-2.5 rounded-xl hover:bg-white/20 transition-colors"
                >
                  متابعة كضيف
                </button>
              </div>
              {!configured ? (
                <div className="mt-2 text-[11px] text-white/80">
                  ملاحظة: لازم تضيف `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` حتى يشتغل تسجيل الدخول.
                </div>
              ) : null}
              {authError ? <div className="mt-2 text-[11px] text-red-100">Error: {authError}</div> : null}
            </div>
          ) : null}

          {/* Tab Switch */}
          <div className="flex gap-1 mt-4 bg-white/15 rounded-xl p-0.5 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => {
                setActiveTab('buyer');
                setOpenModal(null);
              }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'buyer' ? 'bg-white text-emerald-700 shadow-sm' : 'text-white/80'
              }`}
            >
              {t('profile.buyerTab')}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('seller');
                setOpenModal(null);
              }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'seller' ? 'bg-white text-emerald-700 shadow-sm' : 'text-white/80'
              }`}
            >
              {t('profile.sellerTab')}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-2 animate-fade-in">
        {activeTab === 'buyer' ? (
          <>
            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <Package size={20} className="text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">0</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{t('profile.myOrders')}</p>
                </div>
                <div className="text-center">
                  <Store size={20} className="text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">0</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{t('seller.reviews')}</p>
                </div>
                <div className="text-center">
                  <Shield size={20} className="text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">0</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{t('verify.verified')}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {buyerMenuItems.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                >
                  <item.icon size={20} className={item.color} />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                    {item.sub && <p className="text-[11px] text-gray-400">{item.sub}</p>}
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </button>
              ))}
            </div>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => setOpenModal('signout')}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mt-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={20} className="text-red-500" />
                <span className="text-sm font-medium text-red-500">{t('profile.signOutTitle')}</span>
              </button>
            ) : null}
          </>
        ) : (
          <>
            {/* Seller Mode */}
            {!isAuthenticated ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store size={32} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لازم تسجيل دخول بجوجل</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  حتى تقدر تسجّل كبائع وتضيف منتجات، لازم تسجيل دخول بحساب Google.
                </p>
                <button
                  type="button"
                  disabled={!configured}
                  onClick={handleGoogleSignIn}
                  className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-600 transition-colors active:scale-[0.98] disabled:opacity-60"
                >
                  تسجيل دخول بجوجل
                </button>
              </div>
            ) : !sellerRegistered && !showSellerSignup ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store size={32} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('profile.becomeSeller')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('home.zeroCommission')}</p>
                <div className="flex flex-col gap-2 text-left bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 mb-4 text-xs text-emerald-700 dark:text-emerald-300">
                  <span>✓ {t('home.sellForFree')}</span>
                  <span>✓ {t('home.keepProfit')}</span>
                  <span>✓ {t('cart.orderViaWhatsApp')}</span>
                  <span>✓ {t('seller.verified')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSellerSignup(true)}
                  className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-600 transition-colors active:scale-[0.98] shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  {t('profile.register')}
                </button>
              </div>
            ) : showSellerSignup ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 animate-scale-in">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('profile.register')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('profile.comingSoon')}</p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Store Name *</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g., My Fashion Store"
                      className="w-full bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">WhatsApp Number *</label>
                    <input
                      type="tel"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="+964 770 123 4567"
                      className="w-full bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">City *</label>
                    <select
                      value={storeCity}
                      onChange={(e) => setStoreCity(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 appearance-none"
                    >
                      <option value="">Select your city...</option>
                      <option value="baghdad">Baghdad</option>
                      <option value="basra">Basra</option>
                      <option value="erbil">Erbil</option>
                      <option value="najaf">Najaf</option>
                      <option value="mosul">Mosul</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Category *</label>
                    <select
                      value={storeCategory}
                      onChange={(e) => setStoreCategory(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 appearance-none"
                    >
                      <option value="">Select category...</option>
                      <option value="fashion">Fashion</option>
                      <option value="electronics">Electronics</option>
                      <option value="beauty">Beauty</option>
                      <option value="home">Home & Decor</option>
                      <option value="food">Food</option>
                      <option value="sports">Sports</option>
                      <option value="kids">Kids</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Store Logo (Optional)</label>
                    <button
                      type="button"
                      className="w-full bg-gray-50 dark:bg-gray-900/40 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl px-4 py-6 text-sm text-gray-400 flex flex-col items-center gap-1 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
                    >
                      <Camera size={24} className="text-gray-300" />
                      <span className="text-xs">Tap to upload</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setShowSellerSignup(false)}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleRegister}
                    className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors active:scale-[0.98] shadow-lg shadow-emerald-200 text-sm"
                  >
                    {t('common.confirm')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('profile.sellerDashboard')}</h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    {storeName ? `Welcome, ${storeName}!` : t('profile.welcomeSubtitle')}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                      <Eye size={18} className="text-emerald-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">0</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-300/80">Views</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/25 rounded-xl">
                      <BarChart3 size={18} className="text-blue-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">0</p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-300/80">Stats</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/25 rounded-xl">
                      <TrendingUp size={18} className="text-amber-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-amber-700 dark:text-amber-300">0%</p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-300/80">Rate</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  {sellerQuickActions.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={item.onClick}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                    >
                      <item.icon size={20} className={item.color} />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                        {item.sub && <p className="text-[11px] text-gray-400">{item.sub}</p>}
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        <Modal open={openModal === 'notifications'} title={t('profile.notifications')} onClose={() => setOpenModal(null)}>
          <div className="text-center py-3">
            <p className="font-semibold text-gray-900 dark:text-white">{t('notifications.emptyTitle')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('notifications.emptyDescription')}</p>
          </div>
        </Modal>

        <Modal open={openModal === 'language'} title={t('profile.language')} onClose={() => setOpenModal(null)}>
          <div className="space-y-2">
            {[
              { code: 'ar' as const, label: t('common.arabic') },
              { code: 'en' as const, label: t('common.english') },
            ].map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => {
                  setLanguage(opt.code);
                  setOpenModal(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                  language === opt.code
                    ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                }`}
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</span>
                {language === opt.code && <Check size={18} className="text-emerald-600" />}
              </button>
            ))}
          </div>
        </Modal>

        <Modal open={openModal === 'appearance'} title={t('profile.appearance')} onClose={() => setOpenModal(null)}>
          <div className="space-y-2">
            {[
              { code: 'system' as ThemePreference, label: t('profile.systemTheme') },
              { code: 'light' as ThemePreference, label: t('profile.lightTheme') },
              { code: 'dark' as ThemePreference, label: t('profile.darkTheme') },
            ].map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => {
                  setThemePreference(opt.code);
                  setOpenModal(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                  themePreference === opt.code
                    ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                }`}
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</span>
                {themePreference === opt.code && <Check size={18} className="text-emerald-600" />}
              </button>
            ))}
          </div>
        </Modal>

        <Modal open={openModal === 'install'} title={t('install.title')} onClose={() => setOpenModal(null)}>
          <div className="space-y-3">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-sm text-gray-700 dark:text-gray-200">{t('install.ios')}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-sm text-gray-700 dark:text-gray-200">{t('install.android')}</p>
            </div>
          </div>
        </Modal>

        <Modal open={openModal === 'signout'} title={t('profile.signOutTitle')} onClose={() => setOpenModal(null)}>
          <p className="text-sm text-gray-600 dark:text-gray-300">{t('profile.signOutMessage')}</p>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setOpenModal(null)}
              className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
            >
              {t('common.confirm')}
            </button>
          </div>
        </Modal>

        {/* App Info */}
        <div className="text-center mt-6 pb-4">
          <p className="text-[11px] text-gray-300">Souq Iraq v1.0.0</p>
          <p className="text-[10px] text-gray-300 mt-0.5">Iraqi Smart Marketplace PWA</p>
        </div>
      </div>
    </div>
  );
}
