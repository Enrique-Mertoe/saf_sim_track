import {useEffect, useState} from "react";
import useApp from "@/ui/provider/AppProvider";
import simService from "@/services/simService";
import {DateTime} from "luxon";

export const TeamLeaderStatCard = ({title, dataType, subtitle, icon: Icon, color = "blue"}) => {
    const [value, sV] = useState(0)
    const user = useApp().user;

    const fetchMetrics = async () => {
        if (!user || !user.team_id) return;
        const data = await {
            total: simService.countAll(user),
            registered: simService.countAll(user, [
                ["registered_on", "not", "is", null]
            ]),
            unassigned: simService.countAll(user, [["assigned_to_user_id", "is", null]]),
            "registered-today": simService.countReg(user, user.team_id, [
                ["registered_on", "gte", DateTime.now().setZone("Africa/Nairobi").startOf("day").toJSDate().toISOString()]
            ]),
        }[dataType || "today"]
        sV(data.count ?? 0);
    }
    useEffect(() => {
        fetchMetrics().then()
    }, [user]);
    return (
        <div
            className="bg-white dark:bg-gray-800 rounded-lg px-6 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                    <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>

                </div>
                <div className={`p-3 bg-${color}-100 dark:bg-${color}-900/30 rounded-full`}>
                    <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`}/>
                </div>
            </div>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
    );
}