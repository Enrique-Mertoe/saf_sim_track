import {userService} from "@/services";
import {NextResponse} from "next/server";

function makeResponse(data: { error?: string; [key: string]: any }) {
    if (data.error) {
        return NextResponse.json({error: data.error}, {status: 400});
    }
    return NextResponse.json(data);
}

class AdminActions {
    static async create_user(data: any) {
        const {error} = await userService.createUser(data)
        console.log(error)
        if (error) {
            return makeResponse({error: error.message})
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