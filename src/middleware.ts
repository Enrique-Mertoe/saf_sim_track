// middleware.ts
import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import {updateSession} from "@/lib/supabase/middleware";
import supa_middleware from "@/app/system/middleware";

const freePaths = [
    '/accounts',
    "/api/auth",
    "/api/session",
    "/tt1",
    '/forum/topic/',
    "/help",
    "/contact-us",
    "/app-download",

];

export async function middleware(req: NextRequest) {
    // Create a response to modify
    const res = NextResponse.next();

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