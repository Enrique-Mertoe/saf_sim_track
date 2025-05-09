"use client"
import { useState} from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
    useSalesTrend,
    usePendingApprovals,
    useTeamPerformance
} from "@/hooks/useFirestoreData";

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.5 }
    }
};

export default function AdminSection() {
    // State for the time period selection
    const [timeFrame, setTimeFrame] = useState(5); // Default to 5 months as per the hook's default

    // Using the hooks to fetch data with proper error handling
    const { salesData, loading: salesLoading, error: salesError } = useSalesTrend(undefined, undefined, timeFrame);
    const { approvals: pendingApprovals, loading: approvalsLoading, error: approvalsError } = usePendingApprovals();
    const { teamPerformance, loading: teamLoading, error: teamError } = useTeamPerformance();

    // Handle time frame change
    const handleTimeFrameChange = (e: { target: { value: string; }; }) => {
        setTimeFrame(parseInt(e.target.value));
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Sales Chart */}
                <motion.div
                    className="bg-white rounded-xl shadow-sm p-6"
                    variants={itemVariants}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-800">SIM Sales Trend</h3>
                        <select
                            className="text-sm border rounded-md px-2 py-1"
                            value={timeFrame}
                            onChange={handleTimeFrameChange}
                        >
                            <option value={3}>Last 3 Months</option>
                            <option value={5}>Last 5 Months</option>
                            <option value={6}>Last 6 Months</option>
                            <option value={12}>Last 12 Months</option>
                        </select>
                    </div>

                    {salesLoading ? (
                        <div className="h-72 flex items-center justify-center">
                            <p className="text-gray-500">Loading sales data...</p>
                        </div>
                    ) : salesError ? (
                        <div className="h-72 flex items-center justify-center">
                            <p className="text-red-500">{salesError}</p>
                        </div>
                    ) : (
                        <div className="h-72 flex items-end space-x-4 mt-4">
                            {salesData && salesData.map((data, index) => (
                                <div key={index} className="flex-1 flex flex-col items-center">
                                    <motion.div
                                        className="w-full bg-green-500 rounded-t-md"
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(data.sales / 1000) * 0.24}px` }}
                                        transition={{ duration: 1, delay: index * 0.1 }}
                                    ></motion.div>
                                    <div className="text-xs mt-2 text-gray-600">{data.month}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Pending Approvals */}
                <motion.div
                    className="bg-white rounded-xl shadow-sm p-6"
                    variants={itemVariants}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-800">Pending Approvals</h3>
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            {approvalsLoading ? "Loading..." : `${pendingApprovals?.length || 0} Pending`}
                        </span>
                    </div>

                    {approvalsLoading ? (
                        <div className="h-72 flex items-center justify-center">
                            <p className="text-gray-500">Loading approvals...</p>
                        </div>
                    ) : approvalsError ? (
                        <div className="h-72 flex items-center justify-center">
                            <p className="text-red-500">{approvalsError}</p>
                        </div>
                    ) : (
                        <div className="overflow-y-auto max-h-72">
                            {pendingApprovals && pendingApprovals.length > 0 ? (
                                pendingApprovals.map((approval) => (
                                    <motion.div
                                        key={approval.id}
                                        className="border-b last:border-0 py-3"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="font-medium">{approval.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {approval.role} • {approval.team} • {approval.requestDate.toDate().toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    className="bg-green-100 text-green-600 px-3 py-1 rounded-md text-xs hover:bg-green-200">
                                                    Approve
                                                </button>
                                                <button
                                                    className="bg-red-100 text-red-600 px-3 py-1 rounded-md text-xs hover:bg-red-200">
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-32">
                                    <p className="text-gray-500">No pending approvals</p>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Team Performance Table */}
            <motion.div
                className="bg-white rounded-xl shadow-sm p-6 mb-6"
                variants={itemVariants}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">Team Performance</h3>
                    <button
                        className="text-sm text-green-600 hover:text-green-700 flex items-center">
                        <span>View All Teams</span>
                        <ChevronDown size={16} />
                    </button>
                </div>

                {teamLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-gray-500">Loading team performance data...</p>
                    </div>
                ) : teamError ? (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-red-500">{teamError}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Team
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sales
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Target
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Activation Rate
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Progress
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {teamPerformance && teamPerformance.map((team, index) => (
                                    <tr key={team.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{team.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {team.sales.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {team.target.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                team.activationRate >= 90 ? 'bg-green-100 text-green-800' :
                                                    team.activationRate >= 80 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                            }`}>
                                                {team.activationRate}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <motion.div
                                                    className={`h-2 rounded-full ${
                                                        team.sales / team.target >= 0.9 ? 'bg-green-500' :
                                                            team.sales / team.target >= 0.7 ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                    }`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(team.sales / team.target) * 100}%` }}
                                                    transition={{ duration: 1, delay: index * 0.1 }}
                                                ></motion.div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </>
    );
}