// middleware.ts
import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import {updateSession} from "@/lib/supabase/middleware";

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

    // const supabase = createMiddlewareClient<Database>({req, res});
    //
    // try {
    //     // IMPORTANT: Check the session, not just the user
    //     const {data: {session}} = await supabase.auth.getSession();
    //     if (!session) {
    //       // await Accounts.logout();
    //         const loginUrl = new URL('/accounts/login', req.url);
    //         loginUrl.searchParams.set('from', req.nextUrl.pathname);
    //         return NextResponse.redirect(loginUrl);
    //     }
    //     // await Accounts.session(session, supabase)
    //     return res;
    // } catch (error) {
    //     console.error("Auth middleware error:", error);
    //     // await Accounts.logout();
    //     return NextResponse.redirect(new URL('/accounts/login', req.url));
    // }
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