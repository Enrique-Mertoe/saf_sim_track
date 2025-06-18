// src/pages/Reports/utils/reportGenerator.ts
import ExcelJS from 'exceljs';
import {ProcessedRecord, ProcessedReport, TeamReport} from '../types';

const columns = [
    {header: 'Serial', key: 'simSerialNumber', width: 25},
    {header: 'Team', key: 'team', width: 25},
    {header: 'Activation Date', key: 'activationDate', width: 18},
    {header: 'Top Up Date', key: 'topUpDate', width: 15},
    {header: 'Top Up Amount', key: 'topUpAmount', width: 15},
    {header: 'Bundle Purchase Date', key: 'bundlePurchaseDate', width: 20},
    {header: 'Bundle Amount', key: 'bundleAmount', width: 15},
    {header: 'Usage', key: 'cumulativeUsage', width: 15},
    {header: 'Till/Mobigo MSISDN', key: 'agentMSISDN', width: 20},
    {header: 'BA MSISDN', key: 'ba', width: 15},
];
/**
 * Generate Excel reports from processed data with enhanced formatting using ExcelJS
 */
export const generateTeamReports = async (processedReport: ProcessedReport, cols = columns): Promise<{
    rawData: ArrayBuffer
}> => {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();

    // Define base tab colors for different sheets (in RGB hex)
    const baseTabColors = {
        'Raw Data': 'FFC000', // Yellow
        'Summary': '00B0F0',  // Blue
        'Unknown SIMs': 'FF5B5B', // Red
    };

    // Generate unique colors for each team
    const teamColors: { [key: string]: string } = {};

    // Create a color palette for teams
    const teamColorPalette = [
        '92D050', // Green
        '7030A0', // Purple
        '0070C0', // Blue
        'FF0000', // Red
        'FFC000', // Yellow
        '00B050', // Dark Green
        'C00000', // Dark Red
        '002060', // Navy Blue
        'FF6600', // Orange
        '00CCFF', // Light Blue
        'FF9999', // Light Red
        '99CC00', // Lime
        'FF99CC', // Pink
        '993366', // Burgundy
        '663300', // Brown
        '333399', // Indigo
        '339966', // Sea Green
        '996633', // Tan
        'FF8080', // Coral
        '808000'  // Olive
    ];

    // Assign colors to teams from the palette
    processedReport.teamReports.forEach((teamReport, index) => {
        if (teamReport.teamName === 'Unknown') {
            teamColors[teamReport.teamName] = baseTabColors['Unknown SIMs'];
        } else {
            // Use modulo to cycle through the colors if there are more teams than colors
            const colorIndex = index % teamColorPalette.length;
            teamColors[teamReport.teamName] = teamColorPalette[colorIndex];
        }
    });

    // Define header style (blue background with white text)
    const headerStyle = {
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {argb: '00a540'}
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
            tabColor: {argb: 'FF' + baseTabColors['Raw Data']}
        }
    });
    await populateRawDataWorksheet(rawDataSheet, processedReport.rawRecords, headerStyle, teamColors, cols);

    // // Create Summary worksheet
    // const summarySheet = workbook.addWorksheet('Summary', {
    //     properties: {
    //         tabColor: {argb: 'FF' + baseTabColors['Summary']}
    //     }
    // });
    // await populateSummaryWorksheet(summarySheet, processedReport, headerStyle, teamColors, cols);

    // Create Team worksheets
    processedReport.teamReports.forEach((teamReport) => {
        if (teamReport.teamName !== 'Unknown' && teamReport.records.length > 0) {
            const sheetName = `${teamReport.teamName}`;
            const teamSheet = workbook.addWorksheet(sheetName, {
                properties: {
                    tabColor: {argb: 'FF' + teamColors[teamReport.teamName]}
                }
            });
            teamReport.records = teamReport.records.filter(r => r.quality == "N")
            populateTeamWorksheet(teamSheet, teamReport, headerStyle, cols);
        }
    });

    // Create Unknown SIMs worksheet if needed
    const unknownTeamReport = processedReport.teamReports.find(tr => tr.teamName === 'Unknown');
    if (unknownTeamReport && unknownTeamReport.records.length > 0) {
        const unknownSheet = workbook.addWorksheet('Unknown SIMs', {
            properties: {
                tabColor: {argb: 'FF' + baseTabColors['Unknown SIMs']}
            }
        });
        populateTeamWorksheet(unknownSheet, unknownTeamReport, headerStyle, cols);
    }

    // Inside the generateTeamReports function, add this before the return statement:

    // const performanceSheet = workbook.addWorksheet('%Performance', {
    //     properties: {
    //         tabColor: {argb: 'FF92D050'}
    //     }
    // });
    // populatePerformanceWorksheet(performanceSheet, headerStyle, processedReport);

    // Generate the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    return {
        rawData: buffer as ArrayBuffer,
    };
};


/**
 * Populate Raw Data worksheet with all records
 */
