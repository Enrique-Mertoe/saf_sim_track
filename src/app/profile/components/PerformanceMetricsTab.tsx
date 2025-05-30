'use client';

import React, {useEffect, useState} from 'react';
import {User} from '@/models';
import PerformanceMetrics from '@/app/dashboard/staff-components/PerformanceMetrics';
import QualityMetricsCard from '@/app/dashboard/staff-components/QualityMetricsCard';
import SimSalesChart from '@/app/dashboard/staff-components/SimSalesChart';
import {teamService} from '@/services';
import {Award, TrendingDown, TrendingUp} from 'lucide-react';
import useApp from "@/ui/provider/AppProvider";

interface PerformanceMetricsTabProps {
    user: User;
}

const PerformanceMetricsTab: React.FC<PerformanceMetricsTabProps> = ({user}) => {
    const [dateRange, setDateRange] = useState({
        startDate: (() => {
            const date = new Date();
            date.setDate(date.getDate() - 30);
            return date.toISOString().split('T')[0];
        })(),
        endDate: new Date().toISOString().split('T')[0],
    });

    const [duration, setDuration] = useState(30);

    const handleDurationChange = (days: number) => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        setDateRange({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
        });

        setDuration(days);
    };

    return (
        <div className="space-y-6">
            {/* Date Range Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-300">
                <div className="flex flex-wrap items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 sm:mb-0">
                        Performance Metrics
                    </h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleDurationChange(7)}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                duration === 7
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            7 Days
                        </button>
                        <button
                            onClick={() => handleDurationChange(30)}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                duration === 30
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            30 Days
                        </button>
                        <button
                            onClick={() => handleDurationChange(90)}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                duration === 90
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            90 Days
                        </button>
                    </div>
                </div>
            </div>

            {/* Performance Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Summary */}
                <div>
                    {user.role === 'TEAM_LEADER' && user.team_id ? (
                        <PerformanceMetrics
                            dateRange={dateRange}
                            teamId={user.team_id}
                        />
                    ) : (
                        <PerformanceMetrics
                            dateRange={dateRange}
                        />
                    )}
                </div>

                {/* Quality Metrics Card */}
                <div>
                    <QualityMetricsCard
                        userId={user.id}
                        user={user}
                        days={duration}
                    />
                </div>
            </div>

            {/* Performance Chart */}
            <div>
                <SimSalesChart
                    userId={user.id}
                    duration={duration}
                />
            </div>

            {/* Team Performance Section (only for team leaders) */}
            {user.role === 'TEAM_LEADER' && user.team_id && (
                <TeamPerformanceSection
                    teamId={user.team_id}
                    dateRange={dateRange}
                />
            )}
        </div>
    );
};

// Team Performance Section Component
interface TeamPerformanceSectionProps {
    teamId: string;
    dateRange: {
        startDate: string;
        endDate: string;
    };
}

