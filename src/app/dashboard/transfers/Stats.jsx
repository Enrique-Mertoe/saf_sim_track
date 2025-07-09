import React from 'react';
import {CheckCircle, Clock, Play} from 'lucide-react';
import StatCard from "@/app/dashboard/transfers/StatCard";

export default function Stats({user,dateRange}) {
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
                        textColor="text-gray-900"
                        icon={Play}
                    />
                    <StatCard
                        user={user}
                        dataType={"assigned"}
                        title="Assigned Lines"
                        dateRange={dateRange}
                        textColor="text-gray-900"
                        icon={CheckCircle}
                    />
                    <StatCard
                        expandable={true}
                        user={user}
                        dataType={"picklist"}
                        title="From PickList"
                        dateRange={dateRange}
                        textColor="text-gray-900"
                        icon={Play}
                    />
                    <StatCard
                        user={user}
                        dataType={"n_picklist"}
                        title="Extra/Unknown Sources"
                        dateRange={dateRange}
                        textColor="text-gray-900"
                        icon={Clock}
                    />
                </div>

            </div>
        </div>
    );
}