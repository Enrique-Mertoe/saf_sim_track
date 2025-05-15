'use client';

import {useState, useEffect} from 'react';
import * as XLSX from 'xlsx';
import Dashboard from "@/ui/components/dash/Dashboard";
import ReportDateRangeModal from "@/ui/components/ReportDateModal";
import {useDialog} from "@/app/_providers/dialog";
import alert from "@/ui/alert";
import simService from "@/services/simService";
import {teamService, userService} from "@/services";

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

interface PreviewData {
    teamPerformance: TeamPerformance[];
    periodsLabels: string[];
    rawData: any[][];
    isLoading: boolean;
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
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [activePreviewTab, setActivePreviewTab] = useState<string>('performance');

    useEffect(() => {
        // Set default date to current month's 1st day and today
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        setStartDate(formatDateForInput(firstDay));
        setEndDate(formatDateForInput(today));
    }, []);

    // Load preview data when dates change
    useEffect(() => {
        if (startDate && endDate && showDatePicker) {
            loadPreviewData(startDate, endDate);
        }
    }, [startDate, endDate, showDatePicker]);

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

            // Map the data to the expected format
            return data.map(sim => ({
                sim_id: sim.id || '',
                sim_serial_number: sim.serial_number || '',
                sold_by: sim.sold_by || '',
                sold_by_team: sim.team_id || '',
                activation_date: sim.activation_date,
                top_up_date: sim.top_up_date,
                top_up_amount: sim.top_up_amount,
                bundle_purchase_date: sim.bundle_purchase_date,
                bundle_amount: sim.bundle_amount,
                usage: sim.usage || 0,
                agent_msisdn: sim.agent_msisdn || '',
                ba_msisdn: sim.ba_msisdn || '',
                quality: sim.quality === true ? 'Y' : 'N',
            }));
        } catch (error) {
            console.error('Error in fetchSimData:', error);
            alert.error('Failed to fetch SIM data. Please try again.');
            return [];
        }
    };

    // Function to load preview data
    const loadPreviewData = async (startDate: string, endDate: string) => {
        try {
            setPreviewData({
                teamPerformance: [],
                periodsLabels: [],
                rawData: [],
                isLoading: true
            });

            // Fetch data from API
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

            // Create preview raw data (limited to 10 rows)
            const headers = [
                'Serial', 'Team', 'Activation Date', 'Top Up Date', 'Top Up Amount',
                'Bundle Purchase Date', 'Bundle Amount', 'Usage', 'Till/Mobigo MSISDN', 'BA MSISDN', 'Quality'
            ];

            const rawData = simData.slice(0, 10).map(sim => [
                sim.sim_serial_number,
                sim.team_name || 'Unknown',
                sim.activation_date || '',
                sim.top_up_date || '',
                sim.top_up_amount ? `Kes ${sim.top_up_amount.toFixed(2)}` : '',
                sim.bundle_purchase_date || '',
                sim.bundle_amount ? `Kes ${sim.bundle_amount.toFixed(2)}` : '',
                sim.usage.toString(),
                sim.agent_msisdn,
                sim.ba_msisdn,
                isQualitySim(sim) ? 'Yes' : 'No'
            ]);

            // Add headers to raw data
            rawData.unshift(headers);

            setPreviewData({
                teamPerformance,
                periodsLabels,
                rawData,
                isLoading: false
            });
        } catch (error) {
            console.error('Error loading preview data:', error);
            alert.error('Error loading preview data. Please try again.');
            setPreviewData(null);
        }
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
            alert.error('Error generating report. Please try again.');
        } finally {
            setGenerating(false);
        }
    };
    const fetchTeams = async (): Promise<Team[]> => {
        try {
            const {data, error} = await teamService.getAllTeams();

            if (error) {
                console.error('Error fetching teams:', error);
                throw new Error('Failed to fetch teams');
            }

            return data.map(team => ({
                team_id: team.id || '',
                team_name: team.name || '',
                team_leader_id: team.leader_id || '',
            }));
        } catch (error) {
            console.error('Error in fetchTeams:', error);
            alert.error('Failed to fetch team data. Please try again.');
            return [];
        }
    };

    // Fetch users from Supabase
    const fetchUsers = async (): Promise<User[]> => {
        try {
            // Assuming there's a userService with a getAllUsers method
            const {data, error} = await userService.getAllUsers();

            if (error) {
                console.error('Error fetching users:', error);
                throw new Error('Failed to fetch users');
            }

            return data.map(user => ({
                user_id: user.id || '',
                full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                team_id: user.team_id || '',
            }));
        } catch (error) {
            console.error('Error in fetchUsers:', error);
            alert.error('Failed to fetch user data. Please try again.');
            return [];
        }
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
        if (!