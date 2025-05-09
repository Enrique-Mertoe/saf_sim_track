// middleware.ts
import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import {createMiddlewareClient} from '@supabase/auth-helpers-nextjs';
import {Database} from "@/types/database.types";

const freePaths = [
    '/accounts',
    "/api/auth",
];

export async function middleware(req: NextRequest) {
    // Create a response to modify
    const res = NextResponse.next();

    const isFree = freePaths.some(path => req.nextUrl.pathname.startsWith(path));
    const isRootPath = req.nextUrl.pathname === '/';

    if (isFree || isRootPath) {
        return res;
    }

    const supabase = createMiddlewareClient<Database>({req, res});

    try {
        // IMPORTANT: Check the session, not just the user
        const {data: {session}} = await supabase.auth.getSession();
        if (!session) {
            const loginUrl = new URL('/accounts/login', req.url);
            loginUrl.searchParams.set('from', req.nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }
        return res;
    } catch (error) {
        console.error("Auth middleware error:", error);
        return NextResponse.redirect(new URL('/accounts/login', req.url));
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