'use client';

import React, {useEffect, useState} from 'react';
import {Loader2, TrendingDown, TrendingUp} from 'lucide-react';
import simCardService from "@/services/simService";
import {User} from "@/models";

interface QualityMetricsCardProps {
    userId: string;
    days?: number;
    user:User;
}

const QualityMetricsCard: React.FC<QualityMetricsCardProps> = ({
                                                                   userId,
    user,
                                                                   days = 30
                                                               }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentMetrics, setCurrentMetrics] = useState<{
        totalSims: number;
        matchedSims: number;
        qualitySims: number;
        performancePercentage: number;
    } | null>(null);
    const [previousMetrics, setPreviousMetrics] = useState<{
        totalSims: number;
        matchedSims: number;
        qualitySims: number;
        performancePercentage: number;
    } | null>(null);

    // Helper function to get date string for n days ago
    const getDateString = (daysAgo: number): string => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0];
    };

    // Determine trend based on current and previous period metrics
    const determineTrend = (): 'up' | 'down' | 'stable' => {
        if (!currentMetrics || !previousMetrics) return 'stable';

        const diff = currentMetrics.performancePercentage - previousMetrics.performancePercentage;
        if (diff >= 2) return 'up';
        if (diff <= -2) return 'down';
        return 'stable';
    };

    // Get appropriate comment based on quality percentage
    const getQualityComment = (percentage: number): string => {
        if (percentage >= 95) return 'Excellent quality performance';
        if (percentage >= 90) return 'Good quality, room for improvement';
        if (percentage >= 80) return 'Average quality, needs attention';
        return 'Low quality, immediate action required';
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Current period (last n days)
                const endDate = getDateString(0); // Today
                const startDate = getDateString(days); // n days ago

                // Previous period (same duration before current period)
                const prevEndDate = getDateString(days + 1);
                const prevStartDate = getDateString(days * 2 + 1);

                // Fetch metrics for current period
                const current = await simCardService.getStaffPerformanceMetrics(
                    userId,
                    user,
                    startDate,
                    endDate
                );

                // Fetch metrics for previous period (for trend comparison)
                const previous = await simCardService.getStaffPerformanceMetrics(
                    userId,
                    user,
                    prevStartDate,
                    prevEndDate
                );

                setCurrentMetrics(current);
                setPreviousMetrics(previous);
            } catch (err) {
                console.error('Error fetching quality metrics:', err);
                setError('Failed to load quality metrics');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, days]);

    const getQualityColorClass = () => {
        if (!currentMetrics) return 'text-gray-600';

        if (currentMetrics.performancePercentage >= 95) return 'text-green-600';
        if (currentMetrics.performancePercentage >= 90) return 'text-yellow-500';
        return 'text-red-600';
    };

    const getQualityBgClass = () => {
        if (!currentMetrics) return 'bg-gray-100';

        if (currentMetrics.performancePercentage >= 95) return 'bg-green-100';
        if (currentMetrics.performancePercentage >= 90) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    const getTrendIcon = () => {
        const trend = determineTrend();
        switch (trend) {
            case 'up':
                return <TrendingUp className="h-5 w-5 text-green-500"/>;
            case 'down':
                return <TrendingDown className="h-5 w-5 text-red-500"/>;
            default:
                return null;
        }
    };

    const getTrendText = () => {
        const trend = determineTrend();
        switch (trend) {
            case 'up':
                return 'Improving';
            case 'down':
                return 'Declining';
            default:
                return 'Stable';
        }
    };

    const getTrendColor = () => {
        const trend = determineTrend();
        switch (trend) {
            case 'up':
                return 'text-green-600';
            case 'down':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-full">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-4">Quality Metrics</h2>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin"/>
                    <span className="mt-2 text-gray-600 dark:text-gray-300">Loading metrics...</span>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-red-500">{error}</p>
                </div>
            ) : currentMetrics ? (
                <>
                    <div className="flex flex-col items-center my-4">
                        <div
                            className={`${getQualityBgClass()} rounded-full p-6 flex items-center justify-center w-32 h-32`}>
          <span className={`text-3xl font-bold ${getQualityColorClass()}`}>
            {currentMetrics.performancePercentage.toFixed(1)}%
          </span>
                        </div>

                        <div className="mt-4 text-center">
                            <div className="text-lg font-medium text-gray-700 dark:text-gray-100">
                                {getQualityComment(currentMetrics.performancePercentage)}
                            </div>

                            <div className={`flex items-center justify-center mt-2 ${getTrendColor()}`}>
                                {getTrendIcon()}
                                <span className="ml-1 text-sm">{getTrendText()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                            <div className="text-sm text-gray-500 dark:text-gray-300">Quality SIMs</div>
                            <div
                                className="text-lg font-semibold text-gray-800 dark:text-white">{currentMetrics.qualitySims}</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                            <div className="text-sm text-gray-500 dark:text-gray-300">Activated SIMs</div>
                            <div
                                className="text-lg font-semibold text-gray-800 dark:text-white">{currentMetrics.matchedSims}</div>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-gray-200 dark:border-gray-600 pt-4">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            <p className="mb-2">A SIM card is considered "Quality" when:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>It has been activated</li>
                                <li>A top-up has been performed</li>
                                <li>The top-up amount is at least 50 KES</li>
                                <li>No fraud flags are present</li>
                            </ul>
                        </div>
                    </div>
                </>
            ) : null}
        </div>

    );
};

export default QualityMetricsCard;