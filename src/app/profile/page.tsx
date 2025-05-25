"use client"
import UserProfileHeader from './components/UserProfileHeader';
import UserProfileDetails from './components/UserProfileDetails';
import UserProfileSkeleton from './components/UserProfileSkeleton';
import PerformanceMetricsTab from './components/PerformanceMetricsTab';
import useApp from "@/ui/provider/AppProvider";
import {useEffect, useState} from "react";
import {userService} from "@/services";
import {User} from "@/models";
import {toast} from "react-hot-toast";
// export const revalidate = 0;

export default function UserProfilePage() {
    const {user: currentUser} = useApp();
    const [user, setUser] = useState<User | null>(currentUser);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser) return;

            setLoading(true);
            try {
                const {data, error} = await userService.getUserById(currentUser.id);
                if (error) {
                    console.error("Error fetching user data:", error);
                    setError("Failed to load user data. Please try again.");
                    toast.error("Failed to load user data");
                } else {
                    setUser(data);
                }
            } catch (err) {
                console.error("Exception fetching user data:", err);
                setError("An unexpected error occurred");
                toast.error("An unexpected error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [currentUser]);

    if (loading || !user) {
        return <UserProfileSkeleton/>
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Error</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Role-specific content components
    const renderRoleSpecificContent = () => {
        switch (user.role) {
            case 'admin':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Admin Dashboard</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">System Overview</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Access to all system settings and user management tools.
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">User Management</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Create, edit, and manage all user accounts in the system.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'TEAM_LEADER':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Team Leader Dashboard</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Team Performance</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Monitor and manage your team's performance metrics.
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Staff Management</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Assign tasks and manage staff members in your team.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'staff':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Staff Dashboard</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">My Performance</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    View your performance metrics and targets.
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Tasks</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    View and manage your assigned tasks.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Tab content components
    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-1">
                            <UserProfileDetails user={user}/>
                        </div>
                        <div className="lg:col-span-2">
                            {renderRoleSpecificContent()}
                        </div>
                    </div>
                );
            case 'performance':
                return (
                    <div className="mt-8">
                        <PerformanceMetricsTab user={user} />
                    </div>
                );
            case 'documents':
                return (
                    <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Documents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">ID Document</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    ID Number: {user.id_number}
                                </p>
                                <div className="flex gap-2">
                                    {user.id_front_url ? (
                                        <a 
                                            href={user.id_front_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded transition-colors"
                                        >
                                            View Front
                                        </a>
                                    ) : (
                                        <span className="text-xs text-gray-500">No front ID image</span>
                                    )}

                                    {user.id_back_url ? (
                                        <a 
                                            href={user.id_back_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded transition-colors"
                                        >
                                            View Back
                                        </a>
                                    ) : (
                                        <span className="text-xs text-gray-500">No back ID image</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'history':
                return (
                    <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Activity History</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Your activity history will be displayed here.
                        </p>
                    </div>
                );
            case 'settings':
                return (
                    <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Settings</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Profile settings and preferences will be displayed here.
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <UserProfileHeader 
                    user={user} 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab}
                    onEditProfile={() => {
                        setActiveTab('overview');
                        // Find the UserProfileDetails component and trigger edit mode
                        const detailsElement = document.querySelector('[data-testid="edit-profile-button"]');
                        if (detailsElement) {
                            detailsElement.click();
                        }
                    }}
                />
                {renderTabContent()}
            </div>
        </div>
    );
}
