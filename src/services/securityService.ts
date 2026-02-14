/**
 * Security Service for Iraqi Marketplace PWA
 * Provides login/logout functionality, password hashing, session validation, and audit logging
 */

import type { User, UserSession, SecurityAudit } from '../utils/security';
import {
    generateSessionToken,
    generateRefreshToken,
    generateId,
    storeSession,
    getSession,
    clearSession,
    validatePassword,
    sanitizeEmail,
    sanitizeInput,
    logSecurityEvent,
    isRateLimited,
    clearRateLimit,
    getDeviceFingerprint,
    initCsrfProtection,
} from '../utils/security';

// ==================== Types ====================

export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    nameAr?: string;
    phone?: string;
}

export interface LoginResult {
    success: boolean;
    user?: User;
    session?: UserSession;
    error?: string;
    requiresTwoFactor?: boolean;
}

export interface RegisterResult {
    success: boolean;
    user?: User;
    error?: string;
}

export interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
}

// ==================== Constants ====================

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const API_BASE_URL = '/api'; // Would be configured based on environment

// ==================== Mock User Database (for demo) ====================

const mockUsers: Map<string, User & { passwordHash: string }> = new Map();

// ==================== Password Hashing ====================

/**
 * Hash password using SubtleCrypto API (client-side)
 * Note: In production, password hashing should be done server-side
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
    // Generate salt if not provided
    const saltValue = salt || generateId();

    // Encode password
    const encoder = new TextEncoder();
    const data = encoder.encode(password + saltValue);

    // Hash using SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Return hash with salt
    return `${saltValue}:${hashHex}`;
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
    password: string,
    storedHash: string
): Promise<boolean> {
    const [salt, hash] = storedHash.split(':');

    if (!salt || !hash) return false;

    const newHash = await hashPassword(password, salt);
    const [, newHashValue] = newHash.split(':');

    // Constant-time comparison
    if (hash.length !== newHashValue.length) return false;

    let result = 0;
    for (let i = 0; i < hash.length; i++) {
        result |= hash.charCodeAt(i) ^ newHashValue.charCodeAt(i);
    }

    return result === 0;
}

// ==================== Authentication Functions ====================

/**
 * Login user with credentials
 */
export async function login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
        // Check rate limiting
        if (isRateLimited('login')) {
            logSecurityEvent('failed_login', 'Rate limited login attempt', 'medium');
            return {
                success: false,
                error: 'Too many login attempts. Please try again later.',
            };
        }

        // Sanitize input
        const email = sanitizeEmail(credentials.email);
        const password = credentials.password;

        if (!email) {
            logSecurityEvent('failed_login', 'Invalid email format', 'low');
            return {
                success: false,
                error: 'Invalid email format',
            };
        }

        // Validate password is provided
        if (!password || password.length < 1) {
            logSecurityEvent('failed_login', 'Missing password', 'low');
            return {
                success: false,
                error: 'Password is required',
            };
        }

        // In a real app, this would be an API call
        // For demo, we'll simulate the authentication

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Find user (mock implementation)
        const userEntry = Array.from(mockUsers.entries()).find(
            ([, user]) => user.email === email
        );

        if (!userEntry) {
            logSecurityEvent('failed_login', `User not found: ${email}`, 'medium');
            return {
                success: false,
                error: 'Invalid email or password',
            };
        }

        const [userId, user] = userEntry;

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
            logSecurityEvent('failed_login', `Invalid password for user: ${email}`, 'medium', userId);
            return {
                success: false,
                error: 'Invalid email or password',
            };
        }

        // Check user status
        if (user.status === 'suspended') {
            logSecurityEvent('suspicious_activity', `Suspended user attempted login: ${email}`, 'high', userId);
            return {
                success: false,
                error: 'Your account has been suspended. Please contact support.',
            };
        }

        // Create session
        const session = await createSession(userId, credentials.rememberMe);

        // Clear login rate limit on success
        clearRateLimit('login');

        // Log successful login
        logSecurityEvent('login', `User logged in: ${email}`, 'low', userId);

        // Initialize CSRF protection
        initCsrfProtection();

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                name: user.name,
                nameAr: user.nameAr,
                role: user.role,
                avatar: user.avatar,
                createdAt: user.createdAt,
                lastLogin: new Date().toISOString(),
                isVerified: user.isVerified,
                status: user.status,
            },
            session,
        };
    } catch (error) {
        console.error('Login error:', error);
        logSecurityEvent('suspicious_activity', 'Login error occurred', 'high');
        return {
            success: false,
            error: 'An error occurred during login. Please try again.',
        };
    }
}

