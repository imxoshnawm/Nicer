import Redis from 'ioredis';

// ============================================================
// Redis Client Singleton with Graceful Fallback
// ============================================================
// Set REDIS_URL in .env.local to enable Redis
// Example: REDIS_URL=redis://localhost:6379
// If not set, falls back to in-memory storage (per-process)

let redisClient: Redis | null = null;
let redisAvailable = false;
let connectionAttempted = false;

function createRedisClient(): Redis | null {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        console.log('[Redis] REDIS_URL not set — using in-memory fallback');
        return null;
    }

    try {
        const client = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times: number) {
                if (times > 3) {
                    console.warn('[Redis] Max retries reached, giving up');
                    return null; // Stop retrying
                }
                return Math.min(times * 200, 2000);
            },
            lazyConnect: true,
            enableOfflineQueue: false,
            connectTimeout: 5000,
        });

        client.on('connect', () => {
            redisAvailable = true;
            console.log('[Redis] Connected successfully');
        });

        client.on('error', (err: Error) => {
            redisAvailable = false;
            console.error('[Redis] Connection error:', err.message);
        });

        client.on('close', () => {
            redisAvailable = false;
        });

        return client;
    } catch (error) {
        console.error('[Redis] Failed to create client:', error);
        return null;
    }
}

export function getRedis(): Redis | null {
    if (!connectionAttempted) {
        connectionAttempted = true;
        redisClient = createRedisClient();
        if (redisClient) {
            redisClient.connect().catch(() => {
                redisAvailable = false;
            });
        }
    }
    return redisAvailable ? redisClient : null;
}

export function isRedisAvailable(): boolean {
    return redisAvailable;
}

// ============================================================
// Redis Rate Limiting
// ============================================================
export async function redisRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
): Promise<{ success: boolean; remaining: number; retryAfter?: number } | null> {
    const redis = getRedis();
    if (!redis) return null; // Caller should fall back to in-memory

    try {
        const windowSec = Math.ceil(windowMs / 1000);
        const redisKey = `rl:${key}`;

        const current = await redis.incr(redisKey);

        if (current === 1) {
            await redis.expire(redisKey, windowSec);
        }

        if (current > maxRequests) {
            const ttl = await redis.ttl(redisKey);
            return {
                success: false,
                remaining: 0,
                retryAfter: ttl > 0 ? ttl : windowSec,
            };
        }

        return {
            success: true,
            remaining: maxRequests - current,
        };
    } catch (error) {
        console.error('[Redis Rate Limit] Error:', error);
        return null; // Fall back to in-memory
    }
}

// ============================================================
// Redis Brute-Force Protection
// ============================================================
export async function redisCheckLoginAttempts(
    email: string,
    maxAttempts: number,
    lockDurationMs: number
): Promise<{ allowed: boolean; remainingMs?: number } | null> {
    const redis = getRedis();
    if (!redis) return null;

    try {
        const key = `login:${email.toLowerCase().trim()}`;
        const attempts = await redis.get(key);

        if (!attempts) return { allowed: true };

        const count = parseInt(attempts, 10);
        if (count >= maxAttempts) {
            const ttl = await redis.ttl(key);
            return {
                allowed: false,
                remainingMs: ttl > 0 ? ttl * 1000 : lockDurationMs,
            };
        }

        return { allowed: true };
    } catch {
        return null;
    }
}

export async function redisRecordFailedLogin(
    email: string,
    maxAttempts: number,
    lockDurationMs: number
): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    try {
        const key = `login:${email.toLowerCase().trim()}`;
        const lockSec = Math.ceil(lockDurationMs / 1000);

        const current = await redis.incr(key);
        if (current === 1 || current >= maxAttempts) {
            await redis.expire(key, lockSec);
        }
    } catch {
        // Silent fail - in-memory still works
    }
}

export async function redisClearLoginAttempts(email: string): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    try {
        await redis.del(`login:${email.toLowerCase().trim()}`);
    } catch {
        // Silent fail
    }
}
