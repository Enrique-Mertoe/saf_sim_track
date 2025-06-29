import {useEffect, useState} from "react";
import simService from "@/services/simService";
import {ArrowUpRight} from 'lucide-react';


const StatCard = ({
                      title,
                      user,
                      change,
                      trend,
                      dateRange,
                      textColor,
                      icon: Icon,
                      expandable = false,
                      dataType = "general",
                      className = ""
                  }) => {
    const [value, sV] = useState(0)
    useEffect(() => {

        const fetchData = async () => {
            if (!user) return
            const dateConditions = [];
            if (dateRange && dateRange.startDate) {
                dateConditions.push(["created_at", "gte", dateRange.startDate]);
            }
            if (dateRange && dateRange.endDate) {
                dateConditions.push(["created_at", "lte", dateRange.endDate]);
            }
            const data = await {
                general: simService.countAll(user, [
                    ...(dateConditions || [])
                ]),
                assigned: simService.countAll(user, [
                    ["assigned_to_user_id", "not", "is", null],
                    ...(dateConditions || [])
                ]), picklist: simService.countAll(user, [
                    ["batch_id", "neq", "BATCH-UNKNOWN"],
                    ...(dateConditions || [])
                ]),
                n_picklist: simService.countAll(user, [
                    ["batch_id", "BATCH-UNKNOWN"],
                    ...(dateConditions || [])
                ]),
            }[dataType]
            sV(data.count ?? 0)
        }

        fetchData().then(data => {
        })

    }, [user, dateRange]);
    return (
        <>
            <style jsx>{`
                @keyframes swayRightTop {
                    0%, 100% {
                        transform: translate(0, 0) rotate(0deg);
                    }
                    //25% { transform: translate(2px, -1px) rotate(1deg); }
                    50% {
                        transform: translate(4px, -2px) rotate(-1deg);
                    }
                }

                .sway-icon {
                    animation: swayRightTop 1.5s linear infinite;
                }
            `}</style>

            <div
                // onClick={()=>{
                //     if (expandable) {
                //         showModal({
                //             content:onClose => {
                //                 return <LineBreakDown dataType={dataType} onClose={onClose} user={user}/>
                //             }
                //         })
                //     }
                // }}

                className={`${textColor} border border-gray-500 rounded-2xl max-sm:p-2 px-6 py-2 transition-all duration-300 cursor-pointer ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium opacity-90">{title}</h3>
                    <div
                        className={`flex items-center space-x-2 ${expandable ? 'sway-icon text-amber-800 shadow-sm shadow-amber-400 rounded' : ''}`}>
                        <Icon className={`w-5 h-5 opacity-70 `}/>
                        <ArrowUpRight className="w-4 h-4 opacity-50"/>
                    </div>
                </div>
                <div className="mb-3">
                    <span className="text-4xl max-sm:text-xl font-bold">{value}</span>
                </div>
                {/*<div className="flex items-center text-xs opacity-75">*/}
                {/*    {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1"/>}*/}
                {/*    <span>{change}</span>*/}
                {/*</div>*/}
            </div>
        </>
    );
}

export default StatCard;
