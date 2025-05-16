// src/pages/Reports/utils/reportGenerator.ts
import ExcelJS from 'exceljs';
import {ProcessedReport, ProcessedRecord, TeamReport} from '../types';

/**
 * Generate Excel reports from processed data with enhanced formatting using ExcelJS
 */
export const generateTeamReports = async (processedReport: ProcessedReport): Promise<{ rawData: ArrayBuffer }> => {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();

    // Define tab colors for different sheets (in RGB hex)
    const tabColors = {
        'Raw Data': 'FFC000', // Yellow
        'Summary': '00B0F0',  // Blue
        'Unknown SIMs': 'FF5B5B', // Red
        'Team': '92D050' // Green (base color for team sheets)
    };

    // Define header style (blue background with white text)
    const headerStyle = {
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {argb: 'FF1F497D'} // Blue with alpha channel
        },
        font: {
            color: {argb: 'FFFFFFFF'}, // White
            bold: true
        },
        alignment: {
            horizontal: 'center',
            vertical: 'middle'
        },
        border: {
            top: {style: 'thin'},
            left: {style: 'thin'},
            bottom: {style: 'thin'},
            right: {style: 'thin'}
        }
    };

    // Create Raw Data worksheet
    const rawDataSheet = workbook.addWorksheet('Raw Data', {
        properties: {
            tabColor: {argb: 'FF' + tabColors['Raw Data']}
        }
    });
    await populateRawDataWorksheet(rawDataSheet, processedReport.rawRecords, headerStyle);

    // Create Summary worksheet
    const summarySheet = workbook.addWorksheet('Summary', {
        properties: {
            tabColor: {argb: 'FF' + tabColors['Summary']}
        }
    });
    await populateSummaryWorksheet(summarySheet, processedReport, headerStyle, tabColors);

    // Create Team worksheets
    processedReport.teamReports.forEach((teamReport, index) => {
        if (teamReport.teamName !== 'Unknown' && teamReport.records.length > 0) {
            const sheetName = `Team - ${teamReport.teamName}`;
            const teamSheet = workbook.addWorksheet(sheetName, {
                properties: {
                    tabColor: {argb: 'FF' + tabColors['Team']}
                }
            });
            populateTeamWorksheet(teamSheet, teamReport, headerStyle);
        }
    });

    // Create Unknown SIMs worksheet if needed
    const unknownTeamReport = processedReport.teamReports.find(tr => tr.teamName === 'Unknown');
    if (unknownTeamReport && unknownTeamReport.records.length > 0) {
        const unknownSheet = workbook.addWorksheet('Unknown SIMs', {
            properties: {
                tabColor: {argb: 'FF' + tabColors['Unknown SIMs']}
            }
        });
        populateTeamWorksheet(unknownSheet, unknownTeamReport, headerStyle);
    }

    // Generate the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    return {
        rawData: buffer as ArrayBuffer,
    };
};


 const columns = [
    { header: 'Serial', key: 'simSerialNumber', width: 10 },
    { header: 'Team', key: 'team', width: 15 },
    { header: 'Activation Date', key: 'activationDate', width: 18 },
    { header: 'Top Up Date', key: 'topUpDate', width: 15 },
    { header: 'Top Up Amount', key: 'topUpAmount', width: 15 },
    { header: 'Bundle Purchase Date', key: 'bundlePurchaseDate', width: 20 },
    { header: 'Bundle Amount', key: 'bundleAmount', width: 15 },
    { header: 'Usage', key: 'usage', width: 15 },
    { header: 'Till/Mobigo MSISDN', key: 'agentMSISDN', width: 20 },
    { header: 'BA MSISDN', key: 'ba', width: 15 },
];

/**
 * Populate Raw Data worksheet with all records
 */
