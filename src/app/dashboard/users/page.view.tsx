'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {OnboardingRequest, OnboardingRequestStatus, User, UserRole, UserStatus} from "@/models";
import UserTable from "@/app/dashboard/users/components/UserTable";
import CreateUserButton from "@/app/dashboard/users/components/CreateUserButton";
import UserFilters from "@/app/dashboard/users/components/UserFilters";
import Dashboard from "@/ui/components/dash/Dashboard";
import {onboardingService, userService} from "@/services";
import OnBoardTable from "@/app/dashboard/users/components/OnBoardTable";
import useApp from "@/ui/provider/AppProvider";
import Signal from "@/lib/Signal";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const {user} = useApp();
    const [requests, setRequests] = useState<OnboardingRequest[]>([]);
    const [activeTab, setActiveTab] = useState<"users" | "requests">("users");
    const [loading, setLoading] = useState(!user);
    const [filters, setFilters] = useState({
        role: '',
        team: '',
        status: '',
        search: '',
    });

    // Get current user's role
    const currentUserRole = user?.role || '';

    // Filter users based on role and filters
    const filteredUsers = useMemo(() => {
        if (!users.length) return [];

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

    const fetchUsers = useCallback(async () => {
        try {
            const {data} = await userService.getAllUsers()
            setUsers(data as User[]);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchOnboard = useCallback(async () => {
        try {
            const {data} = await onboardingService.getAllRequests();
            setRequests(data as OnboardingRequest[]);
        } catch (error) {
            console.error('Error fetching onboarding requests:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers().then();
        fetchOnboard().then();
    }, [fetchOnboard, fetchUsers]);

    useEffect(() => {
        Signal.on("fetchOnboard", () => {
            fetchUsers().then();
            fetchOnboard().then();
        });
        return () => {
            Signal.off("fetchOnboard")
        }
    }, [fetchOnboard, fetchUsers]);

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
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Enhanced Header */}
                    <div className="mb-6 sm:mb-8">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                            {contextInfo.title}
                                        </h1>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base mb-3">
                                        {contextInfo.description}
                                    </p>
                                    <div className="inline-flex items-center px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        {contextInfo.stats}
                                    </div>
                                </div>

                                {/* Action Button */}
                                {(currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.TEAM_LEADER) && (
                                    <div className="flex-shrink-0">
                                        <CreateUserButton />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Tabs */}
                    <div className="mb-6 sm:mb-8">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
                            <div className="flex gap-2">
                                <button
                                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                                        activeTab === "users"
                                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25"
                                            : "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                    onClick={() => setActiveTab("users")}
                                >
                                    <span className="flex items-center justify-center sm:justify-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-0 sm:mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                        </svg>
                                        <span className="hidden sm:inline">Users</span>
                                    </span>
                                </button>
                                <button
                                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 relative ${
                                        activeTab === "requests"
                                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25"
                                            : "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                    onClick={() => setActiveTab("requests")}
                                >
                                    <span className="flex items-center justify-center sm:justify-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-0 sm:mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                        </svg>
                                        <span className="hidden sm:inline">Requests</span>
                                    </span>
                                    {requests.filter(r => r.status === OnboardingRequestStatus.PENDING).length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center animate-bounce">
                                            {requests.filter(r => r.status === OnboardingRequestStatus.PENDING).length}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Loading state */}
                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mb-4"></div>
                                <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-green-300 opacity-20"></div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Loading data...</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Please wait a moment</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {activeTab === "users" ? (
                                <>
                                    {/* Conditional Filters - Only show for admins */}
                                    {currentUserRole === UserRole.ADMIN && (
                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                                                </svg>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Users</h3>
                                            </div>
                                            <UserFilters
                                                filters={filters}
                                                onFilterChange={handleFilterChange}
                                                availableFilters={getAvailableFilters()}
                                            />
                                        </div>
                                    )}

                                    {/* Search for Team Leaders and Regular Users */}
                                    {currentUserRole !== UserRole.ADMIN && (
                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                                </svg>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {currentUserRole === UserRole.TEAM_LEADER ? "Search Team Members" : "Search Your Profile"}
                                                </h3>
                                            </div>
                                            <UserFilters
                                                filters={filters}
                                                onFilterChange={handleFilterChange}
                                                availableFilters={getAvailableFilters()}
                                            />
                                        </div>
                                    )}

                                    {/* Enhanced User count summary */}
                                    <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-gray-900 dark:text-white font-semibold text-lg">
                                                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredUsers.length}</span>
                                                        {filteredUsers.length === 1 ? ' user' : ' users'}
                                                    </p>
                                                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                                                        {filters.role || filters.team || filters.status || filters.search ? 'Matching your filters' :
                                                            currentUserRole === UserRole.TEAM_LEADER ? 'In your team' :
                                                                currentUserRole === UserRole.ADMIN ? 'Total system users' : 'Your profile'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Quick stats for admins */}
                                            {currentUserRole === UserRole.ADMIN && (
                                                <div className="flex gap-4 text-sm">
                                                    <div className="text-center">
                                                        <div className="font-bold text-green-600 dark:text-green-400">
                                                            {users.filter(u => u.status === UserStatus.ACTIVE).length}
                                                        </div>
                                                        <div className="text-gray-600 dark:text-gray-400">Active</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-bold text-yellow-600 dark:text-yellow-400">
                                                            {users.filter(u => u.status === UserStatus.PENDING_APPROVAL).length}
                                                        </div>
                                                        <div className="text-gray-600 dark:text-gray-400">Pending</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Users Table */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <UserTable
                                            users={filteredUsers}
                                            onStatusChange={handleStatusChange}
                                            onDeleteUser={handleDeleteUser}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <OnBoardTable
                                        requests={requests}
                                        onStatusChange={() => {}}
                                        onDeleteUser={() => {}}
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