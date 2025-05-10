import {createSupabaseClient} from "@/lib/supabase/client";
import {authService} from "./authService";
import {SecurityActivity} from "@/types";

const supabase = createSupabaseClient();
export const securityService = {
    // Two-factor authentication
    enableTwoFactor: async (method: 'email' | 'sms', identifier?: string): Promise<{
        success: boolean,
        verificationId?: string
    }> => {
        const {user} = await authService.getCurrentUser();
        if (!user) throw new Error('No authenticated user found');

        // First update the user's preference in the database
        const {error} = await supabase
            .from('user_security_settings')
            .upsert({
                user_id: user.id,
                two_factor_enabled: true,
                two_factor_method: method,
            });

        if (error) throw error;

        // If method is SMS, we need to verify the phone number
        if (method === 'sms' && identifier) {
            // This would integrate with a 3rd party SMS service or Supabase's phone auth
            // For this example, we're just simulating the process
            const {data, error} = await supabase
                .from('two_factor_verifications')
                .insert({
                    user_id: user.id,
                    method: 'sms',
                    identifier,
                    code: Math.floor(100000 + Math.random() * 900000).toString(), // 6-digit code
                    expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                    verified: false,
                })
                .select();

            if (error) throw error;

            // In a real implementation, send SMS with the code
            return {
                success: true,
                verificationId: data?.[0]?.id
            };
        }

        return {success: true};
    },

    disableTwoFactor: async (): Promise<void> => {
        const {user} = await authService.getCurrentUser();
        if (!user) throw new Error('No authenticated user found');

        const {error} = await supabase
            .from('user_security_settings')
            .upsert({
                user_id: user.id,
                two_factor_enabled: false,
            });

        if (error) throw error;
    },

    verifyTwoFactorCode: async (verificationId: string, code: string): Promise<boolean> => {
        const {data, error} = await supabase
            .from('two_factor_verifications')
            .select('*')
            .eq('id', verificationId)
            .eq('code', code)
            .gt('expires_at', new Date())
            .single();

        if (error || !data) return false;

        // Mark verification as complete
        await supabase
            .from('two_factor_verifications')
            .update({verified: true})
            .eq('id', verificationId);

        // Update user's two factor status to verified
        const {user} = await authService.getCurrentUser();
        if (user) {
            await supabase
                .from('user_security_settings')
                .upsert({
                    user_id: user.id,
                    two_factor_enabled: true,
                    two_factor_verified: true,
                });
        }

        return true;
    },

    sendTwoFactorCode: async (method: 'email' | 'sms'): Promise<{ success: boolean, verificationId: string }> => {
        const {user} = await authService.getCurrentUser();
        if (!user) throw new Error('No authenticated user found');

        // Get the user's contact information
        const {data: settings} = await supabase
            .from('user_security_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (!settings) throw new Error('User settings not found');

        // Generate verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

        // Store verification in database
        const {data, error} = await supabase
            .from('two_factor_verifications')
            .insert({
                user_id: user.id,
                method,
                code,
                expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                verified: false,
            })
            .select();

        if (error) throw error;

        // In a real implementation, this would send the code via the chosen method
        // For email, you might use a service like SendGrid, Mailgun, etc.

        return {success: true, verificationId: data[0].id};
    },

    // Security activity tracking
    getSecurityActivity: async (): Promise<SecurityActivity> => {
        const {user} = await authService.getCurrentUser();
        if (!user) throw new Error('No authenticated user found');

        const {data, error} = await supabase
            .from('user_security_activity')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGNF') throw error;

        return {
            lastPasswordChange: data?.last_password_change ? new Date(data.last_password_change) : null,
            lastLogin: data?.last_login ? new Date(data.last_login) : null,
            activeSessions: data?.active_sessions || 0,
        };
    },

    updateLastPasswordChange: async (): Promise<void> => {
        const {user} = await authService.getCurrentUser();
        if (!user) throw new Error('No authenticated user found');

        const {error} = await supabase
            .from('user_security_activity')
            .upsert({
                user_id: user.id,
                last_password_change: new Date().toISOString(),
            });

        if (error) throw error;
    },

    updateLastLogin: async (): Promise<void> => {
        const {user} = await authService.getCurrentUser();
        if (!user) throw new Error('No authenticated user found');
        const date = new Date().toISOString();
        const {error} = await supabase
            .from('user_security_activity')
            .upsert({
                user_id: user.id,
                last_login: date,
            }, {onConflict: "user_id"});
        console.log(error)

        if (error) throw error;
    },

    getActiveSessions: async (): Promise<{ device: string, lastActive: Date, ipAddress: string }[]> => {
        const {user} = await authService.getCurrentUser();
        if (!user) throw new Error('No authenticated user found');

        const {data, error} = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('last_active', {ascending: false});

        if (error) throw error;

        return (data || []).map(session => ({
            device: session.device_info,
            lastActive: new Date(session.last_active),
            ipAddress: session.ip_address,
        }));
    },

    terminateSession: async (sessionId: string): Promise<void> => {
        const {user} = await authService.getCurrentUser();
        if (!user) throw new Error('No authenticated user found');

        const {error} = await supabase
            .from('user_sessions')
            .delete()
            .eq('id', sessionId)
            .eq('user_id', user.id);

        if (error) throw error;

        // Update active sessions count
        await securityService.updateActiveSessions();
    },

    terminateAllOtherSessions: async (): Promise<void> => {
        const {user} = await authService.getCurrentUser();
        if (!user) throw new Error('No authenticated user found');

        // Get current session id (in a real app, you'd store this in local storage)
        const currentSessionId = 'current-session-id';

        const {error} = await supabase
            .from('user_sessions')
            .delete()
            .eq('user_id', user.id)
            .neq('id', currentSessionId);

        if (error) throw error;

        // Update active sessions count
        await securityService.updateActiveSessions();
    },

    updateActiveSessions: async (): Promise<void> => {
        const {user} = await authService.getCurrentUser();
        if (!user) throw new Error('No authenticated user found');

        // Count sessions
        const {count, error} = await supabase
            .from('user_sessions')
            .select('*', {count: 'exact', head: true})
            .eq('user_id', user.id);

        if (error) throw error;

        // Update count in activity
        await supabase
            .from('user_security_activity')
            .upsert({
                user_id: user.id,
                active_sessions: count || 0,
            });
    },
};