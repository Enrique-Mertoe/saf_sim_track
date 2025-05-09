// hooks/useFirestoreData.ts
'use client';

import {useEffect, useState} from 'react';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    where
} from 'firebase/firestore';
import {db} from '@/lib/firebase/client';
import {PendingApproval, SalesData, SimCard, Team, TeamPerformance, User} from '@/types';
import {useAuth} from "@/contexts/AuthContext";
import {simCardService, teamService} from "@/services";
import {SIMStatus} from "@/models";
import dayjs from 'dayjs';

// Hook to get all teams
const useTeams = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const teamsQuery = query(
                    collection(db, 'teams'),
                    orderBy('name')
                );

                const unsubscribe = onSnapshot(teamsQuery, (snapshot) => {
                    const teamsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Team));

                    setTeams(teamsData);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (err) {
                console.error('Error fetching teams:', err);
                setError('Failed to load teams');
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    return {teams, loading, error};
};

// Hook to get team members
const useTeamMembers = (teamId?: string) => {
    const [members, setMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!teamId) {
            setMembers([]);
            setLoading(false);
            return;
        }

        const fetchTeamMembers = async () => {
            try {
                const membersQuery = query(
                    collection(db, 'users'),
                    where('teamId', '==', teamId),
                    orderBy('sales', 'desc')
                );

                const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
                    const membersData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as User));

                    setMembers(membersData);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (err) {
                console.error('Error fetching team members:', err);
                setError('Failed to load team members');
                setLoading(false);
            }
        };

        fetchTeamMembers();
    }, [teamId]);

    return {members, loading, error};
};

// Hook to get recent SIM registrations
const useRecentSims = (teamId?: string, agentId?: string, limit = 10) => {
    const [sims, setSims] = useState<SimCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSims = async () => {
            try {
                let simsQuery;

                if (agentId) {
                    // Get sims for specific agent
                    simsQuery = query(
                        collection(db, 'sims'),
                        where('agentId', '==', agentId),
                        orderBy('date', 'desc'),
                        limit(limit)
                    );
                } else if (teamId) {
                    // Get sims for team
                    simsQuery = query(
                        collection(db, 'sims'),
                        where('teamId', '==', teamId),
                        orderBy('date', 'desc'),
                        limit(limit)
                    );
                } else {
                    // Get all sims (for admin)
                    simsQuery = query(
                        collection(db, 'sims'),
                        orderBy('date', 'desc'),
                        limit(limit)
                    );
                }

                const unsubscribe = onSnapshot(simsQuery, (snapshot) => {
                    const simsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as SimCard));

                    setSims(simsData);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (err) {
                console.error('Error fetching SIMs:', err);
                setError('Failed to load SIM registrations');
                setLoading(false);
            }
        };

        fetchSims();
    }, [teamId, agentId, limit]);

    return {sims, loading, error};
};

// Hook to get pending approvals (for admin)
const usePendingApprovals = () => {
    const [approvals, setApprovals] = useState<PendingApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchApprovals = async () => {
            try {
                const approvalsQuery = query(
                    collection(db, 'approvals'),
                    where('status', '==', 'pending'),
                    orderBy('requestDate', 'desc')
                );

                const unsubscribe = onSnapshot(approvalsQuery, (snapshot) => {
                    const approvalsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as PendingApproval));

                    setApprovals(approvalsData);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (err) {
                console.error('Error fetching approvals:', err);
                setError('Failed to load pending approvals');
                setLoading(false);
            }
        };

        fetchApprovals();
    }, []);

    return {approvals, loading, error};
};

