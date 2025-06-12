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

        // Mark SIM cards as in_transit when transfer request is created
        if (data.sim_cards && data.sim_cards.length > 0) {
            const {error: updateSimCardsError} = await supabaseAdmin
                .from("sim_cards")
                .update({
                    in_transit: true,
                    updated_at: new Date().toISOString()
                })
                .in("id", data.sim_cards);

            if (updateSimCardsError) {
                return makeResponse({error: updateSimCardsError.message});
            }
        }

        return makeResponse({ok: true, data: createdData});
    }

    static async approve_t_request(data: any) {
        if (!data.id || !data.admin_id) {
            return makeResponse({error: 'Missing ID or admin ID'});
        }

        // First, get the transfer request to access sim_cards and destination_team_id
        const {data: transferRequest, error: fetchError} = await supabaseAdmin
            .from("sim_card_transfers")
            .select("*")
            .eq("id", data.id)
            .eq("status", TransferStatus.PENDING)
            .single();

        if (fetchError) {
            return makeResponse({error: fetchError.message});
        }

        // Update the transfer request status
        const {data: updatedData, error} = await supabaseAdmin
            .from("sim_card_transfers")
            .update({
                status: TransferStatus.APPROVED,
                approved_by_id: data.admin_id,
                updated_at: new Date().toISOString()
            })
            .eq("id", data.id)
            .eq("status", TransferStatus.PENDING)
            .eq("admin_id", data.admin_id);
        if (error) {
            return makeResponse({error: error.message});
        }

        // Update the team_id for each SIM card in the transfer and set in_transit to false
        const simCards = transferRequest.sim_cards || [];
        const destinationTeamId = transferRequest.destination_team_id;

        if (simCards.length > 0) {
            const {error: updateSimCardsError} = await supabaseAdmin
                .from("sim_cards")
                .update({
                    team_id: destinationTeamId,
                    in_transit: false,
                    updated_at: new Date().toISOString()
                })
                .in("id", simCards);

            if (updateSimCardsError) {
                return makeResponse({error: updateSimCardsError.message});
            }
        }

        return makeResponse({ok: true, data: updatedData});
    }

    static async reject_t_request(data: any) {
        if (!data.id || !data.admin_id) {
            return makeResponse({error: 'Missing ID or admin ID'});
        }

        // First, get the transfer request to access sim_cards
        const {data: transferRequest, error: fetchError} = await supabaseAdmin
            .from("sim_card_transfers")
            .select("*")
            .eq("id", data.id)
            .eq("status", TransferStatus.PENDING)
            .single();

        if (fetchError) {
            return makeResponse({error: fetchError.message});
        }

        const {data: updatedData, error} = await supabaseAdmin
            .from("sim_card_transfers")
            .update({
                status: TransferStatus.REJECTED,
                approved_by_id: data.admin_id,
                notes: data.reason || '',
                updated_at: new Date().toISOString()
            })
            .eq("id", data.id)
            .eq("status", TransferStatus.PENDING)
            .select()
            .single();

        if (error) {
            return makeResponse({error: error.message});
        }

        // Set in_transit to false for all SIM cards in the rejected transfer
        const simCards = transferRequest.sim_cards || [];
        if (simCards.length > 0) {
            const {error: updateSimCardsError} = await supabaseAdmin
                .from("sim_cards")
                .update({
                    in_transit: false,
                    updated_at: new Date().toISOString()
                })
                .in("id", simCards);

            if (updateSimCardsError) {
                return makeResponse({error: updateSimCardsError.message});
            }
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