/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<RegisterResult> {
    try {
        // Sanitize input
        const email = sanitizeEmail(data.email);
        const name = sanitizeInput(data.name);
        const nameAr = data.nameAr ? sanitizeInput(data.nameAr) : '';
        const phone = data.phone || '';

        if (!email) {
            return {
                success: false,
                error: 'Invalid email format',
            };
        }

        if (!name || name.length < 2) {
            return {
                success: false,
                error: 'Name must be at least 2 characters',
            };
        }

        // Validate password
        const passwordValidation = validatePassword(data.password);
        if (!passwordValidation.valid) {
            return {
                success: false,
                error: passwordValidation.errors[0],
            };
        }

        // Check if user already exists
        const existingUser = Array.from(mockUsers.values()).find(u => u.email === email);
        if (existingUser) {
            return {
                success: false,
                error: 'An account with this email already exists',
            };
        }

        // Hash password
        const passwordHash = await hashPassword(data.password);

        // Create user
        const userId = generateId();
        const now = new Date().toISOString();

        const newUser: User & { passwordHash: string } = {
            id: userId,
            email,
            phone,
            name,
            nameAr,
            role: 'user',
            createdAt: now,
            lastLogin: now,
            isVerified: false,
            status: 'active',
            passwordHash,
        };

        // Store user (mock)
        mockUsers.set(userId, newUser);

        // Log registration
        logSecurityEvent('login', `New user registered: ${email}`, 'low', userId);

        return {
            success: true,
            user: {
                id: newUser.id,
                email: newUser.email,
                phone: newUser.phone,
                name: newUser.name,
                nameAr: newUser.nameAr,
                role: newUser.role,
                avatar: newUser.avatar,
                createdAt: newUser.createdAt,
                lastLogin: newUser.lastLogin,
                isVerified: newUser.isVerified,
                status: newUser.status,
            },
        };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            error: 'An error occurred during registration. Please try again.',
        };
    }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
    const session = getSession();

    if (session) {
        logSecurityEvent('logout', 'User logged out', 'low', session.userId);
    }

    clearSession();
}

/**
 * Create new session
 */
async function createSession(userId: string, rememberMe: boolean = false): Promise<UserSession> {
    const now = Date.now();
    const sessionTimeout = rememberMe ? REFRESH_TOKEN_EXPIRY : SESSION_TIMEOUT;

    const session: UserSession = {
        id: generateId(),
        userId,
        token: generateSessionToken(),
        refreshToken: generateRefreshToken(),
        deviceInfo: getDeviceFingerprint(),
        ipAddress: 'client', // Real IP would be captured server-side
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + sessionTimeout).toISOString(),
        isActive: true,
    };

    storeSession(session);

    return session;
}

/**
 * Validate current session
 */
export function validateSession(): {
    valid: boolean;
    session: UserSession | null;
    expiresAt: string | null;
} {
    const session = getSession();

    if (!session) {
        return {
            valid: false,
            session: null,
            expiresAt: null,
        };
    }

    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (now >= expiresAt) {
        clearSession();
        return {
            valid: false,
            session: null,
            expiresAt: null,
        };
    }

    return {
        valid: true,
        session,
        expiresAt: session.expiresAt,
    };
}

/**
 * Refresh session token
 */
export async function refreshSession(): Promise<{
    success: boolean;
    session?: UserSession;
    error?: string;
}> {
    const currentSession = getSession();

    if (!currentSession) {
        return {
            success: false,
            error: 'No active session',
        };
    }

    // Create new session
    const newSession = await createSession(currentSession.userId, true);

    return {
        success: true,
        session: newSession,
    };
}

