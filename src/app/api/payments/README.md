# Payment Integration with Intasend

This directory contains the API endpoints for integrating with Intasend payment gateway.

## Setup Instructions

### 1. Database Setup

Execute the SQL script in `src/lib/migrations/payment_schema.sql` in the Supabase SQL editor to create the necessary tables:

- `payment_requests`: Stores information about payment requests
- `subscriptions`: Stores information about user subscriptions

### 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```
INTASEND_PUBLIC_KEY=your_intasend_public_key
INTASEND_API_KEY=your_intasend_api_key
NEXT_PUBLIC_APP_URL=your_app_url (e.g., http://localhost:3000 for development)
```

You can obtain the Intasend API keys by signing up at [Intasend](https://intasend.com) and creating an account.

### 3. Webhook Setup

In your Intasend dashboard, set up a webhook to point to:

```
https://your-domain.com/api
```

This endpoint will receive payment notifications from Intasend.

## API Endpoints

### `/api/payments/initiate`

Initiates a payment with Intasend.

**Method**: POST

**Request Body**:
```json
{
  "phoneNumber": "254712345678",
  "amount": 1999,
  "planId": "starter"
}
```

**Response**:
```json
{
  "status": "success",
  "reference": "unique-reference-id",
  "checkout_url": "https://intasend.com/checkout/..."
}
```

### `/api/payments/status`

Checks the status of a payment.

**Method**: GET

**Query Parameters**:
- `reference`: The unique reference ID for the payment

**Response**:
```json
{
  "status": "success",
  "payment_status": "completed",
  "message": "Payment has been completed"
}
```

## Testing the Payment Flow

1. Navigate to the subscription page
2. Select a plan and click "Select Plan"
3. Enter a phone number in the payment modal and click "Pay Now"
4. You will be redirected to Intasend's checkout page or the processing page
5. Complete the payment on your phone
6. The system will automatically update your subscription status

## Troubleshooting

- If you encounter a 404 error for `/api/payments/initiate`, make sure the API endpoint is properly set up and the server is running.
- If the payment status is not updating, check the Intasend webhook logs to ensure notifications are being sent correctly.
- For any other issues, check the server logs for error messages.