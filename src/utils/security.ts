/**
 * Security Utilities for Iraqi Marketplace PWA
 * Provides input sanitization, token management, session handling, rate limiting, and CSRF protection
 */

// ==================== Types ====================

export interface User {
    id: string;
    email: string;
    phone: string;
    name: string;
    nameAr: string;
    role: 'admin' | 'user' | 'seller';
    avatar?: string;
    createdAt: string;
    lastLogin: string;
    isVerified: boolean;
    status: 'active' | 'suspended' | 'pending';
}

export interface UserSession {
    id: string;
    userId: string;
    token: string;
    refreshToken: string;
    deviceInfo: string;
    ipAddress: string;
    createdAt: string;
    expiresAt: string;
    isActive: boolean;
}

export interface SecurityAudit {
    id: string;
    eventType: 'login' | 'logout' | 'failed_login' | 'suspicious_activity' | 'password_change';
    userId?: string;
    ipAddress: string;
    userAgent: string;
    details: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RateLimitConfig {
    windowMs: number;
    max: number;
}

export interface RateLimitState {
    count: number;
    resetAt: number;
    blocked: boolean;
}

// ==================== Constants ====================

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const CSRF_TOKEN_LENGTH = 32;

const RATE_LIMITS: Record<string, RateLimitConfig> = {
    login: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 min
    api: { windowMs: 60 * 1000, max: 100 }, // 100 requests per minute
    views: { windowMs: 60 * 1000, max: 50 }, // 50 view increments per minute
};

const PASSWORD_POLICY = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90, // days
    historyCount: 5, // prevent reuse
};

// ==================== Input Sanitization ====================

/**
 * Sanitize input string to prevent XSS attacks
 * Escapes HTML entities and removes dangerous characters
 */
