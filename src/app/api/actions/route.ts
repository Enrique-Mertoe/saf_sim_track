import {makeResponse} from "@/helper";
import {NextRequest} from "next/server";
import AdminActions, {Logs} from "@/app/api/actions/admin-actions";
import TransferActions from "@/app/api/actions/transfer-actions";
import SimActions from "@/app/api/actions/sim-actions";
import {createSuperClient} from "@/lib/supabase/server";
import Accounts from "@/lib/accounts";

// Profile actions class for handling user profile updates
class ProfileActions {
    // static async supabase() {
    //     return await createSuperClient();
    // }

    static async update_id_documents(data: any) {
        try {
            const supabase = await createSuperClient();

            // Get the current user
            const user = await Accounts.user()
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            // Update the user's profile with ID document URLs
            const {data: userData, error} = await supabase
                .from('users')
                .update({
                    id_front_url: data.id_front_url,
                    id_back_url: data.id_back_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) {
                return makeResponse({error: error.message});
            }
            await Accounts.update(user)

            return makeResponse({ok: true, message: "ID documents updated successfully"});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
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
            return makeResponse({error: (error as Error).message});
        }
    }
}

interface ApiRequest {
    action: string;
    data: any;
    target?: string;
}

class ApiHandler {
    static ALLOWED = ["admin", "profile", "transfer", "sim"]

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
            case "transfer":
                return await TransferActions.builder(target as string, data);
            case "sim":
                return await SimActions.builder(target as string, data);
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