const populateRawDataWorksheet = async (
    worksheet: ExcelJS.Worksheet,
    records: ProcessedRecord[],
    headerStyle: any
): Promise<void> => {
    // Sort by team
    const sortedRecords = [...records].sort((a, b) =>
        a.team === b.team ? 0 : (a.team < b.team ? -1 : 1)
    );



    // Define columns
    const colsumns = [
        {header: 'Serial', key: 'simSerialNumber', width: 20},
        {header: 'Team', key: 'team', width: 15},
        {header: 'TM Date', key: 'tmDate', width: 15},
        {header: 'ID Date', key: 'idDate', width: 15},
        {header: 'ID', key: 'id', width: 12},
        {header: 'Month', key: 'month', width: 12},
        {header: 'Dealer Shortcode', key: 'dealerShortcode', width: 18},
        {header: 'Dealer Name', key: 'dealerName', width: 20},

        {header: 'Top Up Date', key: 'topUpDate', width: 15},
        {header: 'Top Up Amount', key: 'topUpAmount', width: 15},
        {header: 'Agent MSISDN', key: 'agentMSISDN', width: 15},
        {header: 'BA', key: 'ba', width: 10},
        {header: 'Region', key: 'region', width: 15},
        {header: 'Territory', key: 'territory', width: 15},
        {header: 'Cluster', key: 'cluster', width: 15},
        {header: 'Cumulative Usage', key: 'cumulativeUsage', width: 18},
        {header: 'Cumulative Commission', key: 'cumulativeCommission', width: 20},
        {header: 'Fraud Flagged', key: 'fraudFlagged', width: 15},
        {header: 'Fraud Suspension Date', key: 'fraudSuspensionDate', width: 20},
        {header: 'Fraud Reason', key: 'fraudReason', width: 20},
        {header: 'Role', key: 'role', width: 15},
        {header: 'Quality', key: 'quality', width: 12},

        {header: 'Uploaded By', key: 'uploadedBy', width: 15},
        {header: 'Matched', key: 'matched', width: 12},
        {header: 'Quality SIM', key: 'qualitySim', width: 15}
    ];

    // Add columns to the worksheet
    worksheet.columns = columns;

    // Apply header styles
    worksheet.getRow(1).eachCell((cell) => {
        Object.assign(cell, headerStyle);
    });
    worksheet.getRow(1).height = 30;

    // Add data rows
    let currentTeam = '';
    let alternateColorIndex = 0;
    const alternateColors = [
        {argb: 'FFEEEEEE'}, // Light gray
        {argb: 'FFDDDDDD'}  // Slightly darker gray
    ];

    sortedRecords.forEach((record, index) => {
        // Track team changes for alternating colors
        if (record.team !== currentTeam) {
            currentTeam = record.team;
            alternateColorIndex = (alternateColorIndex + 1) % 2;
        }

        // Add the row
        const rowData = {
            tmDate: record.tmDate,
            idDate: record.id,
            id: record.dateId,
            month: record.month,
            dealerShortcode: record.dealerShortcode,
            dealerName: record.dealerName,
            simSerialNumber: record.simSerialNumber,
            topUpDate: record.topUpDate,
            topUpAmount: record.topUpAmount,
            agentMSISDN: record.agentMSISDN,
            ba: record.ba,
            region: record.region,
            territory: record.territory,
            cluster: record.cluster,
            cumulativeUsage: record.cumulativeUsage,
            cumulativeCommission: record.cumulativeCommission,
            fraudFlagged: record.fraudFlagged,
            fraudSuspensionDate: record.fraudSuspensionDate,
            fraudReason: record.fraudReason,
            role: record.role,
            quality: record.quality,
            team: record.team,
            uploadedBy: record.uploadedBy,
            matched: record.matched ? 'Yes' : 'No',
            qualitySim: record.qualitySim ? 'Yes' : 'No'
        };

        const row = worksheet.addRow(rowData);

        // Color the row based on the team (alternating colors for same team)
        const fillColor = alternateColors[alternateColorIndex];
        row.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: fillColor
            };
        });
    });

    // Add autofilter to the header row
    worksheet.autoFilter = {
        from: {
            row: 1,
            column: 1
        },
        to: {
            row: 1,
            column: columns.length
        }
    };
};

/**
 * Populate Team worksheet with team records
 */
