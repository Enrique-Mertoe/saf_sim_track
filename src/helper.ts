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
