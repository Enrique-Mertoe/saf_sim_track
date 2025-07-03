"use client"
import React, {useRef, useState} from 'react';
import {motion} from 'framer-motion';
import {FiCheck, FiFileText, FiUploadCloud} from 'react-icons/fi';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {ProcessedReport, Report, ValidationError} from './types';
import {parseReport, validateReport} from './utils/reportParser';
import {processReport} from './utils/reportProcessor';
import {generateTeamReports} from './utils/reportGenerator';

import UploadSection from './components/UploadSection';
import ProcessingSection from './components/ProcessingSection';
import ResultsSummary from './components/ResultsSummary';
import TeamReportsList from './components/TeamReportsList';
import Dashboard from "@/ui/components/dash/Dashboard";
import useApp from "@/ui/provider/AppProvider";

const Reports: React.FC = () => {
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [processingProgress, setProcessingProgress] = useState<number>(0);
    const [reportData, setReportData] = useState<Report | null>(null);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [processedReport, setProcessedReport] = useState<ProcessedReport | null>(null);
    const [activeStep, setActiveStep] = useState<number>(1);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Date filtering state
    const [filterType, setFilterType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Set default dates based on current date
    React.useEffect(() => {
        const today = new Date();
        const endDateStr = today.toISOString().split('T')[0];

        const startDateObj = new Date(today);

        // Set default date range based on filter type
        switch (filterType) {
            case 'daily':
                // Default to today
                setStartDate(endDateStr);
                break;
            case 'weekly':
                // Default to last 7 days
                startDateObj.setDate(today.getDate() - 7);
                setStartDate(startDateObj.toISOString().split('T')[0]);
                break;
            case 'monthly':
                // Default to last 30 days
                startDateObj.setDate(today.getDate() - 30);
                setStartDate(startDateObj.toISOString().split('T')[0]);
                break;
            case 'custom':
                // Don't change dates for custom
                break;
        }

        setEndDate(endDateStr);
    }, [filterType]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setIsUploading(true);
            setUploadProgress(0);

            const files = e.target.files;
            if (!files || files.length === 0) {
                toast.error('No file selected');
                setIsUploading(false);
                return;
            }

            const file = files[0];

            // Simulating upload progress
            const uploadTimer = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 95) {
                        clearInterval(uploadTimer);
                        return 95;
                    }
                    return prev + 5;
                });
            }, 100);

            // Parse the file
            const parsedReport = await parseReport(file);

            // Clear the upload timer and set progress to 100%
            clearInterval(uploadTimer);
            setUploadProgress(100);

            // Validate the report
            const {isValid, errors} = validateReport(parsedReport);
            setValidationErrors(errors);

            if (isValid) {
                setReportData(parsedReport);
                setActiveStep(2);
                toast.success('Report uploaded successfully');
            } else {
                toast.error(`Upload failed: ${errors.length} validation errors found`);
            }

            // Reset the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            toast.error(`Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    };
    const {user} = useApp()
    const handleProcessReport = async () => {
        if (!reportData) return;

        try {
            setIsProcessing(true);
            setProcessingProgress(0);

            // Process the report with date filtering
            const processed = await processReport(
                reportData, 
                user!, 
                (progress) => {
                    //@ts-ignore
                    setProcessingProgress(Number(progress).toFixed(1));
                },
                startDate,
                endDate
            );
            setProcessingProgress(100);

            setProcessedReport(processed);
            setActiveStep(3);
            toast.success(`Report processed successfully. ${processed.matchedCount} SIMs matched, ${processed.qualityCount} quality SIMs identified.`);
        } catch (error) {
            toast.error(`Error processing report: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsProcessing(false);
        }
    };


    const handleGenerateReports = async () => {
        if (!processedReport) return;

        try {
            // Generate team reports
            const teamReports = await generateTeamReports(processedReport);

            // Download the reports
            const blob = new Blob([teamReports.rawData], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SimCardReport_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Reports generated and downloaded successfully');
        } catch (error) {
            toast.error(`Error generating reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Page transition and animation variants
    const containerVariants = {
        hidden: {opacity: 0},
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: {y: 20, opacity: 0},
        visible: {y: 0, opacity: 1}
    };

    return (
        <Dashboard>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="container mx-auto px-4 py-8 max-w-6xl dark:bg-gray-900"
            >
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                >
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">SIM Card Reports</h1>

                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Process Safaricom
                                Reports</h2>
                        </div>

                        <div className="flex justify-between mb-8">
                            <motion.div
                                className={`step-indicator flex items-center ${activeStep >= 1 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
                                animate={{scale: activeStep === 1 ? 1.05 : 1}}
                                whileHover={{scale: 1.05}}
                            >
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep >= 1 ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                <FiUploadCloud className="w-5 h-5"/>
                                </div>
                                <span className="ml-2 font-medium">Upload</span>
                            </motion.div>

                            <div
                                className={`h-0.5 w-16 ${activeStep >= 2 ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`}></div>

                            <motion.div
                                className={`step-indicator flex items-center ${activeStep >= 2 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
                                animate={{scale: activeStep === 2 ? 1.05 : 1}}
                                whileHover={{scale: 1.05}}
                            >
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep >= 2 ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                <FiCheck className="w-5 h-5"/>
                                </div>
                                <span className="ml-2 font-medium">Process</span>
                            </motion.div>

                            <div
                                className={`h-0.5 w-16 ${activeStep >= 3 ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`}></div>

                            <motion.div
                                className={`step-indicator flex items-center ${activeStep >= 3 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
                                animate={{scale: activeStep === 3 ? 1.05 : 1}}
                                whileHover={{scale: 1.05}}
                            >
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep >= 3 ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                <FiFileText className="w-5 h-5"/>
                                </div>
                                <span className="ml-2 font-medium">Results</span>
                            </motion.div>
                        </div>

                        {activeStep === 1 && (
                            <UploadSection
                                //@ts-ignore
                                fileInputRef={fileInputRef}
                                handleFileUpload={handleFileUpload}
                                isUploading={isUploading}
                                uploadProgress={uploadProgress}
                                validationErrors={validationErrors}
                            />
                        )}

                        {activeStep === 2 && reportData && (
                            <ProcessingSection
                                reportData={reportData}
                                isProcessing={isProcessing}
                                processingProgress={processingProgress}
                                handleProcessReport={handleProcessReport}
                                onBack={() => setActiveStep(1)}
                                filterType={filterType}
                                setFilterType={setFilterType}
                                startDate={startDate}
                                setStartDate={setStartDate}
                                endDate={endDate}
                                setEndDate={setEndDate}
                            />
                        )}

                        {activeStep === 3 && processedReport && (
                            <>
                                <ResultsSummary
                                    processedReport={processedReport}
                                    onGenerateReports={handleGenerateReports}
                                    onProcessNew={() => {
                                        setReportData(null);
                                        setProcessedReport(null);
                                        setActiveStep(1);
                                    }}
                                />

                                <div className="mt-8">
                                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4">Team
                                        Reports</h3>

                                    <TeamReportsList teamReports={processedReport.teamReports}
                                                     //@ts-ignore
                                                     user={user}/>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
                <ToastContainer position="bottom-right"/>
            </motion.div>
        </Dashboard>
    );
};

export default Reports;
