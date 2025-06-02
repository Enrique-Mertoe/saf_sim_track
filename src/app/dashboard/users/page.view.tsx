'use client';

import {useEffect, useMemo, useState} from 'react';
import {OnboardingRequest, OnboardingRequestStatus, User, UserRole, UserStatus} from "@/models";
import UserTable from "@/app/dashboard/users/components/UserTable";
import CreateUserButton from "@/app/dashboard/users/components/CreateUserButton";
import UserFilters from "@/app/dashboard/users/components/UserFilters";
import Dashboard from "@/ui/components/dash/Dashboard";
import {onboardingService, userService} from "@/services";
import OnBoardTable from "@/app/dashboard/users/components/OnBoardTable";
import useApp from "@/ui/provider/AppProvider";
import Signal from "@/lib/Signal";
import {useSupabaseSignal} from "@/lib/supabase/event";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const {user, userManager} = useApp();
    const [requests, setRequests] = useState<OnboardingRequest[]>([]);
    const [activeTab, setActiveTab] = useState<"users" | "requests">("users");
    const [loading, setLoading] = useState(!user);
    const [filters, setFilters] = useState({
        role: '',
        team: '',
        status: '',
        search: '',
    });

    // Setup Supabase realtime for users
    const usersSignal = useSupabaseSignal<User>('users', {autoConnect: true});

    // Setup Supabase realtime for onboarding requests
    const onboardingSignal = useSupabaseSignal<OnboardingRequest>('onboarding_requests', {autoConnect: true});

    // Get current user's role
    const currentUserRole = user?.role || '';

    // Filter users based on role and filters
    const filteredUsers = useMemo(() => {
        if (!users || !users.length) return [];

        let result = [...users];

        // Role-based filtering based on current user's role
        if (currentUserRole === UserRole.TEAM_LEADER) {
            // Team leaders can only see their team members (excluding themselves)
            result = result.filter(u => u.team_id === user?.team_id && u.id !== user?.id);
        } else if (currentUserRole !== UserRole.ADMIN) {
            // Non-admins and non-team leaders can only see themselves
            result = result.filter(u => u.id === user?.id);
        }

        // Apply selected filters (only for admins)
        if (currentUserRole === UserRole.ADMIN) {
            if (filters.role) {
                result = result.filter(u => u.role === filters.role);
            }

            if (filters.team) {
                result = result.filter(u => u.team_id === filters.team);
            }

            if (filters.status) {
                result = result.filter(u => u.status === filters.status);
            }
        }

        // Search filter is available for all roles
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(
                u => u.full_name.toLowerCase().includes(searchLower) ||
                    u.email.toLowerCase().includes(searchLower) ||
                    u.phone_number.toLowerCase().includes(searchLower) ||
                    u.id_number.toLowerCase().includes(searchLower)
            );
        }

        return result;
    }, [users, filters, currentUserRole, user?.id, user?.team_id]);

    // Determine available filters based on user role
    const getAvailableFilters = () => {
        if (currentUserRole === UserRole.ADMIN) {
            // Admins can see all filters
            return {
                showRoleFilter: true,
                showTeamFilter: true,
                showStatusFilter: true,
                showSearch: true
            };
        } else if (currentUserRole === UserRole.TEAM_LEADER) {
            // Team leaders can only search
            return {
                showRoleFilter: false,
                showTeamFilter: false,
                showStatusFilter: false,
                showSearch: true
            };
        } else {
            // Regular users can only search their own info
            return {
                showRoleFilter: false,
                showTeamFilter: false,
                showStatusFilter: false,
                showSearch: true
            };
        }
    };

    const fetchUsers = async () => {
        if (!user) return;
        try {
            const {data} = await userService.getAllUsers(user)
            if (data)
                setUsers(data as User[]);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOnboard = async () => {
        if (!user) return;
        try {
            const {data, error} = await onboardingService.getAllRequests(user);
            if (!error)
                setRequests(data as OnboardingRequest[]);
        } catch (error) {
            console.error('Error fetching onboarding requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers().then();
        fetchOnboard().then();
    }, [user]);

    useEffect(() => {
        Signal.on("fetchOnboard", () => {
            fetchUsers().then();
            fetchOnboard().then();
        });
        return () => {
            Signal.off("fetchOnboard")
        }
    }, [fetchOnboard, fetchUsers]);

    // Setup realtime updates for users
    useEffect(() => {
        if (!usersSignal || !user) return;

        // Handle new users
        const handleInsert = (payload: any) => {
            setUsers(prev => [payload.new, ...prev]);
        };

        // Handle updated users
        const handleUpdate = (payload: any) => {
            setUsers(prev =>
                prev.map(u => u.id === payload.new.id ? payload.new : u)
            );
        };

        // Handle deleted users
        const handleDelete = (payload: any) => {
            setUsers(prev =>
                prev.filter(u => u.id !== payload.old.id)
            );
        };

        // Subscribe to events
        usersSignal.onInsert(handleInsert);
        usersSignal.onUpdate(handleUpdate);
        usersSignal.onDelete(handleDelete);

        // Cleanup
        return () => {
            usersSignal.off('INSERT', handleInsert);
            usersSignal.off('UPDATE', handleUpdate);
            usersSignal.off('DELETE', handleDelete);
        };
    }, [usersSignal, user]);

    // Setup realtime updates for onboarding requests
    useEffect(() => {
        if (!onboardingSignal || !user) return;

        // Handle new onboarding requests
        const handleInsert = (payload: any) => {
            setRequests(prev => [payload.new, ...prev]);
        };

        // Handle updated onboarding requests
        const handleUpdate = (payload: any) => {
            setRequests(prev =>
                prev.map(r => r.id === payload.new.id ? payload.new : r)
            );
        };

        // Handle deleted onboarding requests
        const handleDelete = (payload: any) => {
            setRequests(prev =>
                prev.filter(r => r.id !== payload.old.id)
            );
        };

        // Subscribe to events
        onboardingSignal.onInsert(handleInsert);
        onboardingSignal.onUpdate(handleUpdate);
        onboardingSignal.onDelete(handleDelete);

        // Cleanup
        return () => {
            onboardingSignal.off('INSERT', handleInsert);
            onboardingSignal.off('UPDATE', handleUpdate);
            onboardingSignal.off('DELETE', handleDelete);
        };
    }, [onboardingSignal, user]);

    const handleFilterChange = (newFilters: any) => {
        setFilters({...filters, ...newFilters});
    };

    const handleStatusChange = async (_userId: string, _newStatus: UserStatus) => {
        try {
            fetchUsers().then();
        } catch (error) {
            console.error('Error updating user status:', error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Remove the user from the state
                setUsers(users.filter(user => user.id !== userId));
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    // Get contextual messages based on role
    const getContextualInfo = () => {
        const pendingRequests = requests.filter(r => r.status === OnboardingRequestStatus.PENDING).length;

        switch (currentUserRole) {
            case UserRole.ADMIN:
                return {
                    title: "Admin Dashboard",
                    description: "Manage all users and onboarding requests across the system.",
                    stats: `${filteredUsers.length} users • ${pendingRequests} pending requests`
                };
            case UserRole.TEAM_LEADER:
                return {
                    title: "Team Management",
                    description: `Manage your team members and review onboarding requests.`,
                    stats: `${filteredUsers.length} team members • ${pendingRequests} pending requests`
                };
            default:
                return {
                    title: "My Profile",
                    description: "View your account information and status.",
                    stats: "Personal dashboard"
                };
        }
    };

    const contextInfo = getContextualInfo();

    return (
        <Dashboard>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="p-3 sm:p-4 max-w-7xl mx-auto">
                    <div
                        className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-hidden">
                        {/* Animated background pattern */}
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-violet-50 via-cyan-50 to-emerald-50 dark:from-violet-950/20 dark:via-cyan-950/20 dark:to-emerald-950/20 opacity-60"></div>
                        <div
                            className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-full transform translate-x-16 -translate-y-16"></div>

                        <div
                            className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                {/* Glass morphism icon container */}
                                <div
                                    className="relative w-12 h-12 bg-white/20 dark:bg-gray-700/30 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 dark:border-gray-600/30 shadow-lg">
                                    <div
                                        className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl"></div>
                                    <svg
                                        className="w-6 h-6 text-blue-600 dark:text-blue-400 relative z-10"
                                        fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                                    </svg>
                                    {/* Pulse animation ring */}
                                    <div
                                        className="absolute inset-0 rounded-2xl border-2 border-blue-400/30 animate-ping"></div>
                                </div>

                                <div className="space-y-1">
                                    <div
                                        className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                                        <div
                                            className="inline-flex items-center py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                                            <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd"
                                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                      clipRule="evenodd"/>
                                            </svg>
                                            {contextInfo.stats}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                                        {contextInfo.description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 justify-end">
                                {/* Modern Quick stats for admins */}
                                {currentUserRole === UserRole.ADMIN && (
                                    <div className="flex gap-4">
                                        <div className="group relative">
                                            <div
                                                className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl p-2 border border-white/60 dark:border-gray-600/60 hover:shadow-lg transition-all duration-300 hover:scale-105">
                                                <div className="text-center">
                                                    <div
                                                        className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                                                        {users.filter(u => u.status === UserStatus.ACTIVE).length}
                                                    </div>
                                                    <div
                                                        className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wide">Active
                                                    </div>
                                                </div>
                                                {/* Hover indicator */}
                                                <div
                                                    className="absolute inset-0 rounded-xl bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            </div>
                                        </div>


                                    </div>
                                )}

                            </div>
                        </div>
                    </div>

                    {/* Compact Tabs */}
                    <div className="my-4">
                        <div
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1.5">
                            <div className="flex gap-1.5">
                                <button
                                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 transform hover:scale-105 ${
                                        activeTab === "users"
                                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/25"
                                            : "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                    onClick={() => setActiveTab("users")}
                                >
                                    <span className="flex items-center justify-center sm:justify-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-0 sm:mr-1.5"
                                             viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                                        </svg>
                                        <span className="hidden sm:inline">Users</span>
                                    </span>
                                </button>
                                <button
                                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 transform hover:scale-105 relative ${
                                        activeTab === "requests"
                                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/25"
                                            : "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                    onClick={() => setActiveTab("requests")}
                                >
                                    <span className="flex items-center justify-center sm:justify-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-0 sm:mr-1.5"
                                             viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd"
                                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                                                  clipRule="evenodd"/>
                                        </svg>
                                        <span className="hidden sm:inline">Requests</span>
                                    </span>
                                    {requests.filter(r => r.status === OnboardingRequestStatus.PENDING).length > 0 && (
                                        <span
                                            className="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full w-4 h-4 text-xs font-bold flex items-center justify-center animate-bounce">
                                            {requests.filter(r => r.status === OnboardingRequestStatus.PENDING).length}
                                        </span>
                                    )}
                                </button>

                                {/* Action Button */}
                                {(currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.TEAM_LEADER) && (
                                    <div className="flex-shrink-0 ms-auto">
                                        <CreateUserButton/>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Loading state */}
                    {loading ? (
                        <div
                            className="flex flex-col justify-center items-center h-48 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="relative">
                                <div
                                    className="animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-green-500 mb-3"></div>
                                <div
                                    className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-green-300 opacity-20"></div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 font-medium">Loading data...</p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Please wait a moment</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeTab === "users" ? (
                                <>
                                    {/* Compact Filters - Only show for admins */}
                                    {currentUserRole === UserRole.ADMIN && (
                                        <UserFilters
                                            filters={filters}
                                            onFilterChange={handleFilterChange}
                                            availableFilters={getAvailableFilters()}
                                        />
                                    )}

                                    {/* Compact Search for Team Leaders and Regular Users */}
                                    {currentUserRole !== UserRole.ADMIN && (
                                        <UserFilters
                                            filters={filters}
                                            onFilterChange={handleFilterChange}
                                            availableFilters={getAvailableFilters()}
                                        />
                                    )}


                                    {/* Users Table */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <UserTable
                                            users={
                                                userManager.isTeamLeader() ?

                                                    filteredUsers.filter(u => u.role != UserRole.TEAM_LEADER) : filteredUsers}
                                            onStatusChange={handleStatusChange}
                                            onDeleteUser={handleDeleteUser}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <OnBoardTable
                                        requests={requests}
                                        onStatusChange={() => {
                                        }}
                                        onDeleteUser={() => {
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Dashboard>
    );
}
