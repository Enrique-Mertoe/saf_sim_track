import {createSupabaseClient} from "@/lib/supabase/client";
import {TeamCreate, TeamUpdate, User, UserRole} from "@/models";
import {admin_id} from "@/services/helper";

async function admin(supabase: any) {
    const {data: currentUser} = await supabase.auth.getUser();
    if (currentUser.user?.role === UserRole.ADMIN) {
        return currentUser.user?.id;
    } else {
        return currentUser.user?.admin_id;
    }

}

export const teamService = {
    async teams(user: User) {
        if (!user) return {data: null, error: true}
        let query = createSupabaseClient()
            .from('teams')
            .select('*, users!leader_id(*)')
            .eq('admin_id', await admin_id(user));

        return query.order('name');
    },
    // Get all teams
    async getAllTeams(userDetails: User | undefined = undefined) {
        const supabase = createSupabaseClient();
        let user: User;
        if (!userDetails) {
            const {data: currentUser} = await supabase.auth.getUser();

            const {data: userDetails1} = await supabase
                .from('users')
                .select('id, role')
                .eq('auth_user_id', currentUser.user?.id)
                .single();

            if (userDetails1) {
                user = userDetails1 as User;
            } else {
                return {data:null,error:true}
            }
        } else {
            user = userDetails
        }

        // Base query
        let query = supabase
            .from('teams')
            .select('*, users!leader_id(*)').eq('admin_id', await admin_id(user));


        return query.order('name');
    },
    async getAllTeamsWithMetadata(userDetails: User | undefined = undefined, metadata: boolean | undefined = undefined) {
        const supabase = createSupabaseClient();

        if (!userDetails) {
            const {data: currentUser} = await supabase.auth.getUser();

            const {data: userDetails1} = await supabase
                .from('users')
                .select('id, role')
                .eq('auth_user_id', currentUser.user?.id)
                .single();

            if (userDetails1) {
                userDetails = userDetails1 as User;
            }
        }

        // Base query
        let query = supabase
            .from('teams')
            .select(metadata
                ? '*, user:users!leader_id(*), batches:batch_metadata!team_id(*)'
                : '*, users!leader_id(*)'
            );

        // Filter for admin-specific teams
        if (userDetails?.role === 'admin') {
            query = query.eq('admin_id', userDetails.id);
        }

        return query.order('name');
    },
    async count() {
        const supabase = createSupabaseClient();
        const {data: currentUser} = await supabase.auth.getUser();

        // Get the user's details including role
        const {data: userDetails} = await supabase
            .from('users')
            .select('id, role')
            .eq('auth_user_id', currentUser.user?.id)
            .single();

        let query = supabase
            .from('teams')
            .select('*', {count: 'exact', head: true});

        // If user is admin, only count teams associated with this admin
        if (userDetails?.role === 'admin') {
            query = query.eq('admin_id', userDetails.id);
        }

        const {count: teamTotal} = await query;
        return teamTotal || 0;
    },

    // Get a single team by ID with leader info
    async getTeamById(teamId: string) {
        const supabase = createSupabaseClient();
        const {data: currentUser} = await supabase.auth.getUser();

        // Get the user's details including role and id
        const {data: userDetails} = await supabase
            .from('users')
            .select('id, role')
            .eq('auth_user_id', currentUser.user?.id)
            .single();

        let query = supabase
            .from('teams')
            .select('*, leader:leader_id(*)')
            .eq('id', teamId);

        // If user is admin, ensure they can only fetch their own teams
        if (userDetails?.role === 'admin') {
            query = query.eq('admin_id', userDetails.id);
        }

        return query.single();
    },

    // Get team hierarchy with team members
    async getTeamHierarchy(teamId: string) {
        const supabase = createSupabaseClient();
        const {data: currentUser} = await supabase.auth.getUser();

        // Get the user's details including role and id
        const {data: userDetails} = await supabase
            .from('users')
            .select('id, role')
            .eq('auth_user_id', currentUser.user?.id)
            .single();

        // If user is admin, ensure they can only fetch their own teams' hierarchy
        if (userDetails?.role === 'admin') {
            // First check if this team belongs to the admin
            const {data: team} = await supabase
                .from('teams')
                .select('id')
                .eq('id', teamId)
                .eq('admin_id', userDetails.id)
                .single();

            // If team doesn't belong to this admin, return empty result
            if (!team) {
                return {data: null, error: {message: 'Team not found or access denied'}};
            }
        }

        return supabase
            .rpc('get_team_hierarchy', {in_team_id: teamId});
    },

    // Create a new team
    async createTeam(teamData: TeamCreate) {
        const supabase = createSupabaseClient();
        const {data: currentUser} = await supabase.auth.getUser();

        // Get the user's details including role and id
        const {data: userDetails} = await supabase
            .from('users')
            .select('id, role')
            .eq('auth_user_id', currentUser.user?.id)
            .single();

        // If the user is an admin, set the admin_id
        if (userDetails?.role === 'admin') {
            teamData = {
                ...teamData,
                admin_id: userDetails.id
            };
        }

        return supabase
            .from('teams')
            .insert(teamData)
            .select()
    },


    // Update an existing team
    async updateTeam(teamId: string, teamData: TeamUpdate) {
        const supabase = createSupabaseClient();
        const {data: currentUser} = await supabase.auth.getUser();

        // Get the user's details including role and id
        const {data: userDetails} = await supabase
            .from('users')
            .select('id, role')
            .eq('auth_user_id', currentUser.user?.id)
            .single();

        let query = supabase
            .from('teams')
            .update(teamData)
            .eq('id', teamId);

        // If user is admin, ensure they can only update their own teams
        if (userDetails?.role === 'admin') {
            query = query.eq('admin_id', userDetails.id);
        }

        return query.select().single();
    },

    // Get team performance metrics
    async getTeamPerformance(teamId: string, period?: string) {
        const supabase = createSupabaseClient();
        const {data: currentUser} = await supabase.auth.getUser();

        // Get the user's details including role and id
        const {data: userDetails} = await supabase
            .from('users')
            .select('id, role')
            .eq('auth_user_id', currentUser.user?.id)
            .single();

        // If user is admin, ensure they can only fetch their own teams' performance
        if (userDetails?.role === 'admin') {
            // First check if this team belongs to the admin
            const {data: team} = await supabase
                .from('teams')
                .select('id')
                .eq('id', teamId)
                .eq('admin_id', userDetails.id)
                .single();

            // If team doesn't belong to this admin, return empty result
            if (!team) {
                return {data: null, error: {message: 'Team not found or access denied'}};
            }
        }

        let query = supabase
            .from('team_performance')
            .select('*')
            .eq('team_id', teamId);

        if (period) {
            query = query.eq('period', period);
        }

        return await query;
    },

    // Get staff performance within a team
    async getStaffPerformance(teamId: string, period?: string) {
        const supabase = createSupabaseClient();
        const {data: currentUser} = await supabase.auth.getUser();

        // Get the user's details including role and id
        const {data: userDetails} = await supabase
            .from('users')
            .select('id, role')
            .eq('auth_user_id', currentUser.user?.id)
            .single();

        // If user is admin, ensure they can only fetch their own teams' staff performance
        if (userDetails?.role === 'admin') {
            // First check if this team belongs to the admin
            const {data: team} = await supabase
                .from('teams')
                .select('id')
                .eq('id', teamId)
                .eq('admin_id', userDetails.id)
                .single();

            // If team doesn't belong to this admin, return empty result
            if (!team) {
                return {data: null, error: {message: 'Team not found or access denied'}};
            }
        }

        let query = supabase
            .from('staff_performance')
            .select('*')
            .eq('team_id', teamId);

        if (period) {
            query = query.eq('period', period);
        }

        return query;
    },

    // Delete a team and all its dependencies
    async deleteTeam(teamId: string) {
        const supabase = createSupabaseClient();
        const {data: currentUser} = await supabase.auth.getUser();

        // Get the user's details including role and id
        const {data: userDetails} = await supabase
            .from('users')
            .select('id, role')
            .eq('auth_user_id', currentUser.user?.id)
            .single();

        // If user is admin, ensure they can only delete their own teams
        if (userDetails?.role === 'admin') {
            // First check if this team belongs to the admin
            const {data: team} = await supabase
                .from('teams')
                .select('id')
                .eq('id', teamId)
                .eq('admin_id', userDetails.id)
                .single();

            // If team doesn't belong to this admin, return error
            if (!team) {
                return {data: null, error: {message: 'Team not found or access denied'}};
            }
        }

        // Use a transaction to ensure all operations are atomic
        // This means either all operations succeed or none do
        const {data, error} = await supabase.rpc('delete_team_with_dependencies', {
            team_id_param: teamId
        });

        if (error) {
            console.error('Error deleting team:', error);
            return {data: null, error};
        }

        return {data, error: null};
    }
};
