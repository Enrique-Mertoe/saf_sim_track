import {NavigationProvider, Screen, useActivity} from "@/app/dashboard/leader-console/components/ActivityCombat";
import React, {useEffect, useState} from "react";
import StartPreview from "@/app/dashboard/components/StartPreview";
import StaffList from "@/ui/components/user/StaffList";
import {SIMStatus, Team, User} from "@/models";
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Award,
    BarChart3,
    Calendar,
    CheckCircle,
    Map,
    Package,
    Users
} from "lucide-react";
import simService from "@/services/simService";
import {teamService, userService} from "@/services";
import QualityBreakdown from "@/app/dashboard/components/QualityBreakdown";
import useApp from "@/ui/provider/AppProvider";

export default function StatActivity({start, onClose}: any) {
    return (
        <div className={"w-full h-full"}>
            <NavigationProvider initialScreen="main">
                <MainActivity onClose={onClose} start={start}/>
                <Screen name={"teams"}>
                    <TeamsActivity/>
                </Screen>
                <Screen name={"quality"}>
                    <QualityActivity/>
                </Screen>
            </NavigationProvider>
        </div>
    )
}

function MainActivity({start, onClose}: any) {
    const {navigate} = useActivity();

    // Check if the card is related to quality metrics
    const isQualityCard = start?.title === 'Quality';

    // If it's a quality card, navigate to the quality screen
    useEffect(() => {
        if (isQualityCard) {
            navigate('quality', { card: start });
        }
    }, [isQualityCard, navigate, start]);

    return (
        <Screen name={"main"}>
            <StartPreview card={start} onClose={onClose}/>
        </Screen>
    )
}

