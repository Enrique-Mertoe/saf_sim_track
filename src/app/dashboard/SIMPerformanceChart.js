import React, {useEffect, useState} from 'react';
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {fetchSimCardsForChart} from "@/app/dashboard/helper";
import {SIMStatus} from "@/models";

// Standalone component that takes user as prop
const SIMPerformanceChart = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [performanceData, setPerformanceData] = useState([]);
    const [error, setError] = useState(null);

    // Data fetching function
    const fetchPerformanceData = async () => {
        if (!user) {
            setLoading(true);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();

            // Get first and last day of current month
            const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
            const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

            // Fetch SIM card data from Supabase
            const {data:fetchedSimData} = await fetchSimCardsForChart(user);

            if (fetchedSimData) {
                // Helper function to get week number within current month
                const getWeekOfMonth = (date) => {
                    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                    const dayOfMonth = date.getDate();
                    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

                    // Calculate which week of the month this date falls into
                    const weekNumber = Math.ceil((dayOfMonth + firstDayOfWeek) / 7);

                    // Get start and end dates of this week within the month
                    const weekStart = new Date(date.getFullYear(), date.getMonth(),
                        dayOfMonth - date.getDay() + (date.getDay() === 0 ? -6 : 1));
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);

                    // Ensure week boundaries don't go outside current month
                    const actualWeekStart = new Date(Math.max(weekStart.getTime(), firstDayOfMonth.getTime()));
                    const actualWeekEnd = new Date(Math.min(weekEnd.getTime(), lastDayOfMonth.getTime()));

                    return {
                        weekNumber,
                        weekStart: actualWeekStart,
                        weekEnd: actualWeekEnd,
                        period: `${actualWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${actualWeekEnd.getDate()}`
                    };
                };

                // Initialize weeks for current month
                const monthWeeks = {};
                const currentDate = new Date(firstDayOfMonth);

                while (currentDate <= lastDayOfMonth) {
                    const weekInfo = getWeekOfMonth(currentDate);
                    const weekKey = `Week ${weekInfo.weekNumber}`;

                    if (!monthWeeks[weekKey]) {
                        monthWeeks[weekKey] = {
                            week: weekKey,
                            period: weekInfo.period,
                            totalRecorded: 0,
                            activated: 0,
                            quality: 0,
                            nonQuality: 0,
                            activationRate: 0,
                            qualityRate: 0,
                            nonQualityRate: 0,
                            weekStart: weekInfo.weekStart
                        };
                    }

                    // Move to next day
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                // Filter SIM data for current month only
                // Aggregate data by week within current month
                fetchedSimData.forEach(sim => {
                    const saleDate = new Date(sim.registered_on || sim.activation_date);
                    const weekInfo = getWeekOfMonth(saleDate);
                    const weekKey = `Week ${weekInfo.weekNumber}`;

                    if (monthWeeks[weekKey]) {
                        monthWeeks[weekKey].totalRecorded++;

                        // Check if SIM is activated
                        if (sim.status === SIMStatus.ACTIVATED || sim.activation_date) {
                            monthWeeks[weekKey].activated++;

                            // Check if SIM is quality (top-up >= 50 KES)
                            if (sim.quality === SIMStatus.QUALITY) {
                                monthWeeks[weekKey].quality++;
                            } else {
                                monthWeeks[weekKey].nonQuality++;
                            }
                        }
                    }
                });

                // Calculate rates and convert to chart data
                const performanceData = Object.values(monthWeeks)
                    .filter(week => week.totalRecorded > 0) // Only show weeks with data
                    .sort((a, b) => a.weekStart - b.weekStart) // Sort by week start date
                    .map(week => ({
                        ...week,
                        activationRate: week.totalRecorded > 0
                            ? Math.round((week.activated / week.totalRecorded) * 100 * 10) / 10
                            : 0,
                        qualityRate: week.activated > 0
                            ? Math.round((week.quality / week.activated) * 100 * 10) / 10
                            : 0,
                        nonQualityRate: week.activated > 0
                            ? Math.round((week.nonQuality / week.activated) * 100 * 10) / 10
                            : 0
                    }));

                setPerformanceData(performanceData);
            }
        } catch (error) {
            console.error("Error fetching performance data:", error);
            setError("Failed to load performance data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Import the Supabase service
    // import { fetchSimCardsForChart } from './supabaseSimService';



    // Load data when component mounts or user changes
    useEffect(() => {
        fetchPerformanceData();
    }, [user]);

    // Custom tooltip for better data presentation
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const weekData = performanceData.find(d => d.week === label);
            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-800 mb-1">{`${label} - June 2025`}</p>
                    <p className="text-xs text-gray-600 mb-2">{weekData?.period}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name === 'totalRecorded' && `Total Recorded: ${entry.value.toLocaleString()}`}
                            {entry.name === 'activationRate' && `Activation Rate: ${entry.value}%`}
                            {entry.name === 'quality' && `Quality SIMs: ${entry.value.toLocaleString()}`}
                            {entry.name === 'nonQuality' && `Non-Quality SIMs: ${entry.value.toLocaleString()}`}
                        </p>
                    ))}
                    {weekData && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-600">
                                Activated: {weekData.activated.toLocaleString()} ({weekData.activationRate}%)
                            </p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    // Loading state when no user
    if (!user) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Current Month Performance
                    </h3>
                    <p className="text-sm text-gray-600">
                        Please log in to view performance data
                    </p>
                </div>

                <div className="h-72 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-gray-400 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <p className="text-gray-500">User authentication required</p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="text-center">
                            <div className="text-2xl font-bold text-gray-300">--</div>
                            <div className="text-xs text-gray-400">No data</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Current Month Performance (June 2025)
                </h3>
                <p className="text-sm text-gray-600">
                    Weekly breakdown of activation rates, quality vs non-quality SIM counts for this month
                </p>
                {user && (
                    <p className="text-xs text-gray-500 mt-1">
                        Showing data for: {user.full_name || user.email || 'Current User'}
                    </p>
                )}
            </div>

            <div className="h-72">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-2"></div>
                            <p className="text-gray-500">Loading performance data...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-red-400 mb-2">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 mb-2">{error}</p>
                            <button
                                onClick={fetchPerformanceData}
                                className="text-indigo-600 hover:text-indigo-800 text-sm underline"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={performanceData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="week"
                                stroke="#6B7280"
                                fontSize={12}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke="#6B7280"
                                fontSize={12}
                                label={{ value: 'SIM Count', angle: -90, position: 'insideLeft' }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#6B7280"
                                fontSize={12}
                                label={{ value: 'Rate (%) / Count', angle: 90, position: 'insideRight' }}
                                domain={[0, 100]}
                            />

                            {/* Reference lines for performance targets */}
                            <ReferenceLine
                                yAxisId="right"
                                y={95}
                                stroke="#10B981"
                                strokeDasharray="5 5"
                                label={{ value: "Target: 95% Activation", position: "insideTopRight" }}
                            />
                            <ReferenceLine
                                yAxisId="right"
                                y={90}
                                stroke="#F59E0B"
                                strokeDasharray="5 5"
                                label={{ value: "Warning: 90%", position: "insideTopRight" }}
                            />

                            <Tooltip content={<CustomTooltip />} />
                            <Legend />

                            {/* Bar chart for total recorded SIMs */}
                            <Bar
                                yAxisId="left"
                                dataKey="totalRecorded"
                                fill="#E5E7EB"
                                fillOpacity={0.8}
                                name="Total Recorded"
                                radius={[2, 2, 0, 0]}
                            />

                            {/* Line chart for activation rate */}
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="activationRate"
                                stroke="#4F46E5"
                                strokeWidth={3}
                                dot={{ fill: '#4F46E5', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 7, stroke: '#4F46E5', strokeWidth: 2 }}
                                name="Activation Rate (%)"
                            />

                            {/* Line chart for quality SIMs count */}
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="quality"
                                stroke="#10B981"
                                strokeWidth={3}
                                dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2 }}
                                name="Quality SIMs"
                            />

                            {/* Line chart for non-quality SIMs count */}
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="nonQuality"
                                stroke="#EF4444"
                                strokeWidth={3}
                                dot={{ fill: '#EF4444', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 7, stroke: '#EF4444', strokeWidth: 2 }}
                                name="Non-Quality SIMs"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-gray-400 mb-2">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <p className="text-gray-500">No performance data available for this month</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Performance indicators */}
            {/*<div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">*/}
            {/*    <div className="text-center">*/}
            {/*        <div className="text-2xl font-bold text-indigo-600">*/}
            {/*            {performanceData.length > 0 ?*/}
            {/*                `${performanceData[performanceData.length - 1]?.activationRate}%` : '--'*/}
            {/*            }*/}
            {/*        </div>*/}
            {/*        <div className="text-xs text-gray-500">Activation Rate</div>*/}
            {/*    </div>*/}
            {/*    <div className="text-center">*/}
            {/*        <div className="text-2xl font-bold text-green-600">*/}
            {/*            {performanceData.length > 0 ?*/}
            {/*                performanceData[performanceData.length - 1]?.quality.toLocaleString() : '--'*/}
            {/*            }*/}
            {/*        </div>*/}
            {/*        <div className="text-xs text-gray-500">Quality SIMs</div>*/}
            {/*    </div>*/}
            {/*    <div className="text-center">*/}
            {/*        <div className="text-2xl font-bold text-red-600">*/}
            {/*            {performanceData.length > 0 ?*/}
            {/*                performanceData[performanceData.length - 1]?.nonQuality.toLocaleString() : '--'*/}
            {/*            }*/}
            {/*        </div>*/}
            {/*        <div className="text-xs text-gray-500">Non-Quality SIMs</div>*/}
            {/*    </div>*/}
            {/*    <div className="text-center">*/}
            {/*        <div className="text-2xl font-bold text-gray-600">*/}
            {/*            {performanceData.length > 0 ?*/}
            {/*                performanceData[performanceData.length - 1]?.totalRecorded.toLocaleString() : '--'*/}
            {/*            }*/}
            {/*        </div>*/}
            {/*        <div className="text-xs text-gray-500">Total Recorded</div>*/}
            {/*    </div>*/}
            {/*</div>*/}
        </div>
    );
};

export default SIMPerformanceChart;