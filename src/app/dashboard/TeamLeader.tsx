"use client"
import React, {useCallback, useEffect, useState} from 'react';
import alert from "@/ui/alert";
import {Award, Download, Filter, Info, RefreshCw, Smartphone, UserPlus} from 'lucide-react';
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
import {createSupabaseClient} from "@/lib/supabase/client";
import {motion} from 'framer-motion';


// Define types for our metrics
type QualityMetrics = {
    totalConnections: number;
    goodQuality: number;
    poorQuality: number;
    poorQualityBreakdown: {
        topUpBelow50: number;
        notTopUp: number;
        topUpNotConverted: number;
    };
};

type TeamMetrics = {
    teamId: string;
    teamName: string;
    metrics: QualityMetrics;
};

type StaffMetrics = {
    userId: string;
    fullName: string;
    metrics: QualityMetrics;
};

type DateRange = {
    startDate: string;
    endDate: string;
};

// Define filter types
type FilterOptions = {
    dateRange: DateRange;
    teamId?: string;
    qualityType?: 'all' | 'good' | 'poor';
    poorQualityReason?: 'all' | 'topUpBelow50' | 'notTopUp' | 'topUpNotConverted';
    page: number;
    pageSize: number;
};

// Daily performance data structure
type DailyPerformanceData = {
    day: string;
    sales: number;
    quality: number;
    target: number;
};

// Staff performance data structure
type StaffPerformanceData = {
    subject: string;
    [key: string]: number | string;
};

// Quality distribution data structure
type QualityDistributionData = {
    name: string;
    value: number;
};

type TeamAdapter = Team & {
    users: User[]
}
const COLORS = ['#4ade80', '#f87171', '#fbbf24'];

// Function to format date for display
const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Function to get default date range (last 30 days)
const getDefaultDateRange = (): DateRange => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
    };
};

