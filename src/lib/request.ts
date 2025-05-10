import Config from '@/config';
import axios, {AxiosRequestConfig} from 'axios';

/**
 * Serialize data based on content type - mimics jQuery's data handling
 * @param data - The data to serialize
 * @param contentType - The content type to determine serialization method
 */
function serializeData(data: any, contentType?: string): any {
    // If it's already FormData, just return it
    if (data instanceof FormData) {
        return data;
    }

    // If we're dealing with an object and contentType is not specified or is application/json
    if (typeof data === 'object' && data !== null) {
        if (!contentType || contentType.includes('application/json')) {
            return JSON.stringify(data);
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            // Convert to URL encoded format (like jQuery does)
            return new URLSearchParams(data).toString();
        } else if (contentType.includes('multipart/form-data')) {
            // Convert to FormData
            return toFormData(data);
        }
    }

    // For other types, return as is
    return data;
}

/**
 * Convert an object to FormData, handling nested objects and arrays
 */
function toFormData(obj: Record<string, any>): FormData {
    const formData = new FormData();

    const appendToFormData = (data: any, prefix = '') => {
        if (Array.isArray(data)) {
            data.forEach((item, index) => {
                const key = `${prefix}[${index}]`;
                if (typeof item === 'object' && item !== null) {
                    appendToFormData(item, key);
                } else {
                    formData.append(key, item);
                }
            });
        } else if (data instanceof File) {
            formData.append(prefix, data);
        } else if (typeof data === 'object' && data !== null) {
            Object.keys(data).forEach(key => {
                const value = data[key];
                const keyPath = prefix ? `${prefix}[${key}]` : key;

                if (value instanceof File) {
                    formData.append(keyPath, value);
                } else if (typeof value === 'object' && value !== null) {
                    // Handle nested objects recursively
                    appendToFormData(value, keyPath);
                } else if (value !== undefined && value !== null) {
                    formData.append(keyPath, value.toString());
                }
            });
        } else if (data !== undefined && data !== null) {
            formData.append(prefix, data.toString());
        }
    };

    appendToFormData(obj);
    return formData;
}

/**
 * Determine the most appropriate Content-Type based on data
 */
function getContentType(data: any, contentTypeHeader?: string): string | undefined {
    if (contentTypeHeader) {
        return contentTypeHeader;
    }

    if (data instanceof FormData) {
        return undefined; // Browser will set the correct boundary for FormData
    }

    if (typeof data === 'object' && data !== null) {
        return 'application/json';
    }

    return 'application/x-www-form-urlencoded';
}

export const request = axios.create({
    baseURL: Config.baseURL,
    withCredentials: true,
    headers: {}
});


type RequestResponse<T> = {
    data: T | null;
    ok: boolean;
    error: string | null;
    message: string | null;
}

type RequestError = {
    message: string;
    status: number;
}

interface RequestInterface<T> {
    url: string;
    data?: Record<string, unknown> | FormData | any;
    contentType?: string;
    config?: AxiosRequestConfig;
    success?: (response: RequestResponse<T>) => void;
    error?: (response: RequestError) => void;
    complete?: () => void;
}

type DeferredObject<T> = {
    then: (fn: (response: RequestResponse<T>) => void) => DeferredObject<T>;
    catch: (fn: (error: RequestError) => void) => DeferredObject<T>;
    done: (fn: () => void) => DeferredObject<T>;
}

function createRequest<T>(method: 'post' | 'get', options: RequestInterface<T>): DeferredObject<T> {
    const data = options.data || {};
    const contentTypeHeader = options.config?.headers?.['Content-Type'] as string | undefined || options.contentType;
    const contentType = getContentType(data, contentTypeHeader);

    // Prepare headers
    const headers = {
        ...options.config?.headers,
    };

    if (contentType && !(data instanceof FormData)) {
        //@ts-ignore
        headers['Content-Type'] = contentType;
    }

    // Process data based on content type and method
    let processedData: any;
    let params: any;

    if (method === 'get') {
        // For GET, always use params for data
        params = data;
        processedData = undefined;
    } else {
        // For POST, serialize data based on content type
        processedData = serializeData(data, contentType);
        params = undefined;
    }

    const h = {
        then_cb: (_: RequestResponse<T>) => {
        },
        catch_cb: (_: RequestError) => {
        },
        done_cb: () => {
        }
    };

    (async () => {
        try {
            const response = await request({
                method,
                url: options.url,
                data: processedData,
                params,
                ...options.config,
                headers
            });

            const res: RequestResponse<T> = response.data as RequestResponse<T>;
            if (res.error) {
                const err: RequestError = {
                    message: res.error || res.message || 'Request failed.',
                    status: response.status,
                };
                options.error?.(err);
                h.catch_cb?.(err);
            } else {
                options.success?.(res);
                h.then_cb(res);
            }
        } catch (error: any) {
            const err: RequestError = {
                message: error?.response?.data?.error || error.message || 'Request failed.',
                status: error?.response?.status,
            };
            options.error?.(err);
            h.catch_cb?.(err);
        } finally {
            options.complete?.();
            h.done_cb?.();
        }
    })();

    return {
        then(fn: (response: RequestResponse<T>) => void) {
            h.then_cb = fn;
            return this;
        },
        catch(fn: (error: RequestError) => void) {
            h.catch_cb = fn;
            return this;
        },
        done(fn: () => void) {
            h.done_cb = fn;
            return this;
        }
    };
}

function post<T>(options: RequestInterface<T>): DeferredObject<T> {
    return createRequest('post', options);
}

function get<T>(options: RequestInterface<T>): DeferredObject<T> {
    return createRequest('get', options);
}

// Added methods to more closely match jQuery's $.ajax functionality
function ajax<T>(options: RequestInterface<T> & { method?: string }): DeferredObject<T> {
    const method = (options.method || 'get').toLowerCase() as 'post' | 'get';
    return createRequest(method, options);
}

export const $ = {
    post,
    get,
    ajax,
    JSON: "application/json"
}

export default request;