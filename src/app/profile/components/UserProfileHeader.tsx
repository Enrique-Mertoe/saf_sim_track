// app/profile/[userId]/components/UserProfileHeader.tsx
'use client';

import {useTheme} from 'next-themes';
import {useEffect, useState} from 'react';
import {BarChart3, Calendar, Clock, FileText, MessageSquare, Settings, User as UserIcon} from 'lucide-react';
import {User} from "@/models";

interface UserProfileHeaderProps {
    user: User;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    onEditProfile?: () => void;
}

export default function UserProfileHeader({user, activeTab = 'overview', onTabChange, onEditProfile}: UserProfileHeaderProps) {
    const {theme, setTheme} = useTheme();
    const [mounted, setMounted] = useState(false);

    // Wait for component to mount to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Generate initials from user's name
    const initials = user.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    // Generate a consistent background color based on user's ID
    const colorHues = ['bg-green-600', 'bg-green-600', 'bg-green-600', 'bg-pink-600', 'bg-green-600', 'bg-red-600', 'bg-yellow-600', 'bg-teal-600'];
    const bgColorClass = colorHues[parseInt(user.id.substring(0, 8), 16) % colorHues.length];

    // Handle tab click
    const handleTabClick = (tab: string, e: React.MouseEvent) => {
        e.preventDefault();
        if (onTabChange) {
            onTabChange(tab);
        }
    };

    // Get tab class based on active state
    const getTabClass = (tab: string) => {
        return tab === activeTab
            ? "px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 transition-colors"
            : "px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors";
    };

    return (
        <div className="rounded-lg shadow-lg bg-white dark:bg-gray-800 overflow-hidden transition-colors duration-300">
            <div
                className="relative h-48 bg-gradient-to-r from-green-400 to-purple-500 dark:from-green-600 dark:to-purple-700">

                <div className="absolute -bottom-14 left-8">
                    <div
                        className={`h-28 w-28 rounded-full ${bgColorClass} text-white flex items-center justify-center text-4xl font-bold shadow-lg border-4 border-white dark:border-gray-800`}>
                        {initials}
                    </div>
                </div>
            </div>

            <div className="pt-16 pb-6 px-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                            {user.full_name}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 transition-colors mt-1">
                            {user.role.replace(/_/g, ' ')}
                        </p>
                    </div>

                    <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
                        <button
                            onClick={onEditProfile}
                            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white text-sm font-medium transition-colors duration-200">
                            <Settings className="h-4 w-4 mr-2"/>
                            Edit Profile
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-300 transition-colors">
                        <Calendar className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400"/>
                        <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-300 transition-colors">
                        <MessageSquare className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400"/>
                        <span>Phone: {user.phone_number}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-300 transition-colors">
                        <BarChart3 className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400"/>
                        <span>Status: {user.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 px-8 py-4 transition-colors">
                <nav className="flex space-x-4 overflow-x-auto">
                    <a href="#" onClick={(e) => handleTabClick('overview', e)}
                       className={getTabClass('overview')}>
                        <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            Overview
                        </div>
                    </a>
                    <a href="#" onClick={(e) => handleTabClick('performance', e)}
                       className={getTabClass('performance')}>
                        <div className="flex items-center">
                            <BarChart3 className="h-4 w-4 mr-1" />
                            Performance
                        </div>
                    </a>
                    <a href="#" onClick={(e) => handleTabClick('documents', e)}
                       className={getTabClass('documents')}>
                        <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            Documents
                        </div>
                    </a>
                    <a href="#" onClick={(e) => handleTabClick('history', e)}
                       className={getTabClass('history')}>
                        <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            History
                        </div>
                    </a>
                    <a href="#" onClick={(e) => handleTabClick('settings', e)}
                       className={getTabClass('settings')}>
                        <div className="flex items-center">
                            <Settings className="h-4 w-4 mr-1" />
                            Settings
                        </div>
                    </a>
                </nav>
            </div>
        </div>
    );
}
