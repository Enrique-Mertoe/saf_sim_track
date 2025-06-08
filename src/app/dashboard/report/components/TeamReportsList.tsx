// src/pages/Reports/components/TeamReportsList.tsx
import React, {useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {FiChevronDown, FiChevronUp, FiDatabase, FiPlus, FiUsers} from 'react-icons/fi';
import {TeamReport} from '../types';
import {SIMStatus, User} from '@/models';
import {teamService} from '@/services/teamService';
import simCardService from '@/services/simService';
import alert from "@/ui/alert";
import {parseDateToYMD} from "@/helper";

interface TeamReportsListProps {
    teamReports: TeamReport[];
    user?: User;
}

const TeamReportsList: React.FC<TeamReportsListProps> = ({teamReports, user}) => {
    const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [currentRecord, setCurrentRecord] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const toggleTeam = (teamName: string) => {
        if (expandedTeam === teamName) {
            setExpandedTeam(null);
        } else {
            setExpandedTeam(teamName);
        }
    };

    const handleAddAllToSystem = async (team: TeamReport) => {
        if (!user) return;
        alert.confirm({
            title:"Sim creation",
            message:`All <strong>{team.records.length}</strong> SIM cards from the "Unknown" team will be added
                            to the system under the "Unknown Team".`,
            type:alert.INFO,
            onCancel:()=>{},
            task: async ()=>{
              return  await handleConfirmAdd(team)
            }

        });
    };

    const handleConfirmAdd = async (currentRecord:any) => {
        if (!user || !currentRecord) return;

        setIsProcessing(true);
        try {
            // Check if there's a team with name "unknown team" and admin_id is the user
            const {data: teams} = await teamService.getAllTeams(user);
            let unknownTeam = teams?.find(team => team.name.toLowerCase() === "unknown team" && team.admin_id === user.id);

            // If not, create such a team
            if (!unknownTeam) {
                const {data: newTeam} = await teamService.createTeam({
                    name: "Unknown Team",
                    leader_id: user.id,
                    region: "Unknown",
                    admin_id: user.id
                });

                if (newTeam && newTeam.length > 0) {
                    unknownTeam = newTeam[0];
                }
            }

            if (unknownTeam) {
                // Add all serials to that team in batches of 250
                const team = currentRecord as TeamReport;
                const batchSize = 250;
                // Prepare all SIM cards data
                const simCardsData = team.records.map(record => ({
                    batch_id: "BATCH-UNKNOWN",
                    registered_by_user_id: user!.id,
                    serial_number: record.simSerialNumber,
                    team_id: unknownTeam.id,
                    admin_id: user.id,
                    status: SIMStatus.ACTIVATED,
                    registered_on : (new Date(record.tmDate)).toISOString().split('T')[0],
                    activation_date : parseDateToYMD(record.topUpDate),
                    match: SIMStatus.UNMATCH,
                    quality: record.qualitySim ? SIMStatus.QUALITY : SIMStatus.NONQUALITY,
                    top_up_amount: +record.topUpAmount || null,
                    usage: +record.cumulativeUsage || null
                }));

                // Process in batches of 250
                const result = await simCardService.createSIMCardBatch(
                    simCardsData,
                    batchSize,
                    (percent, sofar, chunk, errors) => {
                        // Update progress message
                        if (percent < 100) {
                            alert.info(`Processing: ${percent}% complete (${sofar}/${simCardsData.length} SIM cards processed)`);
                        }
                    }
                );

                if (result.success > 0) {
                    alert.success(`${result.success} SIM cards have been added to the system under the "Unknown Team".`);
                    return `${result.success} SIM cards have been added to the system under the "Unknown Team".`;
                } else {
                    alert.error(`Failed to add SIM cards. Errors: ${result.errors.map(e => e.message).join(', ')}`);
                    throw "Failed to add SIM cards to the system.";
                }
            } else {
                alert.error("Failed to create or find the Unknown Team.");
                throw "Failed to create or find the Unknown Team.";
            }
        } catch (error) {
            alert.error("An error occurred while adding the SIM cards to the system.");
            throw "An error occurred while adding the SIM cards to the system.";
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <div className="space-y-4">
                {teamReports.map((team, index) => (
                    <motion.div
                        key={team.teamName}
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: index * 0.1}}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                        <div
                            className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => toggleTeam(team.teamName)}
                        >
                            <div className="flex items-center">
                                <div
                                    className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                                    <FiUsers className="text-green-600 w-5 h-5"/>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">{team.teamName}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {team.records.length} SIMs, {team.matchedCount} matched, {team.qualityCount} quality
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center">
                <span className="mr-2 text-sm font-medium text-gray-900 dark:text-white">
                  {Math.round((team.matchedCount / team.records.length) * 100)}% Match Rate
                </span>
                                {team.teamName === 'Unknown' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddAllToSystem(team).then();
                                        }}
                                        className="mr-3 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center"
                                        title="Add all to system"
                                    >
                                        <FiPlus size={14} className="mr-1"/> Add All
                                    </button>
                                )}
                                {expandedTeam === team.teamName ? (
                                    <FiChevronUp className="text-gray-500"/>
                                ) : (
                                    <FiChevronDown className="text-gray-500"/>
                                )}
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedTeam === team.teamName && (
                                <motion.div
                                    initial={{height: 0, opacity: 0}}
                                    animate={{height: 'auto', opacity: 1}}
                                    exit={{height: 0, opacity: 0}}
                                    transition={{duration: 0.3}}
                                    className="border-t border-gray-200"
                                >
                                    <div className="px-6 py-4">
                                        <div className="flex items-center mb-4">
                                            <FiDatabase className="text-gray-500 mr-2"/>
                                            <h4 className="font-medium text-gray-800 dark:text-gray-200">Records
                                                Sample</h4>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th scope="col"
                                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Serial Number
                                                    </th>
                                                    <th scope="col"
                                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Top Up
                                                    </th>
                                                    <th scope="col"
                                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Dealer
                                                    </th>
                                                    <th scope="col"
                                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Uploaded By
                                                    </th>
                                                    <th scope="col"
                                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody
                                                    className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {team.records.slice(0, 5).map((record, idx) => (
                                                    <tr key={idx}
                                                        className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                                            {record.simSerialNumber}
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                                            {record.topUpAmount}
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                                            {record.dealerName}
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                                            {record.uploadedBy}
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <div className="flex items-center space-x-2">
                                  <span
                                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          record.qualitySim ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' :
                                              record.matched ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' :
                                                  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                      }`}>
                                    {record.qualitySim ? 'Quality' : record.matched ? 'Matched' : 'Unmatched'}
                                  </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                            {team.records.length > 5 && (
                                                <div
                                                    className="text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                                                    + {team.records.length - 5} more records
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </>
    );
};

export default TeamReportsList;
