import {makeResponse} from "@/helper";
import {supabaseAdmin} from "@/lib/supabase/server";
import Accounts from "@/lib/accounts";
import {SIMCard, SIMCardCreate, SIMStatus} from "@/models";
import {admin_id} from "@/services/helper";

class SimActions {
    static async create_sim_card_batch(data: any) {
        try {
            // Get the current user
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {simCardsData, batchSize = 50, progressCallback} = data;

            // Implementation directly using supabaseAdmin
            let successCount = 0;
            const errors: any[] = [];

            try {
                // Process all chunks
                for (let i = 0; i < simCardsData.length; i += batchSize) {
                    const chunk = simCardsData.slice(i, i + batchSize);

                    // Clean up data before sending
                    const cleanedData = chunk.map((card: SIMCardCreate) => ({
                        ...card,
                        sold_by_user_id: card.sold_by_user_id === '' ? null : card.sold_by_user_id
                    }));

                    const {error} = await supabaseAdmin.from('sim_cards').insert(cleanedData);

                    if (error) {
                        console.error(`Error inserting chunk ${Math.floor(i / batchSize) + 1}/${Math.ceil(simCardsData.length / batchSize)}:`, error);
                        errors.push(error);
                        // Stop processing and throw error to trigger rollback
                        throw error;
                    } else {
                        successCount += chunk.length;
                    }

                    // Calculate progress
                    const percent = Math.min(100, Math.round(((i + chunk.length) / simCardsData.length) * 100));

                    // Call the progress callback if provided
                    if (typeof progressCallback === 'function') {
                        progressCallback(percent, successCount, chunk, errors);
                    } else {
                        // Otherwise just log the progress
                        console.log(`Progress: ${percent}%, Uploaded: ${successCount}/${simCardsData.length}`);
                    }
                }

                const result = {
                    success: successCount,
                    failed: 0,
                    errors: []
                };

                return makeResponse({
                    ok: true,
                    data: result,
                    message: `Successfully uploaded ${successCount} SIM cards`
                });
            } catch (error) {
                console.error('Transaction failed:', error);

                // If there was an error, we need to clean up any records that were inserted
                if (successCount > 0) {
                    try {
                        // Get the batch_id from the first record to identify all records in this batch
                        const batchId = simCardsData[0].batch_id;
                        if (batchId) {
                            // Delete all records with this batch_id
                            await supabaseAdmin.from('sim_cards').delete().eq('batch_id', batchId);
                            console.log(`Rolled back ${successCount} records for batch ${batchId}`);
                        }
                    } catch (cleanupError) {
                        console.error('Error during rollback:', cleanupError);
                        errors.push(cleanupError);
                    }
                }

                return makeResponse({
                    ok: false,
                    data: {
                        success: 0,
                        failed: simCardsData.length,
                        errors: errors.length > 0 ? errors : [error]
                    },
                    error: (error as Error).message
                });
            }
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    static async builder(target: string, data: any) {
        try {
            const action = (SimActions as any)[target];
            if (typeof action === 'function') {
                return await action(data);
            } else {
                throw new Error(`Action '${target}' is not a function`);
            }
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }


    // Get SIM card by ID
    static async byId(data: { id: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {data: simCard, error} = await supabaseAdmin
                .from('sim_cards')
                .select('*')
                .eq('id', data.id)
                .eq('admin_id', await admin_id(user))
                .single();

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, data: simCard});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Get multiple SIM cards with filters and pagination
    static async list(data: {
        page?: number;
        limit?: number;
        team_id?: string;
        status?: string;
        batch_id?: string;
        lot?: string;
        search?: string;
        sold_by_user_id?: string;
        assigned_to_user_id?: string;
    }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {
                page = 1,
                limit = 50,
                team_id,
                status,
                batch_id,
                lot,
                search,
                sold_by_user_id,
                assigned_to_user_id
            } = data;
            const offset = (page - 1) * limit;

            let query = supabaseAdmin
                .from('sim_cards')
                .select('*', {count: 'exact'})
                .eq('admin_id', await admin_id(user));

            // Apply filters
            if (team_id) query = query.eq('team_id', team_id);
            if (status) query = query.eq('status', status);
            if (batch_id) query = query.eq('batch_id', batch_id);
            if (lot) query = query.eq('lot', lot);
            if (sold_by_user_id) query = query.eq('sold_by_user_id', sold_by_user_id);
            if (assigned_to_user_id) query = query.eq('assigned_to_user_id', assigned_to_user_id);

            // Apply search
            if (search) {
                query = query.or(`serial_number.ilike.%${search}%,customer_msisdn.ilike.%${search}%,agent_msisdn.ilike.%${search}%,customer_id_number.ilike.%${search}%`);
            }

            // Apply pagination
            query = query.range(offset, offset + limit - 1).order('created_at', {ascending: false});

            const {data: simCards, error, count} = await query;

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({
                ok: true,
                data: {
                    items: simCards,
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            });
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Create single SIM card
    static async create(data: SIMCardCreate) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const simCardData = {
                ...data,
                admin_id: await admin_id(user),
                sold_by_user_id: data.sold_by_user_id === '' ? null : data.sold_by_user_id,
                //@ts-ignore
                assigned_to_user_id: data.assigned_to_user_id === '' ? null : data.assigned_to_user_id
            };

            const {data: simCard, error} = await supabaseAdmin
                .from('sim_cards')
                .insert(simCardData)
                .select()
                .single();

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, data: simCard, message: "SIM card created successfully"});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Update SIM card
    static async update(data: { id: string; updates: Partial<SIMCard> }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {id, updates} = data;

            // Clean up empty strings
            const cleanUpdates = {...updates};
            //@ts-ignore
            if (cleanUpdates.sold_by_user_id === '') cleanUpdates.sold_by_user_id = null;
            //@ts-ignore
            if (cleanUpdates.assigned_to_user_id === '') cleanUpdates.assigned_to_user_id = null;

            const {data: simCard, error} = await supabaseAdmin
                .from('sim_cards')
                .update(cleanUpdates)
                .eq('id', id)
                .eq('admin_id', await admin_id(user))
                .select()
                .single();

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, data: simCard, message: "SIM card updated successfully"});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Delete SIM card
    static async delete(data: { id: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {error} = await supabaseAdmin
                .from('sim_cards')
                .delete()
                .eq('id', data.id)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: "SIM card deleted successfully"});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Bulk delete SIM cards
    static async bulk_delete(data: { ids: string[] }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {error} = await supabaseAdmin
                .from('sim_cards')
                .delete()
                .in('id', data.ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: `${data.ids.length} SIM cards deleted successfully`});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Assign SIM cards to user
    static async assign_to_user(data: { sim_ids: string[]; user_id: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {error} = await supabaseAdmin
                .from('sim_cards')
                .update({
                    assigned_to_user_id: data.user_id,
                    assigned_on: new Date().toISOString()
                })
                .in('id', data.sim_ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: `${data.sim_ids.length} SIM cards assigned successfully`});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Unassign SIM cards
    static async unassign_from_user(data: { sim_ids: string[] }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {error} = await supabaseAdmin
                .from('sim_cards')
                .update({
                    assigned_to_user_id: null,
                    assigned_on: null
                })
                .in('id', data.sim_ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: `${data.sim_ids.length} SIM cards unassigned successfully`});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Update SIM status
    static async update_status(data: { sim_ids: string[]; status: SIMStatus }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {error} = await supabaseAdmin
                .from('sim_cards')
                .update({status: data.status})
                .in('id', data.sim_ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: `${data.sim_ids.length} SIM cards status updated successfully`});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Get SIM cards by batch
    static async byBatch(data: { args: any }) {


        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const [_batch_id, _page, _limit] = data.args;
            const page = _page ?? 1,
                batch_id = _batch_id ?? '', limit = _limit ?? 100;
            const offset = (page - 1) * limit;

            const {data: simCards, error, count} = await supabaseAdmin
                .from('sim_cards')
                .select('*', {count: 'exact'})
                .eq('batch_id', batch_id)
                .eq('admin_id', await admin_id(user))
                .range(offset, offset + limit - 1)
                .order('created_at', {ascending: false});

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({
                ok: true,
                data: {
                    items: simCards,
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            });
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Get SIM cards by lot
    static async byLot(data: { lot: string; page?: number; limit?: number }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {lot, page = 1, limit = 100} = data;
            const offset = (page - 1) * limit;

            const {data: simCards, error, count} = await supabaseAdmin
                .from('sim_cards')
                .select('*', {count: 'exact'})
                .eq('lot', lot)
                .eq('admin_id', await admin_id(user))
                .range(offset, offset + limit - 1)
                .order('created_at', {ascending: false});

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({
                ok: true,
                data: {
                    items: simCards,
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            });
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Get SIM cards by team
    static async by_team(data: { team_id: string; page?: number; limit?: number }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {team_id, page = 1, limit = 100} = data;
            const offset = (page - 1) * limit;

            const {data: simCards, error, count} = await supabaseAdmin
                .from('sim_cards')
                .select('*', {count: 'exact'})
                .eq('team_id', team_id)
                .eq('admin_id', await admin_id(user))
                .range(offset, offset + limit - 1)
                .order('created_at', {ascending: false});

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({
                ok: true,
                data: {
                    items: simCards,
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            });
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Get SIM cards by user (sold by or assigned to)
    static async by_user(data: { user_id: string; type: 'sold' | 'assigned'; page?: number; limit?: number }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {user_id, type, page = 1, limit = 100} = data;
            const offset = (page - 1) * limit;

            const column = type === 'sold' ? 'sold_by_user_id' : 'assigned_to_user_id';

            const {data: simCards, error, count} = await supabaseAdmin
                .from('sim_cards')
                .select('*', {count: 'exact'})
                .eq(column, user_id)
                .eq('admin_id', await admin_id(user))
                .range(offset, offset + limit - 1)
                .order('created_at', {ascending: false});

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({
                ok: true,
                data: {
                    items: simCards,
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            });
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Get SIM statistics
    static async statistics(data: { team_id?: string; user_id?: string; batch_id?: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            let query = supabaseAdmin
                .from('sim_cards')
                .select('status, match, quality, activation_date')
                .eq('admin_id', await admin_id(user));

            // Apply filters
            if (data.team_id) query = query.eq('team_id', data.team_id);
            if (data.user_id) query = query.eq('sold_by_user_id', data.user_id);
            if (data.batch_id) query = query.eq('batch_id', data.batch_id);

            const {data: simCards, error} = await query;

            if (error) {
                return makeResponse({error: error.message});
            }

            const stats = {
                total: simCards.length,
                activated: simCards.filter(s => s.status === 'ACTIVATED').length,
                pending: simCards.filter(s => s.status === 'PENDING').length,
                inactive: simCards.filter(s => s.status === 'INACTIVE').length,
                matched: simCards.filter(s => s.match === 'MATCHED').length,
                quality: simCards.filter(s => s.quality === 'QUALITY').length,
                activatedThisMonth: simCards.filter(s => {
                    if (!s.activation_date) return false;
                    const activationDate = new Date(s.activation_date);
                    const now = new Date();
                    return activationDate.getMonth() === now.getMonth() &&
                        activationDate.getFullYear() === now.getFullYear();
                }).length
            };

            // Calculate rates
            const rates = {
                activationRate: stats.total > 0 ? (stats.activated / stats.total) * 100 : 0,
                matchRate: stats.total > 0 ? (stats.matched / stats.total) * 100 : 0,
                qualityRate: stats.matched > 0 ? (stats.quality / stats.matched) * 100 : 0
            };

            return makeResponse({
                ok: true,
                data: {...stats, ...rates}
            });
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // ...existing methods

// Get SIM statistics by lot
    static async lotStatistics(data: { args: any }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }
            const [lot] = data.args

            const {data: sims, error} = await supabaseAdmin
                .from('sim_cards')
                .select('status, assigned_to_user_id,activation_date, registered_on')
                .eq('lot', lot)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            const stats = {
                total: sims.length,
                assigned_sims: sims.filter(s => s.assigned_to_user_id).length,
                sold_sims: sims.filter(s => s.registered_on).length,
                activated_sims: sims.filter(s => s.activation_date && s.status === 'ACTIVATED').length
            };

            return makeResponse({ok: true, data: stats});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

// Get lot details with batch info
    static async lotDetails(data: { args: any }) {
        try {
            console.log(data)
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }
            const [lot] = data.args

            // Get batch info for this lot
            const {data: batch, error: batchError} = await supabaseAdmin
                .from('batch_metadata')
                .select('id, batch_id, lot_numbers')
                .contains('lot_numbers', [lot])
                // .eq('admin_id', await admin_id(user))
                .single();

            if (batchError) {
                return makeResponse({error: batchError.message});
            }

            // Get SIM statistics
            const lotStats = await this.lotStatistics(data);
            if (!lotStats.ok) {
                return lotStats;
            }

            const position_in_batch = batch.lot_numbers.indexOf(lot) + 1;

            const lotDetails = {
                lot_number: lot,
                quantity: 50, // Default or get from somewhere
                batch_id: batch.batch_id,
                position_in_batch,
                status: "DISTRIBUTED", // Determine based on logic
                ...lotStats.data
            };

            return makeResponse({ok: true, data: lotDetails});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }
}

export default SimActions;
