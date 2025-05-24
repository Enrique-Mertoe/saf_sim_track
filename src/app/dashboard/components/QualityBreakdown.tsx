import React from 'react';
import { SIMCard, SIMStatus } from "@/models";
import { ArrowUpIcon, ArrowDownIcon, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

type QualityBreakdownProps = {
    simCards: SIMCard[];
    previousSimCards?: SIMCard[];
    loading?: boolean;
    period: 'daily' | 'weekly' | 'monthly' | 'custom';
    teamData?: { [teamId: string]: string }; // Map of team IDs to team names
};

export default function QualityBreakdown({ 
    simCards, 
    previousSimCards = [], 
    loading = false, 
    period,
    teamData = {}
}: QualityBreakdownProps) {
    // Function to calculate percentage change
    const calculateChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    // Function to format percentage change
    const formatChange = (change: number): string => {
        return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    // Group SIM cards by team
    const groupByTeam = (cards: SIMCard[]) => {
        const result: { [teamId: string]: SIMCard[] } = {};
        
        cards.forEach(card => {
            const teamId = card.team_id || 'unknown';
            if (!result[teamId]) {
                result[teamId] = [];
            }
            result[teamId].push(card);
        });
        
        return result;
    };

    // Calculate quality metrics for a set of SIM cards
    const calculateQualityMetrics = (cards: SIMCard[]) => {
        const total = cards.length;
        const goodQuality = cards.filter(card => card.quality === SIMStatus.QUALITY).length;
        const poorQuality = total - goodQuality;
        
        // Breakdown of poor quality
        const topUpBelow50 = cards.filter(card => 
            card.quality !== SIMStatus.QUALITY && 
            card.top_up_amount !== undefined && 
            card.top_up_amount > 0 && 
            card.top_up_amount < 50
        ).length;
        
        const noTopUp = cards.filter(card => 
            card.quality !== SIMStatus.QUALITY && 
            (card.top_up_amount === undefined || card.top_up_amount === 0)
        ).length;
        
        const topUp50NotConverted = cards.filter(card => 
            card.quality !== SIMStatus.QUALITY && 
            card.top_up_amount !== undefined && 
            card.top_up_amount >= 50
        ).length;
        
        return {
            total,
            goodQuality,
            poorQuality,
            topUpBelow50,
            noTopUp,
            topUp50NotConverted
        };
    };

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

    // Group cards by team
    const teamCards = groupByTeam(simCards);
    const prevTeamCards = groupByTeam(previousSimCards);
    
    // Calculate overall metrics
    const overallMetrics = calculateQualityMetrics(simCards);
    const prevOverallMetrics = calculateQualityMetrics(previousSimCards);
    
    // Calculate team metrics
    const teamMetrics: { [teamId: string]: ReturnType<typeof calculateQualityMetrics> } = {};
    const prevTeamMetrics: { [teamId: string]: ReturnType<typeof calculateQualityMetrics> } = {};
    
    Object.entries(teamCards).forEach(([teamId, cards]) => {
        teamMetrics[teamId] = calculateQualityMetrics(cards);
    });
    
    Object.entries(prevTeamCards).forEach(([teamId, cards]) => {
        prevTeamMetrics[teamId] = calculateQualityMetrics(cards);
    });
    
    // Sort teams by total connections
    const sortedTeams = Object.keys(teamMetrics).sort((a, b) => 
        teamMetrics[b].total - teamMetrics[a].total
    );

    return (
        <div className="space-y-6">
            {/* Overall Quality Summary */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Overall Quality Summary
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Connections */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Connections</p>
                        <div className="flex justify-between items-end">
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {loading ? '...' : overallMetrics.total.toLocaleString()}
                            </p>
                            
                            {!loading && previousSimCards.length > 0 && (
                                <div className="flex items-center">
                                    {overallMetrics.total > prevOverallMetrics.total ? (
                                        <div className="text-green-500 flex items-center">
                                            <ArrowUpIcon size={14} />
                                            <span className="ml-1 text-xs">
                                                {formatChange(calculateChange(overallMetrics.total, prevOverallMetrics.total))}
                                            </span>
                                        </div>
                                    ) : overallMetrics.total < prevOverallMetrics.total ? (
                                        <div className="text-red-500 flex items-center">
                                            <ArrowDownIcon size={14} />
                                            <span className="ml-1 text-xs">
                                                {formatChange(Math.abs(calculateChange(overallMetrics.total, prevOverallMetrics.total)))}
                                            </span>
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
                    </div>
                    
                    {/* Good Quality */}
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Good Quality</p>
                        <div className="flex justify-between items-end">
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {loading ? '...' : overallMetrics.goodQuality.toLocaleString()}
                            </p>
                            
                            {!loading && previousSimCards.length > 0 && (
                                <div className="flex items-center">
                                    {overallMetrics.goodQuality > prevOverallMetrics.goodQuality ? (
                                        <div className="text-green-500 flex items-center">
                                            <ArrowUpIcon size={14} />
                                            <span className="ml-1 text-xs">
                                                {formatChange(calculateChange(overallMetrics.goodQuality, prevOverallMetrics.goodQuality))}
                                            </span>
                                        </div>
                                    ) : overallMetrics.goodQuality < prevOverallMetrics.goodQuality ? (
                                        <div className="text-red-500 flex items-center">
                                            <ArrowDownIcon size={14} />
                                            <span className="ml-1 text-xs">
                                                {formatChange(Math.abs(calculateChange(overallMetrics.goodQuality, prevOverallMetrics.goodQuality)))}
                                            </span>
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
                    </div>
                    
                    {/* Poor Quality */}
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Poor Quality</p>
                        <div className="flex justify-between items-end">
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {loading ? '...' : overallMetrics.poorQuality.toLocaleString()}
                            </p>
                            
                            {!loading && previousSimCards.length > 0 && (
                                <div className="flex items-center">
                                    {overallMetrics.poorQuality > prevOverallMetrics.poorQuality ? (
                                        <div className="text-red-500 flex items-center">
                                            <ArrowUpIcon size={14} />
                                            <span className="ml-1 text-xs">
                                                {formatChange(calculateChange(overallMetrics.poorQuality, prevOverallMetrics.poorQuality))}
                                            </span>
                                        </div>
                                    ) : overallMetrics.poorQuality < prevOverallMetrics.poorQuality ? (
                                        <div className="text-green-500 flex items-center">
                                            <ArrowDownIcon size={14} />
                                            <span className="ml-1 text-xs">
                                                {formatChange(Math.abs(calculateChange(overallMetrics.poorQuality, prevOverallMetrics.poorQuality)))}
                                            </span>
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
                    </div>
                </div>
            </div>
            
            {/* Poor Quality Breakdown */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Poor Quality Breakdown
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Top-up Below 50 */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Top-up Below 50</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            {loading ? '...' : overallMetrics.topUpBelow50.toLocaleString()}
                        </p>
                    </div>
                    
                    {/* No Top-up */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No Top-up</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            {loading ? '...' : overallMetrics.noTopUp.toLocaleString()}
                        </p>
                    </div>
                    
                    {/* Topped-up 50 but Not Converted */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Topped-up 50 but Not Converted</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            {loading ? '...' : overallMetrics.topUp50NotConverted.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Team Breakdown */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Team Breakdown
                </h3>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Team
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Total
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Good Quality
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Poor Quality
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Top-up Below 50
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    No Top-up
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Topped-up 50 but Not Converted
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : sortedTeams.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                sortedTeams.map((teamId) => {
                                    const metrics = teamMetrics[teamId];
                                    const teamName = teamData[teamId] || (teamId === 'unknown' ? 'Unknown Source' : `Team ${teamId.substring(0, 8)}`);
                                    
                                    return (
                                        <tr key={teamId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {teamName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {metrics.total.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {metrics.goodQuality.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {metrics.poorQuality.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {metrics.topUpBelow50.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {metrics.noTopUp.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {metrics.topUp50NotConverted.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Unknown Source Breakdown (if exists) */}
            {teamMetrics['unknown'] && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                        Connections from Unknown Source
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {teamMetrics['unknown'].total.toLocaleString()}
                            </p>
                        </div>
                        
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Good Quality</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {teamMetrics['unknown'].goodQuality.toLocaleString()}
                            </p>
                        </div>
                        
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Poor Quality</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {teamMetrics['unknown'].poorQuality.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    
                    <h4 className="text-md font-medium mt-4 mb-2 text-gray-700 dark:text-gray-300">
                        Poor Quality Breakdown from Unknown Source
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Top-up Below 50</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {teamMetrics['unknown'].topUpBelow50.toLocaleString()}
                            </p>
                        </div>
                        
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No Top-up</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {teamMetrics['unknown'].noTopUp.toLocaleString()}
                            </p>
                        </div>
                        
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Topped-up 50 but Not Converted</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {teamMetrics['unknown'].topUp50NotConverted.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}