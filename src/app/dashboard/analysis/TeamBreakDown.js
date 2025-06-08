import {useEffect, useState} from "react";
import {AlertTriangle, TrendingDown, XCircle} from "lucide-react";
import simService from "@/services/simService";

const TeamBreakdownCard = ({team, user}) => {
    const teamId = team.id;
    const [totalRecorded, settotalRecorded] = useState(0)
    const [quality, setquality] = useState(0)
    const [matched, setmatched] = useState(0)
    const [breakdown, sB] = useState({})

    const fetchMetrics = async () => {
        if (!user) return
        const [reg, qlty, mtc] = await Promise.all([
            simService.countReg(user, teamId),
            simService.countQuality(user, teamId, [["registered_on", "not", "is", null]]),
            simService.countMatch(user, teamId, [["registered_on", "not", "is", null]]),
        ]);
        setquality(qlty.count ?? 0)
        settotalRecorded(reg.count ?? 0)
        setmatched(mtc.count ?? 0)
    }

    const fetchBreakDown = async () => {
        if (!user) return
        const data = await simService.countTopUpCategories(user, [["team_id", teamId]])
        sB(data)
    }

    useEffect(() => {
        fetchMetrics().then()
        fetchBreakDown().then()
    }, [user]);

    const matchRate = totalRecorded > 0 ? ((matched / totalRecorded) * 100).toFixed(2) : 0;
    const qualityRate = matched > 0 ? ((quality / matched) * 100).toFixed(2) : 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{team.name}</h3>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                    qualityRate >= 95 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        qualityRate >= 90 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                    {qualityRate >= 95 ? 'Well Done' : qualityRate >= 90 ? 'Improve' : 'Needs Attention'}
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-2 text-xs">
                <div>
                    <p className="text-gray-600 dark:text-gray-400">Total</p>
                    <p className="font-bold text-gray-900 dark:text-white">{totalRecorded}</p>
                </div>
                <div>
                    <p className="text-gray-600 dark:text-gray-400">Match</p>
                    <p className="font-bold text-green-600 dark:text-green-400">{matchRate}%</p>
                </div>
                <div>
                    <p className="text-gray-600 dark:text-gray-400">Quality</p>
                    <p className="font-bold text-green-600 dark:text-green-400">{quality}</p>
                </div>
                <div>
                    <p className="text-gray-600 dark:text-gray-400">Q Rate</p>
                    <p className="font-bold text-green-600 dark:text-green-400">{qualityRate}%</p>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <TrendingDown className="w-3 h-3 text-red-500" />
                            <span className="text-gray-600 dark:text-gray-400">&lt;50 KES</span>
                        </div>
                        <span className="text-red-500 font-medium">{breakdown.lt50}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-500" />
                            <span className="text-gray-600 dark:text-gray-400">No Top-up</span>
                        </div>
                        <span className="text-red-500 font-medium">{breakdown.noTopUp}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                            <span className="text-gray-600 dark:text-gray-400">≥50 Not Conv</span>
                        </div>
                        <span className="text-orange-500 font-medium">{breakdown.gte50NotConverted}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeamBreakdownCard;