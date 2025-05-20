import React from 'react';
import { SIMCard, SIMStatus } from "@/models";
import { ArrowUpIcon, ArrowDownIcon, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

type StatsCardProps = {
    simCards: SIMCard[];
    previousSimCards?: SIMCard[];
    loading?: boolean;
    period: 'daily' | 'weekly' | 'monthly' | 'custom';
};

type StatItemType = {
    title: string;
    value: number;
    previousValue?: number;
    color: string;
    darkColor: string;
    lightColor: string;
    darkLightColor: string;
    borderColor: string;
    darkBorderColor: string;
    icon?: React.ReactNode;
    pairs?: {
        title: string;
        value: number;
        previousValue?: number;
    }[];
};

export default function ConsolidatedStatsCard({ simCards, previousSimCards = [], loading = false, period }: StatsCardProps) {
    // Function to calculate percentage change
    const calculateChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    // Function to format percentage change
    const formatChange = (change: number): string => {
        return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    // Calculate stats from simCards
    const stats = {
        sold: simCards.length,
        quality: simCards.filter(card => card.quality === SIMStatus.QUALITY).length,
        nonQuality: simCards.filter(card => card.quality !== SIMStatus.QUALITY).length,
        matched: simCards.filter(card => card.match === SIMStatus.MATCH).length,
        unmatched: simCards.filter(card => card.match === SIMStatus.UNMATCH).length,
        activated: simCards.filter(card => card.status=SIMStatus.ACTIVATED).length,
        notActivated: simCards.filter(card => !(card.status == SIMStatus.ACTIVATED)).length,
    };

    // Calculate previous stats if available
    const prevStats = {
        sold: previousSimCards.length,
        quality: previousSimCards.filter(card => card.quality === SIMStatus.QUALITY).length,
        nonQuality: previousSimCards.filter(card => card.quality !== SIMStatus.QUALITY).length,
        matched: previousSimCards.filter(card => card.match === SIMStatus.MATCH).length,
        unmatched: previousSimCards.filter(card => card.match === SIMStatus.UNMATCH).length,
        activated: previousSimCards.filter(card => card.status=SIMStatus.ACTIVATED).length,
        notActivated: previousSimCards.filter(card => !(card.status == SIMStatus.ACTIVATED)).length,
    };

    // Define stats items with their visual properties
    const statItems: StatItemType[] = [
        {
            title: "Sold",
            value: stats.sold,
            previousValue: prevStats.sold,
            color: "bg-green-50",
            darkColor: "dark:bg-green-900/20",
            lightColor: "text-green-600",
            darkLightColor: "dark:text-green-400",
            borderColor: "border-green-200",
            darkBorderColor: "dark:border-green-800",
        },
        {
            title: "Quality",
            value: stats.quality,
            previousValue: prevStats.quality,
            color: "bg-blue-50",
            darkColor: "dark:bg-blue-900/20",
            lightColor: "text-blue-600",
            darkLightColor: "dark:text-blue-400",
            borderColor: "border-blue-200",
            darkBorderColor: "dark:border-blue-800",
            pairs: [
                {
                    title: "Non-Quality",
                    value: stats.nonQuality,
                    previousValue: prevStats.nonQuality,
                }
            ]
        },
        {
            title: "Matched",
            value: stats.matched,
            previousValue: prevStats.matched,
            color: "bg-purple-50",
            darkColor: "dark:bg-purple-900/20",
            lightColor: "text-purple-600",
            darkLightColor: "dark:text-purple-400",
            borderColor: "border-purple-200",
            darkBorderColor: "dark:border-purple-800",
            pairs: [
                {
                    title: "Unmatched",
                    value: stats.unmatched,
                    previousValue: prevStats.unmatched,
                }
            ]
        },
        {
            title: "Activated",
            value: stats.activated,
            previousValue: prevStats.activated,
            color: "bg-amber-50",
            darkColor: "dark:bg-amber-900/20",
            lightColor: "text-amber-600",
            darkLightColor: "dark:text-amber-400",
            borderColor: "border-amber-200",
            darkBorderColor: "dark:border-amber-800",
            pairs: [
                {
                    title: "Not Activated",
                    value: stats.notActivated,
                    previousValue: prevStats.notActivated,
                }
            ]
        }
    ];

    // Get comparison period text
    const getComparisonText = () => {
        switch (period) {
            case 'daily':
                return 'vs yesterday';
            case 'weekly':
                return 'vs last week';
            case 'monthly':
                return 'vs last month';
            case 'custom':
                return 'vs previous period';
            default:
                return '';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statItems.map((stat, index) => (
                <div
                    key={index}
                    className={`${stat.color} ${stat.darkColor} p-4 rounded-lg shadow-sm border ${stat.borderColor} ${stat.darkBorderColor} flex flex-col`}
                >
                    <div className="flex justify-between">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.title}</p>
                        {previousSimCards.length > 0 && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                                {getComparisonText()}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-end mb-2">
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            {loading ? '...' : stat.value.toLocaleString()}
                        </p>

                        {!loading && previousSimCards.length > 0 && stat.previousValue !== undefined && (
                            <div className="flex items-center">
                                {stat.value > stat.previousValue ? (
                                    <div className="text-green-500 flex items-center">
                                        <ArrowUpIcon size={14} />
                                        <span className="ml-1 text-xs">{formatChange(calculateChange(stat.value, stat.previousValue))}</span>
                                    </div>
                                ) : stat.value < stat.previousValue ? (
                                    <div className="text-red-500 flex items-center">
                                        <ArrowDownIcon size={14} />
                                        <span className="ml-1 text-xs">{formatChange(Math.abs(calculateChange(stat.value, stat.previousValue)))}</span>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 flex items-center">
                                        <Minus size={14} />
                                        <span className="ml-1 text-xs">0%</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mini chart could go here */}
                    {!loading && previousSimCards.length > 0 && (
                        <div className="h-8 mb-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                                <motion.div
                                    className={`h-1.5 rounded-full ${stat.lightColor} ${stat.darkLightColor}`}
                                    initial={{ width: "0%" }}
                                    animate={{
                                        width: `${Math.min(Math.max((stat.value / (stat.previousValue || 1)) * 100, 0), 100)}%`
                                    }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Paired stats (if any) */}
                    {stat.pairs && stat.pairs.map((pair, pairIndex) => (
                        <div key={pairIndex} className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between">
                                <p className="text-sm text-gray-500 dark:text-gray-400">{pair.title}</p>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {loading ? '...' : pair.value.toLocaleString()}
                                    {!loading && previousSimCards.length > 0 && pair.previousValue !== undefined && (
                                        <span className="ml-2 text-xs">
                                            {pair.value > pair.previousValue ? (
                                                <span className="text-green-500">+{calculateChange(pair.value, pair.previousValue).toFixed(1)}%</span>
                                            ) : pair.value < pair.previousValue ? (
                                                <span className="text-red-500">{calculateChange(pair.value, pair.previousValue).toFixed(1)}%</span>
                                            ) : (
                                                <span className="text-gray-500">0%</span>
                                            )}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}