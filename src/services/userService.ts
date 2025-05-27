// import {createSupabaseClient} from "@/lib/supabase";
import {UserRole, UserUpdate} from "@/models";
import {createSupabaseClient} from "@/lib/supabase/client";

export const userService = {
    // Get all users (admins only)
    async getAllUsers() {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .select('*')
            .order('full_name');
    },


    // Get users by role
    async getUsersByRole(role: UserRole) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .select('*')
            .eq('role', role)
            .order('full_name');
    },

    // Get users by team
    async getUsersByTeam(teamId: string) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .select('*')
            .eq('team_id', teamId)
            .order('full_name');
    },

    // Get a single user by ID
    async getUserById(userId: string) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
    },
    async getUserByEmail(email: string) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
    },
    // Update an existing user
    async updateUser(userId: string, userData: UserUpdate) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .update(userData)
            .eq('id', userId)
            .select()
            .single();
    },

    // Suspend/unsuspend a user
    async toggleUserStatus(userId: string, isActive: boolean) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .update({is_active: isActive})
            .eq('id', userId);
    },
    async deleteUser(id: string) {
        return {data: {}, error: {}}
    }
};