// Hook to get team performance data
const useTeamPerformance = () => {
    const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeamPerformance = async () => {
            try {
                // First get all teams
                const teamsQuery = query(collection(db, 'teams'));
                const teamsSnapshot = await getDocs(teamsQuery);

                // For each team, get their sales data
                const teamsWithPerformance = await Promise.all(
                    teamsSnapshot.docs.map(async (teamDoc) => {
                        const team = {id: teamDoc.id, ...teamDoc.data()} as Team;

                        // Get total sales for team
                        const simsQuery = query(
                            collection(db, 'sims'),
                            where('teamId', '==', team.id),
                            where('date', '>=', Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() - 30))))
                        );

                        const simsSnapshot = await getDocs(simsQuery);
                        const sales = simsSnapshot.size;

                        // Calculate activation rate
                        const activeSimsQuery = query(
                            collection(db, 'sims'),
                            where('teamId', '==', team.id),
                            where('status', '==', 'Active'),
                            where('date', '>=', Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() - 30))))
                        );

                        const activeSimsSnapshot = await getDocs(activeSimsQuery);
                        const activationRate = simsSnapshot.size > 0
                            ? Math.round((activeSimsSnapshot.size / simsSnapshot.size) * 100)
                            : 0;

                        return {
                            ...team,
                            sales,
                            target: team.target || 3000, // Default target
                            activationRate
                        } as TeamPerformance;
                    })
                );

                setTeamPerformance(teamsWithPerformance);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching team performance:', err);
                setError('Failed to load team performance data');
                setLoading(false);
            }
        };

        fetchTeamPerformance();
    }, []);

    return {teamPerformance, loading, error};
};

const useSalesTrend = (teamId?: string, userId?: string, months = 5) => {
    const [salesData, setSalesData] = useState<SalesData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSalesTrend = async () => {
            try {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const currentDate = dayjs();
                const salesByMonth: SalesData[] = [];

                for (let i = 0; i < months; i++) {
                    const targetMonth = currentDate.subtract(i, 'month');
                    const fromDate = targetMonth.startOf('month').format('YYYY-MM-DD');
                    const toDate = targetMonth.endOf('month').format('YYYY-MM-DD');

                    const {count, error} = await simCardService.searchSimCards({
                        fromDate,
                        toDate,
                        teamId: userId ? undefined : teamId,
                        searchTerm: '',
                        page: 1,
                        pageSize: 1,
                    });

                    // If filtering by user, filter manually after fetching full data
                    let actualCount = count || 0;
                    if (userId) {
                        const {data} = await simCardService.searchSimCards({
                            fromDate,
                            toDate,
                            searchTerm: '',
                            page: 1,
                            pageSize: 1000, // Adjust based on your expected max
                            teamId: teamId || undefined,
                        });

                        actualCount = data?.filter((sim: any) => sim.sold_by_user_id === userId).length || 0;
                    }

                    salesByMonth.unshift({
                        month: monthNames[targetMonth.month()],
                        sales: actualCount * 1000,
                    });
                }

                setSalesData(salesByMonth);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching sales trend:', err);
                setError('Failed to load sales trend data');
                setLoading(false);
            }
        };

        fetchSalesTrend().then();
    }, [teamId, userId, months]);

    return {salesData, loading, error};
};

// Hook to get offline queue data
const useOfflineQueue = (userId: string) => {
    const [offlineSims, setOfflineSims] = useState<SimCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setOfflineSims([]);
            setLoading(false);
            return;
        }

        const fetchOfflineQueue = async () => {
            try {
                const offlineQuery = query(
                    collection(db, 'sims'),
                    where('agentId', '==', userId),
                    where('isOffline', '==', true)
                );

                const unsubscribe = onSnapshot(offlineQuery, (snapshot) => {
                    const offlineData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as SimCard));

                    setOfflineSims(offlineData);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (err) {
                console.error('Error fetching offline queue:', err);
                setError('Failed to load offline queue');
                setLoading(false);
            }
        };

        fetchOfflineQueue();
    }, [userId]);

    return {offlineSims, loading, error};
};

