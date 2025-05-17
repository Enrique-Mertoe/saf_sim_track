// app/profile/[userId]/components/UserProfileHeader.tsx
'use client';

import {useTheme} from 'next-themes';
import {useState, useEffect} from 'react';
import {BarChart3, Calendar, FileText, Mail, MapPin, MessageSquare, Moon, Sun, Users} from 'lucide-react';
import {User} from "@/models";

interface UserProfileHeaderProps {
    user: User;
}

export default function UserProfileHeader({user}: UserProfileHeaderProps) {
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
                        {/*<button*/}
                        {/*    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white text-sm font-medium transition-colors duration-200">*/}
                        {/*    <Mail className="h-4 w-4 mr-2"/>*/}
                        {/*    Message*/}
                        {/*</button>*/}
                        {/*<button*/}
                        {/*    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors duration-200">*/}
                        {/*    <Users className="h-4 w-4 mr-2"/>*/}
                        {/*    Assign to Team*/}
                        {/*</button>*/}
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                    <a href="#overview"
                       className="px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 transition-colors">
                        Overview
                    </a>
                    <a href="#performance"
                       className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                        Performance
                    </a>
                    <a href="#documents"
                       className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                        Documents
                    </a>
                    <a href="#history"
                       className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                        History
                    </a>
                    <a href="#settings"
                       className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                        Settings
                    </a>
                </nav>
            </div>
        </div>
    );
}