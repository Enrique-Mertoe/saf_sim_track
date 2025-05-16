'use client';
import {useState, useEffect} from 'react';
import * as XLSX from 'xlsx-js-style';
import Dashboard from "@/ui/components/dash/Dashboard";
import ReportDateRangeModal from "@/ui/components/ReportDateModal";
import {useDialog} from "@/app/_providers/dialog";
import alert from "@/ui/alert";
import simService from "@/services/simService";
import {SIMCard, Team, User} from '@/models';
import {ReportPreview} from "@/app/dashboard/report/Preview";
import generateExcel from "@/app/dashboard/report/utility";
import useApp from "@/ui/provider/AppProvider";


interface TeamPerformance {
    teamName: string;
    leader: string;
    periods: {
        [key: string]: {
            totalActivation: number;
            qualityCount: number;
            percentagePerformance: number;
            comment: string;
        };
    };
}

// Static colors for team tabs
const TEAM_COLORS = [
    '#4285F4', // Blue
    '#EA4335', // Red
    '#FBBC05', // Yellow
    '#34A853', // Green
    '#8E24AA', // Purple
    '#16A085', // Teal
    '#F39C12', // Orange
    '#E74C3C', // Crimson
    '#3498DB', // Sky Blue
    '#2C3E50', // Navy
];

interface PreviewData {
    teamPerformance: TeamPerformance[];
    periodsLabels: string[];
    simData: SIMCard[];
    isLoading: boolean;
}

type Team1 = Team & {
    leader_id: User
}
type SimCard = SIMCard & {
    sold_by_user_id: User;
    team_id: Team1;
    quality: string;
};

