/**
 * Seller Service
 * Handles all seller-related operations including:
 * - Getting seller by ID
 * - Getting verified sellers
 * - Getting seller products (sorted by verification)
 * - Creating new products for sellers (simplified form)
 * - Uploading product images
 * - Checking seller verification status
 */

import { Seller, Product, getSellerRatingSummary, products, sellers } from '../store/data';

// Default delivery info for all sellers
export const DEFAULT_DELIVERY_INFO = 'توصيل لكل العراق';

function normalizeSocialHandle(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return '';
    const withoutProtocol = trimmed
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '');
    const parts = withoutProtocol.split('/').filter(Boolean);
    const last = parts[parts.length - 1] ?? '';
    return last.replace(/^@+/, '').trim();
}

// Simplified product input for verified sellers
export interface SimplifiedProductInput {
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    image: string;
    category: string;
    categoryAr: string;
    price: number;
}

/**
 * Get a seller by their ID
 */
export function getSellerById(id: string): Seller | undefined {
    const seller = sellers.find(s => s.id === id);
    if (!seller) return undefined;
    const { average, count } = getSellerRatingSummary(id);
    return { ...seller, rating: average, totalRatings: count };
}

/**
 * Get all verified sellers
 */
export function getVerifiedSellers(): Seller[] {
    return sellers.filter(s => s.isVerified);
}

/**
 * Get all sellers
 */
export function getAllSellers(): Seller[] {
    return [...sellers];
}

/**
 * Check if a seller is verified
 */
export function isSellerVerified(sellerId: string): boolean {
    const seller = getSellerById(sellerId);
    return seller?.isVerified || false;
}

/**
 * Get products by seller ID
 */
export function getProductsBySeller(sellerId: string): Product[] {
    return products.filter(p => p.sellerId === sellerId);
}

/**
 * Get products sorted by seller verification status
 * Verified sellers' products appear first
 */
export function getProductsSortedByVerification(): Product[] {
    const verifiedSellerIds = new Set(
        sellers.filter(s => s.isVerified).map(s => s.id)
    );

    return [...products].sort((a, b) => {
        const aVerified = verifiedSellerIds.has(a.sellerId);
        const bVerified = verifiedSellerIds.has(b.sellerId);

        if (aVerified && !bVerified) return -1;
        if (!aVerified && bVerified) return 1;
        return 0; // Keep original order within groups
    });
}

/**
 * Sort products array by seller verification status
 * Returns a new sorted array
 */
export function sortProductsByVerification(productsList: Product[]): Product[] {
    const verifiedSellerIds = new Set(
        sellers.filter(s => s.isVerified).map(s => s.id)
    );

    return [...productsList].sort((a, b) => {
        const aVerified = verifiedSellerIds.has(a.sellerId);
        const bVerified = verifiedSellerIds.has(b.sellerId);

        if (aVerified && !bVerified) return -1;
        if (!aVerified && bVerified) return 1;
        return 0;
    });
}

/**
 * Get seller's delivery info
 * All sellers have "توصيل لكل العراق" by default
 */
export function getSellerDeliveryInfo(sellerId: string): string {
    const seller = getSellerById(sellerId);
    return seller?.deliveryInfo || DEFAULT_DELIVERY_INFO;
}

/**
 * Get seller's product count
 */
export function getSellerProductCount(sellerId: string): number {
    const seller = getSellerById(sellerId);
    return seller?.productCount || products.filter(p => p.sellerId === sellerId).length;
}

/**
 * Create a new product for a seller (simplified form)
 * Pre-fills seller info like phone, store name, delivery
 */
