import { create } from 'zustand';
import { VerificationStatus } from './data';
import type { ThemePreference } from '../utils/theme';
import { getStoredThemePreference, setStoredThemePreference } from '../utils/theme';

export type Page = 'home' | 'search' | 'seller' | 'product' | 'favorites' | 'profile' | 'verify' | 'cart' | 'sellerDashboard';

// ==================== New Types for Security and Language ====================

export type Language = 'en' | 'ar';
export type UserRole = 'admin' | 'user' | 'seller';
export type UserStatus = 'active' | 'suspended' | 'pending';

const SELLER_DASHBOARD_ALLOWED_EMAIL = 'cat718818@gmail.com';

function isAllowedSellerDashboardEmail(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === SELLER_DASHBOARD_ALLOWED_EMAIL;
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'ar';
  const stored = localStorage.getItem('iraq_marketplace_language');
  return stored === 'en' || stored === 'ar' ? stored : 'ar';
}

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  nameAr: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  lastLogin: string;
  isVerified: boolean;
  status: UserStatus;
}

export interface SecuritySettings {
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  sessionTimeout: number; // minutes
  requireStrongPassword: boolean;
  enableTwoFactor: boolean;
}

// ==================== Verification Types ====================

export interface ProductVerificationState {
  productId: string;
  status: VerificationStatus;
  verifiedAt?: string;
  requestedAt?: string;
}

// ==================== End New Types ====================

export interface AppState {
  // Existing state
  currentPage: Page;
  selectedSellerId: string | null;
  selectedProductId: string | null;
  searchQuery: string;
  selectedCategory: string;
  selectedLocation: string;
  priceRange: [number, number];
  favorites: string[];
  pageHistory: Page[];
  authNextPage: Page | null;

  // NEW: Authentication state
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authToken: string | null;

  // NEW: Language state
  language: Language;

  // NEW: Theme preference
  themePreference: ThemePreference;

  // NEW: Security settings
  securitySettings: SecuritySettings;

  // Existing actions
  navigate: (page: Page, params?: { sellerId?: string; productId?: string }) => void;
  goBack: () => void;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (cat: string) => void;
  setSelectedLocation: (loc: string) => void;
  setPriceRange: (range: [number, number]) => void;
  toggleFavorite: (productId: string) => void;

  // NEW: Auth actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setAuthToken: (token: string | null) => void;
  setAuthNextPage: (page: Page | null) => void;
  consumeAuthNextPage: () => Page | null;
  logout: () => void;
  isAdminUser: () => boolean;

  // NEW: Language actions
  setLanguage: (lang: Language) => void;

  // NEW: Theme actions
  setThemePreference: (preference: ThemePreference) => void;

  // NEW: Security actions
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;

  // NEW: Views tracking state
  viewCounts: Record<string, number>;

  // NEW: Views actions
  setViewCount: (productId: string, count: number) => void;
  incrementViewCount: (productId: string) => void;
  getViewCount: (productId: string) => number;

  // NEW: Verification state
  verificationRequests: ProductVerificationState[];

  // NEW: Verification actions
  addVerificationRequest: (request: ProductVerificationState) => void;
  updateVerificationStatus: (productId: string, status: VerificationStatus, verifiedAt?: string) => void;
  getVerificationStatus: (productId: string) => ProductVerificationState | undefined;

  // NEW: Seller dashboard state
  sellerDashboardId: string | null;
  showAddProductForm: boolean;

