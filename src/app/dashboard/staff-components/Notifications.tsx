"use client"
import React, {useState} from 'react';
import {Bell, MessageSquare, FileText, CheckCircle} from 'lucide-react';

interface Notification {
    id: number;
    title: string;
    time: string;
    read: boolean;
    type: 'message' | 'announcement' | 'task' | 'approval';
}

const StaffNotifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: 1,
            title: 'Team Lead: Weekly report reminder',
            time: '10 mins ago',
            read: false,
            type: 'message'
        },
        {
            id: 2,
            title: 'Company: New vacation policy',
            time: '1 hour ago',
            read: false,
            type: 'announcement'
        },
        {
            id: 3,
            title: 'Project X: Task assigned to you',
            time: '3 hours ago',
            read: true,
            type: 'task'
        },
        {
            id: 4,
            title: 'HR: Your time off request was approved',
            time: 'Yesterday',
            read: true,
            type: 'approval'
        }
    ]);

    const markAllAsRead = () => {
        setNotifications(notifications.map(notification => ({
            ...notification,
            read: true
        })));
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'message':
                return <MessageSquare className="w-5 h-5 text-blue-500"/>;
            case 'announcement':
                return <Bell className="w-5 h-5 text-yellow-500"/>;
            case 'task':
                return <FileText className="w-5 h-5 text-purple-500"/>;
            case 'approval':
                return <CheckCircle className="w-5 h-5 text-green-500"/>;
            default:
                return <Bell className="w-5 h-5 text-gray-500"/>;
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Notifications</h2>
                <div className="flex items-center">
          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 mr-2">
            {unreadCount}
          </span>
                    <button
                        className="text-xs text-blue-600 hover:text-blue-800"
                        onClick={markAllAsRead}
                    >
                        Mark all as read
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {notifications.map(notification => (
                    <div
                        key={notification.id}
                        className={`p-3 flex items-start space-x-3 border rounded-lg ${!notification.read ? 'bg-blue-50' : 'bg-white'}`}
                    >
                        <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                        </div>
                        <div>
                            <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                                {notification.title}
                            </p>
                            <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-800">
                    View All Notifications
                </button>
            </div>
        </div>
    );
};

export default StaffNotifications;