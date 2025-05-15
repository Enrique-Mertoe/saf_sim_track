import {SIMCard, Team, User} from "@/models";
import ExcelJS from 'exceljs';
import {saveAs} from 'file-saver';

type Team1 = Team & {
    leader_id: User
}
type SimCard = SIMCard & {
    sold_by_user_id: User;
    team_id: Team1;
    quality: string;
};

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

const generateExcel = async ({
                                 simData,
                                 groupedByTeam,
                                 unknownSource,
                                 teamPerformance,
                                 periodsLabels,
                                 startDate,
                                 endDate,
                                 user
                             }: {
    simData: SimCard[],
    groupedByTeam: { [key: string]: { quality: SimCard[], nonQuality: SimCard[] } },
    unknownSource: SIMCard[],
    teamPerformance: TeamPerformance[],
    periodsLabels: string[],
    startDate: string,
    endDate: string,
    user: User
}) => {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = user.full_name;
    workbook.lastModifiedBy = user.full_name;
    workbook.created = new Date();
    workbook.modified = new Date();

    // Define headers
    const headers = [
        'Serial', 'Team', 'Activation Date', 'Top Up Date', 'Top Up Amount',
        'Bundle Purchase Date', 'Bundle Amount', 'Usage', 'Till/Mobigo MSISDN', 'BA MSISDN'
    ];

    // Define header style with light green background
    const headerStyle = {
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {argb: '9AE085'}  // Light green color
        },
        font: {bold: true},
        border: {
            top: {style: 'thin'},
            left: {style: 'thin'},
            bottom: {style: 'thin'},
            right: {style: 'thin'}
        }
    };

    // Define team colors
    const TEAM_COLORS = ['92D050', '00B0F0', 'FFC000', 'FF0000', '7030A0']; // Green, Blue, Yellow, Red, Purple

    // Create RAW sheet with all data
    const rawSheet = workbook.addWorksheet('Raw Data');

    // Add header row
    rawSheet.addRow(headers);

    // Add data rows
    simData.forEach(sim => {
        rawSheet.addRow([
            sim.serial_number,
            sim.team_id.name || 'Unknown',
            sim.activation_date || '',
            sim.top_up_date || '',
            sim.top_up_amount ? `Kes ${sim.top_up_amount.toFixed(2)}` : '',
            sim.bundle_purchase_date || '',
            sim.bundle_amount ? `Kes ${sim.bundle_amount.toFixed(2)}` : '',
            sim.usage?.toString(),
            sim.agent_msisdn,
            sim.ba_msisdn
        ]);
    });

    // Apply header style
    applyHeaderStyle(rawSheet, headers, headerStyle);

    // Set column widths for better visibility
    setColumnWidths(rawSheet, headers);

    // Add auto-filter (important: this must be set AFTER adding all data)
    rawSheet.autoFilter = {
        from: {row: 1, column: 1},
        to: {row: 1, column: headers.length}
    };

    // Ensure auto-filter is properly applied
    rawSheet.state = 'visible';

    // Create sheets for each team
    let colorIndex = 0;

    Object.entries(groupedByTeam).forEach(([leader, data]) => {
        // Quality sheet
        if (data.quality.length > 0) {
            const qualitySheet = workbook.addWorksheet(`${leader} team quality`);

            // Add header row
            qualitySheet.addRow(headers);

            // Add data rows
            data.quality.forEach(sim => {
                qualitySheet.addRow([
                    sim.serial_number,
                    sim.team_id.name || 'Unknown',
                    sim.activation_date || '',
                    sim.top_up_date || '',
                    sim.top_up_amount ? `Kes ${sim.top_up_amount.toFixed(2)}` : '',
                    sim.bundle_purchase_date || '',
                    sim.bundle_amount ? `Kes ${sim.bundle_amount.toFixed(2)}` : '',
                    sim.usage?.toString(),
                    sim.agent_msisdn,
                    sim.ba_msisdn
                ]);
            });

            // Apply header style
            applyHeaderStyle(qualitySheet, headers, headerStyle);

            // Set column widths
            setColumnWidths(qualitySheet, headers);

            // Add auto-filter (important: set AFTER adding all data)
            qualitySheet.autoFilter = {
                from: {row: 1, column: 1},
                to: {row: 1, column: headers.length}
            };

            // Set tab color
            qualitySheet.properties.tabColor = {argb: TEAM_COLORS[colorIndex]};

            // Ensure auto-filter is properly applied
            qualitySheet.state = 'visible';
        }

        // Non-quality sheet
        if (data.nonQuality.length > 0) {
            const nonQualitySheet = workbook.addWorksheet(`${leader} team non quality`);

            // Add header row
            nonQualitySheet.addRow(headers);

            // Add data rows
            data.nonQuality.forEach(sim => {
                nonQualitySheet.addRow([
                    sim.serial_number,
                    sim.team_id.name || 'Unknown',
                    sim.activation_date || '',
                    sim.top_up_date || '',
                    sim.top_up_amount ? `Kes ${sim.top_up_amount.toFixed(2)}` : '',
                    sim.bundle_purchase_date || '',
                    sim.bundle_amount ? `Kes ${sim.bundle_amount.toFixed(2)}` : '',
                    sim.usage?.toString(),
                    sim.agent_msisdn,
                    sim.ba_msisdn
                ]);
            });

            // Apply header style
            applyHeaderStyle(nonQualitySheet, headers, headerStyle);

            // Set column widths
            setColumnWidths(nonQualitySheet, headers);

            // Add auto-filter (important: set AFTER adding all data)
            nonQualitySheet.autoFilter = {
                from: {row: 1, column: 1},
                to: {row: 1, column: headers.length}
            };

            // Set tab color
            nonQualitySheet.properties.tabColor = {argb: TEAM_COLORS[colorIndex]};

            // Ensure auto-filter is properly applied
            nonQualitySheet.state = 'visible';
        }

        colorIndex = (colorIndex + 1) % TEAM_COLORS.length;
    });

    // Create Unknown Source sheet
    if (unknownSource.length > 0) {
        const unknownSheet = workbook.addWorksheet('Unknown source');

        // Add header row
        unknownSheet.addRow(headers);

        // Add data rows
        unknownSource.forEach(sim => {
            unknownSheet.addRow([
                sim.serial_number,
                'Unknown Source',
                sim.activation_date || '',
                sim.top_up_date || '',
                sim.top_up_amount ? `Kes ${sim.top_up_amount.toFixed(2)}` : '',
                sim.bundle_purchase_date || '',
                sim.bundle_amount ? `Kes ${sim.bundle_amount.toFixed(2)}` : '',
                sim.usage?.toString(),
                sim.agent_msisdn,
                sim.ba_msisdn
            ]);
        });

        // Apply header style
        applyHeaderStyle(unknownSheet, headers, headerStyle);

        // Set column widths
        setColumnWidths(unknownSheet, headers);

        // Add auto-filter (important: set AFTER adding all data)
        unknownSheet.autoFilter = {
            from: {row: 1, column: 1},
            to: {row: 1, column: headers.length}
        };

        // Ensure auto-filter is properly applied
        unknownSheet.state = 'visible';
    }

    // Create Performance sheet with horizontal period layout
    const performanceSheet = workbook.addWorksheet('%Performance');

    // Define cell styles
    const headerStyleGreen = {
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {argb: '9AE085'}  // Light green color
        },
        font: {bold: true},
        border: {
            top: {style: 'thin'},
            left: {style: 'thin'},
            bottom: {style: 'thin'},
            right: {style: 'thin'}
        },
        alignment: {horizontal: 'center'}
    };

    // Add first row with Team header and period headers
    const firstRow = performanceSheet.addRow(['Team']);

    // @ts-ignore
    performanceSheet.getCell('A1').fill = headerStyleGreen.fill;
    performanceSheet.getCell('A1').font = headerStyleGreen.font;
    // @ts-ignore
    performanceSheet.getCell('A1').border = headerStyleGreen.border;

    // Add periods headers (horizontally)
    let colIndex = 2; // Start from column B
    periodsLabels.forEach(period => {
        const cell = performanceSheet.getCell(1, colIndex);
        cell.value = period;
        // @ts-ignore
        cell.fill = headerStyleGreen.fill;
        cell.font = headerStyleGreen.font;
        // @ts-ignore
        cell.border = headerStyleGreen.border;

        // Merge cells for period header (spans 3 columns)
        performanceSheet.mergeCells(1, colIndex, 1, colIndex + 2);

        colIndex += 3; // Move to next period (3 columns per period)
    });

    // Add comment header
    const commentCell = performanceSheet.getCell(1, colIndex);
    commentCell.value = 'Comment';
    // @ts-ignore
    commentCell.fill = headerStyleGreen.fill;
    commentCell.font = headerStyleGreen.font;
    // @ts-ignore
    commentCell.border = headerStyleGreen.border;

    // Add subheaders row (Total activation, Quality, Percentage performance)
    const subHeaderRow = performanceSheet.addRow(['']);
    colIndex = 2; // Start from column B

    // Add subheaders for each period
    periodsLabels.forEach(period => {
        performanceSheet.getCell(2, colIndex).value = 'Total activation';
        performanceSheet.getCell(2, colIndex + 1).value = 'Quality';
        performanceSheet.getCell(2, colIndex + 2).value = 'Percentage performance';

        // Apply style to subheaders
        for (let i = 0; i < 3; i++) {
            const cell = performanceSheet.getCell(2, colIndex + i);
            // @ts-ignore
            cell.fill = headerStyleGreen.fill;
            cell.font = headerStyleGreen.font;
            // @ts-ignore
            cell.border = headerStyleGreen.border;
        }

        colIndex += 3; // Move to next period
    });

    // Add team data rows
    let rowIndex = 3; // Start from row 3
    teamPerformance.forEach(team => {
        const dataRow = performanceSheet.addRow([team.teamName]);
        colIndex = 2; // Start from column B

        // Add data for each period
        periodsLabels.forEach(period => {
            const periodData = team.periods[period];
            if (periodData) {
                performanceSheet.getCell(rowIndex, colIndex).value = periodData.totalActivation;
                performanceSheet.getCell(rowIndex, colIndex + 1).value = periodData.qualityCount;
                performanceSheet.getCell(rowIndex, colIndex + 2).value = `${periodData.percentagePerformance.toFixed(2)}%`;

                // Add comment to the last column for the first period only
                if (colIndex === 2) {
                    performanceSheet.getCell(rowIndex, colIndex + (periodsLabels.length * 3)).value = periodData.comment;
                }
            } else {
                // If no data for this period, add empty cells
                performanceSheet.getCell(rowIndex, colIndex).value = '';
                performanceSheet.getCell(rowIndex, colIndex + 1).value = '';
                performanceSheet.getCell(rowIndex, colIndex + 2).value = '';
            }

            colIndex += 3; // Move to next period
        });

        rowIndex++;
    });

    // Add "Monthly Performance" section
    rowIndex += 2; // Add some spacing

    // Add monthly header
    const monthlyHeaderCell = performanceSheet.getCell(rowIndex, 1);
    monthlyHeaderCell.value = 'Monthly Performance';
    monthlyHeaderCell.font = {bold: true};
    performanceSheet.mergeCells(rowIndex, 1, rowIndex, periodsLabels.length * 3 + 1);
    rowIndex++;

    // Add monthly header row
    performanceSheet.getCell(rowIndex, 1).value = 'Team';
    performanceSheet.getCell(rowIndex, 2).value = 'Total activation';
    performanceSheet.getCell(rowIndex, 3).value = 'Quality';
    performanceSheet.getCell(rowIndex, 4).value = 'Percentage performance';

    // Apply style to monthly headers
    for (let i = 1; i <= 4; i++) {
        const cell = performanceSheet.getCell(rowIndex, i);
        // @ts-ignore
        cell.fill = headerStyleGreen.fill;
        cell.font = headerStyleGreen.font;
        // @ts-ignore
        cell.border = headerStyleGreen.border;
    }

    // Add monthly period label
    rowIndex++;
    const monthlyPeriodCell = performanceSheet.getCell(rowIndex, 1);
    monthlyPeriodCell.value = 'Mar Date 1-30';
    monthlyPeriodCell.font = {bold: true};
    performanceSheet.mergeCells(rowIndex, 1, rowIndex, 4);
    rowIndex++;

    // Add monthly data
    teamPerformance.forEach(team => {
        // Calculate monthly totals
        let totalActivation = 0;
        let totalQuality = 0;
        let overallPercentage = 0;

        // Sum up values from all periods
        periodsLabels.forEach(period => {
            const periodData = team.periods[period];
            if (periodData) {
                totalActivation += periodData.totalActivation;
                totalQuality += periodData.qualityCount;
            }
        });

        // Calculate monthly percentage
        overallPercentage = totalQuality / totalActivation * 100;

        // Add monthly data row
        performanceSheet.addRow([
            team.teamName,
            totalActivation,
            totalQuality,
            `${overallPercentage.toFixed(2)}%`
        ]);

        rowIndex++;
    });

    // Set column widths for better visibility
    performanceSheet.getColumn(1).width = 15; // Team column

    // Set width for all data columns
    for (let i = 2; i <= periodsLabels.length * 3 + 1; i++) {
        performanceSheet.getColumn(i).width = 20;
    }

    // Generate Excel file name
    const startDateStr = startDate.replace(/-/g, '');
    const endDateStr = endDate.replace(/-/g, '');
    const fileName = `Van_Quality_Report_${startDateStr}_${endDateStr}.xlsx`;

    // Set workbook properties to ensure auto-filter displays properly
    workbook.views = [
        {
            firstSheet: 0,
            activeTab: 0,
            visibility: 'visible',
            x: 0,
            y: 0,
            width: 0,
            height: 0
        }
    ];

    // Browser environment - generate a blob and use FileSaver
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    saveAs(blob, fileName);
};

// Helper function to apply style to header row
function applyHeaderStyle(worksheet: ExcelJS.Worksheet, headers: string[], style: any) {
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = style.fill;
        cell.font = style.font;
        cell.border = style.border;
    });

    // Freeze the top row to keep headers visible when scrolling
    worksheet.views = [{state: 'frozen', xSplit: 0, ySplit: 1}];
}

// Helper function to apply style to a specific row
function applyStyleToRow(worksheet: ExcelJS.Worksheet, rowIndex: number, style: any) {
    const row = worksheet.getRow(rowIndex);
    row.eachCell((cell) => {
        cell.fill = style.fill;
        cell.font = style.font;
        cell.border = style.border;
    });
}

// Helper function to set appropriate column widths
function setColumnWidths(worksheet: ExcelJS.Worksheet, headers: string[]) {
    headers.forEach((header, index) => {
        const column = worksheet.getColumn(index + 1);
        // Set width based on header content
        column.width = Math.max(header.length + 2, 12);
    });
}

export default generateExcel;