// src/pages/Reports/components/UploadSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiUploadCloud, FiAlertCircle } from 'react-icons/fi';
import { ValidationError } from '../types';

interface UploadSectionProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  uploadProgress: number;
  validationErrors: ValidationError[];
}

const UploadSection: React.FC<UploadSectionProps> = ({
  fileInputRef,
  handleFileUpload,
  isUploading,
  uploadProgress,
  validationErrors
}) => {
  return (

      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-2">
            <FiUploadCloud className="w-8 h-8 text-green-600 dark:text-green-400"/>
          </div>
        </motion.div>
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">Upload Safaricom Report</h3>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
        Upload the Excel file containing the Safaricom SIM card report.
          <br />
          The file should include SIM serial numbers and top-up amounts.
        </p>

        <div className="w-full max-w-lg">
          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer 
            ${isUploading ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <div className="w-full px-4">
                  <div className="mb-2 font-medium text-green-600 dark:text-green-400">Uploading...</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <motion.div
                      className="bg-green-600 h-2.5 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.2 }}
                    ></motion.div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">{uploadProgress}%</div>
                </div>
              ) : (
                <>
                  <svg className="w-8 h-8 mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor"
                       viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">Excel files only (.xlsx, .xls)</p>
                </>
              )}
            </div>
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>

        {validationErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 w-full max-w-lg"
          >
            <div
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
                <FiAlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="font-medium">Validation Errors</span>
              </div>
              <div className="max-h-40 overflow-y-auto text-sm">
                <ul className="list-disc pl-5 space-y-1">
                  {validationErrors.slice(0, 10).map((error, index) => (
                    <li key={index} className="text-red-700">
                      Row {error.row}: {error.message} in {error.column}
                    </li>
                  ))}
                  {validationErrors.length > 10 && (
                    <li className="text-red-700 font-medium">
                      + {validationErrors.length - 10} more errors
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UploadSection;