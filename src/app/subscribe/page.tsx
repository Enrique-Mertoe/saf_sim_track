"use client";

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import axios from 'axios';
import PaymentModal from "@/ui/components/PayMentModal";
import useApp from "@/ui/provider/AppProvider";
import Header from "@/ui/components/dash/Header";

interface Plan {
    id: string;
    name: string;
    price: number;
    duration: number;
    features: string[];
    recommended?: boolean;
    description?: string;
}

interface SubscriptionPageProps {
    user: {
        id: string;
        full_name: string;
        role: string;
        subscription?: {
            id: string;
            user_id: string;
            plan_id: string;
            status: string;
            starts_at: string;
            expires_at: string;
            payment_reference?: string;
            auto_renew?: boolean;
            cancellation_date?: string;
            cancellation_reason?: string;
        };
    };
}

export default function SubscriptionPage() {
    const {user} = useApp()
    const router = useRouter();
    // Plans will be fetched from the database
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'monthly' | 'annual'>('monthly');
    const [subscriptionAction, setSubscriptionAction] = useState<'new' | 'renew'>('new');

    const currentPlan = plans[0]
        ? plans.find(plan => plan.id === plans[0]?.id)
        : null;

    // Fetch subscription plans from the database
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await axios.get('/api/subscriptions/plans');
                if (response.data.plans) {
                    // Transform the data to match the Plan interface
                    const formattedPlans = response.data.plans.map((plan: any) => ({
                        id: plan.id,
                        name: plan.name,
                        price: activeTab === 'monthly' ? plan.price_monthly : plan.price_annual,
                        duration: activeTab === 'monthly' ? 1 : 12,
                        features: Array.isArray(plan.features) ? plan.features : [],
                        recommended: plan.is_recommended,
                        description: plan.description
                    }));
                    setPlans(formattedPlans);
                }
            } catch (error) {
                console.error('Error fetching subscription plans:', error);
            }
        };

        fetchPlans();
    }, [activeTab]);

    // Check for plan and action parameters in URL when component mounts
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const planId = urlParams.get('plan');
            const action = urlParams.get('action');

            // Set subscription action based on URL parameter
            if (action === 'renew') {
                setSubscriptionAction('renew');
            } else {
                setSubscriptionAction('new');
            }

            if (planId && user && plans.length > 0) {
                // Find the plan with the matching ID
                const selectedPlan = plans.find(plan => plan.id === planId);
                if (selectedPlan) {
                    // Automatically select the plan
                    setSelectedPlan(selectedPlan);
                    setShowPaymentModal(true);
                }
            }
        }
    }, [user, plans]);

    const handleSelectPlan = (plan: Plan) => {
        if (!user) {
            // Redirect to login page with the selected plan as a query parameter
            router.push(`/login?redirect=subscribe&plan=${plan.id}`);
            return;
        }

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
            const response = await axios.post('/api/payments/initiate', {
                phoneNumber,
                amount: selectedPlan.price,
                planId: selectedPlan.id
            });

            if (response.data.status === 'success') {
                if (response.data.checkout_url) {
                    window.location.href = response.data.checkout_url;
                } else {
                    router.push(`/subscription/processing?reference=${response.data.reference}`);
                }
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
        <>
            <Header />
            <div className="bg-gray-50 max-sm:pt-30 pt-16 min-h-screen">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {subscriptionAction === 'renew' 
                                ? 'Renew or Change Your Plan' 
                                : 'Choose Your Plan'}
                        </h1>
                        <p className="text-gray-600 text-sm">
                            {subscriptionAction === 'renew'
                                ? 'Your subscription has expired. Renew or select a different plan to continue.'
                                : 'Select the perfect plan for your SIM card business'}
                        </p>
                    </div>

                    {/* Billing Toggle */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-white rounded-lg p-1 flex shadow-sm border">
                            <button
                                onClick={() => setActiveTab('monthly')}
                                className={`px-4 py-2 text-sm font-medium rounded-md ${
                                    activeTab === 'monthly'
                                        ? 'bg-green-500 text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setActiveTab('annual')}
                                className={`px-4 py-2 text-sm font-medium rounded-md relative ${
                                    activeTab === 'annual'
                                        ? 'bg-green-500 text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Annual
                                <span className="absolute -top-1 -right-1 px-1 py-0.5 text-xs font-bold rounded bg-orange-400 text-white">
                                    -15%
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`bg-white rounded-lg border-2 p-4 relative ${
                                    plan.recommended
                                        ? 'border-green-500 shadow-lg'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                {plan.recommended && (
                                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                            Recommended
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-4">
                                    <h3 className="font-semibold text-gray-900 mb-1">{plan.name}</h3>
                                    <div className="mb-2">
                                        <span className="text-2xl font-bold text-gray-900">
                                            KSh {activeTab === 'annual' ? Math.round(plan.price * 0.85 * 12).toLocaleString() : plan.price.toLocaleString()}
                                        </span>
                                        <span className="text-gray-500 text-sm">
                                            /{activeTab === 'annual' ? 'year' : 'month'}
                                        </span>
                                    </div>
                                </div>

                                <ul className="space-y-1 mb-4 text-sm">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center text-gray-600">
                                            <svg className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSelectPlan(plan)}
                                    className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
                                        plan.recommended
                                            ? 'bg-green-500 text-white hover:bg-green-600'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                    }`}
                                >
                                    {subscriptionAction === 'renew' 
                                        ? (plan.recommended ? 'Select This Plan' : 'Change to This Plan') 
                                        : 'Get Started'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Quick FAQ */}
                    <div className="bg-white rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-900 mb-3 text-center">Quick FAQ</h3>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-medium text-gray-700">Can I upgrade later?</p>
                                <p className="text-gray-600">Yes, upgrade anytime with prorated billing.</p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-700">Payment method?</p>
                                <p className="text-gray-600">Secure M-Pesa payments with instant receipt.</p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-700">Cancel anytime?</p>
                                <p className="text-gray-600">Yes, cancel from account settings anytime.</p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-700">Money-back guarantee?</p>
                                <p className="text-gray-600">7-day money-back guarantee available.</p>
                            </div>
                        </div>
                    </div>
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
        </>
    );
}
