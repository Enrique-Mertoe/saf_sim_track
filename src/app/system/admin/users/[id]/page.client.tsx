"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  last_login_at?: string;
  phone_number?: string;
  is_active: boolean;
}

interface Subscription {
  id: string;
  plan_id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  billing_type: 'monthly' | 'annual';
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  is_recommended: boolean;
}

export default function UserDetailPage({ id }:any) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingType, setBillingType] = useState<'monthly' | 'annual'>('monthly');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`/api/system/admin/users/${id}`);
        setUser(response.data.user);
        setSubscription(response.data.subscription);
        setPlans(response.data.plans);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load user data');
        console.error('User data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return;

    setStatusUpdateLoading(true);
    try {
      const response = await axios.patch(`/api/system/admin/users/${user.id}`, {
        status: newStatus
      });

      if (response.data.success) {
        setUser({
          ...user,
          status: newStatus
        });
      }
    } catch (err: any) {
      console.error('Status update error:', err);
      alert('Failed to update user status: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleAddSubscription = async () => {
    if (!selectedPlan) {
      setSubmitError('Please select a subscription plan');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await axios.post(`/api/system/admin/users/${user?.id}/subscription`, {
        plan_id: selectedPlan,
        billing_type: billingType
      });

      if (response.data.success) {
        setShowSubscriptionModal(false);
        // Refresh user data to show the new subscription
        const updatedData = await axios.get(`/api/system/admin/users/${id}`);
        setUser(updatedData.data.user);
        setSubscription(updatedData.data.subscription);
      } else {
        setSubmitError(response.data.message || 'Failed to add subscription');
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'An error occurred while adding the subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !subscription) return;

    if (!confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/system/admin/users/${user.id}/subscription/${subscription.id}`);

      if (response.data.success) {
        // Refresh user data to show the updated subscription status
        const updatedData = await axios.get(`/api/system/admin/users/${id}`);
        setUser(updatedData.data.user);
        setSubscription(updatedData.data.subscription);
      } else {
        alert('Failed to cancel subscription: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Subscription cancellation error:', err);
      alert('Failed to cancel subscription: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
        {error || 'User not found'}
      </div>
    );
  }

  return (
    <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <Link 
          href="/system/admin/users" 
          className="mr-4 p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg"
        >
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h1>
      </div>

      {/* User Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{user.full_name}</h2>
              <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
            <div className="flex space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                user.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' 
                  : user.role === 'TEAM_LEADER'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {user.role === 'admin' ? 'Admin' : user.role === 'TEAM_LEADER' ? 'Team Leader' : 'Staff'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                user.status === 'ACTIVE' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                  : user.status === 'SUSPENDED'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
              }`}>
                {user.status}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</p>
                  <p className="text-gray-900 dark:text-white">{user.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</p>
                  <p className="text-gray-900 dark:text-white">{user.phone_number || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</p>
                  <p className="text-gray-900 dark:text-white">{new Date(user.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</p>
                  <p className="text-gray-900 dark:text-white">{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</p>
                  <div className="flex items-center mt-1">
                    <select 
                      value={user.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={statusUpdateLoading}
                      className="p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white mr-2"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="PENDING_APPROVAL">Pending Approval</option>
                    </select>
                    {statusUpdateLoading && (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Subscription</h3>
                {user.role === 'admin' && (
                  <button 
                    onClick={() => setShowSubscriptionModal(true)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    {subscription ? 'Change Plan' : 'Add Subscription'}
                  </button>
                )}
              </div>

              {subscription ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{subscription.plan_name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {subscription.billing_type === 'monthly' ? 'Monthly' : 'Annual'} billing
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      subscription.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {subscription.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Start Date</span>
                      <span className="text-sm text-gray-900 dark:text-white">{new Date(subscription.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">End Date</span>
                      <span className="text-sm text-gray-900 dark:text-white">{new Date(subscription.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {subscription.is_active && (
                    <button 
                      onClick={handleCancelSubscription}
                      className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-3">No active subscription</p>
                  {user.role === 'admin' && (
                    <button 
                      onClick={() => setShowSubscriptionModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Add Subscription
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {subscription ? 'Change Subscription' : 'Add Subscription'}
                </h3>
                <button 
                  onClick={() => setShowSubscriptionModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {submitError && (
                <div className="p-3 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-700 dark:text-red-400" role="alert">
                  {submitError}
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="plan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subscription Plan
                </label>
                <select
                  id="plan"
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select a plan</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ${billingType === 'monthly' ? plan.price_monthly : plan.price_annual}
                      {billingType === 'annual' ? '/year' : '/month'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Billing Type
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="monthly"
                      checked={billingType === 'monthly'}
                      onChange={() => setBillingType('monthly')}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Monthly</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="annual"
                      checked={billingType === 'annual'}
                      onChange={() => setBillingType('annual')}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Annual (Save 15%)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSubscriptionModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg mr-2 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSubscription}
                  disabled={submitting || !selectedPlan}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  )}
                  {subscription ? 'Update Subscription' : 'Add Subscription'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
