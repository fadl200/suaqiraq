import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Seller, Product, Rating, replaceMarketplaceData, sellers as mockSellers, products as mockProducts, ratings as mockRatings } from '../store/data';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';
import {
    sortProductsByVerification,
    createProductForSeller,
    uploadProductImage,
    SimplifiedProductInput,
} from '../services/sellerService';

// Seller context state interface
interface SellerState {
    // Current seller being viewed
    currentSeller: Seller | null;
    // All sellers
    sellers: Seller[];
    // Verified sellers only
    verifiedSellers: Seller[];
    products: Product[];
    ratings: Rating[];
    // Products for current seller
    sellerProducts: Product[];
    // Loading states
    isLoading: boolean;
    // Error state
    error: string | null;
    // Seller dashboard state
    dashboardStats: {
        productCount: number;
        totalViews: number;
        isVerified: boolean;
        deliveryInfo: string;
    } | null;
}

// Seller context actions interface
interface SellerActions {
    // Get seller by ID
    fetchSellerById: (id: string) => Seller | undefined;
    // Get all verified sellers
    fetchVerifiedSellers: () => Seller[];
    // Get all sellers
    fetchAllSellers: () => Seller[];
    // Check if seller is verified
    checkVerification: (sellerId: string) => boolean;
    // Get products by seller
    fetchSellerProducts: (sellerId: string) => Product[];
    // Get products sorted by verification
    fetchProductsSortedByVerification: () => Product[];
    // Sort products by verification
    sortProductsByVerificationStatus: (products: Product[]) => Product[];
    // Get delivery info
    getDeliveryInfo: (sellerId: string) => string;
    // Get product count
    getProductCount: (sellerId: string) => number;
    // Create product for seller
    createProduct: (sellerId: string, input: SimplifiedProductInput) => Promise<Product>;
    // Upload image
    uploadImage: (file: File) => Promise<string>;
    // Get seller stats
    fetchSellerStats: (sellerId: string) => { productCount: number; totalViews: number; isVerified: boolean; deliveryInfo: string };
    // Search sellers
    search: (query: string) => Seller[];
    // Get top sellers
    fetchTopSellers: (limit?: number) => Seller[];
    // Get sellers by category
    fetchSellersByCategory: (category: string) => Seller[];
    // Set current seller
    setCurrentSeller: (seller: Seller | null) => void;
    updateSocialLinks: (sellerId: string, links: { instagram?: string; tiktok?: string }) => Promise<Seller>;
    updateFeaturedProduct: (sellerId: string, featuredProductId: string | null) => Promise<Seller>;
    // Clear error
    clearError: () => void;
}

// Combined context type
interface SellerContextType extends SellerState, SellerActions { }

// Create context with default values
const SellerContext = createContext<SellerContextType | undefined>(undefined);

// Provider props
interface SellerProviderProps {
    children: ReactNode;
}

/**
 * Seller Provider Component
 * Provides seller state and actions to the component tree
 */
