import {makeResponse} from "@/helper";
import {supabaseAdmin} from "@/lib/supabase/server";
import Accounts from "@/lib/accounts";
import {admin_id} from "@/services/helper";
import {BatchMetadata, BatchMetadataCreate} from "@/models";

class BatchActions {
    // Get batch by ID
    static async byId(data: { id: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { data: batch, error } = await supabaseAdmin
                .from('batch_metadata')
                .select(`
                    *,
                    created_by:users!created_by_user_id(id, full_name, email),
                    team:teams!team_id(id, name, region),
                    sim_count:sim_cards!batch_id(count)
                `)
                .eq('id', data.id)
                .eq('admin_id', await admin_id(user))
                .single();

            if (error) {
                return makeResponse({ error: error.message });
            }

            return makeResponse({ ok: true, data: batch });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }
    static async byBatchId(data: { args:any[]}) {
       const [id] = data.args;
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { data: batch, error } = await supabaseAdmin
                .from('batch_metadata')
                .select(`
                    *,
                    created_by:users!created_by_user_id(id, full_name, email),
                    team:teams!team_id(id, name, region),
                    sim_count:sim_cards!batch_id(count)
                `)
                .eq('batch_id', id)
                .single();

            if (error) {
                return makeResponse({ error: error.message });
            }

            return makeResponse({ ok: true, data: batch });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Get multiple batches with filters and pagination
    static async list(data: {
        page?: number;
        limit?: number;
        team_id?: string;
        teams?: string[];
        company_name?: string;
        collection_point?: string;
        search?: string;
        date_from?: string;
        date_to?: string;
        created_by_user_id?: string;
    }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const {
                page = 1,
                limit = 50,
                team_id,
                teams,
                company_name,
                collection_point,
                search,
                date_from,
                date_to,
                created_by_user_id
            } = data;
            const offset = (page - 1) * limit;

            let query = supabaseAdmin
                .from('batch_metadata')
                .select(`
                    *,
                    created_by:users!created_by_user_id(id, full_name, email),
                    team:teams!team_id(id, name, region),
                    sim_count:sim_cards!batch_id(count)
                `, { count: 'exact' })
                .eq('admin_id', await admin_id(user));

            // Apply filters
            if (team_id) query = query.eq('team_id', team_id);
            if (teams && teams.length > 0) query = query.in('team_id', teams);
            if (company_name) query = query.eq('company_name', company_name);
            if (collection_point) query = query.eq('collection_point', collection_point);
            if (created_by_user_id) query = query.eq('created_by_user_id', created_by_user_id);

            // Date range filtering
            if (date_from) query = query.gte('date_created', date_from);
            if (date_to) query = query.lte('date_created', date_to);

            // Apply search
            if (search) {
                query = query.or(`batch_id.ilike.%${search}%,order_number.ilike.%${search}%,requisition_number.ilike.%${search}%,move_order_number.ilike.%${search}%,item_description.ilike.%${search}%`);
            }

            // Apply pagination and ordering
            query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

            const { data: batches, error, count } = await query;

            if (error) {
                return makeResponse({ error: error.message });
            }

            return makeResponse({
                ok: true,
                data: {
                    items: batches,
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Create new batch
    static async create(data: BatchMetadataCreate) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const batchData = {
                ...data,
                admin_id: await admin_id(user),
                created_by_user_id: user.id,
                team_id: data.team_id === '' ? null : data.team_id,
                created_at: new Date().toISOString(),
                // Ensure lot_numbers is properly formatted as JSON array
                lot_numbers: data.lot_numbers || []
            };

            const { data: batch, error } = await supabaseAdmin
                .from('batch_metadata')
                .insert(batchData)
                .select(`
                    *,
                    created_by:users!created_by_user_id(id, full_name, email),
                    team:teams!team_id(id, name, region)
                `)
                .single();

            if (error) {
                return makeResponse({ error: error.message });
            }

            return makeResponse({ ok: true, data: batch, message: "Batch created successfully" });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Update batch
    static async update(data: { id: string; updates: Partial<BatchMetadata> }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { id, updates } = data;

            // Clean up empty strings
            const cleanUpdates = { ...updates };
            if (cleanUpdates.team_id === '') { // @ts-ignore
                cleanUpdates.team_id = null;
            }
            if (cleanUpdates.order_number === '') { // @ts-ignore
                cleanUpdates.order_number = null;
            }
            if (cleanUpdates.requisition_number === '') { // @ts-ignore
                cleanUpdates.requisition_number = null;
            }
            if (cleanUpdates.move_order_number === '') { // @ts-ignore
                cleanUpdates.move_order_number = null;
            }
            if (cleanUpdates.company_name === '') { // @ts-ignore
                cleanUpdates.company_name = null;
            }
            if (cleanUpdates.collection_point === '') { // @ts-ignore
                cleanUpdates.collection_point = null;
            }
            if (cleanUpdates.item_description === '') { // @ts-ignore
                cleanUpdates.item_description = null;
            }

            // Remove fields that shouldn't be updated directly
            // delete cleanUpdates.admin_id;
            delete cleanUpdates.created_at;
            delete cleanUpdates.created_by_user_id;

            const { data: batch, error } = await supabaseAdmin
                .from('batch_metadata')
                .update(cleanUpdates)
                .eq('id', id)
                .eq('admin_id', await admin_id(user))
                .select(`
                    *,
                    created_by:users!created_by_user_id(id, full_name, email),
                    team:teams!team_id(id, name, region)
                `)
                .single();

            if (error) {
                return makeResponse({ error: error.message });
            }

            return makeResponse({ ok: true, data: batch, message: "Batch updated successfully" });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Delete batch
    static async delete(data: { id: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            // Check if batch has associated SIM cards
            const { data: sims, error: simsError } = await supabaseAdmin
                .from('sim_cards')
                .select('id')
                .eq('batch_id', data.id)
                .eq('admin_id', await admin_id(user));

            if (simsError) {
                return makeResponse({ error: simsError.message });
            }

            if (sims && sims.length > 0) {
                return makeResponse({
                    error: "Cannot delete batch with associated SIM cards. Please remove or reassign SIM cards first."
                });
            }

            const { error } = await supabaseAdmin
                .from('batch_metadata')
                .delete()
                .eq('id', data.id)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({ error: error.message });
            }

            return makeResponse({ ok: true, message: "Batch deleted successfully" });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Bulk delete batches
    static async bulk_delete(data: { ids: string[] }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            // Check if any batches have associated SIM cards
            const { data: sims, error: simsError } = await supabaseAdmin
                .from('sim_cards')
                .select('batch_id')
                .in('batch_id', data.ids)
                .eq('admin_id', await admin_id(user));

            if (simsError) {
                return makeResponse({ error: simsError.message });
            }

            if (sims && sims.length > 0) {
                const batchesWithSims = [...new Set(sims.map(s => s.batch_id))];
                return makeResponse({
                    error: `Cannot delete batches with associated SIM cards. Batches ${batchesWithSims.join(', ')} have SIM cards.`
                });
            }

            const { error } = await supabaseAdmin
                .from('batch_metadata')
                .delete()
                .in('id', data.ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({ error: error.message });
            }

            return makeResponse({ ok: true, message: `${data.ids.length} batches deleted successfully` });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Assign batches to team
    static async assign_to_team(data: { batch_ids: string[]; team_id: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { error } = await supabaseAdmin
                .from('batch_metadata')
                .update({ team_id: data.team_id })
                .in('id', data.batch_ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({ error: error.message });
            }

            return makeResponse({ ok: true, message: `${data.batch_ids.length} batches assigned to team successfully` });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Remove batches from team
    static async remove_from_team(data: { batch_ids: string[] }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { error } = await supabaseAdmin
                .from('batch_metadata')
                .update({ team_id: null })
                .in('id', data.batch_ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({ error: error.message });
            }

            return makeResponse({ ok: true, message: `${data.batch_ids.length} batches removed from team successfully` });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Get batches by team
    static async by_team(data: { team_id: string; page?: number; limit?: number }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { team_id, page = 1, limit = 100 } = data;
            const offset = (page - 1) * limit;

            const { data: batches, error, count } = await supabaseAdmin
                .from('batch_metadata')
                .select(`
                    *,
                    created_by:users!created_by_user_id(id, full_name, email),
                    team:teams!team_id(id, name, region),
                    sim_count:sim_cards!batch_id(count)
                `, { count: 'exact' })
                .eq('team_id', team_id)
                .eq('admin_id', await admin_id(user))
                .range(offset, offset + limit - 1)
                .order('created_at', { ascending: false });

            if (error) {
                return makeResponse({ error: error.message });
            }

            return makeResponse({
                ok: true,
                data: {
                    items: batches,
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Get batches by company
    static async by_company(data: { company_name: string; page?: number; limit?: number }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { company_name, page = 1, limit = 100 } = data;
            const offset = (page - 1) * limit;

            const { data: batches, error, count } = await supabaseAdmin
                .from('batch_metadata')
                .select(`
                    *,
                    created_by:users!created_by_user_id(id, full_name, email),
                    team:teams!team_id(id, name, region),
                    sim_count:sim_cards!batch_id(count)
                `, { count: 'exact' })
                .eq('company_name', company_name)
                .eq('admin_id', await admin_id(user))
                .range(offset, offset + limit - 1)
                .order('created_at', { ascending: false });

            if (error) {
                return makeResponse({ error: error.message });
            }

            return makeResponse({
                ok: true,
                data: {
                    items: batches,
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Get batches by date range
    static async by_date_range(data: {
        start_date: string;
        end_date: string;
        date_field?: 'created_at' | 'date_created';
        page?: number;
        limit?: number;
    }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { start_date, end_date, date_field = 'date_created', page = 1, limit = 100 } = data;
            const offset = (page - 1) * limit;

            const { data: batches, error, count } = await supabaseAdmin
                .from('batch_metadata')
                .select(`
                    *,
                    created_by:users!created_by_user_id(id, full_name, email),
                    team:teams!team_id(id, name, region),
                    sim_count:sim_cards!batch_id(count)
                `, { count: 'exact' })
                .gte(date_field, start_date)
                .lte(date_field, end_date)
                .eq('admin_id', await admin_id(user))
                .range(offset, offset + limit - 1)
                .order('created_at', { ascending: false });

            if (error) {
                return makeResponse({ error: error.message });
            }

            return makeResponse({
                ok: true,
                data: {
                    items: batches,
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Get batch statistics
    static async statistics(data: { team_id?: string; company_name?: string; date_from?: string; date_to?: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            let query = supabaseAdmin
                .from('batch_metadata')
                .select('quantity, company_name, team_id, date_created, created_at')
                .eq('admin_id', await admin_id(user));

            // Apply filters
            if (data.team_id) query = query.eq('team_id', data.team_id);
            if (data.company_name) query = query.eq('company_name', data.company_name);
            if (data.date_from) query = query.gte('date_created', data.date_from);
            if (data.date_to) query = query.lte('date_created', data.date_to);

            const { data: batches, error } = await query;

            if (error) {
                return makeResponse({ error: error.message });
            }

            const now = new Date();
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const thisYear = new Date(now.getFullYear(), 0, 1);

            const stats = {
                total: batches.length,
                total_quantity: batches.reduce((sum, b) => sum + (b.quantity || 0), 0),
                average_quantity: batches.length > 0 ? batches.reduce((sum, b) => sum + (b.quantity || 0), 0) / batches.length : 0,
                by_company: batches.reduce((acc, batch) => {
                    const company = batch.company_name || 'Unknown';
                    acc[company] = (acc[company] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
                by_team: batches.reduce((acc, batch) => {
                    const team = batch.team_id || 'Unassigned';
                    acc[team] = (acc[team] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
                this_month: batches.filter(b => {
                    const batchDate = new Date(b.date_created || b.created_at);
                    return batchDate >= thisMonth;
                }).length,
                this_year: batches.filter(b => {
                    const batchDate = new Date(b.date_created || b.created_at);
                    return batchDate >= thisYear;
                }).length,
                quantity_this_month: batches
                    .filter(b => {
                        const batchDate = new Date(b.date_created || b.created_at);
                        return batchDate >= thisMonth;
                    })
                    .reduce((sum, b) => sum + (b.quantity || 0), 0),
                quantity_this_year: batches
                    .filter(b => {
                        const batchDate = new Date(b.date_created || b.created_at);
                        return batchDate >= thisYear;
                    })
                    .reduce((sum, b) => sum + (b.quantity || 0), 0)
            };

            return makeResponse({ ok: true, data: stats });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Check if batch ID exists
    static async check_batch_id_exists(data: { batch_id: string; exclude_id?: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            let query = supabaseAdmin
                .from('batch_metadata')
                .select('id')
                .eq('batch_id', data.batch_id)
                .eq('admin_id', await admin_id(user));

            if (data.exclude_id) {
                query = query.neq('id', data.exclude_id);
            }

            const { data: existing, error } = await query;

            if (error) {
                return makeResponse({ error: error.message });
            }

            return makeResponse({
                ok: true,
                data: {
                    exists: existing && existing.length > 0
                }
            });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Get available companies
    static async get_companies() {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { data: batches, error } = await supabaseAdmin
                .from('batch_metadata')
                .select('company_name')
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({ error: error.message });
            }

            const companies = [...new Set(batches.map(b => b.company_name))].filter(Boolean).sort();

            return makeResponse({ ok: true, data: companies });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Get available collection points
    static async get_collection_points() {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { data: batches, error } = await supabaseAdmin
                .from('batch_metadata')
                .select('collection_point')
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({ error: error.message });
            }

            const collectionPoints = [...new Set(batches.map(b => b.collection_point))].filter(Boolean).sort();

            return makeResponse({ ok: true, data: collectionPoints });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Get batch utilization (how many SIMs used vs total quantity)
    static async utilization(data: { batch_id?: string; team_id?: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            let batchQuery = supabaseAdmin
                .from('batch_metadata')
                .select('id, batch_id, quantity')
                .eq('admin_id', await admin_id(user));

            if (data.batch_id) batchQuery = batchQuery.eq('id', data.batch_id);
            if (data.team_id) batchQuery = batchQuery.eq('team_id', data.team_id);

            const { data: batches, error: batchError } = await batchQuery;

            if (batchError) {
                return makeResponse({ error: batchError.message });
            }

            const utilization = [];

            for (const batch of batches) {
                // Get SIM count for this batch
                const { data: sims, error: simError } = await supabaseAdmin
                    .from('sim_cards')
                    .select('id')
                    .eq('batch_id', batch.batch_id)
                    .eq('admin_id', await admin_id(user));

                if (simError) {
                    return makeResponse({ error: simError.message });
                }

                const used = sims?.length || 0;
                const total = batch.quantity || 0;
                const utilizationRate = total > 0 ? (used / total) * 100 : 0;

                utilization.push({
                    batch_id: batch.batch_id,
                    total_quantity: total,
                    used_quantity: used,
                    remaining_quantity: total - used,
                    utilization_rate: utilizationRate
                });
            }

            return makeResponse({ ok: true, data: utilization });
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Router method
    static async builder(target: string, data: any) {
        try {
            const action = (BatchActions as any)[target];
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

export default BatchActions;