// Hook to get user performance metrics
const useUserPerformance = (userId: string) => {
    const [performance, setPerformance] = useState<{
        salesTarget: number;
        currentSales: number;
        activationRate: number;
        topUpConversion: number;
        isTopPerformer: boolean;
    }>({
        salesTarget: 150,
        currentSales: 0,
        activationRate: 0,
        topUpConversion: 0,
        isTopPerformer: false
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchUserPerformance = async () => {
            try {
                // Get user data
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    setError('User not found');
                    setLoading(false);
                    return;
                }

                const userData = userSnap.data();
                const teamId = userData.teamId;

                // Get current month's SIM registrations
                const currentDate = new Date();
                const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

                const simsQuery = query(
                    collection(db, 'sims'),
                    where('agentId', '==', userId),
                    where('date', '>=', Timestamp.fromDate(monthStart))
                );

                const simsSnapshot = await getDocs(simsQuery);
                const currentSales = simsSnapshot.size;

                // Calculate activation rate
                const activeSimsQuery = query(
                    collection(db, 'sims'),
                    where('agentId', '==', userId),
                    where('status', '==', 'Active'),
                    where('date', '>=', Timestamp.fromDate(monthStart))
                );

                const activeSimsSnapshot = await getDocs(activeSimsQuery);
                const activationRate = simsSnapshot.size > 0
                    ? Math.round((activeSimsSnapshot.size / simsSnapshot.size) * 100)
                    : 0;

                // Calculate top-up conversion (simplified)
                const topUpConversion = Math.floor(Math.random() * (90 - 75 + 1)) + 75; // Simulated value

                // Check if top performer in team
                let isTopPerformer = false;

                if (teamId) {
                    const teamMembersQuery = query(
                        collection(db, 'users'),
                        where('teamId', '==', teamId)
                    );

                    const teamMembersSnapshot = await getDocs(teamMembersQuery);
                    const teamMembers = teamMembersSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as User));

                    // Check all members' performance
                    let maxSales = currentSales;

                    for (const member of teamMembers) {
                        if (member.id === userId) continue;

                        const memberSimsQuery = query(
                            collection(db, 'sims'),
                            where('agentId', '==', member.id),
                            where('date', '>=', Timestamp.fromDate(monthStart))
                        );

                        const memberSimsSnapshot = await getDocs(memberSimsQuery);

                        if (memberSimsSnapshot.size > maxSales) {
                            maxSales = memberSimsSnapshot.size;
                            isTopPerformer = false;
                        } else {
                            isTopPerformer = true;
                        }
                    }
                }

                setPerformance({
                    salesTarget: 150, // Fixed target for demo
                    currentSales,
                    activationRate,
                    topUpConversion,
                    isTopPerformer
                });

                setLoading(false);
            } catch (err) {
                console.error('Error fetching user performance:', err);
                setError('Failed to load performance data');
                setLoading(false);
            }
        };

        fetchUserPerformance();
    }, [userId]);

    return {performance, loading, error};
};

