import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// This endpoint will be called by Intersend when payment completes
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate the webhook payload
    const { reference, status, transaction_id } = body;

    if (!reference || !status) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Process the payment
    await axios.post(`${process.env.API_URL}/api/subscriptions/confirm-payment`, {
      reference,
      status,
      transactionId: transaction_id,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.API_SECRET_KEY}`
      }
    });

    // Always return success to Intersend
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Intersend from retrying
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