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

    console.log("id", {
        ok,
        error,
        message,
        data,
        ...kwargs
    })
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