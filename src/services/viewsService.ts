/**
 * Views Service - Real Views Counting System
 * 
 * This service handles:
 * - Unique visitor identification using fingerprinting + localStorage
 * - View tracking with cooldown period (24h to prevent duplicate views)
 * - View count storage and retrieval
 * - View aggregation for analytics
 */

// ==================== Types ====================

export interface ViewRecord {
    id: string;
    productId: string;
    viewerId: string;
    viewedAt: string;
    sessionId: string;
}

export interface ViewAggregation {
    productId: string;
    date: string;
    viewCount: number;
    uniqueViewCount: number;
}

export interface ViewCounter {
    productId: string;
    totalViews: number;
    todayViews: number;
    lastUpdated: string;
}

export interface ViewsStorage {
    visitorId: string;
    viewRecords: ViewRecord[];
    viewCounts: Record<string, ViewCounter>;
    aggregations: ViewAggregation[];
}

// ==================== Constants ====================

const VIEWS_STORAGE_KEY = 'souq_iraq_views';
const VISITOR_ID_KEY = 'souq_iraq_visitor_id';
const COOLDOWN_HOURS = 24; // 24 hours cooldown for duplicate views
const BATCH_DELAY_MS = 1000; // 1 second batch delay for performance

// ==================== Helper Functions ====================

/**
 * Generate a unique ID
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Check if a date is within the cooldown period
 */
function isWithinCooldown(viewedAt: string): boolean {
    const viewedDate = new Date(viewedAt);
    const now = new Date();
    const diffHours = (now.getTime() - viewedDate.getTime()) / (1000 * 60 * 60);
    return diffHours < COOLDOWN_HOURS;
}

/**
 * Generate a browser fingerprint for unique visitor identification
 * This creates a semi-unique identifier based on browser characteristics
 */
function generateFingerprint(): string {
    const components: string[] = [];

    // Screen information
    components.push(`${screen.width}x${screen.height}`);
    components.push(`${screen.colorDepth}`);
    components.push(`${window.devicePixelRatio || 1}`);

    // Timezone
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

    // Language
    components.push(navigator.language);

    // Platform
    components.push(navigator.platform);

    // User agent hash (simplified)
    const ua = navigator.userAgent;
    let hash = 0;
    for (let i = 0; i < ua.length; i++) {
        const char = ua.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    components.push(hash.toString(36));

    // Canvas fingerprint (simplified)
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('fingerprint', 2, 2);
            components.push(canvas.toDataURL().slice(-50));
        }
    } catch {
        // Canvas not available
    }

    return components.join('|');
}

/**
 * Get or create a unique visitor ID
 */
function getOrCreateVisitorId(): string {
    try {
        // Try to get existing visitor ID
        const existingId = localStorage.getItem(VISITOR_ID_KEY);
        if (existingId) {
            return existingId;
        }

        // Create new visitor ID combining fingerprint and random string
        const fingerprint = generateFingerprint();
        const randomPart = Math.random().toString(36).substr(2, 9);
        const visitorId = `visitor-${fingerprint.hashCode()}-${randomPart}`;

        // Store for future use
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
        return visitorId;
    } catch {
        // localStorage not available, generate session-only ID
        return `session-${generateId()}`;
    }
}

// Add hashCode to String prototype for fingerprint hashing
declare global {
    interface String {
        hashCode(): string;
    }
}

String.prototype.hashCode = function (): string {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
        const char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
};

/**
 * Get the current session ID
 */
function getSessionId(): string {
    // Use sessionStorage for session tracking
    try {
        const sessionKey = 'souq_iraq_session_id';
        let sessionId = sessionStorage.getItem(sessionKey);
        if (!sessionId) {
            sessionId = `session-${generateId()}`;
            sessionStorage.setItem(sessionKey, sessionId);
        }
        return sessionId;
    } catch {
        return `temp-session-${generateId()}`;
    }
}

// ==================== Storage Functions ====================

/**
 * Get the views storage from localStorage
 */
