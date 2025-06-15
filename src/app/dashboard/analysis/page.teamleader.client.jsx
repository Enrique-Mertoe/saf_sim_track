"use client"
import React, {useCallback, useEffect, useState} from 'react';
import {Cell, Pie, PieChart, ResponsiveContainer, Tooltip} from 'recharts';
import {
    AlertCircle,
    AlertTriangle,
    Calendar,
    CheckCircle,
    RefreshCw,
    Smartphone,
    TrendingDown,
    TrendingUp,
    X,
    XCircle
} from 'lucide-react';
import useApp from "@/ui/provider/AppProvider";
import simCardService from "@/services/simService";
import simService from "@/services/simService";
import {DateTime} from "luxon";
import {Card, CardContent, CardHeader} from "@/ui/components/Card";
import {userService} from "@/services";
import {SIMStatus} from "@/models";
import {showModal} from "@/ui/shortcuts";
import ReportDateRangeTemplate from "@/ui/components/ReportDateModal";
import {format, isToday, isYesterday} from "date-fns";
import {formatLocalDate} from "@/helper";

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
    const [startDate, setStartDate] = useState(DateTime.now().minus({days: 30}).toISODate());
    const [endDate, setEndDate] = useState(DateTime.now().toISODate());
    //non-quality not assigned
    const [nonQualityUnref, setNonQualityUnref] = useState(0);
    const [totalMetrics, setTotalMetrics] = useState({
        totalRecorded: 0,
        totalMatched: 0,
        totalQuality: 0,
        totalNonQuality: 0,
        totalUnknown: 0
    });

    // Format date for display
    const formatDateForDisplay = (dateString) => {
        const date = new Date(dateString);
        if (isToday(date)) {
            return "Today";
        } else if (isYesterday(date)) {
            return "Yesterday";
        } else {
            return format(date, "MMM d yyyy");
        }
    };

    // Format date range for display
    const formatDateRangeForDisplay = () => {
        if (selectedPeriod === 'custom') {
            const formattedStartDate = formatDateForDisplay(startDate);
            const formattedEndDate = formatDateForDisplay(endDate);

            if (formattedStartDate === formattedEndDate) {
                return formattedStartDate;
            } else {
                return `${formattedStartDate} - ${formattedEndDate}`;
            }
        } else {
            // For predefined periods, use the period name
            switch (selectedPeriod) {
                case 'last-7-days':
                    return 'Last 7 days';
                case 'last-90-days':
                    return 'Last 90 days';
                case 'last-30-days':
                default:
                    return 'Last 30 days';
            }
        }
    };

    // Generate date filters based on selected period
    const getDateFilters = useCallback(() => {
        const now = DateTime.now().setZone("Africa/Nairobi");
        let start, end;

        if (selectedPeriod === 'custom') {
            // Use the custom date range
            start = DateTime.fromISO(startDate).startOf('day');
            end = DateTime.fromISO(endDate).endOf('day');
        } else {
            // Use predefined periods
            switch (selectedPeriod) {
                case 'last-7-days':
                    start = now.minus({days: 7}).startOf('day');
                    break;
                case 'last-90-days':
                    start = now.minus({days: 90}).startOf('day');
                    break;
                case 'last-30-days':
                default:
                    start = now.minus({days: 30}).startOf('day');
                    break;
            }
            end = now.endOf('day');
        }

        return {
            startDate: start.toISO(),
            endDate: end.toISO()
        };
    }, [selectedPeriod, startDate, endDate]);

    // Generate cache key
    const getCacheKey = useCallback(() => {
        // Include custom date range in the cache key when custom period is selected
        const dateKey = selectedPeriod === 'custom'
            ? `${startDate}_${endDate}`
            : selectedPeriod;
        return `team_analysis_${user?.id || 'guest'}_${dateKey}`;
    }, [user, selectedPeriod, startDate, endDate]);

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
            const dateConditions = [];
            if (dateFilters && dateFilters.startDate) {
                dateConditions.push(["registered_on", "gte", dateFilters.startDate]);
            }
            if (dateFilters && dateFilters.endDate) {
                dateConditions.push(["registered_on", "lte", dateFilters.endDate]);
            }

            //non-quality not assigned but registered
            simService.countAll(user, [
                ["quality", SIMStatus.NONQUALITY],
                ["assigned_to_user_id", "is", null],
                ["registered_on", "not", "is", null],
                ...(dateConditions)]).then(res => {
                setNonQualityUnref(res.count ?? 0)
            })
            const [reg, qlty, mtc] = await Promise.all([
                simService.countReg(user, teamId, [
                    ...dateConditions
                ]),
                simService.countQuality(user, teamId, [["registered_on", "not", "is", null], ...(dateConditions)]),
                simService.countMatch(user, teamId, [["registered_on", "not", "is", null], ...dateConditions]),
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
            const breakdownFilters = [["team_id", teamId],
                ["quality", SIMStatus.NONQUALITY]
                , ...dateConditions];
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
                        <button
                            onClick={() => {
                                showModal({
                                    content: onClose => (<ReportDateRangeTemplate
                                        onConfirm={selection => {
                                            if (selection.type === 'range' && selection.range.startDate && selection.range.endDate) {
                                                // Convert Date objects to ISO strings for our date state
                                                const newStartDate = formatLocalDate(selection.range.startDate);
                                                const newEndDate = formatLocalDate(selection.range.endDate);
                                                // Update state with the selected dates
                                                setStartDate(newStartDate);
                                                setEndDate(newEndDate);
                                                setSelectedPeriod('custom');

                                                // Fetch data with the new date range
                                                fetchData(true);
                                            } else if (selection.type === 'single' && selection.single) {
                                                // Handle single date selection
                                                const newDate = selection.single.toISOString().split('T')[0];
                                                setStartDate(newDate);
                                                setEndDate(newDate);
                                                setSelectedPeriod('custom');

                                                // Fetch data with the new date
                                                fetchData(true);
                                            }
                                            onClose();
                                        }}
                                        onClose={() => onClose()}/>),
                                    size: "lg",
                                });
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2">
                            <Calendar className="h-4 w-4"/>
                            <span>{formatDateRangeForDisplay()}</span>
                        </button>
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

            <div className="grid md:grid-cols-12 gap-2">
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
                            {nonQualityUnref > 0 && (
                                <span
                                    className={"text-xs flex items-center gap-1 dark:bg-red-900 dark:text-red-200 text-red-500 bg-red-100 py-2 px-4 rounded-sm font-medium"}>
                                    <AlertTriangle className={"w-4 h-4 mr-1"}/>
                                    Non-Quality not assigned : <span
                                    className={"bg-red-200 px-4 rounded-full text-red-500"}>{nonQualityUnref}</span></span>
                            )}
                        </CardHeader>
                        <CardContent className={"overflow-y-auto px-0"}>
                            {
                                userStats.map(userstat => (
                                    <UserStat key={userstat.id} dateRange={getDateFilters()} user={user}
                                              stat={userstat}/>
                                ))
                            }

                        </CardContent>

                    </Card>
                </div>
            </div>
        </div>
    );
}

const UserStat = ({user, stat, dateRange}) => {
    const [stats, sS] = useState({total: 0, registered: 0})
    const qualityRate = Math.floor(stats?.total > 0 ? (stats.registered / stats.total) * 100 : 0);
    const [nQ, sNq] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!user) return
        setIsLoading(true)
        const dateConditions = [];
        if (dateRange && dateRange.startDate) {
            dateConditions.push(["registered_on", "gte", dateRange.startDate]);
        }
        if (dateRange && dateRange.endDate) {
            dateConditions.push(["registered_on", "lte", dateRange.endDate]);
        }

        Promise.all([
            simService.countAll(user, [
                ["assigned_to_user_id", stat.id], ...dateConditions
            ]),
            simService.countAll(user, [
                ["assigned_to_user_id", stat.id], ["quality", SIMStatus.QUALITY],
                ["registered_on", "not", "is", null], ...dateConditions
            ]),
            simService.countAll(user, [
                ["assigned_to_user_id", stat.id],
            ]),
            simService.countAll(user, [
                ["quality", SIMStatus.NONQUALITY],
                ["assigned_to_user_id", stat.id], ...dateConditions
            ])
        ]).then(([r1, r2, r3, qualityRes]) => {
            sS({
                total: r1.count ?? 0,
                registered: r2.count ?? 0,
                assigned: r3.count ?? 0,
            })
            sNq(qualityRes.count ?? 0)
            setIsLoading(false)
        }).catch(err => {
            console.error("Error fetching user stats:", err)
            setIsLoading(false)
        })
    }, [user, stat.id, dateRange]);

    // Get quality-based styles
    const getQualityStyles = (rate) => {
        if (rate >= 95) {
            return {
                background: "bg-green-50 dark:bg-green-900/20",
                progressBar: "bg-green-500",
                badge: "bg-green-500 text-white",
                nonQualityBadge: "bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200",
                icon: <CheckCircle className="w-3 h-3 text-white"/>,
                showIcon: true
            };
        } else if (rate >= 85) {
            return {
                background: "bg-blue-50 dark:bg-blue-900/20",
                progressBar: "bg-blue-500",
                badge: "bg-blue-500 text-white",
                nonQualityBadge: "bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200",
                icon: null,
                showIcon: false
            };
        } else if (rate >= 70) {
            return {
                background: "bg-yellow-50 dark:bg-yellow-900/20",
                progressBar: "bg-yellow-500",
                badge: "bg-yellow-500 text-white",
                nonQualityBadge: "bg-yellow-200 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200",
                icon: null,
                showIcon: false
            };
        } else if (rate >= 50) {
            return {
                background: "bg-orange-50 dark:bg-orange-900/20",
                progressBar: "bg-orange-500",
                badge: "bg-orange-500 text-white",
                nonQualityBadge: "bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-200",
                icon: null,
                showIcon: false
            };
        } else {
            return {
                background: "bg-red-50 dark:bg-red-900/20",
                progressBar: "bg-red-500",
                badge: "bg-red-500 text-white",
                nonQualityBadge: "bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200",
                icon: null,
                showIcon: false
            };
        }
    };

    const qualityStyles = getQualityStyles(qualityRate);

    // Skeleton loader when data is loading
    if (isLoading) {
        return (
            <div
                className="flex px-2 items-center justify-between border-b border-gray-100 py-3 last:border-b-0 dark:border-gray-800 animate-pulse">
                <div className="flex items-center">
                    <div>
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
                <div className="flex flex-col w-full max-w-[140px] items-center gap-3">
                    <div className="h-1 w-full max-w-[100px] bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            {
                stats.assigned > 0 ? (
                    <div
                        className={`flex  items-center justify-between border-b border-gray-100 py-3 px-2 last:border-b-0 dark:border-gray-800`}>
                        <div className="flex items-center ">
                            <div>
                                <p className="text-sm font-medium relative text-gray-700 dark:text-gray-300">
                                    {stat.full_name}
                                    {
                                        qualityStyles.showIcon && (
                                            <p className="flex mt-1 absolute -top-2 -right-4 bg-green-500 rounded-full p-[2px] text-xs items-center gap-1">
                                                {qualityStyles.icon}
                                            </p>
                                        )
                                    }
                                </p>
                                <div className={"flex"}>
                                    <p
                                        onClick={() => {
                                            showModal({
                                                content: onClose => <UserStartDetails
                                                    dateFilters={dateRange}
                                                    onClose={onClose}
                                                    userId={stat.id}
                                                    userName={stat.full_name}
                                                />
                                            })
                                        }}
                                        className={`text-xs font-bold cursor-pointer bg-gray-200 text-gray-600 rounded-sm px-4`}>{nQ} Non-Quality</p>
                                </div>

                            </div>
                        </div>
                        <div className="group  relative">
                            <div className="flex flex-col w-full max-w-[140px] items-center gap-3">


                                <div
                                    className="relative block h-1 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
                                    <div
                                        className={`absolute left-0 top-0 flex h-full items-center justify-center rounded-sm ${qualityStyles.progressBar} text-xs font-medium text-white`}
                                        style={{width: `${qualityRate}%`}}
                                    ></div>
                                </div>
                                <div className="absolute bottom-full right-5 mb-2 hidden group-hover:block">
                                    <div
                                        className="bg-gray-900/70 text-white text-xs rounded py-2 max-w-screen px-2 whitespace-nowrap">
                                        {stats.registered} quality out of {stats.assigned} assigned
                                    </div>
                                    <div
                                        className="border-t-4 border-l-4 border-r-4 border-transparent border-t-gray-900/70 w-0 h-0 absolute right-2 -translate-x-1/2"></div>
                                </div>

                                <p className="text-xs font-medium text-gray-700 dark:text-gray-400">
                                    {qualityRate}% quality score
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        className={`flex  bg-amber-100 dark:bg-gray-800 items-center justify-between border-b border-gray-100 py-3 px-2 last:border-b-0 dark:border-gray-800`}>
                        <div className="flex gap-2 flex-col ">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {stat.full_name}
                                </p>
                            </div>
                            <span
                                className={"flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"}>
                                <AlertTriangle className="w-4 h-4 text-orange-500"/>
                                <span>No assigned lines found</span>
                            </span>
                        </div>
                    </div>
                )
            }
        </>
    )
}

