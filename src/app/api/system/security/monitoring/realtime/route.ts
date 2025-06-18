// app/api/security/monitoring/realtime/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {securityClient} from '@/lib/security/supabase-client';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '100');

        const events = await securityClient.getRecentEvents(limit);

        return NextResponse.json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Real-time events API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch events' },
            { status: 500 }
        );
    }
}