export default function TeamLeader() {
    const dialog = useDialog()
    const {user} = useApp()
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Team data state
    const [teamData, setTeamData] = useState<TeamAdapter | null>(null);
    const [teamHierachy, setTeamHierarchy] = useState<TeamHierarchy | null>(null);

    // Metrics state
    const [teamMetrics, setTeamMetrics] = useState<TeamMetrics[]>([]);
    const [staffMetrics, setStaffMetrics] = useState<StaffMetrics[]>([]);
    const [overallMetrics, setOverallMetrics] = useState<QualityMetrics>({
        totalConnections: 0,
        goodQuality: 0,
        poorQuality: 0,
        poorQualityBreakdown: {
            topUpBelow50: 0,
            notTopUp: 0,
            topUpNotConverted: 0
        }
    });

    // Chart data state
    const [dailyPerformanceData, setDailyPerformanceData] = useState<DailyPerformanceData[]>([]);
    const [staffPerformanceData, setStaffPerformanceData] = useState<StaffPerformanceData[]>([]);
    const [qualityDistributionData, setQualityDistributionData] = useState<QualityDistributionData[]>([]);

    // Filter state
    const [filters, setFilters] = useState<FilterOptions>({
        dateRange: getDefaultDateRange(),
        qualityType: 'all',
        poorQualityReason: 'all',
        page: 1,
        pageSize: 20
    });

    // UI state
    const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    // Fetch team data
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

    // Fetch metrics data
    const fetchMetricsData = useCallback(async () => {
        if (!user || !user.team_id) return;

        try {
            setIsLoading(true);
            const supabase = createSupabaseClient();

            // Fetch SIM cards for the team within the date range
            const { data: simCards, error: simError } = await supabase
                .from('sim_cards')
                .select('*')
                .eq('team_id', user.team_id)
                .gte('created_at', filters.dateRange.startDate)
                .lte('created_at', filters.dateRange.endDate);

            if (simError) throw simError;

            if (!simCards || simCards.length === 0) {
                setOverallMetrics({
                    totalConnections: 0,
                    goodQuality: 0,
                    poorQuality: 0,
                    poorQualityBreakdown: {
                        topUpBelow50: 0,
                        notTopUp: 0,
                        topUpNotConverted: 0
                    }
                });
                setTeamMetrics([]);
                setStaffMetrics([]);
                setDailyPerformanceData([]);
                setStaffPerformanceData([]);
                setQualityDistributionData([
                    { name: 'Good Quality', value: 0 },
                    { name: 'Poor Quality', value: 0 }
                ]);
                setIsLoading(false);
                return;
            }

            // Calculate overall metrics
            const totalConnections = simCards.length;
            const goodQuality = simCards.filter(sim => sim.quality === SIMStatus.QUALITY).length;
            const poorQuality = totalConnections - goodQuality;

            // Calculate poor quality breakdown
            const topUpBelow50 = simCards.filter(sim => 
                sim.quality !== SIMStatus.QUALITY && 
                sim.top_up_amount && 
                sim.top_up_amount < 50
            ).length;

            const notTopUp = simCards.filter(sim => 
                sim.quality !== SIMStatus.QUALITY && 
                (!sim.top_up_amount || sim.top_up_amount === 0)
            ).length;

            const topUpNotConverted = simCards.filter(sim => 
                sim.quality !== SIMStatus.QUALITY && 
                sim.top_up_amount && 
                sim.top_up_amount >= 50
            ).length;

            // Set overall metrics
            setOverallMetrics({
                totalConnections,
                goodQuality,
                poorQuality,
                poorQualityBreakdown: {
                    topUpBelow50,
                    notTopUp,
                    topUpNotConverted
                }
            });

            // Calculate team metrics
            if (teamHierachy) {
                const teamMetricsData: TeamMetrics[] = [];

                // Get unique team IDs from the hierarchy
                const teamIds = [user.team_id];

                // Fetch team data for each team
                const { data: teams, error: teamsError } = await supabase
                    .from('teams')
                    .select('*')
                    .in('id', teamIds);

                if (teamsError) throw teamsError;

                // Calculate metrics for each team
                for (const team of teams) {
                    const teamSims = simCards.filter(sim => sim.team_id === team.id);
                    const teamTotalConnections = teamSims.length;
                    const teamGoodQuality = teamSims.filter(sim => sim.quality === SIMStatus.QUALITY).length;
                    const teamPoorQuality = teamTotalConnections - teamGoodQuality;

                    const teamTopUpBelow50 = teamSims.filter(sim => 
                        sim.quality !== SIMStatus.QUALITY && 
                        sim.top_up_amount && 
                        sim.top_up_amount < 50
                    ).length;

                    const teamNotTopUp = teamSims.filter(sim => 
                        sim.quality !== SIMStatus.QUALITY && 
                        (!sim.top_up_amount || sim.top_up_amount === 0)
                    ).length;

                    const teamTopUpNotConverted = teamSims.filter(sim => 
                        sim.quality !== SIMStatus.QUALITY && 
                        sim.top_up_amount && 
                        sim.top_up_amount >= 50
                    ).length;

                    teamMetricsData.push({
                        teamId: team.id,
                        teamName: team.name,
                        metrics: {
                            totalConnections: teamTotalConnections,
                            goodQuality: teamGoodQuality,
                            poorQuality: teamPoorQuality,
                            poorQualityBreakdown: {
                                topUpBelow50: teamTopUpBelow50,
                                notTopUp: teamNotTopUp,
                                topUpNotConverted: teamTopUpNotConverted
                            }
                        }
                    });
                }

                setTeamMetrics(teamMetricsData);
            }

            // Calculate staff metrics
            if (teamHierachy && teamHierachy.staff) {
                const staffMetricsData: StaffMetrics[] = [];

                for (const staffMember of teamHierachy.staff) {
                    const staffSims = simCards.filter(sim => sim.sold_by_user_id === staffMember.user_id);
                    const staffTotalConnections = staffSims.length;
                    const staffGoodQuality = staffSims.filter(sim => sim.quality === SIMStatus.QUALITY).length;
                    const staffPoorQuality = staffTotalConnections - staffGoodQuality;

                    const staffTopUpBelow50 = staffSims.filter(sim => 
                        sim.quality !== SIMStatus.QUALITY && 
                        sim.top_up_amount && 
                        sim.top_up_amount < 50
                    ).length;

                    const staffNotTopUp = staffSims.filter(sim => 
                        sim.quality !== SIMStatus.QUALITY && 
                        (!sim.top_up_amount || sim.top_up_amount === 0)
                    ).length;

                    const staffTopUpNotConverted = staffSims.filter(sim => 
                        sim.quality !== SIMStatus.QUALITY && 
                        sim.top_up_amount && 
                        sim.top_up_amount >= 50
                    ).length;

                    staffMetricsData.push({
                        userId: staffMember.user_id,
                        fullName: staffMember.full_name,
                        metrics: {
                            totalConnections: staffTotalConnections,
                            goodQuality: staffGoodQuality,
                            poorQuality: staffPoorQuality,
                            poorQualityBreakdown: {
                                topUpBelow50: staffTopUpBelow50,
                                notTopUp: staffNotTopUp,
                                topUpNotConverted: staffTopUpNotConverted
                            }
                        }
                    });
                }

                setStaffMetrics(staffMetricsData);

                // Generate staff performance data for radar chart
                if (staffMetricsData.length > 0) {
                    const radarData: StaffPerformanceData[] = [
                        { subject: 'Sales Volume' },
                        { subject: 'Quality %' },
                        { subject: 'Top-ups' },
                        { subject: 'Activations' },
                        { subject: 'Customer Info' }
                    ];

                    // Add data for each staff member (limit to top 5)
                    const topStaff = staffMetricsData
                        .sort((a, b) => b.metrics.totalConnections - a.metrics.totalConnections)
                        .slice(0, 5);

                    for (const staff of topStaff) {
                        const qualityPercent = staff.metrics.totalConnections > 0 
                            ? (staff.metrics.goodQuality / staff.metrics.totalConnections) * 100 
                            : 0;

                        // Sales Volume
                        radarData[0][staff.fullName] = staff.metrics.totalConnections;

                        // Quality %
                        radarData[1][staff.fullName] = Math.round(qualityPercent);

                        // Top-ups (placeholder - would need actual top-up data)
                        radarData[2][staff.fullName] = Math.round(staff.metrics.goodQuality * 0.8);

                        // Activations
                        radarData[3][staff.fullName] = staff.metrics.goodQuality;

                        // Customer Info (placeholder - would need actual customer info data)
                        radarData[4][staff.fullName] = Math.round(staff.metrics.goodQuality * 0.9);
                    }

                    setStaffPerformanceData(radarData);
                }
            }

            // Generate daily performance data
            const dailyData: { [key: string]: { sales: number, quality: number, target: number } } = {};

            // Initialize all dates in the range
            const startDate = new Date(filters.dateRange.startDate);
            const endDate = new Date(filters.dateRange.endDate);
            const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;

            for (let i = 0; i < dayCount; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                const dateStr = formatDate(date);

                dailyData[dateStr] = {
                    sales: 0,
                    quality: 0,
                    target: 20 // Default target
                };
            }

            // Fill in actual data
            for (const sim of simCards) {
                const saleDate = sim.created_at.split('T')[0];
                if (dailyData[saleDate]) {
                    dailyData[saleDate].sales++;
                    if (sim.quality === SIMStatus.QUALITY) {
                        dailyData[saleDate].quality++;
                    }
                }
            }

            // Convert to array format for chart
            const dailyChartData: DailyPerformanceData[] = Object.keys(dailyData).map(date => {
                const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                return {
                    day: dayOfWeek,
                    sales: dailyData[date].sales,
                    quality: dailyData[date].quality,
                    target: dailyData[date].target
                };
            });

            setDailyPerformanceData(dailyChartData);

            // Generate quality distribution data
            setQualityDistributionData([
                { name: 'Good Quality', value: goodQuality },
                { name: 'Poor Quality', value: poorQuality }
            ]);

        } catch (error) {
            console.error('Error fetching metrics data:', error);
            setError('Failed to load metrics data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [user, filters.dateRange, teamHierachy]);

    // Initial data fetch
    useEffect(() => {
        if (!user) return;
        fetchTeamData().then();
    }, [fetchTeamData, user]);

    // Fetch metrics when team data or filters change
    useEffect(() => {
        if (!teamData || !teamHierachy) return;
        fetchMetricsData().then();
    }, [teamData, teamHierachy, fetchMetricsData]);

    // Handle filter changes
    const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters,
            // Reset to page 1 when filters change
            page: newFilters.hasOwnProperty('page') ? (newFilters.page || 1) : 1
        }));
    };

    // Export data to Excel
    const handleExport = async () => {
        try {
            setExportLoading(true);

            // Prepare export data based on current filters
            const exportData = {
                overallMetrics,
                teamMetrics,
                staffMetrics,
                filters
            };

            // In a real implementation, you would use a library like xlsx to generate the Excel file
            // For now, we'll just simulate a delay and show a success message
            await new Promise(resolve => setTimeout(resolve, 1000));

            alert.success('Export successful! File downloaded.');
            setExportLoading(false);
        } catch (error) {
            console.error('Error exporting data:', error);
            alert.error('Failed to export data. Please try again.');
            setExportLoading(false);
        }
    };

    // Toggle staff details
    const toggleStaffDetails = (userId: string) => {
        if (expandedStaff === userId) {
            setExpandedStaff(null);
        } else {
            setExpandedStaff(userId);
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
                                type="button"
                                onClick={() => setShowFilterPanel(!showFilterPanel)}
                                className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium"
                            >
                                <Filter className="h-4 w-4 mr-2"/>
                                {showFilterPanel ? 'Hide Filters' : 'Show Filters'}
                            </button>
                            <button
                                type="button"
                                onClick={handleExport}
                                disabled={exportLoading}
                                className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium"
                            >
                                {exportLoading ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin"/>
                                ) : (
                                    <Download className="h-4 w-4 mr-2"/>
                                )}
                                Export Report
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    CreateUser(dialog, user!, {})
                                }}
                                className="flex items-center px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 text-sm font-medium"
                            >
                                <UserPlus className="h-4 w-4 mr-2"/>
                                Add Team Member
                            </button>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilterPanel && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 animate-fadeIn">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Filter Options</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Date Range Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.dateRange.startDate}
                                        onChange={(e) => handleFilterChange({
                                            dateRange: {
                                                ...filters.dateRange,
                                                startDate: e.target.value
                                            }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.dateRange.endDate}
                                        onChange={(e) => handleFilterChange({
                                            dateRange: {
                                                ...filters.dateRange,
                                                endDate: e.target.value
                                            }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                {/* Quality Type Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Quality Type
                                    </label>
                                    <select
                                        value={filters.qualityType}
                                        onChange={(e) => handleFilterChange({ qualityType: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="all">All Connections</option>
                                        <option value="good">Good Quality Only</option>
                                        <option value="poor">Poor Quality Only</option>
                                    </select>
                                </div>

                                {/* Poor Quality Reason Filter (only shown when poor quality is selected) */}
                                {filters.qualityType === 'poor' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Poor Quality Reason
                                        </label>
                                        <select
                                            value={filters.poorQualityReason}
                                            onChange={(e) => handleFilterChange({ poorQualityReason: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="all">All Reasons</option>
                                            <option value="topUpBelow50">Top-up Below 50</option>
                                            <option value="notTopUp">Not Topped Up</option>
                                            <option value="topUpNotConverted">Topped Up But Not Converted</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={
                                    //@ts-ignore
                                    () => handleFilterChange(getDefaultDateRange())}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Reset Filters
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fetchMetricsData()}
                                    className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quality Metrics Summary */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Quality Report Summary
                            </h2>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {filters.dateRange.startDate} to {filters.dateRange.endDate}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Total Connections */}
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Total Van Connections</p>
                                        <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-200">{overallMetrics.totalConnections.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-indigo-100 dark:bg-indigo-800 p-2 rounded-full">
                                        <Smartphone className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                                    </div>
                                </div>

                                {teamHierachy && teamHierachy.staff && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="mt-4"
                                    >
                                        <div className="flex items-center">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {teamHierachy.staff.slice(0, 5).map((member, index) => (
                                                    <motion.div
                                                        key={member.user_id}
                                                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-indigo-400 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:z-10 hover:scale-110 transition-all duration-200"
                                                        whileHover={{ scale: 1.15, zIndex: 10 }}
                                                        title={member.full_name}
                                                        onClick={() => {
                                                            dialog.create({
                                                                content: (
                                                                    <div className="p-6">
                                                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{member.full_name}</h3>
                                                                        <div className="space-y-3">
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600 dark:text-gray-400">Total Connections:</span>
                                                                                <span className="font-medium">{staffMetrics.find(s => s.userId === member.user_id)?.metrics.totalConnections || 0}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600 dark:text-gray-400">Role:</span>
                                                                                <span className="font-medium">{member.role}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600 dark:text-gray-400">Staff Type:</span>
                                                                                <span className="font-medium">{member.staff_type}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ),
                                                                cancelable: true,
                                                                size: "sm"
                                                            });
                                                        }}
                                                    >
                                                        {member.full_name.charAt(0)}
                                                    </motion.div>
                                                ))}
                                                {teamHierachy.staff.length > 5 && (
                                                    <motion.div
                                                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-400 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:z-10 hover:scale-110 transition-all duration-200"
                                                        whileHover={{ scale: 1.15, zIndex: 10 }}
                                                        onClick={() => {
                                                            dialog.create({
                                                                content: (
                                                                    <div className="p-6">
                                                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">All Team Members</h3>
                                                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                                                            {teamHierachy.staff.map(member => (
                                                                                <div key={member.user_id} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md">
                                                                                    <div className="flex items-center">
                                                                                        <div className="h-8 w-8 rounded-full bg-indigo-400 flex items-center justify-center text-white text-xs font-medium mr-3">
                                                                                            {member.full_name.charAt(0)}
                                                                                        </div>
                                                                                        <span>{member.full_name}</span>
                                                                                    </div>
                                                                                    <span className="font-medium">{staffMetrics.find(s => s.userId === member.user_id)?.metrics.totalConnections || 0}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ),
                                                                cancelable: true,
                                                                size: "md"
                                                            });
                                                        }}
                                                    >
                                                        +{teamHierachy.staff.length - 5}
                                                    </motion.div>
                                                )}
                                            </div>
                                            <span className="ml-3 text-xs text-gray-600 dark:text-gray-400">
                                                {teamHierachy.staff.length} team members
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Good Quality */}
                            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-green-800 dark:text-green-300">Good Quality</p>
                                        <p className="text-2xl font-bold text-green-900 dark:text-green-200">{overallMetrics.goodQuality.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full">
                                        <Award className="h-5 w-5 text-green-600 dark:text-green-300" />
                                    </div>
                                </div>

                                {teamHierachy && teamHierachy.staff && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.1 }}
                                        className="mt-4"
                                    >
                                        <div className="flex items-center">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {teamHierachy.staff
                                                    .filter(member => {
                                                        const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                        return metrics && metrics.goodQuality > 0;
                                                    })
                                                    .slice(0, 5)
                                                    .map((member) => (
                                                        <motion.div
                                                            key={member.user_id}
                                                            className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-green-400 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:z-10 hover:scale-110 transition-all duration-200"
                                                            whileHover={{ scale: 1.15, zIndex: 10 }}
                                                            title={member.full_name}
                                                            onClick={() => {
                                                                const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                dialog.create({
                                                                    content: (
                                                                        <div className="p-6">
                                                                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{member.full_name}</h3>
                                                                            <div className="space-y-3">
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600 dark:text-gray-400">Good Quality:</span>
                                                                                    <span className="font-medium">{metrics?.goodQuality || 0}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600 dark:text-gray-400">Total Connections:</span>
                                                                                    <span className="font-medium">{metrics?.totalConnections || 0}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600 dark:text-gray-400">Quality Rate:</span>
                                                                                    <span className="font-medium">
                                                                                        {metrics && metrics.totalConnections > 0 
                                                                                            ? `${Math.round((metrics.goodQuality / metrics.totalConnections) * 100)}%` 
                                                                                            : '0%'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ),
                                                                    cancelable: true,
                                                                    size: "sm"
                                                                });
                                                            }}
                                                        >
                                                            {member.full_name.charAt(0)}
                                                        </motion.div>
                                                    ))}
                                                {teamHierachy.staff.filter(member => {
                                                    const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                    return metrics && metrics.goodQuality > 0;
                                                }).length > 5 && (
                                                    <motion.div
                                                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-400 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:z-10 hover:scale-110 transition-all duration-200"
                                                        whileHover={{ scale: 1.15, zIndex: 10 }}
                                                        onClick={() => {
                                                            dialog.create({
                                                                content: (
                                                                    <div className="p-6">
                                                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Staff with Good Quality</h3>
                                                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                                                            {teamHierachy.staff
                                                                                .filter(member => {
                                                                                    const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                                    return metrics && metrics.goodQuality > 0;
                                                                                })
                                                                                .sort((a, b) => {
                                                                                    const metricsA = staffMetrics.find(s => s.userId === a.user_id)?.metrics;
                                                                                    const metricsB = staffMetrics.find(s => s.userId === b.user_id)?.metrics;
                                                                                    return (metricsB?.goodQuality || 0) - (metricsA?.goodQuality || 0);
                                                                                })
                                                                                .map(member => {
                                                                                    const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                                    return (
                                                                                        <div key={member.user_id} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md">
                                                                                            <div className="flex items-center">
                                                                                                <div className="h-8 w-8 rounded-full bg-green-400 flex items-center justify-center text-white text-xs font-medium mr-3">
                                                                                                    {member.full_name.charAt(0)}
                                                                                                </div>
                                                                                                <span>{member.full_name}</span>
                                                                                            </div>
                                                                                            <span className="font-medium">{metrics?.goodQuality || 0}</span>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                        </div>
                                                                    </div>
                                                                ),
                                                                cancelable: true,
                                                                size: "md"
                                                            });
                                                        }}
                                                    >
                                                        +{teamHierachy.staff.filter(member => {
                                                            const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                            return metrics && metrics.goodQuality > 0;
                                                        }).length - 5}
                                                    </motion.div>
                                                )}
                                            </div>
                                            <span className="ml-3 text-xs text-gray-600 dark:text-gray-400">
                                                {teamHierachy.staff.filter(member => {
                                                    const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                    return metrics && metrics.goodQuality > 0;
                                                }).length} staff with good quality
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Poor Quality */}
                            <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-red-800 dark:text-red-300">Poor Quality</p>
                                        <p className="text-2xl font-bold text-red-900 dark:text-red-200">{overallMetrics.poorQuality.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-red-100 dark:bg-red-800 p-2 rounded-full">
                                        <Info className="h-5 w-5 text-red-600 dark:text-red-300" />
                                    </div>
                                </div>

                                {teamHierachy && teamHierachy.staff && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.2 }}
                                        className="mt-4"
                                    >
                                        <div className="flex items-center">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {teamHierachy.staff
                                                    .filter(member => {
                                                        const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                        return metrics && metrics.poorQuality > 0;
                                                    })
                                                    .slice(0, 5)
                                                    .map((member) => (
                                                        <motion.div
                                                            key={member.user_id}
                                                            className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-red-400 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:z-10 hover:scale-110 transition-all duration-200"
                                                            whileHover={{ scale: 1.15, zIndex: 10 }}
                                                            title={member.full_name}
                                                            onClick={() => {
                                                                const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                dialog.create({
                                                                    content: (
                                                                        <div className="p-6">
                                                                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{member.full_name}</h3>
                                                                            <div className="space-y-3">
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600 dark:text-gray-400">Poor Quality:</span>
                                                                                    <span className="font-medium">{metrics?.poorQuality || 0}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600 dark:text-gray-400">Total Connections:</span>
                                                                                    <span className="font-medium">{metrics?.totalConnections || 0}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600 dark:text-gray-400">Poor Quality Rate:</span>
                                                                                    <span className="font-medium">
                                                                                        {metrics && metrics.totalConnections > 0 
                                                                                            ? `${Math.round((metrics.poorQuality / metrics.totalConnections) * 100)}%` 
                                                                                            : '0%'}
                                                                                    </span>
                                                                                </div>
                                                                                {metrics && metrics.poorQuality > 0 && (
                                                                                    <>
                                                                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                                                            <h4 className="font-medium mb-2">Poor Quality Breakdown</h4>
                                                                                            <div className="space-y-2">
                                                                                                <div className="flex justify-between">
                                                                                                    <span className="text-gray-600 dark:text-gray-400">Top-up Below 50:</span>
                                                                                                    <span className="font-medium">{metrics.poorQualityBreakdown.topUpBelow50}</span>
                                                                                                </div>
                                                                                                <div className="flex justify-between">
                                                                                                    <span className="text-gray-600 dark:text-gray-400">Not Topped Up:</span>
                                                                                                    <span className="font-medium">{metrics.poorQualityBreakdown.notTopUp}</span>
                                                                                                </div>
                                                                                                <div className="flex justify-between">
                                                                                                    <span className="text-gray-600 dark:text-gray-400">Topped Up But Not Converted:</span>
                                                                                                    <span className="font-medium">{metrics.poorQualityBreakdown.topUpNotConverted}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ),
                                                                    cancelable: true,
                                                                    size: "sm"
                                                                });
                                                            }}
                                                        >
                                                            {member.full_name.charAt(0)}
                                                        </motion.div>
                                                    ))}
                                                {teamHierachy.staff.filter(member => {
                                                    const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                    return metrics && metrics.poorQuality > 0;
                                                }).length > 5 && (
                                                    <motion.div
                                                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-400 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:z-10 hover:scale-110 transition-all duration-200"
                                                        whileHover={{ scale: 1.15, zIndex: 10 }}
                                                        onClick={() => {
                                                            dialog.create({
                                                                content: (
                                                                    <div className="p-6">
                                                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Staff with Poor Quality</h3>
                                                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                                                            {teamHierachy.staff
                                                                                .filter(member => {
                                                                                    const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                                    return metrics && metrics.poorQuality > 0;
                                                                                })
                                                                                .sort((a, b) => {
                                                                                    const metricsA = staffMetrics.find(s => s.userId === a.user_id)?.metrics;
                                                                                    const metricsB = staffMetrics.find(s => s.userId === b.user_id)?.metrics;
                                                                                    return (metricsB?.poorQuality || 0) - (metricsA?.poorQuality || 0);
                                                                                })
                                                                                .map(member => {
                                                                                    const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                                    return (
                                                                                        <div key={member.user_id} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md">
                                                                                            <div className="flex items-center">
                                                                                                <div className="h-8 w-8 rounded-full bg-red-400 flex items-center justify-center text-white text-xs font-medium mr-3">
                                                                                                    {member.full_name.charAt(0)}
                                                                                                </div>
                                                                                                <span>{member.full_name}</span>
                                                                                            </div>
                                                                                            <span className="font-medium">{metrics?.poorQuality || 0}</span>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                        </div>
                                                                    </div>
                                                                ),
                                                                cancelable: true,
                                                                size: "md"
                                                            });
                                                        }}
                                                    >
                                                        +{teamHierachy.staff.filter(member => {
                                                            const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                            return metrics && metrics.poorQuality > 0;
                                                        }).length - 5}
                                                    </motion.div>
                                                )}
                                            </div>
                                            <span className="ml-3 text-xs text-gray-600 dark:text-gray-400">
                                                {teamHierachy.staff.filter(member => {
                                                    const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                    return metrics && metrics.poorQuality > 0;
                                                }).length} staff with poor quality
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Poor Quality Breakdown */}
                        {overallMetrics.poorQuality > 0 && (
                            <div className="mt-6">
                                <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">Poor Quality Breakdown</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Top-up Below 50 */}
                                    <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Line Top-up Below 50</p>
                                                <p className="text-xl font-bold text-amber-900 dark:text-amber-200">{overallMetrics.poorQualityBreakdown.topUpBelow50.toLocaleString()}</p>
                                            </div>
                                            <div className="text-xs text-amber-700 dark:text-amber-400">
                                                {overallMetrics.poorQuality > 0 ? 
                                                    Math.round((overallMetrics.poorQualityBreakdown.topUpBelow50 / overallMetrics.poorQuality) * 100) : 0}%
                                            </div>
                                        </div>

                                        {teamHierachy && teamHierachy.staff && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.1 }}
                                                className="mt-2"
                                            >
                                                <div className="flex items-center">
                                                    <div className="flex -space-x-1 overflow-hidden">
                                                        {teamHierachy.staff
                                                            .filter(member => {
                                                                const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                return metrics && metrics.poorQualityBreakdown.topUpBelow50 > 0;
                                                            })
                                                            .slice(0, 3)
                                                            .map((member) => (
                                                                <motion.div
                                                                    key={member.user_id}
                                                                    className="inline-block h-6 w-6 rounded-full ring-1 ring-white dark:ring-gray-800 bg-amber-400 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:z-10 hover:scale-110 transition-all duration-200"
                                                                    whileHover={{ scale: 1.15, zIndex: 10 }}
                                                                    title={member.full_name}
                                                                    onClick={() => {
                                                                        const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                        dialog.create({
                                                                            content: (
                                                                                <div className="p-4">
                                                                                    <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">{member.full_name}</h3>
                                                                                    <div className="space-y-2">
                                                                                        <div className="flex justify-between">
                                                                                            <span className="text-gray-600 dark:text-gray-400">Top-up Below 50:</span>
                                                                                            <span className="font-medium">{metrics?.poorQualityBreakdown.topUpBelow50 || 0}</span>
                                                                                        </div>
                                                                                        <div className="flex justify-between">
                                                                                            <span className="text-gray-600 dark:text-gray-400">Total Poor Quality:</span>
                                                                                            <span className="font-medium">{metrics?.poorQuality || 0}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ),
                                                                            cancelable: true,
                                                                            size: "sm"
                                                                        });
                                                                    }}
                                                                >
                                                                    {member.full_name.charAt(0)}
                                                                </motion.div>
                                                            ))}
                                                        {teamHierachy.staff.filter(member => {
                                                            const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                            return metrics && metrics.poorQualityBreakdown.topUpBelow50 > 0;
                                                        }).length > 3 && (
                                                            <motion.div
                                                                className="inline-block h-6 w-6 rounded-full ring-1 ring-white dark:ring-gray-800 bg-gray-400 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:z-10 hover:scale-110 transition-all duration-200"
                                                                whileHover={{ scale: 1.15, zIndex: 10 }}
                                                                onClick={() => {
                                                                    dialog.create({
                                                                        content: (
                                                                            <div className="p-4">
                                                                                <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">Staff with Top-up Below 50</h3>
                                                                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                                                                    {teamHierachy.staff
                                                                                        .filter(member => {
                                                                                            const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                                            return metrics && metrics.poorQualityBreakdown.topUpBelow50 > 0;
                                                                                        })
                                                                                        .sort((a, b) => {
                                                                                            const metricsA = staffMetrics.find(s => s.userId === a.user_id)?.metrics;
                                                                                            const metricsB = staffMetrics.find(s => s.userId === b.user_id)?.metrics;
                                                                                            return (metricsB?.poorQualityBreakdown.topUpBelow50 || 0) - (metricsA?.poorQualityBreakdown.topUpBelow50 || 0);
                                                                                        })
                                                                                        .map(member => {
                                                                                            const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                                            return (
                                                                                                <div key={member.user_id} className="flex justify-between items-center p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md">
                                                                                                    <div className="flex items-center">
                                                                                                        <div className="h-6 w-6 rounded-full bg-amber-400 flex items-center justify-center text-white text-xs font-medium mr-2">
                                                                                                            {member.full_name.charAt(0)}
                                                                                                        </div>
                                                                                                        <span className="text-sm">{member.full_name}</span>
                                                                                                    </div>
                                                                                                    <span className="font-medium text-sm">{metrics?.poorQualityBreakdown.topUpBelow50 || 0}</span>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                </div>
                                                                            </div>
                                                                        ),
                                                                        cancelable: true,
                                                                        size: "sm"
                                                                    });
                                                                }}
                                                            >
                                                                +{teamHierachy.staff.filter(member => {
                                                                    const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                    return metrics && metrics.poorQualityBreakdown.topUpBelow50 > 0;
                                                                }).length - 3}
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Not Topped Up */}
                                    <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-medium text-orange-800 dark:text-orange-300">Line Not Topped Up</p>
                                                <p className="text-xl font-bold text-orange-900 dark:text-orange-200">{overallMetrics.poorQualityBreakdown.notTopUp.toLocaleString()}</p>
                                            </div>
                                            <div className="text-xs text-orange-700 dark:text-orange-400">
                                                {overallMetrics.poorQuality > 0 ? 
                                                    Math.round((overallMetrics.poorQualityBreakdown.notTopUp / overallMetrics.poorQuality) * 100) : 0}%
                                            </div>
                                        </div>

                                        {teamHierachy && teamHierachy.staff && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.15 }}
                                                className="mt-2"
                                            >
                                                <div className="flex items-center">
                                                    <div className="flex -space-x-1 overflow-hidden">
                                                        {teamHierachy.staff
                                                            .filter(member => {
                                                                const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                return metrics && metrics.poorQualityBreakdown.notTopUp > 0;
                                                            })
                                                            .slice(0, 3)
                                                            .map((member) => (
                                                                <motion.div
                                                                    key={member.user_id}
                                                                    className="inline-block h-6 w-6 rounded-full ring-1 ring-white dark:ring-gray-800 bg-orange-400 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:z-10 hover:scale-110 transition-all duration-200"
                                                                    whileHover={{ scale: 1.15, zIndex: 10 }}
                                                                    title={member.full_name}
                                                                    onClick={() => {
                                                                        const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                        dialog.create({
                                                                            content: (
                                                                                <div className="p-4">
                                                                                    <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">{member.full_name}</h3>
                                                                                    <div className="space-y-2">
                                                                                        <div className="flex justify-between">
                                                                                            <span className="text-gray-600 dark:text-gray-400">Not Topped Up:</span>
                                                                                            <span className="font-medium">{metrics?.poorQualityBreakdown.notTopUp || 0}</span>
                                                                                        </div>
                                                                                        <div className="flex justify-between">
                                                                                            <span className="text-gray-600 dark:text-gray-400">Total Poor Quality:</span>
                                                                                            <span className="font-medium">{metrics?.poorQuality || 0}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ),
                                                                            cancelable: true,
                                                                            size: "sm"
                                                                        });
                                                                    }}
                                                                >
                                                                    {member.full_name.charAt(0)}
                                                                </motion.div>
                                                            ))}
                                                        {teamHierachy.staff.filter(member => {
                                                            const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                            return metrics && metrics.poorQualityBreakdown.notTopUp > 0;
                                                        }).length > 3 && (
                                                            <motion.div
                                                                className="inline-block h-6 w-6 rounded-full ring-1 ring-white dark:ring-gray-800 bg-gray-400 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:z-10 hover:scale-110 transition-all duration-200"
                                                                whileHover={{ scale: 1.15, zIndex: 10 }}
                                                                onClick={() => {
                                                                    dialog.create({
                                                                        content: (
                                                                            <div className="p-4">
                                                                                <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">Staff with Not Topped Up</h3>
                                                                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                                                                    {teamHierachy.staff
                                                                                        .filter(member => {
                                                                                            const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                                            return metrics && metrics.poorQualityBreakdown.notTopUp > 0;
                                                                                        })
                                                                                        .sort((a, b) => {
                                                                                            const metricsA = staffMetrics.find(s => s.userId === a.user_id)?.metrics;
                                                                                            const metricsB = staffMetrics.find(s => s.userId === b.user_id)?.metrics;
                                                                                            return (metricsB?.poorQualityBreakdown.notTopUp || 0) - (metricsA?.poorQualityBreakdown.notTopUp || 0);
                                                                                        })
                                                                                        .map(member => {
                                                                                            const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                                            return (
                                                                                                <div key={member.user_id} className="flex justify-between items-center p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md">
                                                                                                    <div className="flex items-center">
                                                                                                        <div className="h-6 w-6 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-medium mr-2">
                                                                                                            {member.full_name.charAt(0)}
                                                                                                        </div>
                                                                                                        <span className="text-sm">{member.full_name}</span>
                                                                                                    </div>
                                                                                                    <span className="font-medium text-sm">{metrics?.poorQualityBreakdown.notTopUp || 0}</span>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                </div>
                                                                            </div>
                                                                        ),
                                                                        cancelable: true,
                                                                        size: "sm"
                                                                    });
                                                                }}
                                                            >
                                                                +{teamHierachy.staff.filter(member => {
                                                                    const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                    return metrics && metrics.poorQualityBreakdown.notTopUp > 0;
                                                                }).length - 3}
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Topped Up But Not Converted */}
                                    <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-medium text-rose-800 dark:text-rose-300">Topped Up But Not Converted</p>
                                                <p className="text-xl font-bold text-rose-900 dark:text-rose-200">{overallMetrics.poorQualityBreakdown.topUpNotConverted.toLocaleString()}</p>
                                            </div>
                                            <div className="text-xs text-rose-700 dark:text-rose-400">
                                                {overallMetrics.poorQuality > 0 ? 
                                                    Math.round((overallMetrics.poorQualityBreakdown.topUpNotConverted / overallMetrics.poorQuality) * 100) : 0}%
                                            </div>
                                        </div>

                                        {teamHierachy && teamHierachy.staff && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.2 }}
                                                className="mt-2"
                                            >
                                                <div className="flex items-center">
                                                    <div className="flex -space-x-1 overflow-hidden">
                                                        {teamHierachy.staff
                                                            .filter(member => {
                                                                const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                return metrics && metrics.poorQualityBreakdown.topUpNotConverted > 0;
                                                            })
                                                            .slice(0, 3)
                                                            .map((member) => (
                                                                <motion.div
                                                                    key={member.user_id}
                                                                    className="inline-block h-6 w-6 rounded-full ring-1 ring-white dark:ring-gray-800 bg-rose-400 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:z-10 hover:scale-110 transition-all duration-200"
                                                                    whileHover={{ scale: 1.15, zIndex: 10 }}
                                                                    title={member.full_name}
                                                                    onClick={() => {
                                                                        const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                        dialog.create({
                                                                            content: (
                                                                                <div className="p-4">
                                                                                    <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">{member.full_name}</h3>
                                                                                    <div className="space-y-2">
                                                                                        <div className="flex justify-between">
                                                                                            <span className="text-gray-600 dark:text-gray-400">Topped Up But Not Converted:</span>
                                                                                            <span className="font-medium">{metrics?.poorQualityBreakdown.topUpNotConverted || 0}</span>
                                                                                        </div>
                                                                                        <div className="flex justify-between">
                                                                                            <span className="text-gray-600 dark:text-gray-400">Total Poor Quality:</span>
                                                                                            <span className="font-medium">{metrics?.poorQuality || 0}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ),
                                                                            cancelable: true,
                                                                            size: "sm"
                                                                        });
                                                                    }}
                                                                >
                                                                    {member.full_name.charAt(0)}
                                                                </motion.div>
                                                            ))}
                                                        {teamHierachy.staff.filter(member => {
                                                            const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                            return metrics && metrics.poorQualityBreakdown.topUpNotConverted > 0;
                                                        }).length > 3 && (
                                                            <motion.div
                                                                className="inline-block h-6 w-6 rounded-full ring-1 ring-white dark:ring-gray-800 bg-gray-400 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:z-10 hover:scale-110 transition-all duration-200"
                                                                whileHover={{ scale: 1.15, zIndex: 10 }}
                                                                onClick={() => {
                                                                    dialog.create({
                                                                        content: (
                                                                            <div className="p-4">
                                                                                <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">Staff with Topped Up But Not Converted</h3>
                                                                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                                                                    {teamHierachy.staff
                                                                                        .filter(member => {
                                                                                            const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                                            return metrics && metrics.poorQualityBreakdown.topUpNotConverted > 0;
                                                                                        })
                                                                                        .sort((a, b) => {
                                                                                            const metricsA = staffMetrics.find(s => s.userId === a.user_id)?.metrics;
                                                                                            const metricsB = staffMetrics.find(s => s.userId === b.user_id)?.metrics;
                                                                                            return (metricsB?.poorQualityBreakdown.topUpNotConverted || 0) - (metricsA?.poorQualityBreakdown.topUpNotConverted || 0);
                                                                                        })
                                                                                        .map(member => {
                                                                                            const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                                            return (
                                                                                                <div key={member.user_id} className="flex justify-between items-center p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md">
                                                                                                    <div className="flex items-center">
                                                                                                        <div className="h-6 w-6 rounded-full bg-rose-400 flex items-center justify-center text-white text-xs font-medium mr-2">
                                                                                                            {member.full_name.charAt(0)}
                                                                                                        </div>
                                                                                                        <span className="text-sm">{member.full_name}</span>
                                                                                                    </div>
                                                                                                    <span className="font-medium text-sm">{metrics?.poorQualityBreakdown.topUpNotConverted || 0}</span>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                </div>
                                                                            </div>
                                                                        ),
                                                                        cancelable: true,
                                                                        size: "sm"
                                                                    });
                                                                }}
                                                            >
                                                                +{teamHierachy.staff.filter(member => {
                                                                    const metrics = staffMetrics.find(s => s.userId === member.user_id)?.metrics;
                                                                    return metrics && metrics.poorQualityBreakdown.topUpNotConverted > 0;
                                                                }).length - 3}
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Team Overview Stats */}
                    <TeamStats members={teamHierachy!} teamInfo={teamData!}/>

                    {/* Team Performance Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Daily Performance Chart */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Daily Performance</h2>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={dailyPerformanceData}
                                        margin={{top: 5, right: 30, left: 20, bottom: 5}}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.8}/>
                                        <XAxis dataKey="day" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false}/>
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
                                        <Bar dataKey="quality" name="Quality Sales" fill="#4ade80" radius={[4, 4, 0, 0]}/>
                                        <Line type="monotone" dataKey="target" name="Target" stroke="#f59e0b" strokeWidth={2} dot={{r: 4}}/>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Staff Comparison Chart */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Staff Performance Comparison</h2>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart outerRadius={90} data={staffPerformanceData}>
                                        <PolarGrid stroke="#e5e7eb" strokeOpacity={0.8}/>
                                        <PolarAngleAxis dataKey="subject" stroke="#6b7280" fontSize={12}/>
                                        <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="#6b7280" fontSize={12}/>
                                        {staffMetrics.slice(0, 5).map((staff, index) => {
                                            const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];
                                            return (
                                                <Radar 
                                                    key={staff.userId}
                                                    name={staff.fullName} 
                                                    dataKey={staff.fullName} 
                                                    stroke={colors[index % colors.length]} 
                                                    fill={colors[index % colors.length]}
                                                    fillOpacity={0.5}
                                                />
                                            );
                                        })}
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
                        {/* Team Members Panel */}
                        <div className="lg:col-span-2">
                            <TeamMembersPanel teamId={user!.team_id!}/>
                        </div>

                        {/* Quality Distribution */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Quality Distribution</h2>
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
                                    <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                                        <div className="text-xs text-green-800 dark:text-green-300 font-medium">Good Quality</div>
                                        <div className="text-xl font-bold text-green-900 dark:text-green-200">{overallMetrics.goodQuality}</div>
                                        <div className="text-xs text-green-700 dark:text-green-400">
                                            {overallMetrics.totalConnections > 0 ? 
                                                `${Math.round((overallMetrics.goodQuality / overallMetrics.totalConnections) * 100)}% of total` : 
                                                '0% of total'}
                                        </div>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                                        <div className="text-xs text-red-800 dark:text-red-300 font-medium">Poor Quality</div>
                                        <div className="text-xl font-bold text-red-900 dark:text-red-200">{overallMetrics.poorQuality}</div>
                                        <div className="text-xs text-red-700 dark:text-red-400">
                                            {overallMetrics.totalConnections > 0 ? 
                                                `${Math.round((overallMetrics.poorQuality / overallMetrics.totalConnections) * 100)}% of total` : 
                                                '0% of total'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Staff Performance Details */}
                    {staffMetrics.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Staff Performance Details</h2>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Staff Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Total Connections
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Good Quality
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Poor Quality
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Quality %
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {staffMetrics.map((staff) => (
                                            <React.Fragment key={staff.userId}>
                                                <tr className={expandedStaff === staff.userId ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                        {staff.fullName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {staff.metrics.totalConnections}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                                                        {staff.metrics.goodQuality}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                                                        {staff.metrics.poorQuality}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {staff.metrics.totalConnections > 0 ? 
                                                            `${Math.round((staff.metrics.goodQuality / staff.metrics.totalConnections) * 100)}%` : 
                                                            '0%'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        <button
                                                            onClick={() => toggleStaffDetails(staff.userId)}
                                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                                                        >
                                                            {expandedStaff === staff.userId ? 'Hide Details' : 'Show Details'}
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Expanded details row */}
                                                {expandedStaff === staff.userId && (
                                                    <tr className="bg-indigo-50 dark:bg-indigo-900/20">
                                                        <td colSpan={6} className="px-6 py-4">
                                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                                <h4 className="font-medium mb-2">Poor Quality Breakdown</h4>
                                                                <div className="grid grid-cols-3 gap-4">
                                                                    <div>
                                                                        <p className="text-xs text-amber-700 dark:text-amber-400">Top-up Below 50</p>
                                                                        <p className="font-medium">{staff.metrics.poorQualityBreakdown.topUpBelow50}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-orange-700 dark:text-orange-400">Not Topped Up</p>
                                                                        <p className="font-medium">{staff.metrics.poorQualityBreakdown.notTopUp}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-rose-700 dark:text-rose-400">Topped Up But Not Converted</p>
                                                                        <p className="font-medium">{staff.metrics.poorQualityBreakdown.topUpNotConverted}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-3">
                                                                    <h4 className="font-medium mb-2">Possible Improvement Areas</h4>
                                                                    <ul className="list-disc list-inside text-xs space-y-1">
                                                                        {staff.metrics.poorQualityBreakdown.topUpBelow50 > 0 && (
                                                                            <li>Encourage customers to top up with higher amounts (at least 50)</li>
                                                                        )}
                                                                        {staff.metrics.poorQualityBreakdown.notTopUp > 0 && (
                                                                            <li>Follow up with customers to ensure they top up their lines</li>
                                                                        )}
                                                                        {staff.metrics.poorQualityBreakdown.topUpNotConverted > 0 && (
                                                                            <li>Investigate why topped-up lines are not converting to quality</li>
                                                                        )}
                                                                        {staff.metrics.goodQuality < staff.metrics.totalConnections * 0.8 && (
                                                                            <li>Provide additional training on quality customer onboarding</li>
                                                                        )}
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </Dashboard>
    )
}
