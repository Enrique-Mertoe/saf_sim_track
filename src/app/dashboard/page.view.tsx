"use client"
import {useState, useEffect, useCallback} from 'react';
import {
    ArrowUp,
    ArrowDown,
    Users,
    CreditCard,
    Activity,
    AlertCircle,
    CheckCircle,
    RefreshCw,
    TrendingUp,
    Calendar
} from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {motion} from 'framer-motion';
import Dashboard from "@/ui/components/dash/Dashboard";
import {simCardService} from "@/services/simCardService";
import {SIMStatus} from "@/models";
import DashQuickActions, {UserStatistics} from './quicks';
import SimStarts from "@/app/dashboard/SimStarts";
import Signal from "@/lib/Signal";

export default function SafaricomDashboard() {
    const [role, setRole] = useState('admin');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSales: 0,
        activationRate: 0,
        pendingApprovals: 0,
        flaggedTransactions: 0
    });
    const [salesData, setSalesData] = useState([]);
    const [teamPerformance, setTeamPerformance] = useState([]);
    const [recentSims, setRecentSims] = useState([]);
    const [pieData, setPieData] = useState([]);

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Get monthly sales data
            const today = new Date();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(today.getMonth() - 6);

            // Month names for chart labels
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            // Fetch SIM card data for last 6 months
            const {data: simData} = await simCardService.searchSimCards({
                fromDate: sixMonthsAgo.toISOString().split('T')[0],
                toDate: today.toISOString().split('T')[0],
                pageSize: 1000 // Get enough data for aggregation
            });

            if (simData) {
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
                simData.forEach(sim => {
                    const saleDate = new Date(sim.sale_date);
                    const monthKey = monthNames[saleDate.getMonth()];

                    // Only count if within last 6 months
                    if (saleDate >= sixMonthsAgo) {
                        // @ts-ignore
                        monthlySales[monthKey] = (monthlySales[monthKey] || 0) + 1;
                        if (sim.status === SIMStatus.ACTIVATED) {
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
                const totalSalesCount = simData.length;
                //@ts-ignore
                const activatedCount = simData.filter(sim => sim.status === SIMStatus.ACTIVATED).length;
                //@ts-ignore
                const pendingCount = simData.filter(sim => sim.status === SIMStatus.PENDING).length;
                //@ts-ignore
                const flaggedCount = simData.filter(sim => sim.status === SIMStatus.FLAGGED).length;

                // Set pie chart data
                setPieData([
                    //@ts-ignore
                    {name: 'Activated', value: Math.round((activatedCount / totalSalesCount) * 100) || 0},
                    //@ts-ignore
                    {name: 'Pending', value: Math.round((pendingCount / totalSalesCount) * 100) || 0},
                    //@ts-ignore
                    {name: 'Flagged', value: Math.round((flaggedCount / totalSalesCount) * 100) || 0}
                ]);

                // Set overall stats
                setStats({
                    totalSales: totalSalesCount,
                    activationRate: Math.round((activatedCount / totalSalesCount) * 100) || 0,
                    pendingApprovals: role === 'admin' ? pendingCount : Math.min(pendingCount, 10),
                    flaggedTransactions: role === 'admin' ? flaggedCount : Math.min(flaggedCount, 5)
                });

                // Get recent SIM cards
                const recent = simData
                    //@ts-ignore
                    .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
                    .slice(0, 4)
                    //@ts-ignore
                    .map(sim => ({
                        id: sim.id,
                        serial: sim.serial_number,
                        date: new Date(sim.sale_date).toISOString().split('T')[0],
                        agent: sim.sold_by_user_id,
                        customer: sim.customer_id_number,
                        status: sim.status
                    }));

                setRecentSims(recent);

                // Fetch team performance
                //@ts-ignore
                const teams = [...new Set(simData.map(sim => sim.team_id).filter(Boolean))];
                const teamStats = [];

                for (const teamId of teams) {
                    //@ts-ignore
                    const teamSims = simData.filter(sim => sim.team_id === teamId);
                    //@ts-ignore
                    const teamName = teamSims[0]?.teams?.name || `Team ${teamId.substring(0, 3)}`;
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
        fetchDashboardData().then();
    }, [role]);
    //@ts-ignore
    const toggleRole = () => {
        setRole(role === 'admin' ? 'teamLeader' : 'admin');
    };
    //@ts-ignore
    const StatCard = ({title, value, icon, color, change}) => (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5}}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col"
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
                <div className={`p-2 rounded-full ${color}`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{loading ? '-' : value}</p>
                {change && (
                    <span
                        className={`ml-2 flex items-center text-sm ${change > 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {change > 0 ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
                        {Math.abs(change)}%
            </span>
                )}
            </div>
        </motion.div>
    );

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



                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-8">
                        {/* Stats Grid */}
                        <SimStarts refreshing={loading}/>
                        {/*<div className="grid grid-cols-1 md:grid-cols-2  gap-1">*/}
                        {/*    <StatCard*/}
                        {/*        title="Total SIM Sales"*/}
                        {/*        value={stats.totalSales}*/}
                        {/*        icon={<CreditCard size={20} className="text-white"/>}*/}
                        {/*        color="bg-blue-500"*/}
                        {/*        change={5.2} // This would ideally be calculated from historical data*/}
                        {/*    />*/}
                        {/*    <StatCard*/}
                        {/*        title="Activation Rate"*/}
                        {/*        value={`${stats.activationRate}%`}*/}
                        {/*        icon={<CheckCircle size={20} className="text-white"/>}*/}
                        {/*        color="bg-green-500"*/}
                        {/*        change={2.1} // This would ideally be calculated from historical data*/}
                        {/*    />*/}
                        {/*    <StatCard*/}
                        {/*        title="Pending Approvals"*/}
                        {/*        value={stats.pendingApprovals}*/}
                        {/*        icon={<Users size={20} className="text-white"/>}*/}
                        {/*        color="bg-yellow-500"*/}
                        {/*        change={-1.5} // This would ideally be calculated from historical data*/}
                        {/*    />*/}
                        {/*    <StatCard*/}
                        {/*        title="Flagged Transactions"*/}
                        {/*        value={stats.flaggedTransactions}*/}
                        {/*        icon={<AlertCircle size={20} className="text-white"/>}*/}
                        {/*        color="bg-red-500"*/}
                        {/*        change={3.8} // This would ideally be calculated from historical data*/}
                        {/*    />*/}
                        {/*</div>*/}
                        <UserStatistics/>
                    </div>
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Sales & Activation Chart */}
                        <motion.div
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.1}}
                            className="bg-white p-6 rounded-lg shadow-md"
                        >
                            <h2 className="text-lg font-semibold mb-4 flex items-center">
                                <Activity size={18} className="mr-2 text-indigo-600"/>
                                SIM Sales & Activations
                            </h2>
                            <div className="h-72">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <p className="text-gray-500">Loading chart data...</p>
                                    </div>
                                ) : salesData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={salesData}
                                            margin={{top: 5, right: 30, left: 20, bottom: 5}}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                                            <XAxis dataKey="name" stroke="#888"/>
                                            <YAxis stroke="#888"/>
                                            <Tooltip/>
                                            <Legend/>
                                            <Line
                                                type="monotone"
                                                dataKey="sales"
                                                stroke="#4F46E5"
                                                strokeWidth={2}
                                                dot={{r: 4}}
                                                activeDot={{r: 6}}
                                                animationDuration={1500}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="activations"
                                                stroke="#10B981"
                                                strokeWidth={2}
                                                dot={{r: 4}}
                                                activeDot={{r: 6}}
                                                animationDuration={1500}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <p className="text-gray-500">No data available</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Team Performance Chart */}
                        <motion.div
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.2}}
                            className="bg-white p-6 rounded-lg shadow-md"
                        >
                            <h2 className="text-lg font-semibold mb-4 flex items-center">
                                <TrendingUp size={18} className="mr-2 text-indigo-600"/>
                                Team Performance vs Target
                            </h2>
                            <div className="h-72">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <p className="text-gray-500">Loading chart data...</p>
                                    </div>
                                ) : teamPerformance.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={teamPerformance}
                                            margin={{top: 5, right: 30, left: 20, bottom: 5}}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                                            <XAxis dataKey="name" stroke="#888"/>
                                            <YAxis stroke="#888"/>
                                            <Tooltip/>
                                            <Legend/>
                                            <Bar
                                                dataKey="sales"
                                                name="Sales"
                                                fill="#4F46E5"
                                                animationDuration={1500}
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar
                                                dataKey="target"
                                                name="Target"
                                                fill="#E5E7EB"
                                                animationDuration={1500}
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <p className="text-gray-500">No team data available</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                    <div className="grid mb-6 grid-cols-1 lg:grid-cols-2 gap-6">
                        <DashQuickActions/>
                    </div>

                    {/* Bottom Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent SIM Cards */}
                        <motion.div
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.3}}
                            className="bg-white p-6 rounded-lg shadow-md lg:col-span-2"
                        >
                            <h2 className="text-lg font-semibold mb-4 flex items-center">
                                <Calendar size={18} className="mr-2 text-indigo-600"/>
                                Recent SIM Cards
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-4 text-center text-gray-500">Loading...
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
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">

                                                    {
                                                        //@ts-ignore
                                                        sim.serial.length > 10 ? `${sim.serial.substring(0, 5)}...${sim.serial.slice(-4)}` : sim.serial}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{
                                                    //@ts-ignore
                                                    sim.date}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">

                                                    {
                                                        //@ts-ignore
                                                        sim.agent.length > 10 ? `${sim.agent.substring(0, 5)}...` : sim.agent}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">

                                                    {
                                                        //@ts-ignore
                                                        sim.customer.length > 10 ? `${sim.customer.substring(0, 5)}...` : sim.customer}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              //@ts-ignore
                              sim.status === SIMStatus.ACTIVATED ? 'bg-green-100 text-green-800' :
                                  //@ts-ignore
                                  sim.status === SIMStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                          }`}>
                            {
                                //@ts-ignore
                                sim.status}
                          </span>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-4 text-center text-gray-500">No recent
                                                SIM cards found
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>

                        {/* Status Distribution */}
                        <motion.div
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.4}}
                            className="bg-white p-6 rounded-lg shadow-md"
                        >
                            <h2 className="text-lg font-semibold mb-4 flex items-center">
                                <CheckCircle size={18} className="mr-2 text-indigo-600"/>
                                SIM Status Distribution
                            </h2>
                            <div className="h-64 flex items-center justify-center">
                                {loading ? (
                                    <p className="text-gray-500">Loading chart data...</p>
                                ) : pieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                animationDuration={1500}
                                                animationBegin={300}
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                                ))}
                                            </Pie>
                                            <Tooltip/>
                                            <Legend/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-gray-500">No status data available</p>
                                )}
                            </div>
                            <div className="mt-4">
                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                        <span>Activated ({

                                            //@ts-ignore
                                            pieData[0]?.value || 0}%)</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                                        <span>Pending ({
                                            //@ts-ignore
                                            pieData[1]?.value || 0}%)</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                                        <span>Flagged ({
                                            //@ts-ignore
                                            pieData[2]?.value || 0}%)</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
}