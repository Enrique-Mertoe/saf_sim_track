import React, {useState, useEffect} from 'react';
import {ArrowUp, ArrowDown} from 'lucide-react';
import simCardService from "@/services/simService";
import useApp from "@/ui/provider/AppProvider";

interface PerformanceMetricsProps {
    dateRange?: {
        startDate: string;
        endDate: string;
    };
    teamId?: string;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({dateRange, teamId}) => {
    const {user} = useApp();
    const [loading, setLoading] = useState(!user);
    const [metrics, setMetrics] = useState({
        totalSims: 0,
        activatedSims: 0,
        qualitySims: 0,
        performancePercentage: 0
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user)
            return
        const fetchMetrics = async () => {
            try {
                setLoading(true);

                let metricsData;

                // If teamId is provided, fetch team metrics (for team leaders)
                if (teamId) {
                    metricsData = await simCardService.getTeamPerformanceMetrics(
                        teamId,
                        dateRange?.startDate,
                        dateRange?.endDate
                    );
                } else if (user?.id) {
                    // Otherwise fetch individual staff metrics
                    metricsData = await simCardService.getStaffPerformanceMetrics(
                        user.id,
                        dateRange?.startDate,
                        dateRange?.endDate
                    );
                } else {
                    throw new Error('User ID is required to fetch metrics');
                }

                setMetrics(metricsData);
            } catch (err) {
                console.error('Error fetching performance metrics:', err);
                setError(err instanceof Error ? err.message : 'Failed to load performance metrics');
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, [user, teamId, dateRange?.startDate, dateRange?.endDate]);

    const getPerformanceColor = () => {
        if (metrics.performancePercentage >= 95) return 'text-green-600';
        if (metrics.performancePercentage >= 90) return 'text-yellow-500';
        return 'text-red-600';
    };

    const getPerformanceComment = () => {
        if (metrics.performancePercentage >= 95) return 'Well done';
        if (metrics.performancePercentage >= 90) return 'Improve';
        return 'Needs immediate attention';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6 h-full flex items-center justify-center">
                <div
                    className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6 h-full">
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                    <p className="font-medium">Error loading performance metrics</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6 h-full">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
                {teamId ? 'Team Performance Metrics' : 'My Performance Metrics'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-500">SIM Cards Sold</p>
                    <p className="text-2xl font-bold text-blue-700">{metrics.totalSims}</p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-500">Activated SIMs</p>
                    <p className="text-2xl font-bold text-purple-700">{metrics.activatedSims}</p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-500">Quality SIMs</p>
                    <p className="text-2xl font-bold text-green-700">{metrics.qualitySims}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Performance</p>
                    <div className="flex items-end gap-2">
                        <p className={`text-2xl font-bold ${getPerformanceColor()}`}>
                            {metrics.performancePercentage.toFixed(2)}%
                        </p>
                        <p className="text-xs mb-1 font-medium text-gray-500">
                            {getPerformanceComment()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quality Rate</span>
                    <div className="flex items-center">
            <span className="text-sm font-medium text-green-600">
              {metrics.activatedSims > 0
                  ? ((metrics.qualitySims / metrics.activatedSims) * 100).toFixed(2)
                  : '0.00'}%
            </span>
                        {metrics.qualitySims > metrics.activatedSims / 2 ? (
                            <ArrowUp className="ml-1 h-4 w-4 text-green-600"/>
                        ) : (
                            <ArrowDown className="ml-1 h-4 w-4 text-red-600"/>
                        )}
                    </div>
                </div>

                {dateRange && (
                    <div className="mt-2 text-xs text-gray-500">
                        Period: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PerformanceMetrics;