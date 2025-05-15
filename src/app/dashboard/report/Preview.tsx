import {useState} from "react";
import {SIMCard, Team, User} from "@/models";

type Team1 = Team & {
    leader_id: User
}
type SimCard = SIMCard & {
    sold_by_user_id: User;
    team_id: Team1;
    quality:string;
};
export const ReportPreview = ({
                                  simData,
                                  teamPerformance,
                                  periodsLabels,
                                  startDate,
                                  endDate,
                                  isLoading
                              }: any) => {
    const [activeTab, setActiveTab] = useState('summary');
    const [teamFilter, setTeamFilter] = useState('all');
    const [qualityFilter, setQualityFilter] = useState('all');

    const uniqueTeams = Array.from(new Set(simData.map((sim: {
        team_name: any;
    }) => sim.team_name || 'Unknown'))).sort();

    const filteredSimData: SimCard[] = simData.filter((sim: { team_name: string; quality: string; }) => {
        if (teamFilter !== 'all' && sim.team_name !== teamFilter) return false;
        if (qualityFilter === 'quality' && sim.quality !== 'Y') return false;
        if (qualityFilter === 'non-quality' && sim.quality === 'Y') return false;
        return true;
    });

    // Helper function to format date for display
    const formatDateDisplay = (dateStr: string | number | Date | undefined) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
        );
    }

    if (!simData.length) {
        return null;
    }

    return (
        <div className="w-full text-sm bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap">
                    <button
                        className={`px-4 py-2.5 text-sm font-medium ${activeTab === 'summary' ? 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-b-2 border-green-500' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        onClick={() => setActiveTab('summary')}
                    >
                        Performance Summary
                    </button>
                    <button
                        className={`px-4 py-2.5 text-sm font-medium ${activeTab === 'data' ? 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-b-2 border-green-500' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        onClick={() => setActiveTab('data')}
                    >
                        SIM Data
                    </button>
                </div>
            </div>

            <div className="p-4 dark:bg-gray-800">
                {activeTab === 'summary' && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                            Performance Report ({formatDateDisplay(startDate)} - {formatDateDisplay(endDate)})
                        </h3>

                        {periodsLabels.map((periodLabel: any, periodIndex: number) => (
                            <div key={periodLabel} className="mb-6">
                                <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-3 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                    {periodLabel}
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {teamPerformance.map((team: any, index: number) => {
                                        const periodData = team.periods[periodLabel];
                                        if (!periodData) return null;

                                        return (
                                            <div
                                                key={`${team.teamName}-${index}`}
                                                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 hover:shadow transition-shadow duration-200"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h5 className="font-medium text-gray-900 dark:text-gray-100">{team.teamName}</h5>
                                                        <p className="text-xs text-gray-600 dark:text-gray-300">Led
                                                            by {team.leader}</p>
                                                    </div>
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            periodData.comment === 'Well done'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                        }`}
                                                    >
                  {periodData.comment}
                </span>
                                                </div>

                                                <div
                                                    className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-2">
                                                    <span>Activations: {periodData.totalActivation}</span>
                                                    <span>Quality: {periodData.qualityCount}</span>
                                                </div>

                                                <div className="mt-2">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span
                                                            className="text-xs font-medium text-gray-700 dark:text-gray-300">Performance</span>
                                                        <span
                                                            className={`text-xs font-bold ${
                                                                periodData.percentagePerformance >= 90
                                                                    ? 'text-green-600 dark:text-green-400'
                                                                    : 'text-yellow-600 dark:text-yellow-400'
                                                            }`}
                                                        >
                    {periodData.percentagePerformance.toFixed(1)}%
                  </span>
                                                    </div>
                                                    <div
                                                        className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                                        <div
                                                            className={`h-1.5 rounded-full ${periodData.percentagePerformance >= 90 ? 'bg-green-600 dark:bg-green-500' : 'bg-yellow-500 dark:bg-yellow-400'}`}
                                                            style={{width: `${Math.min(periodData.percentagePerformance, 100)}%`}}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'data' && (
                    <div className={"w-full"}>
                        <div className="flex flex-wrap items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                SIM Card Data Preview
                            </h3>

                            <div className="flex space-x-2 mt-2 sm:mt-0">
                                <select
                                    value={teamFilter}
                                    onChange={(e) => setTeamFilter(e.target.value)}
                                    className="rounded-md border border-gray-300 dark:border-gray-600 py-1.5 px-3 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="all">All Teams</option>
                                    {uniqueTeams.map((team: any, index: number) => (
                                        <option key={team + index} value={team}>{team}</option>
                                    ))}
                                </select>

                                <select
                                    value={qualityFilter}
                                    onChange={(e) => setQualityFilter(e.target.value)}
                                    className="rounded-md border border-gray-300 dark:border-gray-600 py-1.5 px-3 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="all">All SIMs</option>
                                    <option value="quality">Quality SIMs</option>
                                    <option value="non-quality">Non-Quality SIMs</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-2 sm:mt-0 mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {filteredSimData.length} of {simData.length} SIM records
                    </span>
                        </div>

                        <div className="border w-full rounded-lg overflow-hidden dark:border-gray-700">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y table-auto w-full border dark:border-gray-600">
                                    <thead className="bg-gray-50 dark:bg-gray-750">
                                    <tr className="bg-gray-100 dark:bg-gray-800">
                                        <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Serial</th>
                                        <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Team</th>
                                        <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Activation
                                            Date
                                        </th>
                                        <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Top Up
                                            Date
                                        </th>
                                        <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Top Up
                                            Amount
                                        </th>
                                        <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Bundle
                                            Purchase
                                            Date
                                        </th>
                                        <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Bundle
                                            Amount
                                        </th>
                                        <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Usage</th>
                                        <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">Till/Mobigo
                                            MSISDN
                                        </th>
                                        <th className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">BA
                                            MSISDN
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody
                                        className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredSimData.slice(0, 50).map((sim, index) => (
                                        <tr key={sim.serial_number || index} className="dark:hover:bg-gray-750">
                                            <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">
                                                {sim.serial_number}
                                            </td>
                                            <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">
                                                {sim.team_id.name || 'Unknown'}
                                            </td>
                                            <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">
                                                {formatDateDisplay(sim.activation_date)}
                                            </td>
                                            <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">
                                                {formatDateDisplay(sim.top_up_date)}
                                            </td>
                                            <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">
                                                {sim.top_up_amount ? (
                                                    <span className="font-medium">
                                                Kes {sim.top_up_amount.toFixed(2)}
                                                        <div className="text-xs dark:text-gray-400">
                                                    {formatDateDisplay(sim.top_up_date)}
                                                </div>
                                            </span>
                                                ) : '-'}
                                            </td>
                                            <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">
                                                {sim.bundle_amount ? (
                                                    <span className="font-medium">
                                                Kes {sim.bundle_amount.toFixed(2)}
                                                        <div className="text-xs dark:text-gray-400">
                                                    {formatDateDisplay(sim.bundle_purchase_date)}
                                                </div>
                                            </span>
                                                ) : '-'}
                                            </td>
                                            <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">
                                                <div>Agent: {sim.agent_msisdn || '-'}</div>
                                                <div>BA: {sim.ba_msisdn || '-'}</div>
                                            </td>
                                            <td className="border px-2 py-1 dark:border-gray-600 dark:text-gray-200">
                                        <span
                                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                sim.quality === 'Y'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                            {sim.quality === 'Y' ? 'Yes' : 'No'}
                                        </span>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredSimData.length > 50 && (
                                <div
                                    className="bg-gray-50 dark:bg-gray-750 px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                                    Showing 50 of {filteredSimData.length} records. Use the export feature to see all
                                    records.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};