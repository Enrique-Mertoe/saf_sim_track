import {Team, User} from "@/models";
import simService from "@/services/simService";
import {AlertCircle, Calendar, ChevronUp, Filter, RefreshCw, X,} from "lucide-react";
import {useEffect, useState} from "react";
import {showModal} from "@/ui/shortcuts";
import TeamStats from "@/app/dashboard/components/TeamStats";
import BatchStats from "@/app/dashboard/components/BatchStats";
import UserStats from "@/app/dashboard/components/UserStats";
import {teamService} from "@/services";

const TeamBreakdownDialog = ({
                                 title,
                                 teams,
                                 user,
                                 onClose,
                                 dataType
                             }: {
    title: string,
    teams: Team[],
    user: User,
    dataType: string;
    onClose: () => void
}) => {
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
    const [view, setView] = useState<'teams' | 'batches' | 'users'>('teams');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [localDateFilter, setLocalDateFilter] = useState<{ startDate: Date | null, endDate: Date | null }>({
        startDate: null,
        endDate: null
    });

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
    const handleLocalDateFilterChange = (newFilter: { startDate: Date | null, endDate: Date | null }) => {
        setLocalDateFilter(newFilter);

        // Reset view state to force reload of data with new date filter
        setViewState({
            teams: { loaded: false },
            batches: { loaded: false, teamId: null },
            users: { loaded: false, teamId: null, batchId: null }
        });
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

    // State for preserving view data to prevent frequent loading
    const [viewState, setViewState] = useState({
        teams: { loaded: false },
        batches: { loaded: false, teamId: null },
        users: { loaded: false, teamId: null, batchId: null }
    });

    // Fetch team stats when component mounts or when date filter changes
    useEffect(() => {
        if (!user) return;

        const fetchTeamStats = async () => {
            // If we already have team data and the view hasn't changed, don't reload
            if (viewState.teams.loaded && view === 'teams') {
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const {data, error} = await teamService.getAllTeams(user);

                if (error) throw error;
                if (!data) throw new Error('No data returned');

                setTeamStats(data);
                // Update view state to indicate teams data is loaded
                setViewState(prev => ({
                    ...prev,
                    teams: { loaded: true }
                }));
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
    }, [user, view, localDateFilter, viewState.teams.loaded]);

    // Fetch batch stats when a team is selected
    useEffect(() => {
        if (!user || !selectedTeam || view !== 'batches') return;

        const fetchBatchStats = async () => {
            // If we already have batch data for this team and the view hasn't changed, don't reload
            if (viewState.batches.loaded && viewState.batches.teamId === selectedTeam) {
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const dateFilterStrings = getDateFilterStrings();
                const {data, error} = await simService.getBatchStatsForTeam(
                    selectedTeam,
                    user,
                    dateFilterStrings
                );

                if (error) throw error;
                if (!data) throw new Error('No data returned');

                setBatchStats(data);
                // Update view state to indicate batches data is loaded for this team
                // @ts-ignore
                setViewState(prev => ({
                    ...prev,
                    batches: { loaded: true, teamId: selectedTeam }
                }));
            } catch (err) {
                console.error('Error fetching batch stats:', err);
                setError('Failed to load batch statistics');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBatchStats();
    }, [user, selectedTeam, view, localDateFilter, viewState.batches.loaded, viewState.batches.teamId]);

    // Fetch user stats when a batch is selected
    useEffect(() => {
        if (!user || !selectedTeam || !selectedBatch || view !== 'users') return;

        const fetchUserStats = async () => {
            // If we already have user data for this team and batch and the view hasn't changed, don't reload
            if (viewState.users.loaded && 
                viewState.users.teamId === selectedTeam && 
                viewState.users.batchId === selectedBatch) {
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const dateFilterStrings = getDateFilterStrings();
                const {data, error} = await simService.getUserStatsForBatch(
                    selectedTeam,
                    selectedBatch,
                    user,
                    dateFilterStrings
                );

                if (error) throw error;
                if (!data) throw new Error('No data returned');

                setUserStats(data);
                // Update view state to indicate users data is loaded for this team and batch
                // @ts-ignore
                setViewState(prev => ({
                    ...prev,
                    users: { loaded: true, teamId: selectedTeam, batchId: selectedBatch }
                }));
            } catch (err) {
                console.error('Error fetching user stats:', err);
                setError('Failed to load user statistics');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserStats();
    }, [user, selectedTeam, selectedBatch, view, localDateFilter, 
        viewState.users.loaded, viewState.users.teamId, viewState.users.batchId]);

    // Loading indicator
    const LoadingIndicator = () => (
        <div className="flex justify-center items-center py-8">
            <RefreshCw size={24} className="animate-spin text-blue-500"/>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
    );

    // Error display
    const ErrorDisplay = ({message}: { message: string }) => (
        <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg text-center my-4">
            <AlertCircle size={24} className="text-red-500 dark:text-red-400 mx-auto mb-2"/>
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
                <LoadingIndicator/>
            ) : error ? (
                <ErrorDisplay message={error}/>
            ) : teamStats.length === 0 ? (
                <div className="text-center py-8  text-gray-500 dark:text-gray-400">
                    No teams found
                </div>
            ) : (
                <div className={"grid gap-2 sm:grid-cols-2"}>
                    {
                        teamStats.map(team => {
                            // const nonQuality = team.stats.matched - team.stats.quality;
                            return (
                                <TeamStats localDateFilter={localDateFilter} setView={setView} setSelectedTeam={setSelectedTeam} dataType={dataType} user={user} team={team} key={team.id}/>
                            );
                        })
                    }
                </div>
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
                        <ChevronUp size={16} className="mr-1"/>
                        Back to Teams
                    </button>
                    <h3 className="text-lg font-semibold ml-4">{selectedTeamName} - Batches</h3>
                </div>

                {isLoading ? (
                    <LoadingIndicator/>
                ) : error ? (
                    <ErrorDisplay message={error}/>
                ) : batchStats.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No batches found for this team
                    </div>
                ) : (
                    <div className={"grid gap-2"}>
                        {
                            batchStats.map(batch => {
                                return (
                                    <BatchStats 
                                        key={batch.id}
                                        batch={batch} 
                                        user={user} 
                                        dataType={dataType} 
                                        selectedTeam={selectedTeam}
                                        setSelectedBatch={setSelectedBatch} 
                                        setView={setView} 
                                        localDateFilter={localDateFilter}
                                    />
                                );
                            })
                        }
                    </div>
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
                        <ChevronUp size={16} className="mr-1"/>
                        Back to Batches
                    </button>
                    <h3 className="text-lg font-semibold ml-4">
                        {selectedTeamName} -
                        Batch: {selectedBatch === 'unassigned' ? 'Unassigned' : selectedBatch} - Users
                    </h3>
                </div>

                {isLoading ? (
                    <LoadingIndicator/>
                ) : error ? (
                    <ErrorDisplay message={error}/>
                ) : userStats.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No users found for this batch
                    </div>
                ) : (
                    <div className={"grid gap-2 sm:grid-cols-2"}>
                        {
                            userStats.map(userData => {
                                return (
                                    <UserStats 
                                        key={userData.id}
                                        userData={userData} 
                                        user={user} 
                                        dataType={dataType} 
                                        selectedTeam={selectedTeam}
                                        selectedBatch={selectedBatch}
                                        localDateFilter={localDateFilter}
                                    />
                                );
                            })
                        }
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
                    <X size={20}/>
                </button>
            </div>

            <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                    <Filter size={16} className="text-gray-500"/>
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
                            showModal({
                                content: onClose => (
                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold mb-4">Select Date Range</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label
                                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start
                                                    Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full p-2 border rounded-md"
                                                    defaultValue={localDateFilter.startDate?.toISOString().split('T')[0]}
                                                    id="dialog-start-date-input"
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End
                                                    Date</label>
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
                                                onClick={() => onClose()}
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
                                                    onClose();
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
                        <Calendar size={14} className="mr-1"/>
                        Custom
                    </button>
                </div>

                {localDateFilter.startDate && (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Calendar size={14} className="mr-1"/>
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

export default TeamBreakdownDialog
