import {NextRequest, NextResponse} from 'next/server';
import {adminAuth} from '@/lib/firebase/admin';
import {setSession} from "@/lib/session";

export async function POST(request: NextRequest) {
    try {
        const {idToken} = await request.json();

        // Verify ID token
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        // Only process if the token is valid
        if (decodedToken) {
            await setSession("user", idToken);
            return NextResponse.json({success: true});
        } else {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401});
        }
    } catch (error) {
        console.error('Session creation error:', error);
        return NextResponse.json(
            {error: 'Internal server error'},
            {status: 500}
        );
    }
}