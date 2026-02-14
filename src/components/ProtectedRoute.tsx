/**
 * Protected Route Component for Iraqi Marketplace PWA
 * Provides route protection based on authentication and role-based access control
 */

import React from 'react';
import { useSecurity, useHasRole } from '../contexts/SecurityContext';
import type { User } from '../utils/security';

// ==================== Types ====================

interface ProtectedRouteProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    requiredRole?: User['role'] | User['role'][];
    requireAuth?: boolean;
    onUnauthorized?: () => void;
}

interface RoleGuardProps {
    children: React.ReactNode;
    roles: User['role'] | User['role'][];
    fallback?: React.ReactNode;
}

interface AuthGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onUnauthorized?: () => void;
}

// ==================== Auth Guard Component ====================

function AuthGuard({ children, fallback, onUnauthorized }: AuthGuardProps): React.ReactElement {
    const { isAuthenticated, isLoading } = useSecurity();

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!isAuthenticated) {
        if (onUnauthorized) {
            onUnauthorized();
        }

        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-amber-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-10V4a2 2 0 00-2-2H8a2 2 0 00-2 2v1m8 0V4a2 2 0 012-2h2a2 2 0 012 2v1M5 9h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9a2 2 0 012-2z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Authentication Required</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Please log in to access this page.
                    </p>
                    <button
                        onClick={() => {
                            // Navigate to login - this would integrate with your routing
                            window.location.href = '/login';
                        }}
                        className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

// ==================== Role Guard Component ====================

function RoleGuard({ children, roles, fallback }: RoleGuardProps): React.ReactElement {
    const hasRole = useHasRole(roles);
    const { user } = useSecurity();

    if (!hasRole) {
        if (fallback) {
            return <>{fallback}</>;
        }

        const roleNames: Record<User['role'], string> = {
            admin: 'Administrator',
            seller: 'Seller',
            user: 'User',
        };

        const requiredRoles = Array.isArray(roles) ? roles : [roles];
        const requiredRoleNames = requiredRoles.map(r => roleNames[r]).join(', ');

        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-sm text-gray-500 mb-2">
                        You don't have permission to access this page.
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                        Required role: {requiredRoleNames}
                    </p>
                    <p className="text-xs text-gray-400">
                        Your role: {user ? roleNames[user.role] : 'Not logged in'}
                    </p>
                    <button
                        onClick={() => {
                            // Navigate back or to home
                            window.history.back();
                        }}
                        className="mt-4 w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

// ==================== Protected Route Component ====================

export function ProtectedRoute({
    children,
    fallback,
    requiredRole,
    requireAuth = true,
    onUnauthorized,
}: ProtectedRouteProps): React.ReactElement {
    // If no auth required, just render children
    if (!requireAuth) {
        return <>{children}</>;
    }

    // Wrap with AuthGuard first
    return (
        <AuthGuard fallback={fallback} onUnauthorized={onUnauthorized}>
            {requiredRole ? (
                <RoleGuard roles={requiredRole} fallback={fallback}>
                    {children}
                </RoleGuard>
            ) : (
                children
            )}
        </AuthGuard>
    );
}

// ==================== Convenience Components ====================

/**
 * Admin-only route wrapper
 */
export function AdminRoute({
    children,
    fallback,
}: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}): React.ReactElement {
    return (
        <ProtectedRoute requiredRole="admin" fallback={fallback}>
            {children}
        </ProtectedRoute>
    );
}

/**
 * Seller-only route wrapper
 */
export function SellerRoute({
    children,
    fallback,
}: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}): React.ReactElement {
    return (
        <ProtectedRoute requiredRole="seller" fallback={fallback}>
            {children}
        </ProtectedRoute>
    );
}

/**
 * Authenticated user route wrapper (any role)
 */
export function AuthRoute({
    children,
    fallback,
    onUnauthorized,
}: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onUnauthorized?: () => void;
}): React.ReactElement {
    return (
        <ProtectedRoute requireAuth fallback={fallback} onUnauthorized={onUnauthorized}>
            {children}
        </ProtectedRoute>
    );
}

// ==================== Permission Check Hook ====================

/**
 * Hook to check if user can access a protected resource
 */
export function useCanAccess(options: {
    requireAuth?: boolean;
    requiredRole?: User['role'] | User['role'][];
}): {
    canAccess: boolean;
    reason: 'loading' | 'unauthenticated' | 'unauthorized' | 'authorized' | null;
} {
    const { isAuthenticated, isLoading, user } = useSecurity();
    const { requireAuth = true, requiredRole } = options;

    // Still loading
    if (isLoading) {
        return { canAccess: false, reason: 'loading' };
    }

    // Auth required but not authenticated
    if (requireAuth && !isAuthenticated) {
        return { canAccess: false, reason: 'unauthenticated' };
    }

    // Role required but user doesn't have it
    if (requiredRole && user) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(user.role)) {
            return { canAccess: false, reason: 'unauthorized' };
        }
    }

    return { canAccess: true, reason: 'authorized' };
}

// ==================== Conditional Rendering Component ====================

/**
 * Component for conditional rendering based on permissions
 */
export function ShowForPermission({
    children,
    requiredRole,
    requireAuth = true,
    fallback = null,
}: {
    children: React.ReactNode;
    requiredRole?: User['role'] | User['role'][];
    requireAuth?: boolean;
    fallback?: React.ReactNode;
}): React.ReactElement | null {
    const { canAccess } = useCanAccess({ requireAuth, requiredRole });

    return canAccess ? <>{children}</> : <>{fallback}</>;
}

// ==================== Export ====================

export default ProtectedRoute;
