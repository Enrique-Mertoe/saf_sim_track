import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: any
) {
  const {id} = await params
  try {
    const { plan_id, billing_type } = await request.json();

    // Validate the data
    if (!plan_id) {
      return NextResponse.json(
        { success: false, message: 'Plan ID is required' },
        { status: 400 }
      );
    }

    if (!billing_type || !['monthly', 'annual'].includes(billing_type)) {
      return NextResponse.json(
        { success: false, message: 'Valid billing type (monthly or annual) is required' },
        { status: 400 }
      );
    }

    // Get the plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      console.error('Error fetching plan:', planError);
      return NextResponse.json(
        { success: false, message: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Deactivate any existing active subscriptions
    const { error: deactivateError } = await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', id)
      .eq('status', 'active');

    if (deactivateError) {
      console.error('Error deactivating existing subscriptions:', deactivateError);
      return NextResponse.json(
        { success: false, message: 'Failed to deactivate existing subscriptions' },
        { status: 500 }
      );
    }

    // Calculate subscription duration and end date
    const startDate = new Date();
    const endDate = new Date(startDate);

    if (billing_type === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Generate a unique reference for the payment request
    const paymentReference = 'admin_manual_' + Date.now();

    // Create a payment request record
    const { data: paymentRequest, error: paymentError } = await supabaseAdmin
      .from('payment_requests')
      .insert({
        reference: paymentReference,
        user_id: id,
        amount: billing_type === 'monthly' ? plan.price_monthly : plan.price_annual,
        plan_id: plan_id,
        phone_number: user.phone_number || 'admin_added',
        status: 'completed',
        payment_method: 'admin',
        payment_details: { billing_type }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment request:', paymentError);
      return NextResponse.json(
        { success: false, message: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    // Create new subscription
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: id,
        plan_id: plan_id,
        status: 'active',
        starts_at: startDate.toISOString(),
        expires_at: endDate.toISOString(),
        payment_reference: paymentReference,
        auto_renew: false
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      return NextResponse.json(
        { success: false, message: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
