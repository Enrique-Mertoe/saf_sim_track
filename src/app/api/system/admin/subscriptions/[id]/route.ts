import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: any
) {
  const {id} = await params
  try {
    const data = await request.json();

    // Check if plan exists
    const { data: existingPlan, error: fetchError } = await supabaseAdmin
      .from('subscription_plans')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPlan) {
      console.error('Error fetching subscription plan:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    // If a plan is being marked as recommended, unmark all other plans
    if (data.is_recommended) {
      const { error: updateError } = await supabaseAdmin
        .from('subscription_plans')
        .update({ is_recommended: false })
        .neq('id', id)
        .eq('is_recommended', true);

      if (updateError) {
        console.error('Error updating recommended status:', updateError);
        return NextResponse.json(
          { success: false, message: 'Failed to update recommended status' },
          { status: 500 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price_monthly !== undefined) updateData.price_monthly = data.price_monthly;
    if (data.price_annual !== undefined) updateData.price_annual = data.price_annual;
    if (data.features !== undefined) updateData.features = data.features;
    if (data.is_recommended !== undefined) updateData.is_recommended = data.is_recommended;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    // Update the plan
    const { data: updatedPlan, error: updateError } = await supabaseAdmin
      .from('subscription_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subscription plan:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update subscription plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: updatedPlan
    });
  } catch (error) {
    console.error('Subscription plan update error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  const {id} = await params
  try {
    // Check if plan exists
    const { data: existingPlan, error: fetchError } = await supabaseAdmin
      .from('subscription_plans')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPlan) {
      console.error('Error fetching subscription plan:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    // Check if plan is in use by any subscriptions
    const { count, error: countError } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', id);

    if (countError) {
      console.error('Error checking plan usage:', countError);
      return NextResponse.json(
        { success: false, message: 'Failed to check if plan is in use' },
        { status: 500 }
      );
    }

    if (count && count > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete plan that is in use by subscriptions' },
        { status: 400 }
      );
    }

    // Delete the plan
    const { error: deleteError } = await supabaseAdmin
      .from('subscription_plans')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting subscription plan:', deleteError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete subscription plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription plan deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
