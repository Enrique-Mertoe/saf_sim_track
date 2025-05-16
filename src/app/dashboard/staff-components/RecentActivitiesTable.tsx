import React, {useState, useEffect} from 'react';
import {Check, X, AlertCircle} from 'lucide-react';
import {ActivityLog} from '@/models';
import {logService} from "@/services";

interface RecentActivitiesProps {
    userId: string;
    limit?: number;
    showViewAll?: boolean;
    onViewAllClick?: () => void;
}

// Transform ActivityLog to the Activity format needed for display
interface Activity {
    id: string;
    simSerialNumber: string;
    action: 'sale' | 'activation' | 'top-up' | 'bundle';
    timestamp: string;
    status: 'success' | 'pending' | 'failed';
    amount?: number;
    details?: string;
}

const RecentActivitiesTable: React.FC<RecentActivitiesProps> = ({
                                                                    userId,
                                                                    limit = 5,
                                                                    showViewAll = true,
                                                                    onViewAllClick
                                                                }) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchActivities = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const {data: logs, error} = await logService.recentLogs(userId, limit)

                if (error) throw error;

                if (logs) {
                    // Transform activity logs to required format
                    const transformedActivities = logs.map((log: ActivityLog) => {
                        // Parse the details to extract needed information
                        const details = typeof log.details === 'string'
                            ? JSON.parse(log.details)
                            : log.details;

                        return {
                            id: log.id,
                            simSerialNumber: details.sim_serial_number || details.serialNumber || 'N/A',
                            action: mapActionType(log.action_type),
                            timestamp: log.created_at,
                            status: details.status || 'success',
                            amount: details.amount || details.top_up_amount,
                            details: details.notes || details.message
                        };
                    });

                    setActivities(transformedActivities);
                }
            } catch (err) {
                console.error('Error fetching activity logs:', err);
                setError('Failed to load recent activities');
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivities();
    }, [userId, limit]);

    // Map backend action types to frontend action types
    const mapActionType = (backendAction: string): 'sale' | 'activation' | 'top-up' | 'bundle' => {
        // Map backend action types to frontend display actions
        const actionMap: Record<string, 'sale' | 'activation' | 'top-up' | 'bundle'> = {
            'sim_sale': 'sale',
            'sim_activation': 'activation',
            'sim_topup': 'top-up',
            'bundle_purchase': 'bundle',
        };

        return actionMap[backendAction] || 'sale';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <Check className="h-5 w-5 text-green-500"/>;
            case 'pending':
                return <AlertCircle className="h-5 w-5 text-yellow-500"/>;
            case 'failed':
                return <X className="h-5 w-5 text-red-500"/>;
            default:
                return null;
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'sale':
                return 'SIM Card Sale';
            case 'activation':
                return 'SIM Activation';
            case 'top-up':
                return 'Top-up';
            case 'bundle':
                return 'Bundle Purchase';
            default:
                return action;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100">Recent Activities</h2>
                </div>
                <div className="flex justify-center items-center p-8">
                    <div className="text-gray-500 dark:text-gray-400">Loading activities...</div>
                </div>
            </div>
        );
    }

// Show error state
    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100">Recent Activities</h2>
                </div>
                <div className="flex justify-center items-center p-8">
                    <div className="text-red-500 dark:text-red-400">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100">Recent Activities</h2>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            SIM Serial
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {activities.length > 0 ? (
                        activities.map((activity) => (
                            <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {activity.simSerialNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                    {getActionLabel(activity.action)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(activity.timestamp)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {activity.amount ? `KES ${activity.amount.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {getStatusIcon(activity.status)}
                                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                                            {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                No recent activities found
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {activities.length > 0 && showViewAll && (
                <div
                    className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                        Showing <span className="font-medium">{activities.length}</span> activities
                    </div>
                    <div>
                        <button
                            type="button"
                            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                            onClick={onViewAllClick}
                        >
                            View all activities
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RecentActivitiesTable;