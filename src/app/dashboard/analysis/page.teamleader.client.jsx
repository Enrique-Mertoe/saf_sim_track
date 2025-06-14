"use client"
import React, {useCallback, useEffect, useState} from 'react';
import {Cell, Pie, PieChart, ResponsiveContainer, Tooltip} from 'recharts';
import {AlertTriangle, CheckCircle, RefreshCw, Smartphone, TrendingDown, TrendingUp, XCircle} from 'lucide-react';
import useApp from "@/ui/provider/AppProvider";
import simCardService from "@/services/simService";
import simService from "@/services/simService";
import {DateTime} from "luxon";
import {Card, CardContent, CardHeader} from "@/ui/components/Card";
import {userService} from "@/services";
import {SIMStatus} from "@/models";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache
const dataCache = new Map();

export default function TeamSIMAnalysisPage() {
    const {user} = useApp();
    const [selectedPeriod, setSelectedPeriod] = useState('last-30-days');
    const [isLoading, setIsLoading] = useState(!user);
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

        switch (selectedPeriod) {
            case 'last-7-days':
                startDate = now.minus({days: 7}).startOf('day');
                break;
            case 'last-90-days':
                startDate = now.minus({days: 90}).startOf('day');
                break;
            case 'last-30-days':
            default:
                startDate = now.minus({days: 30}).startOf('day');
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
            const teamId = user.team_id;
            const dateFilters = getDateFilters();
            const [reg, qlty, mtc] = await Promise.all([
                simService.countReg(user, teamId),
                simService.countQuality(user, teamId, [["registered_on", "not", "is", null]]),
                simService.countMatch(user, teamId, [["registered_on", "not", "is", null]]),
            ]);

            // Process team data
            const totalRecorded = reg.count ?? 0;
            const matched = mtc.count ?? 0;
            const quality = qlty.count ?? 0;
            const matchRate = totalRecorded > 0 ? ((matched / totalRecorded) * 100).toFixed(2) : 0;
            let qualityRate = matched > 0 ? ((quality / matched) * 100).toFixed(2) : 0;
            const nonQuality = matched - quality;
            const unknown = totalRecorded - matched;
            qualityRate = Math.min(Math.max(qualityRate, 0), 100);
            if (qualityRate >= 10) {
                qualityRate = Math.ceil(qualityRate);
            } else {
                qualityRate = parseFloat(qualityRate.toFixed(2));
            }

            // Fetch real breakdown data
            const breakdownFilters = [["team_id", teamId]];
            if (dateFilters.startDate) {
                breakdownFilters.push(["registered_on", "gte", dateFilters.startDate]);
            }
            if (dateFilters.endDate) {
                breakdownFilters.push(["registered_on", "lte", dateFilters.endDate]);
            }

            const breakdownData = await simCardService.countTopUpCategories(user, breakdownFilters);

            const processedTeamData = {
                id: teamId,
                name: "teamData.name",
                totalRecorded,
                matched,
                matchRate: parseFloat(matchRate),
                quality,
                qualityRate: parseFloat(qualityRate),
                nonQuality,
                unknown,
                breakdown: breakdownData
            };

            // Fetch user stats for the team
            const {data: usersData, error: usersError} = await userService.getStaffUsers(
                user.team_id,
                user,
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
        fetchData().then();
    }, [fetchData]);

    // Handle period change
    useEffect(() => {
        fetchData().then();
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
        {name: 'Quality', value: totalMetrics.totalQuality, color: '#00A651'},
        {name: 'Non-Quality', value: totalMetrics.totalNonQuality, color: '#FF6B6B'},
        {name: 'Unknown', value: totalMetrics.totalUnknown, color: '#FFA726'}
    ];

    const userPerformanceData = userStats.map(user => ({
        name: user.name,
        'Total': 0,
        'Quality': 0,
        'Non-Quality': 0,
        'Unknown': 0
    }));

    const MetricCard = ({title, value, subtitle, icon: Icon, trend, color = "green"}) => (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                    <p className={`text-3xl font-bold ${color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-500' : 'text-orange-500'} dark:text-white`}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div
                    className={`p-3 rounded-full ${color === 'green' ? 'bg-green-100 dark:bg-green-900' : color === 'red' ? 'bg-red-100 dark:bg-red-900' : 'bg-orange-100 dark:bg-orange-900'}`}>
                    <Icon
                        className={`h-6 w-6 ${color === 'green' ? 'text-green-600 dark:text-green-400' : color === 'red' ? 'text-red-500 dark:text-red-400' : 'text-orange-500 dark:text-orange-400'}`}/>
                </div>
            </div>
            {trend && (
                <div className="flex items-center mt-4">
                    {trend > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1"/>
                    ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1"/>
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
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analysis</h1>
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
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}/>
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Key Metrics Overview */}
            {isLoading ? (
                <LoadingSkeleton/>
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

            <div className="grid grid-cols-12 gap-2">
                <div className="md:col-span-7">
                    {/* Charts Section */}
                    {!isLoading && teamData && (
                        <div className="grid grid-cols-1 gap-6 mb-8">
                            {/* Quality Distribution Pie Chart */}
                            <div
                                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quality
                                    Distribution</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color}/>
                                            ))}
                                        </Pie>
                                        <Tooltip/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Team Performance */}
                            <div
                                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team
                                    Performance</h3>
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
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Non-Quality
                                        Breakdown</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <div className="flex items-center gap-1">
                                                <TrendingDown className="w-3 h-3 text-red-500"/>
                                                <span className="text-gray-600 dark:text-gray-400">&lt;50 KES</span>
                                            </div>
                                            <span className="text-red-500 font-medium">{teamData.breakdown.lt50}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <div className="flex items-center gap-1">
                                                <XCircle className="w-3 h-3 text-red-500"/>
                                                <span className="text-gray-600 dark:text-gray-400">No Top-up</span>
                                            </div>
                                            <span
                                                className="text-red-500 font-medium">{teamData.breakdown.noTopUp}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <div className="flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3 text-orange-500"/>
                                                <span className="text-gray-600 dark:text-gray-400">≥50 Not Conv</span>
                                            </div>
                                            <span
                                                className="text-orange-500 font-medium">{teamData.breakdown.gte50NotConverted}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="md:col-span-5">
                    <Card className={"w-ful h-full bg-white dark:bg-gray-800 !border-gray-200"}>
                        <CardHeader className={"border border-transparent border-b-gray-200 !p-1"}>
                            <span className={"font-bold text-2md"}>Staff Analysis</span>
                        </CardHeader>
                        <CardContent className={"overflow-y-auto"}>
                            {
                                userStats.map(userstat => (
                                    <UserStat user={user} stat={userstat}/>
                                ))
                            }

                        </CardContent>

                    </Card>
                </div>
            </div>
        </div>
    );
}


const UserStat = ({user, stat}) => {
    const [stats, sS] = useState({total: 0, registered: 0})
    const completionRate = Math.floor(stats?.total > 0 ? (stats.registered / stats.total) * 100 : 0);
    const [nQ,sNq] = useState(0)

    useEffect(() => {
        if (!user) return
        Promise.all([
            simService.countAll(user, [
                ["assigned_to_user_id", stat.id]
            ]),
            simService.countAll(user, [
                ["assigned_to_user_id", stat.id],
                ["registered_on", "not", "is", null]
            ]),
        ]).then(([r1, r2]) => {
            sS({
                total: r1.count ?? 0,
                registered: r2.count ?? 0
            })
        })
        simService.countAll(user, [
            ["quality", SIMStatus.QUALITY],
            ["assigned_to_user_id", stat.id]
        ]).then(res=>{
            sNq(res.count ?? 0)
        })
    }, [user]);

    return (
        <div
            className="flex items-center justify-between border-b border-gray-100 py-3 last:border-b-0 dark:border-gray-800">
            <div className="flex items-center ">
                <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {stat.full_name}
                    </p>
                    <div className={"flex"}>
                        <p className={"text-xs font-bold bg-blue-200 text-blue-500 rounded-sm px-4"}>{nQ} Non-Quality</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col w-full max-w-[140px] items-center gap-3">

                <div
                    className="relative block h-1 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">

                    <div
                        className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-green-500 text-xs font-medium text-white"
                        style={{ width: `${completionRate}%` }}
                    ></div>

                </div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-400">
                    {completionRate}% distributed
                </p>
            </div>
        </div>
    )
}