import React, {useState, useEffect} from 'react';
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import simCardService from "@/services/simService";

interface DailyData {
    date: string;
    sales: number;
    activations: number;
    quality: number;
}

interface SimSalesChartProps {
    userId: string;
    duration?: number; // Number of days to display, default will be 30
}

const SimSalesChart: React.FC<SimSalesChartProps> = ({userId, duration = 30}) => {
    const [dailyData, setDailyData] = useState<DailyData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Format the period text based on duration
    const getPeriodText = () => {
        if (duration === 7) return 'Last 7 days';
        if (duration === 14) return 'Last 14 days';
        if (duration === 30) return 'Last 30 days';
        if (duration === 60) return 'Last 60 days';
        if (duration === 90) return 'Last 90 days';
        return `Last ${duration} days`;
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await simCardService.getDailyPerformanceData(userId, duration);
                // Format dates to be more readable in the chart
                const formattedData = data.map(item => ({
                    ...item,
                    date: new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                    })
                }));
                setDailyData(formattedData);
            } catch (err) {
                console.error('Error fetching sim card performance data:', err);
                setError('Unable to load performance data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId, duration]);

    // Calculate totals
    const totalSales = dailyData.reduce((sum, item) => sum + item.sales, 0);
    const totalActivations = dailyData.reduce((sum, item) => sum + item.activations, 0);
    const totalQuality = dailyData.reduce((sum, item) => sum + item.quality, 0);

    // Show loading state
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-64 flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-300">Loading performance data...</div>
            </div>
        );
    }

// Show error state
    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-64 flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

// Handle empty data
    if (dailyData.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-64 flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-300">No performance data available for the selected
                    period
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100">SIM Card Performance</h2>
                <div className="text-sm text-gray-500 dark:text-gray-300">{getPeriodText()}</div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={dailyData}
                        margin={{top: 5, right: 30, left: 20, bottom: 5}}
                    >
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                        <XAxis dataKey="date" stroke="currentColor"/>
                        <YAxis stroke="currentColor"/>
                        <Tooltip contentStyle={{backgroundColor: '#1f2937', color: '#fff'}}/>
                        <Legend/>
                        <Line
                            type="monotone"
                            dataKey="sales"
                            stroke="#3B82F6"
                            activeDot={{r: 8}}
                            name="Sales"
                        />
                        <Line
                            type="monotone"
                            dataKey="activations"
                            stroke="#8B5CF6"
                            name="Matched"
                        />
                        <Line
                            type="monotone"
                            dataKey="quality"
                            stroke="#10B981"
                            name="Quality"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-blue-50 dark:bg-blue-900 py-2 rounded">
                    <div className="font-medium text-blue-700 dark:text-blue-300">{totalSales}</div>
                    <div className="text-gray-500 dark:text-gray-300">Total Sales</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900 py-2 rounded">
                    <div className="font-medium text-purple-700 dark:text-purple-300">{totalActivations}</div>
                    <div className="text-gray-500 dark:text-gray-300">Total Match</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900 py-2 rounded">
                    <div className="font-medium text-green-700 dark:text-green-300">{totalQuality}</div>
                    <div className="text-gray-500 dark:text-gray-300">Quality SIMs</div>
                </div>
            </div>
        </div>
    );
}

export default SimSalesChart;