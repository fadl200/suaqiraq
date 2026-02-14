/**
 * Security Context for Iraqi Marketplace PWA
 * Provides authentication state management, session timeout handling, and security event logging
 */

import React, { createContext, useContext, useEffect, useCallback, useRef, useState } from 'react';
import type { User, UserSession, SecurityAudit } from '../utils/security';
import {
    getSession,
    clearSession,
    updateSessionActivity,
    getSessionTimeRemaining,
    logSecurityEvent,
    isRateLimited,
    getRemainingAttempts,
    getRateLimitResetTime,
    initCsrfProtection,
} from '../utils/security';

// ==================== Types ====================

export interface AuthState {
    user: User | null;
    session: UserSession | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface SecurityContextValue extends AuthState {
    // Session management
    refreshSession: () => void;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;

    // Session timeout
    sessionTimeRemaining: number;
    extendSession: () => void;

    // Rate limiting
    isActionRateLimited: (action: string) => boolean;
    getActionRemainingAttempts: (action: string) => number;
    getActionResetTime: (action: string) => number;

    // Security events
    logEvent: (
        eventType: SecurityAudit['eventType'],
        details: string,
        severity?: SecurityAudit['severity']
    ) => void;

    // CSRF
    csrfToken: string | null;

    // Error handling
    clearError: () => void;
}

// ==================== Constants ====================

const SESSION_TIMEOUT_WARNING = 5 * 60 * 1000; // 5 minutes before expiry
const ACTIVITY_THROTTLE = 60 * 1000; // Throttle activity updates to 1 minute
const SESSION_CHECK_INTERVAL = 30 * 1000; // Check session every 30 seconds

// ==================== Context ====================

const SecurityContext = createContext<SecurityContextValue | undefined>(undefined);

// ==================== Provider ====================

interface SecurityProviderProps {
    children: React.ReactNode;
    onSessionExpired?: () => void;
    onUnauthorizedAccess?: () => void;
}

export function SecurityProvider({
    children,
    onSessionExpired,
}: SecurityProviderProps) {
    // State
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    });

    const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);
    const [csrfToken, setCsrfToken] = useState<string | null>(null);

    // Refs
    const lastActivityRef = useRef<number>(Date.now());
    const sessionCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const warningShownRef = useRef(false);

    // ==================== Session Management ====================

    const refreshSession = useCallback(() => {
        const session = getSession();
        if (session) {
            updateSessionActivity();
            setAuthState(prev => ({
                ...prev,
                session,
                isAuthenticated: true,
            }));
            setSessionTimeRemaining(getSessionTimeRemaining());
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            const userId = authState.user?.id;

            // Log logout event
            if (userId) {
                logSecurityEvent('logout', 'User logged out', 'low', userId);
            }

            // Clear session
            clearSession();

            // Update state
            setAuthState({
                user: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });

            setSessionTimeRemaining(0);
            setCsrfToken(null);
            warningShownRef.current = false;

        } catch (error) {
            console.error('Logout error:', error);
        }
    }, [authState.user?.id]);

    const checkAuth = useCallback(async () => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true }));

            const session = getSession();

            if (session && session.isActive) {
                // Initialize CSRF protection
                const token = initCsrfProtection();
                setCsrfToken(token);

                setAuthState({
                    user: null, // User data would be fetched from API
                    session,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                });

                setSessionTimeRemaining(getSessionTimeRemaining());

                logSecurityEvent('login', 'Session restored', 'low', session.userId);
            } else {
                setAuthState({
                    user: null,
                    session: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                });
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setAuthState({
                user: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
                error: 'Failed to check authentication',
            });
        }
    }, []);

    const extendSession = useCallback(() => {
        if (authState.isAuthenticated) {
            updateSessionActivity();
            setSessionTimeRemaining(getSessionTimeRemaining());
            warningShownRef.current = false;
        }
    }, [authState.isAuthenticated]);

    // ==================== Rate Limiting ====================

    const isActionRateLimited = useCallback((action: string): boolean => {
        return isRateLimited(action);
    }, []);

    const getActionRemainingAttempts = useCallback((action: string): number => {
        return getRemainingAttempts(action);
    }, []);

    const getActionResetTime = useCallback((action: string): number => {
        return getRateLimitResetTime(action);
    }, []);

    // ==================== Security Events ====================

    const logEvent = useCallback(
        (eventType: SecurityAudit['eventType'], details: string, severity: SecurityAudit['severity'] = 'low') => {
            logSecurityEvent(eventType, details, severity, authState.user?.id);
        },
        [authState.user?.id]
    );

    // ==================== Error Handling ====================

    const clearError = useCallback(() => {
        setAuthState(prev => ({ ...prev, error: null }));
    }, []);

    // ==================== Activity Tracking ====================

    const handleUserActivity = useCallback(() => {
        const now = Date.now();

        // Throttle activity updates
        if (now - lastActivityRef.current > ACTIVITY_THROTTLE) {
            lastActivityRef.current = now;

            if (authState.isAuthenticated) {
                updateSessionActivity();
            }
        }
    }, [authState.isAuthenticated]);

    // ==================== Session Monitoring ====================

    useEffect(() => {
        // Initial auth check
        checkAuth();

        // Set up session monitoring
        sessionCheckRef.current = setInterval(() => {
            if (authState.isAuthenticated) {
                const remaining = getSessionTimeRemaining();
                setSessionTimeRemaining(remaining);

                // Show warning before session expires
                if (remaining < SESSION_TIMEOUT_WARNING && remaining > 0 && !warningShownRef.current) {
                    warningShownRef.current = true;
                    logEvent('suspicious_activity', 'Session about to expire', 'medium');
                }

                // Session expired
                if (remaining <= 0) {
                    logEvent('logout', 'Session expired', 'medium');
                    logout();
                    onSessionExpired?.();
                }
            }
        }, SESSION_CHECK_INTERVAL);

        return () => {
            if (sessionCheckRef.current) {
                clearInterval(sessionCheckRef.current);
            }
        };
    }, [authState.isAuthenticated, checkAuth, logout, logEvent, onSessionExpired]);

    // ==================== Activity Listeners ====================

    useEffect(() => {
        if (!authState.isAuthenticated) return;

        const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];

        events.forEach(event => {
            document.addEventListener(event, handleUserActivity, { passive: true });
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleUserActivity);
            });
        };
    }, [authState.isAuthenticated, handleUserActivity]);

    // ==================== Context Value ====================

    const value: SecurityContextValue = {
        ...authState,
        refreshSession,
        logout,
        checkAuth,
        sessionTimeRemaining,
        extendSession,
        isActionRateLimited,
        getActionRemainingAttempts,
        getActionResetTime,
        logEvent,
        csrfToken,
        clearError,
    };

    return (
        <SecurityContext.Provider value={value}>
            {children}
        </SecurityContext.Provider>
    );
}

