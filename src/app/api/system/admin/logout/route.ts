import {NextRequest, NextResponse} from 'next/server';
import {supabaseAdmin} from '@/lib/supabase/server';
import {flushSession} from "@/lib/session";

export async function POST(request: NextRequest) {
    try {
        // Sign out from Supabase
        await supabaseAdmin.auth.signOut();
        await flushSession()

        return NextResponse.json({success: true});
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            {success: false, message: 'An error occurred during logout'},
            {status: 500}
        );
    }
}