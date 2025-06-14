import {SIMCardCreate, SIMCardUpdate, SIMStatus} from "@/models";
import {createSupabaseClient} from "@/lib/supabase/client";

export const simCardService = {
    // Search SIM cards with various filters
    async searchSimCards({
                             searchTerm,
                             status,
                             teamId,
                             fromDate,
                             toDate,
                             includeInTransit = false,
                             page = 1,
                             pageSize = 20
                         }: {
        searchTerm?: string;
        status?: SIMStatus;
        teamId?: string;
        fromDate?: string;
        toDate?: string;
        includeInTransit?: boolean;
        page?: number;
        pageSize?: number;
    }) {
        const supabase = createSupabaseClient();

        // First get total count for pagination
        let query = supabase
            .from('sim_cards')

            .select('*', {count: 'exact', head: true})

        if (searchTerm) {
            query = query.ilike('serial_number', `%${searchTerm}%`);
        }
        if (status) {
            query = query.eq('status', status);
        }
        if (teamId) {
            query = query.eq('team_id', teamId);
        }
        if (fromDate) {
            query = query.gte('created_at', new Date(fromDate).toISOString());
        }
        if (toDate) {
            query = query.lte('created_at', new Date(toDate).toISOString());
        }
        // By default, exclude SIM cards that are in transit
        if (!includeInTransit) {
            query = query.or('in_transit.is.null,in_transit.eq.false');
        }

        const {count, error: countError} = await query;


        // Then get paginated data
        const {data, error} = await supabase
            .rpc('search_sim_cards', {
                search_term: searchTerm || null,
                status_filter: status || null,
                team_id_param: teamId || null,
                from_date: fromDate ? new Date(fromDate).toISOString() : null,
                to_date: toDate ? new Date(toDate).toISOString() : null,
                include_in_transit: includeInTransit || false
            })
            .range((page - 1) * pageSize, page * pageSize - 1);
        return {
            data,
            count,
            page,
            pageSize,
            error: error || countError
        };
    },
    async searchSimCards1({
                              searchTerm,
                              status,
                              teamId,
                              fromDate,
                              toDate,
                              includeInTransit = false,
                              page = 1,
                              pageSize = 20
                          }: {
        searchTerm?: string;
        status?: SIMStatus;
        teamId?: string;
        fromDate?: string;
        toDate?: string;
        includeInTransit?: boolean;
        page?: number;
        pageSize?: number;
    }) {
        const supabase = createSupabaseClient();

        // First get total count for pagination
        let query = supabase
            .from('sim_cards')
            .select('*')
            .gte('created_at', fromDate || '')
            .lte('created_at', toDate || '');

        // By default, exclude SIM cards that are in transit
        if (!includeInTransit) {
            query = query.or('in_transit.is.null,in_transit.eq.false');
        }

        const {data, error: countError} = await query;
        return {
            data,
            count: (data || []).length,
            page,
            pageSize,
            error: countError
        };
    },

    // Get a single SIM card by ID
    async getSimCardById(simCardId: string) {
        const supabase = createSupabaseClient();
        return supabase
            .from('sim_cards')
            .select(`
        *,
        users:sold_by_user_id(full_name),
        teams:team_id(name)
      `)
            .eq('id', simCardId)
            .single();
    },

    // Get SIM card by serial number
    async getSimCardBySerial(serialNumber: string) {
        const supabase = createSupabaseClient();
        return supabase
            .from('sim_cards')
            .select(`
        *,
        users:sold_by_user_id(full_name),
        teams:team_id(name)
      `)
            .eq('serial_number', serialNumber)
            .single();
    },

    // Create a new SIM card record
    async createSimCard(simCardData: SIMCardCreate) {
        const supabase = createSupabaseClient();
        return supabase
            .from('sim_cards')
            .insert(simCardData)
            .select()
            .single();
    },

    // Update SIM card information
    async updateSimCard(simCardId: string, simCardData: SIMCardUpdate) {
        const supabase = createSupabaseClient();
        return supabase
            .from('sim_cards')
            .update(simCardData)
            .eq('id', simCardId)
            .select()
            .single();
    },


    // Bulk import SIM cards (useful for offline sync)
    async bulkImportSimCards(simCards: SIMCardCreate[]) {
        const supabase = createSupabaseClient();
        return supabase
            .from('sim_cards')
            .insert(simCards);
    },

    // Get SIM cards sold by a specific staff member
    async getSimCardsByStaff(staffId: string) {
        const supabase = createSupabaseClient();
        return supabase
            .from('sim_cards')
            .select('*')
            .eq('sold_by_user_id', staffId)
            .order('sale_date', {ascending: false});
    }
};
