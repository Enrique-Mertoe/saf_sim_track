import useApp from "@/ui/provider/AppProvider";
import React, {useEffect, useState} from "react";
import simService from "@/services/simService";
import {SIMCard, SIMStatus, Team, User} from "@/models";
import {AlertCircle, Award, CheckCircle, Cpu, RefreshCw, XCircle} from "lucide-react";
import Signal from "@/lib/Signal";

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
    const matchedCards = simCards.filter(card => card.match === SIMStatus.MATCH).length;
    const unmatchedCards = simCards.filter(card => card.match === SIMStatus.UNMATCH).length;
    const qualityCards = simCards.filter(card => card.quality === SIMStatus.QUALITY).length;

    // Calculate percentages safely
    const matchedPercent = totalCards ? Math.round((matchedCards / totalCards) * 100) : 0;
    const unmatchedPercent = totalCards ? Math.round((unmatchedCards / totalCards) * 100) : 0;
    const qualityPercent = matchedCards ? Math.round((qualityCards / matchedCards) * 100) : 0;

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
        if (refreshing) {
            setIsRefreshing(true);
            fetchSimCards();
        }
    }, [refreshing]);

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
                    <>
                        <StatCard
                            title="Total SIM Cards"
                            value={totalCards}
                            color="blue"
                            isRefreshing={isRefreshing}
                            icon={<Cpu size={20}/>}
                        />

                        <StatCard
                            title="Matched"
                            value={matchedCards}
                            percentage={matchedPercent}
                            color="green"
                            isRefreshing={isRefreshing}
                            icon={<CheckCircle size={20}/>}
                        />

                        <StatCard
                            title="Unmatched"
                            value={unmatchedCards}
                            percentage={unmatchedPercent}
                            color="red"
                            isRefreshing={isRefreshing}
                            icon={<XCircle size={20}/>}
                        />

                        <StatCard
                            title="Quality"
                            value={qualityCards}
                            percentage={qualityPercent}
                            color="purple"
                            isRefreshing={isRefreshing}
                            icon={<Award size={20}/>}
                        />
                    </>
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
                      icon
                  }: {
    title: string;
    value: number;
    percentage?: number;
    color: "blue" | "green" | "red" | "purple";
    isRefreshing: boolean;
    icon: React.ReactNode;
}) {
    const [prevValue, setPrevValue] = useState(value);
    const [isAnimating, setIsAnimating] = useState(false);

    // Handle value changes with animation
    useEffect(() => {
        if (value !== prevValue && !isRefreshing) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setIsAnimating(false);
                setPrevValue(value);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [value, prevValue, isRefreshing]);

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

    return (
        <div
            className={`${colorClasses[color].bg} p-5 size-full min-h-34 rounded-lg transition-all duration-200 transform ${
                isAnimating ? 'scale-105' : ''
            } ${isRefreshing ? 'opacity-70' : 'opacity-100'} shadow-sm hover:shadow-md flex items-start`}
        >
            <div className={`${colorClasses[color].iconBg} p-2 rounded-lg mr-3`}>
                <div className={colorClasses[color].iconColor}>
                    {icon}
                </div>
            </div>

            <div>
                <p className={`text-sm font-medium ${colorClasses[color].text} mb-1`}>{title}</p>
                <div className="flex items-baseline">
                    <p className={`text-2xl font-bold ${colorClasses[color].value} ${
                        isAnimating ? 'animate-pulse' : ''
                    }`}>
                        {isRefreshing ? (
                            <span
                                className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                        ) : (
                            value.toLocaleString()
                        )}
                    </p>

                    {percentage !== undefined && (
                        <span className={`text-sm font-normal ml-2 ${colorClasses[color].percent}`}>
                            ({isRefreshing ? '...' : `${percentage}%`})
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}