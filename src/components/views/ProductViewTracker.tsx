/**
 * ProductViewTracker Component - Wrapper that tracks views when product is displayed
 * 
 * This component:
 * - Uses Intersection Observer to detect when product is visible
 * - Tracks views with cooldown to prevent duplicates
 * - Integrates with the views service
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { trackProductView, wasProductViewedByUser } from '../../services/viewsService';

interface ProductViewTrackerProps {
    /** Product ID to track */
    productId: string;
    /** Initial view count from product data */
    initialViewCount?: number;
    /** Children to render */
    children: (props: { ref: (node: HTMLElement | null) => void; viewCount: number; hasTracked: boolean }) => React.ReactNode;
    /** Threshold for visibility (0-1) */
    threshold?: number;
    /** Root margin for early triggering */
    rootMargin?: string;
    /** Whether tracking is enabled */
    enabled?: boolean;
    /** Minimum time element must be visible (ms) */
    minVisibleTime?: number;
    /** Callback when view is tracked */
    onViewTracked?: (productId: string, viewCount: number) => void;
}

export function ProductViewTracker({
    productId,
    initialViewCount = 0,
    children,
    threshold = 0.5,
    rootMargin = '0px',
    enabled = true,
    minVisibleTime = 300,
    onViewTracked,
}: ProductViewTrackerProps) {
    const [viewCount, setViewCount] = useState(initialViewCount);
    const [hasTracked, setHasTracked] = useState(false);
    const elementRef = useRef<HTMLElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasTrackedRef = useRef(false);

    // Check if already viewed on mount
    useEffect(() => {
        if (enabled) {
            const alreadyViewed = wasProductViewedByUser(productId);
            if (alreadyViewed) {
                hasTrackedRef.current = true;
                setHasTracked(true);
            }
        }
    }, [productId, enabled]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    // Track the view
    const trackView = useCallback(() => {
        if (!enabled || hasTrackedRef.current) return;

        const result = trackProductView(productId);

        if (result.recorded) {
            hasTrackedRef.current = true;
            setHasTracked(true);
            setViewCount((prev) => (prev === result.viewCount ? prev : result.viewCount));
            onViewTracked?.(productId, result.viewCount);
        } else {
            // View was not recorded (duplicate within cooldown)
            // Still update the view count from storage
            setViewCount((prev) => (prev === result.viewCount ? prev : result.viewCount));
        }
    }, [productId, enabled, onViewTracked]);

    // Set up intersection observer
    const setRef = useCallback((node: HTMLElement | null) => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        elementRef.current = node;
        if (!node || !enabled) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;

                if (entry.isIntersecting && !hasTrackedRef.current) {
                    // Element is visible - start timer
                    if (minVisibleTime > 0) {
                        timerRef.current = setTimeout(() => {
                            if (!hasTrackedRef.current) {
                                trackView();
                            }
                        }, minVisibleTime);
                    } else {
                        trackView();
                    }
                } else if (!entry.isIntersecting) {
                    // Element not visible - clear timer
                    if (timerRef.current) {
                        clearTimeout(timerRef.current);
                        timerRef.current = null;
                    }
                }
            },
            { threshold, rootMargin }
        );

        observerRef.current = observer;
        observer.observe(node);
    }, [enabled, threshold, rootMargin, minVisibleTime, trackView]);

    return (
        <>
            {children({ ref: setRef, viewCount, hasTracked })}
        </>
    );
}

/**
 * Simplified tracker that just wraps children in a div
 */
interface SimpleTrackerProps {
    productId: string;
    initialViewCount?: number;
    children: React.ReactNode;
    className?: string;
    enabled?: boolean;
    onViewTracked?: (productId: string, viewCount: number) => void;
}

export function SimpleProductViewTracker({
    productId,
    initialViewCount = 0,
    children,
    className = '',
    enabled = true,
    onViewTracked,
}: SimpleTrackerProps) {
    return (
        <ProductViewTracker
            productId={productId}
            initialViewCount={initialViewCount}
            enabled={enabled}
            onViewTracked={onViewTracked}
        >
            {({ ref, viewCount }) => (
                <div ref={ref} className={className} data-view-count={viewCount}>
                    {children}
                </div>
            )}
        </ProductViewTracker>
    );
}

export default ProductViewTracker;
