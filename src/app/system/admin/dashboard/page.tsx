"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalPlans: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/system/admin/dashboard');
        setStats(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
        console.error('Dashboard data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">System Administration Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex flex-col items-center justify-center h-24 rounded-lg bg-white dark:bg-gray-800 shadow">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.totalUsers || 0}</div>
          <div className="text-gray-500 dark:text-gray-400">Total Users</div>
        </div>
        <div className="flex flex-col items-center justify-center h-24 rounded-lg bg-white dark:bg-gray-800 shadow">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.activeSubscriptions || 0}</div>
          <div className="text-gray-500 dark:text-gray-400">Active Subscriptions</div>
        </div>
        <div className="flex flex-col items-center justify-center h-24 rounded-lg bg-white dark:bg-gray-800 shadow">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats?.totalPlans || 0}</div>
          <div className="text-gray-500 dark:text-gray-400">Subscription Plans</div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/system/admin/users" className="px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg text-center transition-colors">
            Manage Users
          </a>
          <a href="/system/admin/users/create" className="px-4 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-lg text-center transition-colors">
            Create New User
          </a>
          <a href="/system/admin/subscriptions" className="px-4 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-lg text-center transition-colors">
            Manage Subscription Plans
          </a>
        </div>
      </div>
      
      {/* System Info */}
      <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Environment</h3>
            <p className="text-gray-900 dark:text-white">{process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Version</h3>
            <p className="text-gray-900 dark:text-white">1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}