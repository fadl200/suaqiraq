import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
    Product,
    VerificationStatus,
} from '../store/data';
import {
    requestProductVerification,
    getVerificationStatus,
    verifyProduct,
    rejectVerification,
    getPendingVerifications,
    isProductVerified,
    sortProductsByVerificationStatus,
    cancelVerificationRequest,
    reRequestVerification,
    VerificationRequest,
} from '../services/verificationService';
import { useStore } from '../store/useStore';

// Verification context types
interface VerificationState {
    pendingRequests: VerificationRequest[];
    isLoading: boolean;
    error: string | null;
}

interface VerificationContextType extends VerificationState {
    // Actions
    requestVerification: (productId: string, sellerId: string, documents?: string[]) => Promise<{ success: boolean; message: string }>;
    verify: (productId: string) => Promise<{ success: boolean; message: string }>;
    reject: (productId: string, reason: string) => Promise<{ success: boolean; message: string }>;
    cancelRequest: (productId: string, sellerId: string) => Promise<{ success: boolean; message: string }>;
    reRequest: (productId: string, sellerId: string, documents?: string[]) => Promise<{ success: boolean; message: string }>;

    // Getters
    getStatus: (productId: string) => { status: VerificationStatus; request?: VerificationRequest; verifiedAt?: string };
    isVerified: (productId: string) => boolean;
    sortProducts: (productsList: Product[]) => Product[];
    refreshPendingRequests: () => Promise<void>;
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

export function VerificationProvider({ children }: { children: React.ReactNode }) {
    const isAdmin = useStore((s) => s.isAdmin);
    const [state, setState] = useState<VerificationState>({
        pendingRequests: [],
        isLoading: false,
        error: null,
    });

    // Load pending verification requests
    const refreshPendingRequests = useCallback(async () => {
        const pending = await getPendingVerifications();
        setState(prev => ({ ...prev, pendingRequests: pending }));
    }, []);

    // Initialize on mount
    useEffect(() => {
        void refreshPendingRequests();
    }, [refreshPendingRequests]);

    // Request verification for a product
    const requestVerification = useCallback(async (
        productId: string,
        sellerId: string,
        documents?: string[]
    ): Promise<{ success: boolean; message: string }> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = await requestProductVerification(productId, sellerId, documents);

            if (result.success) {
                void refreshPendingRequests();
            }

            setState(prev => ({ ...prev, isLoading: false }));
            return { success: result.success, message: result.message };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to request verification';
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            return { success: false, message };
        }
    }, [refreshPendingRequests]);

    // Verify a product (admin only)
    const verify = useCallback(async (
        productId: string
    ): Promise<{ success: boolean; message: string }> => {
        if (!isAdmin) {
            return { success: false, message: 'Only admins can verify products' };
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = await verifyProduct(productId, 'admin');

            if (result.success) {
                void refreshPendingRequests();
            }

            setState(prev => ({ ...prev, isLoading: false }));
            return { success: result.success, message: result.message };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to verify product';
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            return { success: false, message };
        }
    }, [isAdmin, refreshPendingRequests]);

    // Reject a verification request (admin only)
    const reject = useCallback(async (
        productId: string,
        reason: string
    ): Promise<{ success: boolean; message: string }> => {
        if (!isAdmin) {
            return { success: false, message: 'Only admins can reject verification requests' };
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = await rejectVerification(productId, 'admin', reason);

            if (result.success) {
                void refreshPendingRequests();
            }

            setState(prev => ({ ...prev, isLoading: false }));
            return { success: result.success, message: result.message };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to reject verification';
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            return { success: false, message };
        }
    }, [isAdmin, refreshPendingRequests]);

    // Cancel a verification request
    const cancelRequest = useCallback(async (
        productId: string,
        sellerId: string
    ): Promise<{ success: boolean; message: string }> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = await cancelVerificationRequest(productId, sellerId);

            if (result.success) {
                void refreshPendingRequests();
            }

            setState(prev => ({ ...prev, isLoading: false }));
            return { success: result.success, message: result.message };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to cancel request';
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            return { success: false, message };
        }
    }, [refreshPendingRequests]);

    // Re-request verification after rejection
    const reRequest = useCallback(async (
        productId: string,
        sellerId: string,
        documents?: string[]
    ): Promise<{ success: boolean; message: string }> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = await reRequestVerification(productId, sellerId, documents);

            if (result.success) {
                void refreshPendingRequests();
            }

            setState(prev => ({ ...prev, isLoading: false }));
            return { success: result.success, message: result.message };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to re-request verification';
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            return { success: false, message };
        }
    }, [refreshPendingRequests]);

    // Get verification status for a product
    const getStatus = useCallback((productId: string) => {
        return getVerificationStatus(productId);
    }, []);

    // Check if a product is verified
    const checkIsVerified = useCallback((productId: string) => {
        return isProductVerified(productId);
    }, []);

    // Sort products by verification status
    const sortProducts = useCallback((productsList: Product[]) => {
        return sortProductsByVerificationStatus(productsList);
    }, []);

    const value: VerificationContextType = {
        ...state,
        requestVerification,
        verify,
        reject,
        cancelRequest,
        reRequest,
        getStatus,
        isVerified: checkIsVerified,
        sortProducts,
        refreshPendingRequests,
    };

    return (
        <VerificationContext.Provider value={value}>
            {children}
        </VerificationContext.Provider>
    );
}

export function useVerification() {
    const context = useContext(VerificationContext);
    if (context === undefined) {
        throw new Error('useVerification must be used within a VerificationProvider');
    }
    return context;
}

export { VerificationContext };
