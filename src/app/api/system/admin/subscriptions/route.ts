import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get all subscription plans
    const { data: plans, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      return NextResponse.json(
        { message: 'Failed to fetch subscription plans' },
        { status: 500 }
      );
    }

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Subscription plans error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || data.price_monthly === undefined || data.price_annual === undefined) {
      return NextResponse.json(
        { success: false, message: 'Name, monthly price, and annual price are required' },
        { status: 400 }
      );
    }

    // If a plan is marked as recommended, unmark all other plans
    if (data.is_recommended) {
      const { error: updateError } = await supabaseAdmin
        .from('subscription_plans')
        .update({ is_recommended: false })
        .eq('is_recommended', true);

      if (updateError) {
        console.error('Error updating recommended status:', updateError);
        return NextResponse.json(
          { success: false, message: 'Failed to update recommended status' },
          { status: 500 }
        );
      }
    }

    // Create new subscription plan
    const { data: plan, error } = await supabaseAdmin
      .from('subscription_plans')
      .insert({
        name: data.name,
        description: data.description || null,
        price_monthly: data.price_monthly,
        price_annual: data.price_annual,
        features: data.features || [],
        is_recommended: data.is_recommended || false,
        is_active: data.is_active !== undefined ? data.is_active : true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription plan:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create subscription plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Subscription plan creation error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}