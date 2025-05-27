import {securityService} from "@/services/securityService";
import {createSupabaseClient} from "@/lib/supabase/client";
import {notificationService} from "@/services/notificationService";

export const authService = {
    // Sign in a user with email
    async signIn(email: string, password: string) {
        const supabase = createSupabaseClient();
        const res = await supabase.auth.signInWithPassword({email, password});
        if (res.error)
            return res

        if (res.data.user) {
            console.log("no error1", res)
            await securityService.updateLastLogin();
            console.log("no error2", res)

            // Create login notification
            await notificationService.createAuthNotification(
                res.data.user.id,
                'login',
                'You have successfully logged in to your account'
            );
        }
        return res
    },

    // Sign in a user with phone number
    async signInWithPhone(phone: string, password: string) {
        const supabase = createSupabaseClient();

        try {
            // Normalize the phone number by removing any non-digit characters
            const normalizedPhone = phone.replace(/\D/g, '');

            // Extract the last 9 digits for matching (most phone numbers will have at least this)
            const lastNineDigits = normalizedPhone.slice(-9);
            const lastEightDigits = normalizedPhone.slice(-8);

            // Try different phone number formats to increase chances of finding the user
            const phoneFormats = [
                normalizedPhone,                   // Raw digits
                `+${normalizedPhone}`,             // With + prefix
                `+254${lastNineDigits}`,           // Kenya format with last 9 digits
                `0${lastNineDigits}`               // Kenya format with 0 prefix
            ];

            // Find user by trying different phone number formats
            let userData = null;
            let userError = null;

            // First try exact matches with different formats
            for (const phoneFormat of phoneFormats) {
                const result = await supabase
                    .from('users')
                    .select('email, phone_number')
                    .eq('phone_number', phoneFormat)
                    .limit(1);

                if (!result.error && result.data && result.data.length > 0) {
                    userData = result.data[0];
                    break;
                } else {
                    userError = result.error;
                }
            }

            // If no exact match, try partial matching with the last digits
            if (!userData) {
                // Try to match by the last 9 or 8 digits (which are most likely to be consistent)
                const result = await supabase
                    .from('users')
                    .select('email, phone_number')
                    .or(`phone_number.ilike.%${lastNineDigits},phone_number.ilike.%${lastEightDigits}`)
                    .limit(1);

                if (!result.error && result.data && result.data.length > 0) {
                    userData = result.data[0];
                }
            }

            if (!userData || !userData.email) {
                console.log('No user found with phone number:', phone, 'Tried formats:', phoneFormats);
                return {
                    error: {message: 'No account found with this phone number'},
                    data: null
                };
            }

            // Then sign in with the email and password
            const res = await supabase.auth.signInWithPassword({
                email: userData.email,
                password
            });

            if (res.error)
                return res;

            if (res.data.user) {
                await securityService.updateLastLogin();

                // Create login notification
                await notificationService.createAuthNotification(
                    res.data.user.id,
                    'login',
                    'You have successfully logged in to your account'
                );
            }

            return res;
        } catch (error) {
            console.error('Error in signInWithPhone:', error);
            return {
                error: {message: 'Failed to sign in with phone number'},
                data: null
            };
        }
    },
    // Sign out the current user
    async signOut() {
        const supabase = createSupabaseClient();

        try {
            // Get current user before signing out to create notification
            const {user} = await authService.getCurrentUser();

            // Sign out the user
            const result = await supabase.auth.signOut();

            // Create logout notification if we had a user
            if (user && user.id) {
                await notificationService.createAuthNotification(
                    user.id,
                    'logout',
                    'You have been logged out of your account'
                );
            }

            return result;
        } catch (error) {
            console.error("Error during sign out:", error);
            return await supabase.auth.signOut();
        }
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
        const result = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/accounts/recover`,
        });

        // If successful, try to find the user by email to create a notification
        if (!result.error) {
            try {
                // Find user by email
                const {data: userData} = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', email)
                    .single();

                // Create password reset notification if user found
                if (userData && userData.id) {
                    await notificationService.createAuthNotification(
                        userData.id,
                        'password_reset',
                        'A password reset has been requested for your account'
                    );
                }
            } catch (error) {
                console.error("Error creating password reset notification:", error);
            }
        }

        return result;
    },

    async changePassword(password: string) {
        const supabase = createSupabaseClient();
        const result = await supabase.auth.updateUser({password});

        // Create password change notification if successful
        if (!result.error && result.data.user) {
            await notificationService.createAuthNotification(
                result.data.user.id,
                'password_change',
                'Your password has been successfully changed'
            );
        }

        return result;
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

        // Create password change notification
        if (user && user.id) {
            await notificationService.createAuthNotification(
                user.id,
                'password_change',
                'Your password has been successfully updated'
            );
        }
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