function getViewsStorage(): ViewsStorage {
    try {
        const stored = localStorage.getItem(VIEWS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {
        // Storage error or invalid JSON
    }

    // Return default storage
    return {
        visitorId: getOrCreateVisitorId(),
        viewRecords: [],
        viewCounts: {},
        aggregations: [],
    };
}

/**
 * Save the views storage to localStorage
 */
function saveViewsStorage(storage: ViewsStorage): void {
    try {
        localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(storage));
    } catch {
        // Storage full or unavailable
        console.warn('Views storage could not be saved');
    }
}

// ==================== Main Service Functions ====================

/**
 * Track a product view
 * Returns true if the view was recorded, false if it was a duplicate within cooldown
 */
export function trackProductView(productId: string): { recorded: boolean; viewCount: number } {
    const storage = getViewsStorage();
    const visitorId = storage.visitorId || getOrCreateVisitorId();
    const sessionId = getSessionId();
    const now = new Date().toISOString();

    // Check if user already viewed this product within cooldown period
    const existingView = storage.viewRecords.find(
        (record) =>
            record.productId === productId &&
            record.viewerId === visitorId &&
            isWithinCooldown(record.viewedAt)
    );

    if (existingView) {
        // View already recorded within cooldown, don't count again
        return {
            recorded: false,
            viewCount: storage.viewCounts[productId]?.totalViews || 0
        };
    }

    // Create new view record
    const newViewRecord: ViewRecord = {
        id: generateId(),
        productId,
        viewerId: visitorId,
        viewedAt: now,
        sessionId,
    };

    // Add to view records (keep last 1000 records to prevent storage bloat)
    storage.viewRecords.push(newViewRecord);
    if (storage.viewRecords.length > 1000) {
        storage.viewRecords = storage.viewRecords.slice(-1000);
    }

    // Update view count
    const currentCounter = storage.viewCounts[productId] || {
        productId,
        totalViews: 0,
        todayViews: 0,
        lastUpdated: now,
    };

    const today = getTodayDate();
    const isToday = currentCounter.lastUpdated.split('T')[0] === today;

    storage.viewCounts[productId] = {
        productId,
        totalViews: currentCounter.totalViews + 1,
        todayViews: isToday ? currentCounter.todayViews + 1 : 1,
        lastUpdated: now,
    };

    // Update aggregation
    updateAggregation(storage, productId, today);

    // Save storage
    saveViewsStorage(storage);

    return {
        recorded: true,
        viewCount: storage.viewCounts[productId].totalViews
    };
}

/**
 * Update daily aggregation for analytics
 */
function updateAggregation(storage: ViewsStorage, productId: string, date: string): void {
    const existingAgg = storage.aggregations.find(
        (agg) => agg.productId === productId && agg.date === date
    );

    if (existingAgg) {
        existingAgg.viewCount += 1;
    } else {
        storage.aggregations.push({
            productId,
            date,
            viewCount: 1,
            uniqueViewCount: 1, // Simplified - would need more complex tracking for true unique count
        });
    }

    // Keep only last 365 days of aggregations
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const cutoffDate = oneYearAgo.toISOString().split('T')[0];

    storage.aggregations = storage.aggregations.filter(
        (agg) => agg.date >= cutoffDate
    );
}

/**
 * Get the view count for a product
 */
export function getProductViewCount(productId: string): number {
    const storage = getViewsStorage();
    return storage.viewCounts[productId]?.totalViews || 0;
}

/**
 * Get detailed view counter for a product
 */
export function getProductViewCounter(productId: string): ViewCounter | null {
    const storage = getViewsStorage();
    return storage.viewCounts[productId] || null;
}

/**
 * Get view counts for multiple products
 */
export function getBatchViewCounts(productIds: string[]): Record<string, number> {
    const storage = getViewsStorage();
    const counts: Record<string, number> = {};

    for (const productId of productIds) {
        counts[productId] = storage.viewCounts[productId]?.totalViews || 0;
    }

    return counts;
}

/**
 * Get view history for a product (for analytics)
 */
export function getProductViewHistory(productId: string, days: number = 30): ViewAggregation[] {
    const storage = getViewsStorage();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoff = cutoffDate.toISOString().split('T')[0];

    return storage.aggregations
        .filter((agg) => agg.productId === productId && agg.date >= cutoff)
        .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get all view counts (for syncing with server)
 */
export function getAllViewCounts(): Record<string, ViewCounter> {
    const storage = getViewsStorage();
    return storage.viewCounts;
}

/**
 * Get the current visitor ID
 */
export function getCurrentVisitorId(): string {
    const storage = getViewsStorage();
    return storage.visitorId;
}

/**
 * Check if a product was viewed by current user within cooldown
 */
export function wasProductViewedByUser(productId: string): boolean {
    const storage = getViewsStorage();
    const visitorId = storage.visitorId;

    return storage.viewRecords.some(
        (record) =>
            record.productId === productId &&
            record.viewerId === visitorId &&
            isWithinCooldown(record.viewedAt)
    );
}

/**
 * Clear all view data (for testing/reset)
 */
export function clearAllViewData(): void {
    try {
        localStorage.removeItem(VIEWS_STORAGE_KEY);
        localStorage.removeItem(VISITOR_ID_KEY);
        sessionStorage.removeItem('souq_iraq_session_id');
    } catch {
        // Storage not available
    }
}

/**
 * Format view count for display (e.g., 1.2K, 1.5M)
 */
export function formatViewCount(count: number, language: 'en' | 'ar' = 'en'): string {
    if (count < 1000) {
        return count.toString();
    }

    if (count < 1000000) {
        const formatted = (count / 1000).toFixed(1);
        const suffix = language === 'ar' ? 'ألف' : 'K';
        return `${formatted}${suffix}`;
    }

    if (count < 1000000000) {
        const formatted = (count / 1000000).toFixed(1);
        const suffix = language === 'ar' ? 'م' : 'M';
        return `${formatted}${suffix}`;
    }

    const formatted = (count / 1000000000).toFixed(1);
    const suffix = language === 'ar' ? 'مليار' : 'B';
    return `${formatted}${suffix}`;
}

// ==================== View Batching for Performance ====================

interface PendingView {
    productId: string;
    timestamp: number;
}

let pendingViews: PendingView[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Queue a view for batch processing
 */
export function queueView(productId: string): void {
    pendingViews.push({
        productId,
        timestamp: Date.now(),
    });

    if (!batchTimeout) {
        batchTimeout = setTimeout(processBatchedViews, BATCH_DELAY_MS);
    }
}

/**
 * Process all queued views
 */
function processBatchedViews(): void {
    batchTimeout = null;

    if (pendingViews.length === 0) return;

    // Process each unique product view
    const uniqueProducts = new Set(pendingViews.map((v) => v.productId));
    pendingViews = [];

    for (const productId of uniqueProducts) {
        trackProductView(productId);
    }
}

/**
 * Force process any pending views immediately
 */
export function flushPendingViews(): void {
    if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
    }
    processBatchedViews();
}

// Export a default object with all functions
export default {
    trackProductView,
    getProductViewCount,
    getProductViewCounter,
    getBatchViewCounts,
    getProductViewHistory,
    getAllViewCounts,
    getCurrentVisitorId,
    wasProductViewedByUser,
    clearAllViewData,
    formatViewCount,
    queueView,
    flushPendingViews,
};
