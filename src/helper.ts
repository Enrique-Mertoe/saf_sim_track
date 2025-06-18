import {DateTime} from "luxon";
import {NextResponse} from "next/server";

type JsonResponse = {
    ok?: boolean;
    error?: string;
    message?: string;
    data?: Record<string, any>;
    [key: string]: any;
};

export function makeResponse({
                                 ok = false,
                                 error = '',
                                 message = '',
                                 data = {},
                                 ...kwargs
                             }: JsonResponse): JsonResponse {

    return NextResponse.json({
        ok,
        error,
        message,
        data,
        ...kwargs
    });
}

export const generateUUID = (): string => {
    const randomDigits = () => Math.floor(100 + Math.random() * 900).toString(); // 3-digit number
    return `${randomDigits()}-${randomDigits()}-${randomDigits()}`;
};

export function generatePassword(
    length: number = 12,
    options: { uppercase?: boolean; lowercase?: boolean; numbers?: boolean; symbols?: boolean } = {
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
    }
): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const nums = '0123456789';
    const syms = '!@#$%^&*()_+[]{}|;:,.<>?';

    let chars = '';
    if (options.uppercase) chars += upper;
    if (options.lowercase) chars += lower;
    if (options.numbers) chars += nums;
    if (options.symbols) chars += syms;

    if (chars.length === 0) {
        throw new Error('At least one character set must be enabled.');
    }

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars[array[i] % chars.length];
    }

    return password;
}

export function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Suggests user-friendly rejection reasons for common Supabase registration errors
 * @param error - The error object or message from Supabase
 * @returns A user-friendly error message
 */
export function suggestRejection(error: any): string {
    // Convert error to string if it's an object
    const errorMessage = typeof error === 'object'
        ? JSON.stringify(error)
        : String(error || '');

    // Normalize for case-insensitive matching
    const normalizedError = errorMessage.toLowerCase();

    // Common Supabase auth errors
    if (normalizedError.includes('user with this email already exists') ||
        normalizedError.includes('email already in use') ||
        normalizedError.includes('has already been registered') ||
        normalizedError.includes('duplicate key value violates unique constraint "users_email_key"')) {
        return "This email address is already registered. Please use a different email.";
    }

    if (normalizedError.includes('duplicate key value violates unique constraint "profiles_username_key"') ||
        normalizedError.includes('username already exists')) {
        return "This username is already taken. Please choose another one.";
    }

    if (normalizedError.includes('phone_number') &&
        (normalizedError.includes('unique constraint') || normalizedError.includes('already exists'))) {
        return "This phone number is already registered with another account.";
    }

    if (normalizedError.includes('id_number') &&
        (normalizedError.includes('unique constraint') || normalizedError.includes('already exists'))) {
        return "This ID number is already registered in our system.";
    }

    // Authentication/validation specific errors
    if (normalizedError.includes('password') && normalizedError.includes('weak')) {
        return "Please use a stronger password. Include uppercase, lowercase, numbers, and special characters.";
    }

    if (normalizedError.includes('invalid email')) {
        return "Please enter a valid email address.";
    }

    if (normalizedError.includes('email confirmation') || normalizedError.includes('verify')) {
        return "Please check your email and verify your account before continuing.";
    }

    // Rate limiting
    if (normalizedError.includes('too many requests') || normalizedError.includes('rate limit')) {
        return "Too many attempts. Please wait a moment before trying again.";
    }

    // Database constraints errors
    if (normalizedError.includes('violates check constraint')) {
        if (normalizedError.includes('min_length')) {
            return "One of your entries is too short. Please check all fields.";
        }
        if (normalizedError.includes('max_length')) {
            return "One of your entries is too long. Please check all fields.";
        }
        if (normalizedError.includes('valid_format')) {
            return "Please check that all information is in the correct format.";
        }
    }

    // Database connection issues
    if (normalizedError.includes('timeout') || normalizedError.includes('connection')) {
        return "We're having trouble connecting to our services. Please try again in a moment.";
    }

    // Row level security errors
    if (normalizedError.includes('new row violates row-level security')) {
        return "You don't have permission to perform this action.";
    }

    // Catch other Postgres/Supabase database errors
    if (normalizedError.includes('violates foreign key constraint')) {
        return "Invalid reference data. Please check your entries.";
    }

    // JSON validation errors
    if (normalizedError.includes('invalid json')) {
        return "There was a problem with your data format. Please try again.";
    }

    // Function errors
    if (normalizedError.includes('function') && normalizedError.includes('does not exist')) {
        return "This feature is temporarily unavailable. Please try again later.";
    }

    // Generic fallback
    return "Registration failed. Please check your information and try again.";
}

