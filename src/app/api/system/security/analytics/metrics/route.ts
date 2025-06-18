// =============================================
// API ROUTES
// =============================================

// app/api/security/analytics/metrics/route.ts
import {NextResponse} from 'next/server';
import {securityClient} from '@/lib/security/supabase-client';

export async function GET() {
    try {
        const metrics = await securityClient.getSecurityMetrics();

        return NextResponse.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        console.error('Metrics API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch metrics' },
            { status: 500 }
        );
    }
}