const useDashboardSummary = (userRole?: string, teamId?: string) => {
    const [summary, setSummary] = useState({
        totalSims: 0,
        activationRate: 0,
        teams: 0,
        fraudAlerts: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                // Early exit for unsupported roles
                if (userRole !== 'admin' && !(userRole === 'teamLeader' && teamId)) {
                    setSummary({
                        totalSims: 0,
                        activationRate: 0,
                        teams: 0,
                        fraudAlerts: 0
                    });
                    setLoading(false);
                    return;
                }

                // Shared filters
                const filters = userRole === 'teamLeader' ? {teamId} : {};

                // Get total SIMs
                const totalRes = await simCardService.searchSimCards({
                    ...filters,
                    pageSize: 1, // we only care about count
                    page: 1
                });
                const totalSims = totalRes.count || 0;

                // Get active SIMs
                const activeRes = await simCardService.searchSimCards({
                    ...filters,
                    status: SIMStatus.ACTIVATED,
                    pageSize: 1,
                    page: 1
                });
                const activeSims = activeRes.count || 0;

                const activationRate = totalSims > 0
                    ? Math.round((activeSims / totalSims) * 100)
                    : 0;

                // Get fraud alerts
                const fraudRes = await simCardService.searchSimCards({
                    ...filters,
                    status: SIMStatus.FLAGGED,
                    pageSize: 1,
                    page: 1
                });
                const fraudAlerts = fraudRes.count || 0;

                // Get team count (admin only)
                let teamCount = 0;
                if (userRole === 'admin') {

                    teamCount = await teamService.count();
                } else if (userRole === 'teamLeader') {
                    teamCount = 1;
                }

                setSummary({
                    totalSims,
                    activationRate,
                    teams: teamCount,
                    fraudAlerts
                });

                setLoading(false);
            } catch (err) {
                console.error('Dashboard summary error:', err);
                setError('Failed to load dashboard summary');
                setLoading(false);
            }
        };

        fetchSummary().then();
    }, [userRole, teamId]);

    return {summary, loading, error};
};
// Hook to get dashboard summary metrics
// const useDashboardSummary = (userRole: string, teamId?: string) => {
//     const [summary, setSummary] = useState({
//         totalSims: 0,
//         activationRate: 0,
//         teams: 0,
//         fraudAlerts: 0
//     });
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//
//     useEffect(() => {
//         const fetchSummary = async () => {
//             try {
//                 let simsQuery;
//
//                 // Get total SIMs based on role
//                 if (userRole === 'admin') {
//                     simsQuery = collection(db, 'sims');
//                 } else if (userRole === 'teamLeader' && teamId) {
//                     simsQuery = query(
//                         collection(db, 'sims'),
//                         where('teamId', '==', teamId)
//                     );
//                 } else {
//                     // Staff or unknown role, set defaults
//                     setSummary({
//                         totalSims: 0,
//                         activationRate: 0,
//                         teams: 0,
//                         fraudAlerts: 0
//                     });
//                     setLoading(false);
//                     return;
//                 }
//
//                 const simsSnapshot = await getDocs(simsQuery);
//                 const totalSims = simsSnapshot.size;
//
//                 // Get active SIMs for activation rate
//                 let activeSimsQuery;
//
//                 if (userRole === 'admin') {
//                     activeSimsQuery = query(
//                         collection(db, 'sims'),
//                         where('status', '==', 'Active')
//                     );
//                 } else if (userRole === 'teamLeader' && teamId) {
//                     activeSimsQuery = query(
//                         collection(db, 'sims'),
//                         where('teamId', '==', teamId),
//                         where('status', '==', 'Active')
//                     );
//                 }
//
//                 const activeSimsSnapshot = await getDocs(activeSimsQuery!);
//                 const activationRate = totalSims > 0
//                     ? Math.round((activeSimsSnapshot.size / totalSims) * 100)
//                     : 0;
//
//                 // Get team count for admin
//                 let teamCount = 0;
//
//                 if (userRole === 'admin') {
//                     const teamsSnapshot = await getDocs(collection(db, 'teams'));
//                     teamCount = teamsSnapshot.size;
//                 } else if (userRole === 'teamLeader' && teamId) {
//                     teamCount = 1; // Team leader manages one team
//                 }
//
//                 // Get fraud alerts count
//                 let fraudAlertsQuery;
//
//                 if (userRole === 'admin') {
//                     fraudAlertsQuery = query(
//                         collection(db, 'sims'),
//                         where('flaggedForFraud', '==', true)
//                     );
//                 } else if (userRole === 'teamLeader' && teamId) {
//                     fraudAlertsQuery = query(
//                         collection(db, 'sims'),
//                         where('teamId', '==', teamId),
//                         where('flaggedForFraud', '==', true)
//                     );
//                 }
//
//                 const fraudAlertsSnapshot = await getDocs(fraudAlertsQuery!);
//                 const fraudAlerts = fraudAlertsSnapshot.size;
//
//                 setSummary({
//                     totalSims,
//                     activationRate,
//                     teams: teamCount,
//                     fraudAlerts
//                 });
//
//                 setLoading(false);
//             } catch (err) {
//                 console.error('Error fetching dashboard summary:', err);
//                 setError('Failed to load dashboard summary');
//                 setLoading(false);
//             }
//         };
//
//         fetchSummary();
//     }, [userRole, teamId]);
//
//     return {summary, loading, error};
// };

// Hook to get user profile data
const useUserProfile = (userId: string) => {
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        if (!userId) {
            setProfile(null);
            setLoading(false);
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const userRef = doc(db, 'users', userId);

                const unsubscribe = onSnapshot(userRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setProfile({
                            id: snapshot.id,
                            ...snapshot.data()
                        } as User);
                    } else {
                        setProfile(null);
                        setError('User not found');
                    }

                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (err) {
                console.error('Error fetching user profile:', err);
                setError('Failed to load user profile');
                setLoading(false);
            }
        };

        fetchUserProfile().then();
    }, [userId]);

    return {user: profile, loading, error};
};