const populateTeamWorksheet = (
    worksheet: ExcelJS.Worksheet,
    teamReport: TeamReport,
    headerStyle: any
): void => {
    // Define columns
    const columssns = [
        {header: 'TM Date', key: 'tmDate', width: 15},
        {header: 'ID Date', key: 'idDate', width: 15},
        {header: 'ID', key: 'id', width: 12},
        {header: 'Month', key: 'month', width: 12},
        {header: 'Dealer Shortcode', key: 'dealerShortcode', width: 18},
        {header: 'Dealer Name', key: 'dealerName', width: 20},
        {header: 'Sim Serial Number', key: 'simSerialNumber', width: 20},
        {header: 'Top Up Date', key: 'topUpDate', width: 15},
        {header: 'Top Up Amount', key: 'topUpAmount', width: 15},
        {header: 'Agent MSISDN', key: 'agentMSISDN', width: 15},
        {header: 'BA', key: 'ba', width: 10},
        {header: 'Region', key: 'region', width: 15},
        {header: 'Territory', key: 'territory', width: 15},
        {header: 'Cluster', key: 'cluster', width: 15},
        {header: 'Cumulative Usage', key: 'cumulativeUsage', width: 18},
        {header: 'Cumulative Commission', key: 'cumulativeCommission', width: 20},
        {header: 'Fraud Flagged', key: 'fraudFlagged', width: 15},
        {header: 'Fraud Suspension Date', key: 'fraudSuspensionDate', width: 20},
        {header: 'Fraud Reason', key: 'fraudReason', width: 20},
        {header: 'Role', key: 'role', width: 15},
        {header: 'Quality', key: 'quality', width: 12},
        {header: 'Uploaded By', key: 'uploadedBy', width: 15},
        {header: 'Matched', key: 'matched', width: 12},
        {header: 'Quality SIM', key: 'qualitySim', width: 15}
    ];

    // Add columns to the worksheet
    worksheet.columns = columns;

    // Apply header styles
    worksheet.getRow(1).eachCell((cell) => {
        Object.assign(cell, headerStyle);
    });
    worksheet.getRow(1).height = 30;

    // Add data rows
    teamReport.records.forEach((record) => {
        const rowData = {
            tmDate: record.tmDate,
            idDate: record.id,
            id: record.dateId,
            month: record.month,
            dealerShortcode: record.dealerShortcode,
            dealerName: record.dealerName,
            simSerialNumber: record.simSerialNumber,
            topUpDate: record.topUpDate,
            topUpAmount: record.topUpAmount,
            agentMSISDN: record.agentMSISDN,
            ba: record.ba,
            region: record.region,
            territory: record.territory,
            cluster: record.cluster,
            cumulativeUsage: record.cumulativeUsage,
            cumulativeCommission: record.cumulativeCommission,
            fraudFlagged: record.fraudFlagged,
            fraudSuspensionDate: record.fraudSuspensionDate,
            fraudReason: record.fraudReason,
            role: record.role,
            quality: record.quality,
            uploadedBy: record.uploadedBy,
            matched: record.matched ? 'Yes' : 'No',
            qualitySim: record.qualitySim ? 'Yes' : 'No'
        };

        worksheet.addRow(rowData);
    });

    // Add autofilter to the header row
    worksheet.autoFilter = {
        from: {
            row: 1,
            column: 1
        },
        to: {
            row: 1,
            column: columns.length
        }
    };
};

/**
 * Populate Summary worksheet with aggregated team data
 */
