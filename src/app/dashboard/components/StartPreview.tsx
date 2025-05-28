import {useEffect, useRef, useState} from "react";
import {useDialog} from "@/app/_providers/dialog";
import {BarChart, Calendar, X} from "lucide-react";
import ReportDateRangeTemplate, {DateSelection} from "@/ui/components/ReportDateModal";
import MaterialSelect from "@/ui/components/MaterialSelect";
import {SIMCard, Team as Team1, User} from "@/models";
import {teamService} from "@/services";
import alert from "@/ui/alert";
import TeamList from "@/ui/components/user/TeamList";
import {useActivity} from "@/app/dashboard/leader-console/components/ActivityCombat";
import {createSupabaseClient} from "@/lib/supabase/client";
import TeamPerformanceChart from "@/app/dashboard/TeamPerformanceChart";
import ConsolidatedStatsCard from "@/app/dashboard/ConsolidatedStatsCard";

type TeamType = Team1 & {
    users?: User,
    leader: string
}
const supabase = createSupabaseClient()
export default function StartPreview({
                                         card,
                                         onClose,
                                     }: {
    card: any,
    onClose: Closure,
}) {
    const [selectedTab, setSelectedTab] = useState('daily');
    const [dateRange, setDateRange] = useState<DateSelection["range"]>({startDate: null, endDate: null});
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teams, setTeams] = useState<TeamType[]>([]);
    const [filteredTeams, setTeams2] = useState<TeamType[]>(teams);
    const [simCards, setSimCards] = useState<SIMCard[]>([]);
    const [previousSimCards, setPreviousSimCards] = useState<SIMCard[]>([]);
    const [loading, setLoading] = useState(true);

    const dialogRef = useRef(null);
    const dialog = useDialog();
    const {navigate: intent} = useActivity();

    // Fetch teams on component mount
    useEffect(() => {
        async function fetchTeams() {
            const {data, error} = await teamService.getAllTeams();
            if (error)
                return alert.error(error.message);
//@ts-ignore
            setTeams((data as TeamType[])?.map(team => {
                team.leader = team.users?.full_name ?? 'No leader';
                return team;
            }));
        }

        fetchTeams();
    }, []);

    // Compute date range based on selected tab
    useEffect(() => {
        const now = new Date();
        const start = new Date();
        const end = new Date();

        if (selectedTab === 'daily') {
            // Today
            start.setHours(0, 0, 0, 0);
        } else if (selectedTab === 'weekly') {
            // Last 7 days
            start.setDate(now.getDate() - 6);
            start.setHours(0, 0, 0, 0);
        } else if (selectedTab === 'monthly') {
            // Last 30 days
            start.setDate(now.getDate() - 29);
            start.setHours(0, 0, 0, 0);
        }

        end.setHours(23, 59, 59, 999);

        setDateRange({startDate: start, endDate: end});
    }, [selectedTab]);

    // Fetch SIM cards data when filters change
    useEffect(() => {
        async function fetchSimCards() {
            if (!dateRange.startDate || !dateRange.endDate) return;

            setLoading(true);

            // Calculate previous period dates based on current selection
            const currentStartDate = new Date(dateRange.startDate);
            const currentEndDate = new Date(dateRange.endDate);
            const duration = currentEndDate.getTime() - currentStartDate.getTime();

            const previousStartDate = new Date(currentStartDate.getTime() - duration);
            const previousEndDate = new Date(currentStartDate.getTime() - 1); // 1ms before current start

            // Fetch current period data
            let query = supabase
                .from('sim_cards')
                .select('*')
                .gte('created_at', dateRange.startDate.toISOString())
                .lte('created_at', dateRange.endDate.toISOString());

            if (selectedTeam) {
                query = query.eq('team_id', selectedTeam);
            }

            const {data: currentData, error: currentError} = await query;

            if (currentError) {
                alert.error('Failed to fetch SIM card data');
                setLoading(false);
                return;
            }

            // Fetch previous period data
            let previousQuery = supabase
                .from('sim_cards')
                .select('*')
                .gte('created_at', previousStartDate.toISOString())
                .lte('created_at', previousEndDate.toISOString());

            if (selectedTeam) {
                previousQuery = previousQuery.eq('team_id', selectedTeam);
            }

            const {data: previousData, error: previousError} = await previousQuery;

            if (previousError) {
                console.error('Failed to fetch previous period data', previousError);
                // Continue even if previous data fetch fails
            }

            setSimCards(currentData as SIMCard[]);
            setPreviousSimCards((previousData || []) as SIMCard[]);
            setLoading(false);
        }

        fetchSimCards();
    }, [dateRange, selectedTeam]);

    useEffect(() => {
        if (selectedTeam)
            setTeams2(teams.filter(t => t.id == selectedTeam))
        else
            setTeams2(teams)
    }, [selectedTeam, teams]);

    const handleDateRangeSelect = (start: Date | null, end: Date | null) => {
        setDateRange({startDate: start, endDate: end});
        setSelectedTab('custom');
    };

    return (
        <div
            ref={dialogRef}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg h-full shadow-xl border border-gray-200 dark:border-gray-900 overflow-hidden"
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                        <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg mr-3">
                            <div className="text-blue-600 dark:text-blue-400">
                                <BarChart size={20}/>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Performance Stats</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X size={20}/>
                    </button>
                </div>

                <div className="flex flex-col overflow-y-auto scrollbar-thin flex-grow">
                    {/* Content */}
                    <div className="p-5 flex-grow overflow-auto">
                        {/* Consolidated Stats Card */}
                        <ConsolidatedStatsCard
                            simCards={simCards}
                            previousSimCards={previousSimCards}
                            loading={loading}
                            period={selectedTab as 'daily' | 'weekly' | 'monthly' | 'custom'}
                        />

                        {/* Filters */}
                        <div className="flex flex-wrap justify-between mb-6">
                            {/* Tabs */}
                            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 sm:mb-0">
                                {['daily', 'weekly', 'monthly'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setSelectedTab(tab)}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
                      ${selectedTab === tab
                                            ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Team Selection and Date Range */}
                            <div className="flex space-x-2 items-center">
                                <span className="flex gap-2 items-center">
                                  <span>Team:</span>
                                  <MaterialSelect
                                      defaultValue="-- Filter by team --,"
                                      className="!w-[250px]"
                                      animation="slide"
                                      options={[{name: "None", id: null}, ...teams]}
                                      valueKey="id"
                                      displayKey="name,leader"
                                      onChange={(value) => setSelectedTeam(value)}
                                  />
                                </span>

                                <button
                                    onClick={() => {
                                        const d = dialog.create({
                                            content: <ReportDateRangeTemplate
                                                onConfirm={selection => {
                                                    handleDateRangeSelect(selection.range.startDate, selection.range.endDate);
                                                    d.dismiss();
                                                }}
                                                onClose={() => d.dismiss()}/>,
                                            size: "lg",
                                        });
                                    }}
                                    className="bg-blue-50/50 text-blue-600 dark:text-blue-400 p-1 rounded-md flex items-center justify-center gap-2 cursor-pointer ml-2"
                                >
                                    <Calendar size={16} className="text-gray-500 dark:text-gray-400"/>
                                    Select period
                                </button>
                            </div>
                        </div>

                        {/* Improved Chart */}
                        <div className="my-4">
                            <TeamPerformanceChart
                                simCards={simCards}
                                teams={teams}
                                selectedTab={selectedTab}
                                dateRange={dateRange}
                                loading={loading}
                            />
                        </div>

                        {/* Team List */}
                        <TeamList
                            onClick={team => {
                                intent("teams", {team: team});
                            }}
                            loading={loading}
                            teams={filteredTeams}
                            simCards={simCards}
                        />
                    </div>

                    {/* Footer */}
                    <div
                        className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}