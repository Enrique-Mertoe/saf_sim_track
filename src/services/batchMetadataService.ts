import {BatchMetadata, BatchMetadataCreate, BatchMetadataUpdate, User, UserRole} from "@/models";
import {createSupabaseClient} from "@/lib/supabase/client";
import {applyFilters, Filter} from "@/helper";

export const batchMetadataService = {
    // Get all batch metadata
    getAllBatchMetadata: async (user: User) => {
        const supabase = createSupabaseClient();

        // Admin can see all batches
        if (user.role === 'admin') {
            return supabase
                .from('batch_metadata')
                .select('*, team_id(*), created_by_user_id(*)')
                .order('created_at', {ascending: false});
        }

        // Team leaders can see their team's batches
        if (user.role === UserRole.TEAM_LEADER) {
            return supabase
                .from('batch_metadata')
                .select('*, team_id(*), created_by_user_id(*)')
                .eq('team_id', user.team_id)
                .order('created_at', {ascending: false});
        }

        // Staff can see batches they created
        return supabase
            .from('batch_metadata')
            .select('*, team_id(*), created_by_user_id(*)')
            .eq('created_by_user_id', user.id)
            .order('created_at', {ascending: false});
    },

    // Get batch metadata by batch ID
    getBatchMetadataByBatchId: async (batchId: string) => {
        const supabase = createSupabaseClient();

        return supabase
            .from('batch_metadata')
            .select('*, team_id(*), created_by_user_id(*)')
            .eq('batch_id', batchId)
            .single();
    },

    // Get batch metadata by team ID
    getBatchMetadataByTeamId: async (teamId: string) => {
        const supabase = createSupabaseClient();

        return supabase
            .from('batch_metadata')
            .select('*, team_id(*), created_by_user_id(*)')
            .eq('team_id', teamId)
            .order('created_at', {ascending: false});
    },

    // Create new batch metadata
    createBatchMetadata: async (batchMetadata: BatchMetadataCreate) => {
        const supabase = createSupabaseClient();

        return supabase
            .from('batch_metadata')
            .insert(batchMetadata)
            .select()
            .single();
    },

    // Update batch metadata
    updateBatchMetadata: async (id: string, updates: BatchMetadataUpdate) => {
        const supabase = createSupabaseClient();

        return supabase
            .from('batch_metadata')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
    },

    // Delete batch metadata
    deleteBatchMetadata: async (id: string) => {
        const supabase = createSupabaseClient();

        return supabase
            .from('batch_metadata')
            .delete()
            .eq('id', id);
    },

    // Get SIM cards associated with a batch
    getSimCardsByBatchId: async (batchId: string) => {
        const supabase = createSupabaseClient();

        return supabase
            .from('sim_cards')
            .select('*, team_id(*), sold_by_user_id(*)')
            .eq('batch_id', batchId)
            .order('created_at', {ascending: false});
    },
    async batchInfo(batchId: string, filters: Filter[] = []) {
        return applyFilters(createSupabaseClient()
            .from('batch_metadata')
            .select('*, team_id(*), created_by_user_id(*)')
            .eq("batch_id", batchId), filters);

    },
    // Get batches with SIM card counts
    getBatchesWithCounts: async (user: User) => {
        const supabase = createSupabaseClient();

        // First get the batches based on user role
        let batchesQuery;

        if (user.role === 'admin') {
            batchesQuery = supabase
                .from('batch_metadata')
                .select('*, team_id(*), created_by_user_id(*)');
        } else if (user.role === UserRole.TEAM_LEADER
        ) {
            batchesQuery = supabase
                .from('batch_metadata')
                .select('*, team_id(*), created_by_user_id(*)')
                .eq('team_id', user.team_id);
        } else {
            batchesQuery = supabase
                .from('batch_metadata')
                .select('*, team_id(*), created_by_user_id(*)')
                .eq('created_by_user_id', user.id);
        }

        const {data: batches, error} = await batchesQuery.order('created_at', {ascending: false});

        if (error || !batches) {
            console.error('Error fetching batches:', error);
            return {data: [], error};
        }

        // For each batch, get the count of SIM cards
        const batchesWithCounts = await Promise.all(
            batches.map(async (batch: BatchMetadata) => {
                const {count, error: countError} = await supabase
                    .from('sim_cards')
                    .select('*', {count: 'exact', head: true})
                    .eq('batch_id', batch.batch_id);

                return {
                    ...batch,
                    sim_count: countError ? 0 : count
                };
            })
        );

        return {data: batchesWithCounts, error: null};
    }
};

export default batchMetadataService;