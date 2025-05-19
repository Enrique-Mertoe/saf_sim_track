import useApp from "@/ui/provider/AppProvider";
import React, {useEffect, useState} from "react";
import simService from "@/services/simService";
import {SIMCard, SIMStatus, Team, User} from "@/models";
import {
    AlertCircle,
    Award, BarChart,
    CheckCircle, ChevronDown,
    ChevronUp,
    Cpu,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    XCircle
} from "lucide-react";
import Signal from "@/lib/Signal";
import StartPreview from "@/app/dashboard/components/StartPreview";
import {useDialog} from "@/app/_providers/dialog";

type SimAdapter = SIMCard & {
    team_id: Team;
    sold_by_user_id: User;
}

export default function SimStats({refreshing = false}) {
    const [simCards, setSimCards] = useState<SimAdapter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(refreshing);
    const {user} = useApp();

    // Stats calculated from sim cards
    const totalCards = simCards.length;
    const matchedCards = simCards.filter(card => card.match === SIMStatus.MATCH);
    const unmatchedCards = simCards.filter(card => card.match === SIMStatus.UNMATCH);
    const qualityCards = simCards.filter(card => card.quality === SIMStatus.QUALITY);

    // Calculate percentages safely
    const matchedPercent = totalCards ? Math.round((matchedCards.length / totalCards) * 100) : 0;
    const unmatchedPercent = totalCards ? Math.round((unmatchedCards.length / totalCards) * 100) : 0;
    const qualityPercent = matchedCards ? Math.round((qualityCards.length / matchedCards.length) * 100) : 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    function countByDate(cards: SimAdapter[]) {
        return {
            total: cards.length,
            today: cards.filter(card => new Date(card.activation_date || "") >= startOfToday).length,
            thisWeek: cards.filter(card => new Date(card.activation_date || "") >= startOfWeek).length
        };
    }

    const matchedStats = countByDate(matchedCards);
    const unmatchedStats = countByDate(unmatchedCards);
    const qualityStats = countByDate(qualityCards);
    const totalStats = countByDate(simCards);


    const fetchSimCards = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const {data, error} = await simService.getAllSimCards(user!);
            if (error) throw error;

            setSimCards(data as SimAdapter[]);
        } catch (err) {
            console.error("Failed to fetch SIM cards:", err);
            setError('Failed to fetch SIM cards. Please try again later.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchSimCards();
        Signal.trigger("m-refresh", true);
    };

    // Initial fetch
    useEffect(() => {
        if (!user) return;
        fetchSimCards();
    }, [user]);

    // Handle refreshing prop changes
    useEffect(() => {
        if (!user)
            return
        if (refreshing) {
            setIsRefreshing(true);
            fetchSimCards();
        }
    }, [refreshing, user]);
    const dialog = useDialog()

    // Shimmer loading effect for each card
    const LoadingSkeleton = () => (
        <>
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg animate-pulse flex items-start">
                    <div className="mr-4 bg-gray-200 dark:bg-gray-700 rounded-full p-2 w-10 h-10"></div>
                    <div className="flex-1">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            ))}
        </>
    );

    // Error state
    if (error) {
        return (
            <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg text-center flex flex-col items-center">
                    <AlertCircle size={36} className="text-red-500 dark:text-red-400 mb-2"/>
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
    const statCards = [
        {
            title: "SIM Cards",
            value: totalStats.total,
            todayValue: totalStats.today,
            weekValue: totalStats.thisWeek,
            color: "blue",
            icon: <BarChart size={18}/>,
            expandable: true,
        },
        {
            title: "Matched",
            value: matchedStats.total,
            todayValue: matchedStats.today,
            weekValue: matchedStats.thisWeek,
            percentage: matchedPercent,
            color: "green",
            icon: <CheckCircle size={20}/>,
        },
        {
            title: "Unmatched",
            value: unmatchedStats.total,
            todayValue: unmatchedStats.today,
            weekValue: unmatchedStats.thisWeek,
            percentage: unmatchedPercent,
            color: "red",
            icon: <XCircle size={20}/>,
        },
        {
            title: "Quality",
            value: qualityStats.total,
            todayValue: qualityStats.today,
            weekValue: qualityStats.thisWeek,
            percentage: qualityPercent,
            color: "purple",
            icon: <Award size={20}/>,
        },
    ];


    return (
        <div className="relative">
            {/* Refresh button */}
            <button
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                className="absolute -top-12 right-0 p-2 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-1"
                aria-label="Refresh stats"
            >
                <RefreshCw
                    size={16}
                    className={`text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">Refresh</span>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {isLoading && !isRefreshing ? (
                    <LoadingSkeleton/>
                ) : (
                    statCards.map((card, index) => {
                        const d = dialog;
                        return (
                            <StatCard
                                key={index}
                                title={card.title}
                                value={card.value}
                                weekValue={card.weekValue}
                                todayValue={card.todayValue}
                                percentage={card.percentage}
                                //@ts-ignore
                                color={card.color}
                                isRefreshing={isRefreshing}
                                icon={card.icon}
                                onExpandClick={() => {
                                    const dialogRef = d.create({
                                        content: (
                                            <StartPreview
                                                card={card}
                                                onClose={() => dialogRef.dismiss()}
                                            />
                                        ),
                                        size: "lg",
                                    });
                                }
                                }
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}

// Reusable stat card component with animations
function StatCard({
                      title,
                      value,
                      percentage,
                      color,
                      isRefreshing,
                      todayValue = 0,
                      weekValue = 0,
                      icon, onExpandClick
                  }: {
    title: string;
    value: number;
    weekValue?: number;
    todayValue?: number;
    percentage?: number;
    color: "blue" | "green" | "red" | "purple";
    isRefreshing: boolean;
    icon: React.ReactNode;
    onExpandClick?: Closure;
}) {
    const [prevValue, setPrevValue] = useState(value);
    const [prevTodayValue, setPrevTodayValue] = useState(todayValue);
    const [prevWeekValue, setPrevWeekValue] = useState(weekValue);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    // Handle value changes with animation
    useEffect(() => {
        if ((value !== prevValue || todayValue !== prevTodayValue || weekValue !== prevWeekValue) && !isRefreshing) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setIsAnimating(false);
                setPrevValue(value);
                setPrevTodayValue(todayValue);
                setPrevWeekValue(weekValue);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [value, prevValue, todayValue, weekValue, prevTodayValue, prevWeekValue, isRefreshing]);

    const colorClasses = {
        blue: {
            bg: "bg-blue-50 dark:bg-blue-900/30",
            text: "text-blue-600 dark:text-blue-400",
            value: "text-blue-800 dark:text-blue-300",
            percent: "text-blue-700 dark:text-blue-400",
            iconBg: "bg-blue-100 dark:bg-blue-800/50",
            iconColor: "text-blue-600 dark:text-blue-400"
        },
        green: {
            bg: "bg-green-50 dark:bg-green-900/30",
            text: "text-green-600 dark:text-green-400",
            value: "text-green-800 dark:text-green-300",
            percent: "text-green-700 dark:text-green-400",
            iconBg: "bg-green-100 dark:bg-green-800/50",
            iconColor: "text-green-600 dark:text-green-400"
        },
        red: {
            bg: "bg-red-50 dark:bg-red-900/30",
            text: "text-red-600 dark:text-red-400",
            value: "text-red-800 dark:text-red-300",
            percent: "text-red-700 dark:text-red-400",
            iconBg: "bg-red-100 dark:bg-red-800/50",
            iconColor: "text-red-600 dark:text-red-400"
        },
        purple: {
            bg: "bg-purple-50 dark:bg-purple-900/30",
            text: "text-purple-600 dark:text-purple-400",
            value: "text-purple-800 dark:text-purple-300",
            percent: "text-purple-700 dark:text-purple-400",
            iconBg: "bg-purple-100 dark:bg-purple-800/50",
            iconColor: "text-purple-600 dark:text-purple-400"
        }
    };
    const trendPercentage = weekValue > 0
        ? Math.round(((todayValue - weekValue) / weekValue) * 100)
        : 0;

    const isTrendPositive = trendPercentage >= 0;

    function calcTPercentage() {
        return Math.abs(trendPercentage);
    }

    return (
        <div
            className={`${colorClasses[color].bg} p-5 w-full rounded-lg transition-all duration-200 transform ${
                isAnimating ? 'scale-105' : ''
            } ${isRefreshing ? 'opacity-70' : 'opacity-100'} shadow-sm hover:shadow-md`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                    <div className={`${colorClasses[color].iconBg} p-2 rounded-lg mr-3`}>
                        <div className={colorClasses[color].iconColor}>
                            {icon}
                        </div>
                    </div>
                    <p className={`text-sm font-medium ${colorClasses[color].text}`}>{title}</p>
                </div>

                {percentage !== undefined && (
                    <span className={`text-sm font-semibold ${colorClasses[color].percent} flex items-center`}>
            {percentage}%
          </span>
                )}
            </div>

            {/* General value */}
            <div className="mb-4">
                <p className={`text-2xl font-bold ${colorClasses[color].value} ${
                    isAnimating ? 'animate-pulse' : ''
                }`}>
                    {isRefreshing ? (
                        <span
                            className="inline-block w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                    ) : <div className={"flex items-center"}>
                        Total: <div className="w-1"></div>
                        {value.toLocaleString()}
                    </div>}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                {/* Today's value */}
                <div className="border-r border-gray-200 dark:border-gray-700 pr-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Today</p>
                    <p className={`text-xl font-bold ${colorClasses[color].value} ${
                        isAnimating ? 'animate-pulse' : ''
                    }`}>
                        {isRefreshing ? (
                            <span
                                className="inline-block w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                        ) : todayValue.toLocaleString()}
                    </p>
                </div>

                {/* This week's value */}
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">This Week</p>
                    <div className="flex items-center">
                        <p className={`text-xl font-bold ${colorClasses[color].value} ${
                            isAnimating ? 'animate-pulse' : ''
                        }`}>
                            {isRefreshing ? (
                                <span
                                    className="inline-block w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                            ) : weekValue.toLocaleString()}
                        </p>

                        {/* Trend indicator */}
                        {!isRefreshing && trendPercentage !== 0 && (
                            <div
                                className={`flex items-center ml-2 ${isTrendPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {isTrendPositive ?
                                    <TrendingUp size={16}/> :
                                    <TrendingDown size={16}/>
                                }
                                <span className="text-xs font-medium ml-1">{calcTPercentage()}%</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* View More / Expand Section */}
            <div className="pt-2 text-center">
                <button
                    onClick={() => {
                        onExpandClick?.();
                    }}
                    className={`inline-flex items-center cursor-pointer justify-center text-sm font-medium ${colorClasses[color].text} hover:opacity-80 transition-opacity`}
                >
                    <span>View More</span>
                    <ChevronDown size={16} className="ml-1"/>

                </button>
            </div>
        </div>
    );
}