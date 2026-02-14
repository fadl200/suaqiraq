/**
 * Product Verification Service
 * Handles product verification requests, status, and sorting
 */

import { Product, VerificationStatus, products, getProductById, replaceMarketplaceData } from '../store/data';
import { isSupabaseConfigured, supabase } from './supabaseClient';

// In-memory store for verification requests (would be a database in production)
interface VerificationRequest {
    id: string;
    productId: string;
    sellerId: string;
    status: VerificationStatus;
    requestedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    rejectionReason?: string;
    documents?: string[];
}

// Mock verification requests store
let verificationRequests: VerificationRequest[] = [
    {
        id: 'vr1',
        productId: 'p11',
        sellerId: 's4',
        status: 'pending',
        requestedAt: '2024-03-10',
        documents: ['invoice.pdf', 'product_photo.jpg'],
    },
];

function todayLocal(): string {
    const d = new Date();
    const pad2 = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function mapVerificationRequest(row: any): VerificationRequest {
    return {
        id: String(row.id ?? ''),
        productId: String(row.product_id ?? row.productId ?? ''),
        sellerId: String(row.seller_id ?? row.sellerId ?? ''),
        status: (row.status ?? 'none') as VerificationStatus,
        requestedAt: String(row.requested_at ?? row.requestedAt ?? ''),
        reviewedAt: row.reviewed_at ?? row.reviewedAt ?? undefined,
        reviewedBy: row.reviewed_by ?? row.reviewedBy ?? undefined,
        rejectionReason: row.rejection_reason ?? row.rejectionReason ?? undefined,
        documents: Array.isArray(row.documents) ? row.documents.map(String) : undefined,
    };
}

function updateLocalProduct(productId: string, patch: Partial<Product>) {
    const next = products.map(p => (p.id === productId ? { ...p, ...patch } : p));
    replaceMarketplaceData({ products: next });
}

/**
 * Request product verification
 * Submits a verification request for a product
 */
export async function requestProductVerification(
    productId: string,
    sellerId: string,
    documents?: string[]
): Promise<{ success: boolean; message: string; requestId?: string }> {
    const product = getProductById(productId);

    if (!product) {
        return { success: false, message: 'Product not found' };
    }

    if (product.sellerId !== sellerId) {
        return { success: false, message: 'You can only request verification for your own products' };
    }

    if (product.isVerified) {
        return { success: false, message: 'Product is already verified' };
    }

    if (product.verificationStatus === 'pending') {
        return { success: false, message: 'Verification request already pending' };
    }

    // Create verification request
    const requestId = `vr-${Date.now()}`;
    const request: VerificationRequest = {
        id: requestId,
        productId,
        sellerId,
        status: 'pending',
        requestedAt: todayLocal(),
        documents,
    };

    if (isSupabaseConfigured && supabase) {
        const { error: insertError } = await supabase.from('verification_requests').insert({
            id: requestId,
            product_id: productId,
            seller_id: sellerId,
            status: 'pending',
            requested_at: request.requestedAt,
            documents: documents ?? null,
        } as any);

        if (!insertError) {
            const { error: productError } = await supabase
                .from('products')
                .update({ verification_status: 'pending', is_verified: false } as any)
                .eq('id', productId);
            if (!productError) {
                updateLocalProduct(productId, { verificationStatus: 'pending', isVerified: false });
                verificationRequests.push(request);
                return {
                    success: true,
                    message: 'Verification request submitted successfully',
                    requestId,
                };
            }
        }
    }

    verificationRequests.push(request);
    updateLocalProduct(productId, { verificationStatus: 'pending' });

    return {
        success: true,
        message: 'Verification request submitted successfully',
        requestId
    };
}

/**
 * Get verification status for a product
 */
export function getVerificationStatus(productId: string): {
    status: VerificationStatus;
    request?: VerificationRequest;
    verifiedAt?: string;
} {
    const product = getProductById(productId);

    if (!product) {
        return { status: 'none' };
    }

    const request = verificationRequests.find(r => r.productId === productId);

    return {
        status: product.verificationStatus,
        request,
        verifiedAt: product.verifiedAt,
    };
}

/**
 * Verify a product (admin action)
 */
export async function verifyProduct(
    productId: string,
    adminId: string
): Promise<{ success: boolean; message: string }> {
    const product = getProductById(productId);

    if (!product) {
        return { success: false, message: 'Product not found' };
    }

    const verifiedAt = todayLocal();

    if (isSupabaseConfigured && supabase) {
        const { error: productError } = await supabase
            .from('products')
            .update({ is_verified: true, verification_status: 'verified', verified_at: verifiedAt, verification_badge: 'verified' } as any)
            .eq('id', productId);
        if (!productError) {
            await supabase
                .from('verification_requests')
                .update({ status: 'verified', reviewed_at: verifiedAt, reviewed_by: adminId } as any)
                .eq('product_id', productId);
        }
    }

    updateLocalProduct(productId, { isVerified: true, verificationStatus: 'verified', verifiedAt, verificationBadge: 'verified' });
    const request = verificationRequests.find(r => r.productId === productId);
    if (request) {
        request.status = 'verified';
        request.reviewedAt = verifiedAt;
        request.reviewedBy = adminId;
    }

    return { success: true, message: 'Product verified successfully' };
}

/**
 * Reject a verification request (admin action)
 */
export async function rejectVerification(
    productId: string,
    adminId: string,
    reason: string
): Promise<{ success: boolean; message: string }> {
    const product = getProductById(productId);

    if (!product) {
        return { success: false, message: 'Product not found' };
    }

    const reviewedAt = todayLocal();

    if (isSupabaseConfigured && supabase) {
        const { error: productError } = await supabase
            .from('products')
            .update({ is_verified: false, verification_status: 'rejected' } as any)
            .eq('id', productId);
        if (!productError) {
            await supabase
                .from('verification_requests')
                .update({ status: 'rejected', reviewed_at: reviewedAt, reviewed_by: adminId, rejection_reason: reason } as any)
                .eq('product_id', productId);
        }
    }

    updateLocalProduct(productId, { isVerified: false, verificationStatus: 'rejected' });
    const request = verificationRequests.find(r => r.productId === productId);
    if (request) {
        request.status = 'rejected';
        request.reviewedAt = reviewedAt;
        request.reviewedBy = adminId;
        request.rejectionReason = reason;
    }

    return { success: true, message: 'Verification request rejected' };
}

/**
 * Get all pending verification requests
 */
export async function getPendingVerifications(): Promise<VerificationRequest[]> {
    if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
            .from('verification_requests')
            .select('*')
            .eq('status', 'pending')
            .order('requested_at', { ascending: false });
        if (!error) {
            return (data ?? []).map(mapVerificationRequest);
        }
    }
    return verificationRequests.filter(r => r.status === 'pending');
}

