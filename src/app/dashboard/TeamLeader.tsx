"use client"
import {useState, useEffect, SetStateAction, useCallback} from 'react';
import {
    UserPlus,
    Award,
    Smartphone,
    Calendar,
    ChevronDown,
    ChevronUp,
    Clock,
    Settings,
    Phone,
    Info,
    Activity
} from 'lucide-react';
import {
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis
} from 'recharts';
import Dashboard from "@/ui/components/dash/Dashboard";
import {TeamStats} from "@/app/dashboard/my-team/quicks";
import {useRouter} from "next/navigation";
import {CreateUser} from "@/ui/shortcuts";
import {useDialog} from "@/app/_providers/dialog";
import useApp from "@/ui/provider/AppProvider";
import {teamService} from "@/services";
import {Team, TeamHierarchy, User} from "@/models";
import TeamMembersPanel from "@/ui/components/dash/TeamMemberList";


// Sample data for team members
const teamMembers = [
    {
        id: 1,
        name: 'John Doe',
        role: 'VAN_STAFF',
        vanLocation: 'Nairobi CBD',
        status: 'ACTIVE',
        phoneNumber: '+254712345678',
        mobigoNumber: '+254779012345',
        salesThisMonth: 142,
        qualitySales: 128,
        percentQuality: 90.1,
        lastActive: '1 hour ago',
        avatar: '/api/placeholder/40/40'
    },
    {
        id: 2,
        name: 'Jane Smith',
        role: 'VAN_STAFF',
        vanLocation: 'Westlands',
        status: 'ACTIVE',
        phoneNumber: '+254723456789',
        mobigoNumber: '+254779123456',
        salesThisMonth: 165,
        qualitySales: 157,
        percentQuality: 95.2,
        lastActive: '30 mins ago',
        avatar: '/api/placeholder/40/40'
    },
    {
        id: 3,
        name: 'David Kamau',
        role: 'MPESA_ONLY_AGENT',
        vanLocation: null,
        status: 'ACTIVE',
        phoneNumber: '+254734567890',
        mobigoNumber: '+254779234567',
        salesThisMonth: 98,
        qualitySales: 91,
        percentQuality: 92.9,
        lastActive: '2 hours ago',
        avatar: '/api/placeholder/40/40'
    },
    {
        id: 4,
        name: 'Sarah Wanjiku',
        role: 'NON_MPESA_AGENT',
        vanLocation: null,
        status: 'SUSPENDED',
        phoneNumber: '+254745678901',
        mobigoNumber: '+254779345678',
        salesThisMonth: 23,
        qualitySales: 18,
        percentQuality: 78.3,
        lastActive: '3 days ago',
        avatar: '/api/placeholder/40/40'
    },
    {
        id: 5,
        name: 'Michael Ochieng',
        role: 'VAN_STAFF',
        vanLocation: 'Karen',
        status: 'ACTIVE',
        phoneNumber: '+254756789012',
        mobigoNumber: '+254779456789',
        salesThisMonth: 134,
        qualitySales: 127,
        percentQuality: 94.8,
        lastActive: '45 mins ago',
        avatar: '/api/placeholder/40/40'
    }
];

// Sample daily performance data
const dailyPerformanceData = [
    {day: 'Mon', sales: 42, quality: 36, target: 40},
    {day: 'Tue', sales: 38, quality: 34, target: 40},
    {day: 'Wed', sales: 45, quality: 41, target: 40},
    {day: 'Thu', sales: 39, quality: 36, target: 40},
    {day: 'Fri', sales: 52, quality: 48, target: 40},
    {day: 'Sat', sales: 31, quality: 28, target: 30},
    {day: 'Sun', sales: 27, quality: 25, target: 30}
];

// Sample staff performance data for radar chart
const staffPerformanceData = [
    {subject: 'Sales Volume', A: 120, B: 110, C: 140, D: 80, E: 100, fullMark: 150},
    {subject: 'Quality %', A: 98, B: 130, C: 110, D: 60, E: 120, fullMark: 150},
    {subject: 'Top-ups', A: 86, B: 130, C: 70, D: 60, E: 110, fullMark: 150},
    {subject: 'Activations', A: 99, B: 100, C: 120, D: 70, E: 90, fullMark: 150},
    {subject: 'Customer Info', A: 85, B: 90, C: 100, D: 80, E: 70, fullMark: 150}
];

// Sample staff activity data
const recentActivities = [
    {id: 1, staff: 'John Doe', action: 'Registered 15 new SIM cards', time: '1 hour ago'},
    {id: 2, staff: 'Jane Smith', action: 'Achieved 100% quality on today\'s sales', time: '2 hours ago'},
    {id: 3, staff: 'David Kamau', action: 'Completed daily target of 20 sales', time: '3 hours ago'},
    {id: 4, staff: 'Michael Ochieng', action: 'Updated customer information for 5 SIMs', time: '4 hours ago'},
    {id: 5, staff: 'Jane Smith', action: 'Registered 12 new SIM cards', time: '5 hours ago'}
];

// Sample quality distribution data
const qualityDistributionData = [
    {name: 'Quality SIMs', value: 521},
    {name: 'Non-Quality SIMs', value: 41}
];


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
    }, [fetchTeamData, user]);

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

