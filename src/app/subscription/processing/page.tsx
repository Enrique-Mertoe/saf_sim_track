"use client";

import React, {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import axios from 'axios';

export default function PaymentProcessingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');

  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('Please complete the payment on your phone...');
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    if (!reference) {
      router.push('/subscribe');
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const response = await axios.get(`/api/payments/status?reference=${reference}`);

        if (response.data.payment_status === 'completed') {
          setStatus('success');
          setMessage('Payment successful! Redirecting to dashboard...');

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        } else if (response.data.payment_status === 'failed') {
          setStatus('failed');
          setMessage(response.data.message || 'Payment failed. Please try again.');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        // Don't set status to failed here, as the error might be temporary
      }
    };

    // Check status immediately and then every 5 seconds
    checkPaymentStatus();
    const interval = setInterval(checkPaymentStatus, 5000);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          if (status === 'pending') {
            setStatus('failed');
            setMessage('Payment timed out. Please try again.');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [reference, router, status]);

  // Format countdown as MM:SS
  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-6">Payment Processing</h1>

        {status === 'pending' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">
              Please complete the payment request on your phone. This page will update automatically.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Time remaining: <span className="font-medium">{formatCountdown()}</span>
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium">{message}</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{message}</p>
            <button
              className="mt-6 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md"
              onClick={() => router.push('/subscribe')}
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}