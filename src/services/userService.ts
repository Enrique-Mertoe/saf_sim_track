// import {createSupabaseClient} from "@/lib/supabase";
import {UserCreate, UserRole, UserUpdate} from "@/models";
import {createServerSupabaseClient} from "@/lib/server-supabase";
import { createSupabaseClient } from "@/lib/supabase/client";

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
    // Create a new user (server-side only)
    async createUser(userData: UserCreate) {
        const serverSupabase = createServerSupabaseClient();

        try {
            // First create the auth user
            const {data: authData, error: authError} = await serverSupabase.auth.admin.createUser({
                email: userData.email,
                password: userData.password,
                email_confirm: true,
            });
            if (authError) {
                return {data: null, error: authError};
            }
            try {
                // Then create the profile record
                const {data, error} = await serverSupabase
                    .from('users')
                    .insert({
                        id: authData.user.id,
                        auth_user_id: authData.user.id,
                        email: userData.email,
                        full_name: userData.full_name,
                        id_number: userData.id_number,
                        id_front_url: userData.id_front_url,
                        id_back_url: userData.id_back_url,
                        phone_number: userData.phone_number,
                        mobigo_number: userData.mobigo_number,
                        role: userData.role,
                        team_id: userData.team_id,
                        staff_type: userData.staff_type,
                    })
                    .select()
                    .single();

                if (error) {
                    // If profile creation fails, delete the auth user to maintain consistency
                    await serverSupabase.auth.admin.deleteUser(authData.user.id);
                    return {data: null, error};
                }

                return {data, error: null};
            } catch (profileError) {
                // Clean up auth user if any exception occurs during profile creation
                await serverSupabase.auth.admin.deleteUser(authData.user.id);
                return {data: null, error: profileError};
            }
        } catch (error) {
            return {data: null, error};
        }
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
    }
};