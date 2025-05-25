"use client"
import {useCallback, useEffect, useState} from 'react';
import {Calendar, UserPlus} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    Pie,
    PieChart,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import Dashboard from "@/ui/components/dash/Dashboard";
import {TeamStats} from "@/app/dashboard/my-team/quicks";
import {CreateUser} from "@/ui/shortcuts";
import {useDialog} from "@/app/_providers/dialog";
import useApp from "@/ui/provider/AppProvider";
import {teamService} from "@/services";
import {SIMStatus, Team, TeamHierarchy, User} from "@/models";
import TeamMembersPanel from "@/ui/components/dash/TeamMemberList";
import simService from "@/services/simService";
import {db} from '@/lib/firebase/client';
import {collection, limit, onSnapshot, orderBy, query, where} from 'firebase/firestore';


// Team members are now fetched from the database via TeamMembersPanel component

// State for daily performance data
const [dailyPerformanceData, setDailyPerformanceData] = useState([
    {day: 'Mon', sales: 0, quality: 0, target: 40},
    {day: 'Tue', sales: 0, quality: 0, target: 40},
    {day: 'Wed', sales: 0, quality: 0, target: 40},
    {day: 'Thu', sales: 0, quality: 0, target: 40},
    {day: 'Fri', sales: 0, quality: 0, target: 40},
    {day: 'Sat', sales: 0, quality: 0, target: 30},
    {day: 'Sun', sales: 0, quality: 0, target: 30}
]);

// State for staff performance data for radar chart
const [staffPerformanceData, setStaffPerformanceData] = useState([
    {subject: 'Sales Volume', fullMark: 150},
    {subject: 'Quality %', fullMark: 150},
    {subject: 'Top-ups', fullMark: 150},
    {subject: 'Activations', fullMark: 150},
    {subject: 'Customer Info', fullMark: 150}
]);

// State for staff activity data
const [recentActivities, setRecentActivities] = useState([]);

// State for quality distribution data
const [qualityDistributionData, setQualityDistributionData] = useState([
    {name: 'Quality SIMs', value: 0},
    {name: 'Non-Quality SIMs', value: 0}
]);


type TeamAdapter = Team & {
    users: User[]
}
const COLORS = ['#4ade80', '#f87171'];

