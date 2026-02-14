/**
 * Views Context - Provides view tracking functionality to the app
 * 
 * This context provides:
 * - View tracking functions
 * - View count state
 * - Batch view processing
 */

import { createContext, useContext, useEffect, useCallback, useState } from 'react';
import {
    trackProductView,
    getProductViewCount,
    getBatchViewCounts,
    formatViewCount,
    flushPendingViews,
} from '../services/viewsService';
import { useStore } from '../store/useStore';

// ==================== Types ====================

interface ViewsContextValue {
    /** Track a product view */
    trackView: (productId: string) => { recorded: boolean; viewCount: number };
    /** Get view count for a product */
    getViewCount: (productId: string) => number;
    /** Get formatted view count for display */
    getFormattedViewCount: (productId: string) => string;
    /** View counts state */
    viewCounts: Record<string, number>;
    /** Update view count for a product in state */
    updateViewCount: (productId: string, count: number) => void;
    /** Batch update view counts */
    batchUpdateViewCounts: (productIds: string[]) => void;
    /** Whether a view is currently being tracked */
    isTracking: boolean;
}

const ViewsContext = createContext<ViewsContextValue | null>(null);

// ==================== Provider ====================

interface ViewsProviderProps {
    children: React.ReactNode;
}

export function ViewsProvider({ children }: ViewsProviderProps) {
    const language = useStore((s) => s.language);
    const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
    const [isTracking, setIsTracking] = useState(false);

    // Load initial view counts from storage
    useEffect(() => {
        const storedCounts = getBatchViewCounts(Object.keys(viewCounts));
        if (Object.keys(storedCounts).length > 0) {
            setViewCounts((prev) => ({ ...prev, ...storedCounts }));
        }
    }, []);

    // Flush pending views on page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            flushPendingViews();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            flushPendingViews();
        };
    }, []);

    // Track a product view
    const trackView = useCallback((productId: string): { recorded: boolean; viewCount: number } => {
        setIsTracking(true);

        const result = trackProductView(productId);

        if (result.recorded) {
            setViewCounts((prev) => ({
                ...prev,
                [productId]: result.viewCount,
            }));
        }

        setIsTracking(false);
        return result;
    }, []);

    // Get view count for a product
    const getViewCount = useCallback((productId: string): number => {
        // First check local state
        if (viewCounts[productId] !== undefined) {
            return viewCounts[productId];
        }
        // Then check storage
        return getProductViewCount(productId);
    }, [viewCounts]);

    // Get formatted view count
    const getFormattedViewCount = useCallback((productId: string): string => {
        const count = getViewCount(productId);
        return formatViewCount(count, language);
    }, [getViewCount, language]);

    // Update view count in state
    const updateViewCount = useCallback((productId: string, count: number) => {
        setViewCounts((prev) => ({
            ...prev,
            [productId]: count,
        }));
    }, []);

    // Batch update view counts
    const batchUpdateViewCounts = useCallback((productIds: string[]) => {
        const counts = getBatchViewCounts(productIds);
        setViewCounts((prev) => ({
            ...prev,
            ...counts,
        }));
    }, []);

    const value: ViewsContextValue = {
        trackView,
        getViewCount,
        getFormattedViewCount,
        viewCounts,
        updateViewCount,
        batchUpdateViewCounts,
        isTracking,
    };

    return (
        <ViewsContext.Provider value={value}>
            {children}
        </ViewsContext.Provider>
    );
}

// ==================== Hook ====================

/**
 * Hook to access the views context
 */
export function useViews(): ViewsContextValue {
    const context = useContext(ViewsContext);

    if (!context) {
        throw new Error('useViews must be used within a ViewsProvider');
    }

    return context;
}

/**
 * Hook to track a product view on mount
 */
export function useTrackView(productId: string, enabled: boolean = true): number {
    const { trackView, viewCounts } = useViews();

    useEffect(() => {
        if (enabled && productId) {
            trackView(productId);
        }
    }, [productId, enabled, trackView]);

    return viewCounts[productId] || 0;
}

export default ViewsContext;
