import {cookies} from 'next/headers';
import {kv} from '@vercel/kv';
import {jwtVerify, SignJWT} from "jose";
import {ReadonlyRequestCookies} from "next/dist/server/web/spec-extension/adapters/request-cookies";
// import { ReadonlyRequestCookies } from 'next/dist/server/app-render';

// Define return type for session functions
type SessionValue = string | number | boolean | object | null | undefined;

// Interface for encryption utility
interface EncryptionUtil {
    key: string;
    encrypt: (text: SessionPayload) => Promise<string>;
    decrypt: (text: string | undefined) => Promise<SessionPayload | undefined>;
}

type SessionPayload = {
    data: string | object;
    expires: Date
}
const encodedKey = new TextEncoder().encode(process.env.SESSION_SECRET);
// Create encryption utility with proper TypeScript types
export const encryption: EncryptionUtil = {
    key: process.env.SESSION_SECRET || '',

    encrypt: (payload: SessionPayload) => {
        return new SignJWT(payload)
            .setProtectedHeader({alg: 'HS256'})
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(encodedKey);
    },

    async decrypt(session: string | undefined = ''): Promise<SessionPayload | undefined> {
        try {
            const {payload} = await jwtVerify(session, encodedKey, {
                algorithms: ['HS256'],
            });
            return payload as SessionPayload;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            console.log('Failed to verify session');
            return undefined;
        }
    }
};

/**
 * Gets a session value from cookie or KV store without modifying cookies
 * Safe to use in Route Handlers and Server Components
 */
export async function getSession(key: string, useKV = false): Promise<SessionValue> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    // No session exists yet
    if (!sessionId) {
        return undefined;
    }

    // If using Vercel KV
    if (useKV && sessionId) {
        return await kv.hget(`session:${sessionId}`, key);
    }
    // Otherwise use cookies
    else {
        const sessionCookieName = 'app_session';
        const sessionCookie = cookieStore.get(sessionCookieName);

        if (sessionCookie?.value) {
            try {
                const val = await encryption.decrypt(sessionCookie.value as string)
                if (!val) return undefined;
                const sessionData = JSON.parse(val.data as string);
                return sessionData[key];
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                return undefined;
            }
        }

        return undefined;
    }
}

/**
 * Setups an initial session ID if not present
 * MUST be called from middleware or a server action
 */
export function ensureSession(cookieStore: ReadonlyRequestCookies): string {
    let sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        // Note: You'll need to return this cookie in middleware or server action
    }

    return sessionId;
}

/**
 * Sets a session value (ONLY use in Server Actions or from middleware)
 */
export async function setSession(
    key: string,
    value: SessionValue,
    useKV = false
): Promise<void> {
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        cookieStore.set('session_id', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });
    }

    // If using Vercel KV
    if (useKV) {
        await kv.hset(`session:${sessionId}`, {[key]: value});
        await kv.expire(`session:${sessionId}`, 60 * 60 * 24 * 7); // 1 week
    }
    // Otherwise use cookies
    else {
        const sessionCookieName = 'app_session';
        let sessionData: Record<string, SessionValue> = {};

        const sessionCookie = cookieStore.get(sessionCookieName);
        if (sessionCookie?.value) {
            try {
                sessionData = JSON.parse((await encryption.decrypt(sessionCookie.value))?.data as string);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                sessionData = {};
            }
        }

        sessionData[key] = value;
        cookieStore.set(sessionCookieName, await encryption.encrypt({
            data: JSON.stringify(sessionData),
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
        });
    }
}

/**
 * Removes a specific session value by key (ONLY use in Server Actions or from middleware)
 * @param key - The session key to remove
 * @param useKV - Whether to use Vercel KV or cookies for storage
 * @returns Promise<boolean> - Returns true if the key was found and removed, false otherwise
 */
export async function removeSession(
    key: string,
    useKV = false
): Promise<boolean> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    // No session exists
    if (!sessionId) {
        return false;
    }

    // If using Vercel KV
    if (useKV) {
        try {
            // Check if the key exists before removing
            const exists = await kv.hexists(`session:${sessionId}`, key);
            if (exists) {
                await kv.hdel(`session:${sessionId}`, key);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error removing session key from KV:', error);
            return false;
        }
    }
    // Otherwise use cookies
    else {
        const sessionCookieName = 'app_session';
        const sessionCookie = cookieStore.get(sessionCookieName);

        if (sessionCookie?.value) {
            try {
                const val = await encryption.decrypt(sessionCookie.value);
                if (!val) return false;

                const sessionData = JSON.parse(val.data as string);

                // Check if the key exists
                if (!(key in sessionData)) {
                    return false;
                }

                // Remove the key
                delete sessionData[key];

                // Update the session cookie with the modified data
                cookieStore.set(sessionCookieName, await encryption.encrypt({
                    data: JSON.stringify(sessionData),
                    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }), {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7,
                });

                return true;
            } catch (error) {
                console.error('Error removing session key from cookie:', error);
                return false;
            }
        }

        return false;
    }
}

/**
 * Removes multiple session values by keys (ONLY use in Server Actions or from middleware)
 * @param keys - Array of session keys to remove
 * @param useKV - Whether to use Vercel KV or cookies for storage
 * @returns Promise<string[]> - Returns array of keys that were successfully removed
 */
export async function removeSessionKeys(
    keys: string[],
    useKV = false
): Promise<string[]> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    // No session exists
    if (!sessionId || keys.length === 0) {
        return [];
    }

    const removedKeys: string[] = [];

    // If using Vercel KV
    if (useKV) {
        try {
            for (const key of keys) {
                const exists = await kv.hexists(`session:${sessionId}`, key);
                if (exists) {
                    await kv.hdel(`session:${sessionId}`, key);
                    removedKeys.push(key);
                }
            }
        } catch (error) {
            console.error('Error removing session keys from KV:', error);
        }
    }
    // Otherwise use cookies
    else {
        const sessionCookieName = 'app_session';
        const sessionCookie = cookieStore.get(sessionCookieName);

        if (sessionCookie?.value) {
            try {
                const val = await encryption.decrypt(sessionCookie.value);
                if (val) {
                    const sessionData = JSON.parse(val.data as string);

                    // Remove each key that exists
                    for (const key of keys) {
                        if (key in sessionData) {
                            delete sessionData[key];
                            removedKeys.push(key);
                        }
                    }

                    // Only update cookie if we removed at least one key
                    if (removedKeys.length > 0) {
                        cookieStore.set(sessionCookieName, await encryption.encrypt({
                            data: JSON.stringify(sessionData),
                            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        }), {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'lax',
                            maxAge: 60 * 60 * 24 * 7,
                        });
                    }
                }
            } catch (error) {
                console.error('Error removing session keys from cookie:', error);
            }
        }
    }

    return removedKeys;
}

// Helper to clear the entire session
export async function flushSession(useKV = false): Promise<void> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (sessionId) {
        if (useKV) {
            await kv.del(`session:${sessionId}`);
        }

        cookieStore.delete('app_session');
        cookieStore.delete('session_id');
    }
}