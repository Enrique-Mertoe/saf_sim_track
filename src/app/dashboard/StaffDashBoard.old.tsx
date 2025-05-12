"use client"
import React from 'react';
import StaffTaskSummary from "@/app/dashboard/staff-components/Summery";
import StaffNotifications from './staff-components/Notifications';
import StaffPerformanceMetrics from "@/app/dashboard/staff-components/Performance";
import StaffCalendar from "@/app/dashboard/staff-components/Calendar";
import StaffQuickActions from "@/app/dashboard/staff-components/StaffQuickActions";
import {Card} from "@/ui/components/Card";
import Dashboard from "@/ui/components/dash/Dashboard";

const StaffDashboard: React.FC = () => {
    return (
        <Dashboard>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Staff Dashboard</h1>
                    <p className="text-sm text-gray-500">Welcome back, Staff Member</p>
                </div>

                {/* Quick Actions */}
                <div className="mb-6">
                    <StaffQuickActions/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Task Summary */}
                    <Card className="p-4 col-span-2">
                        <StaffTaskSummary/>
                    </Card>

                    {/* Notifications */}
                    <Card className="p-4">
                        <StaffNotifications/>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Performance Metrics */}
                    <Card className="p-4">
                        <StaffPerformanceMetrics/>
                    </Card>

                    {/* Calendar */}
                    <Card className="p-4">
                        <StaffCalendar/>
                    </Card>
                </div>
            </div>
        </Dashboard>
    );
};

export default StaffDashboard;