export function createProductForSeller(
    sellerId: string,
    input: SimplifiedProductInput
): Product {
    const seller = getSellerById(sellerId);
    if (!seller) {
        throw new Error('Seller not found');
    }

    const newProduct: Product = {
        id: `p-${Date.now()}`,
        sellerId,
        name: input.name,
        nameAr: input.nameAr,
        description: input.description,
        descriptionAr: input.descriptionAr,
        price: input.price,
        currency: 'IQD',
        images: [input.image],
        category: input.category,
        categoryAr: input.categoryAr,
        inStock: true,
        viewCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        tags: [],
        // Product verification fields - new products start as unverified
        isVerified: false,
        verificationStatus: 'none',
    };

    return newProduct;
}

/**
 * Upload product image (mock implementation)
 * In a real app, this would upload to a storage service
 */
export async function uploadProductImage(file: File): Promise<string> {
    // Mock implementation - returns a placeholder URL
    // In production, this would upload to Firebase Storage, S3, etc.
    return new Promise((resolve) => {
        // Simulate upload delay
        setTimeout(() => {
            // Create a local URL for the file (for demo purposes)
            const url = URL.createObjectURL(file);
            resolve(url);
        }, 1000);
    });
}

/**
 * Get seller statistics
 */
export function getSellerStats(sellerId: string): {
    productCount: number;
    totalViews: number;
    isVerified: boolean;
    deliveryInfo: string;
} {
    const seller = getSellerById(sellerId);
    const sellerProducts = getProductsBySeller(sellerId);
    const totalViews = sellerProducts.reduce((sum, p) => sum + p.viewCount, 0);

    return {
        productCount: sellerProducts.length,
        totalViews,
        isVerified: seller?.isVerified || false,
        deliveryInfo: seller?.deliveryInfo || DEFAULT_DELIVERY_INFO,
    };
}

/**
 * Search sellers by name or bio
 */
export function searchSellers(query: string): Seller[] {
    const q = query.toLowerCase();
    return sellers.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.nameAr.includes(q) ||
        s.bio.toLowerCase().includes(q)
    );
}

/**
 * Get top sellers (sorted by rating)
 */
export function getTopSellers(limit: number = 4): Seller[] {
    const ratingBySellerId = new Map(sellers.map(s => [s.id, getSellerRatingSummary(s.id).average]));
    return [...sellers].sort((a, b) => {
        const aRating = ratingBySellerId.get(a.id) ?? 0;
        const bRating = ratingBySellerId.get(b.id) ?? 0;
        return bRating - aRating;
    }).slice(0, limit);
}

/**
 * Get sellers by category
 */
export function getSellersByCategory(category: string): Seller[] {
    return sellers.filter(s => s.categories.includes(category));
}

export function updateSellerSocialLinks(
    sellerId: string,
    links: { instagram?: string; tiktok?: string }
): Seller {
    const idx = sellers.findIndex(s => s.id === sellerId);
    if (idx === -1) {
        throw new Error('Seller not found');
    }

    if (!sellers[idx].isVerified) {
        throw new Error('Seller must be verified to set social links');
    }

    if (links.instagram !== undefined) {
        sellers[idx].instagram = normalizeSocialHandle(links.instagram);
    }
    if (links.tiktok !== undefined) {
        sellers[idx].tiktok = normalizeSocialHandle(links.tiktok);
    }

    const updated = getSellerById(sellerId);
    if (!updated) {
        throw new Error('Seller not found');
    }
    return updated;
}

export function updateSellerFeaturedProduct(
    sellerId: string,
    featuredProductId: string | null
): Seller {
    const idx = sellers.findIndex(s => s.id === sellerId);
    if (idx === -1) {
        throw new Error('Seller not found');
    }

    if (!sellers[idx].isVerified) {
        throw new Error('Seller must be verified to set featured product');
    }

    if (featuredProductId) {
        const product = products.find(p => p.id === featuredProductId);
        if (!product || product.sellerId !== sellerId) {
            throw new Error('Invalid featured product');
        }
        sellers[idx].featuredProductId = featuredProductId;
    } else {
        delete sellers[idx].featuredProductId;
    }

    const updated = getSellerById(sellerId);
    if (!updated) {
        throw new Error('Seller not found');
    }
    return updated;
}
