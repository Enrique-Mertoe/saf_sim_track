import { createSupabaseClient } from "@/lib/supabase/client";
import {TeamCreate, TeamUpdate} from "@/models";

export const teamService = {
    // Get all teams
    async getAllTeams() {
        const supabase = createSupabaseClient();
        console.log("f_teams")
        return supabase
            .from('teams')
            .select('*, leader_id(*)')
            .order('name');
    },
    async count() {
        const supabase = createSupabaseClient();
        const {count: teamTotal} = await supabase
            .from('teams')
            .select('*', {count: 'exact', head: true});
        return teamTotal || 0;
    },

    // Get a single team by ID with leader info
    async getTeamById(teamId: string) {
        const supabase = createSupabaseClient();
        return supabase
            .from('teams')
            .select('*, users!leader_id(full_name)')
            .eq('id', teamId)
            .single();
    },

    // Get team hierarchy with team members
    async getTeamHierarchy(teamId: string) {
        const supabase = createSupabaseClient();
        return supabase
            .rpc('get_team_hierarchy', {in_team_id: teamId});
    },

    // Create a new team
    async createTeam(teamData: TeamCreate) {
        const supabase = createSupabaseClient();
        return supabase
            .from('teams')
            .insert(teamData)
            .select()
    },


    // Update an existing team
    async updateTeam(teamId: string, teamData: TeamUpdate) {
        const supabase = createSupabaseClient();
        return supabase
            .from('teams')
            .update(teamData)
            .eq('id', teamId)
            .select()
            .single();
    },

    // Get team performance metrics
    async getTeamPerformance(teamId: string, period?: string) {
        const supabase = createSupabaseClient();
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
        let query = supabase
            .from('staff_performance')
            .select('*')
            .eq('team_id', teamId);

        if (period) {
            query = query.eq('period', period);
        }

        return query;
    }
};