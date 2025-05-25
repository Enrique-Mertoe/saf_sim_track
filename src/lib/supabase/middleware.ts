import {createServerClient} from '@supabase/ssr'
import {type NextRequest, NextResponse} from 'next/server'
import {UserRole} from '@/models/types'

// List of isolated emails that bypass subscription checks
// All emails should be in lowercase for case-insensitive comparison
const ISOLATED_EMAILS = [
    'admin@example.com',
    'abutimartin778@gmail.com',
    'smallvillecycle5@gmail.com'
].map(email => email.toLowerCase());

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({name, value, options}) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({name, value, options}) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: DO NOT REMOVE auth.getUser()

    const {
        data: {user},
    } = await supabase.auth.getUser()

    // Free paths that don't require authentication or subscription checks
    const freePaths = [
        '/accounts',
        '/api/auth',
        "/api/session",
        '/subscribe',
        '/subscription',
        '/service-unavailable',
    ];

    const isFreePath = freePaths.some(path => request.nextUrl.pathname.startsWith(path)) ||
        request.nextUrl.pathname === '/';
    if (isFreePath) {
        console.log('Free path: ', request.nextUrl.pathname)
        return supabaseResponse
    }
    if (!user) {
        // No user, redirect to login page
        const url = request.nextUrl.clone()
        url.pathname = '/accounts/login'
        return NextResponse.redirect(url)
    }
    if (request.nextUrl.pathname.startsWith("/api/payments/")) {
        return supabaseResponse
    }

    // Check if user's email is in the isolated emails list
    if (user.email && ISOLATED_EMAILS.includes(user.email.toLowerCase())) {
        console.log('Isolated email detected, bypassing subscription check:', user.email);
        return supabaseResponse;
    }

    // If user is authenticated and not accessing a free path, check subscription and role
    if (user && !isFreePath) {
        try {

            // Get user profile data
            const {data: profile} = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
            if (!profile) {
                // User profile not found, redirect to login
                const url = request.nextUrl.clone()
                url.pathname = '/accounts/login'
                return NextResponse.redirect(url)
            }

            // Check subscription status
            const {data: subscription} = await supabase
                .from('subscription_status')
                .select('*')
                .eq('user_id', user.id)
                .single();

            const hasActiveSubscription = subscription && subscription.is_active;

            // Handle different scenarios based on user role and subscription status
            if (profile.role === UserRole.ADMIN) {
                // Only check subscription if not already on the subscribe page
                if (!hasActiveSubscription && !request.nextUrl.pathname.startsWith('/subscribe')) {
                    // Check if user has any subscription records (active or expired)
                    const {data: subscriptionHistory} = await supabase
                        .from('subscriptions')
                        .select('id, expires_at')
                        .eq('user_id', user.id)
                        .order('expires_at', { ascending: false })
                        .limit(1);

                    const url = request.nextUrl.clone()
                    url.pathname = '/subscribe'

                    if (subscriptionHistory && subscriptionHistory.length > 0) {
                        // User has a subscription record - it's expired
                        url.searchParams.set('action', 'renew')
                    } else {
                        // User has never subscribed
                        url.searchParams.set('action', 'new')
                    }

                    return NextResponse.redirect(url)
                }
            } else if (profile.role === UserRole.TEAM_LEADER) {
                // Team leader with no/expired subscription should see service unavailable page
                if (!hasActiveSubscription && !request.nextUrl.pathname.startsWith('/service-unavailable')) {
                    const url = request.nextUrl.clone()
                    url.pathname = '/service-unavailable'
                    url.searchParams.set('type', 'team-leader')
                    return NextResponse.redirect(url)
                }

                // Check if team leader has a valid admin (by checking team relationship)
                if (profile.team_id) {
                    const {data: team} = await supabase
                        .from('teams')
                        .select('leader_id')
                        .eq('id', profile.team_id)
                        .single();

                    if (!team || !team.leader_id) {
                        // Team has no leader, show service unavailable
                        const url = request.nextUrl.clone()
                        url.pathname = '/service-unavailable'
                        url.searchParams.set('type', 'no-admin')
                        return NextResponse.redirect(url)
                    }
                }
            } else {
                // Regular user should see service unavailable if not linked to a team
                if (!profile.team_id && !request.nextUrl.pathname.startsWith('/service-unavailable')) {
                    const url = request.nextUrl.clone()
                    url.pathname = '/service-unavailable'
                    url.searchParams.set('type', 'no-team')
                    return NextResponse.redirect(url)
                }

                // Check if user's team has an active team leader
                if (profile.team_id) {
                    const {data: team} = await supabase
                        .from('teams')
                        .select('leader_id')
                        .eq('id', profile.team_id)
                        .single();

                    if (!team || !team.leader_id) {
                        // Team has no leader, show service unavailable
                        const url = request.nextUrl.clone()
                        url.pathname = '/service-unavailable'
                        url.searchParams.set('type', 'no-team-leader')
                        return NextResponse.redirect(url)
                    }

                    // Check if team leader has an active subscription
                    if (team.leader_id) {
                        const {data: leaderSubscription} = await supabase
                            .from('subscription_status')
                            .select('is_active')
                            .eq('user_id', team.leader_id)
                            .single();

                        if (!leaderSubscription || !leaderSubscription.is_active) {
                            // Team leader has no active subscription
                            const url = request.nextUrl.clone()
                            url.pathname = '/service-unavailable'
                            url.searchParams.set('type', 'team-leader-no-subscription')
                            return NextResponse.redirect(url)
                        }
                    }
                }
            }
        } catch (error) {
            console.log('Error in middleware subscription check:', error);
        }
    } else {
        const url = request.nextUrl.clone()
        url.pathname = '/accounts/login'
        return NextResponse.redirect(url)
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // If you're creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse
}