const populateRawDataWorksheet = async (
    worksheet: ExcelJS.Worksheet,
    records: ProcessedRecord[],
    headerStyle: any,
    teamColors: { [key: string]: string },
    cols: any
): Promise<void> => {
    // Sort by team
    const sortedRecords = [...records].sort((a, b) =>
        a.team === b.team ? 0 : (a.team < b.team ? -1 : 1)
    );

    // Add columns to the worksheet
    worksheet.columns = cols;

    // Apply header styles
    worksheet.getRow(1).eachCell((cell) => {
        Object.assign(cell, headerStyle);
    });
    worksheet.getRow(1).height = 30;

    // Add data rows
    let currentTeam = '';

    sortedRecords.forEach((record) => {
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
            activationDate: record.dateId,
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

        // Get team color or use default if not found
        const teamColor = teamColors[record.team] || '92D050';

        // Create a lighter version of the color (85% white, 15% original) for better readability
        const r = parseInt(teamColor.substring(0, 2), 16);
        const g = parseInt(teamColor.substring(2, 4), 16);
        const b = parseInt(teamColor.substring(4, 6), 16);

        const lightR = Math.round(0.85 * 255 + 0.15 * r).toString(16).padStart(2, '0');
        const lightG = Math.round(0.85 * 255 + 0.15 * g).toString(16).padStart(2, '0');
        const lightB = Math.round(0.85 * 255 + 0.15 * b).toString(16).padStart(2, '0');

        const lightColor = lightR + lightG + lightB;

        // Apply team color to the row
        row.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'FF' + lightColor}
            };
        });


        // Add border when team changes
        if (record.team !== currentTeam) {
            if (currentTeam !== '') {
                // Add a thicker border to the top of this row to separate teams
                row.eachCell((cell) => {
                    cell.border = {
                        ...cell.border,
                        top: {style: 'medium'}
                    };
                });
            }
            currentTeam = record.team;
        }
    });

    // Add autofilter to the header row
    worksheet.autoFilter = {
        from: {
            row: 1,
            column: 1
        },
        to: {
            row: 1,
            column: cols.length
        }
    };

};

/**
 * Populate Team worksheet with team records
 */
const populateTeamWorksheet = (
    worksheet: ExcelJS.Worksheet,
    teamReport: TeamReport,
    headerStyle: any, cols: any
): void => {
    worksheet.columns = cols;

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
            team: record.team,
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
            activationDate: record.dateId,
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
            column: cols.length
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
    teamColors: { [key: string]: string },
    cols: any
): Promise<void> => {

    // Add columns to the worksheet
    worksheet.columns = cols;

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

        // Get the appropriate team color
        const teamColor = teamColors[teamReport.teamName];

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
            column: cols.length
        }
    };
};


// Add this function to the existing code
/**
 * Populate Performance worksheet with team performance data
 */
