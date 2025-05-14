import {securityService} from "@/services/securityService";
import {createSupabaseClient} from "@/lib/supabase/client";

export const authService = {
    // Sign in a user
    async signIn(email: string, password: string) {
        const supabase = createSupabaseClient();
        const res = await supabase.auth.signInWithPassword({email, password});
        if (res.error)
            return res
        if (res.data.user) {
            await securityService.updateLastLogin();
        }
        return res
    },
    // Sign out the current user
    async signOut() {
        const supabase = createSupabaseClient();
        return await supabase.auth.signOut();
    },


    // Get the current user from session
    async getCurrentUser() {
        const supabase = createSupabaseClient();
        const {data, error} = await supabase.auth.getUser();
        console.log(data, error)
        if (error || !data.user) {
            return {user: null, error};
        }

        // Get user profile data
        const {data: profile, error: profileError} = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
        return {
            user: profile,
            error: profileError
        };
    },


    // Update a user's last login timestamp
    async updateLastLogin(userId: string) {
        const supabase = createSupabaseClient();
        return supabase
            .from('users')
            .update({last_login_at: new Date().toISOString()})
            .eq('id', userId);
    },

    // Reset password functionality
    async resetPassword(email: string) {
        const supabase = createSupabaseClient();
        return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/accounts/recover`,
        });
    },

    async changePassword(password: string) {
        const supabase = createSupabaseClient();
        return supabase.auth.updateUser({password});
    },
    updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        const supabase = createSupabaseClient();
        // First verify the current password
        const {user} = await authService.getCurrentUser();
        if (!user || !user.email) throw new Error('No authenticated user found');

        // Try to sign in with current credentials to verify current password
        try {
            await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });
        } catch {
            throw new Error('Current password is incorrect');
        }

        // Update password
        const {error} = await supabase.auth.updateUser({password: newPassword});

        if (error) throw error;

        // Update last password change timestamp
        await securityService.updateLastPasswordChange();
    },
    signWithToken: async ({access_token, refresh_token}: any) => {
        const supabase = createSupabaseClient();
        return await supabase.auth.setSession({access_token, refresh_token});
    },
    tokenAuthorise(hash: string) {
        const params = new URLSearchParams(hash.replace(/^#/, ''));

        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        // const type = params.get('type');
        if (access_token && refresh_token) {
            return authService.signWithToken({access_token, refresh_token})
        }
        return {data: null, error: "InValid operation"}
    }
};