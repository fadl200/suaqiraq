/**
 * useInView Hook - Intersection Observer for View Tracking
 * 
 * This hook detects when an element becomes visible in the viewport
 * and triggers view tracking. It prevents multiple counts for the same
 * user/session using the views service.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { trackProductView, wasProductViewedByUser } from '../services/viewsService';

interface UseInViewOptions {
    /** Product ID to track */
    productId: string;
    /** Threshold for visibility (0-1, percentage of element visible) */
    threshold?: number;
    /** Root margin for early triggering */
    rootMargin?: string;
    /** Whether to track views (can be disabled) */
    enabled?: boolean;
    /** Minimum time element must be visible before counting (ms) */
    minVisibleTime?: number;
    /** Callback when view is tracked */
    onViewTracked?: (productId: string, viewCount: number) => void;
    /** Only track once per component mount */
    trackOnce?: boolean;
}

interface UseInViewReturn {
    /** Ref to attach to the element to track */
    ref: (node: HTMLElement | null) => void;
    /** Whether the element is currently in view */
    isInView: boolean;
    /** Whether the view has been tracked */
    hasTracked: boolean;
    /** Current view count for the product */
    viewCount: number;
    /** Manually trigger view tracking */
    trackView: () => void;
}

/**
 * Hook to track when an element becomes visible in the viewport
 */
export function useInView({
    productId,
    threshold = 0.5,
    rootMargin = '0px',
    enabled = true,
    minVisibleTime = 500,
    onViewTracked,
    trackOnce = true,
}: UseInViewOptions): UseInViewReturn {
    const [isInView, setIsInView] = useState(false);
    const [hasTracked, setHasTracked] = useState(false);
    const [viewCount, setViewCount] = useState(0);

    const elementRef = useRef<HTMLElement | null>(null);
    const visibilityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasTrackedRef = useRef(false);

    // Check if already viewed on mount
    useEffect(() => {
        if (enabled && trackOnce) {
            const alreadyViewed = wasProductViewedByUser(productId);
            if (alreadyViewed) {
                hasTrackedRef.current = true;
                setHasTracked(true);
            }
        }
    }, [productId, enabled, trackOnce]);

    // Clear timer on unmount
    useEffect(() => {
        return () => {
            if (visibilityTimerRef.current) {
                clearTimeout(visibilityTimerRef.current);
            }
        };
    }, []);

    // Track view function
    const trackView = useCallback(() => {
        if (!enabled || hasTrackedRef.current) return;

        const result = trackProductView(productId);

        if (result.recorded) {
            hasTrackedRef.current = true;
            setHasTracked(true);
            setViewCount(result.viewCount);
            onViewTracked?.(productId, result.viewCount);
        }
    }, [productId, enabled, onViewTracked]);

    // Intersection Observer callback
    const handleIntersection = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;
            const isElementInView = entry.isIntersecting;

            setIsInView(isElementInView);

            if (isElementInView && enabled && !hasTrackedRef.current) {
                // Element is visible - start timer for minimum visible time
                if (minVisibleTime > 0) {
                    visibilityTimerRef.current = setTimeout(() => {
                        if (!hasTrackedRef.current) {
                            trackView();
                        }
                    }, minVisibleTime);
                } else {
                    // No minimum time - track immediately
                    trackView();
                }
            } else if (!isElementInView) {
                // Element is not visible - clear any pending timer
                if (visibilityTimerRef.current) {
                    clearTimeout(visibilityTimerRef.current);
                    visibilityTimerRef.current = null;
                }
            }
        },
        [enabled, minVisibleTime, trackView]
    );

    // Set up Intersection Observer
    const setRef = useCallback(
        (node: HTMLElement | null) => {
            // Clean up previous observer
            if (elementRef.current) {
                const observer = new IntersectionObserver(() => { }, {});
                observer.disconnect();
            }

            elementRef.current = node;

            if (node && enabled) {
                const observer = new IntersectionObserver(handleIntersection, {
                    threshold,
                    rootMargin,
                });

                observer.observe(node);

                // Store observer for cleanup
                return () => observer.disconnect();
            }
        },
        [enabled, threshold, rootMargin, handleIntersection]
    );

    // Set up observer when element ref changes
    useEffect(() => {
        if (!elementRef.current || !enabled) return;

        const observer = new IntersectionObserver(handleIntersection, {
            threshold,
            rootMargin,
        });

        observer.observe(elementRef.current);

        return () => observer.disconnect();
    }, [enabled, threshold, rootMargin, handleIntersection]);

    return {
        ref: setRef,
        isInView,
        hasTracked,
        viewCount,
        trackView,
    };
}

/**
 * Simplified hook that just tracks when element is visible
 */
export function useTrackViewOnVisible(
    productId: string,
    options: Omit<UseInViewOptions, 'productId'> = {}
): (node: HTMLElement | null) => void {
    const { ref } = useInView({ ...options, productId });
    return ref;
}

export default useInView;
