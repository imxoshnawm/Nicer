import { NextRequest } from 'next/server';
import dbConnect from './mongodb';
import AuditLog from './models/AuditLog';
import { getClientIP } from './security';

// ============================================================
// Audit Logging Utility
// ============================================================
// Logs admin/sensitive actions to MongoDB for security review
// Never throws - audit failures must not break the main request

interface AuditEntry {
    action: string;
    actor: { id: string; name: string; email: string };
    target?: { type: string; id?: string; name?: string };
    details?: Record<string, any>;
    severity?: 'info' | 'warning' | 'critical';
    req?: NextRequest;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
    try {
        await dbConnect();
        await AuditLog.create({
            action: entry.action,
            actor: entry.actor,
            target: entry.target,
            details: entry.details || {},
            severity: entry.severity || 'info',
            ip: entry.req ? getClientIP(entry.req) : undefined,
            userAgent: entry.req?.headers.get('user-agent')?.substring(0, 500) || undefined,
        });
    } catch (error) {
        // Never throw - audit failures should not break the main request
        console.error('[Audit Log Error]:', error);
    }
}

// Helper: extract actor info from NextAuth session
export function getActor(session: any): { id: string; name: string; email: string } {
    return {
        id: (session.user as any)?.id || 'unknown',
        name: session.user?.name || 'Unknown',
        email: session.user?.email || 'unknown',
    };
}

// ============================================================
// Pre-defined audit actions
// ============================================================
export const AUDIT_ACTIONS = {
    // Auth
    LOGIN_SUCCESS: 'auth.login_success',
    LOGIN_FAILED: 'auth.login_failed',
    LOGIN_BLOCKED: 'auth.login_blocked',
    REGISTER: 'auth.register',

    // Users
    USER_UPDATE: 'user.update',
    USER_DELETE: 'user.delete',
    USER_BLOCK: 'user.block',
    USER_UNBLOCK: 'user.unblock',
    USER_ROLE_CHANGE: 'user.role_change',

    // Posts
    POST_CREATE: 'post.create',
    POST_UPDATE: 'post.update',
    POST_DELETE: 'post.delete',
    POST_APPROVE: 'post.approve',
    POST_REJECT: 'post.reject',
    POST_SUBMIT_APPROVAL: 'post.submit_approval',

    // Activities
    ACTIVITY_CREATE: 'activity.create',
    ACTIVITY_UPDATE: 'activity.update',
    ACTIVITY_DELETE: 'activity.delete',

    // Projects
    PROJECT_CREATE: 'project.create',
    PROJECT_UPDATE: 'project.update',
    PROJECT_DELETE: 'project.delete',

    // Settings
    SETTINGS_UPDATE: 'settings.update',

    // Security
    CSRF_VIOLATION: 'security.csrf_violation',
    RATE_LIMIT_HIT: 'security.rate_limit',
} as const;