export function SellerProvider({ children }: SellerProviderProps) {
    // State
    const [currentSeller, setCurrentSeller] = useState<Seller | null>(null);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [verifiedSellers, setVerifiedSellers] = useState<Seller[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dashboardStats, setDashboardStats] = useState<SellerState['dashboardStats']>(null);

    const getVerifiedSellersLocal = useCallback((list: Seller[]) => list.filter(s => s.isVerified), []);

    const getSellerByIdLocal = useCallback((id: string) => {
        return sellers.find(s => s.id === id);
    }, [sellers]);

    const getProductsBySellerLocal = useCallback((sellerId: string) => {
        return products.filter(p => p.sellerId === sellerId);
    }, [products]);

    const getSellerRatingSummaryLocal = useCallback((sellerId: string) => {
        const sellerRatings = ratings.filter(r => r.sellerId === sellerId);
        const count = sellerRatings.length;
        if (count === 0) return { average: 0, count: 0 };
        const total = sellerRatings.reduce((sum, r) => sum + r.rating, 0);
        const average = Math.round((total / count) * 10) / 10;
        return { average, count };
    }, [ratings]);

    const normalizeSocialHandle = useCallback((input: string) => {
        const trimmed = input.trim();
        if (!trimmed) return '';
        const withoutProtocol = trimmed
            .replace(/^https?:\/\//i, '')
            .replace(/^www\./i, '');
        const parts = withoutProtocol.split('/').filter(Boolean);
        const last = parts[parts.length - 1] ?? '';
        return last.replace(/^@+/, '').trim();
    }, []);

    useEffect(() => {
        const KEY = 'souq_iraq_daily_cache_v1';
        const today = (() => {
            const d = new Date();
            const pad2 = (n: number) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
        })();

        function readCache(): { date: string; sellers: Seller[]; products: Product[]; ratings: Rating[] } | null {
            try {
                const raw = localStorage.getItem(KEY);
                if (!raw) return null;
                const parsed = JSON.parse(raw) as { date?: unknown; sellers?: unknown; products?: unknown; ratings?: unknown };
                if (typeof parsed.date !== 'string') return null;
                if (parsed.date !== today) {
                    localStorage.removeItem(KEY);
                    return null;
                }
                if (!Array.isArray(parsed.sellers) || !Array.isArray(parsed.products) || !Array.isArray(parsed.ratings)) return null;
                return { date: parsed.date, sellers: parsed.sellers as Seller[], products: parsed.products as Product[], ratings: parsed.ratings as Rating[] };
            } catch {
                try {
                    localStorage.removeItem(KEY);
                } catch {
                }
                return null;
            }
        }

        function writeCache(next: { sellers: Seller[]; products: Product[]; ratings: Rating[] }) {
            try {
                localStorage.setItem(KEY, JSON.stringify({ date: today, ...next }));
            } catch {
            }
        }

        function mapSeller(row: any): Seller {
            return {
                id: String(row.id ?? ''),
                name: String(row.name ?? ''),
                nameAr: String(row.name_ar ?? row.nameAr ?? ''),
                avatar: String(row.avatar ?? ''),
                coverImage: String(row.cover_image ?? row.coverImage ?? ''),
                bio: String(row.bio ?? ''),
                location: String(row.location ?? ''),
                locationAr: String(row.location_ar ?? row.locationAr ?? ''),
                whatsapp: String(row.whatsapp ?? ''),
                instagram: String(row.instagram ?? ''),
                tiktok: String(row.tiktok ?? ''),
                isVerified: Boolean(row.is_verified ?? row.isVerified),
                rating: Number(row.rating ?? 0),
                totalRatings: Number(row.total_ratings ?? row.totalRatings ?? 0),
                totalSales: Number(row.total_sales ?? row.totalSales ?? 0),
                joinedDate: String(row.joined_date ?? row.joinedDate ?? ''),
                categories: Array.isArray(row.categories) ? row.categories.map(String) : [],
                viewCount: Number(row.view_count ?? row.viewCount ?? 0),
                deliveryInfo: String(row.delivery_info ?? row.deliveryInfo ?? 'توصيل لكل العراق'),
                productCount: Number(row.product_count ?? row.productCount ?? 0),
                featuredProductId: row.featured_product_id ?? row.featuredProductId ?? undefined,
            };
        }

        function mapProduct(row: any): Product {
            return {
                id: String(row.id ?? ''),
                sellerId: String(row.seller_id ?? row.sellerId ?? ''),
                name: String(row.name ?? ''),
                nameAr: String(row.name_ar ?? row.nameAr ?? ''),
                description: String(row.description ?? ''),
                descriptionAr: String(row.description_ar ?? row.descriptionAr ?? ''),
                price: Number(row.price ?? 0),
                originalPrice: row.original_price ?? row.originalPrice ?? undefined,
                currency: String(row.currency ?? 'IQD'),
                images: Array.isArray(row.images) ? row.images.map(String) : [],
                category: String(row.category ?? ''),
                categoryAr: String(row.category_ar ?? row.categoryAr ?? ''),
                inStock: Boolean(row.in_stock ?? row.inStock ?? true),
                viewCount: Number(row.view_count ?? row.viewCount ?? 0),
                createdAt: String(row.created_at ?? row.createdAt ?? ''),
                tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
                isVerified: Boolean(row.is_verified ?? row.isVerified),
                verificationStatus: (row.verification_status ?? row.verificationStatus ?? 'none') as any,
                verifiedAt: row.verified_at ?? row.verifiedAt ?? undefined,
                verificationBadge: row.verification_badge ?? row.verificationBadge ?? undefined,
            };
        }

        function mapRating(row: any): Rating {
            return {
                id: String(row.id ?? ''),
                sellerId: String(row.seller_id ?? row.sellerId ?? ''),
                buyerName: String(row.buyer_name ?? row.buyerName ?? ''),
                rating: Number(row.rating ?? 0),
                comment: String(row.comment ?? ''),
                verified: Boolean(row.verified ?? false),
                date: String(row.date ?? ''),
            };
        }

        let cancelled = false;

        async function init() {
            setIsLoading(true);
            setError(null);

            const cached = readCache();
            if (cached && !cancelled) {
                setSellers(cached.sellers);
                setVerifiedSellers(getVerifiedSellersLocal(cached.sellers));
                setProducts(cached.products);
                setRatings(cached.ratings);
                replaceMarketplaceData({ sellers: cached.sellers, products: cached.products, ratings: cached.ratings });
            }

            if (!isSupabaseConfigured || !supabase) {
                setIsLoading(false);
                return;
            }

            try {
                const [{ data: sellersData, error: sellersError }, { data: productsData, error: productsError }, { data: ratingsData, error: ratingsError }] = await Promise.all([
                    supabase.from('sellers').select('*'),
                    supabase.from('products').select('*'),
                    supabase.from('ratings').select('*'),
                ]);

                if (cancelled) return;
                if (sellersError) throw sellersError;
                if (productsError) throw productsError;
                if (ratingsError) throw ratingsError;

                let finalSellersData = sellersData ?? [];
                let finalProductsData = productsData ?? [];
                let finalRatingsData = ratingsData ?? [];

                const shouldSeed = finalSellersData.length === 0 && finalProductsData.length === 0;
                if (shouldSeed) {
                    const seedSellers = (cached?.sellers?.length ? cached.sellers : mockSellers) ?? [];
                    const seedProducts = (cached?.products?.length ? cached.products : mockProducts) ?? [];
                    const seedRatings = (cached?.ratings?.length ? cached.ratings : mockRatings) ?? [];

                    if (seedSellers.length > 0 || seedProducts.length > 0 || seedRatings.length > 0) {
                        const sellersRows = seedSellers.map(s => ({
                            id: s.id,
                            name: s.name,
                            name_ar: s.nameAr,
                            avatar: s.avatar,
                            cover_image: s.coverImage,
                            bio: s.bio,
                            location: s.location,
                            location_ar: s.locationAr,
                            whatsapp: s.whatsapp,
                            instagram: s.instagram,
                            tiktok: s.tiktok,
                            is_verified: s.isVerified,
                            rating: s.rating,
                            total_ratings: s.totalRatings,
                            total_sales: s.totalSales,
                            joined_date: s.joinedDate,
                            categories: s.categories,
                            view_count: s.viewCount,
                            delivery_info: s.deliveryInfo,
                            product_count: s.productCount,
                            featured_product_id: s.featuredProductId ?? null,
                        }));
                        const productsRows = seedProducts.map(p => ({
                            id: p.id,
                            seller_id: p.sellerId,
                            name: p.name,
                            name_ar: p.nameAr,
                            description: p.description,
                            description_ar: p.descriptionAr,
                            price: p.price,
                            original_price: p.originalPrice ?? null,
                            currency: p.currency,
                            images: p.images,
                            category: p.category,
                            category_ar: p.categoryAr,
                            in_stock: p.inStock,
                            view_count: p.viewCount,
                            created_at: p.createdAt,
                            tags: p.tags,
                            is_verified: p.isVerified,
                            verification_status: p.verificationStatus,
                            verified_at: p.verifiedAt ?? null,
                            verification_badge: p.verificationBadge ?? null,
                        }));
                        const ratingsRows = seedRatings.map(r => ({
                            id: r.id,
                            seller_id: r.sellerId,
                            buyer_name: r.buyerName,
                            rating: r.rating,
                            comment: r.comment,
                            verified: r.verified,
                            date: r.date,
                        }));

                        if (sellersRows.length) {
                            const { error: seedSellersError } = await supabase.from('sellers').insert(sellersRows);
                            if (seedSellersError) throw seedSellersError;
                        }
                        if (productsRows.length) {
                            const { error: seedProductsError } = await supabase.from('products').insert(productsRows);
                            if (seedProductsError) throw seedProductsError;
                        }
                        if (ratingsRows.length) {
                            const { error: seedRatingsError } = await supabase.from('ratings').insert(ratingsRows);
                            if (seedRatingsError) throw seedRatingsError;
                        }

                        const [{ data: seededSellers, error: seededSellersError }, { data: seededProducts, error: seededProductsError }, { data: seededRatings, error: seededRatingsError }] = await Promise.all([
                            supabase.from('sellers').select('*'),
                            supabase.from('products').select('*'),
                            supabase.from('ratings').select('*'),
                        ]);
                        if (seededSellersError) throw seededSellersError;
                        if (seededProductsError) throw seededProductsError;
                        if (seededRatingsError) throw seededRatingsError;

                        finalSellersData = seededSellers ?? [];
                        finalProductsData = seededProducts ?? [];
                        finalRatingsData = seededRatings ?? [];
                    }
                }

                const nextSellers = finalSellersData.map(mapSeller);
                const nextProducts = finalProductsData.map(mapProduct);
                const nextRatings = finalRatingsData.map(mapRating);

                setSellers(nextSellers);
                setVerifiedSellers(getVerifiedSellersLocal(nextSellers));
                setProducts(nextProducts);
                setRatings(nextRatings);
                replaceMarketplaceData({ sellers: nextSellers, products: nextProducts, ratings: nextRatings });
                writeCache({ sellers: nextSellers, products: nextProducts, ratings: nextRatings });
                setIsLoading(false);
            } catch (err) {
                if (cancelled) return;
                const errorMessage = err instanceof Error ? err.message : 'Failed to load marketplace data';
                setError(errorMessage);
                setIsLoading(false);
            }
        }

        void init();
        return () => {
            cancelled = true;
        };
    }, [getVerifiedSellersLocal]);

    // Actions
    const fetchSellerById = useCallback((id: string) => {
        const seller = getSellerByIdLocal(id);
        if (!seller) return undefined;
        const { average, count } = getSellerRatingSummaryLocal(id);
        return { ...seller, rating: average, totalRatings: count };
    }, [getSellerByIdLocal, getSellerRatingSummaryLocal]);

    const fetchVerifiedSellers = useCallback(() => {
        const list = getVerifiedSellersLocal(sellers);
        setVerifiedSellers(list);
        return list;
    }, [getVerifiedSellersLocal, sellers]);

    const fetchAllSellers = useCallback(() => {
        return sellers;
    }, [sellers]);

    const checkVerification = useCallback((sellerId: string) => {
        return Boolean(getSellerByIdLocal(sellerId)?.isVerified);
    }, [getSellerByIdLocal]);

    const fetchSellerProducts = useCallback((sellerId: string) => {
        const list = getProductsBySellerLocal(sellerId);
        setSellerProducts(list);
        return list;
    }, [getProductsBySellerLocal]);

    const fetchProductsSortedByVerification = useCallback(() => {
        return sortProductsByVerification(products);
    }, [products]);

    const sortProductsByVerificationStatus = useCallback((productsList: Product[]) => {
        return sortProductsByVerification(productsList);
    }, []);

    const getDeliveryInfo = useCallback((sellerId: string) => {
        return getSellerByIdLocal(sellerId)?.deliveryInfo || 'توصيل لكل العراق';
    }, [getSellerByIdLocal]);

    const getProductCount = useCallback((sellerId: string) => {
        const seller = getSellerByIdLocal(sellerId);
        return seller?.productCount || products.filter(p => p.sellerId === sellerId).length;
    }, [getSellerByIdLocal, products]);

    const createProduct = useCallback((sellerId: string, input: SimplifiedProductInput) => {
        setIsLoading(true);
        setError(null);
        return (async () => {
            try {
                const seller = getSellerByIdLocal(sellerId);
                if (!seller) throw new Error('Seller not found');

                if (isSupabaseConfigured && supabase) {
                    const payload: any = {
                        id: `p-${Date.now()}`,
                        seller_id: sellerId,
                        name: input.name,
                        name_ar: input.nameAr,
                        description: input.description,
                        description_ar: input.descriptionAr,
                        price: input.price,
                        currency: 'IQD',
                        images: [input.image],
                        category: input.category,
                        category_ar: input.categoryAr,
                        in_stock: true,
                        view_count: 0,
                        created_at: new Date().toISOString().split('T')[0],
                        tags: [],
                        is_verified: false,
                        verification_status: 'none',
                    };

                    const { data, error } = await supabase.from('products').insert(payload).select('*').single();
                    if (error) throw error;
                    const created = {
                        id: String(data.id),
                        sellerId: String(data.seller_id ?? sellerId),
                        name: String(data.name ?? input.name),
                        nameAr: String(data.name_ar ?? input.nameAr),
                        description: String(data.description ?? input.description),
                        descriptionAr: String(data.description_ar ?? input.descriptionAr),
                        price: Number(data.price ?? input.price),
                        originalPrice: data.original_price ?? undefined,
                        currency: String(data.currency ?? 'IQD'),
                        images: Array.isArray(data.images) ? data.images.map(String) : [input.image],
                        category: String(data.category ?? input.category),
                        categoryAr: String(data.category_ar ?? input.categoryAr),
                        inStock: Boolean(data.in_stock ?? true),
                        viewCount: Number(data.view_count ?? 0),
                        createdAt: String(data.created_at ?? new Date().toISOString().split('T')[0]),
                        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
                        isVerified: Boolean(data.is_verified ?? false),
                        verificationStatus: (data.verification_status ?? 'none') as any,
                        verifiedAt: data.verified_at ?? undefined,
                        verificationBadge: data.verification_badge ?? undefined,
                    } as Product;

                    const nextProducts = [created, ...products];
                    setProducts(nextProducts);
                    replaceMarketplaceData({ products: nextProducts });
                    setIsLoading(false);
                    return created;
                }

                const created = createProductForSeller(sellerId, input);
                const nextProducts = [created, ...products];
                setProducts(nextProducts);
                replaceMarketplaceData({ products: nextProducts });
                setIsLoading(false);
                return created;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
                setError(errorMessage);
                setIsLoading(false);
                throw err;
            }
        })();
    }, [getSellerByIdLocal, products]);

    const uploadImage = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            const url = await uploadProductImage(file);
            setIsLoading(false);
            return url;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
            setError(errorMessage);
            setIsLoading(false);
            throw err;
        }
    }, []);

    const fetchSellerStats = useCallback((sellerId: string) => {
        const seller = getSellerByIdLocal(sellerId);
        const sellerProductsList = getProductsBySellerLocal(sellerId);
        const totalViews = sellerProductsList.reduce((sum, p) => sum + p.viewCount, 0);
        const stats = {
            productCount: sellerProductsList.length,
            totalViews,
            isVerified: seller?.isVerified || false,
            deliveryInfo: seller?.deliveryInfo || 'توصيل لكل العراق',
        };
        setDashboardStats(stats);
        return stats;
    }, [getProductsBySellerLocal, getSellerByIdLocal]);

    const search = useCallback((query: string) => {
        const q = query.toLowerCase();
        return sellers.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.nameAr.includes(q) ||
            s.bio.toLowerCase().includes(q)
        );
    }, [sellers]);

    const fetchTopSellers = useCallback((limit?: number) => {
        const list = [...sellers].sort((a, b) => {
            if (a.isVerified && !b.isVerified) return -1;
            if (!a.isVerified && b.isVerified) return 1;
            const aRating = getSellerRatingSummaryLocal(a.id).average;
            const bRating = getSellerRatingSummaryLocal(b.id).average;
            return bRating - aRating;
        });
        return list.slice(0, limit ?? 4);
    }, [getSellerRatingSummaryLocal, sellers]);

    const fetchSellersByCategory = useCallback((category: string) => {
        return sellers.filter(s => s.categories.includes(category));
    }, [sellers]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const updateSocialLinks = useCallback((sellerId: string, links: { instagram?: string; tiktok?: string }) => {
        setIsLoading(true);
        setError(null);
        return (async () => {
            try {
                const seller = getSellerByIdLocal(sellerId);
                if (!seller) throw new Error('Seller not found');
                if (!seller.isVerified) throw new Error('Seller must be verified to set social links');

                const nextInstagram = links.instagram !== undefined ? normalizeSocialHandle(links.instagram) : seller.instagram;
                const nextTiktok = links.tiktok !== undefined ? normalizeSocialHandle(links.tiktok) : seller.tiktok;

                if (isSupabaseConfigured && supabase) {
                    const { data, error } = await supabase
                        .from('sellers')
                        .update({ instagram: nextInstagram, tiktok: nextTiktok })
                        .eq('id', sellerId)
                        .select('*')
                        .single();
                    if (error) throw error;
                    const updatedSeller = {
                        ...seller,
                        instagram: String(data.instagram ?? nextInstagram),
                        tiktok: String(data.tiktok ?? nextTiktok),
                    };
                    const nextSellers = sellers.map(s => (s.id === sellerId ? updatedSeller : s));
                    setSellers(nextSellers);
                    setVerifiedSellers(getVerifiedSellersLocal(nextSellers));
                    setCurrentSeller((prev) => (prev?.id === sellerId ? updatedSeller : prev));
                    replaceMarketplaceData({ sellers: nextSellers });
                    setIsLoading(false);
                    return updatedSeller;
                }

                const updatedSeller = { ...seller, instagram: nextInstagram, tiktok: nextTiktok };
                const nextSellers = sellers.map(s => (s.id === sellerId ? updatedSeller : s));
                setSellers(nextSellers);
                setVerifiedSellers(getVerifiedSellersLocal(nextSellers));
                setCurrentSeller((prev) => (prev?.id === sellerId ? updatedSeller : prev));
                replaceMarketplaceData({ sellers: nextSellers });
                setIsLoading(false);
                return updatedSeller;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to update social links';
                setError(errorMessage);
                setIsLoading(false);
                throw err;
            }
        })();
    }, [getSellerByIdLocal, getVerifiedSellersLocal, normalizeSocialHandle, sellers]);

    const updateFeaturedProduct = useCallback((sellerId: string, featuredProductId: string | null) => {
        setIsLoading(true);
        setError(null);
        return (async () => {
            try {
                const seller = getSellerByIdLocal(sellerId);
                if (!seller) throw new Error('Seller not found');
                if (!seller.isVerified) throw new Error('Seller must be verified to set featured product');

                if (featuredProductId) {
                    const product = products.find(p => p.id === featuredProductId);
                    if (!product || product.sellerId !== sellerId) throw new Error('Invalid featured product');
                }

                if (isSupabaseConfigured && supabase) {
                    const { data, error } = await supabase
                        .from('sellers')
                        .update({ featured_product_id: featuredProductId })
                        .eq('id', sellerId)
                        .select('*')
                        .single();
                    if (error) throw error;
                    const updatedSeller = {
                        ...seller,
                        featuredProductId: (data.featured_product_id ?? featuredProductId ?? undefined) as any,
                    };
                    const nextSellers = sellers.map(s => (s.id === sellerId ? updatedSeller : s));
                    setSellers(nextSellers);
                    setVerifiedSellers(getVerifiedSellersLocal(nextSellers));
                    setCurrentSeller((prev) => (prev?.id === sellerId ? updatedSeller : prev));
                    replaceMarketplaceData({ sellers: nextSellers });
                    setIsLoading(false);
                    return updatedSeller;
                }

                const updatedSeller = { ...seller, featuredProductId: featuredProductId ?? undefined };
                const nextSellers = sellers.map(s => (s.id === sellerId ? updatedSeller : s));
                setSellers(nextSellers);
                setVerifiedSellers(getVerifiedSellersLocal(nextSellers));
                setCurrentSeller((prev) => (prev?.id === sellerId ? updatedSeller : prev));
                replaceMarketplaceData({ sellers: nextSellers });
                setIsLoading(false);
                return updatedSeller;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to update featured product';
                setError(errorMessage);
                setIsLoading(false);
                throw err;
            }
        })();
    }, [getSellerByIdLocal, getVerifiedSellersLocal, products, sellers]);

    // Context value
    const value: SellerContextType = {
        // State
        currentSeller,
        sellers,
        verifiedSellers,
        products,
        ratings,
        sellerProducts,
        isLoading,
        error,
        dashboardStats,
        // Actions
        fetchSellerById,
        fetchVerifiedSellers,
        fetchAllSellers,
        checkVerification,
        fetchSellerProducts,
        fetchProductsSortedByVerification,
        sortProductsByVerificationStatus,
        getDeliveryInfo,
        getProductCount,
        createProduct,
        uploadImage,
        fetchSellerStats,
        search,
        fetchTopSellers,
        fetchSellersByCategory,
        setCurrentSeller,
        updateSocialLinks,
        updateFeaturedProduct,
        clearError,
    };

    return (
        <SellerContext.Provider value={value}>
            {children}
        </SellerContext.Provider>
    );
}

/**
 * Custom hook to use the seller context
 */
export function useSeller(): SellerContextType {
    const context = useContext(SellerContext);
    if (context === undefined) {
        throw new Error('useSeller must be used within a SellerProvider');
    }
    return context;
}

// Export types
export type { SellerState, SellerActions, SellerContextType };
