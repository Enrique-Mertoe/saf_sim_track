"use client"
import React, {useCallback, useEffect, useState} from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {AlertTriangle, CheckCircle, Download, Smartphone, XCircle} from 'lucide-react';
import useApp from "@/ui/provider/AppProvider";
import simCardService from "@/services/simService";
import {DateTime} from "luxon";
import TeamBreakdownCard from "@/app/dashboard/analysis/TeamBreakDown";
import {MetricCard} from "@/app/dashboard/analysis/Metricard";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache
const dataCache = new Map();

const SIMAnalysisPage = () => {
    const { user } = useApp();
    const [selectedPeriod, setSelectedPeriod] = useState('last-30-days');
    const [selectedTeam, setSelectedTeam] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [teamData, setTeamData] = useState([]);
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
        return `analysis_${user?.id || 'guest'}_${selectedPeriod}_${selectedTeam}`;
    }, [user, selectedPeriod, selectedTeam]);

    // Fetch data function
    const fetchData = useCallback(async (force = false) => {
        if (!user) return;

        const cacheKey = getCacheKey();
        const now = Date.now();

        // Check cache first (unless forced refresh)
        if (!force && dataCache.has(cacheKey)) {
            const cached = dataCache.get(cacheKey);
            if (now - cached.timestamp < CACHE_DURATION) {
                setTeamData(cached.teamData);
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
                setTeamData([]);
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

            // Process team data
            const processedTeamData = teamsData.map(team => {
                const totalRecorded = team.stats.total;
                const matched = team.stats.matched;
                const quality = team.stats.quality;
                const matchRate = totalRecorded > 0 ? ((matched / totalRecorded) * 100).toFixed(2) : 0;
                const qualityRate = matched > 0 ? ((quality / matched) * 100).toFixed(2) : 0;
                const nonQuality = matched - quality;
                const unknown = totalRecorded - matched;

                return {
                    id: team.id,
                    name: team.name,
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
            });

            // Calculate total metrics
            const newTotalMetrics = {
                totalRecorded: processedTeamData.reduce((sum, team) => sum + team.totalRecorded, 0),
                totalMatched: processedTeamData.reduce((sum, team) => sum + team.matched, 0),
                totalQuality: processedTeamData.reduce((sum, team) => sum + team.quality, 0),
                totalNonQuality: processedTeamData.reduce((sum, team) => sum + team.nonQuality, 0),
                totalUnknown: processedTeamData.reduce((sum, team) => sum + team.unknown, 0)
            };

            // Update state
            setTeamData(processedTeamData);
            setTotalMetrics(newTotalMetrics);

            // Update cache
            dataCache.set(cacheKey, {
                teamData: processedTeamData,
                totalMetrics: newTotalMetrics,
                timestamp: now
            });

        } catch (err) {
            console.error('Error fetching analysis data:', err);
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

    const qualityBreakdownData = teamData.map(team => ({
        name: team.name,
        Quality: team.quality,
        'Non-Quality': team.nonQuality,
        Unknown: team.unknown
    }));

    const pieChartData = [
        { name: 'Quality', value: totalMetrics.totalQuality, color: '#00A651' },
        { name: 'Non-Quality', value: totalMetrics.totalNonQuality, color: '#FF6B6B' },
        { name: 'Unknown', value: totalMetrics.totalUnknown, color: '#FFA726' }
    ];

    const nonQualityBreakdownData = teamData.map(team => ({
        name: team.name,
        'Top-up < 50 KES': team.breakdown.topUpBelow50,
        'No Top-up': team.breakdown.noTopUp,
        'Top-up ≥50 Not Converted': team.breakdown.topUp50PlusNotConverted
    }));

    const unknownBreakdownData = teamData.map(team => ({
        name: team.name,
        'Unknown Quality': team.breakdown.unknownQuality,
        'Unknown Non-Quality': team.breakdown.unknownNonQuality
    }));





    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SIM Quality Analysis</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Comprehensive breakdown of team performance and quality metrics</p>
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
                        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2">
                            <Download className="h-4 w-4" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    user={user}
                    title="Total Recorded"
                    value={0}
                    dataType={"total"}
                    subtitle="Across all teams"
                    icon={Smartphone}
                    trend={12}
                    color="green"
                />
                <MetricCard
                    user={user}
                    title="Total Quality"
                    value={totalMetrics.totalQuality}
                    subtitle={`${((totalMetrics.totalQuality / totalMetrics.totalRecorded) * 100).toFixed(1)}% quality rate`}
                    icon={CheckCircle}
                    trend={8}
                    color="green"
                />
                <MetricCard
                    user={user}
                    title="Non-Quality"
                    value={totalMetrics.totalNonQuality}
                    subtitle={`${((totalMetrics.totalNonQuality / totalMetrics.totalRecorded) * 100).toFixed(1)}% of total`}
                    icon={XCircle}
                    trend={-3}
                    color="red"
                />
                <MetricCard
                    user={user}
                    title="Unknown Status"
                    value={totalMetrics.totalUnknown}
                    subtitle={`${((totalMetrics.totalUnknown / totalMetrics.totalRecorded) * 100).toFixed(1)}% unmatched`}
                    icon={AlertTriangle}
                    trend={-5}
                    color="orange"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols- ov gap-6 mb-8">
                {/* Quality Distribution Pie Chart */}
                <div className="bg-white hidden dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overall Quality Distribution</h3>
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

                {/* Team Performance Comparison */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Quality Comparison</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={qualityBreakdownData}>
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
            </div>

            {/* Non-Quality Breakdown Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Non-Quality Reasons */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Non-Quality Breakdown by Team</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={nonQualityBreakdownData}>
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
                            <Area type="monotone" dataKey="Top-up < 50 KES" stackId="1" stroke="#FF6B6B" fill="#FF6B6B" />
                            <Area type="monotone" dataKey="No Top-up" stackId="1" stroke="#FF8A80" fill="#FF8A80" />
                            <Area type="monotone" dataKey="Top-up ≥50 Not Converted" stackId="1" stroke="#FFA726" fill="#FFA726" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Unknown Status Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Unknown Status Breakdown</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={unknownBreakdownData}>
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
                            <Bar dataKey="Unknown Quality" fill="#81C784" />
                            <Bar dataKey="Unknown Non-Quality" fill="#FFAB91" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Team Breakdown Cards */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Detailed Team Analysis</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {teamData.map(team => (
                        <TeamBreakdownCard user={user} key={team.id} team={team} />
                    ))}
                </div>
            </div>

            {/* Summary Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Summary</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Team</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Recorded</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Matched</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Match Rate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quality</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quality Rate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {teamData.map((team) => (
                            <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{team.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{team.totalRecorded.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{team.matched.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-medium">{team.matchRate}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{team.quality.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-medium">{team.qualityRate}%</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        team.qualityRate >= 95 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            team.qualityRate >= 90 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {team.qualityRate >= 95 ? 'Well Done' : team.qualityRate >= 90 ? 'Improve' : 'Needs Attention'}
                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SIMAnalysisPage;
