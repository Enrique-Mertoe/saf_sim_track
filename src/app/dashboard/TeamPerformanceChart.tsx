import {useState, useEffect} from "react";
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from "recharts";
import {SIMCard, Team as Team1, User} from "@/models";
import {DateSelection} from "@/ui/components/ReportDateModal";

type TeamType = Team1 & {
    users?: User,
    leader: string
}
export default function TeamPerformanceChart({
                                                 simCards,
                                                 teams,
                                                 selectedTab,
                                                 dateRange,
                                                 loading
                                             }: {
    simCards: SIMCard[], teams: TeamType[], dateRange: DateSelection["range"],
    loading: boolean, selectedTab: any
}) {
    const [chartData, setChartData] = useState([]);
    const [showAllTeams, setShowAllTeams] = useState(false);
    const [topTeams, setTopTeams] = useState(5);

    useEffect(() => {
        if (loading || !simCards.length || !teams.length) {
            setChartData([]);
            return;
        }

        // Generate chart data based on selected tab
        const generateChartData = () => {
            // Function to format date based on tab
            const getGroupKey = (date: string | number | Date, tab: string) => {
                const d = new Date(date);
                if (tab === 'daily') {
                    return d.getHours().toString();
                } else if (tab === 'weekly') {
                    return d.getDay().toString();
                } else {
                    return d.getDate().toString();
                }
            };

            // Group by team and time period
            const groupedData = {};

            simCards.forEach(card => {
                const timeKey = getGroupKey(card.sale_date, selectedTab);
                const teamKey = card.team_id || 'unassigned';
//@ts-ignore
                if (!groupedData[timeKey]) {
                    //@ts-ignore
                    groupedData[timeKey] = {total: 0};
                }
//@ts-ignore
                if (!groupedData[timeKey][teamKey]) {
                    //@ts-ignore
                    groupedData[timeKey][teamKey] = 0;
                }
//@ts-ignore
                groupedData[timeKey][teamKey]++;
                //@ts-ignore
                groupedData[timeKey].total++;
            });

            // Create labels based on selectedTab
            let labels = [];
            if (selectedTab === 'daily') {
                labels = Array.from({length: 24}, (_, i) => i.toString());
            } else if (selectedTab === 'weekly') {
                labels = ['0', '1', '2', '3', '4', '5', '6'];
            } else {
                //@ts-ignore
                const startDate = new Date(dateRange.startDate);
                //@ts-ignore
                const endDate = new Date(dateRange.endDate);
                //@ts-ignore
                const daysCount = Math.ceil((endDate - startDate) / (1000 * 3600 * 24)) + 1;
                labels = Array.from({length: daysCount}, (_, i) => {
                    const date = new Date(startDate);
                    date.setDate(startDate.getDate() + i);
                    return date.getDate().toString();
                });
            }

            // Find top contributing teams
            const teamContributions = {};
            teams.forEach(team => {
                //@ts-ignore
                teamContributions[team.id] = 0;
            });

            Object.values(groupedData).forEach(timeData => {
                //@ts-ignore
                Object.entries(timeData).forEach(([key, value]) => {
                    if (key !== 'total' && key !== 'unassigned') {
                        //@ts-ignore
                        teamContributions[key] = (teamContributions[key] || 0) + value;
                    }
                });
            });

            // Sort teams by contribution
            const sortedTeams = Object.entries(teamContributions)
                //@ts-ignore
                .sort((a, b) => b[1] - a[1])
                .map(([id]) => id);

            // Format data for the chart
            return labels.map(label => {
                const data = {name: label};

                if (selectedTab === 'daily') {
                    data.name = `${label}:00`;
                } else if (selectedTab === 'weekly') {
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    data.name = days[parseInt(label)];
                }
//@ts-ignore
                data.total = groupedData[label]?.total || 0;

                // Add team data
                const displayTeams = showAllTeams ? sortedTeams : sortedTeams.slice(0, topTeams);
                displayTeams.forEach(teamId => {
                    const team = teams.find(t => t.id === teamId);
                    if (team) {
                        //@ts-ignore
                        data[team.name] = groupedData[label]?.[teamId] || 0;
                    }
                });

                return data;
            });
        };
//@ts-ignore
        setChartData(generateChartData());
    }, [simCards, teams, selectedTab, dateRange, loading, showAllTeams, topTeams]);

    const getChartColors = () => {
        const baseColors = [
            '#1E88E5', '#8E24AA', '#43A047', '#F9A825', '#D81B60',
            '#5E35B1', '#00ACC1', '#FFB300', '#E53935', '#3949AB',
            '#00897B', '#7CB342', '#FB8C00', '#6D4C41', '#546E7A'
        ];

        const teamColors = {};
        const displayedTeams = showAllTeams ? teams : teams.slice(0, topTeams);

        displayedTeams.forEach((team, index) => {
            //@ts-ignore
            teamColors[team.name] = baseColors[index % baseColors.length];
        });

        return teamColors;
    };

    const getFormattedTitle = () => {
        if (selectedTab === 'daily') {
            return 'Daily Performance by Team';
        } else if (selectedTab === 'weekly') {
            return 'Weekly Performance by Team';
        } else {
            return 'Monthly Performance by Team';
        }
    };

    if (loading) {
        return (
            <div className="text-center h-64 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Loading data...</p>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="text-center h-64 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No data available for the selected period</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    {getFormattedTitle()}
                </h3>
                <div className="flex space-x-2">
                    <select
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm"
                        value={topTeams}
                        onChange={(e) => setTopTeams(parseInt(e.target.value))}
                        disabled={showAllTeams}
                    >
                        <option value="3">Top 3</option>
                        <option value="5">Top 5</option>
                        <option value="10">Top 10</option>
                    </select>
                    <button
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm"
                        onClick={() => setShowAllTeams(!showAllTeams)}
                    >
                        {showAllTeams ? 'Show Top Teams' : 'Show All Teams'}
                    </button>
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 20,
                            bottom: 25,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="name"/>
                        <YAxis/>
                        <Tooltip/>
                        <Legend wrapperStyle={{bottom: -15}}/>
                        {teams
                            .filter((team, index) => showAllTeams || index < topTeams)
                            .map((team, index) => (
                                <Bar
                                    key={team.id}
                                    dataKey={team.name}
                                    stackId="a"
                                    //@ts-ignore
                                    fill={Object.values(getChartColors())[index]}
                                />
                            ))
                        }
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}