  // NEW: Seller dashboard actions
  setSellerDashboardId: (sellerId: string | null) => void;
  setShowAddProductForm: (show: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentPage: 'home',
  selectedSellerId: null,
  selectedProductId: null,
  searchQuery: '',
  selectedCategory: 'all',
  selectedLocation: 'all',
  priceRange: [0, 2000000],
  favorites: [],
  pageHistory: [],
  authNextPage: null,

  navigate: (page, params) => {
    const state = get();
    const protectedPages: Page[] = ['sellerDashboard'];

    if (protectedPages.includes(page) && !state.isAuthenticated) {
      const nextSellerId = params?.sellerId ?? state.selectedSellerId;
      const nextProductId = params?.productId ?? state.selectedProductId;

      if (
        state.currentPage === 'profile' &&
        state.authNextPage === page &&
        state.selectedSellerId === nextSellerId &&
        state.selectedProductId === nextProductId
      ) {
        return;
      }

      set({
        currentPage: 'profile',
        authNextPage: page,
        selectedSellerId: nextSellerId,
        selectedProductId: nextProductId,
        pageHistory: [...state.pageHistory, state.currentPage],
      });
      return;
    }

    if (page === 'sellerDashboard' && !isAllowedSellerDashboardEmail(state.user?.email)) {
      if (typeof window !== 'undefined') {
        window.alert(
          state.language === 'ar'
            ? `ما عندك صلاحية تفتح لوحة التحكم. لازم تسجل دخول بهذا البريد فقط: ${SELLER_DASHBOARD_ALLOWED_EMAIL}`
            : `You don't have access to the dashboard. Sign in with: ${SELLER_DASHBOARD_ALLOWED_EMAIL}`
        );
      }
      set({
        currentPage: 'profile',
        authNextPage: null,
        pageHistory: [...state.pageHistory, state.currentPage],
      });
      return;
    }

    const nextSellerId = params?.sellerId ?? state.selectedSellerId;
    const nextProductId = params?.productId ?? state.selectedProductId;
    if (state.currentPage === page && state.selectedSellerId === nextSellerId && state.selectedProductId === nextProductId) {
      return;
    }

    set({
      currentPage: page,
      selectedSellerId: nextSellerId,
      selectedProductId: nextProductId,
      pageHistory: [...state.pageHistory, state.currentPage],
    });
  },

  goBack: () => {
    const state = get();
    const history = [...state.pageHistory];
    const prevPage = history.pop() || 'home';
    set({
      currentPage: prevPage,
      pageHistory: history,
    });
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setSelectedLocation: (loc) => set({ selectedLocation: loc }),
  setPriceRange: (range) => set({ priceRange: range }),

  toggleFavorite: (productId) => {
    const state = get();
    const favs = state.favorites.includes(productId)
      ? state.favorites.filter(id => id !== productId)
      : [...state.favorites, productId];
    set({ favorites: favs });
  },

  // NEW: Authentication state defaults
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  authToken: null,

  // NEW: Language state default
  language: getInitialLanguage(),

  // NEW: Theme preference default
  themePreference: getStoredThemePreference(),

  // NEW: Security settings defaults
  securitySettings: {
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    sessionTimeout: 15,
    requireStrongPassword: true,
    enableTwoFactor: false,
  },

  // NEW: Auth actions
  setUser: (user) => set({
    user,
    isAdmin: user?.role === 'admin',
  }),

  setAuthenticated: (isAuthenticated) => {
    if (get().isAuthenticated === isAuthenticated) return;
    set({ isAuthenticated });
  },

  setAuthToken: (token) => {
    if (get().authToken === token) return;
    set({ authToken: token });
  },

  setAuthNextPage: (page) => {
    if (get().authNextPage === page) return;
    set({ authNextPage: page });
  },

  consumeAuthNextPage: () => {
    const next = get().authNextPage;
    if (next) set({ authNextPage: null });
    return next;
  },

  logout: () => set({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    authToken: null,
    authNextPage: null,
  }),

  isAdminUser: () => get().user?.role === 'admin',

  // NEW: Language actions
  setLanguage: (lang) => {
    if (get().language === lang) return;
    set({ language: lang });
    if (typeof window !== 'undefined') {
      localStorage.setItem('iraq_marketplace_language', lang);
    }
    // Update document direction for RTL support
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  },

  // NEW: Theme actions
  setThemePreference: (preference) => {
    if (get().themePreference === preference) return;
    set({ themePreference: preference });
    setStoredThemePreference(preference);
  },

  // NEW: Security actions
  updateSecuritySettings: (settings) => set((state) => ({
    securitySettings: {
      ...state.securitySettings,
      ...settings,
    },
  })),

  // NEW: Views tracking state defaults
  viewCounts: {},

  // NEW: Views actions
  setViewCount: (productId, count) => {
    if (get().viewCounts[productId] === count) return;
    set((state) => ({
      viewCounts: {
        ...state.viewCounts,
        [productId]: count,
      },
    }));
  },

  incrementViewCount: (productId) => set((state) => ({
    viewCounts: {
      ...state.viewCounts,
      [productId]: (state.viewCounts[productId] || 0) + 1,
    },
  })),

  getViewCount: (productId) => get().viewCounts[productId] || 0,

  // NEW: Verification state defaults
  verificationRequests: [],

  // NEW: Verification actions
  addVerificationRequest: (request) => set((state) => ({
    verificationRequests: [...state.verificationRequests, request],
  })),

  updateVerificationStatus: (productId, status, verifiedAt) => set((state) => ({
    verificationRequests: state.verificationRequests.map(r =>
      r.productId === productId
        ? { ...r, status, verifiedAt }
        : r
    ),
  })),

  getVerificationStatus: (productId) => get().verificationRequests.find(r => r.productId === productId),

  // NEW: Seller dashboard state defaults
  sellerDashboardId: null,
  showAddProductForm: false,

  // NEW: Seller dashboard actions
  setSellerDashboardId: (sellerId) => set({ sellerDashboardId: sellerId }),
  setShowAddProductForm: (show) => set({ showAddProductForm: show }),
}));
