// src/pages/Reports/components/ResultsSummary.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiRefreshCw, FiPieChart } from 'react-icons/fi';
import { ProcessedReport } from '../types';

interface ResultsSummaryProps {
  processedReport: ProcessedReport;
  onGenerateReports: () => void;
  onProcessNew: () => void;
}

const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  processedReport,
  onGenerateReports,
  onProcessNew
}) => {
  // Calculate percentages for the visual display
  const matchedPercentage = Math.round((processedReport.matchedCount / processedReport.totalCount) * 100);
  const qualityPercentage = Math.round((processedReport.qualityCount / processedReport.totalCount) * 100);

  return (
      
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
    >
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div>
          <h3 className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-2">Processing Results</h3>
          <p className="text-gray-600 dark:text-gray-300">
          Report processed successfully with {processedReport.matchedCount} matches found.
          </p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGenerateReports}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center"
          >
            <FiDownload className="mr-2" />
            Download Report
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onProcessNew}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center"
          >
            <FiRefreshCw className="mr-2" />
            Process New Report
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">Total SIMs</h4>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <FiPieChart className="text-green-600 dark:text-green-400 w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
          {processedReport.totalCount.toLocaleString()}
          </div>
          <p className="text-gray-600 dark:text-gray-300">Total SIMs in the report</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">Matched SIMs</h4>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <FiCheck className="text-green-600 dark:text-green-400 w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
            {processedReport.matchedCount.toLocaleString()}
          </div>
          <div className="flex items-center">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${matchedPercentage}%` }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="bg-green-500 dark:bg-green-400 h-2 rounded-full"
              ></motion.div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300">{matchedPercentage}%</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">Quality SIMs</h4>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <FiStar className="text-purple-600 dark:text-purple-400 w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
          {processedReport.qualityCount.toLocaleString()}
          </div>
          <div className="flex items-center">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${qualityPercentage}%` }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="bg-purple-500 dark:bg-purple-400 h-2 rounded-full"
              ></motion.div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300">{qualityPercentage}%</span>
          </div>
        </motion.div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">Team Summary</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total SIMs
                </th>
              <th scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Matched SIMs
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quality SIMs
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Match Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {processedReport.teamReports.map((team, index) => (
                <tr key={index}
                    className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{team.teamName}</div>
                </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900 dark:text-gray-100">{team.records.length}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900 dark:text-gray-100">{team.matchedCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900 dark:text-gray-100">{team.qualityCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900 dark:text-gray-100">
                      {team.records.length > 0 ? Math.round((team.matchedCount / team.records.length) * 100) : 0}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

// Import the missing FiStar icon
import { FiStar, FiCheck } from 'react-icons/fi';

export default ResultsSummary;