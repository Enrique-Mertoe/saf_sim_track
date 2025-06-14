import React, {useCallback, useEffect, useId, useState} from 'react';
import {TrendingDown, TrendingUp} from 'lucide-react';
import {SIMStatus, User} from "@/models";
import {admin_id} from "@/services/helper";
import {DateTime} from "luxon";

interface StatData {
    total: number;
    today: number;
    week: number;
    pick: number;
    pickToday: number;
    lastFetched: number;
}

interface StatCardProps {
    title: string;
    color: "blue" | "green" | "red" | "purple";
    icon: React.ReactNode;
    user: User | null;
    tabs: Partial<string[]>
    onExpandClick?: () => void;
    expandable?: boolean;
    dataType: 'total' | 'activated' | 'unmatched' | 'quality' | 'registered';
    supabase: any; // Your Supabase client
    teamId?: string;
    refreshTrigger?: number; // External refresh trigger
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache to reduce API calls
const dataCache = new Map<string, StatData>();

function StatCard({
                      title,
                      color,
                      user,
                      icon,
                      tabs,
                      onExpandClick,
                      expandable = false,
                      dataType,
                      supabase,
                      teamId,
                      refreshTrigger = 0
                  }: StatCardProps) {
    const [data, setData] = useState<StatData>({total: 0, today: 0,
        pick:0,pickToday:0,
        week: 0, lastFetched: 0});
    const [isLoading, setIsLoading] = useState(!!user);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'total' | 'today'>(tabs[0] as any);
    const [isAnimating, setIsAnimating] = useState(false);

    // Generate cache key
    const getCacheKey = () => `${dataType}_${teamId || 'all'}`;

    // Get filter conditions based on data type
    const getFilterConditions = (adminId: any) => {
        if (!user) return null;

        // Create a fresh query builder each time
        let query = supabase
            .from('sim_cards')
            .select('*', {count: 'exact', head: true})
            .eq("admin_id", adminId);

        if (teamId) {
            query = query.eq('team_id', teamId);
        }

        switch (dataType) {
            case 'activated':
                return query.eq('status', SIMStatus.ACTIVATED);
            case 'unmatched':
                return query.eq('match', SIMStatus.UNMATCH);
            case 'quality':
                return query.eq('quality', SIMStatus.QUALITY);
            case 'registered':
                return query.not('registered_on', "is", null);
            default:
                return query;
        }
    };

    // Fetch data with optimized queries
    const fetchData = useCallback(async (force = false) => {
        if (!user) return
        const cacheKey = getCacheKey();
        const now = Date.now();
        const adminId = await admin_id(user);

        // Check cache first (unless forced refresh)
        if (!force && dataCache.has(cacheKey)) {
            const cached = dataCache.get(cacheKey)!;
            if (now - cached.lastFetched < CACHE_DURATION) {
                setData(cached);
                setIsLoading(false);
                return;
            }
        }

        try {
            setError(null);
            if (!isLoading) setIsRefreshing(true);

            // const today = TodayDaTe();
            // const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            // const startOfWeek = new Date(today);
            // startOfWeek.setDate(today.getDate() - 7);

            const today = DateTime.now().setZone("Africa/Nairobi");
            const startOfToday = today.startOf("day").toJSDate();
            const startOfWeek = today.minus({days: 7}).startOf("day").toJSDate();

            // Execute queries in parallel - each gets a fresh query builder
            const [totalResult, todayResult, weekResult,pickResult,pickToday] = await Promise.all([
                getFilterConditions(adminId),
                getFilterConditions(adminId)?.gte('registered_on', startOfToday.toISOString()),
                getFilterConditions(adminId)?.gte('registered_on', startOfWeek.toISOString()),
                getFilterConditions(adminId)?.neq('batch_id', "BATCH-UNKNOWN"),
                getFilterConditions(adminId)?.neq('batch_id',  "BATCH-UNKNOWN")?.gte('registered_on', startOfToday.toISOString()),
            ]);

            if (totalResult.error) throw totalResult.error;
            if (todayResult.error) throw todayResult.error;
            if (weekResult.error) throw weekResult.error;
            if (pickResult.error) throw pickResult.err;
            if (pickToday.error) throw pickToday.error;

            const newData: StatData = {
                total: totalResult.count || 0,
                today: todayResult.count || 0,
                pick: pickResult.count ?? 0,
                pickToday: pickToday.count ?? 0,
                week: weekResult.count || 0,
                lastFetched: now
            };

            // Update cache
            dataCache.set(cacheKey, newData);

            // Trigger animation if values changed
            if (data.total !== newData.total || data.today !== newData.today || data.week !== newData.week) {
                setIsAnimating(true);
                setTimeout(() => setIsAnimating(false), 600);
            }

            setData(newData);
        } catch (err) {
            console.error(`Error fetching ${dataType} data:`, err);
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [dataType, teamId, supabase, data, isLoading, user]);

    // Initial load
    useEffect(() => {
        fetchData().then();
    }, [fetchData]);

    // Handle external refresh trigger
    useEffect(() => {
        if (refreshTrigger > 0) {
            fetchData(true);
        }
    }, [refreshTrigger, fetchData]);

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
                if (cached && Date.now() - cached.lastFetched > CACHE_DURATION) {
                    fetchData();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [fetchData, getCacheKey]);

    const colorClasses = {
        blue: {
            bg: "bg-blue-50 dark:bg-blue-900/30",
            text: "text-blue-600 dark:text-blue-400",
            value: "text-blue-800 dark:text-blue-300",
            percent: "text-blue-700 dark:text-blue-400",
            iconBg: "bg-blue-100 dark:bg-blue-800/50",
            iconColor: "text-blue-600 dark:text-blue-400",
            tabActive: "bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-300",
            tabInactive: "text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        },
        green: {
            bg: "bg-green-50 dark:bg-green-900/30",
            text: "text-green-600 dark:text-green-400",
            value: "text-green-800 dark:text-green-300",
            percent: "text-green-700 dark:text-green-400",
            iconBg: "bg-green-100 dark:bg-green-800/50",
            iconColor: "text-green-600 dark:text-green-400",
            tabActive: "bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-300",
            tabInactive: "text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20"
        },
        red: {
            bg: "bg-red-50 dark:bg-red-900/30",
            text: "text-red-600 dark:text-red-400",
            value: "text-red-800 dark:text-red-300",
            percent: "text-red-700 dark:text-red-400",
            iconBg: "bg-red-100 dark:bg-red-800/50",
            iconColor: "text-red-600 dark:text-red-400",
            tabActive: "bg-red-100 dark:bg-red-800/50 text-red-800 dark:text-red-300",
            tabInactive: "text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        },
        purple: {
            bg: "bg-purple-50 dark:bg-purple-900/30",
            text: "text-purple-600 dark:text-purple-400",
            value: "text-purple-800 dark:text-purple-300",
            percent: "text-purple-700 dark:text-purple-400",
            iconBg: "bg-purple-100 dark:bg-purple-800/50",
            iconColor: "text-purple-600 dark:text-purple-400",
            tabActive: "bg-purple-100 dark:bg-purple-800/50 text-purple-800 dark:text-purple-300",
            tabInactive: "text-gray-500 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
        }
    };

    // Calculate trends
    const todayVsWeekTrend = data.week > 0
        ? Math.round(((data.today / (data.week / 7)) - 1) * 100)
        : 0;

    const getActiveValue = () => {
        return activeTab === 'total' ? data.total : data.today;
    };
    const getActivePick = () => {
        return activeTab === 'total' ? data.pick : data.pickToday;
    };

    const getActiveTrend = () => {
        return activeTab === 'today' ? todayVsWeekTrend : null;
    };

    const activeTrend = getActiveTrend();
    const isTrendPositive = activeTrend !== null && activeTrend >= 0;

    // Manual refresh function
    const handleRefresh = useCallback((e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        fetchData(true);
    }, [fetchData]);


    return (
        <div
            className={`${colorClasses[color].bg} p-5 w-full rounded-lg transition-all duration-200 transform ${
                isAnimating ? 'scale-105' : ''
            } ${isRefreshing ? 'opacity-70' : 'opacity-100'} shadow-sm hover:shadow-md ${
                expandable ? 'cursor-pointer' : ''
            } relative group`}
            onClick={() => expandable && onExpandClick?.()}
        >
            {/* Manual refresh button */}
            <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                title="Refresh data"
            >
                <svg className={`w-4 h-4 ${colorClasses[color].text} ${isRefreshing ? 'animate-spin' : ''}`} fill="none"
                     stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
            </button>

            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                    <div className={`${colorClasses[color].iconBg} p-2 rounded-lg mr-3`}>
                        <div className={colorClasses[color].iconColor}>
                            {icon}
                        </div>
                    </div>
                    <div>
                        <p className={`text-sm font-medium ${colorClasses[color].text}`}>{title}</p>
                        {error && (
                            <p className="text-xs text-red-500 mt-1">Failed to load</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            {
                tabs.length > 1 && (
                    <div className={`grid ${[
                        "",
                        "grid-cols-1",
                        "grid-cols-2"
                    ][tabs.length]} mb-2 border-b border-gray-200 dark:border-gray-700`}>
                        {
                            tabs.map((tab,index) => {
                                if (tab == "today")
                                    return (<button key={index}
                                        className={`px-3 py-1 text-xs font-medium rounded-t-md w-full text-center transition-colors ${
                                            activeTab === 'today' ? colorClasses[color].tabActive : colorClasses[color].tabInactive
                                        }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveTab('today');
                                        }}
                                    >
                                        Today
                                    </button>)
                                if (tab == "total") return (<button
                                    key={index}
                                    className={`px-3 py-1 text-xs font-medium rounded-t-md w-full text-center transition-colors ${
                                        activeTab === 'total' ? colorClasses[color].tabActive : colorClasses[color].tabInactive
                                    }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('total');
                                    }}
                                >
                                    Total
                                </button>)
                            })
                        }
                    </div>
                )

            }

            {/* Value display */}
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex gap-1 items-center justify-center">
                        <p className={`text-2xl font-bold ${colorClasses[color].value} ${
                            isAnimating ? 'animate-pulse' : ''
                        }`}>
                            {isRefreshing || isLoading ? (
                                <span
                                    className="inline-block w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                            ) : (
                                getActiveValue().toLocaleString()
                            )}
                        </p>
                        {
                            isRefreshing || isLoading ? '' :

                                (<TreeDiagram picklist={getActivePick()}
                                              extra={(getActiveValue() -  getActivePick()).toLocaleString()} theme={color}/>)
                        }
                    </div>

                    {/* Trend indicator */}
                    {!isRefreshing && !isLoading && !error && activeTrend !== null && (
                        <div className={`flex items-center ${isTrendPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isTrendPositive ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                            <span className="text-xs font-medium ml-1">{Math.abs(activeTrend)}%</span>
                        </div>
                    )}
                </div>

                {activeTab === 'today' && !error && (
                    <p className="text-xs text-gray-500 mt-1">
                        {todayVsWeekTrend >= 0
                            ? `${todayVsWeekTrend}% above`
                            : `${Math.abs(todayVsWeekTrend)}% below`} daily average
                    </p>
                )}
            </div>

            {/* Last updated indicator */}
            {!isLoading && !error && (
                <p className="text-xs text-gray-400 mt-2">
                    Updated {Math.floor((Date.now() - data.lastFetched) / 60000)}m ago
                </p>
            )}
        </div>
    );
}

const TreeDiagram = ({picklist, extra, theme = "blue"}: any) => {
    const id = useId();
    const gradientId = `themeGradient-${id}`;
    const filterId = `glow-${id}`;

    const themes = {
        blue: {
            gradient: ["#1E88E5", "#64B5F6"],
            picklist: "#1E88E5",
            extra: "#1565C0"
        },
        green: {
            gradient: ["#2E7D32", "#66BB6A"],
            picklist: "#2E7D32",
            extra: "#66BB6A"
        },
        red: {
            gradient: ["#E53935", "#EF9A9A"],
            picklist: "#E53935",
            extra: "#B71C1C"
        },
        purple: {
            gradient: ["#8E24AA", "#BA68C8"],
            picklist: "#AB47BC",
            extra: "#8E24AA"
        }
    };

    // @ts-ignore
    const current = themes[theme] || themes.green;

    return (
        <svg width="150" height="80" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", margin: "auto" }}>
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={current.gradient[0]} />
                    <stop offset="100%" stopColor={current.gradient[1]} />
                </linearGradient>
                {/*<filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">*/}
                {/*    <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />*/}
                {/*    <feMerge>*/}
                {/*        <feMergeNode in="blur" />*/}
                {/*        <feMergeNode in="SourceGraphic" />*/}
                {/*    </feMerge>*/}
                {/*</filter>*/}
            </defs>

            {/* Arms - adjusted closer vertically */}
            <path
                d="M10 40 H30 Q35 40 35 36 V30 Q35 26 40 26 H60"
                stroke={`url(#${gradientId})`}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                filter={`url(#${filterId})`}
            />

            <path
                d="M30 40 Q35 40 35 44 V50 Q35 54 40 54 H60"
                stroke={`url(#${gradientId})`}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                filter={`url(#${filterId})`}
            />

            {/* Radio-style Dots */}
            <circle cx="60" cy="26" r="6" fill="white" stroke={current.picklist} strokeWidth="2" />
            <circle cx="60" cy="26" r="2" fill={current.picklist} />

            <circle cx="60" cy="54" r="6" fill="white" stroke={current.extra} strokeWidth="2" />
            <circle cx="60" cy="54" r="2" fill={current.extra} />

            {/* Top Label */}
            <text x="70" y="31" fontSize="10" fill={current.picklist} fontWeight="bold" fontFamily="Arial, sans-serif"> Picklist: {picklist || 0}</text>

            {/* Bottom Label */}
            <text x="70" y="59" fontSize="10" fill={current.extra} fontWeight="bold" fontFamily="Arial, sans-serif"> Extra:{extra || 0}</text>
        </svg>
    );
};


export default StatCard;