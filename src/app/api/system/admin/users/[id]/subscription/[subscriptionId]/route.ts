import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  const {id, subscriptionId} = await params
  try {
    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if subscription exists and belongs to the user
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, user_id, status')
      .eq('id', subscriptionId)
      .single();

    if (subscriptionError || !subscription) {
      console.error('Error fetching subscription:', subscriptionError);
      return NextResponse.json(
        { success: false, message: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.user_id !== id) {
      return NextResponse.json(
        { success: false, message: 'Subscription does not belong to this user' },
        { status: 403 }
      );
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Subscription is already inactive or cancelled' },
        { status: 400 }
      );
    }

    // Cancel the subscription
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        cancellation_date: new Date().toISOString(),
        cancellation_reason: 'Cancelled by admin'
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Error deactivating subscription:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
