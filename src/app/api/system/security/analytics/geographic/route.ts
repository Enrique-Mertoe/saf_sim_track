// app/api/security/analytics/geographic/route.ts
import {NextResponse} from 'next/server';
import {securityClient} from '@/lib/security/supabase-client';

export async function GET() {
    try {
        const threats = await securityClient.getGeographicThreats();

        return NextResponse.json({
            success: true,
            data: threats
        });
    } catch (error) {
        console.error('Geographic threats API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch geographic data' },
            { status: 500 }
        );
    }
}
