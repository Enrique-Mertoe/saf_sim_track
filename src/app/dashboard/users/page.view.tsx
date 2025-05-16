'use client';

import {useCallback, useEffect, useState} from 'react';
import {OnboardingRequest, OnboardingRequestStatus, User, UserStatus} from "@/models";
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
    const {user} = useApp()
    const [requests, setRequests] = useState<OnboardingRequest[]>([]);
    const [activeTab, setActiveTab] = useState<"users" | "requests">("users");
    const [loading, setLoading] = useState(!user);
    const [filters, setFilters] = useState({
        role: '',
        team: '',
        status: '',
        search: '',
    });

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
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers().then();
        fetchOnboard().then();
    }, [fetchOnboard, fetchUsers, filters]);
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
            //     const response = await fetch(`/api/users/${userId}/status`, {
            //         method: 'PUT',
            //         headers: {
            //             'Content-Type': 'application/json',
            //         },
            //         body: JSON.stringify({status: newStatus}),
            //     });
            //
            //     if (response.ok) {
            //         // Update the user in the state
            //         setUsers(users.map(user =>
            //             user.id === userId ? {...user, status: newStatus} : user
            //         ));
            //     }
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

    return (
        <Dashboard>
            <div className="p-6">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-semibold">User Management</h1>
                    <div className="flex gap-3">
                        <button
                            className={`px-4 py-2 rounded-md ${activeTab === "users" ? "bg-green-600 dark:bg-green-800 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
                            onClick={() => setActiveTab("users")}
                        >
                            Users
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md ${activeTab === "requests" ? "bg-green-600 dark:bg-green-800 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
                            onClick={() => setActiveTab("requests")}
                        >
                            Onboarding Requests
                            {requests.filter(r => r.status === OnboardingRequestStatus.PENDING).length > 0 && (
                                <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                                    {requests.filter(r => r.status === OnboardingRequestStatus.PENDING).length}
                                  </span>
                            )}
                        </button>
                        <CreateUserButton/>
                    </div>
                </div>

                {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div
                                className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                        </div>
                    ) :

                    activeTab === "users" ?
                        (<>
                            <UserFilters filters={filters} onFilterChange={handleFilterChange}/>
                            <UserTable
                                users={users}
                                onStatusChange={handleStatusChange}
                                onDeleteUser={handleDeleteUser}
                            />
                        </>) :

                        (<OnBoardTable requests={requests} onStatusChange={() => {
                        }} onDeleteUser={() => {
                        }}/>)

                }
            </div>
        </Dashboard>
    );
}