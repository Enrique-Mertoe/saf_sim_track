import React, {useState} from 'react';
import {CheckCircle, Clock, Play} from 'lucide-react';
import StatCard from "@/app/dashboard/transfers/StatCard";

export default function Stats({user,dateRange}) {
    const [stats] = useState({
        total: {value: 24, change: 'Increased from last month', trend: 'up'},
        ended: {value: 10, change: 'Increased from last month', trend: 'up'},
        running: {value: 12, change: 'Increased from last month', trend: 'up'},
        pending: {value: 2, change: 'On Discuss', trend: 'neutral'}
    });


    return (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 mb-8">
            <div className="max-w-7xl mx-auto">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <StatCard
                        dateRange={dateRange}
                        user={user}
                        dataType={"general"}
                        title="Total Lines"
                        change={stats.total.change}
                        trend={stats.total.trend}
                        textColor="text-gray-900"
                        icon={Play}
                    />
                    <StatCard
                        user={user}
                        dataType={"assigned"}
                        title="Assigned Lines"
                        change={stats.ended.change}
                        trend={stats.ended.trend}
                        dateRange={dateRange}
                        textColor="text-gray-900"
                        icon={CheckCircle}
                    />
                    <StatCard
                        expandable={true}
                        user={user}
                        dataType={"picklist"}
                        title="From PickList"
                        change={stats.running.change}
                        trend={stats.running.trend}
                        dateRange={dateRange}
                        textColor="text-gray-900"
                        icon={Play}
                    />
                    <StatCard
                        user={user}
                        dataType={"n_picklist"}
                        title="Extra/Unknown Sources"
                        change={stats.pending.change}
                        trend={stats.pending.trend}
                        dateRange={dateRange}
                        textColor="text-gray-900"
                        icon={Clock}
                    />
                </div>

            </div>
        </div>
    );
}