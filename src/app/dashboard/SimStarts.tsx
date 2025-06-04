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
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(refreshing);
    const [isExpanded, setIsExpanded] = useState(false);
    const [dateFilter, setDateFilter] = useState<{startDate: Date | null, endDate: Date | null}>({
        startDate: null,
        endDate: null
    });
    const [teams, setTeams] = useState<Team[]>([]);
    const [pagination, setPagination] = useState({ page: 0, pageSize: 100 });
    const [hasMore, setHasMore] = useState(true);

    // Individual loading states for each card
    const [isTotalLoading, setIsTotalLoading] = useState(true);
    const [isActivatedLoading, setIsActivatedLoading] = useState(true);
    const [isUnactivatedLoading, setIsUnactivatedLoading] = useState(true);
    const [isQualityLoading, setIsQualityLoading] = useState(true);

    // Individual data states for each card
    const [totalData, setTotalData] = useState<{ total: number }>({ total: 0 });
    const [activatedData, setActivatedData] = useState<{ activated: number }>({ activated: 0 });
    const [unactivatedData, setUnactivatedData] = useState<{ unactivated: number }>({ unactivated: 0 });
    const [qualityData, setQualityData] = useState<{ quality: number }>({ quality: 0 });

    // Combined stats for backward compatibility
    const [stats, setStats] = useState<{
        total: number;
        matched: number;
        unmatched: number;
        quality: number;
    }>({
        total: 0,
        matched: 0,
        unmatched: 0,
        quality: 0
    });
    const {user} = useApp();
    const dialog = useDialog();

    // Use stats from server for accurate counts regardless of loaded data
    const totalCards = stats.total;

    // For display purposes, we still need to filter the loaded cards
    const matchedCards = simCards.filter(card => card.match === SIMStatus.MATCH);
    const unmatchedCards = simCards.filter(card => card.match === SIMStatus.UNMATCH);
    const qualityCards = simCards.filter(card => card.quality === SIMStatus.QUALITY);

    // Filtered cards for daily/weekly stats
    const filteredMatchedCards = filteredSimCards.filter(card => card.match === SIMStatus.MATCH);
    const filteredUnmatchedCards = filteredSimCards.filter(card => card.match === SIMStatus.UNMATCH);
    const filteredQualityCards = filteredSimCards.filter(card => card.quality === SIMStatus.QUALITY);

    // Calculate percentages safely using server stats
    const matchedPercent = totalCards ? Math.round((stats.matched / totalCards) * 100) : 0;
    const unmatchedPercent = totalCards ? Math.round((stats.unmatched / totalCards) * 100) : 0;
    const qualityPercent = stats.matched ? Math.round((stats.quality / stats.matched) * 100) : 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    function grp(){
        const cards = []
        console.log("cards",simCards)
        return simCards.reduce((acc, card) => {
            const teamId = card.team_id?.id || 'unassigned';
            if (!acc[teamId]) {
                acc[teamId] = [];
            }
            acc[teamId].push(card);
            return acc;
        }, {} as Record<string, SimAdapter[]>);
    }
    // Group cards by team
    const cardsByTeam= grp()

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


    // Convert date filter to string format for API
    const getDateFilterStrings = () => {
        if (!dateFilter.startDate && !dateFilter.endDate) return undefined;

        return {
            startDate: dateFilter.startDate?.toISOString().split('T')[0],
            endDate: dateFilter.endDate?.toISOString().split('T')[0]
        };
    };

    // Fetch total count independently
    const fetchTotalCount = async () => {
        if (!user) return;
        setIsTotalLoading(true);

        try {
            const dateFilterStrings = getDateFilterStrings();
            const result = await simService.getTotalCount(user, dateFilterStrings);

            if (result.error) throw result.error;

            setTotalData({ total: result.total });

            // Update combined stats for backward compatibility
            setStats(prev => ({ ...prev, total: result.total }));
        } catch (err) {
            console.error("Failed to fetch total count:", err);
            // Don't set global error to avoid disrupting other cards
        } finally {
            setIsTotalLoading(false);
        }
    };

    // Fetch activated count independently
    const fetchActivatedCount = async () => {
        if (!user) return;
        setIsActivatedLoading(true);

        try {
            const dateFilterStrings = getDateFilterStrings();
            const result = await simService.getActivatedCount(user, dateFilterStrings);

            if (result.error) throw result.error;

            setActivatedData({ activated: result.activated });

            // Update combined stats for backward compatibility
            setStats(prev => ({ ...prev, matched: result.activated }));
        } catch (err) {
            console.error("Failed to fetch activated count:", err);
            // Don't set global error to avoid disrupting other cards
        } finally {
            setIsActivatedLoading(false);
        }
    };

    // Fetch unactivated count independently
    const fetchUnMatchedCount = async () => {
        if (!user) return;
        setIsUnactivatedLoading(true);

        try {
            const dateFilterStrings = getDateFilterStrings();
            const result = await simService.getUnmatchedCount(user, dateFilterStrings);

            if (result.error) throw result.error;

            setUnactivatedData({ unactivated: result.unactivated });

            // Update combined stats for backward compatibility
            setStats(prev => ({ ...prev, unmatched: result.unactivated }));
        } catch (err) {
            console.error("Failed to fetch unmatched count:", err);
            // Don't set global error to avoid disrupting other cards
        } finally {
            setIsUnactivatedLoading(false);
        }
    };

    // Fetch quality count independently
    const fetchQualityCount = async () => {
        if (!user) return;
        setIsQualityLoading(true);

        try {
            const dateFilterStrings = getDateFilterStrings();
            const result = await simService.getQualityCount(user, dateFilterStrings);

            if (result.error) throw result.error;

            setQualityData({ quality: result.quality });

            // Update combined stats for backward compatibility
            setStats(prev => ({ ...prev, quality: result.quality }));
        } catch (err) {
            console.error("Failed to fetch quality count:", err);
            // Don't set global error to avoid disrupting other cards
        } finally {
            setIsQualityLoading(false);
        }
    };

    // Load more SIM cards (pagination) or expand the view
    const loadMoreSimCards = async () => {
        if (!user || isLoadingMore) return;

        setIsLoadingMore(true);

        try {
            // If not expanded yet, switch to expanded mode and load initial data
            if (!isExpanded) {
                setIsExpanded(true);
                // Fetch data with expanded mode
                await fetchSimCards();
                return;
            }

            // If already expanded and no more data, return
            if (!hasMore) return;

            const dateFilterStrings = getDateFilterStrings();

            // Fetch next page of SIM cards
            const { data, error } = await simService.getSimCardsChunked(
                user,
                { page: pagination.page + 1, pageSize: pagination.pageSize },
                dateFilterStrings
            );

            if (error) throw error;

            // If we got fewer records than requested, there are no more to load
            if (!data || data.length < pagination.pageSize) {
                setHasMore(false);
            }

            // Append new cards to existing ones
            const newCards = [...simCards, ...(data as SimAdapter[])];
            setSimCards(newCards);

            // Apply date filter to all cards
            applyDateFilter(newCards, dateFilter);

            // Update pagination
            setPagination(prev => ({ ...prev, page: prev.page + 1 }));

        } catch (err) {
            console.error("Failed to load more SIM cards:", err);
            // Don't set error state here to avoid disrupting the UI
        } finally {
            setIsLoadingMore(false);
        }
    };

    const fetchSimCards = async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);

        // Reset pagination when fetching from scratch
        setPagination({ page: 0, pageSize: 100 });
        setHasMore(true);

        try {
            // Fetch each card's data independently
            fetchTotalCount();
            fetchActivatedCount();
            fetchUnMatchedCount();
            fetchQualityCount();

            // In expanded mode, fetch detailed data
            if (isExpanded) {
                const dateFilterStrings = getDateFilterStrings();

                // Fetch first page of SIM cards
                const { data, error } = await simService.getSimCardsChunked(
                    user,
                    { page: 0, pageSize: pagination.pageSize },
                    dateFilterStrings
                );

                if (error) throw error;

                // If we got fewer records than requested, there are no more to load
                if (!data || data.length < pagination.pageSize) {
                    setHasMore(false);
                }

                // Fetch teams
                const { data: teamsData, error: teamsError } = await teamService.getAllTeams();
                if (teamsError) throw teamsError;

                //@ts-ignore
                setTeams(teamsData as Team[]);

                // Update SIM cards state
                setSimCards(data as SimAdapter[]);

                // Apply date filter
                applyDateFilter(data as SimAdapter[], dateFilter);
            } else {
                // In initial mode, just clear the SIM cards data
                setSimCards([]);
                setFilteredSimCards([]);
            }

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

        // When date filter changes, we need to refresh the data from the server
        // to get accurate counts and filtered data
        setIsRefreshing(true);

        // Reset pagination when filter changes
        setPagination({ page: 0, pageSize: 100 });
        setHasMore(true);

        // Clear cache to ensure fresh data with new filter
        if (user) {
            simService.cache.clearForUser(user.id);
        }

        // For immediate UI feedback, apply filter to currently loaded cards
        applyDateFilter(simCards, newFilter);

        // Then fetch fresh data independently for each card
        fetchTotalCount();
        fetchActivatedCount();
        fetchUnMatchedCount();
        fetchQualityCount();

        // Also fetch detailed data if in expanded mode
        if (isExpanded) {
            fetchSimCards();
        } else {
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        // Clear cache to ensure fresh data
        if (user) {
            simService.cache.clearForUser(user.id);
        }

        // Reset expanded state to initial view
        setIsExpanded(false);

        setIsRefreshing(true);

        // Fetch data independently for each card
        fetchTotalCount();
        fetchActivatedCount();
        fetchUnMatchedCount();
        fetchQualityCount();

        // Also fetch detailed data if needed
        fetchSimCards();

        Signal.trigger("m-refresh", true);
    };

    // State preservation for navigation
    useEffect(() => {
        // Try to restore state from sessionStorage when component mounts
        if (user) {
            try {
                const savedState = sessionStorage.getItem('simStatsState');
                if (savedState) {
                    const parsedState = JSON.parse(savedState);

                    // Restore date filter (convert string dates back to Date objects)
                    if (parsedState.dateFilter) {
                        const restoredDateFilter = {
                            startDate: parsedState.dateFilter.startDate ? new Date(parsedState.dateFilter.startDate) : null,
                            endDate: parsedState.dateFilter.endDate ? new Date(parsedState.dateFilter.endDate) : null
                        };
                        setDateFilter(restoredDateFilter);
                    }

                    // Restore pagination
                    if (parsedState.pagination) {
                        setPagination(parsedState.pagination);
                    }

                    // Restore stats
                    if (parsedState.stats) {
                        setStats(parsedState.stats);

                        // Also restore individual card data
                        setTotalData({ total: parsedState.stats.total });
                        setActivatedData({ activated: parsedState.stats.matched });
                        setUnactivatedData({ unactivated: parsedState.stats.unmatched });
                        setQualityData({ quality: parsedState.stats.quality });
                    }

                    // Restore expanded state
                    if (parsedState.isExpanded !== undefined) {
                        setIsExpanded(parsedState.isExpanded);
                    }

                    // Restore SIM cards
                    if (parsedState.simCards && parsedState.simCards.length > 0) {
                        setSimCards(parsedState.simCards);
                        setFilteredSimCards(parsedState.filteredSimCards || parsedState.simCards);
                        setHasMore(parsedState.hasMore !== undefined ? parsedState.hasMore : true);
                        setIsLoading(false);
                        setIsTotalLoading(false);
                        setIsActivatedLoading(false);
                        setIsUnactivatedLoading(false);
                        setIsQualityLoading(false);
                        return; // Skip initial fetch if we restored state
                    }
                }
            } catch (error) {
                console.error("Error restoring state:", error);
                // If there's an error, proceed with normal fetch
            }

            // If no state was restored or there was an error, fetch data independently
            fetchTotalCount();
            fetchActivatedCount();
            fetchUnMatchedCount();
            fetchQualityCount();

            // Also fetch detailed data if in expanded mode
            if (isExpanded) {
                fetchSimCards();
            } else {
                setIsLoading(false);
            }
        }

        // Save state to sessionStorage when component unmounts
        return () => {
            if (totalData.total > 0) { // Changed condition to check totalData instead of stats
                try {
                    const stateToSave = {
                        dateFilter,
                        pagination,
                        stats: {
                            total: totalData.total,
                            matched: activatedData.activated,
                            unmatched: unactivatedData.unactivated,
                            quality: qualityData.quality
                        },
                        simCards,
                        filteredSimCards,
                        hasMore,
                        isExpanded
                    };
                    sessionStorage.setItem('simStatsState', JSON.stringify(stateToSave));
                } catch (error) {
                    console.error("Error saving state:", error);
                }
            }
        };
    }, [user]); // Only run on mount/unmount and when user changes

    // Handle refreshing prop changes
    useEffect(() => {
        if (!user) return;

        if (refreshing) {
            // Clear saved state when explicitly refreshing
            sessionStorage.removeItem('simStatsState');

            // Clear cache to ensure fresh data
            simService.cache.clearForUser(user.id);

            // Reset expanded state to initial view
            setIsExpanded(false);

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
        user,
        onClose 
    }: { 
        title: string, 
        teams: Team[],
        user:User,
        onClose: () => void 
    }) => {
        const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
        const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
        const [view, setView] = useState<'teams' | 'batches' | 'users'>('teams');
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const [localDateFilter, setLocalDateFilter] = useState<{startDate: Date | null, endDate: Date | null}>({
            startDate: dateFilter.startDate,
            endDate: dateFilter.endDate
        });
        const dialog = useDialog();

        // State for hierarchical data
        const [teamStats, setTeamStats] = useState<Array<{
            id: string;
            name: string;
            leader: any;
            stats: {
                total: number;
                matched: number;
                unmatched: number;
                quality: number;
            }
        }>>([]);

        const [batchStats, setBatchStats] = useState<Array<{
            id: string;
            stats: {
                total: number;
                matched: number;
                unmatched: number;
                quality: number;
            }
        }>>([]);

        const [userStats, setUserStats] = useState<Array<{
            id: string;
            name: string;
            stats: {
                total: number;
                matched: number;
                unmatched: number;
                quality: number;
            }
        }>>([]);

        // Local now and date constants for the dialog
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        // Handle date filter change within the dialog
        const handleLocalDateFilterChange = (newFilter: {startDate: Date | null, endDate: Date | null}) => {
            setLocalDateFilter(newFilter);
        };

        // Get team name by ID
        const getTeamName = (teamId: string) => {
            const team = teams.find(t => t.id === teamId);
            return team ? team.name : 'Unknown Team';
        };

        // Get date filter strings for API
        const getDateFilterStrings = () => {
            if (!localDateFilter.startDate && !localDateFilter.endDate) return undefined;

            return {
                startDate: localDateFilter.startDate?.toISOString().split('T')[0],
                endDate: localDateFilter.endDate?.toISOString().split('T')[0]
            };
        };

        // Fetch team stats when component mounts or when date filter changes
        useEffect(() => {
            if (!user) return;

            const fetchTeamStats = async () => {
                setIsLoading(true);
                setError(null);

                try {
                    const dateFilterStrings = getDateFilterStrings();
                    const { data, error } = await simService.getTeamStats(user, dateFilterStrings);

                    if (error) throw error;
                    if (!data) throw new Error('No data returned');

                    setTeamStats(data);
                } catch (err) {
                    console.error('Error fetching team stats:', err);
                    setError('Failed to load team statistics');
                } finally {
                    setIsLoading(false);
                }
            };

            if (view === 'teams') {
                fetchTeamStats();
            }
        }, [user, view, localDateFilter]);

        // Fetch batch stats when a team is selected
        useEffect(() => {
            if (!user || !selectedTeam || view !== 'batches') return;

            const fetchBatchStats = async () => {
                setIsLoading(true);
                setError(null);

                try {
                    const dateFilterStrings = getDateFilterStrings();
                    const { data, error } = await simService.getBatchStatsForTeam(
                        selectedTeam, 
                        user, 
                        dateFilterStrings
                    );

                    if (error) throw error;
                    if (!data) throw new Error('No data returned');

                    setBatchStats(data);
                } catch (err) {
                    console.error('Error fetching batch stats:', err);
                    setError('Failed to load batch statistics');
                } finally {
                    setIsLoading(false);
                }
            };

            fetchBatchStats();
        }, [user, selectedTeam, view, localDateFilter]);

        // Fetch user stats when a batch is selected
        useEffect(() => {
            if (!user || !selectedTeam || !selectedBatch || view !== 'users') return;

            const fetchUserStats = async () => {
                setIsLoading(true);
                setError(null);

                try {
                    const dateFilterStrings = getDateFilterStrings();
                    const { data, error } = await simService.getUserStatsForBatch(
                        selectedTeam,
                        selectedBatch,
                        user,
                        dateFilterStrings
                    );

                    if (error) throw error;
                    if (!data) throw new Error('No data returned');

                    setUserStats(data);
                } catch (err) {
                    console.error('Error fetching user stats:', err);
                    setError('Failed to load user statistics');
                } finally {
                    setIsLoading(false);
                }
            };

            fetchUserStats();
        }, [user, selectedTeam, selectedBatch, view, localDateFilter]);

        // Loading indicator
        const LoadingIndicator = () => (
            <div className="flex justify-center items-center py-8">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
        );

        // Error display
        const ErrorDisplay = ({ message }: { message: string }) => (
            <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg text-center my-4">
                <AlertCircle size={24} className="text-red-500 dark:text-red-400 mx-auto mb-2" />
                <p className="text-red-600 dark:text-red-400">{message}</p>
                <button
                    onClick={() => setError(null)}
                    className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm"
                >
                    Dismiss
                </button>
            </div>
        );

        // Render teams view
        const renderTeamsView = () => (
            <div className="space-y-4 mt-4">
                <h3 className="text-lg font-semibold">Teams</h3>

                {isLoading ? (
                    <LoadingIndicator />
                ) : error ? (
                    <ErrorDisplay message={error} />
                ) : teamStats.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No teams found
                    </div>
                ) : (
                    teamStats.map(team => {
                        const nonQuality = team.stats.matched - team.stats.quality;
                        return (
                            <div 
                                key={team.id}
                                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                onClick={() => {
                                    setSelectedTeam(team.id);
                                    setView('batches');
                                }}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-medium">{team.name}</h4>
                                        <p className="text-sm text-gray-500">Total: {team.stats.total} SIM cards</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                            Quality: {team.stats.quality}
                                        </span>
                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                            Non-Quality: {nonQuality}
                                        </span>
                                    </div>
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        );

        // Render batches view
        const renderBatchesView = () => {
            if (!selectedTeam) return null;

            // Find the selected team name
            const selectedTeamName = teamStats.find(team => team.id === selectedTeam)?.name || getTeamName(selectedTeam);

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
                        <h3 className="text-lg font-semibold ml-4">{selectedTeamName} - Batches</h3>
                    </div>

                    {isLoading ? (
                        <LoadingIndicator />
                    ) : error ? (
                        <ErrorDisplay message={error} />
                    ) : batchStats.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No batches found for this team
                        </div>
                    ) : (
                        batchStats.map(batch => {
                            const nonQuality = batch.stats.matched - batch.stats.quality;
                            return (
                                <div 
                                    key={batch.id}
                                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                    onClick={() => {
                                        setSelectedBatch(batch.id);
                                        setView('users');
                                    }}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-medium">Batch: {batch.id === 'unassigned' ? 'Unassigned' : batch.id}</h4>
                                            <p className="text-sm text-gray-500">Total: {batch.stats.total} SIM cards</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                Quality: {batch.stats.quality}
                                            </span>
                                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                                Non-Quality: {nonQuality}
                                            </span>
                                        </div>
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            );
        };

        // Render users view
        const renderUsersView = () => {
            if (!selectedTeam || !selectedBatch) return null;

            // Find the selected team name
            const selectedTeamName = teamStats.find(team => team.id === selectedTeam)?.name || getTeamName(selectedTeam);

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
                            {selectedTeamName} - Batch: {selectedBatch === 'unassigned' ? 'Unassigned' : selectedBatch} - Users
                        </h3>
                    </div>

                    {isLoading ? (
                        <LoadingIndicator />
                    ) : error ? (
                        <ErrorDisplay message={error} />
                    ) : userStats.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No users found for this batch
                        </div>
                    ) : (
                        userStats.map(user => {
                            const nonQuality = user.stats.matched - user.stats.quality;
                            return (
                                <div 
                                    key={user.id}
                                    className="p-4 border rounded-lg"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-medium">{user.name}</h4>
                                            <p className="text-sm text-gray-500">Total: {user.stats.total} SIM cards</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                Quality: {user.stats.quality}
                                            </span>
                                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                                Non-Quality: {nonQuality}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
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
                        <Filter size={16} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by date:</span>
                    </div>

                    <div className="flex space-x-2">
                        <button 
                            className={`px-3 py-1 rounded-md text-sm ${localDateFilter.startDate ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200'}`}
                            onClick={() => handleLocalDateFilterChange({startDate: null, endDate: null})}
                        >
                            All Time
                        </button>
                        <button 
                            className={`px-3 py-1 rounded-md text-sm ${
                                localDateFilter.startDate?.toDateString() === startOfToday.toDateString() 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                            onClick={() => handleLocalDateFilterChange({startDate: startOfToday, endDate: now})}
                        >
                            Today
                        </button>
                        <button 
                            className={`px-3 py-1 rounded-md text-sm ${
                                localDateFilter.startDate?.toDateString() === startOfWeek.toDateString() 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                            onClick={() => handleLocalDateFilterChange({startDate: startOfWeek, endDate: now})}
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
                                                        defaultValue={localDateFilter.startDate?.toISOString().split('T')[0]}
                                                        id="dialog-start-date-input"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                                    <input 
                                                        type="date" 
                                                        className="w-full p-2 border rounded-md"
                                                        defaultValue={localDateFilter.endDate?.toISOString().split('T')[0]}
                                                        id="dialog-end-date-input"
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
                                                        const startDateInput = document.getElementById('dialog-start-date-input') as HTMLInputElement;
                                                        const endDateInput = document.getElementById('dialog-end-date-input') as HTMLInputElement;

                                                        const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
                                                        const endDate = endDateInput.value ? new Date(endDateInput.value) : null;

                                                        if (endDate) {
                                                            // Set end date to end of day
                                                            endDate.setHours(23, 59, 59, 999);
                                                        }

                                                        handleLocalDateFilterChange({startDate, endDate});
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

                    {localDateFilter.startDate && (
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                            <Calendar size={14} className="mr-1" />
                            <span>
                                {localDateFilter.startDate.toLocaleDateString()} - {localDateFilter.endDate?.toLocaleDateString() || 'Present'}
                            </span>
                        </div>
                    )}
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
            value: totalData.total,
            todayValue: totalStats.today,
            weekValue: totalStats.thisWeek,
            color: "blue",
            icon: <BarChart size={18}/>,
            isLoading: isTotalLoading,
            expandable: true,
            onExpandClick: () => {
                const dialogRef = dialog.create({
                    content: (
                        <TeamBreakdownDialog
                            user={user!}
                            title="Total SIM Cards Breakdown"
                            teams={teams}
                            onClose={() => dialogRef.dismiss()}
                        />
                    ),
                    size: "lg",
                    design: ["scrollable"]
                });
            }
        },
        {
            title: "Activated",
            value: activatedData.activated,
            todayValue: matchedStats.today,
            weekValue: matchedStats.thisWeek,
            percentage: matchedPercent,
            color: "green",
            icon: <CheckCircle size={20}/>,
            isLoading: isActivatedLoading,
            expandable: true,
            onExpandClick: () => {
                const dialogRef = dialog.create({
                    content: (
                        <TeamBreakdownDialog
                            title="Activated SIM Cards Breakdown"
                            teams={teams}
                            user={user!}
                            onClose={() => dialogRef.dismiss()}
                        />
                    ),
                    size: "lg",
                    design: ["scrollable"]
                });
            }
        },
        {
            title: "UnMatched",
            value: unactivatedData.unactivated,
            todayValue: unmatchedStats.today,
            weekValue: unmatchedStats.thisWeek,
            percentage: unmatchedPercent,
            color: "red",
            icon: <XCircle size={20}/>,
            isLoading: isUnactivatedLoading,
            expandable: true,
            onExpandClick: () => {
                const dialogRef = dialog.create({
                    content: (
                        <TeamBreakdownDialog
                            user={user!}
                            title="Unmatched SIM Cards Breakdown"
                            teams={teams}
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
            value: qualityData.quality,
            todayValue: qualityStats.today,
            weekValue: qualityStats.thisWeek,
            percentage: qualityPercent,
            color: "purple",
            icon: <Award size={20}/>,
            isLoading: isQualityLoading,
            expandable: true,
            onExpandClick: () => {
                const dialogRef = dialog.create({
                    content: (
                        <TeamBreakdownDialog
                            user={user!}
                            title="Quality SIM Cards Breakdown"
                            teams={teams}
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

            {isExpanded && <DateFilterBar />}

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
                            // description={card.description}
                            expandable={card.expandable}
                            onExpandClick={card.onExpandClick}
                        />
                    ))
                )}
            </div>

            {/* Data loading status and View More button */}
            {!isLoading && (
                <div className="mt-4 mb-8 text-center">
                    {isExpanded && simCards.length > 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Showing {simCards.length} of {stats.total} SIM cards
                        </div>
                    )}

                    <button
                        onClick={loadMoreSimCards}
                        disabled={isLoadingMore}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                        {isLoadingMore ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                Loading...
                            </>
                        ) : !isExpanded ? (
                            <>
                                View Details
                            </>
                        ) : hasMore ? (
                            <>
                                Load More
                            </>
                        ) : (
                            <>
                                All Data Loaded
                            </>
                        )}
                    </button>

                    {isExpanded && !hasMore && simCards.length < stats.total && (
                        <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                            <AlertCircle size={16} className="inline mr-1" />
                            Not all records are loaded. Use filters to narrow down results for better performance.
                        </div>
                    )}
                </div>
            )}
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
                      isLoading = false,
                      todayValue = 0,
                      weekValue = 0,
                      icon, 
                      onExpandClick,
                      expandable = false
                  }: {
    title: string;
    value: number;
    weekValue?: number;
    todayValue?: number;
    percentage?: number;
    color: "blue" | "green" | "red" | "purple";
    isRefreshing: boolean;
    isLoading?: boolean;
    icon: React.ReactNode;
    onExpandClick?: () => void;
    description?: string;
    expandable?: boolean;
}) {
    const [prevValue, setPrevValue] = useState(value);
    const [prevTodayValue, setPrevTodayValue] = useState(todayValue);
    const [prevWeekValue, setPrevWeekValue] = useState(weekValue);
    const [isAnimating, setIsAnimating] = useState(false);
    const [activeTab, setActiveTab] = useState<'total' | 'today'>('today'); // Default to today

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
            default:
                return todayValue;
        }
    };

    const getActiveTrend = () => {
        switch (activeTab) {
            case 'total':
                return null; // No trend for total
            case 'today':
            default:
                return todayVsWeekTrend;
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

            {/* Tabs for switching between total and today */}
            <div className="grid grid-cols-2 mb-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    className={`px-3 py-1 text-xs font-medium rounded-t-md w-full text-center ${
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
                    className={`px-3 py-1 text-xs font-medium rounded-t-md w-full text-center ${
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
                        {isRefreshing || isLoading ? (
                            <span className="inline-block w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                        ) : getActiveValue().toLocaleString()}
                    </p>

                    {/* Trend indicator */}
                    {!isRefreshing && !isLoading && activeTrend !== null && (
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

                {/*{activeTab === 'week' && (*/}
                {/*    <p className="text-xs text-gray-500 mt-1">*/}
                {/*        {weekVsTotalTrend >= 0 */}
                {/*            ? `${weekVsTotalTrend}% above` */}
                {/*            : `${Math.abs(weekVsTotalTrend)}% below`} weekly average*/}
                {/*    </p>*/}
                {/*)}*/}
            </div>

            {/* View More / Expand Section */}
            {expandable && (
                <div className="pt-2 text-center border-t border-gray-200 dark:border-gray-700">
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