const UserStartDetails = ({onClose, dateFilters, userName, userId}) => {
    const {user} = useApp();
    const [isLoading, setIsLoading] = useState(true);
    const [topUpCategories, setTopUpCategories] = useState(null);

    useEffect(() => {
        if (!user || !userId) return;

        setIsLoading(true);
        const dateConditions = [];
        if (dateFilters && dateFilters.startDate) {
            dateConditions.push(["registered_on", "gte", dateFilters.startDate]);
        }
        if (dateFilters && dateFilters.endDate) {
            dateConditions.push(["registered_on", "lte", dateFilters.endDate]);
        }
        simService.countTopUpCategories(user, [
            ["assigned_to_user_id", userId], ...dateConditions
        ])
            .then(data => {
                setTopUpCategories(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error fetching top-up categories:", err);
                setIsLoading(false);
            });
    }, [user, userId, dateFilters]);

    // Show loading skeleton when data is being fetched
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-auto overflow-hidden">
                <div className="relative bg-gradient-to-r from-green-600 to-green-700 px-6 py-5">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200"
                    >
                        <X size={18} className="text-white"/>
                    </button>
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/20 p-3 rounded-full">
                            <AlertCircle size={24} className="text-white"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Non-Quality Breakdown</h2>
                            <p className="text-green-100 text-sm">{userName ? `${userName} - ` : ''}Service Quality
                                Analysis</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 h-20 rounded-lg mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="border-l-4 rounded-lg p-4 bg-gray-100 dark:bg-gray-800">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const breakdownData = [
        {
            id: 1,
            label: '<50 KES',
            value: topUpCategories?.lt50 || 0,
            icon: AlertCircle,
            severity: 'low'
        },
        {
            id: 2,
            label: 'No Top-up',
            value: topUpCategories?.noTopUp || 0,
            icon: TrendingUp,
            severity: 'high'
        },
        {
            id: 3,
            label: '≥50 Not Conv',
            value: topUpCategories?.gte50NotConverted || 0,
            icon: AlertTriangle,
            severity: 'medium'
        }
    ];

    const total = breakdownData.reduce((sum, item) => sum + item.value, 0);

    const getSeverityStyles = (severity) => {
        switch (severity) {
            case 'low':
                return 'bg-green-50 dark:bg-green-900/20 border-l-green-500 text-green-700 dark:text-green-300';
            case 'medium':
                return 'bg-green-100 dark:bg-green-800/20 border-l-green-600 text-green-800 dark:text-green-200';
            case 'high':
                return 'bg-green-200 dark:bg-green-700/20 border-l-green-700 text-green-900 dark:text-green-100';
            default:
                return 'bg-green-50 dark:bg-green-900/20 border-l-green-500 text-green-700 dark:text-green-300';
        }
    };

    const getProgressWidth = (value) => {
        return `${(value / total) * 100}%`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-auto overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-green-600 to-green-700 px-6 py-5">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200"
                >
                    <X size={18} className="text-white"/>
                </button>

                <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-3 rounded-full">
                        <AlertCircle size={24} className="text-white"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Non-Quality Breakdown</h2>
                        <p className="text-green-100 text-sm">{userName ? `${userName} - ` : ''}Service Quality
                            Analysis</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Summary Stats */}
                <div
                    className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6 border border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">Total Issues</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{total}</p>
                        </div>
                        <div className="bg-green-600 p-3 rounded-full">
                            <TrendingUp size={20} className="text-white"/>
                        </div>
                    </div>
                </div>

                {/* Breakdown Items */}
                <div className="space-y-4">
                    {breakdownData.map((item) => {
                        const Icon = item.icon;
                        const percentage = getProgressWidth(item.value);

                        return (
                            <div key={item.id}
                                 className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                <div className="flex items-center space-x-2">
                                    <Icon size={16} className="text-green-600 dark:text-green-400"/>
                                    <span
                                        className="text-gray-700 dark:text-gray-300 text-sm font-medium">{item.label}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{percentage}</span>
                                    <span
                                        className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-semibold">
                                  {item.value}
                                </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Visual Summary */}
                <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Distribution
                        Overview</h4>
                    <div className="flex rounded-full overflow-hidden h-3 bg-gray-200 dark:bg-gray-600">
                        {breakdownData.map((item, index) => (
                            <div
                                key={item.id}
                                className={`transition-all duration-500 ${
                                    index === 0 ? 'bg-green-400' :
                                        index === 1 ? 'bg-green-600' : 'bg-green-500'
                                }`}
                                style={{width: getProgressWidth(item.value)}}
                                title={`${item.label}: ${item.value}`}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <span>Low Impact</span>
                        <span>High Impact</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-100 dark:border-gray-600">
                <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Last updated: {new Date().toLocaleDateString()}
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