function QualityActivity() {
    const {user} = useApp()
    const {getParams, goBack} = useActivity();
    const card = getParams()["card"];
    const [currentDate] = useState(new Date().toLocaleDateString());
    const [simCards, setSimCards] = useState([]);
    const [previousSimCards, setPreviousSimCards] = useState([]);
    const [teamData, setTeamData] = useState({});
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');

    // Fetch SIM cards and team data
    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            setLoading(true);


            try {
                // Get current date and previous period date range
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                let startDate, endDate, prevStartDate, prevEndDate;

                // Set date ranges based on selected period
                switch (period) {
                    case 'daily':
                        startDate = today;
                        endDate = new Date(today);
                        endDate.setHours(23, 59, 59, 999);

                        prevStartDate = new Date(today);
                        prevStartDate.setDate(today.getDate() - 1);
                        prevEndDate = new Date(prevStartDate);
                        prevEndDate.setHours(23, 59, 59, 999);
                        break;

                    case 'weekly':
                        startDate = new Date(today);
                        startDate.setDate(today.getDate() - 6);
                        endDate = new Date(today);
                        endDate.setHours(23, 59, 59, 999);

                        prevStartDate = new Date(startDate);
                        prevStartDate.setDate(startDate.getDate() - 7);
                        prevEndDate = new Date(startDate);
                        prevEndDate.setDate(startDate.getDate() - 1);
                        prevEndDate.setHours(23, 59, 59, 999);
                        break;

                    case 'monthly':
                        startDate = new Date(today);
                        startDate.setDate(1);
                        endDate = new Date(today);
                        endDate.setHours(23, 59, 59, 999);

                        prevStartDate = new Date(startDate);
                        prevStartDate.setMonth(startDate.getMonth() - 1);
                        prevEndDate = new Date(startDate);
                        prevEndDate.setDate(startDate.getDate() - 1);
                        prevEndDate.setHours(23, 59, 59, 999);
                        break;

                    default: // custom or fallback
                        startDate = new Date(today);
                        startDate.setDate(today.getDate() - 30);
                        endDate = new Date(today);
                        endDate.setHours(23, 59, 59, 999);

                        prevStartDate = new Date(startDate);
                        prevStartDate.setDate(startDate.getDate() - 30);
                        prevEndDate = new Date(startDate);
                        prevEndDate.setDate(startDate.getDate() - 1);
                        prevEndDate.setHours(23, 59, 59, 999);
                }

                // Fetch all SIM cards - we'll filter them client-side for this demo
                // In a production app, you'd want to filter on the server
                const {data: allSimData} = await simService.getAllSimCards(user);

                if (allSimData) {
                    // Filter SIM cards for current period
                    const currentPeriodSims = allSimData.filter(sim => {
                        const simDate = new Date(sim.created_at);
                        return simDate >= startDate && simDate <= endDate;
                    });

                    // Filter SIM cards for previous period
                    const previousPeriodSims = allSimData.filter(sim => {
                        const simDate = new Date(sim.created_at);
                        return simDate >= prevStartDate && simDate <= prevEndDate;
                    });

                    // @ts-ignore
                    setSimCards(currentPeriodSims);
                    // @ts-ignore
                    setPreviousSimCards(previousPeriodSims);
                }

                // Fetch teams to get team names
                const {data: teamsData} = await teamService.getAllTeams();
                const teamMap = {};

                if (teamsData) {
                    teamsData.forEach(team => {
                        // @ts-ignore
                        teamMap[team.id] = team.name;
                    });
                }

                setTeamData(teamMap);
            } catch (error) {
                console.error("Error fetching data for quality breakdown:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [period,user]);

    return (
        <div className="bg-gray-50 flex flex-col h-full">
            {/* Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <button
                        onClick={() => goBack()}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={20} className="text-gray-600"/>
                    </button>
                    <div className="ml-4">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                            <BarChart3 className="mr-2 text-purple-600" size={20}/>
                            Quality Metrics Breakdown
                        </h2>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Calendar size={14} className="mr-1"/>
                            <span>{currentDate}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <select
                        className="py-2 px-4 bg-white text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as any)}
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom</option>
                    </select>
                    <button
                        className="py-2 px-4 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm font-medium">
                        Export Report
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="overflow-y-auto flex-grow scrollbar-thin p-6">
                <QualityBreakdown
                    simCards={simCards}
                    previousSimCards={previousSimCards}
                    loading={loading}
                    period={period}
                    teamData={teamData}
                />
            </div>
        </div>
    );
}


interface StatCardProps {
    title: string;
    value: string | number;
    description: string;
    icon: React.ReactNode;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({title, value, description, icon, color}) => {
    return (
        <div
            className={`bg-white rounded-lg shadow-md p-6 flex items-center transition-all duration-300 hover:shadow-lg border-l-4 ${color}`}>
            <div className="mr-4">
                {icon}
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold mb-1">{value}</h3>
                <p className="text-gray-600 text-xs">{description}</p>
            </div>
        </div>
    );
};

interface PerformanceChartProps {
    matched: number;
    unmatched: number;
    qualityPass: number;
    qualityFail: number;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({matched, unmatched, qualityPass, qualityFail}) => {
    const total = matched + unmatched;
    const matchedPercent = total > 0 ? (matched / total) * 100 : 0;

    const totalQuality = qualityPass + qualityFail;
    const qualityPercent = totalQuality > 0 ? (qualityPass / totalQuality) * 100 : 0;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Team Performance</h3>

            <div className="mb-4">
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Match Rate</span>
                    <span className="text-sm font-medium text-gray-700">{matchedPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${matchedPercent}%`}}></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>Matched: {matched}</span>
                    <span>Unmatched: {unmatched}</span>
                </div>
            </div>

            <div>
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Quality Rate</span>
                    <span className="text-sm font-medium text-gray-700">{qualityPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{width: `${qualityPercent}%`}}></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>Quality Pass: {qualityPass}</span>
                    <span>Quality Fail: {qualityFail}</span>
                </div>
            </div>
        </div>
    );
};

function TeamsActivity() {
    const {getParams, goBack} = useActivity();
    const team = getParams()["team"] as Team
    const [currentDate] = useState(new Date().toLocaleDateString());
    const { user } = useApp();

    const [staff, setStaff] = useState<User[]>([]);
    const [simData, setSimData] = useState<{
        total: number;
        sold: number;
        matched: number;
        unmatched: number;
        qualityPass: number;
        qualityFail: number;
    }>({
        total: 0,
        sold: 0,
        matched: 0,
        unmatched: 0,
        qualityPass: 0,
        qualityFail: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    // Function to fetch, filter, and map SIM card data for the team
    useEffect(() => {
        async function fetchSims() {
            try {
                // Fetch SIM cards data for this team
                const simCards = await simService.getSIMCardsByTeamId(team.id);

                // Filter and count SIM cards by status
                const soldSims = simCards.filter(sim => sim.status === SIMStatus.QUALITY);
                const matchedSims = simCards.filter(sim => sim.match === SIMStatus.MATCH);
                const unmatchedSims = simCards.filter(sim => sim.match === SIMStatus.UNMATCH);
                const qualityPassSims = simCards.filter(sim => sim.quality === SIMStatus.QUALITY);
                const qualityFailSims = simCards.filter(sim => sim.quality === SIMStatus.NONQUALITY);

                // Generate summarized data
                const processedData = {
                    total: simCards.length,
                    sold: soldSims.length,
                    matched: matchedSims.length,
                    unmatched: unmatchedSims.length,
                    qualityPass: qualityPassSims.length,
                    qualityFail: qualityFailSims.length
                };

                // Calculate staff performance based on SIM cards
                const staffPerformance = {};

                // Group SIM cards by seller (sold_by_user_id)
                simCards.forEach(sim => {
                    const userId = sim.sold_by_user_id;
//@ts-ignore
                    if (!staffPerformance[userId]) {
                        //@ts-ignore
                        staffPerformance[userId] = {
                            simsSold: 0,
                            matched: 0,
                            unmatched: 0,
                            qualityPass: 0,
                            qualityFail: 0
                        };
                    }
//@ts-ignore
                    staffPerformance[userId].simsSold++;

                    if (sim.match === SIMStatus.MATCH) {
                        //@ts-ignore
                        staffPerformance[userId].matched++;
                    } else if (sim.match === SIMStatus.UNMATCH) {
                        //@ts-ignore
                        staffPerformance[userId].unmatched++;
                    }

                    if (sim.quality === SIMStatus.QUALITY) {
                        //@ts-ignore
                        staffPerformance[userId].qualityPass++;
                    } else if (sim.quality === SIMStatus.NONQUALITY) {
                        //@ts-ignore
                        staffPerformance[userId].qualityFail++;
                    }
                });

                // Fetch staff members and update their performance metrics
                const {data: staffMembers, error} = await userService.getUsersByTeam(team.id, user);
                if (error) return
                const updatedStaff = staffMembers.map(member => {
                    //@ts-ignore
                    const performance = staffPerformance[member.id] || {
                        simsSold: 0, matched: 0, unmatched: 0, qualityPass: 0, qualityFail: 0
                    };

                    // Calculate rates
                    const matchedRate = performance.simsSold > 0
                        ? Math.round((performance.matched / performance.simsSold) * 100)
                        : 0;

                    const qualityRate = performance.simsSold > 0
                        ? Math.round((performance.qualityPass / performance.simsSold) * 100)
                        : 0;

                    return {
                        ...member,
                        performance: {
                            simsSold: performance.simsSold,
                            matchedRate: matchedRate,
                            qualityRate: qualityRate
                        }
                    };
                });

                // Update state with processed data
                setSimData(processedData);
                // setStaff(updatedStaff);
            } catch (error) {
                console.error("Error fetching SIM card data:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchSims();
    }, [team.id]);

    const Header = () => (
        <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center">
                <button
                    onClick={() => goBack()}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                    <ArrowLeft size={20} className="text-gray-600"/>
                </button>
                <div className="ml-4">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                        <Users className="mr-2 text-blue-600" size={20}/>
                        {team.name}
                    </h2>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Map size={14} className="mr-1"/>
                        <span className="mr-3">{team.region}</span>
                        {team.territory && (
                            <>
                                <span className="mx-2 text-gray-300">|</span>
                                <span>{team.territory}</span>
                            </>
                        )}
                        <span className="mx-2 text-gray-300">|</span>
                        <Calendar size={14} className="mr-1"/>
                        <span>{currentDate}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-3">
                <button
                    className="py-2 px-4 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm font-medium">
                    Export Data
                </button>
                <button
                    className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center">
                    <Activity size={16} className="mr-1"/>
                    Team Activity
                </button>
            </div>
        </div>
    )

    if (isLoading) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <Header/>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 flex flex-col h-full">
            {/* Header */}
            <Header/>

            <div className="overflow-y-auto flex-grow scrollbar-thin">
                <div className="grid grid-cols-1 md:grid-cols-2 p-3 gap-4">
                    <StatCard
                        title="Total SIMs Sold"
                        value={simData.sold}
                        description="Across all team members"
                        icon={<Package size={24} className="text-blue-500"/>}
                        color="border-blue-500"
                    />
                    <StatCard
                        title="Match Rate"
                        value={`${((simData.matched / simData.sold) * 100).toFixed(1)}%`}
                        description={`${simData.matched} matched of ${simData.sold} sold`}
                        icon={<CheckCircle size={24} className="text-green-500"/>}
                        color="border-green-500"
                    />
                    <StatCard
                        title="Quality Rate"
                        value={`${((simData.qualityPass / simData.sold) * 100).toFixed(1)}%`}
                        description={`${simData.qualityPass} passed of ${simData.sold} sold`}
                        icon={<Award size={24} className="text-purple-500"/>}
                        color="border-purple-500"
                    />
                    <StatCard
                        title="SIMs Needing Attention"
                        value={simData.unmatched + simData.qualityFail}
                        description={`${simData.unmatched} unmatched, ${simData.qualityFail} quality fails`}
                        icon={<AlertTriangle size={24} className="text-amber-500"/>}
                        color="border-amber-500"
                    />
                </div>

                {/* Performance Chart */}
                <PerformanceChart
                    matched={simData.matched}
                    unmatched={simData.unmatched}
                    qualityPass={simData.qualityPass}
                    qualityFail={simData.qualityFail}
                />

                {/* Main Content */}
                <div className="p-6">
                    <StaffList team_id={team.id}/>
                </div>
            </div>
        </div>
    );
}
