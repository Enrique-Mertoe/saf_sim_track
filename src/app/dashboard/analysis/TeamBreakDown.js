import {useEffect, useState} from "react";
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
            simService.countQuality(user, teamId, [
                ["registered_on", "not", "is", null]
            ]),
            simService.countMatch(user, teamId, [
                ["registered_on", "not", "is", null]
            ]),
        ]);

        setquality(qlty.count ?? 0)
        settotalRecorded(reg.count ?? 0)
        setmatched(mtc.count ?? 0)
    }

    const fetchBreakDown = async () => {
        if (!user) return
        const data = await simService.countTopUpCategories(user, [
            ["team_id", teamId]
        ])
        sB(data)
    }
    useEffect(() => {
        fetchMetrics().then()
        fetchBreakDown().then()
    }, [user]);

    const matchRate = totalRecorded > 0 ? ((matched / totalRecorded) * 100).toFixed(2) : 0;
    const qualityRate = matched > 0 ? ((quality / matched) * 100).toFixed(2) : 0;

    return (

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{team.name}</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    team.qualityRate >= 95 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        team.qualityRate >= 90 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                    {team.qualityRate >= 95 ? 'Well Done' : team.qualityRate >= 90 ? 'Improve' : 'Needs Attention'}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Recorded</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{totalRecorded.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Match Rate</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{matchRate}%</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quality</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{quality.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quality Rate</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{qualityRate}%</p>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Non-Quality Breakdown</h4>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Top-up &lt; 50 KES</span>
                        <span className="text-red-500 font-medium">{breakdown.lt50}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">No Top-up</span>
                        <span className="text-red-500 font-medium">{breakdown.noTopUp}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Top-up ≥50 Not Converted</span>
                        <span className="text-orange-500 font-medium">{breakdown.gte50NotConverted}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeamBreakdownCard;