import {useState} from "react";
import {SIMCard} from "@/models";

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

    const uniqueTeams = Array.from(new Set(simData.map(sim => sim.team_name || 'Unknown'))).sort();

    const filteredSimData = simData.filter(sim => {
        if (teamFilter !== 'all' && sim.team_name !== teamFilter) return false;
        if (qualityFilter === 'quality' && sim.quality !== 'Y') return false;
        if (qualityFilter === 'non-quality' && sim.quality === 'Y') return false;
        return true;
    });

    // Helper function to format date for display
    const formatDateDisplay = (dateStr) => {
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
            <div className="w-full p-6 bg-white rounded-lg shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2.5"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2.5"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2.5"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2.5"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
        );
    }

    if (!simData.length) {
        return null;
    }

    return (
        <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-gray-200">
                <div className="flex flex-wrap">
                    <button
                        className={`px-4 py-2.5 text-sm font-medium ${activeTab === 'summary' ? 'bg-green-50 text-green-700 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('summary')}
                    >
                        Performance Summary
                    </button>
                    <button
                        className={`px-4 py-2.5 text-sm font-medium ${activeTab === 'data' ? 'bg-green-50 text-green-700 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('data')}
                    >
                        SIM Data
                    </button>
                </div>
            </div>

            <div className="p-4">
                {activeTab === 'summary' && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Performance Report ({formatDateDisplay(startDate)} - {formatDateDisplay(endDate)})
                        </h3>

                        {periodsLabels.map((periodLabel, periodIndex) => (
                            <div key={periodLabel} className="mb-8">
                                <h4 className="text-md font-medium text-gray-700 mb-2 bg-gray-100 p-2 rounded">
                                    {periodLabel}
                                </h4>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Team
                                            </th>
                                            <th scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Leader
                                            </th>
                                            <th scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Activations
                                            </th>
                                            <th scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Quality Count
                                            </th>
                                            <th scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Performance %
                                            </th>
                                            <th scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Comment
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        {teamPerformance.map((team, index) => {
                                            const periodData = team.periods[periodLabel];
                                            if (!periodData) return null;

                                            return (
                                                <tr key={`${team.teamName}-${index}`} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {team.teamName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {team.leader}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {periodData.totalActivation}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {periodData.qualityCount}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex items-center">
                                                                <span
                                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                        periodData.percentagePerformance >= 90 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                    {periodData.percentagePerformance.toFixed(2)}%
                                                                </span>
                                                            <div className="ml-4 w-16 bg-gray-200 rounded-full h-2.5">
                                                                <div
                                                                    className={`h-2.5 rounded-full ${periodData.percentagePerformance >= 90 ? 'bg-green-600' : 'bg-yellow-500'}`}
                                                                    style={{width: `${Math.min(periodData.percentagePerformance, 100)}%`}}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <span
                                                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                    periodData.comment === 'Well done' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {periodData.comment}
                                                            </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'data' && (
                    <div>
                        <div className="flex flex-wrap items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                SIM Card Data Preview
                            </h3>

                            <div className="flex space-x-2 mt-2 sm:mt-0">
                                <select
                                    value={teamFilter}
                                    onChange={(e) => setTeamFilter(e.target.value)}
                                    className="rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="all">All Teams</option>
                                    {uniqueTeams.map(team => (
                                        <option key={team} value={team}>{team}</option>
                                    ))}
                                </select>

                                <select
                                    value={qualityFilter}
                                    onChange={(e) => setQualityFilter(e.target.value)}
                                    className="rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="all">All SIMs</option>
                                    <option value="quality">Quality SIMs</option>
                                    <option value="non-quality">Non-Quality SIMs</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-2 sm:mt-0 mb-2">
                            <span className="text-sm text-gray-500">
                                Showing {filteredSimData.length} of {simData.length} SIM records
                            </span>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Serial Number
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Team
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Activation Date
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Top Up
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bundle
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            MSISDNs
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Quality
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredSimData.slice(0, 50).map((sim, index) => (
                                        <tr key={sim.sim_id || index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {sim.sim_serial_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {sim.team_name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDateDisplay(sim.activation_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {sim.top_up_amount ? (
                                                    <span className="font-medium">
                                                            Kes {sim.top_up_amount.toFixed(2)}
                                                        <div className="text-xs text-gray-400">
                                                                {formatDateDisplay(sim.top_up_date)}
                                                            </div>
                                                        </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {sim.bundle_amount ? (
                                                    <span className="font-medium">
                                                            Kes {sim.bundle_amount.toFixed(2)}
                                                        <div className="text-xs text-gray-400">
                                                                {formatDateDisplay(sim.bundle_purchase_date)}
                                                            </div>
                                                        </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div>Agent: {sim.agent_msisdn || '-'}</div>
                                                <div>BA: {sim.ba_msisdn || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span
                                                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            sim.quality === 'Y' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
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