import {NextResponse} from "next/server";
import {supabaseAdmin} from "@/lib/supabase/server";
import {TransferStatus} from "@/models";

function makeResponse(data: { error?: string; [key: string]: any }) {
    if (data.error) {
        return NextResponse.json({error: data.error}, {status: 400});
    }
    return NextResponse.json(data);
}

class TransferActions {
    static async delete_t_request(data: any) {
        if (!data.id) {
            return makeResponse({error: 'Missing ID'});
        }
        const {data: deletedData, error} = await supabaseAdmin
            .from("sim_card_transfers")
            .delete()
            .eq("id", data.id);

        if (error) {
            return makeResponse({error: error.message});
        }

        return makeResponse({ok: true, data: deletedData});
    }

    static async create_t_request(data: any) {
        if (!data.source_team_id || !data.destination_team_id || !data.requested_by_id || !data.sim_cards) {
            return makeResponse({error: 'Missing required fields'});
        }

        const {data: createdData, error} = await supabaseAdmin
            .from("sim_card_transfers")
            .insert({
                source_team_id: data.source_team_id,
                destination_team_id: data.destination_team_id,
                requested_by_id: data.requested_by_id,
                admin_id: data.admin_id,
                sim_cards: data.sim_cards,
                reason: data.reason || '',
                notes: data.notes || '',
                status: TransferStatus.PENDING,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();


        if (error) {
            return makeResponse({error: error.message});
        }

        return makeResponse({ok: true, data: createdData});
    }

    static async approve_t_request(data: any) {
        if (!data.id || !data.admin_id) {
            return makeResponse({error: 'Missing ID or admin ID'});
        }

        const {data: updatedData, error} = await supabaseAdmin
            .from("sim_card_transfers")
            .update({
                status: 'APPROVED',
                approved_by_id: data.admin_id,
                updated_at: new Date().toISOString()
            })
            .eq("id", data.id)
            .eq("status", "PENDING")
            .select()
            .single();

        if (error) {
            return makeResponse({error: error.message});
        }

        return makeResponse({ok: true, data: updatedData});
    }

    static async reject_t_request(data: any) {
        if (!data.id || !data.admin_id) {
            return makeResponse({error: 'Missing ID or admin ID'});
        }

        const {data: updatedData, error} = await supabaseAdmin
            .from("sim_card_transfers")
            .update({
                status: 'REJECTED',
                approved_by_id: data.admin_id,
                notes: data.reason || '',
                updated_at: new Date().toISOString()
            })
            .eq("id", data.id)
            .eq("status", "PENDING")
            .select()
            .single();

        if (error) {
            return makeResponse({error: error.message});
        }

        return makeResponse({ok: true, data: updatedData});
    }

    static async builder(target: string, data: any) {
        try {
            const action = (TransferActions as any)[target];
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

export default TransferActions;