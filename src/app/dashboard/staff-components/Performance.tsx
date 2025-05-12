"use client"
import React from 'react';
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts';

const StaffPerformanceMetrics: React.FC = () => {
    const performanceData = [
        {name: 'Week 1', productivity: 85, taskCompletion: 78},
        {name: 'Week 2', productivity: 82, taskCompletion: 75},
        {name: 'Week 3', productivity: 88, taskCompletion: 82},
        {name: 'Week 4', productivity: 90, taskCompletion: 88},
        {name: 'Week 5', productivity: 92, taskCompletion: 90},
    ];

    const metricsData = [
        {name: 'Tasks Completed', value: 23, change: '+5', color: 'text-green-500'},
        {name: 'Client Satisfaction', value: '92%', change: '+3%', color: 'text-green-500'},
        {name: 'Response Time', value: '2h', change: '-30min', color: 'text-green-500'},
    ];

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {metricsData.map((metric, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-500">{metric.name}</p>
                        <div className="flex items-end justify-between">
                            <p className="text-xl font-bold">{metric.value}</p>
                            <p className={`text-sm ${metric.color}`}>{metric.change}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={performanceData}
                        margin={{top: 5, right: 20, left: 0, bottom: 5}}
                    >
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="name"/>
                        <YAxis/>
                        <Tooltip/>
                        <Line
                            type="monotone"
                            dataKey="productivity"
                            stroke="#8884d8"
                            activeDot={{r: 8}}
                            name="Productivity"
                        />
                        <Line
                            type="monotone"
                            dataKey="taskCompletion"
                            stroke="#82ca9d"
                            name="Task Completion"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-center mt-2">
                <div className="flex items-center mr-4">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full mr-1"></div>
                    <span className="text-xs">Productivity</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                    <span className="text-xs">Task Completion</span>
                </div>
            </div>
        </div>
    );
};

export default StaffPerformanceMetrics;