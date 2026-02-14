import { Home, Search, Heart, User, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useStore, type Page, type AppState } from '../store/useStore';
import { useCart } from '../contexts/CartContext';
import { useTranslation } from 'react-i18next';

const navItems: { page: Page; icon: typeof Home; labelKey: string; showBadge?: boolean }[] = [
  { page: 'home', icon: Home, labelKey: 'nav.home' },
  { page: 'search', icon: Search, labelKey: 'nav.explore' },
  { page: 'favorites', icon: Heart, labelKey: 'nav.saved' },
  { page: 'cart', icon: ShoppingCart, labelKey: 'nav.cart', showBadge: true },
  { page: 'verify', icon: ShieldCheck, labelKey: 'nav.verify' },
  { page: 'profile', icon: User, labelKey: 'nav.profile' },
];

export function BottomNav() {
  const { t } = useTranslation();
  const { currentPage, navigate } = useStore(useShallow((state: AppState) => ({
    currentPage: state.currentPage,
    navigate: state.navigate,
  })));
  const { itemCount } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-100 safe-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 pt-1 pb-1">
        {navItems.map(({ page, icon: Icon, labelKey, showBadge }) => {
          const isActive = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => navigate(page)}
              className={`touch-target relative flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${isActive
                  ? 'text-emerald-600'
                  : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                />
                {/* Cart badge */}
                {showBadge && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {t(labelKey)}
              </span>
              {isActive && (
                <div className="absolute -top-0.5 w-8 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
