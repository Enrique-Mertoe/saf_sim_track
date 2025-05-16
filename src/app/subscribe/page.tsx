"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import SubscriptionCard from "@/ui/components/SubScriptionCard";
import PaymentModal from "@/ui/components/PayMentModal";
import useApp from "@/ui/provider/AppProvider";
// import Layout from '@/components/Layout';
// import SubscriptionCard from '@/components/subscription/SubscriptionCard';
// import PaymentModal from '@/components/subscription/PaymentModal';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: number; // in months
  features: string[];
  recommended?: boolean;
}

interface SubscriptionPageProps {
  user: {
    userId: string;
    fullName: string;
    role: string;
    subscription?: {
      planId: string;
      status: 'active' | 'expired' | 'canceled';
      expiresAt: string;
    };
  };
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 2999,
    duration: 1,
    features: [
      'Up to 5 team members',
      'Basic SIM tracking',
      'Standard reports',
      'Email support'
    ]
  },
  {
    id: 'standard',
    name: 'Standard Plan',
    price: 4999,
    duration: 1,
    features: [
      'Up to 20 team members',
      'Advanced SIM tracking',
      'Custom reports',
      'Priority email support',
      'Bulk import/export'
    ],
    recommended: true
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 9999,
    duration: 1,
    features: [
      'Unlimited team members',
      'Advanced SIM tracking',
      'Custom reports with analytics',
      '24/7 Priority support',
      'API access',
      'White labeling'
    ]
  }
];

export default function SubscriptionPage() {
    const {user} = useApp()
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Find current plan if user has subscription
  const currentPlan = plans[0]
    ? plans.find(plan => plan.id === plans[0]?.id)
    : null;

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
    setError('');
  };

  const handlePayment = async (phoneNumber: string) => {
    if (!selectedPlan) return;

    setLoading(true);
    setError('');

    try {
      // Initiate payment with Intersend
      const response = await axios.post('/api/payments/initiate', {
        phoneNumber,
        amount: selectedPlan.price,
        planId: selectedPlan.id
      });

      if (response.data.status === 'success') {
        // Show waiting screen while payment is processing
        router.push(`/subscription/processing?reference=${response.data.reference}`);
      } else {
        setError(response.data.message || 'Payment initiation failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while processing your payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div title="Subscription Management">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Subscription Plan
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Select the plan that best fits your team's needs
          </p>

          {
            // user.subscription && user.subscription.status === 'active'
            //   &&
            (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-700">
                You are currently subscribed to the <span
                className="font-semibold">{currentPlan?.name}</span> plan.
                Your subscription expires
                {/*on {new Date(user.subscription.expiresAt).toLocaleDateString()}.*/}
              </p>
            </div>
          )}

          {
            // user.subscription && user.subscription.status === 'expired' &&
              (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-yellow-700">
                Your subscription has expired. Please renew to continue using all features.
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <SubscriptionCard
                key={plan.id}
                plan={plan}
                // isCurrentPlan={user.subscription?.planId === plan.id && user.subscription?.status === 'active'}
                onSelect={handleSelectPlan} isCurrentPlan={false}            />
          ))}
        </div>

        {showPaymentModal && selectedPlan && (
          <PaymentModal
            open={showPaymentModal}
            onClose={handleCloseModal}
            plan={selectedPlan}
            onSubmit={handlePayment}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  );
}