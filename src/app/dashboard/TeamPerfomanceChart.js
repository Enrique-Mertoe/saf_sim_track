import React, {useEffect, useState} from 'react';
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {fetchTeamPerformanceData} from "@/app/dashboard/helper";
import {UserRole} from "@/models";

// Import the Supabase service
// import { SupabaseSimService } from './supabaseSimService';

// Team Performance Chart Component
const TeamPerformanceChart = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [teamData, setTeamData] = useState([]);
    const [error, setError] = useState(null);
    const [selectedMetric, setSelectedMetric] = useState('all');

    // Fetch team performance data from Supabase
    const fetchTeamPerformance = async () => {
        if (!user) {
            setLoading(true);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Real Supabase call - uncomment when ready
            // const teamPerformance = await SupabaseSimService.getTeamPerformance(user);

            // For now, calling the fetch function directly
            const teamPerformance = await fetchTeamPerformanceData(user);

            // Transform data for chart visualization
            const chartData = teamPerformance.map((team, index) => ({
                ...team,
                // Add color coding based on performance
                color: getPerformanceColor(team.activationRate),
                rank: index + 1
            }));

            setTeamData(chartData);
        } catch (error) {
            console.error("Error fetching team performance:", error);
            setError(error.message || "Failed to load team performance data");
        } finally {
            setLoading(false);
        }
    };
    const sortedByPerformance = [...teamData].sort((a, b) => b.performanceScore - a.performanceScore);


    // Real Supabase data fetching function

    // Get performance color based on activation rate
    const getPerformanceColor = (rate) => {
        if (rate >= 95) return '#10B981'; // Green - Excellent
        if (rate >= 90) return '#F59E0B'; // Yellow - Good
        if (rate >= 80) return '#F97316'; // Orange - Needs improvement
        return '#EF4444'; // Red - Poor
    };
    const colors = {
        primary: '#059669',
        primaryLight: '#10B981',
        primaryDark: '#047857',
        secondary: '#6B7280',
        accent: '#374151',
        light: '#F3F4F6',
        white: '#FFFFFF',
        warning: '#D97706',
        danger: '#DC2626'
    };

    // Get performance status text
    const getPerformanceStatus = (rate) => {
        if (rate >= 95) return 'Excellent';
        if (rate >= 90) return 'Good';
        if (rate >= 80) return 'Fair';
        return 'Needs Attention';
    };

    // Load data when component mounts or user changes
    useEffect(() => {
        fetchTeamPerformance().then();
    }, [user]);

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0]?.payload;
            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-800 mb-2">{label}</p>
                    <p className="text-sm text-gray-600 mb-2">
                        Leader: {data?.leaderName}
                    </p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name === 'totalRecorded' && `Total Recorded: ${entry.value.toLocaleString()}`}
                            {entry.name === 'activationRate' && `Activation Rate: ${entry.value}%`}
                            {entry.name === 'qualityRate' && `Quality Rate: ${entry.value}%`}
                            {entry.name === 'performanceScore' && `Performance Score: ${entry.value}/100`}
                        </p>
                    ))}
                    <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                            Activated: {data?.activated} | Quality: {data?.quality} | Non-Quality: {data?.nonQuality}
                        </p>
                        <p className="text-xs font-medium" style={{ color: data?.color }}>
                            Status: {getPerformanceStatus(data?.activationRate)}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Loading state when no user
    if (!user) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Team Performance Comparison
                    </h3>
                    <p className="text-sm text-gray-600">
                        Please log in to view team performance data
                    </p>
                </div>

                <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-gray-400 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <p className="text-gray-500">User authentication required</p>
                    </div>
                </div>
            </div>
        );
    }

    // Permission check for non-admin users
    if (user.role !== UserRole.ADMIN) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Team Performance Comparison
                    </h3>
                    <p className="text-sm text-red-600">
                        Access denied: Administrator privileges required
                    </p>
                </div>

                <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-400 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <p className="text-gray-500">Administrator access required</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Team Performance Comparison (June 2025)
                        </h3>
                        <p className="text-sm text-gray-600">
                            Monthly activation rates, quality metrics, and performance scores by team
                        </p>
                    </div>

                    {/* Metric selector */}
                    <div className="flex gap-2">
                        <select
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value)}
                            className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Metrics</option>
                            <option value="activation">Activation Focus</option>
                            <option value="quality">Quality Focus</option>
                            <option value="volume">Volume Focus</option>
                        </select>
                    </div>
                </div>

                {/* Performance Legend */}
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>Excellent (≥95%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span>Good (≥90%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-orange-500 rounded"></div>
                        <span>Fair (≥80%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span>Needs Attention (&lt;80%)</span>
                    </div>
                </div>
            </div>

            <div className="h-80">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-2"></div>
                            <p className="text-gray-500">Loading team performance data...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-red-400 mb-2">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 mb-2">{error}</p>
                            <button
                                onClick={fetchTeamPerformance}
                                className="text-indigo-600 hover:text-indigo-800 text-sm underline"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : teamData.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={sortedByPerformance}>
                                <defs>
                                    <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="teamName" fontSize={10} stroke="#6B7280" />
                                <YAxis stroke="#6B7280" />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="performanceScore"
                                    stroke={colors.primary}
                                    fillOpacity={1}
                                    fill="url(#performanceGradient)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-gray-400 mb-2">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-500">No team performance data available for this month</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Performance Summary Cards */}
            {teamData.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-100">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">
                            {teamData.length}
                        </div>
                        <div className="text-xs text-gray-500">Active Teams</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {teamData.filter(team => team.activationRate >= 95).length}
                        </div>
                        <div className="text-xs text-gray-500">Excellent Teams</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                            {Math.round(teamData.reduce((sum, team) => sum + team.activationRate, 0) / teamData.length)}%
                        </div>
                        <div className="text-xs text-gray-500">Avg Activation Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                            {teamData.reduce((sum, team) => sum + team.totalRecorded, 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">Total SIMs</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamPerformanceChart;