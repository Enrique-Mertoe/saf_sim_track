import {NextRequest, NextResponse} from 'next/server';
import {supabaseAdmin} from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: any
) {
  const {id} = await params
  try {
    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, status, created_at, last_login_at, phone_number, is_active')
      .eq('id', id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's active subscription
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('subscription_status')
      .select(`
        *, 
        subscription_plans:plan_id (name)
      `)
      .eq('user_id', id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error fetching subscription:', subscriptionError);
      return NextResponse.json(
        { message: 'Error fetching subscription data' },
        { status: 500 }
      );
    }

    // Get all subscription plans
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('subscription_plans')
      .select('id, name, description, price_monthly, price_annual, is_recommended')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (plansError) {
      console.error('Error fetching plans:', plansError);
      return NextResponse.json(
        { message: 'Error fetching subscription plans' },
        { status: 500 }
      );
    }

    // Format subscription data if it exists
    const subscription = subscriptionData ? {
      id: subscriptionData.id,
      plan_id: subscriptionData.plan_id,
      plan_name: subscriptionData.subscription_plans.name,
      start_date: subscriptionData.starts_at,
      end_date: subscriptionData.expires_at,
      is_active: subscriptionData.status === 'active' && new Date(subscriptionData.expires_at) > new Date(),
      billing_type: subscriptionData.payment_details?.billing_type || 'monthly'
    } : null;

    return NextResponse.json({
      user,
      subscription,
      plans
    });
  } catch (error) {
    console.error('User details error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }:any 
) {
  const {id} = await params
  try {
    const data = await request.json();

    // Validate the data
    if (!data.status) {
      return NextResponse.json(
        { success: false, message: 'Status is required' },
        { status: 400 }
      );
    }

    // Update user status
    const { error } = await supabaseAdmin
      .from('users')
      .update({ status: data.status })
      .eq('id', id);

    if (error) {
      console.error('Error updating user status:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update user status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
