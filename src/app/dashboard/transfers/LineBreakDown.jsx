import {useEffect, useState} from "react";
import {AlertCircle, ChevronUp, RefreshCw} from "lucide-react";
import simService from "@/services/simService";
import {SIMStatus} from "@/models";
import {buildWave, currentWave} from "@/helper";
import {batchMetadataService, teamService} from "@/services";

export default function LineBreakDown({user, dateRange}) {
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [view, setView] = useState('teams');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [localDateFilter, setLocalDateFilter] = useState({
        startDate: null,
        endDate: null
    });

    // State for hierarchical data
    const [teamStats, setTeamStats] = useState([]);
    const [batchStats, setBatchStats] = useState([]);
    const [userStats, setUserStats] = useState([]);

    // Get team name by ID
    const getTeamName = (teamId) => {
        const team = teamStats.find(t => t.id === teamId);
        return team ? team.name : 'Unknown Team';
    };

    // State for preserving view data to prevent frequent loading
    const [viewState, setViewState] = useState({
        teams: {loaded: false},
        batches: {loaded: false, teamId: null},
        users: {loaded: false, teamId: null, batchId: null}
    });

    // Fetch team stats when component mounts or when date filter changes
    useEffect(() => {
        const fetchTeamStats = async () => {
            if (!user)
                return
            // If we already have team data and the view hasn't changed, don't reload
            if (viewState.teams.loaded && view === 'teams') {
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const {data, error} = await teamService.teams(user)

                if (error) throw error;
                if (!data) throw new Error('No data returned');

                setTeamStats(data);
                // Update view state to indicate teams data is loaded
                setViewState(prev => ({
                    ...prev,
                    teams: {loaded: true}
                }));
            } catch (err) {
                console.error('Error fetching team stats:', err);
                setError('Failed to load team statistics');
            } finally {
                setIsLoading(false);
            }
        };

        if (view === 'teams') {
            fetchTeamStats().then();
        }
    }, [view, localDateFilter, viewState.teams.loaded, user]);

    // Fetch batch stats when a team is selected
    useEffect(() => {
        if (!selectedTeam || view !== 'batches') return;

        const fetchBatchStats = async () => {
            // If we already have batch data for this team and the view hasn't changed, don't reload
            if (viewState.batches.loaded && viewState.batches.teamId === selectedTeam) {
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const {data, error} = await simService.getBatchStatsForTeam(
                    selectedTeam,
                    user,
                    // {
                    //     startDate: localDateFilter.startDate?.toISOString().split('T')[0],
                    //     endDate: localDateFilter.endDate?.toISOString().split('T')[0]
                    // }
                    dateRange
                );

                let batches = await new Promise(async resolve => {
                    const cw = currentWave(dateRange.startDate, dateRange.endDate)
                    const sims = [];
                    await simService.streamChunks(user, (chunk, end) => {
                        sims.push(...chunk);
                        if (end)
                            resolve(sims);
                    }, {
                        filters: [
                            ["team_id", selectedTeam],
                            buildWave(cw.start, cw.end)
                        ]
                    })
                });

                // group to batches
                batches = batches.reduce((acc, sim) => {
                    const key = sim.batch_id || 'BATCH-UNKNOWN';
                    if (!acc[key]) {
                        acc[key] = [];
                    }
                    acc[key].push(sim);
                    return acc;
                }, {});
                setBatchStats(batches);
                // Update view state to indicate batches data is loaded for this team
                setViewState(prev => ({
                    ...prev,
                    batches: {loaded: true, teamId: selectedTeam}
                }));
            } catch (err) {
                console.error('Error fetching batch stats:', err);
                setError('Failed to load batch statistics');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBatchStats();
    }, [selectedTeam, view, localDateFilter, viewState.batches.loaded, viewState.batches.teamId, user]);

    // Fetch user stats when a batch is selected
    useEffect(() => {
        if (!selectedTeam || !selectedBatch || view !== 'users') return;

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
                // const dateFilterStrings = getDateFilterStrings();

                const {data, error} = await simService.getUserStatsForBatch(
                    selectedTeam,
                    selectedBatch,
                    user,
                    dateRange
                );

                if (error) throw error;
                if (!data) throw new Error('No data returned');

                setUserStats(data);
                // Update view state to indicate users data is loaded for this team and batch
                setViewState(prev => ({
                    ...prev,
                    users: {loaded: true, teamId: selectedTeam, batchId: selectedBatch}
                }));
            } catch (err) {
                console.error('Error fetching user stats:', err);
                setError('Failed to load user statistics');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserStats();
    }, [selectedTeam, selectedBatch, view, localDateFilter,
        viewState.users.loaded, viewState.users.teamId, viewState.users.batchId, user]);


    // Loading indicator
    const LoadingIndicator = () => (
        <div className="flex justify-center items-center py-8">
            <RefreshCw size={24} className="animate-spin text-blue-500"/>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
    );

    // Error display
    const ErrorDisplay = ({message}) => (
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


    // Batch Card Component


    // User Card Component
    const UserCard = ({userData}) => {
        const completionRate = userData.stats?.total > 0 ? (userData.stats.registered / userData.stats.total) * 100 : 0;

        return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{userData.name}</h4>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 dark:text-amber-200
                               dark:bg-amber-900 px-2 py-1 rounded">
                    {Math.round(completionRate)}%
                </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Total</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{userData.stats?.total || 0}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Registered</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{userData.stats?.registered || 0}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Unmatched</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{userData.stats?.unmatched || 0}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Quality</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{userData.stats?.quality || 0}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Render teams view
    const renderTeamsView = () => (
        <div className="space-y-4 mt-4">
            <h3 className="text-lg font-semibold">Teams</h3>

            {isLoading ? (
                <LoadingIndicator/>
            ) : error ? (
                <ErrorDisplay message={error}/>
            ) : teamStats.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No teams found
                </div>
            ) : (
                <div className="grid gap-2 sm:grid-cols-4">
                    {teamStats.map(team => (
                        <TeamCard dateRange={dateRange} setSelectedTeam={setSelectedTeam} setView={setView}
                                  key={team.id} user={user}
                                  team={team}/>
                    ))}
                </div>
            )}
        </div>
    );

    // Render batches view
    const renderBatchesView = () => {
        if (!selectedTeam) return null;

        // Find the selected team name
        const selectedTeamName = getTeamName(selectedTeam);

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
                    <div className="grid sm:grid-cols-2 gap-2">
                        {Object.entries(batchStats).map(([batch, sims]) => (
                            <BatchCard key={batch} team={selectedTeam} user={user}
                                       setSelectedBatch={setSelectedBatch} setView={setView} sims={sims || []}
                                       batch={batch}/>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Render users view
    const renderUsersView = () => {
        if (!selectedTeam || !selectedBatch) return null;

        // Find the selected team name
        const selectedTeamName = getTeamName(selectedTeam);

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
                    <div className="grid gap-2 sm:grid-cols-2">
                        {userStats.map(userData => (
                            <UserCard key={userData.id} userData={userData}/>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className=" px-6">
            {view === 'teams' && renderTeamsView()}
            {view === 'batches' && renderBatchesView()}
            {view === 'users' && renderUsersView()}
        </div>
    );
}

// Team Card Component
const TeamCard = ({team, user, dateRange, setSelectedTeam, setView}) => {
    const [stats, sSt] = useState({total: 0, assigned: 0})
    const [isLoading, setIsLoading] = useState(true)

    const completionRate = stats.total > 0 ? (stats.assigned / stats.total) * 100 : 0

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !team.id) return
            // setIsLoading(true)
            // const dateConditions = [];
            // if (dateRange && dateRange.startDate) {
            //     dateConditions.push(["created_at", "gte", dateRange.startDate]);
            // }
            // if (dateRange && dateRange.endDate) {
            //     dateConditions.push(["created_at", "lte", dateRange.endDate]);
            // }
            const cw = currentWave(dateRange.startDate, dateRange.endDate)
            const wave = buildWave(cw.start, cw.end)
            const [v1, v2, v3] = await Promise.all([
                simService.countAll(user, [
                    ["team_id", team.id],
                    wave
                    // ...(dateConditions || [])
                ]),
                simService.countAll(user, [
                    ["assigned_to_user_id", "not", "is", null],
                    ["team_id", team.id],
                    // ...(dateConditions || [])
                    wave
                ]),
                simService.countAll(user, [
                    ["activation_date", "not", "is", null],
                    ["status", SIMStatus.ACTIVATED],
                    ["team_id", team.id],
                    // ...(dateConditions || [])
                    wave
                ]),
            ])
            sSt({
                total: v1.count ?? 0,
                assigned: v2.count ?? 0,
                sold: v3.count ?? 0,
            })
            setIsLoading(false)
        }
        fetchData().then()
    }, [user, dateRange]);


    return (
        <div
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4
                       hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
                setSelectedTeam(team.id);
                setView('batches');
            }}
        >
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">{team.name}</h4>
                {isLoading ? (
                    <div className="h-5 w-12 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                ) : (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 dark:text-amber-200
                                   dark:bg-amber-900 px-2 py-1 rounded">
                        {Math.round(completionRate)}%
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Total</p>
                    {isLoading ? (
                        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    ) : (
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{stats.total}</p>
                    )}
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Assigned</p>
                    {isLoading ? (
                        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    ) : (
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{stats.assigned}</p>
                    )}
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Pending</p>
                    {isLoading ? (
                        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    ) : (
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{stats.total - stats.assigned}</p>
                    )}
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Stock</p>
                    {isLoading ? (
                        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    ) : (
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{stats.total - stats.sold}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
const BatchCard = ({batch, sims, setSelectedBatch, setView, user, team}) => {
    const [id, setId] = useState(null)
    const [isLoading, setIsLoading] = useState(!user || !id)
    const assigned = sims.filter(s => s.assigned_to_user_id != null)?.length;
    const total = sims.length;
    const sold = sims.filter(s => s.activation_date != null).length;
    const completionRate = total > 0 ? (assigned / total) * 100 : 0;

    // getbach metadata
    useEffect(() => {
        batchMetadataService.batchInfo(batch).then(({data: res}) => {
            if (res) {
                setId(res?.[0]?.id)
                setIsLoading(false)
            }
        })
    }, [])


    return (
        <div
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4
                       hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
                setSelectedBatch(id);
                setView('users');
            }}
        >
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {/*{id === 'unassigned' ? 'Unassigned' : id}*/}
                    {batch}
                </h4>
                {isLoading ? (
                    <div className="h-5 w-12 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                ) : (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 dark:text-amber-200
                                   dark:bg-amber-900 px-2 py-1 rounded">
                        {Math.round(completionRate)}%
                    </span>
                )}
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Total</p>
                    {isLoading ? (
                        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    ) : (
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{total}</p>
                    )}
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Assigned</p>
                    {isLoading ? (
                        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    ) : (
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{assigned}</p>
                    )}
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Pending</p>
                    {isLoading ? (
                        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    ) : (
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{total - assigned}</p>
                    )}
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Stock</p>
                    {isLoading ? (
                        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    ) : (
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{total - sold}</p>
                    )}
                </div>
            </div>
        </div>
    );
}