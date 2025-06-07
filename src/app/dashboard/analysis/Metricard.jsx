import React, {useEffect, useState} from "react";
import simService from "@/services/simService";
import {SIMStatus} from "@/models";

export const MetricCard = ({title, value, user, subtitle, icon: Icon, trend, color = "green", dataType = "total"}) => {
    const [val, sV] = useState(value)
    const fetchMetrics = async () => {
        if (!user) return
        const [reg] = await Promise.all([
            simService.countReg(user, null, [
                {
                    quality: ["quality", SIMStatus.QUALITY],
                    total: [],
                    activated: ["status", SIMStatus.ACTIVATED]
                }[dataType] || []
            ]),
        ]);
        sV(reg.count ?? 0)
    }
    useEffect(() => {
        fetchMetrics().then()
    }, [user]);
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                    <p className={`text-3xl font-bold ${color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-500' : 'text-orange-500'} dark:text-white`}>
                        {typeof val === 'number' ? val.toLocaleString() : val}
                    </p>
                    {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div
                    className={`p-3 rounded-full ${color === 'green' ? 'bg-green-100 dark:bg-green-900' : color === 'red' ? 'bg-red-100 dark:bg-red-900' : 'bg-orange-100 dark:bg-orange-900'}`}>
                    <Icon
                        className={`h-6 w-6 ${color === 'green' ? 'text-green-600 dark:text-green-400' : color === 'red' ? 'text-red-500 dark:text-red-400' : 'text-orange-500 dark:text-orange-400'}`}/>
                </div>
            </div>
            {/*  {trend && (*/}
            {/*      <div className="flex items-center mt-4">*/}
            {/*          {trend > 0 ? (*/}
            {/*              <TrendingUp className="h-4 w-4 text-green-500 mr-1"/>*/}
            {/*          ) : (*/}
            {/*              <TrendingDown className="h-4 w-4 text-red-500 mr-1"/>*/}
            {/*          )}*/}
            {/*          <span className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>*/}
            {/*  {Math.abs(trend)}% vs last period*/}
            {/*</span>*/}
            {/*      </div>*/}
            {/*  )}*/}
        </div>
    );
}