const TeamPerformanceSection: React.FC<TeamPerformanceSectionProps> = ({teamId, dateRange}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [teamMetrics, setTeamMetrics] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const {user: usr} = useApp()

    useEffect(() => {
        setUser(usr)
    }, [usr]);
    useEffect(() => {
        const fetchTeamData = async () => {
            if (!user)
                return;
            setLoading(true);
            setError(null);

            try {
                // Fetch team hierarchy which includes team members
                const {data: hierarchy, error: hierarchyError} = await teamService.getTeamHierarchy(teamId);

                if (hierarchyError || !hierarchy || hierarchy.length === 0) {
                    throw new Error('Failed to fetch team hierarchy');
                }

                // Extract team members from hierarchy
                const members = hierarchy[0]?.staff || [];

                // Fetch team metrics
                const simCardService = await import('@/services/simService');
                const metrics = await simCardService.simCardService.getTeamPerformanceMetrics(
                    teamId,
                    user,
                    dateRange.startDate,
                    dateRange.endDate
                );

                // Fetch individual metrics for each team member
                const membersWithMetrics = await Promise.all(
                    members.map(async (member: any) => {
                        try {
                            const memberMetrics = await simCardService.simCardService.getStaffPerformanceMetrics(
                                member.user_id,
                                user,
                                dateRange.startDate,
                                dateRange.endDate
                            );

                            return {
                                ...member,
                                metrics: memberMetrics
                            };
                        } catch (err) {
                            console.error(`Error fetching metrics for member ${member.id}:`, err);
                            return {
                                ...member,
                                metrics: {
                                    totalSims: 0,
                                    matchedSims: 0,
                                    qualitySims: 0,
                                    performancePercentage: 0
                                }
                            };
                        }
                    })
                );

                setTeamMembers(membersWithMetrics);
                setTeamMetrics(metrics);
            } catch (err) {
                console.error('Error fetching team data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load team data');
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, [teamId, dateRange,user]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Team Performance
                </h3>
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Team Performance
                </h3>
                <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    // Sort team members by performance
    const sortedMembers = [...teamMembers].sort((a, b) =>
        (b.metrics?.performancePercentage || 0) - (a.metrics?.performancePercentage || 0)
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Team Performance
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                As a team leader, you can view the performance metrics of your team members below.
            </p>

            {/* Team Summary */}
            {teamMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Team Sales</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{teamMetrics.totalSims}</p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Team Quality SIMs</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{teamMetrics.qualitySims}</p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Team Performance</p>
                        <p className={`text-2xl font-bold ${
                            teamMetrics.performancePercentage >= 95 ? 'text-green-700 dark:text-green-300' :
                                teamMetrics.performancePercentage >= 90 ? 'text-yellow-700 dark:text-yellow-300' :
                                    'text-red-700 dark:text-red-300'
                        }`}>
                            {teamMetrics.performancePercentage.toFixed(2)}%
                        </p>
                    </div>
                </div>
            )}

            {/* Team Members Performance */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
                    Team Members Performance
                </h4>

                {sortedMembers.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        No team members found
                    </p>
                ) : (
                    <div className="space-y-3">
                        {sortedMembers.map((member) => (
                            <div
                                key={member.id}
                                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div
                                            className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-medium">
                                            {member.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                                        </div>
                                        <div className="ml-3">
                                            <p className="font-medium text-gray-800 dark:text-gray-200">{member.full_name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{member.staff_type || 'Staff'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="text-right mr-3">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                {member.metrics?.totalSims || 0} Sales
                                            </p>
                                            <div className="flex items-center justify-end">
                                                <p className={`text-xs font-medium ${
                                                    (member.metrics?.performancePercentage || 0) >= 95 ? 'text-green-600 dark:text-green-400' :
                                                        (member.metrics?.performancePercentage || 0) >= 90 ? 'text-yellow-600 dark:text-yellow-400' :
                                                            'text-red-600 dark:text-red-400'
                                                }`}>
                                                    {(member.metrics?.performancePercentage || 0).toFixed(2)}% Quality
                                                </p>
                                                {(member.metrics?.performancePercentage || 0) >= 90 ? (
                                                    <TrendingUp
                                                        className="h-3 w-3 ml-1 text-green-600 dark:text-green-400"/>
                                                ) : (
                                                    <TrendingDown
                                                        className="h-3 w-3 ml-1 text-red-600 dark:text-red-400"/>
                                                )}
                                            </div>
                                        </div>

                                        {(member.metrics?.performancePercentage || 0) >= 95 && (
                                            <Award className="h-5 w-5 text-yellow-500"/>
                                        )}
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div
                                    className="mt-2 h-1.5 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${
                                            (member.metrics?.performancePercentage || 0) >= 95 ? 'bg-green-500' :
                                                (member.metrics?.performancePercentage || 0) >= 90 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                        }`}
                                        style={{width: `${Math.min(100, member.metrics?.performancePercentage || 0)}%`}}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PerformanceMetricsTab;
