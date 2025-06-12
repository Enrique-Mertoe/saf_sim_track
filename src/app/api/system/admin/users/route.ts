import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get all users with their details
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, status, created_at, last_login_at, is_active');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { message: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Get active subscriptions for all users
    const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
      .from('subscription_status')
      .select('user_id')
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString());

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return NextResponse.json(
        { message: 'Failed to fetch subscription data' },
        { status: 500 }
      );
    }

    // Create a set of user IDs with active subscriptions for faster lookup
    const activeSubscriptionUserIds = new Set(
      subscriptions.map(subscription => subscription.user_id)
    );

    // Combine user data with subscription status
    const usersWithSubscriptionStatus = users.map(user => ({
      ...user,
      has_subscription: activeSubscriptionUserIds.has(user.id)
    }));

    return NextResponse.json({ users: usersWithSubscriptionStatus });
  } catch (error) {
    console.error('Users list error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
