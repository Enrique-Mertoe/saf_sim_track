"use client"
import React, {useState} from 'react';
import {CheckCircle, Clock, AlertCircle} from 'lucide-react';

interface Task {
    id: number;
    title: string;
    priority: 'high' | 'medium' | 'low';
    dueDate: string;
    status: 'completed' | 'in-progress' | 'pending';
}

const StaffTaskSummary: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([
        {
            id: 1,
            title: 'Complete weekly report',
            priority: 'high',
            dueDate: '2025-05-12',
            status: 'in-progress'
        },
        {
            id: 2,
            title: 'Update client information',
            priority: 'medium',
            dueDate: '2025-05-13',
            status: 'pending'
        },
        {
            id: 3,
            title: 'Review team metrics',
            priority: 'low',
            dueDate: '2025-05-14',
            status: 'completed'
        },
        {
            id: 4,
            title: 'Schedule client meeting',
            priority: 'high',
            dueDate: '2025-05-12',
            status: 'pending'
        }
    ]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500"/>;
            case 'in-progress':
                return <Clock className="w-5 h-5 text-blue-500"/>;
            case 'pending':
                return <AlertCircle className="w-5 h-5 text-yellow-500"/>;
            default:
                return null;
        }
    };

    const getPriorityClass = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Task Summary</h2>
                <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
            </div>

            <div className="space-y-2">
                {tasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div className="flex items-center space-x-3">
                            {getStatusIcon(task.status)}
                            <span className="font-medium">{task.title}</span>
                        </div>
                        <div className="flex items-center space-x-3">
              <span className={`px-2 py-1 text-xs rounded-full ${getPriorityClass(task.priority)}`}>
                {task.priority}
              </span>
                            <span className="text-sm text-gray-500">Due: {task.dueDate}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between mt-4 text-sm">
                <div>
                    <p className="font-medium">Total Tasks: {tasks.length}</p>
                </div>
                <div className="flex space-x-4">
                    <p className="text-green-600">Completed: {tasks.filter(t => t.status === 'completed').length}</p>
                    <p className="text-blue-600">In Progress: {tasks.filter(t => t.status === 'in-progress').length}</p>
                    <p className="text-yellow-600">Pending: {tasks.filter(t => t.status === 'pending').length}</p>
                </div>
            </div>
        </div>
    );
};

export default StaffTaskSummary;