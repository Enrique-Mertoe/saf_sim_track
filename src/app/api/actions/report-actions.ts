import {makeResponse} from "@/helper";
import Accounts from "@/lib/accounts";
import {SIMCard, SIMStatus, User} from "@/models";
import {generateTeamReports} from "@/app/dashboard/report/utils/reportGenerator";
import {DateTime} from "luxon";
import simService from "@/services/simService";

class ReportActions {
    static async generate_excel_report(data: any) {
        try {
            // Get the current user
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { startDate, endDate } = data;

            // Fetch SIM cards data with date filters
            const simCards = await ReportActions.fetchSimCards(user, startDate, endDate);

            // Process the data for the report
            const processedReport = await ReportActions.processReportData(simCards, user);

            // Generate the Excel report
            const report = await generateTeamReports(processedReport as any);

            return makeResponse({
                ok: true,
                data: {
                    buffer: report.rawData
                },
                message: "Excel report generated successfully"
            });
        } catch (error) {
            console.error("Error generating Excel report:", error);
            return makeResponse({ error: (error as Error).message });
        }
    }

    static async generate_team_excel_report(data: any) {
        try {
            // Get the current user
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { startDate, endDate, teamId, teamName } = data;

            // Fetch SIM cards data with date filters
            const simCards = await ReportActions.fetchSimCards(user, startDate, endDate);

            // Filter by team
            const teamSimCards = simCards.filter((sim: any) => 
                sim.team_id && sim.team_id.id === teamId
            );

            // Process the data for the report
            const processedReport = await ReportActions.processReportData(teamSimCards, user);

            // Generate the Excel report
            const report = await generateTeamReports(processedReport as any);

            return makeResponse({
                ok: true,
                data: {
                    buffer: report.rawData
                },
                message: `Excel report for team ${teamName} generated successfully`
            });
        } catch (error) {
            console.error("Error generating team Excel report:", error);
            return makeResponse({ error: (error as Error).message });
        }
    }

    // Helper method to fetch SIM cards with date filters
    private static async fetchSimCards(user: User, startDate: string, endDate: string) {
        const dateStart = DateTime.fromISO(startDate).startOf('day');
        const dateEnd = DateTime.fromISO(endDate).endOf('day');

        // Fetch SIM cards using the simService
        return await new Promise<SIMCard[]>((resolve) => {
            const cards: SIMCard[] = [];
            simService.streamChunks(user, (simCards, end) => {
                cards.push(...simCards);
                if (end) {
                    resolve(cards);
                }
            }, {
                filters: [
                    ["activation_date", "not", "is", null],
                    ["status", SIMStatus.ACTIVATED],
                    ["activation_date", "gte", dateStart.toISO()],
                    ["activation_date", "lte", dateEnd.toISO()]
                ]
            });
        });
    }

    // Helper method to process report data
    private static async processReportData(simCards: any[], user: User) {
        // Group SIM cards by team
        const teamGroups: { [key: string]: any } = {};
        const unknownSims: any[] = [];

        simCards.forEach((sim: any) => {
            const teamName = sim.team_id && sim.team_id.name ? sim.team_id.name : 'Unknown';

            if (teamName === 'Unknown') {
                unknownSims.push(sim);
            } else {
                if (!teamGroups[teamName]) {
                    teamGroups[teamName] = {
                        quality: [],
                        nonQuality: []
                    };
                }

                if (sim.quality === SIMStatus.QUALITY) {
                    teamGroups[teamName].quality.push(sim);
                } else {
                    teamGroups[teamName].nonQuality.push(sim);
                }
            }
        });

        // Create team reports
        const teamReports = Object.entries(teamGroups).map(([teamName, data]) => {
            const qualityCount = data.quality.length;
            const nonQualityCount = data.nonQuality.length;
            const totalCount = qualityCount + nonQualityCount;

            return {
                teamName,
                records: [...data.quality, ...data.nonQuality],
                qualityCount,
                matchedCount: totalCount
            };
        });

        // Add unknown team if needed
        if (unknownSims.length > 0) {
            teamReports.push({
                teamName: 'Unknown',
                records: unknownSims,
                qualityCount: 0,
                matchedCount: unknownSims.length
            });
        }

        // Calculate totals
        const totalQualityCount = teamReports.reduce((sum, team) => sum + team.qualityCount, 0);
        const totalMatchedCount = teamReports.reduce((sum, team) => sum + team.matchedCount, 0);

        return {
            rawRecords: simCards,
            teamReports,
            qualityCount: totalQualityCount,
            matchedCount: totalMatchedCount
        };
    }

    static async builder(target: string, data: any) {
        try {
            const action = (ReportActions as any)[target];
            if (typeof action === 'function') {
                return await action(data);
            } else {
                throw new Error(`Action '${target}' is not a function`);
            }
        } catch (error) {
            return makeResponse({ error: (error as Error).message });
        }
    }
}

export default ReportActions;
