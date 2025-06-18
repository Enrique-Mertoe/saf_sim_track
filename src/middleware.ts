// middleware.ts
import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import {updateSession} from "@/lib/supabase/middleware";
import supa_middleware from "@/app/system/middleware";
import {threatEngine} from "@/lib/security/core/threat-engine";

const freePaths = [
    '/accounts',
    "/api/auth",
    "/api/session",
    "/tt1",
    '/forum/topic/',
    "/help",
    "/contact-us",
    "/app-download",
    "/api/subscriptions"
];

// Cache for emergency status and IP blocks (Edge Runtime compatible)
let emergencyStatusCache: { active: boolean; expiry: number } = { active: false, expiry: 0 };
const ipBlockCache = new Map<string, number>(); // IP -> expiry timestamp
const ipWhitelistCache = new Map<string, number>(); // IP -> expiry timestamp

const systemMiddleWare = async (req: NextRequest, response: NextResponse) => {
    const res = response;

    const isFree = freePaths.some(path => req.nextUrl.pathname.startsWith(path));
    const isRootPath = req.nextUrl.pathname === '/';

    if (isFree || isRootPath) {
        return res;
    }
    if (["/system", "/api/system"].some(path => req.nextUrl.pathname.startsWith(path))) {
        return await supa_middleware(req)
    }
    return await updateSession(req)
}

