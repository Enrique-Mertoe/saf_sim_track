import {NextRequest, NextResponse} from 'next/server';
import {adminFirestore as admin} from '@/lib/firebase/admin';
import {userService} from "@/services";
import {makeResponse} from "@/helper";

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const res = await userService.createUser(data);
        if (res.error) {
            return NextResponse.json(
                makeResponse({
                    error: (res.error as any).message
                }),
                {status: 500}
            );
        }

        return NextResponse.json(makeResponse({
            ok: true
        }));
    } catch (error) {
        console.error('Admin setup error:', error);
        return NextResponse.json(
            makeResponse({
                error: error instanceof Error ? error.message : 'Internal server error'
            }),
            {status: 500}
        );
    }
}

// Add a middleware to check if setup is already completed
export async function GET() {
    try {
        // Check if setup is already completed
        const setupDoc = await admin.collection('config').doc('setup').get();

        if (setupDoc.exists && setupDoc.data()?.initialSetupComplete === true) {
            return NextResponse.json({
                setupComplete: true,
                message: 'Initial admin setup has already been completed.'
            });
        }

        return NextResponse.json({
            setupComplete: false,
            message: 'Admin setup is required.'
        });
    } catch (error) {
        console.error('Setup check error:', error);
        return NextResponse.json(
            {error: error instanceof Error ? error.message : 'Internal server error'},
            {status: 500}
        );
    }
}