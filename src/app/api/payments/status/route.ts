import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import {createSuperClient} from '@/lib/supabase/server';

// Intasend API endpoints
const INTASEND_API_URL = 'https://sandbox.intasend.com/api/v1';
const INTASEND_PAYMENT_STATUS_URL = `${INTASEND_API_URL}/payment/status`;

export async function GET(request: NextRequest) {
  try {
    // Get the reference from the query parameters
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { status: 'error', message: 'Reference is required' },
        { status: 400 }
      );
    }

    // Get the payment request from the database
    const supabase = await createSuperClient();
    const { data: paymentRequest, error: dbError } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('reference', reference)
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to retrieve payment request' },
        { status: 500 }
      );
    }

    if (!paymentRequest) {
      return NextResponse.json(
        { status: 'error', message: 'Payment request not found' },
        { status: 404 }
      );
    }

    // If the payment is already marked as completed or failed, return the status
    if (paymentRequest.status === 'completed') {
      return NextResponse.json({
        status: 'success',
        payment_status: 'completed',
        message: 'Payment has been completed'
      });
    }

    if (paymentRequest.status === 'failed') {
      return NextResponse.json({
        status: 'error',
        payment_status: 'failed',
        message: 'Payment has failed'
      });
    }

    // Check the payment status with Intasend
    const response = await axios.get(`${INTASEND_PAYMENT_STATUS_URL}/${paymentRequest.provider_id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.INTASEND_API_KEY}`
      }
    });

    // Update the payment status in the database based on Intasend's response
    let paymentStatus = 'pending';
    let message = 'Payment is still pending';

    if (response.data && response.data.status) {
      if (response.data.status === 'COMPLETE') {
        paymentStatus = 'completed';
        message = 'Payment has been completed';

        // Update the user's subscription
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: paymentRequest.user_id,
            plan_id: paymentRequest.plan_id,
            status: 'active',
            starts_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
          });

        if (subscriptionError) {
          console.error('Subscription update error:', subscriptionError);
        }
      } else if (response.data.status === 'FAILED') {
        paymentStatus = 'failed';
        message = 'Payment has failed';
      }

      // Update the payment request status
      await supabase
        .from('payment_requests')
        .update({
          status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('reference', reference);
    }

    // Return the payment status
    return NextResponse.json({
      status: paymentStatus === 'completed' ? 'success' : 'error',
      payment_status: paymentStatus,
      message
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to check payment status' 
      },
      { status: 500 }
    );
  }
}