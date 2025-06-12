import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      console.error('Error fetching users count:', usersError);
      return NextResponse.json(
        { message: 'Failed to fetch users count' },
        { status: 500 }
      );
    }

    // Get active subscriptions count
    const { count: activeSubscriptions, error: subscriptionsError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString());

    if (subscriptionsError) {
      console.error('Error fetching subscriptions count:', subscriptionsError);
      return NextResponse.json(
        { message: 'Failed to fetch subscriptions count' },
        { status: 500 }
      );
    }

    // Get total plans count
    const { count: totalPlans, error: plansError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*', { count: 'exact', head: true });

    if (plansError) {
      console.error('Error fetching plans count:', plansError);
      return NextResponse.json(
        { message: 'Failed to fetch plans count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      totalPlans: totalPlans || 0
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}