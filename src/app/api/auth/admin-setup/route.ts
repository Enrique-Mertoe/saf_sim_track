import {NextRequest, NextResponse} from 'next/server';
import {adminFirestore as admin} from '@/lib/firebase/admin';
import {userService} from "@/services";
import {makeResponse} from "@/helper";
import {UserCreate} from "@/models";
import {createServerClient} from "@/lib/supabase/server";

async function createUser(userData: UserCreate) {
    const serverSupabase = await createServerClient();

    try {
        // First create the auth user
        const {data: authData, error: authError} = await serverSupabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
        });
        if (authError) {
            return {data: null, error: authError};
        }
        try {
            // Then create the profile record
            const {data, error} = await serverSupabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    auth_user_id: authData.user.id,
                    email: userData.email,
                    full_name: userData.full_name,
                    id_number: userData.id_number,
                    id_front_url: userData.id_front_url,
                    id_back_url: userData.id_back_url,
                    phone_number: userData.phone_number,
                    mobigo_number: userData.mobigo_number,
                    role: userData.role,
                    team_id: userData.team_id,
                    staff_type: userData.staff_type,
                })
                .select()
                .single();

            if (error) {
                // If profile creation fails, delete the auth user to maintain consistency
                await serverSupabase.auth.admin.deleteUser(authData.user.id);
                return {data: null, error};
            }

            return {data, error: null};
        } catch (profileError) {
            // Clean up auth user if any exception occurs during profile creation
            await serverSupabase.auth.admin.deleteUser(authData.user.id);
            return {data: null, error: profileError};
        }
    } catch (error) {
        return {data: null, error};
    }
}

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