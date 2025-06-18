// app/api/security/blocking/ip/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {supabaseAdmin} from '@/lib/security/supabase-client';

export async function POST(request: NextRequest) {
    try {
        const { ip, reason, duration } = await request.json();

        if (!ip || !reason) {
            return NextResponse.json(
                { success: false, error: 'IP and reason are required' },
                { status: 400 }
            );
        }

        const expiresAt = duration
            ? new Date(Date.now() + duration * 60 * 1000).toISOString()
            : null;

        const { error } = await supabaseAdmin
            .from('ip_blocks')
            .insert({
                ip_address: ip,
                reason,
                block_type: duration ? 'temporary' : 'permanent',
                expires_at: expiresAt,
                severity: 'high',
                auto_generated: false
            });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: `IP ${ip} has been blocked`
        });
    } catch (error) {
        console.error('IP blocking error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to block IP' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const ip = searchParams.get('ip');

        if (!ip) {
            return NextResponse.json(
                { success: false, error: 'IP is required' },
                { status: 400 }
            );
        }

        const { error } = await supabaseAdmin
            .from('ip_blocks')
            .delete()
            .eq('ip_address', ip);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: `IP ${ip} has been unblocked`
        });
    } catch (error) {
        console.error('IP unblocking error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to unblock IP' },
            { status: 500 }
        );
    }
}