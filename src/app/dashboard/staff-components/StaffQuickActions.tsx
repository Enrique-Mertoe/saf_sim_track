"use client"
import React, {JSX} from 'react';
import {Clock, FileText, Calendar, MessageSquare, User, Settings} from 'lucide-react';

interface QuickAction {
    id: number;
    title: string;
    icon: JSX.Element;
    bgColor: string;
}

const StaffQuickActions: React.FC = () => {
    const quickActions: QuickAction[] = [
        {
            id: 1,
            title: 'Log Time',
            icon: <Clock className="w-5 h-5"/>,
            bgColor: 'bg-blue-500'
        },
        {
            id: 2,
            title: 'Submit Report',
            icon: <FileText className="w-5 h-5"/>,
            bgColor: 'bg-green-500'
        },
        {
            id: 3,
            title: 'Book Meeting',
            icon: <Calendar className="w-5 h-5"/>,
            bgColor: 'bg-purple-500'
        },
        {
            id: 4,
            title: 'Team Chat',
            icon: <MessageSquare className="w-5 h-5"/>,
            bgColor: 'bg-yellow-500'
        },
        {
            id: 5,
            title: 'Update Profile',
            icon: <User className="w-5 h-5"/>,
            bgColor: 'bg-pink-500'
        },
        {
            id: 6,
            title: 'Preferences',
            icon: <Settings className="w-5 h-5"/>,
            bgColor: 'bg-gray-500'
        },
    ];

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {quickActions.map(action => (
                    <button
                        key={action.id}
                        className="flex flex-col items-center justify-center p-4 rounded-lg bg-white border hover:shadow-md transition-shadow"
                    >
                        <div className={`p-2 rounded-full ${action.bgColor} text-white mb-2`}>
                            {action.icon}
                        </div>
                        <span className="text-sm font-medium">{action.title}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default StaffQuickActions;