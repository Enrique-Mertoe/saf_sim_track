import {makeResponse} from "@/helper";
import {NextRequest} from "next/server";
import AdminActions, {Logs} from "@/app/api/actions/admin-actions";
import {createSuperClient} from "@/lib/supabase/server";
import {cookies} from "next/headers";

// Profile actions class for handling user profile updates
class ProfileActions {
    static async supabase() {
        const cookieStore = cookies();
        return await createSuperClient(cookieStore);
    }

    static async update_id_documents(data: any) {
        try {
            const supabase = await this.supabase();

            // Get the current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                return makeResponse({ error: userError?.message || "User not authenticated" });
            }

            // Update the user's profile with ID document URLs
            const { error } = await supabase
                .from('users')
                .update({
                    id_front_url: data.id_front_url,
                    id_back_url: data.id_back_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) {
                return makeResponse({ error: error.message });
            }

            return makeResponse({ ok: true, message: "ID documents updated successfully" });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    static async builder(target: string, data: any) {
        try {
            const action = (ProfileActions as any)[target];
            if (typeof action === 'function') {
                return await action(data);
            } else {
                throw new Error(`Action '${target}' is not a function`);
            }
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }
}

interface ApiRequest {
    action: string;
    data: any;
    target?: string;
}

class ApiHandler {
    static ALLOWED = ["admin", "profile"]

    static async builder(action: string, data: any, target?: string) {
        if (this.ALLOWED.includes(action) && !target)
            return makeResponse({error: "Invalid target"})
        switch (action) {
            case "admin":
                return await AdminActions.builder(target as string, data);
            case "logs":
                return await Logs.builder(target as string, data);
            case "profile":
                return await ProfileActions.builder(target as string, data);
            default:
                return await this._b(action, data)
        }
    }

    private static async _b(ev: string, data: any) {
        try {
            const action = (ApiHandler as any)[ev];
            if (typeof action === 'function') {
                return await action(data);
            } else {
                throw new Error(`Action '${ev}' is not a function`);
            }
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const data: ApiRequest = await request.json();
        if (!data) {
            return makeResponse({error: "No data found!"});
        }

        const {action} = data;

        if (!action) {
            return makeResponse({error: "Invalid action"});
        }
        return await ApiHandler.builder(action, data.data, data.target)
    } catch (error) {
        return makeResponse({error: `Something went wrong: ${error}`});
    }
}
