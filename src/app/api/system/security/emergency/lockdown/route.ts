// app/api/security/emergency/lockdown/route.ts
import {NextResponse} from 'next/server';
import {supabaseAdmin} from '@/lib/security/supabase-client';

export async function POST() {
    try {
        // Activate emergency mode - block all non-whitelisted IPs
        const {error} = await supabaseAdmin
            .from('security_config')
            .upsert({
                key: 'emergency.lockdown_active',
                value: true,
                description: 'Emergency lockdown activated',
                category: 'emergency',
                updated_at: new Date().toISOString()
            });

        if (error) throw error;

        // Log the emergency activation
        await supabaseAdmin
            .from('security_incidents')
            .insert({
                title: 'Emergency Lockdown Activated',
                description: 'System lockdown activated via dashboard',
                severity: 'critical',
                category: 'emergency_response',
                detected_at: new Date().toISOString(),
                status: 'open'
            });

        return NextResponse.json({
            success: true,
            message: 'Emergency lockdown activated'
        });
    } catch (error) {
        console.error('Emergency lockdown error:', error);
        return NextResponse.json(
            {success: false, error: 'Failed to activate emergency lockdown'},
            {status: 500}
        );
    }
}