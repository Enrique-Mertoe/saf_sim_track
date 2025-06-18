// app/api/security/analytics/threats/top-attackers/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {securityClient} from '@/lib/security/supabase-client';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '20');

        const attackers = await securityClient.getTopAttackers(limit);

        return NextResponse.json({
            success: true,
            data: attackers
        });
    } catch (error) {
        console.error('Top attackers API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch attacker data' },
            { status: 500 }
        );
    }
}