// Hook to get team details
const useTeamDetails = (teamId: string) => {
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!teamId) {
            setTeam(null);
            setLoading(false);
            return;
        }

        const fetchTeamDetails = async () => {
            try {
                const teamRef = doc(db, 'teams', teamId);

                const unsubscribe = onSnapshot(teamRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setTeam({
                            id: snapshot.id,
                            ...snapshot.data()
                        } as Team);
                    } else {
                        setTeam(null);
                        setError('Team not found');
                    }

                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (err) {
                console.error('Error fetching team details:', err);
                setError('Failed to load team details');
                setLoading(false);
            }
        };

        fetchTeamDetails();
    }, [teamId]);

    return {team, loading, error};
};

const useFraudMetrics = () => {
    const [fraudMetrics, setFraudMetrics] = useState({
        alertCount: 0,             // total flagged
        alertChangeCount: 0,       // change from last month
        highRiskAreas: [],
        recentCases: [],
        suspiciousPatterns: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFraudMetrics = async () => {
            try {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

                // Total flagged SIMs (this month)
                const { count: currentCount, error: currentError } = await simCardService.searchSimCards({
                    status: SIMStatus.FLAGGED,
                    fromDate: startOfMonth.toISOString()
                });

                if (currentError) throw new Error(currentError.message);

                // Total flagged SIMs (last month)
                const { count: lastMonthCount, error: lastMonthError } = await simCardService.searchSimCards({
                    status: SIMStatus.FLAGGED,
                    fromDate: startOfLastMonth.toISOString(),
                    toDate: endOfLastMonth.toISOString()
                });

                if (lastMonthError) throw new Error(lastMonthError.message);

                const alertCount = currentCount || 0;
                const alertChangeCount = (alertCount - (lastMonthCount || 0));

                // Get recent cases (this month, top 5)
                const { data: flaggedSimCards } = await simCardService.searchSimCards({
                    status: SIMStatus.FLAGGED,
                    fromDate: startOfMonth.toISOString(),
                    page: 1,
                    pageSize: 1000
                });

                const recentCases = flaggedSimCards
                    .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
                    .slice(0, 5)
                    .map(sim => ({
                        id: sim.id,
                        serialNumber: sim.serial_number,
                        saleDate: sim.sale_date,
                        teamName: sim.teams?.name || '',
                        soldBy: sim.users?.full_name || ''
                    }));

                // Example placeholders
                const highRiskAreas = [
                    { area: 'Area A', riskScore: 85 },
                    { area: 'Area B', riskScore: 72 },
                    { area: 'Area C', riskScore: 68 }
                ];
                const suspiciousPatterns = Math.floor(Math.random() * 10) + 5;

                setFraudMetrics({
                    alertCount,
                    alertChangeCount,
                    highRiskAreas,
                    recentCases,
                    suspiciousPatterns
                });

                setLoading(false);
            } catch (err: any) {
                console.error('Error fetching fraud metrics:', err);
                setError('Failed to load fraud detection metrics');
                setLoading(false);
            }
        };

        fetchFraudMetrics();
    }, []);

    return { fraudMetrics, loading, error };
};


// Hook to get user notifications
const useNotifications = (userId: string) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        const fetchNotifications = async () => {
            try {
                const notificationsQuery = query(
                    collection(db, 'notifications'),
                    where('userId', '==', userId),
                    where('read', '==', false),
                    orderBy('timestamp', 'desc')
                );

                const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
                    const notificationsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    setNotifications(notificationsData);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (err) {
                console.error('Error fetching notifications:', err);
                setError('Failed to load notifications');
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [userId]);

    return {notifications, loading, error};
};

// Hook to get authentication status using the AuthContext
const useAuthStatus = () => {
    const {user, loading} = useAuth();
    const [error, setError] = useState<string | null>(null);

    return {user, loading, error};
};

// Export all hooks
export {
    useTeams,
    useTeamMembers,
    useRecentSims,
    usePendingApprovals,
    useTeamPerformance,
    useSalesTrend,
    useOfflineQueue,
    useUserPerformance,
    useDashboardSummary,
    useUserProfile,
    useTeamDetails,
    useFraudMetrics,
    useNotifications,
    useAuthStatus
};