import {NextRequest, NextResponse} from 'next/server';
import {staffAuthService} from '@/services/staffAuthService';
import {createSuperClient} from '@/lib/supabase/server';
import {UserRole} from "@/models";

/**
 * POST /api/users/reset-password
 *
 * Resets a user's password to their username and sets is_first_login to true
 *
 * Request body:
 * {
 *   "userId": string
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body || !body.userId) {
            return NextResponse.json(
                {success: false, message: 'Missing required fields'},
                {status: 400}
            );
        }

        const {userId} = body;

        // Get the user to retrieve their username
        const supabase = await createSuperClient();
        const {data: user, error: userError} = await supabase
            .from('users')
            .select('username')
            .eq('role', UserRole.STAFF)
            .eq('id', userId)
            .single();

        if (userError || !user || !user.username) {
            return NextResponse.json(
                {success: false, message: 'User not found or username not set'},
                {status: 404}
            );
        }


        // Use the username as the new password
        const newPassword = user.username;
        // Hash the new password
        const hashedPassword = await staffAuthService.hashPassword(newPassword);

        // Update the user's password and set is_first_login to true
        const {error: updateError} = await supabase
            .from('users')
            .update({
                password: hashedPassword,
                is_first_login: true
            })
            .eq('id', userId);
        if (updateError) {
            return NextResponse.json(
                {success: false, message: 'Failed to update password', error: updateError},
                {status: 500}
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        return NextResponse.json(
            {success: false, message: 'Server error'},
            {status: 500}
        );
    }
}