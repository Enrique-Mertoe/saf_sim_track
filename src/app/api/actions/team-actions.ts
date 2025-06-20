import {applyFilters, Filter, makeResponse} from "@/helper";
import {supabaseAdmin} from "@/lib/supabase/server";
import Accounts from "@/lib/accounts";
import {admin_id} from "@/services/helper";
import {SIMStatus, Team, TeamCreate} from "@/models";

class TeamActions {
    // Get team by ID
    static async byId(data: { id: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {data: team, error} = await supabaseAdmin
                .from('teams')
                .select(`
                    *,
                    leader:users!leader_id(id, full_name, email, phone_number, role),
                    members:users!team_id(id, full_name, role, is_active)
                `)
                .eq('id', data.id)
                .eq('admin_id', await admin_id(user))
                .single();

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, data: team});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Get multiple teams with filters and pagination
    static async list(data: {
        page?: number;
        limit?: number;
        region?: string;
        territory?: string;
        leader_id?: string;
        is_active?: boolean;
        search?: string;
        has_van?: boolean;
    }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {page = 1, limit = 50, region, territory, leader_id, is_active, search, has_van} = data;
            const offset = (page - 1) * limit;

            let query = supabaseAdmin
                .from('teams')
                .select(`
                    *,
                    leader:users!leader_id(id, full_name, email, phone_number),
                    member_count:users!team_id(count)
                `, {count: 'exact'})
                .eq('admin_id', await admin_id(user));

            // Apply filters
            if (region) query = query.eq('region', region);
            if (territory) query = query.eq('territory', territory);
            if (leader_id) query = query.eq('leader_id', leader_id);
            if (typeof is_active === 'boolean') query = query.eq('is_active', is_active);
            if (typeof has_van === 'boolean') {
                if (has_van) {
                    query = query.not('van_number_plate', 'is', null);
                } else {
                    query = query.is('van_number_plate', null);
                }
            }

            // Apply search
            if (search) {
                query = query.or(`name.ilike.%${search}%,region.ilike.%${search}%,territory.ilike.%${search}%,van_number_plate.ilike.%${search}%`);
            }

            // Apply pagination and ordering
            query = query.range(offset, offset + limit - 1).order('created_at', {ascending: false});

            const {data: teams, error, count} = await query;

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({
                ok: true,
                data: {
                    items: teams,
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

    // Create new team
    static async create(data: TeamCreate) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const teamData = {
                ...data,
                admin_id: await admin_id(user),
                leader_id: data.leader_id === '' ? null : data.leader_id,
                created_at: new Date().toISOString()
            };

            const {data: team, error} = await supabaseAdmin
                .from('teams')
                .insert(teamData)
                .select(`
                    *,
                    leader:users!leader_id(id, full_name, email, phone_number)
                `)
                .single();

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, data: team, message: "Team created successfully"});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Update team
    static async update(data: { id: string; updates: Partial<Team> }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {id, updates} = data;

            // Clean up empty strings
            const cleanUpdates = {...updates};
            //@ts-ignore
            if (cleanUpdates.leader_id === '') cleanUpdates.leader_id = null;
            if (cleanUpdates.territory === '') { // @ts-ignore
                cleanUpdates.territory = null;
            }
            if (cleanUpdates.van_number_plate === '') { // @ts-ignore
                cleanUpdates.van_number_plate = null;
            }
            if (cleanUpdates.van_location === '') { // @ts-ignore
                cleanUpdates.van_location = null;
            }

            // Remove fields that shouldn't be updated directly
            delete cleanUpdates.admin_id;
            delete cleanUpdates.created_at;

            const {data: team, error} = await supabaseAdmin
                .from('teams')
                .update(cleanUpdates)
                .eq('id', id)
                .eq('admin_id', await admin_id(user))
                .select(`
                    *,
                    leader:users!leader_id(id, full_name, email, phone_number)
                `)
                .single();

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, data: team, message: "Team updated successfully"});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Delete team
    static async delete(data: { id: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            // Check if team has members
            const {data: members, error: membersError} = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('team_id', data.id)
                .eq('admin_id', await admin_id(user));

            if (membersError) {
                return makeResponse({error: membersError.message});
            }

            if (members && members.length > 0) {
                return makeResponse({error: "Cannot delete team with existing members. Please reassign or remove members first."});
            }

            const {error} = await supabaseAdmin
                .from('teams')
                .delete()
                .eq('id', data.id)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: "Team deleted successfully"});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Bulk delete teams
    static async bulk_delete(data: { ids: string[] }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            // Check if any teams have members
            const {data: members, error: membersError} = await supabaseAdmin
                .from('users')
                .select('team_id')
                .in('team_id', data.ids)
                .eq('admin_id', await admin_id(user));

            if (membersError) {
                return makeResponse({error: membersError.message});
            }

            if (members && members.length > 0) {
                const teamsWithMembers = [...new Set(members.map(m => m.team_id))];
                return makeResponse({
                    error: `Cannot delete teams with existing members. Teams ${teamsWithMembers.join(', ')} have members.`
                });
            }

            const {error} = await supabaseAdmin
                .from('teams')
                .delete()
                .in('id', data.ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: `${data.ids.length} teams deleted successfully`});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Activate/Deactivate teams
    static async toggle_active_status(data: { team_ids: string[]; is_active: boolean }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {error} = await supabaseAdmin
                .from('teams')
                .update({is_active: data.is_active})
                .in('id', data.team_ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            const action = data.is_active ? 'activated' : 'deactivated';
            return makeResponse({ok: true, message: `${data.team_ids.length} teams ${action} successfully`});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Assign leader to teams
    static async assign_leader(data: { team_ids: string[]; leader_id: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            // Verify the leader exists and is a team leader
            const {data: leader, error: leaderError} = await supabaseAdmin
                .from('users')
                .select('id, role')
                .eq('id', data.leader_id)
                .eq('admin_id', await admin_id(user))
                .single();

            if (leaderError || !leader) {
                return makeResponse({error: "Leader not found"});
            }

            if (leader.role !== 'TEAM_LEADER') {
                return makeResponse({error: "User must have TEAM_LEADER role to be assigned as team leader"});
            }

            const {error} = await supabaseAdmin
                .from('teams')
                .update({leader_id: data.leader_id})
                .in('id', data.team_ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: `Leader assigned to ${data.team_ids.length} teams successfully`});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Remove leader from teams
    static async remove_leader(data: { team_ids: string[] }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {error} = await supabaseAdmin
                .from('teams')
                .update({leader_id: null})
                .in('id', data.team_ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: `Leader removed from ${data.team_ids.length} teams successfully`});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Get teams by region
    static async by_region(data: { region: string; page?: number; limit?: number }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {region, page = 1, limit = 100} = data;
            const offset = (page - 1) * limit;

            const {data: teams, error, count} = await supabaseAdmin
                .from('teams')
                .select(`
                    *,
                    leader:users!leader_id(id, full_name, email),
                    member_count:users!team_id(count)
                `, {count: 'exact'})
                .eq('region', region)
                .eq('admin_id', await admin_id(user))
                .range(offset, offset + limit - 1)
                .order('created_at', {ascending: false});

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({
                ok: true,
                data: {
                    items: teams,
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

    // Get teams by leader
    static async by_leader(data: { leader_id: string; page?: number; limit?: number }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {leader_id, page = 1, limit = 100} = data;
            const offset = (page - 1) * limit;

            const {data: teams, error, count} = await supabaseAdmin
                .from('teams')
                .select(`
                    *,
                    leader:users!leader_id(id, full_name, email),
                    member_count:users!team_id(count)
                `, {count: 'exact'})
                .eq('leader_id', leader_id)
                .eq('admin_id', await admin_id(user))
                .range(offset, offset + limit - 1)
                .order('created_at', {ascending: false});

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({
                ok: true,
                data: {
                    items: teams,
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

    // Get team performance statistics
    static async performance1(data: { team_id: string; date_from?: string; date_to?: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {team_id, date_from, date_to} = data;

            // Get team basic info
            const {data: team, error: teamError} = await supabaseAdmin
                .from('teams')
                .select('*')
                .eq('id', team_id)
                .eq('admin_id', await admin_id(user))
                .single();

            if (teamError) {
                return makeResponse({error: teamError.message});
            }

            // Get team members count
            const {data: members, error: membersError} = await supabaseAdmin
                .from('users')
                .select('id, role, is_active')
                .eq('team_id', team_id)
                .eq('admin_id', await admin_id(user));

            if (membersError) {
                return makeResponse({error: membersError.message});
            }

            // Get SIM cards performance
            let simQuery = async (filters: Filter[]) =>
                applyFilters(supabaseAdmin
                    .from('sim_cards')
                    .select('status, match, quality, sale_date, activation_date, top_up_amount', {count: 'exact'})
                    .eq('team_id', team_id)
                    .eq('admin_id', await admin_id(user)), filters);
            const filterConditions: Filter[] = [];
            if (date_from) filterConditions.push(["activation_date", "gte", date_from]);
            if (date_to) filterConditions.push(["activation_date", "lte", date_to]);

            // const {data: simCards, error: simError} = await simQuery;

            // if (simError) {
            //     return makeResponse({error: simError.message});
            // }

            const sim_cards = {
                total: (await simQuery(filterConditions)).count ?? 0,
                activated: (await simQuery([...filterConditions,
                    ["status", SIMStatus.ACTIVATED],
                    ["activation_date", "not", "is", null]
                ])).count ?? 0,
                pending: (await simQuery([...filterConditions,
                    ["status", SIMStatus.PENDING]])).count ?? 0,
                matched: (await simQuery([...filterConditions,
                    ["match", SIMStatus.MATCH]])).count ?? 0,
                quality: (await simQuery([...filterConditions,
                    ["quality", SIMStatus.QUALITY]])).count ?? 0,
                // total_revenue: this * 300
            }

            // Calculate statistics
            const stats = {
                team_info: team,
                members: {
                    total: members.length,
                    active: members.filter(m => m.is_active).length,
                    inactive: members.filter(m => !m.is_active).length,
                    by_role: {
                        van_staff: members.filter(m => m.role === 'VAN_STAFF').length,
                        mpesa_agents: members.filter(m => m.role === 'MPESA_ONLY_AGENT').length,
                        non_mpesa_agents: members.filter(m => m.role === 'NON_MPESA_AGENT').length
                    }
                },
                sim_cards,
                rates: {
                    activation_rate: sim_cards.total > 0 ? (sim_cards.activated / sim_cards.total) * 100 : 0,
                    match_rate: sim_cards.total > 0 ? (sim_cards.matched / sim_cards.activated) * 100 : 0,
                    quality_rate: sim_cards.total > 0 ?
                        (sim_cards.quality / sim_cards.activated) * 100 : 0
                }
            };

            return makeResponse({ok: true, data: stats});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Get teams statistics
    static async statistics(data: { region?: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            let query = supabaseAdmin
                .from('teams')
                .select(`
                    id, region, territory, is_active, created_at, van_number_plate,
                    members:users!team_id(id)
                `)
                .eq('admin_id', await admin_id(user));

            // Apply filters
            if (data.region) query = query.eq('region', data.region);

            const {data: teams, error} = await query;

            if (error) {
                return makeResponse({error: error.message});
            }

            const now = new Date();
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const stats = {
                total: teams.length,
                active: teams.filter(t => t.is_active).length,
                inactive: teams.filter(t => !t.is_active).length,
                with_vans: teams.filter(t => t.van_number_plate).length,
                without_vans: teams.filter(t => !t.van_number_plate).length,
                by_region: teams.reduce((acc, team) => {
                    acc[team.region] = (acc[team.region] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
                total_members: teams.reduce((sum, team) => sum + (team.members?.length || 0), 0),
                average_team_size: teams.length > 0 ? teams.reduce((sum, team) => sum + (team.members?.length || 0), 0) / teams.length : 0,
                created_this_month: teams.filter(t => new Date(t.created_at) >= thisMonth).length
            };

            return makeResponse({ok: true, data: stats});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Check if team name exists
    static async check_name_exists(data: { name: string; exclude_id?: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            let query = supabaseAdmin
                .from('teams')
                .select('id')
                .eq('name', data.name)
                .eq('admin_id', await admin_id(user));

            if (data.exclude_id) {
                query = query.neq('id', data.exclude_id);
            }

            const {data: existing, error} = await query;

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({
                ok: true,
                data: {
                    exists: existing && existing.length > 0
                }
            });
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Get available regions
    static async get_regions() {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {data: teams, error} = await supabaseAdmin
                .from('teams')
                .select('region')
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            const regions = [...new Set(teams.map(t => t.region))].filter(Boolean).sort();

            return makeResponse({ok: true, data: regions});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Get available territories by region
    static async get_territories(data: { region: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {data: teams, error} = await supabaseAdmin
                .from('teams')
                .select('territory')
                .eq('region', data.region)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            const territories = [...new Set(teams.map(t => t.territory))].filter(Boolean).sort();

            return makeResponse({ok: true, data: territories});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Router method
    static async builder(target: string, data: any) {
        try {
            const action = (TeamActions as any)[target];
            if (typeof action === 'function') {
                return await action(data);
            } else {
                throw new Error(`Action '${target}' is not a function`);
            }
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // ...existing methods

// Get team batches (handles both team_id and teams[] array)
    static async getTeamBatches(data: { args: any }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const [_team_id, _page, _limit] = data.args;
            const [team_id, page, limit] = [_team_id, _page || 1, _limit || 100];
            const offset = (page - 1) * limit;

            const {data: batches, error, count} = await supabaseAdmin
                .from('batch_metadata')
                .select(`
                *,
                created_by:users!created_by_user_id(id, full_name, email),
                sim_count:sim_cards!batch_id(count)
            `, {count: 'exact'})
                .or(`team_id.eq.${team_id},teams.cs.{${team_id}}`)
                .range(offset, offset + limit - 1)
                .order('created_at', {ascending: false});

            if (error) {
                return makeResponse({error: error.message});
            }
            ;

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
            return makeResponse({error: (error as Error).message});
        }
    }

// Enhanced performance with NonQuality count
    static async performance(data: { args: any }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const [team_id, date_from, date_to] = data.args;

            // Get team basic info with leader details
            const {data: team, error: teamError} = await supabaseAdmin
                .from('teams')
                .select(`
                *,
                leader:users!leader_id(id, full_name, email, phone_number, role)
            `)
                .eq('id', team_id)
                .eq('admin_id', await admin_id(user))
                .single();

            if (teamError) {
                return makeResponse({error: teamError.message});
            }

            // Get team members count
            const {data: members, error: membersError} = await supabaseAdmin
                .from('users')
                .select('id, role, is_active')
                .eq('team_id', team_id)
                .eq('admin_id', await admin_id(user));

            if (membersError) {
                return makeResponse({error: membersError.message});
            }

            let simQuery = async (filters: Filter[]) =>
                applyFilters(supabaseAdmin
                    .from('sim_cards')
                    .select('status, match, quality, sale_date, activation_date, top_up_amount', {count: 'exact'})
                    .eq('team_id', team_id)
                    .eq('admin_id', await admin_id(user)), filters);
            const filterConditions: Filter[] = [];
            if (date_from) filterConditions.push(["activation_date", "gte", date_from]);
            if (date_to) filterConditions.push(["activation_date", "lte", date_to]);
            const activation:Filter[] = [
                ["status", SIMStatus.ACTIVATED],
                ["activation_date", "not", "is", null]
            ]

            // const {data: simCards, error: simError} = await simQuery;

            // if (simError) {
            //     return makeResponse({error: simError.message});
            // }

            const sim_cards = {
                total: (await simQuery(filterConditions)).count ?? 0,
                activated: (await simQuery([...filterConditions,
                    ["status", SIMStatus.ACTIVATED],
                    ["activation_date", "not", "is", null]
                ])).count ?? 0,
                pending: (await simQuery([...filterConditions,
                    ["status", SIMStatus.PENDING]])).count ?? 0,
                matched: (await simQuery([...filterConditions,
                    ["match", SIMStatus.MATCH],...activation])).count ?? 0,
                quality: (await simQuery([...filterConditions,
                    ["quality", SIMStatus.QUALITY],...activation])).count ?? 0,
                non_quality: (await simQuery([...filterConditions,
                    ["quality", SIMStatus.NONQUALITY],...activation])).count ?? 0,
                // total_revenue: this * 300
            }

            // Calculate statistics
            const stats = {
                team_info: team,
                members: {
                    total: members.length,
                    active: members.filter(m => m.is_active).length,
                    inactive: members.filter(m => !m.is_active).length,
                    by_role: {
                        van_staff: members.filter(m => m.role === 'VAN_STAFF').length,
                        mpesa_agents: members.filter(m => m.role === 'MPESA_ONLY_AGENT').length,
                        non_mpesa_agents: members.filter(m => m.role === 'NON_MPESA_AGENT').length
                    }
                },
                sim_cards,
                rates: {
                    activation_rate:  Math.floor(sim_cards.total > 0 ? (sim_cards.activated / sim_cards.total) * 100 : 0),
                    match_rate: Math.floor(sim_cards.total > 0 ? (sim_cards.matched / sim_cards.activated) * 100 : 0),
                    quality_rate:  Math.floor(sim_cards.total > 0 ?
                        (sim_cards.quality / sim_cards.activated) * 100 : 0),
                    non_quality_rate:  Math.floor(sim_cards.total > 0 ?
                        (sim_cards.non_quality / sim_cards.activated) * 100 : 0)
                }
            };

            return makeResponse({ok: true, data: stats});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }
}

export default TeamActions;