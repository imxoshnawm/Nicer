import dbConnect from '@/lib/mongodb';
import Role from '@/lib/models/Role';
import type { Permission } from '@/lib/models/Role';

// Cache for role permissions (refreshed every 60s)
let rolePermCache: Record<string, string[]> = {};
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

/**
 * Load all role permissions from DB (with caching)
 */
export async function loadRolePermissions(): Promise<Record<string, string[]>> {
    const now = Date.now();
    if (now - cacheTime < CACHE_TTL && Object.keys(rolePermCache).length > 0) {
        return rolePermCache;
    }

    await dbConnect();
    const roles = await Role.find({}).lean();
    const map: Record<string, string[]> = {};

    // Admin always has all permissions
    map['admin'] = ['*'];

    for (const role of roles) {
        map[role.slug] = role.permissions || [];
    }

    rolePermCache = map;
    cacheTime = now;
    return map;
}

/**
 * Invalidate the permissions cache (call after role updates)
 */
export function invalidatePermCache(): void {
    cacheTime = 0;
    rolePermCache = {};
}

/**
 * Check if a user's roles grant a specific permission
 */
export async function hasPermission(userRoles: string[], permission: Permission): Promise<boolean> {
    // Admin always has all permissions
    if (userRoles.includes('admin')) return true;

    const permMap = await loadRolePermissions();

    for (const role of userRoles) {
        const perms = permMap[role];
        if (!perms) continue;
        if (perms.includes('*') || perms.includes(permission)) return true;
    }

    return false;
}

/**
 * Check if a user's roles grant ANY of the specified permissions
 */
export async function hasAnyPermission(userRoles: string[], permissions: Permission[]): Promise<boolean> {
    if (userRoles.includes('admin')) return true;

    const permMap = await loadRolePermissions();

    for (const role of userRoles) {
        const perms = permMap[role];
        if (!perms) continue;
        if (perms.includes('*')) return true;
        if (permissions.some(p => perms.includes(p))) return true;
    }

    return false;
}

/**
 * Get all permissions for a set of user roles
 */
export async function getAllPermissions(userRoles: string[]): Promise<string[]> {
    if (userRoles.includes('admin')) return ['*'];

    const permMap = await loadRolePermissions();
    const allPerms = new Set<string>();

    for (const role of userRoles) {
        const perms = permMap[role];
        if (!perms) continue;
        if (perms.includes('*')) return ['*'];
        perms.forEach(p => allPerms.add(p));
    }

    return Array.from(allPerms);
}

/**
 * Check if given roles should have admin panel access (has at least one permission)
 */
export async function canAccessAdmin(userRoles: string[]): Promise<boolean> {
    if (userRoles.includes('admin')) return true;

    const permMap = await loadRolePermissions();

    for (const role of userRoles) {
        const perms = permMap[role];
        if (!perms) continue;
        if (perms.includes('*') || perms.length > 0) return true;
    }

    return false;
}