/**
 * Get all verification requests (for admin)
 */
export async function getAllVerificationRequests(): Promise<VerificationRequest[]> {
    if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
            .from('verification_requests')
            .select('*')
            .order('requested_at', { ascending: false });
        if (!error) {
            return (data ?? []).map(mapVerificationRequest);
        }
    }
    return verificationRequests;
}

/**
 * Check if a product is verified
 */
export function isProductVerified(productId: string): boolean {
    const product = getProductById(productId);
    return product?.isVerified ?? false;
}

/**
 * Sort products by verification status
 * Verified products appear first, ratings do NOT affect sorting
 */
export function sortProductsByVerificationStatus(productsList: Product[]): Product[] {
    return [...productsList].sort((a, b) => {
        // Verified products first
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;

        // Pending products next
        if (a.verificationStatus === 'pending' && b.verificationStatus !== 'pending') return -1;
        if (a.verificationStatus !== 'pending' && b.verificationStatus === 'pending') return 1;

        // Ratings do NOT affect sorting - keep original order
        return 0;
    });
}

/**
 * Get verified products
 */
export function getVerifiedProducts(): Product[] {
    return products.filter(p => p.isVerified);
}

/**
 * Get products pending verification
 */
export function getProductsPendingVerification(): Product[] {
    return products.filter(p => p.verificationStatus === 'pending');
}

/**
 * Get verification badge type based on status
 */
export function getVerificationBadgeType(status: VerificationStatus): 'verified' | 'pending' | 'rejected' | 'none' {
    return status;
}

/**
 * Cancel a pending verification request
 */
export async function cancelVerificationRequest(
    productId: string,
    sellerId: string
): Promise<{ success: boolean; message: string }> {
    const product = getProductById(productId);

    if (!product) {
        return { success: false, message: 'Product not found' };
    }

    if (product.sellerId !== sellerId) {
        return { success: false, message: 'You can only cancel your own requests' };
    }

    if (product.verificationStatus !== 'pending') {
        return { success: false, message: 'No pending verification request to cancel' };
    }

    if (isSupabaseConfigured && supabase) {
        const { error: deleteError } = await supabase
            .from('verification_requests')
            .delete()
            .eq('product_id', productId)
            .eq('seller_id', sellerId)
            .eq('status', 'pending');

        if (!deleteError) {
            await supabase
                .from('products')
                .update({ verification_status: 'none' } as any)
                .eq('id', productId);
        }
    }

    verificationRequests = verificationRequests.filter(r => r.productId !== productId);
    updateLocalProduct(productId, { verificationStatus: 'none' });

    return { success: true, message: 'Verification request cancelled' };
}

/**
 * Re-request verification after rejection
 */
export async function reRequestVerification(
    productId: string,
    sellerId: string,
    documents?: string[]
): Promise<{ success: boolean; message: string; requestId?: string }> {
    const product = getProductById(productId);

    if (!product) {
        return { success: false, message: 'Product not found' };
    }

    if (product.verificationStatus !== 'rejected') {
        return { success: false, message: 'Can only re-request after rejection' };
    }

    // Reset status and create new request
    updateLocalProduct(productId, { verificationStatus: 'none' });

    return await requestProductVerification(productId, sellerId, documents);
}

export type { VerificationRequest };