export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';

    return input
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .replace(/`/g, '&#96;')
        .replace(/=/g, '&#x3D;');
}

/**
 * Sanitize HTML content while preserving safe tags
 * Uses a whitelist approach for allowed tags
 */
export function sanitizeHtml(html: string): string {
    const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'span'];
    const allowedAttributes: Record<string, string[]> = {
        'span': ['class'],
    };

    // Remove script tags completely
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Filter tags
    sanitized = sanitized.replace(/<\/?(\w+)[^>]*>/g, (match, tagName) => {
        const tag = tagName.toLowerCase();
        if (allowedTags.includes(tag)) {
            // For allowed tags, filter attributes
            if (allowedAttributes[tag]) {
                const attrPattern = new RegExp(`(\\w+)=["']([^"']*)["']`, 'g');
                return match.replace(attrPattern, (attrMatch: string, attrName: string) => {
                    if (allowedAttributes[tag].includes(attrName)) {
                        return attrMatch;
                    }
                    return '';
                });
            }
            return match;
        }
        return '';
    });

    return sanitized;
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';

    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmed)) {
        return '';
    }

    return trimmed;
}

/**
 * Validate and sanitize phone number (Iraqi format)
 */
export function sanitizePhone(phone: string): string {
    if (typeof phone !== 'string') return '';

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Validate Iraqi phone number format
    // Iraqi numbers: +964 7XX XXX XXXX or 07XX XXX XXXX
    const iraqiPhoneRegex = /^(\+964|0)?7\d{9}$/;

    if (digits.length >= 10 && digits.length <= 13) {
        const normalized = digits.startsWith('964') ? digits : '964' + digits.replace(/^0/, '');
        if (iraqiPhoneRegex.test('+' + normalized) || iraqiPhoneRegex.test('0' + digits.slice(-10))) {
            return '+' + normalized;
        }
    }

    return '';
}

/**
 * Remove all HTML tags from string
 */
export function stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '');
}

// ==================== Token Management ====================

/**
 * Generate a cryptographically secure random token
 */
export function generateToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(length);

    // Use crypto API for secure random generation
    if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(array);
    } else {
        // Fallback for non-browser environments
        for (let i = 0; i < length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }

    return Array.from(array)
        .map(x => chars[x % chars.length])
        .join('');
}

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
    return generateToken(CSRF_TOKEN_LENGTH);
}

/**
 * Generate a session token
 */
export function generateSessionToken(): string {
    return generateToken(64);
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(): string {
    return generateToken(128);
}

/**
 * Simple hash function for tokens (client-side)
 * Note: For production, use a proper hashing library or server-side hashing
 */
export function hashToken(token: string): string {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
        const char = token.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Validate token format
 */
export function isValidTokenFormat(token: string, minLength: number = 32): boolean {
    if (!token || typeof token !== 'string') return false;
    if (token.length < minLength) return false;

    // Check for valid characters
    const validChars = /^[A-Za-z0-9]+$/;
    return validChars.test(token);
}

// ==================== Session Management ====================

const SESSION_KEY = 'iraq_marketplace_session';
const CSRF_KEY = 'iraq_marketplace_csrf';

/**
 * Store session data securely
 */
export function storeSession(session: UserSession): void {
    try {
        const sessionData = {
            ...session,
            storedAt: Date.now(),
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

        // Store CSRF token separately for easy access
        sessionStorage.setItem(CSRF_KEY, session.token.slice(0, 32));
    } catch (error) {
        console.error('Failed to store session:', error);
    }
}

/**
 * Retrieve session data
 */
export function getSession(): UserSession | null {
    try {
        const data = sessionStorage.getItem(SESSION_KEY);
        if (!data) return null;

        const session = JSON.parse(data) as UserSession;

        // Check if session is expired
        if (new Date(session.expiresAt) < new Date()) {
            clearSession();
            return null;
        }

        return session;
    } catch (error) {
        console.error('Failed to retrieve session:', error);
        return null;
    }
}

/**
 * Clear session data
 */
export function clearSession(): void {
    try {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(CSRF_KEY);
    } catch (error) {
        console.error('Failed to clear session:', error);
    }
}

/**
 * Get CSRF token from session
 */
export function getCsrfToken(): string | null {
    try {
        return sessionStorage.getItem(CSRF_KEY);
    } catch {
        return null;
    }
}

/**
 * Check if session is valid
 */
export function isSessionValid(): boolean {
    const session = getSession();
    return session !== null && session.isActive;
}

/**
 * Update session activity timestamp
 */
export function updateSessionActivity(): void {
    const session = getSession();
    if (session) {
        session.expiresAt = new Date(Date.now() + SESSION_TIMEOUT).toISOString();
        storeSession(session);
    }
}

/**
 * Get session expiry time in milliseconds
 */
export function getSessionTimeRemaining(): number {
    const session = getSession();
    if (!session) return 0;

    const expiry = new Date(session.expiresAt).getTime();
    const remaining = expiry - Date.now();

    return Math.max(0, remaining);
}

// ==================== Rate Limiting (Client-Side) ====================

const rateLimitStore: Map<string, RateLimitState> = new Map();

/**
 * Check if action is rate limited
 */
export function isRateLimited(action: string): boolean {
    const config = RATE_LIMITS[action];
    if (!config) return false;

    const now = Date.now();
    const state = rateLimitStore.get(action);

    if (!state || now > state.resetAt) {
        // Reset or initialize
        rateLimitStore.set(action, {
            count: 1,
            resetAt: now + config.windowMs,
            blocked: false,
        });
        return false;
    }

    if (state.count >= config.max) {
        state.blocked = true;
        return true;
    }

    state.count++;
    return false;
}

/**
 * Get remaining attempts for rate-limited action
 */
export function getRemainingAttempts(action: string): number {
    const config = RATE_LIMITS[action];
    if (!config) return Infinity;

    const state = rateLimitStore.get(action);
    if (!state) return config.max;

    return Math.max(0, config.max - state.count);
}

/**
 * Get time until rate limit resets (in milliseconds)
 */
export function getRateLimitResetTime(action: string): number {
    const state = rateLimitStore.get(action);
    if (!state) return 0;

    return Math.max(0, state.resetAt - Date.now());
}

/**
 * Clear rate limit for an action
 */
export function clearRateLimit(action: string): void {
    rateLimitStore.delete(action);
}

/**
 * Clear all rate limits
 */
export function clearAllRateLimits(): void {
    rateLimitStore.clear();
}

// ==================== CSRF Protection ====================

/**
 * Initialize CSRF protection
 */
export function initCsrfProtection(): string {
    let token = getCsrfToken();
    if (!token) {
        token = generateCsrfToken();
        sessionStorage.setItem(CSRF_KEY, token);
    }
    return token;
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string): boolean {
    const storedToken = getCsrfToken();
    if (!storedToken || !token) return false;

    // Use constant-time comparison to prevent timing attacks
    return constantTimeCompare(token, storedToken);
}

/**
 * Add CSRF token to request headers
 */
export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
    const token = getCsrfToken();
    if (token) {
        return {
            ...headers,
            'X-CSRF-Token': token,
        };
    }
    return headers;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}

// ==================== Password Validation ====================

/**
 * Validate password against security policy
 */
export function validatePassword(password: string): {
    valid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
} {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    if (password.length < PASSWORD_POLICY.minLength) {
        errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters`);
    }

    if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (PASSWORD_POLICY.requireNumbers && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (PASSWORD_POLICY.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    // Calculate strength
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLong = password.length >= 12;

    const criteriaCount = [hasUpper, hasLower, hasNumber, hasSpecial, isLong].filter(Boolean).length;

    if (criteriaCount >= 4 && password.length >= 10) {
        strength = 'strong';
    } else if (criteriaCount >= 3 && password.length >= 8) {
        strength = 'medium';
    }

    return {
        valid: errors.length === 0,
        errors,
        strength,
    };
}

// ==================== Security Event Logging ====================

const AUDIT_LOG_KEY = 'iraq_marketplace_audit_log';

/**
 * Log security event
 */
export function logSecurityEvent(
    eventType: SecurityAudit['eventType'],
    details: string,
    severity: SecurityAudit['severity'] = 'low',
    userId?: string
): void {
    try {
        const event: SecurityAudit = {
            id: generateToken(16),
            eventType,
            userId,
            ipAddress: 'client', // Real IP would be captured server-side
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            details,
            timestamp: new Date().toISOString(),
            severity,
        };

        // Store in localStorage for persistence
        const logs = getAuditLogs();
        logs.push(event);

        // Keep only last 100 events
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }

        localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[Security Event]', event);
        }
    } catch (error) {
        console.error('Failed to log security event:', error);
    }
}