// ==================== Hook ====================

export function useSecurity(): SecurityContextValue {
    const context = useContext(SecurityContext);

    if (context === undefined) {
        throw new Error('useSecurity must be used within a SecurityProvider');
    }

    return context;
}

// ==================== Utility Hooks ====================

/**
 * Hook to check if user has specific role
 */
export function useHasRole(role: User['role'] | User['role'][]): boolean {
    const { user } = useSecurity();

    if (!user) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
    const { isAuthenticated } = useSecurity();
    return isAuthenticated;
}

/**
 * Hook to get current user
 */
export function useCurrentUser(): User | null {
    const { user } = useSecurity();
    return user;
}

/**
 * Hook for session timeout warning
 */
export function useSessionWarning(warningThreshold: number = SESSION_TIMEOUT_WARNING): {
    showWarning: boolean;
    timeRemaining: number;
    extendSession: () => void;
} {
    const { sessionTimeRemaining, extendSession } = useSecurity();

    return {
        showWarning: sessionTimeRemaining > 0 && sessionTimeRemaining < warningThreshold,
        timeRemaining: sessionTimeRemaining,
        extendSession,
    };
}

// ==================== HOC ====================

/**
 * Higher-order component for components that need security context
 */
export function withSecurity<P extends object>(
    Component: React.ComponentType<P>
): React.FC<P> {
    return function WithSecurityComponent(props: P) {
        return (
            <SecurityProvider>
                <Component {...props} />
            </SecurityProvider>
        );
    };
}
