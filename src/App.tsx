import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from './store/useStore';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ProductPage } from './pages/ProductPage';
import { SellerPage } from './pages/SellerPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { VerifyPage } from './pages/VerifyPage';
import { ProfilePage } from './pages/ProfilePage';
import { CartPage } from './pages/CartPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';

// Import i18n instance (must be imported before components that use translations)
import './i18n';
import { applyThemeToDocument, getEffectiveTheme } from './utils/theme';

// Import providers
import { SecurityProvider } from './contexts/SecurityContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ViewsProvider } from './contexts/ViewsContext';
import { CartProvider } from './contexts/CartContext';
import { SellerProvider } from './contexts/SellerContext';
import { VerificationProvider } from './contexts/VerificationContext';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';

export function App() {
  const { currentPage, language, themePreference, navigate } = useStore(
    useShallow((state) => ({
      currentPage: state.currentPage,
      language: state.language,
      themePreference: state.themePreference,
      navigate: state.navigate,
    })),
  );
  const isAuthCallback = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/callback');
  const deepLinkAppliedRef = useRef(false);

  // Set initial direction based on language
  useEffect(() => {
    // Only update document direction, let LanguageContext handle i18n
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Deep link support for shared seller/product links
  useEffect(() => {
    if (isAuthCallback) return;
    if (deepLinkAppliedRef.current) return;
    deepLinkAppliedRef.current = true;
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const params = url.searchParams;
    const page = params.get('page');
    const productId = params.get('productId');
    const sellerId = params.get('sellerId');

    if ((page === 'product' || !page) && productId) {
      navigate('product', { productId });
      return;
    }

    if ((page === 'seller' || !page) && sellerId) {
      navigate('seller', { sellerId });
    }
  }, [isAuthCallback, navigate]);

  // Apply theme preference
  useEffect(() => {
    const apply = () => applyThemeToDocument(getEffectiveTheme(themePreference));
    apply();

    if (typeof window === 'undefined') return;
    if (themePreference !== 'system') return;

    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;

    const onChange = () => apply();
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, [themePreference]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'search':
        return <SearchPage />;
      case 'product':
        return <ProductPage />;
      case 'seller':
        return <SellerPage />;
      case 'favorites':
        return <FavoritesPage />;
      case 'verify':
        return <VerifyPage />;
      case 'profile':
        return <ProfilePage />;
      case 'cart':
        return <CartPage />;
      case 'sellerDashboard':
        return <SellerDashboardPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <SupabaseAuthProvider>
      <SecurityProvider>
        <LanguageProvider>
          <ViewsProvider>
            <CartProvider>
              <SellerProvider>
                <VerificationProvider>
                  {isAuthCallback ? (
                    <AuthCallbackPage />
                  ) : (
                    <div className="max-w-lg mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen relative">
                      <div className="page-enter" key={currentPage}>
                        {renderPage()}
                      </div>
                      <BottomNav />
                    </div>
                  )}
                </VerificationProvider>
              </SellerProvider>
            </CartProvider>
          </ViewsProvider>
        </LanguageProvider>
      </SecurityProvider>
    </SupabaseAuthProvider>
  );
}