/**
 * Get audit logs
 */
export function getAuditLogs(): SecurityAudit[] {
    try {
        const data = localStorage.getItem(AUDIT_LOG_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Clear audit logs
 */
export function clearAuditLogs(): void {
    localStorage.removeItem(AUDIT_LOG_KEY);
}

// ==================== Utility Functions ====================

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return `${Date.now().toString(36)}_${generateToken(16)}`;
}

/**
 * Check if running in secure context (HTTPS)
 */
export function isSecureContext(): boolean {
    if (typeof window === 'undefined') return false;
    return window.isSecureContext || location.protocol === 'https:';
}

/**
 * Get device fingerprint (basic)
 */
export function getDeviceFingerprint(): string {
    if (typeof window === 'undefined') return 'unknown';

    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
    ];

    return hashToken(components.join('|'));
}

/**
 * Mask sensitive data for display
 */
export function maskSensitiveData(value: string, type: 'phone' | 'email' | 'card'): string {
    switch (type) {
        case 'phone':
            return value.replace(/(\d{4})\d+(\d{3})/, '$1****$2');
        case 'email':
            return value.replace(/(.{2})@/, '***@');
        case 'card':
            return value.replace(/\d(?=\d{4})/g, '*');
        default:
            return value;
    }
}

/**
 * Secure compare for tokens (wrapper for constantTimeCompare)
 */
export function secureCompare(a: string, b: string): boolean {
    return constantTimeCompare(a, b);
}
