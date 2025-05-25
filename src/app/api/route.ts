import {NextRequest, NextResponse} from 'next/server';
import {createSuperClient} from '@/lib/supabase/server';

// This endpoint will be called by Intasend when payment completes
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate the webhook payload
    // Intasend webhook payload structure might vary, adjust as needed
    const { reference, status, transaction_id } = body;

    if (!reference || !status) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid webhook payload' },
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

    if (dbError || !paymentRequest) {
      console.error('Database error or payment request not found:', dbError);
      return NextResponse.json(
        { status: 'error', message: 'Payment request not found' },
        { status: 404 }
      );
    }

    // Update the payment status in the database
    let paymentStatus = 'pending';
    if (status === 'COMPLETE' || status === 'PAID') {
      paymentStatus = 'completed';

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
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      paymentStatus = 'failed';
    }

    // Update the payment request
    await supabase
      .from('payment_requests')
      .update({
        status: paymentStatus,
        transaction_id: transaction_id,
        updated_at: new Date().toISOString()
      })
      .eq('reference', reference);

    // Always return success to Intasend
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Intasend from retrying
    return NextResponse.json({ status: 'success' });
  }
}

// Optional: Define which HTTP methods are allowed
export async function GET() {
  return NextResponse.json(
    { status: 'error', message: 'Method not allowed' },
    { status: 405 }
  );
}
