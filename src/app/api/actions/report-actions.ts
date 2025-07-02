import {Filter, makeResponse} from "@/helper";
import Accounts from "@/lib/accounts";
import {SIMCard, SIMStatus, Team, User} from "@/models";
import {generateTeamReports} from "@/app/dashboard/report/utils/reportGenerator";
import {DateTime} from "luxon";
import simService from "@/services/simService";
import {supabaseAdmin} from "@/lib/supabase/server";
import {admin_id} from "@/services/helper";

class ReportActions {
    static async generate_excel_report(data: any) {
        try {
            // Get the current user
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {startDate, endDate} = data;

            // Fetch SIM cards data with date filters
            const simCards = await ReportActions.fetchSimCards(user, startDate, endDate);

            // Process the data for the report
            const processedReport = await ReportActions.processReportData(simCards, user);
            const cols = [
                {header: 'Serial', key: 'simSerialNumber', width: 25},
                {header: 'Team', key: 'team', width: 25},
                {header: 'Activation Date', key: 'activationDate', width: 18},
                {header: 'Top Up Date', key: 'topUpDate', width: 15},
                {header: 'Top Up Amount', key: 'topUpAmount', width: 15},
                {header: 'Usage', key: 'cumulativeUsage', width: 15},
                {header: 'BA', key: 'ba', width: 15},
                {header: 'Till/Mobigo', key: 'mobigo', width: 15},
                {header: 'Quality', key: 'quality', width: 15},
            ];
            // Generate the Excel report
            const report = await generateTeamReports(processedReport as any,
                    cols
                )
            ;
            return makeResponse({
                ok: true,
                data: {
                    buffer: Buffer.from(report.rawData).toString('base64'),
                    summary: {
                        totalRecords: processedReport.matchedCount,
                        qualityCount: processedReport.qualityCount,
                        teamCount: processedReport.teamReports.length
                    }
                },
                message: "Excel report generated successfully"
            });
        } catch (error) {
            console.error("Error generating Excel report:", error);
            return makeResponse({error: (error as Error).message});
        }
    }

    static async generate_team_excel_report(data: any) {
        try {
            // Get the current user
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {startDate, endDate, teamId, teamName} = data;

            // Fetch SIM cards data with date filters
            const teamSimCards = await ReportActions.fetchSimCards(user, startDate, endDate, [
                ["team_id", teamId]
            ]);

            // Process the data for the report
            const processedReport = await ReportActions.processReportData(teamSimCards, user);
            const cols = [
                {header: 'Serial', key: 'simSerialNumber', width: 25},
                {header: 'Team', key: 'team', width: 25},
                {header: 'Activation Date', key: 'activationDate', width: 18},
                {header: 'Top Up Date', key: 'topUpDate', width: 15},
                {header: 'Top Up Amount', key: 'topUpAmount', width: 15},
                {header: 'Usage', key: 'cumulativeUsage', width: 15},
                {header: 'BA', key: 'ba', width: 15},
                {header: 'Till/Mobigo', key: 'mobigo', width: 15},
                {header: 'Quality', key: 'quality', width: 15},
            ]
            // Generate the Excel report
            const report = await generateTeamReports(processedReport as any, cols);

            return makeResponse({
                ok: true,
                data: {
                    buffer: Buffer.from(report.rawData).toString('base64'),
                    summary: {
                        totalRecords: processedReport.matchedCount,
                        qualityCount: processedReport.qualityCount,
                        teamName: teamName
                    }
                },
                message: `Excel report for team ${teamName} generated successfully`
            });
        } catch (error) {
            console.error("Error generating team Excel report:", error);
            return makeResponse({error: (error as Error).message});
        }
    }

    // Helper method to fetch SIM cards with date filters
    private static async fetchSimCards(user: User, startDate: string, endDate: string, filters: Filter[] = []) {
        const dateStart = DateTime.fromISO(startDate).startOf('day');
        const dateEnd = DateTime.fromISO(endDate).endOf('day');

        // Fetch SIM cards using the simService
        return await new Promise<(SIMCard & { team: Team })[]>((resolve) => {
            const cards: any = [];
            simService.streamChunks<{ team: Team }>(user, (simCards, end) => {
                cards.push(...simCards);
                if (end) {
                    resolve(cards.map((sim: any) => ({
                        simSerialNumber: sim.serial_number,
                        dateId: sim.created_at,
                        topUpAmount: sim.top_up_amount,
                        bundleAmount: '-',
                        bundlePurchaseDate: '-',
                        agentMSISDN: '-',
                        ba: sim.ba_msisdn,
                        //@ts-ignore
                        mobigo: sim.mobigo,
                        team_id: sim.team_id,
                        cumulativeUsage: parseFloat(sim.usage ?? '') || 0,
                        quality: sim.quality === SIMStatus.QUALITY ? 'Y' : 'N',
                    })));
                }
            }, {
                filters: [
                    ["activation_date", "not", "is", null],
                    ["status", SIMStatus.ACTIVATED],
                    ["activation_date", "gte", dateStart.toISO()],
                    ["activation_date", "lte", dateEnd.toISO()],
                    ...filters
                ]
            });
        });
    }

    // Helper method to process report data
    private static async processReportData(simCards: any[], user: User) {
        // Group SIM cards by team
        const teamGroups: { [teamName: string]: { quality: any[]; nonQuality: any[] } } = {};
        const unknownSims: any[] = [];

        // Get all team records for name lookup
        const {data: teams, error} = await supabaseAdmin
            .from('teams')
            .select('*, users!leader_id(*)').eq('admin_id', await admin_id(user));

        // Create a fast lookup map from team ID to name
        const teamMap = new Map<string, string>();
        for (const team of teams ?? []) {
            teamMap.set(team.id, team.name);
        }

        for (const sim of simCards) {
            const teamName = teamMap.get(sim.team_id) || 'Unknown';
            sim.team = teamName;

            if (teamName === 'Unknown') {
                unknownSims.push(sim);
            } else {
                if (!teamGroups[teamName]) {
                    teamGroups[teamName] = {quality: [], nonQuality: []};
                }

                if (sim.quality === SIMStatus.QUALITY) {
                    teamGroups[teamName].quality.push(sim);
                } else {
                    teamGroups[teamName].nonQuality.push(sim);
                }
            }
        }

        // Build the team reports
        const teamReports = Object.entries(teamGroups).map(([teamName, data]) => {
            const qualityCount = data.quality.length;
            const nonQualityCount = data.nonQuality.length;
            const totalCount = qualityCount + nonQualityCount;

            return {
                teamName,
                records: [...data.quality, ...data.nonQuality].filter(r => r.quality == "N"),
                qualityCount,
                matchedCount: totalCount
            };
        });

        // Add unknown team report
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
            return makeResponse({error: (error as Error).message});
        }
    }
}

export default ReportActions;