const ReportGenerator = () => {
    // States
    const {user} = useApp()
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [generating, setGenerating] = useState(false);
    const [excelData, setExcelData] = useState<any>({});
    const [success, setSuccess] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData>({
        teamPerformance: [],
        periodsLabels: [],
        simData: [],
        isLoading: true
    })

    useEffect(() => {
        // Set default date to current month's 1st day and today
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        setStartDate(formatDateForInput(firstDay));
        setEndDate(formatDateForInput(today));
    }, []);

    // Helper function to format date for input field
    const formatDateForInput = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    // Function to check if a SIM card is "Quality"
    const isQualitySim = (sim: SIMCard): boolean => {
        return (
            sim.top_up_amount !== null &&
            sim.top_up_amount !== undefined &&
            sim.top_up_amount >= 50 &&
            sim.activation_date !== null &&
            sim.activation_date !== undefined &&
            sim.quality_score !== null &&
            sim.quality_score !== undefined &&
            sim.quality_score >= 90
        );
    };

    const fetchSimData = async (startDate: string, endDate: string): Promise<SimCard[]> => {
        try {
            // Convert to the format expected by the API
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Set to end of day

            // Using simCardService to fetch data from Supabase
            const {data, error} = await simService.getSimCardsByDateRange(
                start.toISOString(),
                end.toISOString()
            );

            if (error) {
                console.error('Error fetching SIM data:', error);
                throw new Error('Failed to fetch SIM data');
            }

            // Return raw data as it already matches the SIMCard interface
            return data || [];
        } catch (error) {
            console.error('Error in fetchSimData:', error);
            alert.error('Failed to fetch SIM data. Please try again.');
            return [];
        }
    };

    // Function to process data into the required format
    const processData = async (startDate: string, endDate: string) => {
        try {
            setPreviewData(prev => ({...prev, isLoading: true}))
            let simData: SimCard[] = await fetchSimData(startDate, endDate);
            simData = simData.map(sim => {
                sim.quality = isQualitySim(sim) ? "Y" : "N"
                return sim;
            })
            //     quality: (sim.quality_score && sim.quality_score >= 90) ? 'Y' : 'N',
            // }));
            // Group sim cards by team and quality status
            const groupedByTeam: { [key: string]: { quality: SimCard[], nonQuality: SimCard[] } } = {};
            const unknownSource: SimCard[] = [];

            simData.forEach(sim => {
                if (!sim.sold_by_user_id || !sim.team_id) {
                    unknownSource.push(sim);
                    return;
                }
                const leaderName = sim.team_id.leader_id.full_name || 'Unknown';

                if (!groupedByTeam[leaderName]) {
                    groupedByTeam[leaderName] = {quality: [], nonQuality: []};
                }

                if (isQualitySim(sim as any)) {
                    groupedByTeam[leaderName].quality.push(sim);
                } else {
                    groupedByTeam[leaderName].nonQuality.push(sim);
                }
            });

            // Calculate performance metrics
            // Define periods
            const period1Start = new Date(startDate);
            const period1End = new Date(startDate);
            period1End.setDate(period1End.getDate() + 8); // 1-9

            const period2Start = new Date(period1End);
            period2Start.setDate(period2Start.getDate() + 1); // 10
            const period2End = new Date(period2Start);
            period2End.setDate(period2End.getDate() + 6); // 10-16

            const period3Start = new Date(period2End);
            period3Start.setDate(period3Start.getDate() + 1); // 17
            const period3End = new Date(endDate); // up to end date

            const periodsLabels = [
                `${period1Start.toLocaleDateString('en-US', {month: 'short'})} ${period1Start.getDate()}-${period1End.getDate()}`,
                `${period2Start.toLocaleDateString('en-US', {month: 'short'})} ${period2Start.getDate()}-${period2End.getDate()}`,
                `${period3Start.toLocaleDateString('en-US', {month: 'short'})} ${period3Start.getDate()}-${period3End.getDate()}`,
                `${period1Start.toLocaleDateString('en-US', {month: 'short'})} ${period1Start.getDate()}-${period3End.getDate()}`
            ];

            const teamPerformance: TeamPerformance[] = [];

            // For each team, calculate performance metrics for each period
            Object.entries(groupedByTeam).forEach(([leader, data]) => {
                const allSims = [...data.quality, ...data.nonQuality];
                const teamName = allSims[0]?.team_id.name || 'Unknown Team';

                const performance: TeamPerformance = {
                    teamName,
                    leader,
                    periods: {}
                };

                // Calculate for period 1
                const period1Sims = allSims.filter(sim => {
                    const activationDate = new Date(sim.activation_date || '');
                    return activationDate >= period1Start && activationDate <= period1End;
                });
                const period1Quality = period1Sims.filter(sim => sim.quality === 'Y');
                const period1Percentage = period1Sims.length ? (period1Quality.length / period1Sims.length) * 100 : 0;
                performance.periods[periodsLabels[0]] = {
                    totalActivation: period1Sims.length,
                    qualityCount: period1Quality.length,
                    percentagePerformance: parseFloat(period1Percentage.toFixed(2)),
                    comment: period1Percentage >= 90 ? 'Well done' : 'Improve'
                };

                // Calculate for period 2
                const period2Sims = allSims.filter(sim => {
                    const activationDate = new Date(sim.activation_date || '');
                    return activationDate >= period2Start && activationDate <= period2End;
                });
                const period2Quality = period2Sims.filter(sim => sim.quality === 'Y');
                const period2Percentage = period2Sims.length ? (period2Quality.length / period2Sims.length) * 100 : 0;
                performance.periods[periodsLabels[1]] = {
                    totalActivation: period2Sims.length,
                    qualityCount: period2Quality.length,
                    percentagePerformance: parseFloat(period2Percentage.toFixed(2)),
                    comment: period2Percentage >= 90 ? 'Well done' : 'Improve'
                };

                // Calculate for period 3
                const period3Sims = allSims.filter(sim => {
                    const activationDate = new Date(sim.activation_date || '');
                    return activationDate >= period3Start && activationDate <= period3End;
                });
                const period3Quality = period3Sims.filter(sim => sim.quality === 'Y');
                const period3Percentage = period3Sims.length ? (period3Quality.length / period3Sims.length) * 100 : 0;
                performance.periods[periodsLabels[2]] = {
                    totalActivation: period3Sims.length,
                    qualityCount: period3Quality.length,
                    percentagePerformance: parseFloat(period3Percentage.toFixed(2)),
                    comment: period3Percentage >= 90 ? 'Well done' : 'Improve'
                };

                // Calculate overall monthly summary
                const overallPercentage = allSims.length ? (data.quality.length / allSims.length) * 100 : 0;
                performance.periods[periodsLabels[3]] = {
                    totalActivation: allSims.length,
                    qualityCount: data.quality.length,
                    percentagePerformance: parseFloat(overallPercentage.toFixed(2)),
                    comment: overallPercentage >= 90 ? 'Well done' : 'Improve'
                };

                teamPerformance.push(performance);
            });

            // Generate Excel file
            setExcelData(
                {
                    simData,
                    groupedByTeam,
                    unknownSource,
                    teamPerformance,
                    periodsLabels,
                    startDate,
                    endDate,
                    user
                }
            );
            setPreviewData({
                teamPerformance,
                periodsLabels,
                simData,
                isLoading: false
            });

            // setSuccess(true);
            // setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error preloading report:', error);
            alert.error('Error preloading report. Please try again.');
        }
    };
    // Function to generate Excel file


    const handleGenerateReport = async () => {
        try {
            setGenerating(true)
            await generateExcel(excelData);
        } catch (e) {
            console.log(e)
            alert.error("Something went wrong")
        } finally {
            setGenerating(false)
        }
    };

    const loadData = async () => {
        if (!startDate || !endDate) {
            alert.error('Please select both start and end dates');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            alert.error('Start date cannot be after end date');
            return;
        }
        processData(startDate, endDate).then();
    };

    const dialog = useDialog();

    return (
        <Dashboard>
            {/*<ReportDateRangeModal />*/}
            <div className="flex flex-col items-center overflow-x-hidden px-4 pt-6 pb-12 bg-white dark:bg-gray-900">
                <div
                    className="w-full overflow-hidden transition-all transform">
                    <div className="px-6 bg-green-600 dark:bg-green-800 rounded-t-lg py-4">
                        <h1 className="text-3xl font-bold text-white">Van Quality Report</h1>
                        <p className="text-green-100 mt-2">Generate detailed SIM card performance reports with quality
                            metrics</p>
                    </div>

                    <div className="p-6 bg-white dark:bg-gray-800">
                        <div
                            className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 mb-6 rounded-md">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg"
                                         viewBox="0 0 20 20"
                                         fill="currentColor">
                                        <path fillRule="evenodd"
                                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                                              clipRule="evenodd"/>
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        This report will generate Excel sheets with SIM card performance metrics grouped
                                        by team and
                                        quality status. The report includes period breakdowns and overall performance
                                        metrics.
                                    </p>
                                </div>
                            </div>
                        </div>


                        <button
                            onClick={() => {
                                const d = dialog.create({
                                    content: <ReportDateRangeModal onConfirm={date_range => {
                                        d.dismiss();
                                        setStartDate(date_range.startDate?.toString() || "");
                                        setEndDate(date_range.endDate?.toString() || "");
                                        setShowDatePicker(true);
                                        loadData()
                                    }} onClose={() => {
                                        d.dismiss();
                                        setShowDatePicker(false);
                                        setStartDate('')
                                        setEndDate('')
                                    }}/>,
                                    size: "lg",
                                    design: ["scrollable"]
                                })
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white font-semibold py-3 px-4 rounded-lg shadow transition-colors flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            Select Date Range for Report
                        </button>

                        <div className="animate-fadeIn">
                            <div
                                className="flex mt-5 flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                                <button
                                    onClick={handleGenerateReport}
                                    disabled={!showDatePicker || generating}
                                    className={`py-2 px-4 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                                        generating ? 'bg-green-400 dark:bg-green-500/50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
                                    }`}
                                >
                                    {generating ? 'Generating...' : 'Generate Report'}
                                </button>
                            </div>
                        </div>


                        {generating && (
                            <div className="flex flex-col items-center justify-center mt-8 animate-fadeIn">
                                <div
                                    className="w-16 h-16 border-4 border-green-200 dark:border-green-700 border-t-green-600 dark:border-t-green-500 rounded-full animate-spin"></div>
                                <p className="mt-4 text-gray-600 dark:text-gray-300">Generating your report, please
                                    wait...</p>
                            </div>
                        )}
                        {showDatePicker ?
                            <div className={"mt-5 bg-white dark:bg-gray-800 rounded-lg shadow"}>
                                <ReportPreview
                                    simData={previewData.simData}
                                    startDate={startDate}
                                    endDate={endDate}
                                    isLoading={previewData.isLoading}
                                    teamPerformance={previewData.teamPerformance}
                                    periodsLabels={previewData.periodsLabels}/>
                            </div>
                            : ''}

                        {success && (
                            <div
                                className="mt-6 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded-md animate-fadeIn">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg"
                                             viewBox="0 0 20 20"
                                             fill="currentColor">
                                            <path fillRule="evenodd"
                                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                  clipRule="evenodd"/>
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-green-800 dark:text-green-200">
                                            Report generated successfully! Check your downloads folder for the Excel
                                            file.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div
                        className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div
                                className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                                <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-2">Sheet Structure</h3>
                                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc pl-5">
                                    <li><span
                                        className="font-medium text-gray-700 dark:text-gray-200">Raw Data:</span> All
                                        records for selected period
                                    </li>
                                    <li><span
                                        className="font-medium text-gray-700 dark:text-gray-200">Team Sheets:</span> Separate
                                        quality/non-quality
                                        sheets per team
                                    </li>
                                    <li><span
                                        className="font-medium text-gray-700 dark:text-gray-200">Unknown Source:</span> SIMs
                                        without assigned teams
                                    </li>
                                    <li><span
                                        className="font-medium text-gray-700 dark:text-gray-200">%Performance:</span> Team
                                        metrics across periods
                                    </li>
                                </ul>
                            </div>

                            <div
                                className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                                <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-2">Quality Metrics</h3>
                                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc pl-5">
                                    <li>SIM activation status must be present</li>
                                    <li>Top-up amount must be ≥ 50 KES</li>
                                    <li>Quality flag must be "Y"</li>
                                    <li>Overall percentage = Quality SIMs / Total SIMs × 100</li>
                                    <li>≥ 90% earns "Well done" rating</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default ReportGenerator;