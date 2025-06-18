// middleware.ts
import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import {updateSession} from "@/lib/supabase/middleware";
import supa_middleware from "@/app/system/middleware";
import {threatEngine} from "@/lib/security/core/threat-engine";
import {securityClient} from "@/lib/security/supabase-client";

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
    //@ts-ignore
    const country = request.geo?.country || 'unknown';
    //@ts-ignore
    const region = request.geo?.region || null;
    //@ts-ignore
    const city = request.geo?.city || null;

    try {
        // Check emergency lockdown
        const emergencyStatus = await checkEmergencyStatus();
        if (emergencyStatus.active && !await isIPWhitelisted(ip)) {
            return new NextResponse('Service temporarily unavailable', {status: 503});
        }

        // Quick IP block check (cached)
        if (await isIPBlocked(ip)) {
            await logBlockedRequest(ip, request.nextUrl.pathname);
            return new NextResponse('Access Denied', {status: 403});
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

        // Process request normally
        const response = NextResponse.next();
        const responseTime = Date.now() - startTime;

        // Log the request asynchronously
        setImmediate(async () => {
            try {
                await securityClient.logSecurityEvent({
                    ipAddress: ip,
                    userAgent,
                    //@ts-ignore
                    referer,
                    //@ts-ignore
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
                    blocked: threatResult.shouldBlock,
                    //@ts-ignore
                    sessionId: request.cookies.get('session')?.value || null,
                    //@ts-ignore
                    userId: null // Extract from auth if available
                });

                // Auto-block if threat is severe
                if (threatResult.shouldBlock) {
                    await autoBlockIP(ip, threatResult.reason);
                }

                // Trigger alerts for high-risk events
                if (threatResult.riskScore >= 70) {
                    await triggerSecurityAlert(threatResult, incomingRequest);
                }
            } catch (error) {
                console.error('Failed to log security event:', error);
            }
        });

        // Block if immediate threat
        if (threatResult.shouldBlock) {
            return new NextResponse('Suspicious activity detected', {status: 403});
        }

        return await systemMiddleWare(request, response);
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

// Helper functions
async function checkEmergencyStatus(): Promise<{ active: boolean }> {
    // Implementation to check emergency status from Supabase
    return {active: false}; // Placeholder
}

async function isIPWhitelisted(ip: string): Promise<boolean> {
    // Implementation to check IP whitelist
    return false; // Placeholder
}

async function isIPBlocked(ip: string): Promise<boolean> {
    // Implementation with caching
    return false; // Placeholder
}

async function logBlockedRequest(ip: string, path: string): Promise<void> {
    // Implementation to log blocked requests
}

async function autoBlockIP(ip: string, reason: string): Promise<void> {
    // Implementation to auto-block IPs
}

async function triggerSecurityAlert(threat: any, request: any): Promise<void> {
    // Implementation to trigger alerts
}