export async function middleware(req: NextRequest) {
    // Create a response to modify
    const request = req;

    // Skip security processing for static files and non-security API routes
    if (
        req.nextUrl.pathname.startsWith('/_next') ||
        req.nextUrl.pathname.startsWith('/favicon') ||
        req.nextUrl.pathname.includes('.') ||
        (req.nextUrl.pathname.startsWith('/api') && !req.nextUrl.pathname.startsWith('/api/system/security'))
    ) {
        return NextResponse.next();
    }

    const startTime = Date.now();

    // Extract request information
    //@ts-ignore
    const ip = request.ip ||
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';

    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || null;
    const origin = request.headers.get('origin') || null;
    const country = (request as any).geo?.country || 'unknown';
    const region = (request as any).geo?.region || null;
    const city = (request as any).geo?.city || null;

    try {
        // Check emergency lockdown (with caching)
        const emergencyStatus = await checkEmergencyStatus();
        if (emergencyStatus.active && !await isIPWhitelisted(ip)) {
            return new NextResponse('Service temporarily unavailable', { status: 503 });
        }

        // Quick IP block check (cached)
        if (await isIPBlocked(ip)) {
            // Log blocked request without blocking the response
            logBlockedRequestAsync(ip, request.nextUrl.pathname);
            return new NextResponse('Access Denied', { status: 403 });
        }

        // Threat analysis
        const incomingRequest = {
            ipAddress: ip,
            userAgent,
            path: request.nextUrl.pathname,
            method: request.method,
            queryParams: Object.fromEntries(request.nextUrl.searchParams),
            headers: Object.fromEntries(request.headers.entries()),
            country,
            region,
            city
        };

        const threatResult = await threatEngine.analyzeRequest(incomingRequest);

        // Block if immediate threat
        if (threatResult.shouldBlock) {
            // Log the blocking action asynchronously
            logSecurityEventAsync({
                ipAddress: ip,
                userAgent,
                referer,
                origin,
                method: request.method,
                path: request.nextUrl.pathname,
                queryParams: Object.fromEntries(request.nextUrl.searchParams),
                headers: Object.fromEntries(request.headers.entries()),
                country,
                region,
                city,
                threatLevel: threatResult.threatLevel,
                threatCategories: threatResult.signatureMatches,
                riskScore: threatResult.riskScore,
                confidenceScore: threatResult.confidenceScore,
                signatureMatches: threatResult.signatureMatches,
                behavioralFlags: threatResult.behavioralFlags,
                anomalyScore: threatResult.anomalyScore,
                responseStatus: 403,
                responseTimeMs: Date.now() - startTime,
                blocked: true,
                sessionId: request.cookies.get('session')?.value || null,
                userId: null
            });

            // Auto-block the IP
            autoBlockIPAsync(ip, threatResult.reason);

            return new NextResponse('Suspicious activity detected', { status: 403 });
        }

        // Process request normally
        const response = await systemMiddleWare(request, NextResponse.next());
        const responseTime = Date.now() - startTime;

        // Log the request asynchronously (fire-and-forget)
        logSecurityEventAsync({
            ipAddress: ip,
            userAgent,
            referer,
            origin,
            method: request.method,
            path: request.nextUrl.pathname,
            queryParams: Object.fromEntries(request.nextUrl.searchParams),
            headers: Object.fromEntries(request.headers.entries()),
            country,
            region,
            city,
            threatLevel: threatResult.threatLevel,
            threatCategories: threatResult.signatureMatches,
            riskScore: threatResult.riskScore,
            confidenceScore: threatResult.confidenceScore,
            signatureMatches: threatResult.signatureMatches,
            behavioralFlags: threatResult.behavioralFlags,
            anomalyScore: threatResult.anomalyScore,
            responseStatus: response.status,
            responseTimeMs: responseTime,
            blocked: false,
            sessionId: request.cookies.get('session')?.value || null,
            userId: null
        });

        // Handle auto-blocking and alerts asynchronously
        if (threatResult.riskScore >= 70) {
            triggerSecurityAlertAsync(threatResult, incomingRequest);
        }

        return response;
    } catch (error) {
        console.error('Security middleware error:', error);
        return NextResponse.next(); // Fail open for availability
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};

// =============================================
// EDGE RUNTIME COMPATIBLE HELPER FUNCTIONS
// =============================================

async function checkEmergencyStatus(): Promise<{ active: boolean }> {
    const now = Date.now();

    // Use cache if still valid (5 minute TTL)
    if (emergencyStatusCache.expiry > now) {
        return { active: emergencyStatusCache.active };
    }

    try {
        // Use fetch instead of Supabase client for Edge Runtime compatibility
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/security_config?key=eq.emergency.lockdown_active&select=value`, {
            headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const active = data?.[0]?.value || false;

            // Update cache
            emergencyStatusCache = {
                active,
                expiry: now + (5 * 60 * 1000) // 5 minutes
            };

            return { active };
        }
    } catch (error) {
        console.error('Failed to check emergency status:', error);
    }

    return { active: false };
}

async function isIPWhitelisted(ip: string): Promise<boolean> {
    const now = Date.now();

    // Check cache first (1 minute TTL)
    const cached = ipWhitelistCache.get(ip);
    if (cached && cached > now) {
        return true;
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/ip_blocks?ip_address=eq.${ip}&block_type=eq.whitelist&select=ip_address`, {
            headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const isWhitelisted = data && data.length > 0;

            if (isWhitelisted) {
                ipWhitelistCache.set(ip, now + (60 * 1000)); // 1 minute cache
            }

            return isWhitelisted;
        }
    } catch (error) {
        console.error('Failed to check IP whitelist:', error);
    }

    return false;
}

async function isIPBlocked(ip: string): Promise<boolean> {
    const now = Date.now();

    // Check cache first (30 second TTL)
    const cached = ipBlockCache.get(ip);
    if (cached && cached > now) {
        return true;
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/ip_blocks?ip_address=eq.${ip}&block_type=neq.whitelist&or=(expires_at.is.null,expires_at.gt.${new Date().toISOString()})&select=ip_address`, {
            headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const isBlocked = data && data.length > 0;

            if (isBlocked) {
                ipBlockCache.set(ip, now + (30 * 1000)); // 30 second cache
            }

            return isBlocked;
        }
    } catch (error) {
        console.error('Failed to check IP block status:', error);
    }

    return false;
}

// =============================================
// ASYNC LOGGING FUNCTIONS (FIRE-AND-FORGET)
// =============================================

function logSecurityEventAsync(eventData: any): void {
    // Use fetch to call our logging API endpoint asynchronously
    // This won't block the request and works in Edge Runtime
    fetch(`${getBaseUrl()}/api/system/security/log-event`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify(eventData)
    }).catch(error => {
        console.error('Failed to log security event:', error);
    });
}

function logBlockedRequestAsync(ip: string, path: string): void {
    fetch(`${getBaseUrl()}/api/system/security/log-blocked`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ ip, path, timestamp: new Date().toISOString() })
    }).catch(error => {
        console.error('Failed to log blocked request:', error);
    });
}

function autoBlockIPAsync(ip: string, reason: string): void {
    fetch(`${getBaseUrl()}/api/system/security/auto-block`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
            ip,
            reason,
            auto_generated: true,
            block_type: 'temporary',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })
    }).catch(error => {
        console.error('Failed to auto-block IP:', error);
    });
}

function triggerSecurityAlertAsync(threatResult: any, requestData: any): void {
    fetch(`${getBaseUrl()}/api/system/security/trigger-alert`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
            threatLevel: threatResult.threatLevel,
            riskScore: threatResult.riskScore,
            ipAddress: requestData.ipAddress,
            path: requestData.path,
            reason: threatResult.reason,
            timestamp: new Date().toISOString()
        })
    }).catch(error => {
        console.error('Failed to trigger security alert:', error);
    });
}

function getBaseUrl(): string {
    // Get the base URL for API calls
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return process.env.NEXT_PUBLIC_SITE_URL;
    }
    return 'http://localhost:3000';
}