// ==================== Password Management ====================

/**
 * Change user password
 */
export async function changePassword(
    userId: string,
    data: PasswordChangeData
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = mockUsers.get(userId);

        if (!user) {
            return {
                success: false,
                error: 'User not found',
            };
        }

        // Verify current password
        const isValid = await verifyPassword(data.currentPassword, user.passwordHash);

        if (!isValid) {
            logSecurityEvent('suspicious_activity', 'Invalid current password on change attempt', 'medium', userId);
            return {
                success: false,
                error: 'Current password is incorrect',
            };
        }

        // Validate new password
        const passwordValidation = validatePassword(data.newPassword);
        if (!passwordValidation.valid) {
            return {
                success: false,
                error: passwordValidation.errors[0],
            };
        }

        // Hash new password
        const newPasswordHash = await hashPassword(data.newPassword);

        // Update user
        user.passwordHash = newPasswordHash;
        mockUsers.set(userId, user);

        logSecurityEvent('password_change', 'Password changed successfully', 'low', userId);

        return {
            success: true,
        };
    } catch (error) {
        console.error('Password change error:', error);
        return {
            success: false,
            error: 'An error occurred while changing password',
        };
    }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const sanitizedEmail = sanitizeEmail(email);

        if (!sanitizedEmail) {
            return {
                success: false,
                error: 'Invalid email format',
            };
        }

        // In a real app, this would send an email
        // For demo, we'll just log it
        const user = Array.from(mockUsers.values()).find(u => u.email === sanitizedEmail);

        if (user) {
            logSecurityEvent('suspicious_activity', 'Password reset requested', 'low', user.id);
        }

        // Always return success to prevent email enumeration
        return {
            success: true,
        };
    } catch (error) {
        console.error('Password reset request error:', error);
        return {
            success: false,
            error: 'An error occurred',
        };
    }
}

// ==================== Audit Logging ====================

/**
 * Get audit logs for user
 */
export function getAuditLogsForUser(userId: string): SecurityAudit[] {
    const logs = JSON.parse(localStorage.getItem('iraq_marketplace_audit_log') || '[]');
    return logs.filter((log: SecurityAudit) => log.userId === userId);
}

/**
 * Get all audit logs (admin only)
 */
export function getAllAuditLogs(): SecurityAudit[] {
    return JSON.parse(localStorage.getItem('iraq_marketplace_audit_log') || '[]');
}

// ==================== Session Management ====================

/**
 * Get all active sessions for user (would be server-side in production)
 */
export function getActiveSessions(): UserSession[] {
    const session = getSession();
    return session ? [session] : [];
}

/**
 * Revoke all sessions for user
 */
export function revokeAllSessions(): void {
    const session = getSession();
    if (session) {
        logSecurityEvent('logout', 'All sessions revoked', 'medium', session.userId);
    }
    clearSession();
}

// ==================== API Request Helper ====================

/**
 * Make authenticated API request
 */
export async function authenticatedFetch(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    const session = getSession();

    if (!session) {
        throw new Error('Not authenticated');
    }

    const headers = new Headers(options.headers || {});

    // Add auth header
    headers.set('Authorization', `Bearer ${session.token}`);

    // Add CSRF token
    const csrfToken = localStorage.getItem('iraq_marketplace_csrf');
    if (csrfToken) {
        headers.set('X-CSRF-Token', csrfToken);
    }

    // Add content type for JSON requests
    if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
        clearSession();
        throw new Error('Session expired');
    }

    return response;
}

// ==================== Export ====================

export const securityService = {
    login,
    register,
    logout,
    validateSession,
    refreshSession,
    changePassword,
    requestPasswordReset,
    hashPassword,
    verifyPassword,
    getAuditLogsForUser,
    getAllAuditLogs,
    getActiveSessions,
    revokeAllSessions,
    authenticatedFetch,
};

export default securityService;
