// src/pages/Reports/components/ProcessingSection.tsx
import React from 'react';
import {motion} from 'framer-motion';
import {FiArrowLeft, FiCalendar, FiCpu} from 'react-icons/fi';
import {Report} from '../types';

interface ProcessingSectionProps {
  reportData: Report;
  isProcessing: boolean;
  processingProgress: number;
  handleProcessReport: () => void;
  onBack: () => void;
  filterType: 'daily' | 'weekly' | 'monthly' | 'custom';
  setFilterType: (type: 'daily' | 'weekly' | 'monthly' | 'custom') => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
}

const ProcessingSection: React.FC<ProcessingSectionProps> = ({
  reportData,
  isProcessing,
  processingProgress,
  handleProcessReport,
  onBack,
  filterType,
  setFilterType,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}) => {
  return (

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border rounded-lg p-6 dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">Report Details</h3>
        <button
            onClick={onBack}
            className="flex items-center text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
            disabled={isProcessing}
        >
          <FiArrowLeft className="mr-1" /> Back
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Records</p>
          <p className="text-xl font-semibold dark:text-white">{reportData.records.length}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Date Range</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm font-semibold dark:text-white">{startDate}</span>
            <span className="text-sm dark:text-white">to</span>
            <span className="text-sm font-semibold dark:text-white">{endDate}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
          <FiCalendar className="mr-2" />
          Filter Options
        </h4>
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => setFilterType('daily')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              filterType === 'daily'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setFilterType('weekly')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              filterType === 'weekly'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setFilterType('monthly')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              filterType === 'monthly'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setFilterType('custom')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              filterType === 'custom'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Custom
          </button>
        </div>

        {filterType === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Sample Data</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SIM Serial</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dealer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Up</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.records.slice(0, 3).map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900">{record.tmDate}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{record.simSerialNumber}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{record.dealerName}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{record.topUpAmount}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{record.region || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">Showing 3 of {reportData.records.length} records</p>
      </div>

      {isProcessing ? (
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <FiCpu className="text-green-500 mr-2 animate-pulse" />
              <span className="font-medium">Processing Report</span>
            </div>
            <span className="text-sm font-medium text-green-600">{processingProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <motion.div
              className="bg-green-600 h-2.5 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${processingProgress}%` }}
              transition={{ ease: "easeInOut" }}
            ></motion.div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <p>Matching SIM records with database...</p>
            <p>Identifying quality SIMs...</p>
          </div>
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleProcessReport}
          className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-300"
        >
          Process Report
        </motion.button>
      )}
    </motion.div>
  );
};

export default ProcessingSection;
