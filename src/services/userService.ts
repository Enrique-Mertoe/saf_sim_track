// import {createSupabaseClient} from "@/lib/supabase";
import {User, UserRole, UserUpdate} from "@/models";
import {createSupabaseClient} from "@/lib/supabase/client";
import {admin_id} from "./helper";
import ClientApi from "@/lib/utils/ClientApi";


export const userService = {
    // Get all users (admins only)
    async getAllUsers(user: User) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .select('*')
            .eq("admin_id", await admin_id(user))
            .eq("deleted", false)
            .order('full_name');
    },


    // Get users by role
    async getUsersByRole(role: UserRole, user: User) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .select('*')
            .eq('role', role)
            .eq("admin_id", await admin_id(user))
            .order('full_name');
    },

    // Get users by team
    async getUsersByTeam(teamId: string, user: User) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .select('*')
            .eq('team_id', teamId)
            .eq("admin_id", await admin_id(user))
            .order('full_name');
    },
    async getStaffUsers(teamId: string, user: User) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .select('*')
            .eq('team_id', teamId)
            .eq('role', UserRole.STAFF)
            .eq("admin_id", await admin_id(user))
            .order('full_name');
    },

    // Get a single user by ID
    async getUserById(userId: string, user: User) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .eq("admin_id", await admin_id(user))
            .single();
    },
    async getUserByEmail(email: string, user: User) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq("admin_id", await admin_id(user))
            .single();
    },

    // Get a user by phone number
    async getUserByPhone(phoneNumber: string, user: User) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .select('*')
            .eq('phone_number', phoneNumber)
            .eq("admin_id", await admin_id(user))
            .single();
    },

    // Get a user by username
    async getUserByUsername(username: string, user: User) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .select('*')
            .eq("admin_id", await admin_id(user))
            .eq('username', username)
            .single();
    },

    // Check if credentials exist (email, phone, or username)
    async checkCredentialExists(type: 'email' | 'phone' | 'username', value: string) {
        const supabase = createSupabaseClient();
        let field = '';

        switch (type) {
            case 'email':
                field = 'email';
                break;
            case 'phone':
                field = 'phone_number';
                break;
            case 'username':
                field = 'username';
                break;
        }

        const {data, error} = await supabase
            .from('users')
            .select('id')
            .eq(field, value);

        return {
            exists: data && data.length > 0,
            error
        };
    },
    // Update an existing user
    async updateUser(userId: string, userData: UserUpdate, user: User) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .update(userData)
            .eq('id', userId)
            .eq("admin_id", await admin_id(user))
            .select()
            .single();
    },

    // Suspend/unsuspend a user
    async toggleUserStatus(userId: string, isActive: boolean, user: User) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .update({is_active: isActive})
            .eq('id', userId)
            .eq("admin_id", await admin_id(user));
    },
    async deleteUser<T>(id: string, user?: User) {
        const data = {};
        if (user) {
            //@ts-ignore
            data['admin_id'] = await admin_id(user);
            // data['auth_user'] = user.auth_;
        }
        return await new Promise((resolve: ({data, error}: { data?: T, error?: any }) => void) => {
            ClientApi.of("admin")
                .get().del_user({
                id, ...data
            }).then((response) => {
                if (response.ok)
                    resolve({data: response.data as T});
                else
                    resolve({error: response.message});
            }).catch((error) => {
                resolve({error: new Error(error.message)});
            })
        })
        // const supabase = createSupabaseClient();
        // const query = supabase.from("users").delete();
        //
        // // Add admin_id check if user is provided
        // if (user) {
        //     query.eq("admin_id", await admin_id(user));
        // }
        //
        // return query.eq('id', id).select();
    }
};