const populateSummaryWorksheet = async (
    worksheet: ExcelJS.Worksheet,
    processedReport: ProcessedReport,
    headerStyle: any,
    tabColors: { [key: string]: string }
): Promise<void> => {
    // Define summary columns
    const columns = [
        {header: 'Team', key: 'team', width: 20},
        {header: 'Total Records', key: 'totalRecords', width: 15},
        {header: 'Matched Records', key: 'matchedRecords', width: 18},
        {header: 'Match Rate (%)', key: 'matchRate', width: 15},
        {header: 'Quality SIMs', key: 'qualitySims', width: 15},
        {header: 'Quality Rate (%)', key: 'qualityRate', width: 18},
        {header: 'Fraud Flagged', key: 'fraudFlagged', width: 15},
        {header: 'Fraud Rate (%)', key: 'fraudRate', width: 15},
        {header: 'Total Commission', key: 'totalCommission', width: 18},
        {header: 'Total Usage', key: 'totalUsage', width: 15},
        {header: 'Avg Commission', key: 'avgCommission', width: 18},
        {header: 'Avg Usage', key: 'avgUsage', width: 15},
        {header: 'Top Region', key: 'topRegion', width: 20},
        {header: 'Region Count', key: 'regionCount', width: 15}
    ];

    // Add columns to the worksheet
    worksheet.columns = columns;

    // Apply header styles
    worksheet.getRow(1).eachCell((cell) => {
        Object.assign(cell, headerStyle);
    });
    worksheet.getRow(1).height = 30;

    // Process team data for summary
    processedReport.teamReports.forEach((teamReport) => {
        // Skip empty teams
        if (teamReport.records.length === 0) return;

        // Calculate summary metrics
        const totalRecords = teamReport.records.length;
        const matchedRecords = teamReport.records.filter(r => r.matched).length;
        const qualitySimRecords = teamReport.records.filter(r => r.qualitySim).length;
        const fraudFlaggedRecords = teamReport.records.filter(r => r.fraudFlagged).length;

        // Calculate totals
        const totalCommission = teamReport.records.reduce((sum, record) => {
            const commission = typeof record.cumulativeCommission === 'number'
                ? record.cumulativeCommission
                : parseFloat(record.cumulativeCommission as string) || 0;
            return sum + commission;
        }, 0);

        const totalUsage = teamReport.records.reduce((sum, record) => {
            const usage = typeof record.cumulativeUsage === 'number'
                ? record.cumulativeUsage
                : parseFloat(record.cumulativeUsage as string) || 0;
            return sum + usage;
        }, 0);

        // Group by regions
        const regionCounts: Record<string, number> = {};
        teamReport.records.forEach(record => {
            if (record.region) {
                regionCounts[record.region] = (regionCounts[record.region] || 0) + 1;
            }
        });

        // Find top region
        let topRegion = 'None';
        let topRegionCount = 0;

        Object.entries(regionCounts).forEach(([region, count]) => {
            if (count > topRegionCount) {
                topRegion = region;
                topRegionCount = count;
            }
        });

        // Add the summary row
        const row = worksheet.addRow({
            team: teamReport.teamName,
            totalRecords: totalRecords,
            matchedRecords: matchedRecords,
            matchRate: totalRecords > 0 ? Math.round((matchedRecords / totalRecords) * 100) : 0,
            qualitySims: qualitySimRecords,
            qualityRate: totalRecords > 0 ? Math.round((qualitySimRecords / totalRecords) * 100) : 0,
            fraudFlagged: fraudFlaggedRecords,
            fraudRate: totalRecords > 0 ? Math.round((fraudFlaggedRecords / totalRecords) * 100) : 0,
            totalCommission: totalCommission.toFixed(2),
            totalUsage: totalUsage.toFixed(2),
            avgCommission: totalRecords > 0 ? (totalCommission / totalRecords).toFixed(2) : '0.00',
            avgUsage: totalRecords > 0 ? (totalUsage / totalRecords).toFixed(2) : '0.00',
            topRegion: topRegion,
            regionCount: topRegionCount
        });

        // Determine color based on team name
        let teamColor;
        if (teamReport.teamName === 'Unknown') {
            teamColor = tabColors['Unknown SIMs'];
        } else {
            teamColor = tabColors['Team'];
        }

        // Create a lighter version of the color (70% white, 30% original)
        const r = parseInt(teamColor.substring(0, 2), 16);
        const g = parseInt(teamColor.substring(2, 4), 16);
        const b = parseInt(teamColor.substring(4, 6), 16);

        const lightR = Math.round(0.7 * 255 + 0.3 * r).toString(16).padStart(2, '0');
        const lightG = Math.round(0.7 * 255 + 0.3 * g).toString(16).padStart(2, '0');
        const lightB = Math.round(0.7 * 255 + 0.3 * b).toString(16).padStart(2, '0');

        const lightColor = lightR + lightG + lightB;

        // Apply the background color to all cells in the row
        row.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'FF' + lightColor}
            };
        });
    });

    // Add autofilter to the header row
    worksheet.autoFilter = {
        from: {
            row: 1,
            column: 1
        },
        to: {
            row: 1,
            column: columns.length
        }
    };
};