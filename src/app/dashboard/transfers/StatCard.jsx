import {useEffect, useState} from "react";
import simService from "@/services/simService";
import {Plus, Upload, TrendingUp, CheckCircle, Play, Clock, ArrowUpRight} from 'lucide-react';


const StatCard = ({title, user, change, trend, bgColor, textColor, icon: Icon, dataType = "general",className=""}) => {
    const [value, sV] = useState(0)
    useEffect(() => {

        const fetchData = async () => {
            if (!user) return
            const data = await {
                general: simService.countAll(user),
                assigned: simService.countAll(user, [
                    ["assigned_to_user_id", "not", "is", null],
                ]), picklist: simService.countAll(user, [
                    ["batch_id", "neq", "BATCH-UNKNOWN"],
                ]),
                n_picklist: simService.countAll(user, [
                    ["batch_id", "BATCH-UNKNOWN"],
                ]),
            }[dataType]
            sV(data.count ?? 0)
        }

        fetchData().then(data => {
        })

    }, [user]);
    return (


        <div
            className={`${textColor}  border border-gray-500  rounded-2xl px-6 py-2 transition-all duration-300 hover:scale-105 cursor-pointer ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium opacity-90">{title}</h3>
                <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 opacity-70"/>
                    <ArrowUpRight className="w-4 h-4 opacity-50"/>
                </div>
            </div>
            <div className="mb-3">
                <span className="text-4xl font-bold">{value}</span>
            </div>
            {/*<div className="flex items-center text-xs opacity-75">*/}
            {/*    {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1"/>}*/}
            {/*    <span>{change}</span>*/}
            {/*</div>*/}
        </div>
    );
}

export default StatCard;