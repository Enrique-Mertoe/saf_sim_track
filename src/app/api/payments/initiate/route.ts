import {NextRequest, NextResponse} from 'next/server';
import {v4 as uuidv4} from 'uuid';
import {createSuperClient} from '@/lib/supabase/server';
import Accounts from "@/lib/accounts";
import IntaSend from 'intasend-node';
// Intasend API endpoints
const INTASEND_API_URL = 'https://sandbox.intasend.com/api/v1';
const INTASEND_CHECKOUT_URL = `${INTASEND_API_URL}/checkout`;

export async function POST(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json();
        const {phoneNumber, amount, planId} = body;

        // Validate the request
        if (!phoneNumber || !amount || !planId) {
            return NextResponse.json(
                {status: 'error', message: 'Missing required fields'},
                {status: 400}
            );
        }

        // Generate a unique reference for this payment
        const reference = uuidv4();

        // Get the current user
        const supabase = await createSuperClient();
        const user = await Accounts.user()

        if (!user) {
            return NextResponse.json(
                {status: 'error', message: 'User not authenticated'},
                {status: 401}
            );
        }

        const userId = user.id;

        // Store the payment request in the database
        const {error: dbError} = await supabase
            .from('payment_requests')
            .insert({
                reference,
                user_id: userId,
                amount,
                plan_id: planId,
                phone_number: phoneNumber,
                status: 'pending'
            });

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                {status: 'error', message: 'Failed to create payment request'},
                {status: 500}
            );
        }

        // Prepare the request to Intasend
        const intasendPayload = {
            public_key: process.env.INTASEND_PUBLIC_KEY,
            amount,
            currency: 'KES',
            phone_number: phoneNumber,
            email: user.email,
            comment: `Subscription to ${planId} plan`,
            method:"M-PESA",
            api_ref:reference,
            host: "https://safaricom.lomtechnology.com",
            first_name: user.full_name?.split(' ')[0] || '',
            last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
        };


        const intasend = new IntaSend(
            process.env.INTASEND_PUBLISHABLE_KEY,
            process.env.INTASEND_SECRET_KEY,
            process.env.INTASEND_ENVIRONMENT != "production",
        );
        // const IntaSend1 = require("IntaSend")

        const collection = intasend.collection();
        const  response = await collection.charge(intasendPayload);
        // Update the payment request with the Intasend checkout ID
        if (response && response.id) {
            await supabase
                .from('payment_requests')
                .update({
                    provider_id: response.id,
                    checkout_url: response.url
                })
                .eq('reference', reference);
        }

        // Return the response
        return NextResponse.json({
            status: 'success',
            reference,
            checkout_url: response.url
        });
    } catch (error) {
        console.error('Payment initiation error:', error);
        if (error instanceof Buffer){
            console.log(error.toString('base64'))
        }
        return NextResponse.json(
            {
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to initiate payment'
            },
            {status: 500}
        );
    }
}