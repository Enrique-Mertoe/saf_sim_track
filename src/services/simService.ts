import {SIMCard, SIMCardCreate, SIMCardUpdate, SIMStatus, User, UserRole} from "@/models";
import {createSupabaseClient} from "@/lib/supabase/client";
import {admin_id} from "@/services/helper";
import {applyFilters, Filter} from "@/helper";

// Interface for pagination parameters
export interface PaginationParams {
    page?: number;
    pageSize?: number;
    startIndex?: number;
    endIndex?: number;
}

// Cache storage
const cache = {
    teamStats: new Map<string, { data: any, timestamp: number, filters?: string }>(),
    batchStats: new Map<string, { data: any, timestamp: number, filters?: string }>(),
    userStats: new Map<string, { data: any, timestamp: number, filters?: string }>(),
    simCardCounts: new Map<string, { data: any, timestamp: number, filters?: string }>(),

    // Method to clear all caches
    clearAll: () => {
        cache.teamStats.clear();
        cache.batchStats.clear();
        cache.userStats.clear();
        cache.simCardCounts.clear();
        console.log('All caches cleared');
    },

    // Method to clear cache for a specific user
    clearForUser: (userId: string) => {
        // Clear team stats
        for (const key of cache.teamStats.keys()) {
            if (key.includes(userId)) {
                cache.teamStats.delete(key);
            }
        }

        // Clear batch stats
        for (const key of cache.batchStats.keys()) {
            if (key.includes(userId)) {
                cache.batchStats.delete(key);
            }
        }

        // Clear user stats
        for (const key of cache.userStats.keys()) {
            if (key.includes(userId)) {
                cache.userStats.delete(key);
            }
        }

        // Clear sim card counts
        for (const key of cache.simCardCounts.keys()) {
            if (key.includes(userId)) {
                cache.simCardCounts.delete(key);
            }
        }

        console.log(`Cache cleared for user ${userId}`);
    }
};

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Helper to generate cache key
const generateCacheKey = (prefix: string, id: string, filters?: { startDate?: string, endDate?: string }) => {
    const filterString = filters ? `_${filters.startDate || ''}_${filters.endDate || ''}` : '';
    return `${prefix}_${id}${filterString}`;
};

