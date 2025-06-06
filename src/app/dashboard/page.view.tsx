"use client"
import {useCallback, useEffect, useState} from 'react';
import {Activity, Calendar} from 'lucide-react';
import {CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {motion} from 'framer-motion';
import Dashboard from "@/ui/components/dash/Dashboard";
import {SIMStatus} from "@/models";
import DashQuickActions, {UserStatistics} from './quicks';
import SimStarts from "@/app/dashboard/SimStarts";
import Signal from "@/lib/Signal";
import simService from "@/services/simService";
import useApp from "@/ui/provider/AppProvider";
import SIMActivationChart from './components/ActivationStatusChart';
import TeamPerformanceChart from './components/TeamPerformanceChart';
import TimeActivityChart from './components/TimeActivityChart';
import OverallStats from "@/app/dashboard/OverallStats";

export default function SafaricomDashboard() {
    const [role, setRole] = useState('admin');
    const {user} = useApp()
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSales: 0,
        activationRate: 0,
        pendingApprovals: 0,
        flaggedTransactions: 0
    });
    const [salesData, setSalesData] = useState([]);
    const [teamPerformance, setTeamPerformance] = useState([]);
    const [recentSims, setRecentSims] = useState<{
        id: string,
        serial: string,
        date: string,
        staff: string,
        leader: string,
        quality: string
    }[]>([]);
    const [pieData, setPieData] = useState([]);
    const [simData, setSimData] = useState<any[]>([]);

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        if (!user)
            return;
        setLoading(true);
        try {
            // Get monthly sales data
            const today = new Date();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(today.getMonth() - 6);

            // Month names for chart labels
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            // Fetch SIM card data for last 6 months
            const {data: fetchedSimData} = await simService.getAllSimCards(user!);

            // Store the raw SIM data for use in other charts
            setSimData(fetchedSimData || []);

            if (fetchedSimData) {
                // Process monthly sales data
                const monthlySales = {};
                const monthlyActivations = {};

                // Initialize months
                for (let i = 0; i < 6; i++) {
                    const month = new Date();
                    month.setMonth(today.getMonth() - i);
                    const monthKey = monthNames[month.getMonth()];
                    // @ts-ignore
                    monthlySales[monthKey] = 0;
                    // @ts-ignore
                    monthlyActivations[monthKey] = 0;
                }

                // Aggregate data by month
                //@ts-ignore
                fetchedSimData.forEach(sim => {
                    const saleDate = new Date(sim.sale_date);
                    const monthKey = monthNames[saleDate.getMonth()];

                    // Only count if within last 6 months
                    if (saleDate >= sixMonthsAgo) {
                        // @ts-ignore
                        monthlySales[monthKey] = (monthlySales[monthKey] || 0) + 1;
                        if (sim.quality === SIMStatus.QUALITY) {
                            // @ts-ignore
                            monthlyActivations[monthKey] = (monthlyActivations[monthKey] || 0) + 1;
                        }
                    }
                });

                // Convert to chart data format (reverse to show chronological order)

                const chartData = Object.keys(monthlySales).map(month => ({
                    name: month,
                    //@ts-ignore
                    sales: monthlySales[month],
                    //@ts-ignore
                    activations: monthlyActivations[month]
                })).reverse();
                //@ts-ignore
                setSalesData(chartData);

                // Calculate total stats
                const totalSalesCount = fetchedSimData.length;
                //@ts-ignore
                const activatedCount = fetchedSimData.filter(sim => sim.status === SIMStatus.ACTIVATED).length;
                //@ts-ignore
                const pendingCount = fetchedSimData.filter(sim => sim.status === SIMStatus.PENDING).length;
                //@ts-ignore
                const rCount = fetchedSimData.filter(sim => sim.status === SIMStatus.REGISTERED).length;

                // Set pie chart data
                setPieData([
                    //@ts-ignore
                    {name: 'Activated', value: Math.round((activatedCount / totalSalesCount) * 100) || 0},
                    //@ts-ignore
                    {name: 'Pending', value: Math.round((pendingCount / totalSalesCount) * 100) || 0},
                    //@ts-ignore
                    {name: 'Registred', value: Math.round((rCount / totalSalesCount) * 100) || 0}
                ]);

                // Set overall stats
                setStats({
                    totalSales: totalSalesCount,
                    activationRate: Math.round((activatedCount / totalSalesCount) * 100) || 0,
                    pendingApprovals: role === 'admin' ? pendingCount : Math.min(pendingCount, 10),
                    flaggedTransactions: role === 'admin' ? rCount : Math.min(rCount, 5)
                });

                // Get recent SIM cards
                const recent = fetchedSimData
                    //@ts-ignore
                    // .sort((a, b) => new Date(a.created_at))
                    .slice(0, 4)
                    //@ts-ignore
                    .map(sim => ({
                        id: sim.id,
                        serial: sim.serial_number,
                        date: new Date(sim.created_at).toISOString().split('T')[0],
                        staff: sim.sold_by_user_id?.full_name || "Not sold",
                        leader: sim.team_id.leader_id.full_name,
                        quality: sim.quality
                    }));
//@ts-ignore
                setRecentSims(recent);

                // Fetch team performance
                //@ts-ignore
                const teams = [...new Set(fetchedSimData.map(sim => sim.team_id).filter(Boolean))];
                const teamStats = [];

                for (const teamId of teams) {
                    //@ts-ignore
                    const teamSims = fetchedSimData.filter(sim => sim.team_id === teamId.id);
                    //@ts-ignore
                    const teamName = teamId.name || `Team ${teamId.id.substring(0, 3)}`;
                    const teamSalesCount = teamSims.length;

                    teamStats.push({
                        name: teamName,
                        sales: teamSalesCount,
                        target: 4000 // This would ideally come from a targets table
                    });
                }
                //@ts-ignore
                setTeamPerformance(teamStats.slice(0, 4)); // Take top 4 teams
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user)
            return
        fetchDashboardData().then();
    }, [user]);


    const COLORS = ['#0088FE', '#FFBB28', '#FF8042'];

    const handleRefresh = useCallback(() => {
        fetchDashboardData();
    }, []);
    useEffect(() => {
        Signal.on("m-refresh", e => {
            handleRefresh()
        })
        return () => {
            Signal.off("m-refresh")
        }
    }, [handleRefresh]);

    return (
        <Dashboard>
            <div className="p-6 w-full min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Dashboard Header */}
                    <div className="flex justify-between items-center mb-6">
                        <motion.div
                            initial={{opacity: 0, x: -20}}
                            animate={{opacity: 1, x: 0}}
                            transition={{duration: 0.5}}
                        >
                            <h1 className="text-2xl font-bold dark:text-gray-50 text-gray-800">
                                {role === 'admin' ? 'Admin Dashboard' : 'Team Leader Dashboard'}
                            </h1>
                            <p className="text-gray-500">Overview of SIM card sales and activations</p>
                        </motion.div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
                        {/* Stats Grid */}
                        <SimStarts refreshing={loading}/>
                        <div className="grid gap-2 min-h-full">
                            <OverallStats/>
                            <UserStatistics/>
                        </div>
                    </div>
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                        {/* Sales & Activation Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="bg-white col-span-12 md:col-span-8 dark:bg-gray-800 p-2 rounded-lg shadow-md"
                        >
                            <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
                                <Activity size={18} className="mr-2 text-indigo-600 dark:text-indigo-400" />
                                SIM Sales & Activations
                            </h2>
                            <div className="h-72">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
                                    </div>
                                ) : salesData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="name" stroke="#888" />
                                            <YAxis stroke="#888" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#ffffff', color: '#000000' }}
                                                wrapperStyle={{ backgroundColor: 'transparent' }}
                                                labelStyle={{ color: '#000000' }}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="sales"
                                                stroke="#4F46E5"
                                                strokeWidth={2}
                                                dot={{ r: 4 }}
                                                activeDot={{ r: 6 }}
                                                animationDuration={1500}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="activations"
                                                stroke="#10B981"
                                                strokeWidth={2}
                                                dot={{ r: 4 }}
                                                activeDot={{ r: 6 }}
                                                animationDuration={1500}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <p className="text-gray-500 dark:text-gray-400">No data available</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Quick Actions */}
                        <div className="col-span-12 md:col-span-4">
                            <DashQuickActions />
                        </div>
                    </div>


                    {/* Additional Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Activation Status Pie Chart */}
                        <SIMActivationChart />

                        {/* Team Performance Chart */}
                        <TeamPerformanceChart data={teamPerformance} loading={loading} />
                    </div>

                    {/* Time Activity Heatmap */}
                    <div className="mb-8">
                        <TimeActivityChart 
                            data={simData || []} 
                            loading={loading} 
                        />
                    </div>
                    {/* Bottom Section */}
                    <div className="grid grid-cols-1 gap-6">
                        {/* Recent SIM Cards */}
                        <motion.div
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.3}}
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md lg:col-span-2"
                        >
                            <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
                                <Calendar size={18} className="mr-2 text-indigo-600 dark:text-indigo-400"/>
                                Recent SIM Cards
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Serial</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leader</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Staff</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quality</th>
                                    </tr>
                                    </thead>
                                    <tbody
                                        className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5}
                                                className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">Loading...
                                            </td>
                                        </tr>
                                    ) : recentSims.length > 0 ? (
                                        recentSims.map((sim, index) => (
                                            <motion.tr
                                                //@ts-ignore
                                                key={sim.id}
                                                initial={{opacity: 0, y: 10}}
                                                animate={{opacity: 1, y: 0}}
                                                transition={{duration: 0.3, delay: 0.1 * index}}
                                                whileHover={{backgroundColor: '#f9fafb'}}
                                            >
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {
                                                        //@ts-ignore
                                                        sim.serial}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{
                                                    //@ts-ignore
                                                    sim.date}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {sim.leader}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {sim.staff}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    sim.quality === SIMStatus.QUALITY
                                        ? 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900'
                                        : sim.quality === SIMStatus.NONQUALITY
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900'
                                            : 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900'
                                }`}>
                                    {sim.quality}
                                </span>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5}
                                                className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">No
                                                recent SIM cards found
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </Dashboard>
    );
}
