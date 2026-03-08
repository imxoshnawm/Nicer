import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import {
    redisCheckLoginAttempts,
    redisRecordFailedLogin,
    redisClearLoginAttempts,
} from '@/lib/redis';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';

// In-memory login attempt tracker (fallback when Redis unavailable)
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function checkLoginAttemptsMemory(email: string): { allowed: boolean; remainingMs?: number } {
    const normalized = email.toLowerCase().trim();
    const entry = loginAttempts.get(normalized);
    const now = Date.now();

    if (!entry) return { allowed: true };
    if (now > entry.lockUntil) {
        loginAttempts.delete(normalized);
        return { allowed: true };
    }
    if (entry.count >= MAX_LOGIN_ATTEMPTS) {
        return { allowed: false, remainingMs: entry.lockUntil - now };
    }
    return { allowed: true };
}

function recordFailedLoginMemory(email: string): void {
    const normalized = email.toLowerCase().trim();
    const entry = loginAttempts.get(normalized);
    const now = Date.now();

    if (!entry || now > entry.lockUntil) {
        loginAttempts.set(normalized, { count: 1, lockUntil: now + LOCK_DURATION_MS });
    } else {
        entry.count++;
        if (entry.count >= MAX_LOGIN_ATTEMPTS) {
            entry.lockUntil = now + LOCK_DURATION_MS;
        }
    }
}

function clearLoginAttemptsMemory(email: string): void {
    loginAttempts.delete(email.toLowerCase().trim());
}

// Hybrid check: try Redis first, fall back to in-memory
async function checkLoginAttempts(email: string): Promise<{ allowed: boolean; remainingMs?: number }> {
    const redisResult = await redisCheckLoginAttempts(email, MAX_LOGIN_ATTEMPTS, LOCK_DURATION_MS);
    if (redisResult) return redisResult;
    return checkLoginAttemptsMemory(email);
}

async function recordFailedLogin(email: string): Promise<void> {
    await redisRecordFailedLogin(email, MAX_LOGIN_ATTEMPTS, LOCK_DURATION_MS);
    recordFailedLoginMemory(email);
}

async function clearLoginAttempts(email: string): Promise<void> {
    await redisClearLoginAttempts(email);
    clearLoginAttemptsMemory(email);
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Validate email format
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(credentials.email)) {
                    return null;
                }

                // Check brute-force lockout (Redis + in-memory)
                const attemptCheck = await checkLoginAttempts(credentials.email);
                if (!attemptCheck.allowed) {
                    await logAudit({
                        action: AUDIT_ACTIONS.LOGIN_BLOCKED,
                        actor: { id: 'unknown', name: 'Unknown', email: credentials.email },
                        details: { reason: 'Too many failed attempts' },
                        severity: 'warning',
                    });
                    throw new Error('Account temporarily locked due to too many failed attempts. Please try again later.');
                }

                await dbConnect();
                const user = await User.findOne({ email: credentials.email.toLowerCase().trim() });

                if (!user) {
                    // Record failed attempt even for non-existent users (timing-safe)
                    await recordFailedLogin(credentials.email);
                    await logAudit({
                        action: AUDIT_ACTIONS.LOGIN_FAILED,
                        actor: { id: 'unknown', name: 'Unknown', email: credentials.email },
                        details: { reason: 'User not found' },
                    });
                    return null;
                }

                // Check if user is blocked
                if (user.blocked) {
                    await logAudit({
                        action: AUDIT_ACTIONS.LOGIN_BLOCKED,
                        actor: { id: user._id.toString(), name: user.name, email: user.email },
                        details: { reason: 'Account blocked by admin' },
                        severity: 'warning',
                    });
                    throw new Error('Your account has been blocked. Please contact an administrator.');
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    await recordFailedLogin(credentials.email);
                    await logAudit({
                        action: AUDIT_ACTIONS.LOGIN_FAILED,
                        actor: { id: user._id.toString(), name: user.name, email: user.email },
                        details: { reason: 'Invalid password' },
                    });
                    return null;
                }

                // Successful login - clear failed attempts
                await clearLoginAttempts(credentials.email);

                // Auto-migrate old role field to roles array
                // Must use raw collection because Mongoose applies default ['member']
                const rawUser = await User.collection.findOne({ _id: user._id });
                let userRoles: string[];

                if (rawUser && !rawUser.roles && rawUser.role) {
                    // Old format: single role string -> migrate to array
                    userRoles = [rawUser.role as string];
                    await User.collection.updateOne(
                        { _id: user._id },
                        { $set: { roles: userRoles }, $unset: { role: '' } }
                    );
                } else if (rawUser && rawUser.roles && Array.isArray(rawUser.roles) && rawUser.roles.length > 0) {
                    userRoles = rawUser.roles as string[];
                } else {
                    userRoles = ['member'];
                }

                // Audit: successful login
                await logAudit({
                    action: AUDIT_ACTIONS.LOGIN_SUCCESS,
                    actor: { id: user._id.toString(), name: user.name, email: user.email },
                    details: { roles: userRoles },
                });

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    roles: userRoles,
                    memberId: user.memberId || '',
                    avatar: user.avatar || '',
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 8 * 60 * 60, // 8 hours (reduced from default 30 days)
    },
    jwt: {
        maxAge: 8 * 60 * 60, // 8 hours
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.roles = (user as any).roles || ['member'];
                token.role = ((user as any).roles || ['member'])[0]; // backward compat
                token.id = (user as any).id;
                token.memberId = (user as any).memberId || '';
                token.avatar = (user as any).avatar || '';
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).roles = token.roles || ['member'];
                (session.user as any).role = token.role || 'member'; // backward compat
                (session.user as any).id = token.id;
                (session.user as any).memberId = token.memberId || '';
                (session.user as any).avatar = token.avatar || '';
            }
            return session;
        },
    },
    pages: {
        signIn: '/admin/login',
    },
    secret: (() => {
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
            throw new Error('NEXTAUTH_SECRET environment variable is required for security. Generate one with: openssl rand -base64 32');
        }
        return secret;
    })(),
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
