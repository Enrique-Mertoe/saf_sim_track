'use client';

import {useState, useEffect} from 'react';
import * as XLSX from 'xlsx';
import Dashboard from "@/ui/components/dash/Dashboard";
import ReportDateRangeModal from "@/ui/components/ReportDateModal";
import {useDialog} from "@/app/_providers/dialog";

// Types
interface SimCard {
    sim_id: string;
    sim_serial_number: string;
    sold_by: string;
    sold_by_team: string;
    activation_date: string | null;
    top_up_date: string | null;
    top_up_amount: number | null;
    bundle_purchase_date: string | null;
    bundle_amount: number | null;
    usage: number;
    agent_msisdn: string;
    ba_msisdn: string;
    quality: 'Y' | 'N';
    team_name?: string;
    leader_name?: string;
}

interface User {
    user_id: string;
    full_name: string;
    team_id: string;
}

interface Team {
    team_id: string;
    team_name: string;
    team_leader_id: string;
    team_leader_name?: string;
}

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

const ReportGenerator = () => {
    // States
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [generating, setGenerating] = useState(false);
    const [success, setSuccess] = useState(false);

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

    // Helper to format date for display
    const formatDateDisplay = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Function to check if a SIM card is "Quality"
    const isQualitySim = (sim: SimCard): boolean => {
        return (
            sim.top_up_amount !== null &&
            sim.top_up_amount >= 50 &&
            sim.activation_date !== null &&
            sim.quality === 'Y'
        );
    };

    // Function to get team leader name
    const getTeamLeaderName = (teams: Team[], teamId: string): string => {
        const team = teams.find(t => t.team_id === teamId);
        return team?.team_leader_name || 'Unknown';
    };

    // Function to process data into the required format
    const processData = async (startDate: string, endDate: string) => {
        try {
            setGenerating(true);

            // In a real application, this data would come from API calls
            // For this demonstration, we'll simulate the data

            // Simulate fetching data from API
            const simData: SimCard[] = await fetchSimData(startDate, endDate);
            const teams: Team[] = await fetchTeams();
            const users: User[] = await fetchUsers();

            // Enrich teams with leader names
            teams.forEach(team => {
                const leader = users.find(user => user.user_id === team.team_leader_id);
                team.team_leader_name = leader?.full_name || 'Unknown Leader';
            });

            // Enrich sim data with team and leader information
            simData.forEach(sim => {
                const team = teams.find(t => t.team_id === sim.sold_by_team);
                sim.team_name = team?.team_name || 'Unknown Team';
                sim.leader_name = team?.team_leader_name || 'Unknown Leader';
            });

            // Group sim cards by team and quality status
            const groupedByTeam: { [key: string]: { quality: SimCard[], nonQuality: SimCard[] } } = {};
            const unknownSource: SimCard[] = [];

            simData.forEach(sim => {
                if (!sim.sold_by || !sim.sold_by_team) {
                    unknownSource.push(sim);
                    return;
                }

                const leaderName = sim.leader_name || 'Unknown';

                if (!groupedByTeam[leaderName]) {
                    groupedByTeam[leaderName] = {quality: [], nonQuality: []};
                }

                if (isQualitySim(sim)) {
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
                const teamName = allSims[0]?.team_name || 'Unknown Team';

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
                const period1Quality = period1Sims.filter(isQualitySim);
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
                const period2Quality = period2Sims.filter(isQualitySim);
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
                const period3Quality = period3Sims.filter(isQualitySim);
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
            await generateExcel(
                simData,
                groupedByTeam,
                unknownSource,
                teamPerformance,
                periodsLabels,
                startDate,
                endDate
            );

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Error generating report. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    // Mock function to fetch SIM data
    const fetchSimData = async (startDate: string, endDate: string): Promise<SimCard[]> => {
        // In a real app, this would be an API call
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate some mock data
        const mockData: SimCard[] = [];
        const startDateTime = new Date(startDate).getTime();
        const endDateTime = new Date(endDate).getTime();

        // Generate 500 random SIM cards
        for (let i = 0; i < 500; i++) {
            const activationDate = new Date(startDateTime + Math.random() * (endDateTime - startDateTime));
            const topUpDate = Math.random() > 0.1 ? new Date(activationDate.getTime() + Math.random() * 86400000 * 3) : null;
            const topUpAmount = topUpDate ? Math.floor(Math.random() * 200) + 10 : null;

            mockData.push({
                sim_id: `sim-${i}`,
                sim_serial_number: `89254021374259${Math.floor(Math.random() * 1000000)}`,
                sold_by: `user-${Math.floor(Math.random() * 20) + 1}`,
                sold_by_team: `team-${Math.floor(Math.random() * 5) + 1}`,
                activation_date: activationDate.toISOString().split('T')[0],
                top_up_date: topUpDate ? topUpDate.toISOString().split('T')[0] : null,
                top_up_amount: topUpAmount,
                bundle_purchase_date: Math.random() > 0.7 ? new Date(activationDate.getTime() + Math.random() * 86400000 * 5).toISOString().split('T')[0] : null,
                bundle_amount: Math.random() > 0.7 ? Math.floor(Math.random() * 500) + 100 : null,
                usage: Math.floor(Math.random() * 1000),
                agent_msisdn: `254${Math.floor(Math.random() * 100000000) + 700000000}`,
                ba_msisdn: `254${Math.floor(Math.random() * 100000000) + 700000000}`,
                quality: topUpAmount && topUpAmount >= 50 ? 'Y' : 'N'
            });
        }

        // Add 10 unknown source SIMs
        for (let i = 0; i < 10; i++) {
            const activationDate = new Date(startDateTime + Math.random() * (endDateTime - startDateTime));
            mockData.push({
                sim_id: `sim-unknown-${i}`,
                sim_serial_number: `89254021374259${Math.floor(Math.random() * 1000000)}`,
                sold_by: '',
                sold_by_team: '',
                activation_date: activationDate.toISOString().split('T')[0],
                top_up_date: null,
                top_up_amount: null,
                bundle_purchase_date: null,
                bundle_amount: null,
                usage: 0,
                agent_msisdn: `254${Math.floor(Math.random() * 100000000) + 700000000}`,
                ba_msisdn: `254${Math.floor(Math.random() * 100000000) + 700000000}`,
                quality: 'N'
            });
        }

        return mockData;
    };

    // Mock function to fetch teams
    const fetchTeams = async (): Promise<Team[]> => {
        await new Promise(resolve => setTimeout(resolve, 500));

        return [
            {team_id: 'team-1', team_name: 'Nairobi Team', team_leader_id: 'leader-1'},
            {team_id: 'team-2', team_name: 'Mombasa Team', team_leader_id: 'leader-2'},
            {team_id: 'team-3', team_name: 'Kisumu Team', team_leader_id: 'leader-3'},
            {team_id: 'team-4', team_name: 'Nakuru Team', team_leader_id: 'leader-4'},
            {team_id: 'team-5', team_name: 'Eldoret Team', team_leader_id: 'leader-5'},
        ];
    };

    // Mock function to fetch users
    const fetchUsers = async (): Promise<User[]> => {
        await new Promise(resolve => setTimeout(resolve, 500));

        return [
            {user_id: 'leader-1', full_name: 'Brian Kimani', team_id: 'team-1'},
            {user_id: 'leader-2', full_name: 'Jane Mwangi', team_id: 'team-2'},
            {user_id: 'leader-3', full_name: 'Peter Omondi', team_id: 'team-3'},
            {user_id: 'leader-4', full_name: 'Sarah Njeri', team_id: 'team-4'},
            {user_id: 'leader-5', full_name: 'Michael Kipsang', team_id: 'team-5'},
        ];
    };

    // Function to generate Excel file
    const generateExcel = async (
        simData: SimCard[],
        groupedByTeam: { [key: string]: { quality: SimCard[], nonQuality: SimCard[] } },
        unknownSource: SimCard[],
        teamPerformance: TeamPerformance[],
        periodsLabels: string[],
        startDate: string,
        endDate: string
    ) => {
        const workbook = XLSX.utils.book_new();
        const periodStart = formatDateDisplay(startDate);
        const periodEnd = formatDateDisplay(endDate);

        // Create header row
        const headers = [
            'Serial', 'Team', 'Activation Date', 'Top Up Date', 'Top Up Amount',
            'Bundle Purchase Date', 'Bundle Amount', 'Usage', 'Till/Mobigo MSISDN', 'BA MSISDN'
        ];

        // Create RAW sheet with all data
        const rawData = simData.map(sim => [
            sim.sim_serial_number,
            sim.team_name || 'Unknown',
            sim.activation_date || '',
            sim.top_up_date || '',
            sim.top_up_amount ? `Kes ${sim.top_up_amount.toFixed(2)}` : '',
            sim.bundle_purchase_date || '',
            sim.bundle_amount ? `Kes ${sim.bundle_amount.toFixed(2)}` : '',
            sim.usage.toString(),
            sim.agent_msisdn,
            sim.ba_msisdn
        ]);

        const rawSheet = XLSX.utils.aoa_to_sheet([headers, ...rawData]);
        XLSX.utils.book_append_sheet(workbook, rawSheet, 'Raw Data');

        // Create sheets for each team
        let colorIndex = 0;
        Object.entries(groupedByTeam).forEach(([leader, data]) => {
            // Quality sheet
            if (data.quality.length > 0) {
                const qualityData = data.quality.map(sim => [
                    sim.sim_serial_number,
                    sim.team_name || 'Unknown',
                    sim.activation_date || '',
                    sim.top_up_date || '',
                    sim.top_up_amount ? `Kes ${sim.top_up_amount.toFixed(2)}` : '',
                    sim.bundle_purchase_date || '',
                    sim.bundle_amount ? `Kes ${sim.bundle_amount.toFixed(2)}` : '',
                    sim.usage.toString(),
                    sim.agent_msisdn,
                    sim.ba_msisdn
                ]);

                const qualitySheet = XLSX.utils.aoa_to_sheet([headers, ...qualityData]);
                XLSX.utils.book_append_sheet(workbook, qualitySheet, `${leader} team quality`);

                // Set tab color (in a real implementation, would require more Excel.js specific code)
                // This is a simplified example
                if (workbook.Sheets[`${leader} team quality`]) {
                    // In a real implementation, use Excel.js properties to set the tab color
                    console.log(`Setting ${TEAM_COLORS[colorIndex]} color for ${leader} team quality`);
                }
            }

            // Non-quality sheet
            if (data.nonQuality.length > 0) {
                const nonQualityData = data.nonQuality.map(sim => [
                    sim.sim_serial_number,
                    sim.team_name || 'Unknown',
                    sim.activation_date || '',
                    sim.top_up_date || '',
                    sim.top_up_amount ? `Kes ${sim.top_up_amount.toFixed(2)}` : '',
                    sim.bundle_purchase_date || '',
                    sim.bundle_amount ? `Kes ${sim.bundle_amount.toFixed(2)}` : '',
                    sim.usage.toString(),
                    sim.agent_msisdn,
                    sim.ba_msisdn
                ]);

                const nonQualitySheet = XLSX.utils.aoa_to_sheet([headers, ...nonQualityData]);
                XLSX.utils.book_append_sheet(workbook, nonQualitySheet, `${leader} team non quality`);

                // Set tab color (in a real implementation, would require more Excel.js specific code)
                // This is a simplified example
                if (workbook.Sheets[`${leader} team non quality`]) {
                    console.log(`Setting ${TEAM_COLORS[colorIndex]} color for ${leader} team non quality`);
                }
            }

            colorIndex = (colorIndex + 1) % TEAM_COLORS.length;
        });

        // Create Unknown Source sheet
        if (unknownSource.length > 0) {
            const unknownData = unknownSource.map(sim => [
                sim.sim_serial_number,
                'Unknown Source',
                sim.activation_date || '',
                sim.top_up_date || '',
                sim.top_up_amount ? `Kes ${sim.top_up_amount.toFixed(2)}` : '',
                sim.bundle_purchase_date || '',
                sim.bundle_amount ? `Kes ${sim.bundle_amount.toFixed(2)}` : '',
                sim.usage.toString(),
                sim.agent_msisdn,
                sim.ba_msisdn
            ]);

            const unknownSheet = XLSX.utils.aoa_to_sheet([headers, ...unknownData]);
            XLSX.utils.book_append_sheet(workbook, unknownSheet, 'Unknown source');
        }

        // Create Performance sheet
        const performanceHeaders = ['Team', 'Total activation', 'Quality', 'Percentage performance', 'Comment'];
        const performanceData: any[][] = [];

        // Add period headers (using empty cells for spacing)
        const periodHeaders: any[] = ['', '', '', '', ''];
        periodsLabels.forEach(period => {
            performanceData.push([`Period: ${period}`, '', '', '', '']);
            performanceData.push(performanceHeaders);

            // Add data for each team for this period
            teamPerformance.forEach(team => {
                const periodData = team.periods[period];
                if (periodData) {
                    performanceData.push([
                        team.teamName,
                        periodData.totalActivation,
                        periodData.qualityCount,
                        `${periodData.percentagePerformance.toFixed(2)}%`,
                        periodData.comment
                    ]);
                }
            });

            // Add empty row as separator
            performanceData.push(['', '', '', '', '']);
        });

        const performanceSheet = XLSX.utils.aoa_to_sheet(performanceData);
        XLSX.utils.book_append_sheet(workbook, performanceSheet, '%Performance');

        // Generate Excel file name
        const startDateStr = startDate.replace(/-/g, '');
        const endDateStr = endDate.replace(/-/g, '');
        const fileName = `Van_Quality_Report_${startDateStr}_${endDateStr}.xlsx`;

        // Write file and download
        XLSX.writeFile(workbook, fileName);
    };

    const handleGenerateReport = () => {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            alert('Start date cannot be after end date');
            return;
        }

        setShowDatePicker(false);
        processData(startDate, endDate);
    };

    const dialog = useDialog();

    return (
        <Dashboard>
            {/*<ReportDateRangeModal />*/}
            <div className="flex flex-col items-center min-h-screen bg-gray-50 px-4 py-12">
                <div
                    className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden transition-all transform">
                    <div className="bg-gradient-to-r from-green-600 to-green-800 py-8 px-6">
                        <h1 className="text-3xl font-bold text-white">Van Quality Report Generator</h1>
                        <p className="text-green-100 mt-2">Generate detailed SIM card performance reports with quality
                            metrics</p>
                    </div>

                    <div className="p-6">
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md">
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
                                    <p className="text-sm text-green-800">
                                        This report will generate Excel sheets with SIM card performance metrics grouped
                                        by team and
                                        quality status. The report includes period breakdowns and overall performance
                                        metrics.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {!showDatePicker ? (
                            <button
                                onClick={() => {
                                    const d = dialog.create({
                                        content: <ReportDateRangeModal onClose={() => d.dismiss()}/>,
                                        size:"lg"
                                    })
                                }}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow transition-colors flex items-center justify-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                     xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                Select Date Range for Report
                            </button>
                        ) : (
                            <div className="animate-fadeIn">
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Select Report Date
                                        Range</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Start
                                                Date</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">End
                                                Date</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                                    <button
                                        onClick={() => setShowDatePicker(false)}
                                        className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleGenerateReport}
                                        disabled={generating}
                                        className={`py-2 px-4 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                                            generating ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                    >
                                        {generating ? 'Generating...' : 'Generate Report'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {generating && (
                            <div className="flex flex-col items-center justify-center mt-8 animate-fadeIn">
                                <div
                                    className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                                <p className="mt-4 text-gray-600">Generating your report, please wait...</p>
                            </div>
                        )}

                        {success && (
                            <div className="mt-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md animate-fadeIn">
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
                                        <p className="text-sm text-green-800">
                                            Report generated successfully! Check your downloads folder for the Excel
                                            file.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="font-medium text-gray-700 mb-2">Sheet Structure</h3>
                                <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                                    <li><span className="font-medium">Raw Data:</span> All records for selected period
                                    </li>
                                    <li><span className="font-medium">Team Sheets:</span> Separate quality/non-quality
                                        sheets per team
                                    </li>
                                    <li><span className="font-medium">Unknown Source:</span> SIMs without assigned teams
                                    </li>
                                    <li><span className="font-medium">%Performance:</span> Team metrics across periods
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="font-medium text-gray-700 mb-2">Quality Metrics</h3>
                                <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
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

                {/* Report Features Section */}
                <div className="w-full max-w-4xl mt-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Report Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                            <div
                                className="flex items-center justify-center w-12 h-12 rounded-md bg-green-100 text-green-600 mb-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                     xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2">Team Performance Analysis</h3>
                            <p className="text-sm text-gray-600">Compare team performance across multiple periods with
                                detailed
                                metrics and quality ratings.</p>
                        </div>

                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                            <div
                                className="flex items-center justify-center w-12 h-12 rounded-md bg-green-100 text-green-600 mb-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                     xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2">Flexible Date Ranges</h3>
                            <p className="text-sm text-gray-600">Generate reports for any date range with automatic
                                period breakdown
                                into three segments.</p>
                        </div>

                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                            <div
                                className="flex items-center justify-center w-12 h-12 rounded-md bg-green-100 text-green-600 mb-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                     xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                          d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2">Color-Coded Team Sheets</h3>
                            <p className="text-sm text-gray-600">Each team gets its own color-coded quality and
                                non-quality sheets
                                for easy identification.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default ReportGenerator;