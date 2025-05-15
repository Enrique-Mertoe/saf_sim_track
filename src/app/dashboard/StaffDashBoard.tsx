"use client"
import React, {useState, useEffect} from 'react';
import PerformanceMetrics from './staff-components/PerformanceMetrics';
import QualityMetricsCard from "@/app/dashboard/staff-components/QualityMetricsCard";
import SimSalesChart from "@/app/dashboard/staff-components/SimSalesChart";
import RecentActivitiesTable from './staff-components/RecentActivitiesTable';
import UpcomingTargetsCard from "@/app/dashboard/staff-components/UpcomingTargetsCard";
import Dashboard from "@/ui/components/dash/Dashboard";
// import PerformanceMetrics from './PerformanceMetrics';
// import SimSalesChart from './SimSalesChart';
// import RecentActivitiesTable from './RecentActivitiesTable';
// import QualityMetricsCard from './QualityMetricsCard';
// import UpcomingTargetsCard from './UpcomingTargetsCard';

interface StaffDashboardProps {
    userId: string;
}
const StaffDashboard: React.FC<StaffDashboardProps> = ({userId}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [dashboardData, setDashboardData] = useState<any>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Replace with your actual API endpoint
                const response = await fetch(`/api/dashboard/staff/${userId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const data = await response.json();
                setDashboardData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        // fetchDashboardData();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }

    return (
        <Dashboard>
            <div className="mx-auto px-4 py-6">
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PerformanceMetrics/>

                        <QualityMetricsCard
                            userId={userId}
                        />
                    </div>

                    <SimSalesChart
                        userId={userId}
                    />

                    <div className="grid grid-cols-1 gap-6">
                        <div className="md:col-span-2">
                            <RecentActivitiesTable userId={userId}/>
                        </div>
                        {/*<div>*/}
                        {/*    <UpcomingTargetsCard userId={userId}/>*/}
                        {/*</div>*/}
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default StaffDashboard;