import useApp from "@/ui/provider/AppProvider";
import React, {useEffect, useState} from "react";
import simService from "@/services/simService";
import {SIMCard, SIMStatus, Team, User} from "@/models";
import {
    AlertCircle,
    Award,
    BarChart,
    Calendar,
    CheckCircle,
    ChevronRight,
    ChevronUp,
    Filter,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    X,
    XCircle
} from "lucide-react";
import Signal from "@/lib/Signal";
import {useDialog} from "@/app/_providers/dialog";
import {teamService} from "@/services";

type SimAdapter = SIMCard & {
    team_id: Team;
    sold_by_user_id: User;
}

export default function SimStats({refreshing = false}) {
    const [simCards, setSimCards] = useState<SimAdapter[]>([]);
    const [filteredSimCards, setFilteredSimCards] = useState<SimAdapter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(refreshing);
    const [dateFilter, setDateFilter] = useState<{startDate: Date | null, endDate: Date | null}>({
        startDate: null,
        endDate: null
    });
    const [teams, setTeams] = useState<Team[]>([]);
    const {user} = useApp();
    const dialog = useDialog();

    // Stats calculated from sim cards (total always uses all cards, not filtered)
    const totalCards = simCards.length;
    const matchedCards = simCards.filter(card => card.match === SIMStatus.MATCH);
    const unmatchedCards = simCards.filter(card => card.match === SIMStatus.UNMATCH);
    const qualityCards = simCards.filter(card => card.quality === SIMStatus.QUALITY);

    // Filtered cards for daily/weekly stats
    const filteredMatchedCards = filteredSimCards.filter(card => card.match === SIMStatus.MATCH);
    const filteredUnmatchedCards = filteredSimCards.filter(card => card.match === SIMStatus.UNMATCH);
    const filteredQualityCards = filteredSimCards.filter(card => card.quality === SIMStatus.QUALITY);

    // Calculate percentages safely
    const matchedPercent = totalCards ? Math.round((matchedCards.length / totalCards) * 100) : 0;
    const unmatchedPercent = totalCards ? Math.round((unmatchedCards.length / totalCards) * 100) : 0;
    const qualityPercent = matchedCards.length ? Math.round((qualityCards.length / matchedCards.length) * 100) : 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // Group cards by team
    const cardsByTeam = simCards.reduce((acc, card) => {
        const teamId = card.team_id?.id || 'unassigned';
        if (!acc[teamId]) {
            acc[teamId] = [];
        }
        acc[teamId].push(card);
        return acc;
    }, {} as Record<string, SimAdapter[]>);

    // Group filtered cards by team
    const filteredCardsByTeam = filteredSimCards.reduce((acc, card) => {
        const teamId = card.team_id?.id || 'unassigned';
        if (!acc[teamId]) {
            acc[teamId] = [];
        }
        acc[teamId].push(card);
        return acc;
    }, {} as Record<string, SimAdapter[]>);

    // Group cards by batch within each team
    const cardsByTeamAndBatch = Object.entries(cardsByTeam).reduce((acc, [teamId, teamCards]) => {
        acc[teamId] = teamCards.reduce((batchAcc, card) => {
            //@ts-ignore
            const batchId = card.batch_id || 'unassigned';
            if (!batchAcc[batchId]) {
                batchAcc[batchId] = [];
            }
            batchAcc[batchId].push(card);
            return batchAcc;
        }, {} as Record<string, SimAdapter[]>);
        return acc;
    }, {} as Record<string, Record<string, SimAdapter[]>>);

    function countByDate(cards: SimAdapter[], filteredCards: SimAdapter[]) {
        return {
            total: cards.length,
            today: filteredCards.filter(card => new Date(card.activation_date || "") >= startOfToday).length,
            thisWeek: filteredCards.filter(card => new Date(card.activation_date || "") >= startOfWeek).length
        };
    }

    const matchedStats = countByDate(matchedCards, filteredMatchedCards);
    const unmatchedStats = countByDate(unmatchedCards, filteredUnmatchedCards);
    const qualityStats = countByDate(qualityCards, filteredQualityCards);
    const totalStats = countByDate(simCards, filteredSimCards);


    const fetchSimCards = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch SIM cards
            const {data, error} = await simService.getAllSimCards(user!);
            if (error) throw error;

            // Fetch teams
            const {data: teamsData, error: teamsError} = await teamService.getAllTeams();
            if (teamsError) throw teamsError;

            setSimCards(data as SimAdapter[]);
            setTeams(teamsData as Team[]);

            // Apply date filter if set
            applyDateFilter(data as SimAdapter[], dateFilter);
        } catch (err) {
            console.error("Failed to fetch SIM cards:", err);
            setError('Failed to fetch SIM cards. Please try again later.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Apply date filter to SIM cards
    const applyDateFilter = (cards: SimAdapter[], filter: {startDate: Date | null, endDate: Date | null}) => {
        if (!filter.startDate && !filter.endDate) {
            // No filter, use all cards for filtered view
            setFilteredSimCards(cards);
            return;
        }

        const filtered = cards.filter(card => {
            const cardDate = new Date(card.activation_date || card.sale_date || card.created_at);

            if (filter.startDate && filter.endDate) {
                return cardDate >= filter.startDate && cardDate <= filter.endDate;
            } else if (filter.startDate) {
                return cardDate >= filter.startDate;
            } else if (filter.endDate) {
                return cardDate <= filter.endDate;
            }

            return true;
        });

        setFilteredSimCards(filtered);
    };

    // Handle date filter change
    const handleDateFilterChange = (newFilter: {startDate: Date | null, endDate: Date | null}) => {
        setDateFilter(newFilter);
        applyDateFilter(simCards, newFilter);
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchSimCards();
        Signal.trigger("m-refresh", true);
    };

    // Initial fetch
    useEffect(() => {
        if (!user) return;
        fetchSimCards();
    }, [user]);

    // Handle refreshing prop changes
    useEffect(() => {
        if (!user)
            return
        if (refreshing) {
            setIsRefreshing(true);
            fetchSimCards();
        }
    }, [refreshing, user]);

    // Initialize filtered cards with all cards
    useEffect(() => {
        setFilteredSimCards(simCards);
    }, [simCards]);

    // Shimmer loading effect for each card
    const LoadingSkeleton = () => (
        <>
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg animate-pulse flex items-start">
                    <div className="mr-4 bg-gray-200 dark:bg-gray-700 rounded-full p-2 w-10 h-10"></div>
                    <div className="flex-1">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            ))}
        </>
    );

    // Error state
    if (error) {
        return (
            <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg text-center flex flex-col items-center">
                    <AlertCircle size={36} className="text-red-500 dark:text-red-400 mb-2"/>
                    <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={16}/>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }
    const TeamBreakdownDialog = ({ 
        title, 
        teams, 
        cardsByTeam, 
        cardsByTeamAndBatch, 
        onClose 
    }: { 
        title: string, 
        teams: Team[], 
        cardsByTeam: Record<string, SimAdapter[]>, 
        cardsByTeamAndBatch: Record<string, Record<string, SimAdapter[]>>,
        onClose: () => void 
    }) => {
        const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
        const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
        const [view, setView] = useState<'teams' | 'batches' | 'users'>('teams');

        // Get team name by ID
        const getTeamName = (teamId: string) => {
            const team = teams.find(t => t.id === teamId);
            return team ? team.name : 'Unknown Team';
        };

        // Count quality and non-quality cards
        const countQualityCards = (cards: SimAdapter[]) => {
            const quality = cards.filter(card => card.quality === SIMStatus.QUALITY).length;
            const nonQuality = cards.filter(card => card.quality !== SIMStatus.QUALITY).length;
            return { quality, nonQuality };
        };

        // Get cards sold by user
        const getCardsByUser = (cards: SimAdapter[]) => {
            const userMap: Record<string, { user: User, cards: SimAdapter[] }> = {};

            cards.forEach(card => {
                if (card.sold_by_user_id) {
                    const userId = card.sold_by_user_id.id;
                    if (!userMap[userId]) {
                        userMap[userId] = { 
                            user: card.sold_by_user_id, 
                            cards: [] 
                        };
                    }
                    userMap[userId].cards.push(card);
                }
            });

            return Object.values(userMap);
        };

        // Render teams view
        const renderTeamsView = () => (
            <div className="space-y-4 mt-4">
                <h3 className="text-lg font-semibold">Teams</h3>
                {Object.entries(cardsByTeam).map(([teamId, cards]) => {
                    if (teamId === 'unassigned') return null;
                    const { quality, nonQuality } = countQualityCards(cards);
                    return (
                        <div 
                            key={teamId}
                            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => {
                                setSelectedTeam(teamId);
                                setView('batches');
                            }}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-medium">{getTeamName(teamId)}</h4>
                                    <p className="text-sm text-gray-500">Total: {cards.length} SIM cards</p>
                                </div>
                                <div className="flex space-x-2">
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                        Quality: {quality}
                                    </span>
                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                        Non-Quality: {nonQuality}
                                    </span>
                                </div>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    );
                })}
            </div>
        );

        // Render batches view
        const renderBatchesView = () => {
            if (!selectedTeam) return null;

            const batches = cardsByTeamAndBatch[selectedTeam] || {};

            return (
                <div className="space-y-4 mt-4">
                    <div className="flex items-center">
                        <button 
                            className="flex items-center text-blue-600 hover:text-blue-800"
                            onClick={() => {
                                setSelectedTeam(null);
                                setView('teams');
                            }}
                        >
                            <ChevronUp size={16} className="mr-1" />
                            Back to Teams
                        </button>
                        <h3 className="text-lg font-semibold ml-4">{getTeamName(selectedTeam)} - Batches</h3>
                    </div>

                    {Object.entries(batches).map(([batchId, cards]) => {
                        const { quality, nonQuality } = countQualityCards(cards);
                        return (
                            <div 
                                key={batchId}
                                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                onClick={() => {
                                    setSelectedBatch(batchId);
                                    setView('users');
                                }}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-medium">Batch: {batchId === 'unassigned' ? 'Unassigned' : batchId}</h4>
                                        <p className="text-sm text-gray-500">Total: {cards.length} SIM cards</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                            Quality: {quality}
                                        </span>
                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                            Non-Quality: {nonQuality}
                                        </span>
                                    </div>
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        };

        // Render users view
        const renderUsersView = () => {
            if (!selectedTeam || !selectedBatch) return null;

            const cards = cardsByTeamAndBatch[selectedTeam]?.[selectedBatch] || [];
            const userCards = getCardsByUser(cards);

            return (
                <div className="space-y-4 mt-4">
                    <div className="flex items-center">
                        <button 
                            className="flex items-center text-blue-600 hover:text-blue-800"
                            onClick={() => {
                                setSelectedBatch(null);
                                setView('batches');
                            }}
                        >
                            <ChevronUp size={16} className="mr-1" />
                            Back to Batches
                        </button>
                        <h3 className="text-lg font-semibold ml-4">
                            {getTeamName(selectedTeam)} - Batch: {selectedBatch === 'unassigned' ? 'Unassigned' : selectedBatch} - Users
                        </h3>
                    </div>

                    {userCards.map(({ user, cards }) => {
                        const { quality, nonQuality } = countQualityCards(cards);
                        return (
                            <div 
                                key={user.id}
                                className="p-4 border rounded-lg"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-medium">{user.full_name}</h4>
                                        <p className="text-sm text-gray-500">Total: {cards.length} SIM cards</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                            Quality: {quality}
                                        </span>
                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                            Non-Quality: {nonQuality}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {userCards.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                            No users found for this batch
                        </div>
                    )}
                </div>
            );
        };

        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <Calendar size={16} />
                        <span className="text-sm text-gray-500">
                            {dateFilter.startDate 
                                ? `${dateFilter.startDate.toLocaleDateString()} - ${dateFilter.endDate?.toLocaleDateString() || 'Present'}`
                                : 'All Time'
                            }
                        </span>
                    </div>

                    <div className="flex space-x-2">
                        <button 
                            className={`px-3 py-1 rounded-md text-sm ${dateFilter.startDate ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                            onClick={() => handleDateFilterChange({startDate: null, endDate: null})}
                        >
                            All Time
                        </button>
                        <button 
                            className={`px-3 py-1 rounded-md text-sm ${
                                dateFilter.startDate?.toDateString() === startOfToday.toDateString() 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                            onClick={() => handleDateFilterChange({startDate: startOfToday, endDate: now})}
                        >
                            Today
                        </button>
                        <button 
                            className={`px-3 py-1 rounded-md text-sm ${
                                dateFilter.startDate?.toDateString() === startOfWeek.toDateString() 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                            onClick={() => handleDateFilterChange({startDate: startOfWeek, endDate: now})}
                        >
                            This Week
                        </button>
                    </div>
                </div>

                {view === 'teams' && renderTeamsView()}
                {view === 'batches' && renderBatchesView()}
                {view === 'users' && renderUsersView()}
            </div>
        );
    };

    const statCards = [
        {
            title: "Total SIM Cards",
            value: totalStats.total,
            todayValue: totalStats.today,
            weekValue: totalStats.thisWeek,
            color: "blue",
            icon: <BarChart size={18}/>,
            expandable: true,
            description: "Click to view breakdown by team, batch, and user",
            onExpandClick: () => {
                const dialogRef = dialog.create({
                    content: (
                        <TeamBreakdownDialog
                            title="Total SIM Cards Breakdown"
                            teams={teams}
                            cardsByTeam={cardsByTeam}
                            cardsByTeamAndBatch={cardsByTeamAndBatch}
                            onClose={() => dialogRef.dismiss()}
                        />
                    ),
                    size: "lg",
                    design: ["scrollable"]
                });
            }
        },
        {
            title: "Matched",
            value: matchedStats.total,
            todayValue: matchedStats.today,
            weekValue: matchedStats.thisWeek,
            percentage: matchedPercent,
            color: "green",
            icon: <CheckCircle size={20}/>,
            expandable: true,
            description: "Click to view matched SIMs breakdown",
            onExpandClick: () => {
                const dialogRef = dialog.create({
                    content: (
                        <TeamBreakdownDialog
                            title="Matched SIM Cards Breakdown"
                            teams={teams}
                            cardsByTeam={Object.entries(cardsByTeam).reduce((acc, [teamId, cards]) => {
                                acc[teamId] = cards.filter(card => card.match === SIMStatus.MATCH);
                                return acc;
                            }, {} as Record<string, SimAdapter[]>)}
                            cardsByTeamAndBatch={Object.entries(cardsByTeamAndBatch).reduce((acc, [teamId, batches]) => {
                                acc[teamId] = Object.entries(batches).reduce((batchAcc, [batchId, cards]) => {
                                    batchAcc[batchId] = cards.filter(card => card.match === SIMStatus.MATCH);
                                    return batchAcc;
                                }, {} as Record<string, SimAdapter[]>);
                                return acc;
                            }, {} as Record<string, Record<string, SimAdapter[]>>)}
                            onClose={() => dialogRef.dismiss()}
                        />
                    ),
                    size: "lg",
                    design: ["scrollable"]
                });
            }
        },
        {
            title: "Unmatched",
            value: unmatchedStats.total,
            todayValue: unmatchedStats.today,
            weekValue: unmatchedStats.thisWeek,
            percentage: unmatchedPercent,
            color: "red",
            icon: <XCircle size={20}/>,
            expandable: true,
            description: "Click to view unmatched SIMs breakdown",
            onExpandClick: () => {
                const dialogRef = dialog.create({
                    content: (
                        <TeamBreakdownDialog
                            title="Unmatched SIM Cards Breakdown"
                            teams={teams}
                            cardsByTeam={Object.entries(cardsByTeam).reduce((acc, [teamId, cards]) => {
                                acc[teamId] = cards.filter(card => card.match === SIMStatus.UNMATCH);
                                return acc;
                            }, {} as Record<string, SimAdapter[]>)}
                            cardsByTeamAndBatch={Object.entries(cardsByTeamAndBatch).reduce((acc, [teamId, batches]) => {
                                acc[teamId] = Object.entries(batches).reduce((batchAcc, [batchId, cards]) => {
                                    batchAcc[batchId] = cards.filter(card => card.match === SIMStatus.UNMATCH);
                                    return batchAcc;
                                }, {} as Record<string, SimAdapter[]>);
                                return acc;
                            }, {} as Record<string, Record<string, SimAdapter[]>>)}
                            onClose={() => dialogRef.dismiss()}
                        />
                    ),
                    size: "lg",
                    design: ["scrollable"]
                });
            }
        },
        {
            title: "Quality",
            value: qualityStats.total,
            todayValue: qualityStats.today,
            weekValue: qualityStats.thisWeek,
            percentage: qualityPercent,
            color: "purple",
            icon: <Award size={20}/>,
            description: "Click to view quality metrics breakdown",
            expandable: true,
            onExpandClick: () => {
                const dialogRef = dialog.create({
                    content: (
                        <TeamBreakdownDialog
                            title="Quality SIM Cards Breakdown"
                            teams={teams}
                            cardsByTeam={Object.entries(cardsByTeam).reduce((acc, [teamId, cards]) => {
                                acc[teamId] = cards.filter(card => card.quality === SIMStatus.QUALITY);
                                return acc;
                            }, {} as Record<string, SimAdapter[]>)}
                            cardsByTeamAndBatch={Object.entries(cardsByTeamAndBatch).reduce((acc, [teamId, batches]) => {
                                acc[teamId] = Object.entries(batches).reduce((batchAcc, [batchId, cards]) => {
                                    batchAcc[batchId] = cards.filter(card => card.quality === SIMStatus.QUALITY);
                                    return batchAcc;
                                }, {} as Record<string, SimAdapter[]>);
                                return acc;
                            }, {} as Record<string, Record<string, SimAdapter[]>>)}
                            onClose={() => dialogRef.dismiss()}
                        />
                    ),
                    size: "lg",
                    design: ["scrollable"]
                });
            }
        },
    ];


    // Date filter component
    const DateFilterBar = () => (
        <div className="mb-4 flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                <Filter size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by date:</span>
            </div>

            <div className="flex space-x-2">
                <button 
                    className={`px-3 py-1 rounded-md text-sm ${dateFilter.startDate ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200'}`}
                    onClick={() => handleDateFilterChange({startDate: null, endDate: null})}
                >
                    All Time
                </button>
                <button 
                    className={`px-3 py-1 rounded-md text-sm ${
                        dateFilter.startDate?.toDateString() === startOfToday.toDateString() 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                    onClick={() => handleDateFilterChange({startDate: startOfToday, endDate: now})}
                >
                    Today
                </button>
                <button 
                    className={`px-3 py-1 rounded-md text-sm ${
                        dateFilter.startDate?.toDateString() === startOfWeek.toDateString() 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                    onClick={() => handleDateFilterChange({startDate: startOfWeek, endDate: now})}
                >
                    This Week
                </button>
                <button 
                    className="px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 flex items-center"
                    onClick={() => {
                        const dialogRef = dialog.create({
                            content: (
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold mb-4">Select Date Range</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                            <input 
                                                type="date" 
                                                className="w-full p-2 border rounded-md"
                                                defaultValue={dateFilter.startDate?.toISOString().split('T')[0]}
                                                id="start-date-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                            <input 
                                                type="date" 
                                                className="w-full p-2 border rounded-md"
                                                defaultValue={dateFilter.endDate?.toISOString().split('T')[0]}
                                                id="end-date-input"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end space-x-2">
                                        <button 
                                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                                            onClick={() => dialogRef.dismiss()}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md"
                                            onClick={() => {
                                                const startDateInput = document.getElementById('start-date-input') as HTMLInputElement;
                                                const endDateInput = document.getElementById('end-date-input') as HTMLInputElement;

                                                const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
                                                const endDate = endDateInput.value ? new Date(endDateInput.value) : null;

                                                if (endDate) {
                                                    // Set end date to end of day
                                                    endDate.setHours(23, 59, 59, 999);
                                                }

                                                handleDateFilterChange({startDate, endDate});
                                                dialogRef.dismiss();
                                            }}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            ),
                            size: "sm"
                        });
                    }}
                >
                    <Calendar size={14} className="mr-1" />
                    Custom
                </button>
            </div>
        </div>
    );

    return (
        <div className="relative">
            {/* Refresh button */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">SIM Card Statistics</h3>
                    {dateFilter.startDate && (
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {dateFilter.startDate.toLocaleDateString()} - {dateFilter.endDate?.toLocaleDateString() || 'Present'}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-1"
                    aria-label="Refresh stats"
                >
                    <RefreshCw
                        size={16}
                        className={`text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Refresh</span>
                </button>
            </div>

            <DateFilterBar />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {isLoading && !isRefreshing ? (
                    <LoadingSkeleton/>
                ) : (
                    statCards.map((card, index) => (
                        <StatCard
                            key={index}
                            title={card.title}
                            value={card.value}
                            weekValue={card.weekValue}
                            todayValue={card.todayValue}
                            percentage={card.percentage}
                            //@ts-ignore
                            color={card.color}
                            isRefreshing={isRefreshing}
                            icon={card.icon}
                            description={card.description}
                            expandable={card.expandable}
                            onExpandClick={card.onExpandClick}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

// Reusable stat card component with animations
function StatCard({
                      title,
                      value,
                      percentage,
                      color,
                      isRefreshing,
                      todayValue = 0,
                      weekValue = 0,
                      icon, 
                      onExpandClick,
                      description,
                      expandable = false
                  }: {
    title: string;
    value: number;
    weekValue?: number;
    todayValue?: number;
    percentage?: number;
    color: "blue" | "green" | "red" | "purple";
    isRefreshing: boolean;
    icon: React.ReactNode;
    onExpandClick?: () => void;
    description?: string;
    expandable?: boolean;
}) {
    const [prevValue, setPrevValue] = useState(value);
    const [prevTodayValue, setPrevTodayValue] = useState(todayValue);
    const [prevWeekValue, setPrevWeekValue] = useState(weekValue);
    const [isAnimating, setIsAnimating] = useState(false);
    const [activeTab, setActiveTab] = useState<'total' | 'today' | 'week'>('today'); // Default to today

    // Handle value changes with animation
    useEffect(() => {
        if ((value !== prevValue || todayValue !== prevTodayValue || weekValue !== prevWeekValue) && !isRefreshing) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setIsAnimating(false);
                setPrevValue(value);
                setPrevTodayValue(todayValue);
                setPrevWeekValue(weekValue);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [value, prevValue, todayValue, weekValue, prevTodayValue, prevWeekValue, isRefreshing]);

    const colorClasses = {
        blue: {
            bg: "bg-blue-50 dark:bg-blue-900/30",
            text: "text-blue-600 dark:text-blue-400",
            value: "text-blue-800 dark:text-blue-300",
            percent: "text-blue-700 dark:text-blue-400",
            iconBg: "bg-blue-100 dark:bg-blue-800/50",
            iconColor: "text-blue-600 dark:text-blue-400",
            tabActive: "bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-300",
            tabInactive: "text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        },
        green: {
            bg: "bg-green-50 dark:bg-green-900/30",
            text: "text-green-600 dark:text-green-400",
            value: "text-green-800 dark:text-green-300",
            percent: "text-green-700 dark:text-green-400",
            iconBg: "bg-green-100 dark:bg-green-800/50",
            iconColor: "text-green-600 dark:text-green-400",
            tabActive: "bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-300",
            tabInactive: "text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20"
        },
        red: {
            bg: "bg-red-50 dark:bg-red-900/30",
            text: "text-red-600 dark:text-red-400",
            value: "text-red-800 dark:text-red-300",
            percent: "text-red-700 dark:text-red-400",
            iconBg: "bg-red-100 dark:bg-red-800/50",
            iconColor: "text-red-600 dark:text-red-400",
            tabActive: "bg-red-100 dark:bg-red-800/50 text-red-800 dark:text-red-300",
            tabInactive: "text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        },
        purple: {
            bg: "bg-purple-50 dark:bg-purple-900/30",
            text: "text-purple-600 dark:text-purple-400",
            value: "text-purple-800 dark:text-purple-300",
            percent: "text-purple-700 dark:text-purple-400",
            iconBg: "bg-purple-100 dark:bg-purple-800/50",
            iconColor: "text-purple-600 dark:text-purple-400",
            tabActive: "bg-purple-100 dark:bg-purple-800/50 text-purple-800 dark:text-purple-300",
            tabInactive: "text-gray-500 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
        }
    };

    // Calculate trend percentages
    const todayVsWeekTrend = weekValue > 0
        ? Math.round(((todayValue / (weekValue / 7)) - 1) * 100)
        : 0;

    const weekVsTotalTrend = value > 0
        ? Math.round(((weekValue / (value / 4)) - 1) * 100)
        : 0;

    // Get active value and trend based on selected tab
    const getActiveValue = () => {
        switch (activeTab) {
            case 'total':
                return value;
            case 'today':
                return todayValue;
            case 'week':
                return weekValue;
        }
    };

    const getActiveTrend = () => {
        switch (activeTab) {
            case 'total':
                return null; // No trend for total
            case 'today':
                return todayVsWeekTrend;
            case 'week':
                return weekVsTotalTrend;
        }
    };

    const activeTrend = getActiveTrend();
    const isTrendPositive = activeTrend !== null && activeTrend >= 0;

    return (
        <div
            className={`${colorClasses[color].bg} p-5 w-full rounded-lg transition-all duration-200 transform ${
                isAnimating ? 'scale-105' : ''
            } ${isRefreshing ? 'opacity-70' : 'opacity-100'} shadow-sm hover:shadow-md cursor-pointer`}
            onClick={() => expandable && onExpandClick?.()}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                    <div className={`${colorClasses[color].iconBg} p-2 rounded-lg mr-3`}>
                        <div className={colorClasses[color].iconColor}>
                            {icon}
                        </div>
                    </div>
                    <p className={`text-sm font-medium ${colorClasses[color].text}`}>{title}</p>
                </div>

                {percentage !== undefined && (
                    <span className={`text-sm font-semibold ${colorClasses[color].percent} flex items-center`}>
                        {percentage}%
                    </span>
                )}
            </div>

            {/* Tabs for switching between total, today, and week */}
            <div className="flex mb-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    className={`px-3 py-1 text-xs font-medium rounded-t-md ${
                        activeTab === 'today' ? colorClasses[color].tabActive : colorClasses[color].tabInactive
                    }`}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        setActiveTab('today');
                    }}
                >
                    Today
                </button>
                <button
                    className={`px-3 py-1 text-xs font-medium rounded-t-md ${
                        activeTab === 'week' ? colorClasses[color].tabActive : colorClasses[color].tabInactive
                    }`}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        setActiveTab('week');
                    }}
                >
                    This Week
                </button>
                <button
                    className={`px-3 py-1 text-xs font-medium rounded-t-md ${
                        activeTab === 'total' ? colorClasses[color].tabActive : colorClasses[color].tabInactive
                    }`}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        setActiveTab('total');
                    }}
                >
                    Total
                </button>
            </div>

            {/* Active value display */}
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <p className={`text-2xl font-bold ${colorClasses[color].value} ${
                        isAnimating ? 'animate-pulse' : ''
                    }`}>
                        {isRefreshing ? (
                            <span className="inline-block w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                        ) : getActiveValue().toLocaleString()}
                    </p>

                    {/* Trend indicator */}
                    {!isRefreshing && activeTrend !== null && (
                        <div className={`flex items-center ${isTrendPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isTrendPositive ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                            <span className="text-xs font-medium ml-1">{Math.abs(activeTrend)}%</span>
                        </div>
                    )}
                </div>

                {activeTab === 'today' && (
                    <p className="text-xs text-gray-500 mt-1">
                        {todayVsWeekTrend >= 0 
                            ? `${todayVsWeekTrend}% above` 
                            : `${Math.abs(todayVsWeekTrend)}% below`} daily average
                    </p>
                )}

                {activeTab === 'week' && (
                    <p className="text-xs text-gray-500 mt-1">
                        {weekVsTotalTrend >= 0 
                            ? `${weekVsTotalTrend}% above` 
                            : `${Math.abs(weekVsTotalTrend)}% below`} weekly average
                    </p>
                )}
            </div>

            {/* View More / Expand Section */}
            {expandable && (
                <div className="pt-2 text-center border-t border-gray-200 dark:border-gray-700">
                    {description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{description}</p>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            onExpandClick?.();
                        }}
                        className={`inline-flex items-center cursor-pointer justify-center text-sm font-medium ${colorClasses[color].text} hover:opacity-80 transition-opacity`}
                    >
                        <span>View Details</span>
                        <ChevronRight size={16} className="ml-1"/>
                    </button>
                </div>
            )}
        </div>
    );
}