const populatePerformanceWorksheet = (
    worksheet: ExcelJS.Worksheet,
    headerStyle: any,
    processedReport: ProcessedReport
): void => {
    // Define performance columns
    // Add columns to the worksheet
    worksheet.columns = [
        {header: 'Team', key: 'team', width: 20},
        {header: 'Total activation', key: 'totalActivation1', width: 15},
        {header: 'Quality', key: 'quality1', width: 15},
        {header: 'Percentage performance', key: 'percentage1', width: 25},
        {header: 'Total activation', key: 'totalActivation2', width: 15},
        {header: 'Quality', key: 'quality2', width: 15},
        {header: 'Percentage performance', key: 'percentage2', width: 25},
        {header: 'Total activation', key: 'totalActivation3', width: 15},
        {header: 'Quality', key: 'quality3', width: 15},
        {header: 'Percentage performance', key: 'percentage3', width: 25},
        {header: 'Comment', key: 'comment', width: 15}
    ];

    // Add header row
    const headerRow = worksheet.addRow([
        'Team', 'Total activation', 'Quality', 'Percentage performance',
        'Total activation', 'Quality', 'Percentage performance',
        'Total activation', 'Quality', 'Percentage performance', 'Comment'
    ]);

    // Apply header styles
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {argb: '00a540'} // Green color with alpha
        };
        cell.font = {bold: true};
        cell.alignment = {horizontal: 'center', vertical: 'middle'};
        cell.border = {
            top: {style: 'thin'},
            left: {style: 'thin'},
            bottom: {style: 'thin'},
            right: {style: 'thin'}
        };
    });

    // Create period headers row
    const periodRow = worksheet.addRow(['', 'Mar Date 1-9', '', '', 'Mar Date 10-16', '', '', 'Mar Date 17-30', '', '', '']);

    // Apply styles to period headers
    for (let i = 1; i <= 11; i++) {
        const cell = periodRow.getCell(i);
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {argb: '00a540'} // Green color
        };
        cell.font = {bold: true};
        cell.alignment = {horizontal: 'center', vertical: 'middle'};
        cell.border = {
            top: {style: 'thin'},
            left: {style: 'thin'},
            bottom: {style: 'thin'},
            right: {style: 'thin'}
        };
    }

    // Merge cells for period headers
    worksheet.mergeCells(2, 2, 2, 4); // Mar Date 1-9
    worksheet.mergeCells(2, 5, 2, 7); // Mar Date 10-16
    worksheet.mergeCells(2, 8, 2, 10); // Mar Date 17-30

    // Define color styles
    const blueBackgroundFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: 'FFCCFFFF'} // Light blue
    };

    const pinkBackgroundFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: 'FFFF99FF'} // Pink
    };

    // Generate performance data from the processed report
    const teamReports = processedReport.teamReports.filter(team => team.teamName !== 'Unknown');

    // Skip if no team data
    if (teamReports.length === 0) {
        worksheet.addRow(['No team data available']);
        return;
    }

    // Calculate performance metrics for each team
    const performanceData = teamReports.map(team => {
        const totalActivation = team.matchedCount;
        const quality = team.qualityCount;
        const percentagePerformance = totalActivation > 0
            ? (quality / totalActivation) * 100
            : 0;

        // For simplicity, we'll use the same values for all three periods
        // In a real implementation, you would calculate these based on date ranges
        const comment = percentagePerformance >= 90 ? 'Well done' : 'Improve';

        return [
            team.teamName,
            totalActivation,
            quality,
            percentagePerformance,
            totalActivation,
            quality,
            percentagePerformance,
            totalActivation,
            quality,
            percentagePerformance,
            comment
        ];
    });

    // Add data rows
    performanceData.forEach((rowData) => {
        const row = worksheet.addRow(rowData);

        // Apply cell styles and colors
        row.eachCell((cell, colNumber) => {
            cell.border = {
                top: {style: 'thin'},
                left: {style: 'thin'},
                bottom: {style: 'thin'},
                right: {style: 'thin'}
            };

            // Apply blue background to Mar Date 1-9 columns
            if (colNumber >= 2 && colNumber <= 4) {
                // @ts-ignore
                cell.fill = blueBackgroundFill;
            }
            // Apply pink background to Mar Date 10-16 columns
            else if (colNumber >= 5 && colNumber <= 7) {
                // @ts-ignore
                cell.fill = pinkBackgroundFill;
            }

            // Format percentage cells
            if ([4, 7, 10].includes(colNumber)) {
                cell.numFmt = '0.00000000';
                cell.alignment = {horizontal: 'right'};
            }
        });
    });

    // Add empty row for separation
    worksheet.addRow([]);

    // Add Monthly Performance header
    const monthlyHeader = worksheet.addRow(['', 'Monthly Performance', '', '']);
    monthlyHeader.getCell(2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: '00a540'} // Green color
    };
    monthlyHeader.getCell(2).font = {bold: true};
    monthlyHeader.getCell(2).alignment = {horizontal: 'center', vertical: 'middle'};
    monthlyHeader.getCell(2).border = {
        top: {style: 'thin'},
        left: {style: 'thin'},
        bottom: {style: 'thin'},
        right: {style: 'thin'}
    };
    worksheet.mergeCells(8, 2, 8, 4);

    // Add monthly columns header
    const monthlyColumnsHeader = worksheet.addRow(['Team', 'Total activation', 'Quality', 'Percentage performance']);
    monthlyColumnsHeader.eachCell((cell, colNumber) => {
        if (colNumber <= 4) {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: '00a540'} // Green color
            };
            cell.font = {bold: true};
            cell.alignment = {horizontal: 'center', vertical: 'middle'};
            cell.border = {
                top: {style: 'thin'},
                left: {style: 'thin'},
                bottom: {style: 'thin'},
                right: {style: 'thin'}
            };
        }
    });

    // Add Mar Date 1-30 header
    const marDateHeader = worksheet.addRow(['', 'Mar Date 1-30', '', '']);
    marDateHeader.getCell(2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: '00a540'} // Green color
    };
    marDateHeader.getCell(2).font = {bold: true};
    marDateHeader.getCell(2).alignment = {horizontal: 'center', vertical: 'middle'};
    marDateHeader.getCell(2).border = {
        top: {style: 'thin'},
        left: {style: 'thin'},
        bottom: {style: 'thin'},
        right: {style: 'thin'}
    };
    worksheet.mergeCells(10, 2, 10, 4);

    // Generate monthly performance data from the processed report
    const monthlyData = teamReports.map(team => {
        const totalActivation = team.matchedCount;
        const quality = team.qualityCount;
        const percentagePerformance = totalActivation > 0
            ? (quality / totalActivation) * 100
            : 0;

        return [
            team.teamName,
            totalActivation,
            quality,
            percentagePerformance
        ];
    });

    monthlyData.forEach((rowData) => {
        const row = worksheet.addRow(rowData);

        // Apply cell styles
        row.eachCell((cell, colNumber) => {
            if (colNumber <= 4) {
                cell.border = {
                    top: {style: 'thin'},
                    left: {style: 'thin'},
                    bottom: {style: 'thin'},
                    right: {style: 'thin'}
                };
                // @ts-ignore
                cell.fill = blueBackgroundFill;

                // Format percentage cells
                if (colNumber === 4) {
                    cell.numFmt = '0.00000000';
                    cell.alignment = {horizontal: 'right'};
                }
            }
        });
    });
};