export function escapeHtml(str: string) {
    return str.replace(/[&<>"']/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[match] || match));
}

export function now() {
    return DateTime.now().setZone('Africa/Nairobi').toISO();
}

export const isSameDay = (date1: any, date2: any) => {
    if (!date1 || !date2) return false;

    // Extract just the date part (YYYY-MM-DD) for comparison
    const day1 = date1.split('T')[0];
    const day2 = date2.split('T')[0];

    return day1 === day2;
};

export const to2dp = (num: number) => Math.round(num * 100) / 100;

export type Filter =
    | [string, any]                                      // eq
    | [string, string, any]                              // eq, gt, lt, in, is...
    | [string, 'not', string, any];                      // not('col', 'is', null)

// export const applyFilters = <T>(q: T, filters: Filter[]): T => {
//     for (const filter of filters) {
//         if (filter.length === 2) {
//             const [col, val] = filter;
//             q = (q as any).eq(col, val);
//         } else if (filter.length === 3) {
//             const [col, op, val] = filter;
//             if (op === 'in' && Array.isArray(val)) {
//                 q = (q as any).in(col, val);
//             } else if (op === 'is') {
//                 q = (q as any).is(col, val);
//             } else {
//                 q = (q as any)[op](col, val);
//             }
//         } else if (filter.length === 4 && filter[1] === 'not') {
//             const [col, , op, val] = filter;
//             q = (q as any).not(col, op, val);
//         }
//     }
//
//     return q;
// };

export const applyFilters = <T>(q: T, filters: Filter[], useWave = true): T => {
    if (useWave)
        filters = [wave(), ...filters]
    for (const filter of filters) {
        if (filter.length === 2) {
            const [col, val] = filter;

            if (col === 'or' && typeof val === 'string') {
                q = (q as any).or(val);
            } else {
                q = (q as any).eq(col, val);
            }

        } else if (filter.length === 3) {
            const [col, op, val] = filter;

            if (col === 'or' && typeof val === 'string') {
                q = (q as any).or(val, {foreignTable: op}); // when needed
            } else if (op === 'in' && Array.isArray(val)) {
                q = (q as any).in(col, val);
            } else if (op === 'is') {
                q = (q as any).is(col, val);
            } else {
                q = (q as any)[op](col, val);
            }

        } else if (filter.length === 4 && filter[1] === 'not') {
            const [col, , op, val] = filter;
            q = (q as any).not(col, op, val);
        }
    }

    return q;
};


export function parseDateToYMD(input: string | number | Date | null | undefined): string | null {
    if (!input) return null;

    try {
        if (typeof input === 'string') {
            // Handle compact format like "20250604"
            if (/^\d{8}$/.test(input)) {
                const formatted = `${input.slice(0, 4)}-${input.slice(4, 6)}-${input.slice(6, 8)}`;
                const d = new Date(formatted);
                if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
            }

            // Handle ISO-like or valid formats
            const d = new Date(input);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        }

        if (typeof input === 'number') {
            // Unix timestamp or Excel-style date
            const d = new Date(input);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        }

        if (input instanceof Date) {
            if (!isNaN(input.getTime())) return input.toISOString().split('T')[0];
        }
    } catch (e) {
        console.warn("Date parsing error:", e);
    }

    return null; // Invalid or unknown format
}

export function chunkArray<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

export const formatLocalDate = (date: any) =>
    date.toLocaleDateString('en-CA');

export const thisMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    return new Date(year, month, 1).toISOString();
}

export const wave: () => Filter = () => {
    const zone = 'Africa/Nairobi';
    const startOfMonth = DateTime.local().setZone(zone).startOf('month').toUTC().toISO();
    const startOfNextMonth = DateTime.local().setZone(zone).plus({months: 1}).startOf('month').toUTC().toISO();

    return ['or', `activation_date.is.null,activation_date.gte.${startOfMonth},activation_date.lt.${startOfNextMonth}`];
}