import {createSupabaseClient} from "../../lib/supabase/client";
import {SIMStatus, UserRole} from "@/models";
import SimService from "@/services/simService";
import {teamService} from "@/services";

const supabase = createSupabaseClient();

async function getCurrentMonthSimCards(user) {
    try {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Format dates for Supabase (ISO string format)
        const startDate = firstDayOfMonth.toISOString().split('T')[0];
        const endDate = lastDayOfMonth.toISOString().split('T')[0];

        let query = supabase
            .from('sim_cards')
            .select(`
          *,
          sold_by_user:sold_by_user_id(
            id,
            full_name,
            email
          ),
          team:team_id(
            id,
            team_name:name,
            leader:leader_id(
              id,
              full_name
            )
          )
        `)
            .gte('registered_on', startDate)
            .lte('registered_on', endDate)
            .limit(10000)
            .order('created_at', {ascending: false});

        // Apply role-based filtering (same as getAllSimCards)
        switch (user.role) {
            case UserRole.ADMIN:
                break;

            case UserRole.TEAM_LEADER:
                if (user.team_id) {
                    query = query.eq('team_id', user.team_id);
                } else {
                    return [];
                }
                break;

            case 'VAN_STAFF':
            case 'MPESA_ONLY_AGENT':
            case 'NON_MPESA_AGENT':
                if (user.team_id) {
                    query = query.or(
                        `sold_by_user_id.eq.${user.id},team_id.eq.${user.team_id}`
                    );
                } else {
                    query = query.eq('sold_by_user_id', user.id);
                }
                break;

            default:
                throw new Error('Invalid user role');
        }

        const {data, error} = await query;

        if (error) {
            console.error('Supabase error:', error);
            throw new Error(`Failed to fetch current month SIM cards: ${error.message}`);
        }

        return data || [];

    } catch (error) {
        console.error('Error in getCurrentMonthSimCards:', error);
        throw error;
    }
}

export const fetchSimCardsForChart = async (user) => {
    try {
        // Use the current month function for better performance
        const data = await new Promise(resolve => {
            const cards = []
            SimService.streamChunks(user, (chunk, end) => {
                cards.push(...chunk)
                if (end) {
                    resolve(cards)
                }
            })
        });
        return {data, error: null};
    } catch (error) {
        console.error('Error fetching SIM cards for chart:', error);
        return {data: null, error: error.message};
    }
};

export   const fetchTeamPerformanceData = async (user) => {
    try {
        const { data: teams, error: teamsError } = await teamService.getAllTeamsV2(user,{
            selection:["leader:leader_id(*)"]
        });
        if (teamsError) {
            throw new Error(`Failed to fetch teams: ${teamsError.message}`);
        }

        // const { data: simCards, error: simError } = await supabase
        //     .from('sim_cards')
        //     .select(`
        //   id,
        //   team_id,
        //   status,
        //   activation_date,
        //   quality,
        //   sale_date,
        //   created_at
        // `)
        //     .gte('sale_date', firstDayOfMonth.toISOString().split('T')[0])
        //     .lte('sale_date', lastDayOfMonth.toISOString().split('T')[0]);

        // const simCards = await new Promise(resolve => {
        //     const cards = []
        //     SimService.streamChunks(user, (chunk, end) => {
        //         cards.push(...chunk)
        //         if (end) {
        //             resolve(cards)
        //         }
        //     })
        // });

        // Step 3: Calculate performance for each team
        const teamPerformance = await Promise.all(teams.map(async team => {

            const registered = (await SimService.countAll(user,[
                ["team_id", team.id],
                ])).count ?? 0;
            const activated = (await SimService.countActivated(user, [
                ["team_id", team.id],
            ])).count ?? 0;

            const quality = (await SimService.countActivated(user, [
                ["team_id", team.id],
                ["quality", SIMStatus.QUALITY],
            ])).count ?? 0;

            const nonQuality = activated - quality;

            const activationRate = activated > 0
                ? Math.round((activated / registered) * 100)
                : 0;

            const qualityRate = activated > 0
                ? Math.round((quality / registered) * 100)
                : 0;

            return {
                teamId: team.id,
                teamName: team.name,
                leaderName: team.leader?.full_name || 'No leader assigned',
                leaderEmail: team.leader?.email || '',
                totalRecorded: registered,
                activated,
                quality,
                nonQuality,
                activationRate,
                qualityRate,
                performanceScore: Math.round((activationRate * 0.6) + (qualityRate * 0.4))
            };
        }));
        console.log(teamPerformance
            .filter(team => team.totalRecorded > 0) // Only show teams with data
            .sort((a, b) => b.performanceScore - a.performanceScore))
        return teamPerformance
            .filter(team => team.totalRecorded > 0) // Only show teams with data
            .sort((a, b) => b.performanceScore - a.performanceScore);

    } catch (error) {
        console.error('Error in fetchTeamPerformanceData:', error);
        throw error;
    }
};
