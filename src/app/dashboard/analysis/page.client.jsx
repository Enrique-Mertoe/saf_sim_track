"use client"
import React, {useCallback, useEffect, useState} from 'react';
import {Cell, Pie, PieChart, ResponsiveContainer, Tooltip} from 'recharts';
import {CheckCircle, Download, XCircle} from 'lucide-react';
import useApp from "@/ui/provider/AppProvider";
import simCardService from "@/services/simService";
import simService from "@/services/simService";
import {DateTime} from "luxon";
import TeamBreakdownCard from "@/app/dashboard/analysis/TeamBreakDown";
import {MetricCard} from "@/app/dashboard/analysis/Metricard";
import TeamAnalysisGraph from "@/app/dashboard/analysis/TeamAnalysisGraph";
import {SIMStatus} from "@/models";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache
const dataCache = new Map();

const SIMAnalysisPage = () => {
    const {user} = useApp();
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
            const {data: teamsData, error: teamsError} = await simCardService.getTeamStats(user, dateFilters);

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
                };
            });

            // // Calculate total metrics
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


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SIM Quality Analysis</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Comprehensive breakdown of team performance
                            and quality metrics</p>
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
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2">
                            <Download className="h-4 w-4"/>
                            <span>Export</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-8">
                    {/* Key Metrics Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/*<MetricCard*/}
                        {/*    user={user}*/}
                        {/*    title="Total Recorded"*/}
                        {/*    value={0}*/}
                        {/*    dataType={"total"}*/}
                        {/*    subtitle="Across all teams"*/}
                        {/*    icon={Smartphone}*/}
                        {/*    trend={12}*/}
                        {/*    color="green"*/}
                        {/*/>*/}
                        <MetricCard
                            user={user}
                            title="Total Quality"
                            dataType={"quality"}
                            value={totalMetrics.totalQuality}
                            subtitle={`${((totalMetrics.totalQuality / totalMetrics.totalRecorded) * 100).toFixed(1)}% quality rate`}
                            icon={CheckCircle}
                            trend={8}
                            color="green"
                        />
                        <MetricCard
                            user={user}
                            title="Total Non-Quality"
                            dataType={"nonQuality"}
                            value={totalMetrics.totalQuality}
                            subtitle={`${((totalMetrics.totalQuality / totalMetrics.totalRecorded) * 100).toFixed(1)}% quality rate`}
                            icon={XCircle}
                            trend={8}
                            color="red"
                        />
                        <MetricCard
                            user={user}
                            title="Lines Connected"
                            dataType={"activated"}
                            value={totalMetrics.totalNonQuality}
                            subtitle={`${((totalMetrics.totalNonQuality / totalMetrics.totalRecorded) * 100).toFixed(1)}% of total`}
                            icon={XCircle}
                            trend={-3}
                            color="amber"
                        />
                        {/*<MetricCard*/}
                        {/*    user={user}*/}
                        {/*    title="Unknown Status"*/}
                        {/*    value={totalMetrics.totalUnknown}*/}
                        {/*    subtitle={`${((totalMetrics.totalUnknown / totalMetrics.totalRecorded) * 100).toFixed(1)}% unmatched`}*/}
                        {/*    icon={AlertTriangle}*/}
                        {/*    trend={-5}*/}
                        {/*    color="orange"*/}
                        {/*/>*/}
                    </div>

                    <TeamAnalysisGraph user={user}/>
                </div>

                <div className="md:col-span-4">
                    <ContactsBySource user={user}/>
                </div>
            </div>

            {/* Team Breakdown Cards */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Detailed Team Analysis</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                    {teamData.map(team => (
                        <TeamBreakdownCard user={user} key={team.id} team={team}/>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default SIMAnalysisPage;

const ContactsBySource = ({user}) => {
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const [selectedSegment, setSelectedSegment] = useState(null);
    const [data, sB] = useState([]);

    async function loadData() {
        if (!user)
            return
        const data = await simService.countTopUpCategories(user, [["quality", SIMStatus.NONQUALITY]])
        sB([
            {name: 'Below 50 Top-up', value: data.lt50, color: '#3B82F6', description: 'Lines with less than 50 KES'},
            {name: 'No Top-up', value: data.noTopUp, color: '#10B981', description: 'Lines without top-up'},
            {
                name: 'Above 50 Not Conv',
                value: data.gte50NotConverted,
                color: '#F59E0B',
                description: 'Lines with 50+ KES not converted'
            }
        ])
    }

    useEffect(() => {
        loadData().then()
    }, [user]);

    const total = data.reduce((sum, item) => sum + item.value, 0);

    const CustomTooltip = ({active, payload}) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            return (
                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 max-w-xs">
                    <div className="text-sm text-gray-600 font-semibold mb-3">Contact Details</div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{backgroundColor: data.payload.color}}
                                ></div>
                                <span className="text-sm text-gray-700 font-medium">{data.name}</span>
                            </div>
                        </div>
                        <div className="text-lg font-bold text-gray-800">{data.value.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{data.payload.description}</div>
                        <div className="text-xs text-blue-600 font-semibold">
                            {((data.value / total) * 100).toFixed(1)}% of total
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const handlePieEnter = (_, index) => {
        setHoveredSegment(index);
    };

    const handlePieLeave = () => {
        setHoveredSegment(null);
    };

    const handlePieClick = (_, index) => {
        setSelectedSegment(selectedSegment === index ? null : index);
    };

    return (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 p-2">
            <div className="grid grid-cols-1 gap-2">
                {/* Statistics Grid */}
                <div className="">
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Non-Quality</h3>
                        <p className="text-gray-600">Non-quality breakdown and analysis</p>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="flex flex-col justify-center">
                    <div className="relative isolate">
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={120}
                                    paddingAngle={3}
                                    dataKey="value"
                                    onMouseEnter={handlePieEnter}
                                    onMouseLeave={handlePieLeave}
                                    onClick={handlePieClick}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            stroke={hoveredSegment === index || selectedSegment === index ? '#374151' : 'none'}
                                            strokeWidth={hoveredSegment === index || selectedSegment === index ? 2 : 0}
                                            style={{
                                                filter: hoveredSegment === index || selectedSegment === index
                                                    ? 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                                                    : 'none',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip/>}/>
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Total */}
                        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
                            <div
                                className="bg-white rounded-full w-28 h-28 flex flex-col items-center justify-center shadow-lg border-4 border-blue-100">
                                <h3 className="text-3xl font-bold text-gray-800">{total.toLocaleString()}</h3>
                                <p className="text-xs text-gray-500 font-medium">Total</p>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-6 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Segment Breakdown</h4>
                        {data.map((item, index) => (
                            <div
                                key={item.name}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                    hoveredSegment === index || selectedSegment === index
                                        ? 'bg-blue-50 border-l-4 border-blue-400'
                                        : 'hover:bg-gray-50'
                                }`}
                                onMouseEnter={() => setHoveredSegment(index)}
                                onMouseLeave={() => setHoveredSegment(null)}
                                onClick={() => setSelectedSegment(selectedSegment === index ? null : index)}
                            >
                                <div className="flex items-center">
                                    <div
                                        className="w-3 h-3 rounded-full mr-3"
                                        style={{backgroundColor: item.color}}
                                    ></div>
                                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-800">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};