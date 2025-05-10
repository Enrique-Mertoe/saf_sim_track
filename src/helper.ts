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
    return {
        ok,
        error,
        message,
        data,
        ...kwargs
    };
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