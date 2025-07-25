import React, {useEffect, useState} from "react";
import simService from "@/services/simService";
import {SIMStatus} from "@/models";
import {currentWave} from "@/helper";

export const MetricCard = ({
                               title,
                               value,
                               user,
                               dateFilters,
                               icon: Icon,
                               trend,
                               color = "green",
                               dataType = "total",
                               className = ''
                           }) => {
    const [val, sV] = useState(value)
    const fetchMetrics = async () => {
        if (!user) return
        const wave = currentWave(dateFilters.startDate,dateFilters.endDate)
        const dateConditions = [];
        if (dateFilters && dateFilters.startDate) {
            dateConditions.push(["activation_date", "gte", wave.start]);
        }
        if (dateFilters && dateFilters.endDate) {
            dateConditions.push(["activation_date", "lte", wave.end]);
        }


        const [reg] = await Promise.all([
            simService.countReg(user, null, [
                {
                    quality: ["quality", SIMStatus.QUALITY],
                    total: [],
                    nonQuality: ["quality", SIMStatus.NONQUALITY],
                    activated: ["status", SIMStatus.ACTIVATED],

                }[dataType] || [],
                ["status", SIMStatus.ACTIVATED],
                ...dateConditions,
            ]),
        ]);
        sV(reg.count ?? 0)
    }
    useEffect(() => {
        fetchMetrics().then()
    }, [user, dateFilters]);
    return (
        <div
            className={`bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                    <p className={`text-xl font-bold ${color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-500' : 'text-amber-500'} dark:text-white`}>
                        {typeof val === 'number' ? val.toLocaleString() : val}
                    </p>
                    {/*{subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}*/}
                </div>
                <div
                    className={`p-3 rounded-full ${color === 'green' ? 'bg-green-100 dark:bg-green-900' : color === 'red' ? 'bg-red-100 dark:bg-red-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
                    <Icon
                        className={`h-6 w-6 ${color === 'green' ? 'text-green-600 dark:text-green-400' : color === 'red' ? 'text-red-500 dark:text-red-400' : 'text-amber-500 dark:text-amber-400'}`}/>
                </div>
            </div>
        </div>
    );
}