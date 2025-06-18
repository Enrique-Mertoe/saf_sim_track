// app/api/security/analytics/timeline/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {securityClient} from '@/lib/security/supabase-client';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const hours = parseInt(searchParams.get('hours') || '24');

        const timeline = await securityClient.getThreatTimeline(hours);

        return NextResponse.json({
            success: true,
            data: timeline
        });
    } catch (error) {
        console.error('Timeline API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch timeline data' },
            { status: 500 }
        );
    }
}
