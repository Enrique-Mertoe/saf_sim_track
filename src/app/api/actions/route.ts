import {makeResponse} from "@/helper";
import {NextRequest} from "next/server";
import AdminActions from "@/app/api/actions/admin-actions";

interface ApiRequest {
    action: string;
    data: any;
    target?: string;
}

class ApiHandler {
    static ALLOWED = ["admin"]

    static async builder(action: string, data: any, target?: string) {
        if (this.ALLOWED.includes(action) && !target)
            return makeResponse({error: "Invalid target"})
        switch (action) {
            case "admin":
                return await AdminActions.builder(target as string, data);
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