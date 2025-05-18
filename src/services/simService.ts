import {SIMCard, SIMCardCreate, SIMCardUpdate, SIMStatus, User, UserRole} from "@/models";
import {createSupabaseClient} from "@/lib/supabase/client";

export const simCardService = {
    getAllSimCards: async (user: User) => {
        const supabase = createSupabaseClient();
        if (user.role === 'admin') {
            return supabase
                .from('sim_cards')
                .select('*, sold_by_user_id(*),team_id(*,leader_id(full_name))')
                .order('sale_date', {ascending: false});
        }

        if (user.role === UserRole.STAFF) {
            return supabase
                .from('sim_cards')
                .select('*,team_id(*,leader_id(full_name)), sold_by_user_id(*,full_name)')
                .eq('sold_by_user_id', user.id)
                .order('sale_date', {ascending: false});
        }
        if (user.role === UserRole.TEAM_LEADER) {
            return supabase
                .from('sim_cards')
                .select('*, sold_by_user_id(*),team_id(*,leader_id(full_name))')
                .or(`team_id.eq.${user.team_id},sold_by_user_id.team_id.eq.${user.team_id}`)
                .order('sale_date', {ascending: false});
        }

        return {data: null, error: "Invalid user role"}
    },
    // Create a new SIM card record
    createSIMCard: async (simCardData: SIMCardCreate): Promise<SIMCard | null> => {
        const supabase = createSupabaseClient();
        if (simCardData.sold_by_user_id === '') {
            simCardData.sold_by_user_id = null;
        }
        console.log("card data", simCardData)

        const {data, error} = await supabase
            .from('sim_cards')
            .insert(simCardData)
            .select()
            .single();

        if (error) {
            console.error('Error creating SIM card:', error);
            return null;
        }

        return data as SIMCard;
    },

    // Update an existing SIM card
    updateSIMCard: async (id: string, updateData: SIMCardUpdate) => {
        const supabase = createSupabaseClient();

        return supabase
            .from('sim_cards')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
    },

    // Get a single SIM card by ID
    getSIMCardById: async (id: string): Promise<SIMCard | null> => {
        const supabase = createSupabaseClient();

        const {data, error} = await supabase
            .from('sim_cards')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching SIM card:', error);
            return null;
        }

        return data as SIMCard;
    },

    // Get SIM card by serial number
    getSIMCardBySerialNumber: async (serialNumber: string): Promise<SIMCard | null> => {
        const supabase = createSupabaseClient();

        const {data, error} = await supabase
            .from('sim_cards')
            .select('*')
            .eq('serial_number', serialNumber)
            .single();

        if (error) {
            // console.error('Error fetching SIM card by serial number:', error);
            return null;
        }

        return data as SIMCard;
    },

    // Get all SIM cards sold by a specific user
    getSIMCardsByUserId: async (userId: string): Promise<SIMCard[]> => {
        const supabase = createSupabaseClient();

        const {data, error} = await supabase
            .from('sim_cards')
            .select('*')
            .eq('sold_by_user_id', userId)
            .order('sale_date', {ascending: false});

        if (error) {
            console.error('Error fetching SIM cards by user ID:', error);
            return [];
        }

        return data as SIMCard[];
    },

    // Get SIM cards by team ID
    getSIMCardsByTeamId: async (teamId: string): Promise<SIMCard[]> => {
        const supabase = createSupabaseClient();

        const {data, error} = await supabase
            .from('sim_cards')
            .select('*')
            .eq('team_id', teamId)
            .order('sale_date', {ascending: false});

        if (error) {
            console.error('Error fetching SIM cards by team ID:', error);
            return [];
        }

        return data as SIMCard[];
    },

    // Get performance metrics for a staff member
    getStaffPerformanceMetrics: async (userId: string, startDate?: string, endDate?: string): Promise<{
        totalSims: number;
        matchedSims: number;
        qualitySims: number;
        performancePercentage: number;
    }> => {
        const supabase = createSupabaseClient();

        let query = supabase
            .from('sim_cards')
            .select('*')
            .eq('sold_by_user_id', userId);

        // Add date filters if provided
        if (startDate) {
            query = query.gte('sale_date', startDate);
        }

        if (endDate) {
            query = query.lte('sale_date', endDate);
        }

        const {data, error} = await query;

        if (error) {
            console.error('Error fetching performance metrics:', error);
            return {
                totalSims: 0,
                matchedSims: 0,
                qualitySims: 0,
                performancePercentage: 0
            };
        }

        const simCards = data as SIMCard[];
        const totalSims = simCards.length;
        const activatedSims = simCards.filter(sim => sim.match == SIMStatus.MATCH).length;

        // A SIM is considered "Quality" when it's activated, has a top-up of at least 50, and no fraud flags
        const qualitySims = simCards.filter(sim =>
            sim.quality == SIMStatus.QUALITY
        ).length;

        // Calculate performance percentage, handle division by zero
        const performancePercentage = activatedSims > 0
            ? (qualitySims / activatedSims) * 100
            : 0;

        return {
            totalSims,
            matchedSims: activatedSims,
            qualitySims,
            performancePercentage
        };
    },

    // Get performance metrics for a team
    getTeamPerformanceMetrics: async (teamId: string, startDate?: string, endDate?: string): Promise<{
        totalSims: number;
        matchedSims: number;
        qualitySims: number;
        performancePercentage: number;
    }> => {
        const supabase = createSupabaseClient();

        let query = supabase
            .from('sim_cards')
            .select('*')
            .eq('team_id', teamId);

        // Add date filters if provided
        if (startDate) {
            query = query.gte('sale_date', startDate);
        }

        if (endDate) {
            query = query.lte('sale_date', endDate);
        }

        const {data, error} = await query;

        if (error) {
            console.error('Error fetching team performance metrics:', error);
            return {
                totalSims: 0,
                matchedSims: 0,
                qualitySims: 0,
                performancePercentage: 0
            };
        }

        const simCards = data as SIMCard[];
        const totalSims = simCards.length;
        const activatedSims = simCards.filter(sim => sim.match == SIMStatus.MATCH).length;

        // A SIM is considered "Quality" when it's activated, has a top-up of at least 50, and no fraud flags
        const qualitySims = simCards.filter(sim =>
            sim.quality == SIMStatus.QUALITY
        ).length;

        // Calculate performance percentage, handle division by zero
        const performancePercentage = activatedSims > 0
            ? (qualitySims / activatedSims) * 100
            : 0;

        return {
            totalSims,
            matchedSims: activatedSims,
            qualitySims,
            performancePercentage
        };
    },

    // Get daily performance data for charts (last 30 days by default)
    getDailyPerformanceData: async (userId: string, days: number = 30): Promise<{
        date: string;
        sales: number;
        activations: number;
        quality: number;
    }[]> => {
        const supabase = createSupabaseClient();

        // Calculate the start date (n days ago)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];

        const {data, error} = await supabase
            .from('sim_cards')
            .select('*')
            .eq('sold_by_user_id', userId)
            .gte('created_at', startDateStr)
            .order('created_at', {ascending: true});

        if (error) {
            console.error('Error fetching daily performance data:', error);
            return [];
        }

        const simCards = data as SIMCard[];

        // Group data by date
        const groupedByDate: { [key: string]: SIMCard[] } = {};

        // Initialize all dates in the range
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - 1) + i);
            const dateStr = date.toISOString().split('T')[0];
            groupedByDate[dateStr] = [];
        }

        // Fill in actual data
        simCards.forEach(sim => {
            const saleDate = sim.created_at.split('T')[0];
            if (groupedByDate[saleDate]) {
                groupedByDate[saleDate].push(sim);
            }
        });

        // Format data for the chart
        return Object.keys(groupedByDate).map(date => {
            const simsForDate = groupedByDate[date];
            const sales = simsForDate.length;
            const activations = simsForDate.filter(sim => sim.match == SIMStatus.MATCH).length;
            const quality = simsForDate.filter(sim =>
                sim.quality == SIMStatus.QUALITY
            ).length;

            return {
                date: date,
                sales,
                activations,
                quality
            };
        });
    },

    // Flag a SIM card for fraud
    flagSIMCardForFraud: async (id: string, reason: string): Promise<boolean> => {
        const supabase = createSupabaseClient();

        const {error} = await supabase
            .from('sim_cards')
            .update({
                fraud_flag: true,
                fraud_reason: reason
            })
            .eq('id', id);

        if (error) {
            console.error('Error flagging SIM card for fraud:', error);
            return false;
        }

        return true;
    },

    // Search SIM cards by various criteria
    searchSIMCards: async (criteria: {
        serialNumber?: string;
        customerMsisdn?: string;
        customerIdNumber?: string;
        agentMsisdn?: string;
        status?: SIMStatus;
        region?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<SIMCard[]> => {
        const supabase = createSupabaseClient();

        let query = supabase.from('sim_cards').select('*');

        if (criteria.serialNumber) {
            query = query.ilike('serial_number', `%${criteria.serialNumber}%`);
        }

        if (criteria.customerMsisdn) {
            query = query.eq('customer_msisdn', criteria.customerMsisdn);
        }

        if (criteria.customerIdNumber) {
            query = query.eq('customer_id_number', criteria.customerIdNumber);
        }

        if (criteria.agentMsisdn) {
            query = query.eq('agent_msisdn', criteria.agentMsisdn);
        }

        if (criteria.status) {
            query = query.eq('status', criteria.status);
        }

        if (criteria.region) {
            query = query.eq('region', criteria.region);
        }

        if (criteria.startDate) {
            query = query.gte('sale_date', criteria.startDate);
        }

        if (criteria.endDate) {
            query = query.lte('sale_date', criteria.endDate);
        }

        const {data, error} = await query.order('sale_date', {ascending: false});

        if (error) {
            console.error('Error searching SIM cards:', error);
            return [];
        }

        return data as SIMCard[];
    },
    getSimCardsByDateRange: async (startDate: string, endDate: string) => {
        const supabase = createSupabaseClient();

        return supabase
            .from('sim_cards')
            .select('*, sold_by_user_id(*),team_id(*,leader_id(full_name))')
            .gte('sale_date', startDate)
            .lte('sale_date', endDate)
            .order('sale_date', {ascending: false});
    },
};

export default simCardService;