export default function TeamLeader() {
    const dialog = useDialog()
    const {user} = useApp()
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [_selectedStaff, _setSelectedStaff] = useState(null);
    const [error, setError] = useState<string | null>(null);
    const [teamStats, setTeamStats] = useState({
        totalMembers: 0,
        activeSIM: 0,
        qualityPercentage: 0,
        monthlyTarget: 0,
        targetCompletion: 0
    });
    const [teamData, setTeamData] = useState<TeamAdapter | null>(null);
    const [teamHierachy, setTeamHierarchy] = useState<TeamHierarchy | null>(null);
    const [expandedStaff, setExpandedStaff] = useState<number | null>(null);
    const fetchTeamData = useCallback(async () => {
        if (!user || !user.team_id) return;
        try {
            setIsLoading(true);
            // Get team info
            const {data: teamInfo, error: teamError} = await teamService.getTeamById(user.team_id!)

            if (teamError) throw teamError;

            // Get team members count
            const {data: hierachy, error: countError} = await teamService.getTeamHierarchy(user.team_id)

            if (countError) throw countError;
            if (hierachy.length)
                setTeamHierarchy(hierachy[0])
            setTeamData(teamInfo);

        } catch (error) {
            console.error('Error fetching team data:', error);
            setError('Failed to load team data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user)
            return
        fetchTeamData().then()

        // Fetch real-time data for dashboard metrics
        const fetchDashboardData = async () => {
            if (!user?.team_id) return;

            try {
                // Fetch SIM cards data for the team
                const { data: simCards } = await simService.getSIMCardsByTeamId(user.team_id);

                if (!simCards) return;

                // Get team members
                const { data: teamMembers } = await teamService.getTeamMembers(user.team_id);

                // Process data for daily performance chart
                const today = new Date();
                const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
                const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                // Initialize daily data with zeros
                const dailyData = daysOfWeek.map(day => ({
                    day,
                    sales: 0,
                    quality: 0,
                    target: day === 'Sat' || day === 'Sun' ? 30 : 40
                }));

                // Group SIM cards by day of week
                simCards.forEach(sim => {
                    const simDate = new Date(sim.sale_date || sim.created_at);
                    const simDay = daysOfWeek[simDate.getDay()];
                    const dayData = dailyData.find(d => d.day === simDay);

                    if (dayData) {
                        dayData.sales++;
                        if (sim.quality === SIMStatus.QUALITY) {
                            dayData.quality++;
                        }
                    }
                });

                setDailyPerformanceData(dailyData);

                // Process data for quality distribution
                const qualitySims = simCards.filter(sim => sim.quality === SIMStatus.QUALITY).length;
                const nonQualitySims = simCards.filter(sim => sim.quality === SIMStatus.NONQUALITY).length;

                setQualityDistributionData([
                    { name: 'Quality SIMs', value: qualitySims },
                    { name: 'Non-Quality SIMs', value: nonQualitySims }
                ]);

                // Process data for staff performance radar chart
                if (teamMembers && teamMembers.length > 0) {
                    // Get top 5 team members by sales volume
                    const topMembers = [...teamMembers]
                        .sort((a, b) => {
                            const aCount = simCards.filter(sim => sim.sold_by_user_id === a.id).length;
                            const bCount = simCards.filter(sim => sim.sold_by_user_id === b.id).length;
                            return bCount - aCount;
                        })
                        .slice(0, 5);

                    // Create radar chart data
                    const radarData = [
                        { subject: 'Sales Volume', fullMark: 150 },
                        { subject: 'Quality %', fullMark: 150 },
                        { subject: 'Top-ups', fullMark: 150 },
                        { subject: 'Activations', fullMark: 150 },
                        { subject: 'Customer Info', fullMark: 150 }
                    ];

                    // Add data for each team member
                    topMembers.forEach((member, index) => {
                        const memberSims = simCards.filter(sim => sim.sold_by_user_id === member.id);
                        const salesVolume = memberSims.length;
                        const qualityRate = memberSims.length > 0 
                            ? (memberSims.filter(sim => sim.quality === SIMStatus.QUALITY).length / memberSims.length) * 100
                            : 0;
                        const topUps = memberSims.filter(sim => sim.top_up_amount > 0).length;
                        const activations = memberSims.filter(sim => sim.status === 'ACTIVE').length;
                        const customerInfo = memberSims.filter(sim => sim.customer_name && sim.customer_id_number).length;

                        // Map to keys A, B, C, D, E for the radar chart
                        const key = String.fromCharCode(65 + index); // A, B, C, D, E

                        radarData[0][key] = Math.min(salesVolume * 10, 150); // Scale sales volume
                        radarData[1][key] = Math.min(qualityRate, 150);
                        radarData[2][key] = Math.min(topUps * 15, 150); // Scale top-ups
                        radarData[3][key] = Math.min(activations * 15, 150); // Scale activations
                        radarData[4][key] = Math.min(customerInfo * 15, 150); // Scale customer info
                    });

                    setStaffPerformanceData(radarData);
                }

                // Set up Firebase real-time listener for recent activities
                const activitiesQuery = query(
                    collection(db, 'activities'),
                    where('team_id', '==', user.team_id),
                    orderBy('timestamp', 'desc'),
                    limit(5)
                );

                const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
                    const activities = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const timestamp = data.timestamp?.toDate() || new Date();
                        const timeAgo = getTimeAgo(timestamp);

                        activities.push({
                            id: doc.id,
                            staff: data.user_name || 'Unknown User',
                            action: data.action || 'Performed an action',
                            time: timeAgo
                        });
                    });

                    setRecentActivities(activities);
                });

                // Return cleanup function
                return () => unsubscribe();
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchDashboardData();
    }, [fetchTeamData, user]);

    // Helper function to format time ago
    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' years ago';

        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' months ago';

        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' days ago';

        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' hours ago';

        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutes ago';

        return Math.floor(seconds) + ' seconds ago';
    };

    const toggleStaffDetails = (id: number) => {
        if (expandedStaff === id) {
            setExpandedStaff(null);
        } else {
            setExpandedStaff(id);
        }
    };

    if (isLoading) {
        return (
            <Dashboard>
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
                {/* Main Content */}
                <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8 flex flex-wrap justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome {user?.full_name}</h1>
                            <p className="mt-1 text-gray-600 dark:text-gray-400">
                                Manage your team members and track performance metrics
                            </p>
                        </div>
                        <div className="mt-4 sm:mt-0 flex space-x-3">
                            <button
                                type={"button"}
                                onClick={() => {
                                    CreateUser(dialog, user!, {})
                                }}
                                className="flex items-center px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 text-sm font-medium">
                                <UserPlus className="h-4 w-4 mr-2"/>
                                Add Team Member
                            </button>
                            <button
                                className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium">
                                <Calendar className="h-4 w-4 mr-2"/>
                                Schedule
                            </button>
                        </div>
                    </div>

                    {/* Team Overview Stats */}
                    <TeamStats members={teamHierachy!} teamInfo={teamData!}/>

                    {/* Team Performance Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Daily Performance Chart */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Daily
                                Performance</h2>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={dailyPerformanceData}
                                        margin={{top: 5, right: 30, left: 20, bottom: 5}}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.8}/>
                                        <XAxis dataKey="day" stroke="#6b7280" fontSize={12} tickLine={false}
                                               axisLine={false}/>
                                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false}/>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--tooltip-bg, white)',
                                                borderColor: 'var(--tooltip-border, #e5e7eb)',
                                                color: 'var(--tooltip-text, #111827)'
                                            }}
                                        />
                                        <Legend/>
                                        <Bar dataKey="sales" name="Total Sales" fill="#6366f1" radius={[4, 4, 0, 0]}/>
                                        <Bar dataKey="quality" name="Quality Sales" fill="#4ade80"
                                             radius={[4, 4, 0, 0]}/>
                                        <Line type="monotone" dataKey="target" name="Target" stroke="#f59e0b"
                                              strokeWidth={2} dot={{r: 4}}/>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Staff Comparison Chart */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Staff Performance
                                Comparison</h2>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart outerRadius={90} data={staffPerformanceData}>
                                        <PolarGrid stroke="#e5e7eb" strokeOpacity={0.8}/>
                                        <PolarAngleAxis dataKey="subject" stroke="#6b7280" fontSize={12}/>
                                        <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="#6b7280" fontSize={12}/>
                                        <Radar name="John" dataKey="A" stroke="#8884d8" fill="#8884d8"
                                               fillOpacity={0.5}/>
                                        <Radar name="Jane" dataKey="B" stroke="#82ca9d" fill="#82ca9d"
                                               fillOpacity={0.5}/>
                                        <Radar name="David" dataKey="C" stroke="#ffc658" fill="#ffc658"
                                               fillOpacity={0.5}/>
                                        <Radar name="Sarah" dataKey="D" stroke="#ff8042" fill="#ff8042"
                                               fillOpacity={0.5}/>
                                        <Radar name="Michael" dataKey="E" stroke="#0088fe" fill="#0088fe"
                                               fillOpacity={0.5}/>
                                        <Legend/>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--tooltip-bg, white)',
                                                borderColor: 'var(--tooltip-border, #e5e7eb)',
                                                color: 'var(--tooltip-text, #111827)'
                                            }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Team Members and Quality Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                          <TeamMembersPanel teamId={user!.team_id!}/>
                        {/* Quality Distribution */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Quality Distribution</h2>
                            <div className="h-60">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={qualityDistributionData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                        >
                                            {qualityDistributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => value.toLocaleString()}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <div className="text-xs text-green-800 font-medium">Quality SIMs</div>
                                        <div className="text-xl font-bold text-green-900">521</div>
                                        <div className="text-xs text-green-700">92.7% of total</div>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-lg">
                                        <div className="text-xs text-red-800 font-medium">Non-Quality SIMs</div>
                                        <div className="text-xl font-bold text-red-900">41</div>
                                        <div className="text-xs text-red-700">7.3% of total</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </Dashboard>
    )
}
