"use client"
import {useState, useEffect, SetStateAction} from 'react';
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

const COLORS = ['#4ade80', '#f87171'];

export default function TeamLeader() {
    const dialog = useDialog()
    const {user} = useApp()
    const [mounted, setMounted] = useState(false);
    const [_isLoading, setIsLoading] = useState(true);
    const [_selectedStaff, _setSelectedStaff] = useState(null);
    const [_teamStats, setTeamStats] = useState({
        totalMembers: 0,
        activeSIM: 0,
        qualityPercentage: 0,
        monthlyTarget: 0,
        targetCompletion: 0
    });
    const [expandedStaff, setExpandedStaff] = useState<number | null>(null);

    useEffect(() => {
        setMounted(true);

        // Simulate data loading from Supabase
        const timer = setTimeout(() => {
            setTeamStats({
                totalMembers: 5,
                activeSIM: 562,
                qualityPercentage: 92.7,
                monthlyTarget: 600,
                targetCompletion: 93.7
            });

            setIsLoading(false);
        }, 1200);

        return () => clearTimeout(timer);
    }, []);

    const toggleStaffDetails = (id: number ) => {
        if (expandedStaff === id) {
            setExpandedStaff(null);
        } else {
            setExpandedStaff(id);
        }
    };

    if (!mounted) return null;

    return (
        <Dashboard>
            <div className="min-h-screen bg-gray-50 pb-12">
                {/* Main Content */}
                <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8 flex flex-wrap justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Team</h1>
                            <p className="mt-1 text-gray-600">
                                Manage your team members and track performance metrics
                            </p>
                        </div>
                        <div className="mt-4 sm:mt-0 flex space-x-3">
                            <button
                                type={"button"}
                                onClick={() => {
                                    CreateUser(dialog,user!,{})
                                }}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium">
                                <UserPlus className="h-4 w-4 mr-2"/>
                                Add Team Member
                            </button>
                            <button
                                className="flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium">
                                <Calendar className="h-4 w-4 mr-2"/>
                                Schedule
                            </button>
                        </div>
                    </div>

                    {/* Team Overview Stats */}
                    <TeamStats/>
                    {/* Team Performance Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Daily Performance Chart */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Daily Performance</h2>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={dailyPerformanceData}
                                        margin={{top: 5, right: 30, left: 20, bottom: 5}}
                                    >
                                        <CartesianGrid strokeDasharray="3 3"/>
                                        <XAxis dataKey="day"/>
                                        <YAxis/>
                                        <Tooltip/>
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
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Staff Performance Comparison</h2>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart outerRadius={90} data={staffPerformanceData}>
                                        <PolarGrid/>
                                        <PolarAngleAxis dataKey="subject"/>
                                        <PolarRadiusAxis angle={30} domain={[0, 150]}/>
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
                                        <Tooltip/>
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Team Members and Quality Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Team Members List */}
                        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {teamMembers.map((member) => (
                                    <div key={member.id} className="bg-white">
                                        <div
                                            className={`px-6 py-4 cursor-pointer hover:bg-gray-50 ${expandedStaff === member.id ? 'bg-gray-50' : ''}`}
                                            onClick={() => toggleStaffDetails(member.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <img
                                                        src={member.avatar}
                                                        alt={member.name}
                                                        className="h-10 w-10 rounded-full object-cover mr-4"
                                                    />
                                                    <div>
                                                        <h3 className="text-sm font-medium text-gray-900">{member.name}</h3>
                                                        <div className="flex items-center mt-1">
                            <span className={`inline-flex px-2 text-xs font-medium rounded-full ${
                                member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {member.status}
                            </span>
                                                            <span className="mx-2 text-gray-500 text-xs">•</span>
                                                            <span
                                                                className="text-gray-500 text-xs">{member.role.replace(/_/g, ' ')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-right hidden sm:block">
                                                        <div
                                                            className="text-sm font-medium text-gray-900">{member.salesThisMonth} Sales
                                                        </div>
                                                        <div
                                                            className="text-xs text-gray-500">{member.qualitySales} Quality
                                                            ({member.percentQuality}%)
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="text-xs text-gray-500 mr-2 hidden sm:inline">Last active: {member.lastActive}</span>
                                                        {expandedStaff === member.id ?
                                                            <ChevronUp className="h-5 w-5 text-gray-400"/> :
                                                            <ChevronDown className="h-5 w-5 text-gray-400"/>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded staff details */}
                                        {expandedStaff === member.id && (
                                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Contact
                                                            Information</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center">
                                                                <Phone className="h-4 w-4 text-gray-400 mr-2"/>
                                                                <span
                                                                    className="text-sm text-gray-600">{member.phoneNumber}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <Smartphone className="h-4 w-4 text-gray-400 mr-2"/>
                                                                <span
                                                                    className="text-sm text-gray-600">{member.mobigoNumber}</span>
                                                            </div>
                                                            {member.vanLocation && (
                                                                <div className="flex items-center">
                                                                    <Info className="h-4 w-4 text-gray-400 mr-2"/>
                                                                    <span
                                                                        className="text-sm text-gray-600">Van Location: {member.vanLocation}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Performance
                                                            Metrics</h4>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-xs font-medium text-gray-700">Sales Progress</span>
                                                                    <span
                                                                        className="text-xs text-gray-700">{Math.round((member.salesThisMonth / 150) * 100)}%</span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className="bg-green-600 h-2 rounded-full"
                                                                        style={{width: `${Math.min(100, Math.round((member.salesThisMonth / 150) * 100))}%`}}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-xs font-medium text-gray-700">Quality Rate</span>
                                                                    <span
                                                                        className="text-xs text-gray-700">{member.percentQuality}%</span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className={`h-2 rounded-full ${
                                                                            member.percentQuality >= 95 ? 'bg-green-500' :
                                                                                member.percentQuality >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                                                                        }`}
                                                                        style={{width: `${member.percentQuality}%`}}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex justify-end space-x-3">
                                                    <button
                                                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded">
                                                        View Full Profile
                                                    </button>
                                                    <button
                                                        className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium rounded">
                                                        Send Message
                                                    </button>
                                                    <button
                                                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded flex items-center">
                                                        <Settings className="h-3 w-3 mr-1"/>
                                                        Manage
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div
                                className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm text-gray-700">
                Showing <span className="font-medium">5</span> of <span className="font-medium">5</span> team members
              </span>
                                <div className="flex space-x-1">
                                    <button
                                        className="px-2 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                                        Previous
                                    </button>
                                    <button
                                        className="px-2 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>

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

                    {/* Recent Activity and Top Performers */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Activity */}
                        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
                            <div
                                className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                                <button className="text-sm text-green-600 hover:text-green-800">View All</button>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-gray-100 rounded-full mr-4">
                                                <Activity className="h-4 w-4 text-gray-600"/>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">
                                                    <span
                                                        className="font-medium">{activity.staff}</span> {activity.action}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    <Clock className="h-3 w-3 inline mr-1"/>
                                                    {activity.time}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Performers */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-medium text-gray-900">Top Performers</h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="relative">
                                            <img
                                                src="/api/placeholder/40/40"
                                                alt="Jane Smith"
                                                className="h-10 w-10 rounded-full object-cover border-2 border-green-500"
                                            />
                                            <span
                                                className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 bg-green-600 text-white text-xs font-bold rounded-full">1</span>
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <h3 className="text-sm font-medium text-gray-900">Jane Smith</h3>
                                            <div className="flex items-center justify-between mt-1">
                                                <div className="text-xs text-gray-500">165 Sales (95.2% Quality)</div>
                                                <div>
                        <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Award className="h-3 w-3 mr-1"/>
                          Top Sales
                        </span>
                                                </div>
                                            </div>
                                        </div>
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

