"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  features: string[];
  is_recommended: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_monthly: 0,
    price_annual: 0,
    features: [''],
    is_recommended: false,
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get('/api/system/admin/subscriptions');
        setPlans(response.data.plans);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load subscription plans');
        console.error('Plans fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleAddPlan = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price_monthly: 0,
      price_annual: 0,
      features: [''],
      is_recommended: false,
      is_active: true
    });
    setShowAddEditModal(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price_monthly: plan.price_monthly,
      price_annual: plan.price_annual,
      features: Array.isArray(plan.features) ? plan.features : [],
      is_recommended: plan.is_recommended,
      is_active: plan.is_active
    });
    setShowAddEditModal(true);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = value;
    setFormData({ ...formData, features: updatedFeatures });
  };

  const handleAddFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: updatedFeatures });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    // Filter out empty features
    const filteredFeatures = formData.features.filter(feature => feature.trim() !== '');

    try {
      if (editingPlan) {
        // Update existing plan
        const response = await axios.patch(`/api/system/admin/subscriptions/${editingPlan.id}`, {
          ...formData,
          features: filteredFeatures
        });

        if (response.data.success) {
          // Update the plan in the local state
          setPlans(plans.map(plan => 
            plan.id === editingPlan.id ? response.data.plan : plan
          ));
          setShowAddEditModal(false);
        } else {
          setSubmitError(response.data.message || 'Failed to update plan');
        }
      } else {
        // Create new plan
        const response = await axios.post('/api/system/admin/subscriptions', {
          ...formData,
          features: filteredFeatures
        });

        if (response.data.success) {
          // Add the new plan to the local state
          setPlans([...plans, response.data.plan]);
          setShowAddEditModal(false);
        } else {
          setSubmitError(response.data.message || 'Failed to create plan');
        }
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'An error occurred');
      console.error('Plan submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      const response = await axios.patch(`/api/system/admin/subscriptions/${plan.id}`, {
        is_active: !plan.is_active
      });

      if (response.data.success) {
        // Update the plan in the local state
        setPlans(plans.map(p => 
          p.id === plan.id ? { ...p, is_active: !p.is_active } : p
        ));
      } else {
        alert(response.data.message || 'Failed to update plan status');
      }
    } catch (err: any) {
      console.error('Plan status update error:', err);
      alert(err.response?.data?.message || 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">Subscription Plans</h1>
        <button 
          onClick={handleAddPlan}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Add New Plan
        </button>
      </div>

      {/* Plans Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Description</th>
              <th scope="col" className="px-6 py-3">Monthly Price</th>
              <th scope="col" className="px-6 py-3">Annual Price</th>
              <th scope="col" className="px-6 py-3">Recommended</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <td colSpan={7} className="px-6 py-4 text-center">No subscription plans found</td>
              </tr>
            ) : (
              plans.map(plan => (
                <tr key={plan.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{plan.name}</td>
                  <td className="px-6 py-4">{plan.description || '-'}</td>
                  <td className="px-6 py-4">${plan.price_monthly}</td>
                  <td className="px-6 py-4">${plan.price_annual}</td>
                  <td className="px-6 py-4">
                    {plan.is_recommended ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      plan.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleEditPlan(plan)}
                      className="font-medium text-blue-600 dark:text-blue-500 hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleToggleActive(plan)}
                      className={`font-medium ${
                        plan.is_active 
                          ? 'text-red-600 dark:text-red-500' 
                          : 'text-green-600 dark:text-green-500'
                      } hover:underline`}
                    >
                      {plan.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Plan Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingPlan ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
                </h3>
                <button 
                  onClick={() => setShowAddEditModal(false)}
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

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Plan Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="price_monthly" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monthly Price
                    </label>
                    <input
                      type="number"
                      id="price_monthly"
                      value={formData.price_monthly}
                      onChange={(e) => setFormData({ ...formData, price_monthly: parseInt(e.target.value) || 0 })}
                      required
                      min="0"
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="price_annual" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Annual Price
                    </label>
                    <input
                      type="number"
                      id="price_annual"
                      value={formData.price_annual}
                      onChange={(e) => setFormData({ ...formData, price_annual: parseInt(e.target.value) || 0 })}
                      required
                      min="0"
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Features
                      </label>
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="text-sm text-blue-600 dark:text-blue-500 hover:underline"
                      >
                        + Add Feature
                      </button>
                    </div>
                    
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleFeatureChange(index, e.target.value)}
                          placeholder={`Feature ${index + 1}`}
                          className="flex-grow p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white mr-2"
                        />
                        {formData.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(index)}
                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_recommended"
                      checked={formData.is_recommended}
                      onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="is_recommended" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Recommended Plan
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Active
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddEditModal(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg mr-2 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {submitting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    )}
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}