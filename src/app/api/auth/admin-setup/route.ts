import {NextRequest, NextResponse} from 'next/server';
import {makeResponse} from "@/helper";
import {createUser} from '../../actions/admin-actions';
import {createSuperClient} from '@/lib/supabase/server';


export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const res = await createUser(data);
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
        const supabase = await createSuperClient();

        // Check if setup is already completed
        const { data: setupData, error } = await supabase
            .from('config')
            .select('*')
            .eq('key', 'setup')
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 is the error code for "no rows returned"
            throw error;
        }

        if (setupData && setupData.value?.initialSetupComplete === true) {
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
