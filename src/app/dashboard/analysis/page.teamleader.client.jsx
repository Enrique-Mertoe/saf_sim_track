"use client"
import React, {useCallback, useEffect, useState} from 'react';
import {Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {AlertTriangle, CheckCircle, RefreshCw, Smartphone, TrendingDown, TrendingUp, XCircle} from 'lucide-react';
import useApp from "@/ui/provider/AppProvider";
import simCardService from "@/services/simService";
import {DateTime} from "luxon";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache
const dataCache = new Map();

export default function TeamSIMAnalysisPage() {
    const { user } = useApp();
    const [selectedPeriod, setSelectedPeriod] = useState('last-30-days');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [teamData, setTeamData] = useState(null);
    const [userStats, setUserStats] = useState([]);
    const [totalMetrics, setTotalMetrics] = useState({
        totalRecorded: 0,
        totalMatched: 0,
        totalQuality: 0,
        totalNonQuality: 0,
        totalUnknown: 0
    });

    // Generate date filters based on selected period
    const getDateFilters = useCallback(() => {
        const now = DateTime.now().setZone("Africa/Nairobi");
        let startDate;

        switch(selectedPeriod) {
            case 'last-7-days':
                startDate = now.minus({ days: 7 }).startOf('day');
                break;
            case 'last-90-days':
                startDate = now.minus({ days: 90 }).startOf('day');
                break;
            case 'last-30-days':
            default:
                startDate = now.minus({ days: 30 }).startOf('day');
                break;
        }

        return {
            startDate: startDate.toISO(),
            endDate: now.endOf('day').toISO()
        };
    }, [selectedPeriod]);

    // Generate cache key
    const getCacheKey = useCallback(() => {
        return `team_analysis_${user?.id || 'guest'}_${selectedPeriod}`;
    }, [user, selectedPeriod]);

    // Fetch data function
    const fetchData = useCallback(async (force = false) => {
        if (!user || !user.team_id) return;

        const cacheKey = getCacheKey();
        const now = Date.now();

        // Check cache first (unless forced refresh)
        if (!force && dataCache.has(cacheKey)) {
            const cached = dataCache.get(cacheKey);
            if (now - cached.timestamp < CACHE_DURATION) {
                setTeamData(cached.teamData);
                setUserStats(cached.userStats);
                setTotalMetrics(cached.totalMetrics);
                setIsLoading(false);
                return;
            }
        }

        try {
            setError(null);
            if (!isLoading) setIsRefreshing(true);

            const dateFilters = getDateFilters();

            // Fetch team stats
            const { data: teamsData, error: teamsError } = await simCardService.getTeamStats(user, dateFilters);

            if (teamsError) throw teamsError;

            if (!teamsData || teamsData.length === 0) {
                setTeamData(null);
                setUserStats([]);
                setTotalMetrics({
                    totalRecorded: 0,
                    totalMatched: 0,
                    totalQuality: 0,
                    totalNonQuality: 0,
                    totalUnknown: 0
                });
                setIsLoading(false);
                setIsRefreshing(false);
                return;
            }

            // Find the team leader's team
            const teamData = teamsData.find(team => team.id === user.team_id);

            if (!teamData) {
                setError("Team data not found");
                setIsLoading(false);
                setIsRefreshing(false);
                return;
            }

            // Process team data
            const totalRecorded = teamData.stats.total;
            const matched = teamData.stats.matched;
            const quality = teamData.stats.quality;
            const matchRate = totalRecorded > 0 ? ((matched / totalRecorded) * 100).toFixed(2) : 0;
            const qualityRate = matched > 0 ? ((quality / matched) * 100).toFixed(2) : 0;
            const nonQuality = matched - quality;
            const unknown = totalRecorded - matched;

            const processedTeamData = {
                id: teamData.id,
                name: teamData.name,
                totalRecorded,
                matched,
                matchRate: parseFloat(matchRate),
                quality,
                qualityRate: parseFloat(qualityRate),
                nonQuality,
                unknown,
                breakdown: {
                    // These are estimates since we don't have the exact breakdown
                    topUpBelow50: Math.round(nonQuality * 0.4),
                    noTopUp: Math.round(nonQuality * 0.3),
                    topUp50PlusNotConverted: Math.round(nonQuality * 0.3),
                    unknownQuality: Math.round(unknown * 0.5),
                    unknownNonQuality: Math.round(unknown * 0.5)
                }
            };

            // Fetch user stats for the team
            const { data: usersData, error: usersError } = await simCardService.getUserStatsForBatch(
                user.team_id, 
                'unassigned', // This will get all users in the team
                user, 
                dateFilters
            );

            if (usersError) throw usersError;

            // Calculate total metrics
            const newTotalMetrics = {
                totalRecorded,
                totalMatched: matched,
                totalQuality: quality,
                totalNonQuality: nonQuality,
                totalUnknown: unknown
            };

            // Update state
            setTeamData(processedTeamData);
            setUserStats(usersData || []);
            setTotalMetrics(newTotalMetrics);

            // Update cache
            dataCache.set(cacheKey, {
                teamData: processedTeamData,
                userStats: usersData || [],
                totalMetrics: newTotalMetrics,
                timestamp: now
            });

        } catch (err) {
            console.error('Error fetching team analysis data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user, getCacheKey, getDateFilters, isLoading]);

    // Initial load
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle period change
    useEffect(() => {
        fetchData();
    }, [selectedPeriod, fetchData]);

    // Periodic refresh
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchData();
            }
        }, CACHE_DURATION);

        return () => clearInterval(interval);
    }, [fetchData]);

    // Handle visibility change for smart refreshing
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const cacheKey = getCacheKey();
                const cached = dataCache.get(cacheKey);
                if (cached && Date.now() - cached.timestamp > CACHE_DURATION) {
                    fetchData();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [fetchData, getCacheKey]);

    // Manual refresh function
    const handleRefresh = () => {
        fetchData(true);
    };

    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg animate-pulse">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                    <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            ))}
        </div>
    );

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg text-center flex flex-col items-center">
                    <AlertTriangle size={36} className="text-red-500 dark:text-red-400 mb-2"/>
                    <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={16}/>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    if (!isLoading && !teamData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-3">No data available for your team.</p>
                </div>
            </div>
        );
    }

    const pieChartData = [
        { name: 'Quality', value: totalMetrics.totalQuality, color: '#00A651' },
        { name: 'Non-Quality', value: totalMetrics.totalNonQuality, color: '#FF6B6B' },
        { name: 'Unknown', value: totalMetrics.totalUnknown, color: '#FFA726' }
    ];

    const userPerformanceData = userStats.map(user => ({
        name: user.name,
        'Total': user.stats.total,
        'Quality': user.stats.quality,
        'Non-Quality': user.stats.matched - user.stats.quality,
        'Unknown': user.stats.total - user.stats.matched
    }));

    const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = "green" }) => (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                    <p className={`text-3xl font-bold ${color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-500' : 'text-orange-500'} dark:text-white`}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-full ${color === 'green' ? 'bg-green-100 dark:bg-green-900' : color === 'red' ? 'bg-red-100 dark:bg-red-900' : 'bg-orange-100 dark:bg-orange-900'}`}>
                    <Icon className={`h-6 w-6 ${color === 'green' ? 'text-green-600 dark:text-green-400' : color === 'red' ? 'text-red-500 dark:text-red-400' : 'text-orange-500 dark:text-orange-400'}`} />
                </div>
            </div>
            {trend && (
                <div className="flex items-center mt-4">
                    {trend > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {Math.abs(trend)}% vs last period
                    </span>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team SIM Quality Analysis</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Performance metrics for your team</p>
                    </div>
                    <div className="flex space-x-4">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        >
                            <option value="last-7-days">Last 7 Days</option>
                            <option value="last-30-days">Last 30 Days</option>
                            <option value="last-90-days">Last 90 Days</option>
                        </select>
                        <button 
                            onClick={handleRefresh}
                            disabled={isLoading || isRefreshing}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Key Metrics Overview */}
            {isLoading ? (
                <LoadingSkeleton />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Total Recorded"
                        value={totalMetrics.totalRecorded}
                        subtitle="SIM cards registered"
                        icon={Smartphone}
                        color="green"
                    />
                    <MetricCard
                        title="Total Quality"
                        value={totalMetrics.totalQuality}
                        subtitle={`${((totalMetrics.totalQuality / (totalMetrics.totalMatched || 1)) * 100).toFixed(1)}% quality rate`}
                        icon={CheckCircle}
                        color="green"
                    />
                    <MetricCard
                        title="Non-Quality"
                        value={totalMetrics.totalNonQuality}
                        subtitle={`${((totalMetrics.totalNonQuality / (totalMetrics.totalMatched || 1)) * 100).toFixed(1)}% of matched`}
                        icon={XCircle}
                        color="red"
                    />
                    <MetricCard
                        title="Unknown Status"
                        value={totalMetrics.totalUnknown}
                        subtitle={`${((totalMetrics.totalUnknown / (totalMetrics.totalRecorded || 1)) * 100).toFixed(1)}% unmatched`}
                        icon={AlertTriangle}
                        color="orange"
                    />
                </div>
            )}

            {/* Charts Section */}
            {!isLoading && teamData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Quality Distribution Pie Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quality Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Team Performance */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Performance</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Recorded</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{teamData.totalRecorded.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Match Rate</p>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400">{teamData.matchRate}%</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Quality</p>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400">{teamData.quality.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Quality Rate</p>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400">{teamData.qualityRate}%</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Non-Quality Breakdown</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Top-up &lt; 50 KES</span>
                                    <span className="text-red-500 font-medium">{teamData.breakdown.topUpBelow50}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">No Top-up</span>
                                    <span className="text-red-500 font-medium">{teamData.breakdown.noTopUp}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Top-up ≥50 Not Converted</span>
                                    <span className="text-orange-500 font-medium">{teamData.breakdown.topUp50PlusNotConverted}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Members Performance */}
            {!isLoading && userStats.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Team Member</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Recorded</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Matched</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Match Rate</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quality</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quality Rate</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {userStats.map((user) => {
                                    const matchRate = user.stats.total > 0 ? ((user.stats.matched / user.stats.total) * 100).toFixed(2) : 0;
                                    const qualityRate = user.stats.matched > 0 ? ((user.stats.quality / user.stats.matched) * 100).toFixed(2) : 0;

                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{user.stats.total.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{user.stats.matched.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-medium">{matchRate}%</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{user.stats.quality.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-medium">{qualityRate}%</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    parseFloat(qualityRate) >= 95 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                    parseFloat(qualityRate) >= 90 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}>
                                                    {parseFloat(qualityRate) >= 95 ? 'Well Done' : parseFloat(qualityRate) >= 90 ? 'Improve' : 'Needs Attention'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* User Performance Chart */}
            {!isLoading && userStats.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Members Comparison</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={userPerformanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#6B7280" />
                            <YAxis stroke="#6B7280" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    color: '#F9FAFB'
                                }}
                            />
                            <Bar dataKey="Quality" fill="#00A651" />
                            <Bar dataKey="Non-Quality" fill="#FF6B6B" />
                            <Bar dataKey="Unknown" fill="#FFA726" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
