import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// This endpoint will be called by Intersend when payment completes
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    // Validate the webhook payload
    const { reference, status, transaction_id } = req.body;

    if (!reference || !status) {
      return res.status(400).json({ status: 'error', message: 'Invalid webhook payload' });
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
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Intersend from retrying
    return res.status(200).json({ status: 'success' });
  }
}