const DB = createSupabaseClient();
export const simCardService = {
    // Export cache for external use
    cache,
    DB,
    // Get only total count of SIM cards
    getTotalCount: async (user: User, filters?: { startDate?: string, endDate?: string }) => {
        // Generate cache key
        const cacheKey = generateCacheKey('simCardTotal', user.id, filters);

        // Check cache
        const cachedData = cache.simCardCounts.get(cacheKey);
        const now = Date.now();

        if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRATION)) {
            console.log('Using cached total count');
            return cachedData.data;
        }

        const supabase = createSupabaseClient();
        const adminId = await admin_id(user);

        // Base query for total count
        let baseQuery = supabase
            .from('sim_cards')
            .select('id,registered_on', {count: 'exact', head: false})
            .eq('admin_id', adminId);

        // Apply date filters if provided
        if (filters?.startDate) {
            baseQuery = baseQuery.gte('registered_on', filters.startDate);
        }
        if (filters?.endDate) {
            baseQuery = baseQuery.lte('registered_on', filters.endDate);
        }

        // Apply role-specific filters
        if (user.role === UserRole.STAFF) {
            baseQuery = baseQuery.eq('sold_by_user_id', user.id);
        } else if (user.role === UserRole.TEAM_LEADER) {
            baseQuery = baseQuery.eq('team_id', user.team_id);
        }

        // Get total count
        const {data: all, count: totalCount, error: totalError} = await baseQuery;

        const result = {
            total: totalCount || 0,
            error: totalError || null
        };

        // Store in cache if there's no error
        if (!result.error) {
            cache.simCardCounts.set(cacheKey, {data: result, timestamp: Date.now()});
        }

        return result;
    },

    // Get only activated (matched) count of SIM cards
    getActivatedCount: async (user: User, filters?: { startDate?: string, endDate?: string }) => {
        // Generate cache key
        const cacheKey = generateCacheKey('simCardActivated', user.id, filters);

        // Check cache
        const cachedData = cache.simCardCounts.get(cacheKey);
        const now = Date.now();

        if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRATION)) {
            console.log('Using cached activated count');
            return cachedData.data;
        }

        const supabase = createSupabaseClient();
        const adminId = await admin_id(user);

        // Base query for activated count
        let baseQuery = supabase
            .from('sim_cards')
            .select('id', {count: 'exact', head: false})
            .eq('admin_id', adminId)
            .eq('status', SIMStatus.ACTIVATED);

        // Apply date filters if provided
        if (filters?.startDate) {
            baseQuery = baseQuery.gte('registered_on', filters.startDate);
        }
        if (filters?.endDate) {
            baseQuery = baseQuery.lte('registered_on', filters.endDate);
        }

        // Apply role-specific filters
        if (user.role === UserRole.STAFF) {
            baseQuery = baseQuery.eq('sold_by_user_id', user.id);
        } else if (user.role === UserRole.TEAM_LEADER) {
            baseQuery = baseQuery.eq('team_id', user.team_id);
        }

        // Get activated count
        const {count: activatedCount, error: activatedError} = await baseQuery;

        const result = {
            activated: activatedCount || 0,
            error: activatedError || null
        };

        // Store in cache if there's no error
        if (!result.error) {
            cache.simCardCounts.set(cacheKey, {data: result, timestamp: Date.now()});
        }

        return result;
    },

    // Get only unactivated (unmatched) count of SIM cards
    getUnmatchedCount: async (user: User, filters?: { startDate?: string, endDate?: string }) => {
        // Generate cache key
        const cacheKey = generateCacheKey('simCardUnactivated', user.id, filters);

        // Check cache
        const cachedData = cache.simCardCounts.get(cacheKey);
        const now = Date.now();

        if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRATION)) {
            console.log('Using cached unactivated count');
            return cachedData.data;
        }

        const supabase = createSupabaseClient();
        const adminId = await admin_id(user);

        // Base query for unactivated count
        let baseQuery = supabase
            .from('sim_cards')
            .select('id', {count: 'exact', head: false})
            .eq('admin_id', adminId)
            .eq('match', SIMStatus.UNMATCH);

        // Apply date filters if provided
        if (filters?.startDate) {
            baseQuery = baseQuery.gte('registered_on', filters.startDate);
        }
        if (filters?.endDate) {
            baseQuery = baseQuery.lte('registered_on', filters.endDate);
        }

        // Apply role-specific filters
        if (user.role === UserRole.STAFF) {
            baseQuery = baseQuery.eq('sold_by_user_id', user.id);
        } else if (user.role === UserRole.TEAM_LEADER) {
            baseQuery = baseQuery.eq('team_id', user.team_id);
        }

        // Get unactivated count
        const {count: unactivatedCount, error: unactivatedError} = await baseQuery;

        const result = {
            unactivated: unactivatedCount || 0,
            error: unactivatedError || null
        };

        // Store in cache if there's no error
        if (!result.error) {
            cache.simCardCounts.set(cacheKey, {data: result, timestamp: Date.now()});
        }

        return result;
    },

    // Get only quality count of SIM cards
    getQualityCount: async (user: User, filters?: { startDate?: string, endDate?: string }) => {
        // Generate cache key
        const cacheKey = generateCacheKey('simCardQuality', user.id, filters);

        // Check cache
        const cachedData = cache.simCardCounts.get(cacheKey);
        const now = Date.now();

        if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRATION)) {
            // console.log('Using cached quality count');
            return cachedData.data;
        }

        const supabase = createSupabaseClient();
        const adminId = await admin_id(user);

        // Base query for quality count
        let baseQuery = supabase
            .from('sim_cards')
            .select('id', {count: 'exact', head: false})
            .eq('admin_id', adminId)
            .eq('quality', SIMStatus.QUALITY);

        // Apply date filters if provided
        if (filters?.startDate) {
            baseQuery = baseQuery.gte('registered_on', filters.startDate);
        }
        if (filters?.endDate) {
            baseQuery = baseQuery.lte('registered_on', filters.endDate);
        }

        // Apply role-specific filters
        if (user.role === UserRole.STAFF) {
            baseQuery = baseQuery.eq('sold_by_user_id', user.id);
        } else if (user.role === UserRole.TEAM_LEADER) {
            baseQuery = baseQuery.eq('team_id', user.team_id);
        }

        // Get quality count
        const {count: qualityCount, error: qualityError} = await baseQuery;

        const result = {
            quality: qualityCount || 0,
            error: qualityError || null
        };

        // Store in cache if there's no error
        if (!result.error) {
            cache.simCardCounts.set(cacheKey, {data: result, timestamp: Date.now()});
        }

        return result;
    },
    // Get team-level statistics without fetching all SIM cards
    getTeamStats: async (user: User, filters?: { startDate?: string, endDate?: string }) => {
        // Generate cache key
        const cacheKey = generateCacheKey('teamStats', user.id, filters);

        // Check cache
        const cachedData = cache.teamStats.get(cacheKey);
        const now = Date.now();

        if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRATION)) {
            console.log('Using cached team stats');
            return {data: cachedData.data, error: null};
        }
        const supabase = createSupabaseClient();
        const adminId = await admin_id(user);

        // Base query to get teams with their SIM card counts
        let query = supabase
            .from('teams')
            .select(`
                id, 
                name,
                leader_id (full_name),
                sim_cards!team_id (
                    id,
                    match,
                    quality
                )
            `)
            .eq('admin_id', adminId);

        // Apply role-specific filters
        if (user.role === UserRole.TEAM_LEADER) {
            query = query.eq('id', user.team_id);
        }

        const {data, error} = await query;

        if (error) {
            console.error('Error fetching team stats:', error);
            return {data: null, error};
        }

        // Process the data to calculate statistics for each team
        const teamStats = data.map(team => {
            const simCards = team.sim_cards || [];

            // console.log("team cards", simCards)

            // Apply date filters if provided
            let filteredCards = simCards;
            if (filters?.startDate || filters?.endDate) {
                filteredCards = simCards.filter(card => {
                    //@ts-ignore
                    const cardDate = new Date(card.registered_on || card.created_at);
                    const startDate = filters?.startDate ? new Date(filters.startDate) : null;
                    const endDate = filters?.endDate ? new Date(filters.endDate) : null;

                    if (startDate && endDate) {
                        return cardDate >= startDate && cardDate <= endDate;
                    } else if (startDate) {
                        return cardDate >= startDate;
                    } else if (endDate) {
                        return cardDate <= endDate;
                    }
                    return true;
                });
            }

            const total = filteredCards.length;
            const matched = filteredCards.filter(card => card.match === SIMStatus.MATCH).length;
            const unmatched = filteredCards.filter(card => card.match === SIMStatus.UNMATCH).length;
            const quality = filteredCards.filter(card => card.quality === SIMStatus.QUALITY).length;

            return {
                id: team.id,
                name: team.name,
                leader: team.leader_id,
                stats: {
                    total,
                    matched,
                    unmatched,
                    quality
                }
            };
        });

        // Store in cache
        cache.teamStats.set(cacheKey, {data: teamStats, timestamp: Date.now()});

        return {data: teamStats, error: null};
    },

    // Get batch-level statistics for a specific team
    getBatchStatsForTeam: async (teamId: string, user: User, filters?: {
        startDate?: string,
        endDate?: string
    }, load_stats = true) => {
        // Generate cache key
        const cacheKey = generateCacheKey('batchStats', `${user.id}_${teamId}`, filters);

        // Check cache
        const cachedData = cache.batchStats.get(cacheKey);
        const now = Date.now();

        if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRATION)) {
            console.log('Using cached batch stats');
            return {data: cachedData.data, error: null};
        }

        const supabase = createSupabaseClient();
        const adminId = await admin_id(user);

        // First, get all unique batch IDs for this team
        let batchQuery = supabase
            .from('sim_cards')
            .select('batch_id', {count: 'exact'})
            .eq('team_id', teamId)
            .eq('admin_id', adminId)
            .not('batch_id', 'is', null);

        // Apply date filters if provided
        if (filters?.startDate) {
            batchQuery = batchQuery.gte('registered_on', filters.startDate);
        }
        if (filters?.endDate) {
            batchQuery = batchQuery.lte('registered_on', filters.endDate);
        }

        const {data: batchData, error: batchError} = await batchQuery;

        if (batchError) {
            console.error('Error fetching batch IDs:', batchError);
            return {data: null, error: batchError};
        }

        // Extract unique batch IDs
        const uniqueBatchIds = [...new Set(batchData.map(item => item.batch_id))];

        // Now get statistics for each batch
        const batchStats = await Promise.all(
            uniqueBatchIds.map(async (batchId) => {
                const baseQuery = () => {
                    let cardQuery = supabase
                        .from('sim_cards')
                        .select('id, match, quality', {count: 'exact'})
                        .eq('team_id', teamId)
                        .eq('batch_id', batchId)
                        .eq('admin_id', adminId);

                    // Apply date filters if provided
                    if (filters?.startDate) {
                        cardQuery = cardQuery.gte('registered_on', filters.startDate);
                    }
                    if (filters?.endDate) {
                        cardQuery = cardQuery.lte('registered_on', filters.endDate);
                    }
                    return cardQuery
                }

                const {data: cards, error: cardsError, count} = await baseQuery();

                if (cardsError) {
                    console.error(`Error fetching cards for batch ${batchId}:`, cardsError);
                    return null;
                }

                const total = count;
                const assigned = (await baseQuery().not("assigned_to_user_id", "is", null)).count ?? 0;
                const unmatched = cards.filter(card => card.match === SIMStatus.UNMATCH).length;
                const quality = cards.filter(card => card.quality === SIMStatus.QUALITY).length;

                return {
                    id: batchId,
                    stats: {
                        total,
                        assigned,
                        unmatched,
                        quality
                    }
                };
            })
        );

        // Also get cards without a batch ID (unassigned)
        const bQuery = () => {
            let unassignedQuery = supabase
                .from('sim_cards')
                .select('id, match, quality', {count: 'exact'})
                .eq('team_id', teamId)
                .eq('admin_id', adminId)
                .is('batch_id', null);

            // Apply date filters if provided
            if (filters?.startDate) {
                unassignedQuery = unassignedQuery.gte('registered_on', filters.startDate);
            }
            if (filters?.endDate) {
                unassignedQuery = unassignedQuery.lte('registered_on', filters.endDate);
            }
            return unassignedQuery
        }

        const {data: unassignedCards, error: unassignedError} = await bQuery();

        if (!unassignedError && unassignedCards.length > 0) {
            const total = unassignedCards.length;
            const assigned = (await bQuery().not("assigned_to_user_id", "is", null)).count ?? 0;
            const unmatched = unassignedCards.filter(card => card.match === SIMStatus.UNMATCH).length;
            const quality = unassignedCards.filter(card => card.quality === SIMStatus.QUALITY).length;

            batchStats.push({
                id: 'unassigned',
                stats: {
                    total,
                    assigned,
                    unmatched,
                    quality
                }
            });
        }

        // Filter out any null values from failed batch queries
        const validBatchStats = batchStats.filter(batch => batch !== null);

        // Store in cache
        cache.batchStats.set(cacheKey, {data: validBatchStats, timestamp: Date.now()});

        return {data: validBatchStats, error: null};
    },

    // Get user-level statistics for a specific batch
    getUserStatsForBatch: async (teamId: string, batchId: string, user: User, filters?: {
        startDate?: string,
        endDate?: string
    }) => {
        // Generate cache key
        const cacheKey = generateCacheKey('userStats', `${user.id}_${teamId}_${batchId}`, filters);

        // Check cache
        const cachedData = cache.userStats.get(cacheKey);
        const now = Date.now();

        if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRATION)) {
            console.log('Using cached user stats');
            return {data: cachedData.data, error: null};
        }

        const supabase = createSupabaseClient();
        const adminId = await admin_id(user);

        // First, get all unique user IDs who sold cards in this batch
        let userQuery = supabase
            .from('sim_cards')
            .select('assigned_to_user_id', {count: 'exact'})
            .eq('team_id', teamId)
            .eq('admin_id', adminId);

        // Handle unassigned batch case
        if (batchId === 'unassigned') {
            userQuery = userQuery.is('batch_id', null);
        } else {
            userQuery = userQuery.eq('batch_id', batchId);
        }

        // Apply date filters if provided
        if (filters?.startDate) {
            userQuery = userQuery.gte('registered_on', filters.startDate);
        }
        if (filters?.endDate) {
            userQuery = userQuery.lte('registered_on', filters.endDate);
        }

        const {data: userData, error: userError} = await userQuery;

        if (userError) {
            console.error('Error fetching user IDs:', userError);
            return {data: null, error: userError};
        }

        // Extract unique user IDs
        const uniqueUserIds = [...new Set(userData.map(item => item.assigned_to_user_id).filter(id => id !== null))];

        // Now get statistics for each user
        const userStats = await Promise.all(
            uniqueUserIds.map(async (userId) => {
                // First get user details
                const {data: userDetails, error: userDetailsError} = await supabase
                    .from('users')
                    .select('id, full_name')
                    .eq('id', userId)
                    .single();

                if (userDetailsError) {
                    console.error(`Error fetching details for user ${userId}:`, userDetailsError);
                    return null;
                }

                // Then get card statistics
                const bQury = () => {
                    let cardQuery = supabase
                        .from('sim_cards')
                        .select('id, match, quality', {count: 'exact'})
                        .eq('team_id', teamId)
                        .eq('assigned_to_user_id', userId)
                        .eq('admin_id', adminId);

                    // Handle unassigned batch case
                    if (batchId === 'unassigned') {
                        cardQuery = cardQuery.is('batch_id', null);
                    } else {
                        cardQuery = cardQuery.eq('batch_id', batchId);
                    }

                    // Apply date filters if provided
                    if (filters?.startDate) {
                        cardQuery = cardQuery.gte('registered_on', filters.startDate);
                    }
                    if (filters?.endDate) {
                        cardQuery = cardQuery.lte('registered_on', filters.endDate);
                    }
                    return cardQuery
                }

                const {data: cards, error: cardsError, count} = await bQury();

                if (cardsError) {
                    console.error(`Error fetching cards for user ${userId}:`, cardsError);
                    return null;
                }

                const total = count;
                const registered = (await bQury().not("registered_on", "is", null)).count ?? 0;
                const matched = cards.filter(card => card.match === SIMStatus.MATCH).length;
                const unmatched = cards.filter(card => card.match === SIMStatus.UNMATCH).length;
                const quality = cards.filter(card => card.quality === SIMStatus.QUALITY).length;

                return {
                    id: userId,
                    name: userDetails.full_name,
                    stats: {
                        total,
                        matched,
                        registered,
                        unmatched,
                        quality
                    }
                };
            })
        );

        // Filter out any null values from failed user queries
        const validUserStats = userStats.filter(user => user !== null);

        // Store in cache
        cache.userStats.set(cacheKey, {data: validUserStats, timestamp: Date.now()});

        return {data: validUserStats, error: null};
    },

    // Get counts of SIM cards by different criteria
    getSimCardCounts: async (user: User, filters?: { startDate?: string, endDate?: string }) => {
        // Generate cache key
        const cacheKey = generateCacheKey('simCardCounts', user.id, filters);

        // Check cache
        const cachedData = cache.simCardCounts.get(cacheKey);
        const now = Date.now();

        if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRATION)) {
            console.log('Using cached sim card counts');
            return cachedData.data;
        }

        const supabase = createSupabaseClient();
        const adminId = await admin_id(user);

        // Base query for all counts
        let baseQuery = supabase
            .from('sim_cards')
            .select('id, match, quality', {count: 'exact', head: false})
            .eq('admin_id', adminId);

        // Apply date filters if provided
        if (filters?.startDate) {
            baseQuery = baseQuery.gte('registered_on', filters.startDate);
        }
        if (filters?.endDate) {
            baseQuery = baseQuery.lte('registered_on', filters.endDate);
        }

        // Apply role-specific filters
        if (user.role === UserRole.STAFF) {
            baseQuery = baseQuery.eq('sold_by_user_id', user.id);
        } else if (user.role === UserRole.TEAM_LEADER) {
            baseQuery = baseQuery.eq('team_id', user.team_id);
        }

        // Get total count
        const {count: totalCount, error: totalError} = await baseQuery;

        if (totalError) {
            console.error('Error fetching total count:', totalError);
            return {
                total: 0,
                matched: 0,
                unmatched: 0,
                quality: 0,
                error: totalError
            };
        }

        // Get matched count
        const {count: matchedCount, error: matchedError} = await baseQuery
            .eq('match', SIMStatus.MATCH);

        // Get unmatched count
        const {count: unmatchedCount, error: unmatchedError} = await baseQuery
            .eq('match', SIMStatus.UNMATCH);

        // Get quality count
        const {count: qualityCount, error: qualityError} = await baseQuery
            .eq('quality', SIMStatus.QUALITY);

        const result = {
            total: totalCount || 0,
            matched: matchedCount || 0,
            unmatched: unmatchedCount || 0,
            quality: qualityCount || 0,
            error: totalError || matchedError || unmatchedError || qualityError || null
        };

        // Store in cache if there's no error
        if (!result.error) {
            cache.simCardCounts.set(cacheKey, {data: result, timestamp: Date.now()});
        }

        return result;
    },

    // Get SIM cards with pagination
    getSimCardsChunked: async (user: User, pagination: PaginationParams, filters?: {
        startDate?: string,
        endDate?: string
    }) => {
        const supabase = createSupabaseClient();
        const adminId = await admin_id(user);

        let query;

        if (user.role === UserRole.ADMIN) {
            query = supabase
                .from('sim_cards')
                .select('*, sold_by_user_id(*),team_id(*,leader_id(full_name))')
                .eq("admin_id", adminId)
                .order('created_at', {ascending: false});
        } else if (user.role === UserRole.STAFF) {
            query = supabase
                .from('sim_cards')
                .select('*,team_id(*,leader_id(full_name)), sold_by_user_id(*,full_name)')
                .eq('sold_by_user_id', user.id)
                .eq("admin_id", adminId)
                .order('registered_on', {ascending: false});
        } else if (user.role === UserRole.TEAM_LEADER) {
            query = supabase
                .from('sim_cards')
                .select('*, sold_by_user_id(*),team_id(*,leader_id(full_name))')
                .eq("admin_id", adminId)
                .eq("team_id", user.team_id)
                .order('registered_on', {ascending: false});
        } else {
            return {data: null, error: "Invalid user role"};
        }

        // Apply date filters if provided
        if (filters?.startDate) {
            query = query.gte('registered_on', filters.startDate);
        }
        if (filters?.endDate) {
            query = query.lte('registered_on', filters.endDate);
        }

        // Apply pagination
        if (pagination.page !== undefined && pagination.pageSize !== undefined) {
            const from = pagination.page * pagination.pageSize;
            const to = from + pagination.pageSize - 1;
            query = query.range(from, to);
        } else if (pagination.startIndex !== undefined && pagination.endIndex !== undefined) {
            query = query.range(pagination.startIndex, pagination.endIndex);
        }

        return query;
    },
    // New service function to fetch SIM cards by batch of serial numbers
    getSimCardsBySerialBatch: async (
        user: User,
        serialNumbers: string[]
    ) => {
        const supabase = createSupabaseClient();
        const adminId = await admin_id(user);
        // Common query parts: include relations and admin filter
        const query = supabase
            .from('sim_cards')
            .select('*, sold_by_user_id(*), team_id(*, leader_id(full_name))')
            .eq('admin_id', adminId)
            .in('serial_number', serialNumbers)
            .order('created_at', {ascending: false});

        // Filter for admin role
        if (user.role === UserRole.ADMIN) {

            return query
        }

        return {data: null, error: "Invalid user role"}
    },
    getIn: async (user: User, key: keyof SIMCard, values: string[]) => {
        return createSupabaseClient()
            .from('sim_cards')
            .select('*')
            .eq("admin_id", await admin_id(user))
            .in(key as string, values)
            .order('created_at', {ascending: false});

    },
    streamChunks: async (
        user: User,
        onChunk: (chunk: SIMCard[], end: boolean) => void,
        options: {
            chunkSize?: number,
            filters?: Filter[]
        } = {}
    ): Promise<void> => {
        const client = createSupabaseClient();
        let page = 0;
        const chunkSize = options.chunkSize ?? 500;
        const filters = options.filters ?? [];
        const admin = await admin_id(user);
        while (true) {
            const from = page * chunkSize;
            const to = from + chunkSize - 1;

            const {data, error} = await applyFilters(client
                .from('sim_cards')
                .select('*')
                .eq("admin_id", admin)
                .range(from, to), filters);

            if (error) {
                console.error('Fetch error:', error);
                break;
            }

            if (!data?.length) break;
            onChunk(data, false);
            page++;
        }
        onChunk([], true)
    },

    async getInBatched(user: User, key: keyof SIMCard, values: string[], chunkSize = 500) {
        const supabase = createSupabaseClient();
        const admin = await admin_id(user);
        const results: any[] = [];

        for (let i = 0; i < values.length; i += chunkSize) {
            const chunk = values.slice(i, i + chunkSize);
            const {data, error} = await supabase
                .from('sim_cards')
                .select('*')
                .eq("admin_id", admin)
                .in(key as string, chunk)
                .order('created_at', {ascending: false});

            if (error) {
                console.error('Error fetching chunk:', error);
                continue;
            }

            results.push(...(data ?? []));
        }

        return results;
    },


    getAllSimCards: async (user: User) => {
        const supabase = createSupabaseClient();
        if (user.role === UserRole.ADMIN) {
            return supabase
                .from('sim_cards')
                .select('*, assigned_to_user_id(*),team_id(*,leader_id(full_name))')
                .eq("admin_id", await admin_id(user))
                .order('created_at', {ascending: false});
        }

        if (user.role === UserRole.STAFF) {
            return supabase
                .from('sim_cards')

                .select('*,team_id(*,leader_id(full_name)), sold_by_user_id(*,full_name)')
                .eq('sold_by_user_id', user.id)
                .eq("admin_id", await admin_id(user))
                .order('registered_on', {ascending: false});
        }
        if (user.role === UserRole.TEAM_LEADER) {
            return supabase
                .from('sim_cards')
                .select('*, sold_by_user_id(*),team_id(*,leader_id(full_name))')
                .eq("admin_id", await admin_id(user))
                .eq("team_id", user.team_id)
                // .or(`team_id.eq.${user.team_id},sold_by_user_id.team_id.eq.${user.team_id}`)
                .order('registered_on', {ascending: false});
        }

        return {data: null, error: "Invalid user role"}
    },
    countAll: async (user: User, filters: Filter[] = []) => {
        const supabase = createSupabaseClient();
        if (user.role === UserRole.ADMIN) {
            return applyFilters(supabase
                .from('sim_cards')
                .select('id', {count: "exact"})
                .eq("admin_id", await admin_id(user)), filters);
        }

        // if (user.role === UserRole.STAFF) {
        //     return supabase
        //         .from('sim_cards')
        //
        //         .select('*,team_id(*,leader_id(full_name)), sold_by_user_id(*,full_name)')
        //         .eq('sold_by_user_id', user.id)
        //         .eq("admin_id", await admin_id(user))
        //         .order('registered_on', {ascending: false});
        // }
        if (user.role === UserRole.TEAM_LEADER) {
            return applyFilters(supabase
                .from('sim_cards')
                .select("id", {count: "exact"})
                .eq("admin_id", await admin_id(user))
                .eq("team_id", user.team_id), filters);
        }

        return {data: null, error: "Invalid user role", count: 0}
    },
    countQuery: async (user: User, filters: Filter[] = []) => {
        const supabase = createSupabaseClient();
        return applyFilters(supabase
            .from('sim_cards')
            .select('id', {count: "exact"})
            .eq("admin_id", await admin_id(user)), filters)
    },
    countReg: async (user: User, teamId: string | null = null, filters: Filter[] = []) => {
        const supabase = createSupabaseClient();
        if (user.role === UserRole.ADMIN) {
            let q = supabase
                .from('sim_cards')
                .select('id', {count: "exact"})
                .not("registered_on", "is", null)
                .eq("admin_id", await admin_id(user));
            if (teamId)
                q = q.eq("team_id", teamId)
            return applyFilters(q, filters)
        }

        // if (user.role === UserRole.STAFF) {
        //     return supabase
        //         .from('sim_cards')
        //
        //         .select('*,team_id(*,leader_id(full_name)), sold_by_user_id(*,full_name)')
        //         .eq('sold_by_user_id', user.id)
        //         .eq("admin_id", await admin_id(user))
        //         .order('registered_on', {ascending: false});
        // }
        if (user.role === UserRole.TEAM_LEADER) {
            const q = supabase
                .from('sim_cards')
                .select('id', {count: "exact"})
                .not("registered_on", "is", null)
                .eq("admin_id", await admin_id(user))
                .eq("team_id", user.team_id)
            return applyFilters(q, filters)
        }

        return {data: null, error: "Invalid user role", count: 0}
    },
    countAssigned: async (user: User) => {
        const supabase = createSupabaseClient();
        if (user.role === UserRole.ADMIN) {
            return supabase
                .from('sim_cards')
                .select('id', {count: "exact"})
                .not("assigned_to_user_id", "is", null)
                .eq("admin_id", await admin_id(user));
        }

        // if (user.role === UserRole.STAFF) {
        //     return supabase
        //         .from('sim_cards')
        //
        //         .select('*,team_id(*,leader_id(full_name)), sold_by_user_id(*,full_name)')
        //         .eq('sold_by_user_id', user.id)
        //         .eq("admin_id", await admin_id(user))
        //         .order('registered_on', {ascending: false});
        // }
        // if (user.role === UserRole.TEAM_LEADER) {
        //     return supabase
        //         .from('sim_cards')
        //         .select('*, sold_by_user_id(*),team_id(*,leader_id(full_name))')
        //         .eq("admin_id", await admin_id(user))
        //         .eq("team_id", user.team_id)
        //         // .or(`team_id.eq.${user.team_id},sold_by_user_id.team_id.eq.${user.team_id}`)
        //         .order('registered_on', {ascending: false});
        // }

        return {data: null, error: "Invalid user role", count: 0}
    },
    countActivated: async (user: User, filters: Filter[] = []) => {
        const supabase = createSupabaseClient();
        if (user.role === UserRole.ADMIN) {
            return applyFilters(supabase
                .from('sim_cards')
                .select('id', {count: "exact"})
                .not("activation_date", "is", null)
                .eq("status", SIMStatus.ACTIVATED)
                .eq("admin_id", await admin_id(user)), filters);
        }
        if (user.role === UserRole.TEAM_LEADER) {
            return applyFilters(supabase
                .from('sim_cards')
                .select('id', {count: "exact"})
                .not("activation_date", "is", null)
                .eq("status", SIMStatus.ACTIVATED)
                .eq("team_id", user.team_id)
                .eq("admin_id", await admin_id(user)), filters);
        }

        // if (user.role === UserRole.STAFF) {
        //     return supabase
        //         .from('sim_cards')
        //
        //         .select('*,team_id(*,leader_id(full_name)), sold_by_user_id(*,full_name)')
        //         .eq('sold_by_user_id', user.id)
        //         .eq("admin_id", await admin_id(user))
        //         .order('registered_on', {ascending: false});
        // }
        // if (user.role === UserRole.TEAM_LEADER) {
        //     return supabase
        //         .from('sim_cards')
        //         .select('*, sold_by_user_id(*),team_id(*,leader_id(full_name))')
        //         .eq("admin_id", await admin_id(user))
        //         .eq("team_id", user.team_id)
        //         // .or(`team_id.eq.${user.team_id},sold_by_user_id.team_id.eq.${user.team_id}`)
        //         .order('registered_on', {ascending: false});
        // }

        return {data: null, error: "Invalid user role", count: 0}
    },

    countQuality: async (user: User, teamId: string | null = null, filters: Filter[] = []) => {
        const supabase = createSupabaseClient();
        if (user.role === UserRole.ADMIN) {
            let q = supabase
                .from('sim_cards')
                .select('id', {count: "exact"})
                .eq("quality", SIMStatus.QUALITY)
                .eq("admin_id", await admin_id(user));
            if (teamId)
                q = q.eq("team_id", teamId)
            return applyFilters(q, filters)
        }
        if (user.role === UserRole.TEAM_LEADER) {
            return applyFilters(supabase
                .from('sim_cards')
                .select('id', {count: "exact"})
                .eq("quality", SIMStatus.QUALITY)
                .eq("admin_id", await admin_id(user))
                .eq("team_id", user.team_id), filters)
        }

        return {data: null, error: "Invalid user role", count: 0}
    },
    countMatch: async (user: User, teamId: string | null = null, filters: Filter[] = []) => {
        const supabase = createSupabaseClient();
        if (user.role === UserRole.ADMIN) {
            let q = supabase
                .from('sim_cards')
                .select('id', {count: "exact"})
                .eq("match", SIMStatus.MATCH)
                .eq("admin_id", await admin_id(user));
            if (teamId)
                q = q.eq("team_id", teamId)
            return applyFilters(q, filters)
        }
        if (user.role === UserRole.TEAM_LEADER) {
            const q = supabase
                .from('sim_cards')
                .select('id', {count: "exact"})
                .eq("match", SIMStatus.MATCH)
                .eq("admin_id", await admin_id(user))
                .eq("team_id", user.team_id)
            return applyFilters(q, filters)
        }

        return {data: null, error: "Invalid user role", count: 0}
    },
    countTopUpCategories: async (user: User, filters: Filter[] = []) => {
        const supabase = createSupabaseClient();
        const adminId = await admin_id(user);

        const base = () =>
            applyFilters(supabase.from('sim_cards').select('id', {count: 'exact'}).eq('admin_id', adminId), filters);

        const [lt50, noTopUp, gte50NotConverted] = await Promise.all([
            base().lt('top_up_amount', 50).not('top_up_amount', "is", null),
            base().is('top_up_amount', null).not("registered_on", "is", null),
            base().gte('top_up_amount', 50).or('usage.lt.50,usage.is.null'),
        ]);

        return {
            lt50: lt50.count || 0,
            noTopUp: noTopUp.count || 0,
            gte50NotConverted: gte50NotConverted.count || 0,
        };
    },
    // Create a new SIM card record
    createSIMCard: async (simCardData: SIMCardCreate): Promise<SIMCard | null> => {
        const supabase = createSupabaseClient();
        if (simCardData.sold_by_user_id === '') {
            simCardData.sold_by_user_id = null;
        }

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
    createSIMCardBatch: async (
        simCardsData: SIMCardCreate[],
        chunkSize: number = 10,
        updateProgress: ((percent: number, sofar: number, chunk: SIMCardCreate[], errors: any[]) => void) = () => {
        }
    ): Promise<{
        success: number,
        failed: number,
        errors: any[],
    }> => {
        const supabase = createSupabaseClient();
        let successCount = 0;
        const errors: any[] = [];

        // Start a transaction
        const {data: {session}} = await supabase.auth.getSession();
        if (!session) {
            throw new Error('No active session found');
        }

        try {
            // Process all chunks within a single logical transaction
            for (let i = 0; i < simCardsData.length; i += chunkSize) {
                const chunk = simCardsData.slice(i, i + chunkSize);
                // Clean up data before sending
                const cleanedData = chunk.map(card => ({
                    ...card,
                    sold_by_user_id: card.sold_by_user_id === '' ? null : card.sold_by_user_id
                }));

                const {error} = await supabase.from('sim_cards').insert(cleanedData);

                if (error) {
                    console.error(`Error inserting chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(simCardsData.length / chunkSize)}:`, error);
                    errors.push(error);
                    // Stop processing and throw error to trigger rollback
                    throw error;
                } else {
                    successCount += chunk.length;
                }

                const percent = Math.min(100, Math.round(((i + chunk.length) / simCardsData.length) * 100));
                updateProgress(percent, successCount, chunk, errors);
            }

            return {
                success: successCount,
                failed: 0, // If we get here, all records were successful
                errors: []
            };
        } catch (error) {
            console.error('Transaction failed:', error);

            // If there was an error, we need to clean up any records that were inserted
            // This is necessary because Supabase doesn't support true transactions
            if (successCount > 0) {
                try {
                    // Get the batch_id from the first record to identify all records in this batch
                    const batchId = simCardsData[0].batch_id;
                    if (batchId) {
                        // Delete all records with this batch_id
                        await supabase.from('sim_cards').delete().eq('batch_id', batchId);
                        console.log(`Rolled back ${successCount} records for batch ${batchId}`);
                    }
                } catch (cleanupError) {
                    console.error('Error during rollback:', cleanupError);
                    errors.push(cleanupError);
                }
            }

            return {
                success: 0,
                failed: simCardsData.length,
                errors: errors.length > 0 ? errors : [error]
            };
        }
    },


    // Update an existing SIM card
    updateSIMCard: async (id: string, updateData: SIMCardUpdate, user: User) => {
        const supabase = createSupabaseClient();

        return supabase
            .from('sim_cards')
            .update(updateData)
            .eq('id', id)
            .eq("admin_id", await admin_id(user))
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
    getSIMCardBySerialNumber: async (serialNumber: string, user: User): Promise<SIMCard | null> => {
        const supabase = createSupabaseClient();

        const {data, error} = await supabase
            .from('sim_cards')
            .select('*')
            .eq('serial_number', serialNumber)
            .eq("admin_id", await admin_id(user))
            .single();

        if (error) {
            console.error('Error fetching SIM card by serial number:', error);
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
            .order('registered_on', {ascending: false});

        if (error) {
            console.error('Error fetching SIM cards by user ID:', error);
            return [];
        }

        return data as SIMCard[];
    },

    // Get SIM cards by team ID
    getSIMCardsByTeamId: async (teamId: string, user: User): Promise<SIMCard[]> => {
        const supabase = createSupabaseClient();

        const {data, error} = await supabase
            .from('sim_cards')
            .select('*')
            .eq('team_id', teamId)
            .eq("admin_id", await admin_id(user))
            .order('registered_on', {ascending: false});

        if (error) {
            console.error('Error fetching SIM cards by team ID:', error);
            return [];
        }

        return data as SIMCard[];
    },
    getSIMCardsByTeamIdByUserDetails: async (teamId: string): Promise<SIMCard[]> => {
        const supabase = createSupabaseClient();

        const {data, error} = await supabase
            .from('sim_cards')
            .select('* users!assigned_to_user_id(*,full_name),team:team_id(*,leader_id(full_name))')
            .eq('team_id', teamId)
            .order('registered_on', {ascending: false});

        if (error) {
            console.error('Error fetching SIM cards by team ID:', error);
            return [];
        }
//@ts-ignore
        return data as SIMCard[];
    },

    // Get performance metrics for a staff member
    getStaffPerformanceMetrics: async (userId: string, user: User, startDate?: string, endDate?: string): Promise<{
        totalSims: number;
        matchedSims: number;
        qualitySims: number;
        performancePercentage: number;
    }> => {
        const supabase = createSupabaseClient();

        let query = supabase
            .from('sim_cards')
            .select('*')
            .eq("admin_id", await admin_id(user))
            .eq('sold_by_user_id', userId);

        // Add date filters if provided
        if (startDate) {
            query = query.gte('registered_on', startDate);
        }

        if (endDate) {
            query = query.lte('registered_on', endDate);
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
    getTeamPerformanceMetrics: async (teamId: string, user: User, startDate?: string, endDate?: string): Promise<{
        totalSims: number;
        matchedSims: number;
        qualitySims: number;
        performancePercentage: number;
    }> => {
        const supabase = createSupabaseClient();

        let query = supabase
            .from('sim_cards')
            .select('*')
            .eq("admin_id", await admin_id(user))
            .eq('team_id', teamId);

        // Add date filters if provided
        if (startDate) {
            query = query.gte('registered_on', startDate);
        }

        if (endDate) {
            query = query.lte('registered_on', endDate);
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
    getDailyPerformanceData: async (userId: string, days: number = 30, user: User): Promise<{
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
            .eq("admin_id", await admin_id(user))
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
            query = query.gte('registered_on', criteria.startDate);
        }

        if (criteria.endDate) {
            query = query.lte('registered_on', criteria.endDate);
        }

        const {data, error} = await query.order('registered_on', {ascending: false});

        if (error) {
            console.error('Error searching SIM cards:', error);
            return [];
        }

        return data as SIMCard[];
    },
    getSimCardsByDateRange: async (startDate: string, endDate: string, user: User) => {
        const supabase = createSupabaseClient();

        return supabase
            .from('sim_cards')
            .select('*, sold_by_user_id(*),team_id(*,leader_id(full_name))')
            .eq("admin_id", await admin_id(user))
            .gte('registered_on', startDate)
            .lte('registered_on', endDate)
            .order('registered_on', {ascending: false});
    },
};

export default simCardService;
