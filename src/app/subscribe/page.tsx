"use client";

import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
import axios from 'axios';
import SubscriptionCard from "@/ui/components/SubScriptionCard";
import PaymentModal from "@/ui/components/PayMentModal";
import useApp from "@/ui/provider/AppProvider";

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
        id: 'starter',
        name: 'Starter Plan',
        price: 1999,
        duration: 1,
        features: [
            'Up to 5 team members',
            'Basic SIM inventory tracking',
            'Monthly sales reports',
            'Email support (24-hour response)',
            'Up to 100 SIM activations/month',
            'Basic customer management'
        ]
    },
    {
        id: 'business',
        name: 'Business Plan',
        price: 3999,
        duration: 1,
        features: [
            'Up to 15 team members',
            'Advanced SIM inventory tracking',
            'Real-time sales analytics',
            'Priority email support (12-hour response)',
            'Up to 500 SIM activations/month',
            'Advanced customer management',
            'Bulk SIM registration tools',
            'Commission tracking'
        ],
        recommended: true
    },
    {
        id: 'enterprise',
        name: 'Enterprise Plan',
        price: 7999,
        duration: 1,
        features: [
            'Unlimited team members',
            'Premium SIM inventory management',
            'Advanced analytics & forecasting',
            '24/7 Priority phone support',
            'Unlimited SIM activations',
            'VIP customer management',
            'API access for integration',
            'Custom branding options',
            'Dedicated account manager',
            'Multi-location support'
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
    const [activeTab, setActiveTab] = useState<'monthly' | 'annual'>('monthly');
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
                // If there's a checkout URL, redirect to it
                if (response.data.checkout_url) {
                    window.location.href = response.data.checkout_url;
                } else {
                    // Otherwise, show waiting screen while payment is processing
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

    // Testimonials data
    const testimonials = [
        {
            name: "John Mwangi",
            position: "SIM Card Dealer, Nairobi",
            content: "This platform has revolutionized how I manage my SIM card inventory. The Business plan provides all the tools I need to track sales and manage my team efficiently.",
            avatar: "https://randomuser.me/api/portraits/men/1.jpg"
        },
        {
            name: "Sarah Ochieng",
            position: "Regional Manager, Safaricom Dealer",
            content: "The Enterprise plan has been a game-changer for our multi-location business. The analytics and reporting features have helped us optimize our sales strategy.",
            avatar: "https://randomuser.me/api/portraits/women/2.jpg"
        },
        {
            name: "David Kimani",
            position: "Small Business Owner, Mombasa",
            content: "I started with the Starter plan and it's perfect for my small team. The customer support is excellent and the platform is very user-friendly.",
            avatar: "https://randomuser.me/api/portraits/men/3.jpg"
        }
    ];

    // FAQ data
    const faqs = [
        {
            question: "How does billing work?",
            answer: "You'll be billed monthly or annually depending on your chosen plan. Payments are processed securely via M-Pesa, and you'll receive a receipt via email after each payment."
        },
        {
            question: "Can I upgrade my plan later?",
            answer: "Yes, you can upgrade your plan at any time. The price difference will be prorated for the remainder of your billing cycle."
        },
        {
            question: "Is there a free trial available?",
            answer: "We don't currently offer a free trial, but we do offer a 7-day money-back guarantee if you're not satisfied with our service."
        },
        {
            question: "What happens if I need to cancel my subscription?",
            answer: "You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your current billing period."
        }
    ];

    return (
        <div className="bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                            Boost Your SIM Card Business
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
                            Choose the perfect plan to manage your Safaricom SIM card dealership efficiently and grow
                            your business.
                        </p>
                    </div>
                </div>
            </div>

            {/* Subscription Status */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {
                    // user.subscription && user.subscription.status === 'active'
                    //   &&
                    (
                        <div className="mb-8 p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-green-700 flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
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
                        <div className="mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-yellow-700 flex items-center">
                                <svg className="h-5 w-5 text-yellow-500 mr-2" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                </svg>
                                Your subscription has expired. Please renew to continue using all features.
                            </p>
                        </div>
                    )}

                {/* Pricing Toggle */}
                <div className="flex justify-center mb-8">
                    <div className="relative bg-white rounded-lg p-1 flex shadow-sm">
                        <button
                            onClick={() => setActiveTab('monthly')}
                            className={`relative w-32 py-2 text-sm font-medium rounded-md focus:outline-none ${
                                activeTab === 'monthly'
                                    ? 'bg-green-100 text-green-800'
                                    : 'text-gray-700 hover:text-gray-900'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setActiveTab('annual')}
                            className={`relative w-32 py-2 text-sm font-medium rounded-md focus:outline-none ${
                                activeTab === 'annual'
                                    ? 'bg-green-100 text-green-800'
                                    : 'text-gray-700 hover:text-gray-900'
                            }`}
                        >
                            Annual
                            <span
                                className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-500 text-white">
                Save 15%
              </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {plans.map((plan) => (
                        <SubscriptionCard
                            key={plan.id}
                            plan={{
                                ...plan,
                                price: activeTab === 'annual' ? Math.round(plan.price * 0.85 * 12) : plan.price,
                                duration: activeTab === 'annual' ? 12 : 1
                            }}
                            isCurrentPlan={false}
                            onSelect={handleSelectPlan}
                        />
                    ))}
                </div>

                {/* Features Comparison */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-16">
                    <h2 className="text-2xl font-bold text-center mb-8">Compare Plan Features</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Starter</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-green-600 uppercase tracking-wider">Business</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-purple-600 uppercase tracking-wider">Enterprise</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Team
                                    Members
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Up to 5
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-medium">Up
                                    to 15
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Unlimited</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SIM
                                    Activations
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">100/month</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-medium">500/month</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Unlimited</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Support</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Email
                                    (24h)
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-medium">Priority
                                    (12h)
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">24/7
                                    Phone
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">API
                                    Access
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                                    <svg className="h-5 w-5 text-red-500 mx-auto" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                                    <svg className="h-5 w-5 text-red-500 mx-auto" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                                    <svg className="h-5 w-5 text-green-500 mx-auto" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M5 13l4 4L19 7"/>
                                    </svg>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Testimonials */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-center mb-8">What Our Customers Say</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex items-center mb-4">
                                    <img
                                        src={testimonial.avatar}
                                        alt={testimonial.name}
                                        className="h-12 w-12 rounded-full mr-4"
                                    />
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{testimonial.name}</h3>
                                        <p className="text-sm text-gray-500">{testimonial.position}</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 italic">"{testimonial.content}"</p>
                                <div className="mt-4 flex">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor"
                                             viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                        </svg>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                    <div className="bg-white rounded-lg shadow-md divide-y divide-gray-200">
                        {faqs.map((faq, index) => (
                            <div key={index} className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">{faq.question}</h3>
                                <p className="text-gray-600">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-green-600 rounded-lg shadow-xl p-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Ready to grow your SIM card business?</h2>
                    <p className="text-green-100 mb-6 max-w-2xl mx-auto">
                        Join hundreds of successful Safaricom dealers who are using our platform to manage their
                        business efficiently.
                    </p>
                    <button
                        onClick={() => handleSelectPlan(plans.find(p => p.recommended) || plans[1])}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-700 focus:ring-white"
                    >
                        Get Started with Business Plan
                        <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                             fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd"
                                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                                  clipRule="evenodd"/>
                        </svg>
                    </button>
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
    );
}
