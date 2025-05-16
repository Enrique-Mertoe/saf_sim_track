// src/pages/Reports/components/TeamReportsList.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronUp, FiUsers, FiDatabase } from 'react-icons/fi';
import { TeamReport } from '../types';

interface TeamReportsListProps {
  teamReports: TeamReport[];
}

const TeamReportsList: React.FC<TeamReportsListProps> = ({ teamReports }) => {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const toggleTeam = (teamName: string) => {
    if (expandedTeam === teamName) {
      setExpandedTeam(null);
    } else {
      setExpandedTeam(teamName);
    }
  };

  return (
    <div className="space-y-4">
      {teamReports.map((team, index) => (
        <motion.div
          key={team.teamName}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
        >
          <div
            className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleTeam(team.teamName)}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <FiUsers className="text-green-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{team.teamName}</h3>
                <p className="text-sm text-gray-500">
                  {team.records.length} SIMs, {team.matchedCount} matched, {team.qualityCount} quality
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-2 text-sm font-medium text-gray-900">
                {Math.round((team.matchedCount / team.records.length) * 100)}% Match Rate
              </span>
              {expandedTeam === team.teamName ? (
                <FiChevronUp className="text-gray-500" />
              ) : (
                <FiChevronDown className="text-gray-500" />
              )}
            </div>
          </div>

          <AnimatePresence>
            {expandedTeam === team.teamName && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-gray-200"
              >
                <div className="px-6 py-4">
                  <div className="flex items-center mb-4">
                    <FiDatabase className="text-gray-500 mr-2" />
                    <h4 className="font-medium text-gray-800">Records Sample</h4>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Serial Number
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Top Up
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dealer
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Uploaded By
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {team.records.slice(0, 5).map((record, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {record.simSerialNumber}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {record.topUpAmount}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {record.dealerName}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {record.uploadedBy}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                record.qualitySim ? 'bg-green-100 text-green-800' : 
                                record.matched ? 'bg-green-100 text-green-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {record.qualitySim ? 'Quality' : record.matched ? 'Matched' : 'Unmatched'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {team.records.length > 5 && (
                      <div className="text-center py-2 text-sm text-gray-500">
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
  );
};

export default TeamReportsList;