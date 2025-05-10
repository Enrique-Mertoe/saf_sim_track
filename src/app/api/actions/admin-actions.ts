import {NextResponse} from "next/server";
import {UserCreate} from "@/models";
import {createServerClient} from "@/lib/supabase/server";



export async function createUser(userData: UserCreate) {
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
function makeResponse(data: { error?: string; [key: string]: any }) {
    if (data.error) {
        return NextResponse.json({error: data.error}, {status: 400});
    }
    return NextResponse.json(data);
}

class AdminActions {
    static async create_user(data: any) {
        const {error} = await createUser(data)
        console.log(error)
        if (error) {
            return makeResponse({error: (error as any).message})
        }
        return makeResponse({ok: true})
    }

    static async builder(target: string, data: any) {
        try {
            const action = (AdminActions as any)[target];
            if (typeof action === 'function') {
                return await action(data);
            } else {
                throw new Error(`Action '${target}' is not a function`);
            }
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }
}

export default AdminActions