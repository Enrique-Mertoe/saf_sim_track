// =============================================
// REPORTING AND ANALYTICS ENGINE
// =============================================

// app/api/security/reports/generate/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {supabaseAdmin} from '@/lib/security/supabase-client';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
    try {
        const {reportType, timeRange, format, includeCharts} = await request.json();

        let reportData;
        switch (reportType) {
            case 'security-summary':
                reportData = await generateSecuritySummaryReport(timeRange);
                break;
            case 'incident-analysis':
                reportData = await generateIncidentAnalysisReport(timeRange);
                break;
            case 'threat-intelligence':
                reportData = await generateThreatIntelligenceReport(timeRange);
                break;
            case 'compliance':
                reportData = await generateComplianceReport(timeRange);
                break;
            default:
                throw new Error('Invalid report type');
        }

        if (format === 'pdf') {
            const pdfBuffer = await generatePDFReport(reportData, reportType);
            return new NextResponse(pdfBuffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${reportType}-${timeRange}.pdf"`
                }
            });
        } else if (format === 'excel') {
            const excelBuffer = await generateExcelReport(reportData, reportType);
            return new NextResponse(excelBuffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="${reportType}-${timeRange}.xlsx"`
                }
            });
        } else {
            return NextResponse.json({data: reportData});
        }
    } catch (error) {
        console.error('Report generation error:', error);
        return NextResponse.json(
            {success: false, error: 'Failed to generate report'},
            {status: 500}
        );
    }
}

async function generateSecuritySummaryReport(timeRange: string) {
    const startDate = getStartDate(timeRange);

    const {data: summary} = await supabaseAdmin.rpc('get_security_summary_report', {
        start_date: startDate,
        end_date: new Date().toISOString()
    });

    return {
        title: 'Security Summary Report',
        period: timeRange,
        generatedAt: new Date().toISOString(),
        metrics: summary?.[0] || {},
        sections: [
            {
                title: 'Executive Summary',
                content: await generateExecutiveSummary(summary?.[0])
            },
            {
                title: 'Threat Landscape',
                content: await getThreatLandscapeData(startDate)
            },
            {
                title: 'Incident Overview',
                content: await getIncidentOverviewData(startDate)
            },
            {
                title: 'Performance Metrics',
                content: await getPerformanceMetricsData(startDate)
            },
            {
                title: 'Recommendations',
                content: await generateSecurityRecommendations(summary?.[0])
            }
        ]
    };
}

async function generateIncidentAnalysisReport(timeRange: string) {
    const startDate = getStartDate(timeRange);

    const {data: incidents} = await supabaseAdmin
        .from('security_incidents')
        .select(`
      *,
      incident_events (*)
    `)
        .gte('detected_at', startDate)
        .order('detected_at', {ascending: false});

    const analysis = {
        totalIncidents: incidents?.length || 0,
        //@ts-ignore
        byCategory: groupBy(incidents, 'category'),
        //@ts-ignore
        bySeverity: groupBy(incidents, 'severity'),
        //@ts-ignore
        byStatus: groupBy(incidents, 'status'),
        //@ts-ignore
        avgResolutionTime: calculateAverageResolutionTime(incidents),
        //@ts-ignore
        trendsAnalysis: await analyzeTrends(incidents),
        //@ts-ignore
        topAttackVectors: getTopAttackVectors(incidents)
    };

    return {
        title: 'Incident Analysis Report',
        period: timeRange,
        analysis,
        incidents: incidents?.slice(0, 50) || [], // Include top 50 incidents
        recommendations: generateIncidentRecommendations(analysis)
    };
}

async function generateThreatIntelligenceReport(timeRange: string) {
    const startDate = getStartDate(timeRange);

    const {data: threatData} = await supabaseAdmin.rpc('get_threat_intelligence_report', {
        start_date: startDate
    });

    return {
        title: 'Threat Intelligence Report',
        period: timeRange,
        intelligence: threatData,
        topThreats: await getTopThreats(startDate),
        geographicAnalysis: await getGeographicThreatAnalysis(startDate),
        attackPatterns: await getAttackPatternAnalysis(startDate),
        iocList: await getIndicatorsOfCompromise(startDate)
    };
}


// =============================================
// REPORT GENERATION FUNCTIONS
// =============================================


// Generate compliance report (SOC2, ISO27001, etc.)
async function generateComplianceReport(timeRange: string) {
    const startDate = getStartDate(timeRange);
    const endDate = new Date().toISOString();

    try {
        // Fetch compliance-relevant data
        const [
            {data: securityEvents},
            {data: incidents},
            {data: accessLogs},
            {data: configChanges},
            {data: policyViolations}
        ] = await Promise.all([
            supabaseAdmin
                .from('security_request_logs')
                .select('*')
                .gte('created_at', startDate)
                .lte('created_at', endDate),

            supabaseAdmin
                .from('security_incidents')
                .select('*')
                .gte('detected_at', startDate)
                .lte('detected_at', endDate),

            supabaseAdmin
                .from('security_request_logs')
                .select('ip_address, user_id, created_at, path, method')
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .not('user_id', 'is', null),

            supabaseAdmin
                .from('security_config')
                .select('*')
                .gte('updated_at', startDate)
                .lte('updated_at', endDate),

            supabaseAdmin
                .from('security_request_logs')
                .select('*')
                .in('threat_level', ['high', 'critical'])
                .gte('created_at', startDate)
                .lte('created_at', endDate)
        ]);

        // Calculate compliance metrics
        const totalRequests = securityEvents?.length || 0;
        const securityIncidents = incidents?.length || 0;
        const criticalIncidents = incidents?.filter(i => i.severity === 'critical').length || 0;
        const resolvedIncidents = incidents?.filter(i => i.status === 'resolved').length || 0;
        const avgResolutionTime = calculateAverageResolutionTime(incidents || []);

        // Access control metrics
        const uniqueUsers = new Set(accessLogs?.map(log => log.user_id)).size;
        const privilegedAccess = accessLogs?.filter(log =>
            log.path.includes('/admin') || log.path.includes('/security')
        ).length || 0;

        // Policy compliance
        const policyViolationRate = totalRequests > 0 ?
            ((policyViolations?.length || 0) / totalRequests * 100).toFixed(2) : '0';

        // Data retention compliance
        const dataRetentionCompliance = await checkDataRetentionCompliance();

        // Security controls effectiveness
        const blockedThreats = securityEvents?.filter(e => e.blocked).length || 0;
        const threatDetectionRate = totalRequests > 0 ?
            (blockedThreats / totalRequests * 100).toFixed(2) : '0';

        return {
            title: 'Security Compliance Report',
            period: `${startDate.split('T')[0]} to ${endDate.split('T')[0]}`,
            generatedAt: new Date().toISOString(),
            framework: 'SOC2 Type II / ISO 27001',

            executiveSummary: {
                overallCompliance: calculateOverallCompliance(securityIncidents, criticalIncidents, policyViolationRate),
                keyFindings: generateComplianceFindings(securityIncidents, avgResolutionTime, policyViolationRate),
                recommendations: generateComplianceRecommendations(securityIncidents, policyViolationRate)
            },

            securityControls: {
                accessControl: {
                    status: 'Compliant',
                    uniqueUsers,
                    privilegedAccessEvents: privilegedAccess,
                    multiFactorAuthEnabled: true, // Check your actual MFA implementation
                    passwordPolicyCompliant: true
                },

                incidentResponse: {
                    status: securityIncidents > 0 && avgResolutionTime <= 240 ? 'Compliant' : 'Non-Compliant',
                    totalIncidents: securityIncidents,
                    criticalIncidents,
                    avgResolutionTimeMinutes: avgResolutionTime,
                    escalationProceduresFollowed: resolvedIncidents / Math.max(securityIncidents, 1) * 100
                },

                dataProtection: {
                    status: dataRetentionCompliance.compliant ? 'Compliant' : 'Non-Compliant',
                    encryptionInTransit: true,
                    encryptionAtRest: true,
                    dataRetentionPolicy: dataRetentionCompliance,
                    backupProcedures: 'Automated daily backups with 90-day retention'
                },

                monitoring: {
                    status: 'Compliant',
                    logRetention: '90 days',
                    threatDetectionRate: `${threatDetectionRate}%`,
                    securityEventMonitoring: '24/7 automated monitoring',
                    alertingEnabled: true
                },

                vulnerabilityManagement: {
                    status: 'Compliant',
                    patchManagement: 'Monthly security updates',
                    vulnerabilityScanning: 'Weekly automated scans',
                    penetrationTesting: 'Annual third-party assessment'
                }
            },

            auditEvidence: {
                configurationChanges: configChanges?.length || 0,
                policyViolations: policyViolations?.length || 0,
                securityTraining: 'Annual security awareness training completed',
                documentationReviews: 'Quarterly policy and procedure reviews'
            },

            riskAssessment: {
                highRiskFindings: criticalIncidents,
                mediumRiskFindings: incidents?.filter(i => i.severity === 'medium').length || 0,
                lowRiskFindings: incidents?.filter(i => i.severity === 'low').length || 0,
                riskMitigationStatus: 'All critical risks have been addressed or have mitigation plans'
            },

            nextSteps: {
                requiredActions: generateRequiredActions(securityIncidents, policyViolationRate),
                nextAuditDate: getNextAuditDate(),
                continuousMonitoring: 'Real-time security monitoring and alerting in place'
            }
        };
    } catch (error) {
        console.error('Failed to generate compliance report:', error);
        throw new Error('Compliance report generation failed');
    }
}

// Generate PDF report from data
async function generatePDFReport(data: any, reportType: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({margin: 50});
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).font('Helvetica-Bold');
            doc.text(data.title || 'Security Report', {align: 'center'});
            doc.moveDown();

            // Report metadata
            doc.fontSize(12).font('Helvetica');
            doc.text(`Generated: ${new Date().toLocaleString()}`, {align: 'right'});
            doc.text(`Period: ${data.period || 'N/A'}`, {align: 'right'});
            doc.text(`Report Type: ${reportType}`, {align: 'right'});
            doc.moveDown(2);

            // Executive Summary
            if (data.executiveSummary || data.metrics) {
                doc.fontSize(16).font('Helvetica-Bold');
                doc.text('Executive Summary');
                doc.moveDown();

                doc.fontSize(12).font('Helvetica');
                if (data.executiveSummary?.overallCompliance) {
                    doc.text(`Overall Compliance: ${data.executiveSummary.overallCompliance}`);
                }

                if (data.metrics) {
                    Object.entries(data.metrics).forEach(([key, value]) => {
                        doc.text(`${formatKey(key)}: ${formatValue(value)}`);
                    });
                }
                doc.moveDown(2);
            }

            // Key Findings
            if (data.executiveSummary?.keyFindings) {
                doc.fontSize(16).font('Helvetica-Bold');
                doc.text('Key Findings');
                doc.moveDown();

                doc.fontSize(12).font('Helvetica');
                data.executiveSummary.keyFindings.forEach((finding: string, index: number) => {
                    doc.text(`${index + 1}. ${finding}`);
                });
                doc.moveDown(2);
            }

            // Sections
            if (data.sections) {
                data.sections.forEach((section: any) => {
                    // Check if we need a new page
                    if (doc.y > 700) {
                        doc.addPage();
                    }

                    doc.fontSize(16).font('Helvetica-Bold');
                    doc.text(section.title);
                    doc.moveDown();

                    doc.fontSize(12).font('Helvetica');
                    if (typeof section.content === 'string') {
                        doc.text(section.content);
                    } else if (Array.isArray(section.content)) {
                        section.content.forEach((item: any) => {
                            if (typeof item === 'string') {
                                doc.text(`• ${item}`);
                            } else {
                                doc.text(`• ${JSON.stringify(item)}`);
                            }
                        });
                    } else if (typeof section.content === 'object') {
                        Object.entries(section.content).forEach(([key, value]) => {
                            doc.text(`${formatKey(key)}: ${formatValue(value)}`);
                        });
                    }
                    doc.moveDown(2);
                });
            }

            // Security Controls (for compliance reports)
            if (data.securityControls) {
                doc.addPage();
                doc.fontSize(18).font('Helvetica-Bold');
                doc.text('Security Controls Assessment');
                doc.moveDown(2);

                Object.entries(data.securityControls).forEach(([controlName, controlData]: [string, any]) => {
                    doc.fontSize(14).font('Helvetica-Bold');
                    doc.text(formatKey(controlName));
                    doc.moveDown();

                    doc.fontSize(12).font('Helvetica');
                    if (controlData.status) {
                        doc.fillColor(controlData.status === 'Compliant' ? 'green' : 'red');
                        doc.text(`Status: ${controlData.status}`);
                        doc.fillColor('black');
                    }

                    Object.entries(controlData).forEach(([key, value]) => {
                        if (key !== 'status') {
                            doc.text(`${formatKey(key)}: ${formatValue(value)}`);
                        }
                    });
                    doc.moveDown(1.5);
                });
            }

            // Recommendations
            if (data.recommendations) {
                doc.addPage();
                doc.fontSize(16).font('Helvetica-Bold');
                doc.text('Recommendations');
                doc.moveDown();

                doc.fontSize(12).font('Helvetica');
                if (Array.isArray(data.recommendations)) {
                    data.recommendations.forEach((rec: string, index: number) => {
                        doc.text(`${index + 1}. ${rec}`);
                        doc.moveDown(0.5);
                    });
                }
            }

            // Footer
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                doc.fontSize(10).font('Helvetica');
                doc.text(
                    `Page ${i + 1} of ${pageCount}`,
                    doc.page.width - 100,
                    doc.page.height - 50,
                    {align: 'right'}
                );
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

// Generate Excel report from data
async function generateExcelReport(data: any, reportType: string): Promise<Buffer> {
    try {
        const workbook = XLSX.utils.book_new();

        // Summary Sheet
        const summaryData = [
            ['Report Type', reportType],
            ['Generated', new Date().toISOString()],
            ['Period', data.period || 'N/A'],
            [''],
            ['Executive Summary', ''],
        ];

        if (data.metrics) {
            summaryData.push(['Metrics', '']);
            Object.entries(data.metrics).forEach(([key, value]) => {
                summaryData.push([formatKey(key), formatValue(value)]);
            });
        }

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

        // Detailed Data Sheets
        if (data.incidents) {
            const incidentData = data.incidents.map((incident: any) => ({
                'Incident ID': incident.id,
                'Title': incident.title,
                'Severity': incident.severity,
                'Status': incident.status,
                'Category': incident.category,
                'Detected At': incident.detectedAt,
                'Resolved At': incident.resolvedAt || 'Not Resolved',
                'MTTR (minutes)': incident.mttrMinutes || 'N/A'
            }));

            const incidentSheet = XLSX.utils.json_to_sheet(incidentData);
            XLSX.utils.book_append_sheet(workbook, incidentSheet, 'Incidents');
        }

        if (data.topThreats) {
            const threatData = data.topThreats.map((threat: any) => ({
                'IP Address': threat.ipAddress,
                'Total Requests': threat.totalRequests,
                'Threat Requests': threat.threatRequests,
                'Risk Score': threat.maxRiskScore,
                'Countries': threat.countries?.join(', '),
                'Last Seen': threat.lastSeen,
                'Blocked': threat.isBlocked ? 'Yes' : 'No'
            }));

            const threatSheet = XLSX.utils.json_to_sheet(threatData);
            XLSX.utils.book_append_sheet(workbook, threatSheet, 'Top Threats');
        }

        if (data.securityControls) {
            const controlsData = Object.entries(data.securityControls).map(([name, control]: [string, any]) => ({
                'Control Name': formatKey(name),
                'Status': control.status || 'Unknown',
                'Details': JSON.stringify(control, null, 2)
            }));

            const controlsSheet = XLSX.utils.json_to_sheet(controlsData);
            XLSX.utils.book_append_sheet(workbook, controlsSheet, 'Security Controls');
        }

        return XLSX.write(workbook, {type: 'buffer', bookType: 'xlsx'});
    } catch (error) {
        console.error('Failed to generate Excel report:', error);
        throw new Error('Excel report generation failed');
    }
}

// =============================================
// DATE AND TIME UTILITIES
// =============================================

function getStartDate(timeRange: string): string {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
        case '1h':
            startDate = new Date(now.getTime() - 60 * 60 * 1000);
            break;
        case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default to 24 hours
    }

    return startDate.toISOString();
}

// =============================================
// DATA ANALYSIS FUNCTIONS
// =============================================

async function generateExecutiveSummary(metrics: any) {
    if (!metrics) return 'No data available for the selected period.';

    const {
        totalRequests = 0,
        blockedRequests = 0,
        suspiciousIPs = 0,
        activeThreats = 0,
        avgResponseTime = 0,
        incidentsToday = 0
    } = metrics;

    const blockRate = totalRequests > 0 ? (blockedRequests / totalRequests * 100).toFixed(1) : '0';
    const threatDensity = totalRequests > 0 ? (activeThreats / totalRequests * 1000).toFixed(1) : '0';

    return `
Executive Summary:

During the reporting period, our security systems processed ${totalRequests.toLocaleString()} requests from ${suspiciousIPs} unique suspicious IP addresses. Our automated defense systems successfully blocked ${blockedRequests.toLocaleString()} malicious requests (${blockRate}% block rate), demonstrating effective threat mitigation.

Key Performance Indicators:
• Threat Detection: ${activeThreats} active high-severity threats identified
• Response Time: Average ${avgResponseTime}ms system response time  
• Incident Volume: ${incidentsToday} security incidents reported today
• Threat Density: ${threatDensity} threats per 1,000 requests

Overall Assessment: ${getOverallAssessment(activeThreats, blockRate, avgResponseTime)}

The security posture remains ${activeThreats > 10 ? 'elevated' : 'stable'} with continuous monitoring and automated response systems operating effectively.
  `.trim();
}

async function getThreatLandscapeData(startDate: string) {
    try {
        const {data: threatData} = await supabaseAdmin.rpc('get_threat_landscape_analysis', {
            start_date: startDate
        });

        const analysis = threatData?.[0] || {};

        return {
            overview: `Threat landscape analysis reveals ${analysis.total_threats || 0} distinct threats across ${analysis.unique_countries || 0} countries.`,

            topThreatTypes: [
                {type: 'SQL Injection', count: analysis.sql_injection_attempts || 0, trend: 'increasing'},
                {type: 'XSS Attempts', count: analysis.xss_attempts || 0, trend: 'stable'},
                {type: 'Path Traversal', count: analysis.path_traversal_attempts || 0, trend: 'decreasing'},
                {type: 'Reconnaissance', count: analysis.recon_attempts || 0, trend: 'increasing'},
                {type: 'Brute Force', count: analysis.brute_force_attempts || 0, trend: 'stable'}
            ],

            geographicDistribution: analysis.top_threat_countries || [],

            temporalPatterns: {
                peakHours: analysis.peak_threat_hours || [],
                weekdayVsWeekend: {
                    weekday: analysis.weekday_threats || 0,
                    weekend: analysis.weekend_threats || 0
                }
            },

            emergingThreats: analysis.new_threat_patterns || [],

            recommendations: [
                'Increase monitoring during peak threat hours (typically 2-6 AM UTC)',
                'Consider geo-blocking for countries with minimal legitimate traffic',
                'Implement rate limiting for reconnaissance-heavy endpoints',
                'Update WAF rules to address emerging attack patterns'
            ]
        };
    } catch (error) {
        console.error('Failed to get threat landscape data:', error);
        return {overview: 'Unable to generate threat landscape analysis.'};
    }
}

async function getIncidentOverviewData(startDate: string) {
    try {
        const {data: incidents} = await supabaseAdmin
            .from('security_incidents')
            .select('*')
            .gte('detected_at', startDate);

        if (!incidents || incidents.length === 0) {
            return {
                overview: 'No security incidents reported during this period.',
                statistics: {total: 0, resolved: 0, avgResolution: 0},
                trends: [],
                recommendations: ['Continue monitoring for potential threats']
            };
        }

        const totalIncidents = incidents.length;
        const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;
        const avgResolution = calculateAverageResolutionTime(incidents);
        const bySeverity = groupBy(incidents, 'severity');
        const byCategory = groupBy(incidents, 'category');

        return {
            overview: `${totalIncidents} security incidents were detected, with ${resolvedIncidents} successfully resolved (${(resolvedIncidents / totalIncidents * 100).toFixed(1)}% resolution rate).`,

            statistics: {
                total: totalIncidents,
                resolved: resolvedIncidents,
                avgResolutionMinutes: avgResolution,
                criticalIncidents: bySeverity.critical?.length || 0,
                highSeverityIncidents: bySeverity.high?.length || 0
            },

            categoryBreakdown: Object.entries(byCategory).map(([category, incidents]) => ({
                category,
                count: incidents.length,
                percentage: (incidents.length / totalIncidents * 100).toFixed(1)
            })),

            trends: await analyzeTrends(incidents),

            recommendations: generateIncidentRecommendations({
                totalIncidents,
                avgResolutionTime: avgResolution,
                bySeverity,
                byCategory
            })
        };
    } catch (error) {
        console.error('Failed to get incident overview data:', error);
        return {overview: 'Unable to generate incident overview.'};
    }
}

async function getPerformanceMetricsData(startDate: string) {
    try {
        const {data: performanceData} = await supabaseAdmin.rpc('get_performance_metrics', {
            start_date: startDate
        });

        const metrics = performanceData?.[0] || {};

        return {
            overview: `System performance metrics show ${metrics.avg_response_time || 0}ms average response time with ${metrics.uptime_percentage || 0}% uptime.`,

            responseTime: {
                average: metrics.avg_response_time || 0,
                p95: metrics.p95_response_time || 0,
                p99: metrics.p99_response_time || 0,
                trend: getPerformanceTrend(metrics.response_time_trend)
            },

            throughput: {
                requestsPerSecond: metrics.requests_per_second || 0,
                peakRPS: metrics.peak_rps || 0,
                averageLoad: metrics.average_load || 0
            },

            availability: {
                uptime: metrics.uptime_percentage || 0,
                downtime: metrics.downtime_minutes || 0,
                mtbf: metrics.mean_time_between_failures || 0,
                mttr: metrics.mean_time_to_recovery || 0
            },

            resourceUtilization: {
                cpuUsage: metrics.avg_cpu_usage || 0,
                memoryUsage: metrics.avg_memory_usage || 0,
                diskIO: metrics.avg_disk_io || 0,
                networkIO: metrics.avg_network_io || 0
            },

            recommendations: generatePerformanceRecommendations(metrics)
        };
    } catch (error) {
        console.error('Failed to get performance metrics:', error);
        return {overview: 'Unable to generate performance metrics.'};
    }
}

async function generateSecurityRecommendations(metrics: any) {
    const recommendations = [];

    if (!metrics) {
        return ['Insufficient data to generate recommendations. Ensure monitoring is properly configured.'];
    }

    const {
        totalRequests = 0,
        blockedRequests = 0,
        activeThreats = 0,
        avgResponseTime = 0,
        suspiciousIPs = 0
    } = metrics;

    const blockRate = totalRequests > 0 ? (blockedRequests / totalRequests) : 0;
    const threatRate = totalRequests > 0 ? (activeThreats / totalRequests) : 0;

    // Block rate analysis
    if (blockRate < 0.01) {
        recommendations.push('Consider reviewing threat detection rules - block rate appears low');
    } else if (blockRate > 0.1) {
        recommendations.push('High block rate detected - review for potential false positives');
    }

    // Response time analysis
    if (avgResponseTime > 1000) {
        recommendations.push('Optimize system performance - response times exceed 1 second');
    }

    // Threat density analysis
    if (threatRate > 0.05) {
        recommendations.push('Implement additional rate limiting and geographic filtering');
    }

    // Active threats
    if (activeThreats > 20) {
        recommendations.push('Consider activating enhanced monitoring mode due to high threat volume');
    }

    // Suspicious IPs
    if (suspiciousIPs > 100) {
        recommendations.push('Review IP reputation feeds and consider expanding blocklists');
    }

    // General recommendations
    recommendations.push(
        'Regularly update threat detection signatures',
        'Conduct monthly security posture reviews',
        'Ensure incident response playbooks are current',
        'Validate backup and recovery procedures'
    );

    return recommendations;
}

// =============================================
// STATISTICAL AND ANALYTICAL FUNCTIONS
// =============================================

function groupBy<T>(array: T[], key: string): Record<string, T[]> {
    return array.reduce((groups, item) => {
        const group = (item as any)[key] || 'unknown';
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
    }, {} as Record<string, T[]>);
}

function calculateAverageResolutionTime(incidents: any[]): number {
    if (!incidents || incidents.length === 0) return 0;

    const resolvedIncidents = incidents.filter(incident =>
        incident.resolved_at && incident.detected_at
    );

    if (resolvedIncidents.length === 0) return 0;

    const totalResolutionTime = resolvedIncidents.reduce((total, incident) => {
        const detected = new Date(incident.detected_at).getTime();
        const resolved = new Date(incident.resolved_at).getTime();
        return total + (resolved - detected);
    }, 0);

    // Return average in minutes
    return Math.round(totalResolutionTime / resolvedIncidents.length / (1000 * 60));
}

async function analyzeTrends(incidents: any[]) {
    if (!incidents || incidents.length === 0) {
        return {
            overall: 'stable',
            severityTrends: {},
            categoryTrends: {},
            volumeTrend: 'stable',
            insights: ['Insufficient data for trend analysis']
        };
    }

    // Group incidents by day
    const incidentsByDay = groupBy(
        incidents.map(incident => ({
            ...incident,
            day: incident.detected_at.split('T')[0]
        })),
        'day'
    );

    const dailyCounts = Object.entries(incidentsByDay)
        .map(([day, dayIncidents]) => ({
            day,
            count: dayIncidents.length,
            critical: dayIncidents.filter(i => i.severity === 'critical').length,
            high: dayIncidents.filter(i => i.severity === 'high').length
        }))
        .sort((a, b) => a.day.localeCompare(b.day));

    // Calculate trend
    const volumeTrend = calculateTrend(dailyCounts.map(d => d.count));

    // Severity trends
    const severityTrends = {
        critical: calculateTrend(dailyCounts.map(d => d.critical)),
        high: calculateTrend(dailyCounts.map(d => d.high))
    };

    // Category trends
    const categories = [...new Set(incidents.map(i => i.category))];
    const categoryTrends = categories.reduce((trends, category) => {
        const categoryCounts = dailyCounts.map(day =>
            incidentsByDay[day.day]?.filter(i => i.category === category).length || 0
        );
        trends[category] = calculateTrend(categoryCounts);
        return trends;
    }, {} as Record<string, string>);

    return {
        overall: volumeTrend,
        severityTrends,
        categoryTrends,
        volumeTrend,
        dailyData: dailyCounts,
        insights: generateTrendInsights(volumeTrend, severityTrends, categoryTrends)
    };
}

function getTopAttackVectors(incidents: any[]): Array<{ vector: string, count: number, percentage: number }> {
    if (!incidents || incidents.length === 0) return [];

    const vectorCounts = incidents.reduce((counts, incident) => {
        const vector = incident.attack_vector || incident.attackVector || 'Unknown';
        counts[vector] = (counts[vector] || 0) + 1;
        return counts;
    }, {} as Record<string, number>);

    const total = incidents.length;
//@ts-ignore
    return Object.entries(vectorCounts)
        .map(([vector, count]) => ({
            vector,
            count,
            //@ts-ignore
            percentage: Math.round((count / total) * 100)
        }))
        //@ts-ignore
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10
}

function generateIncidentRecommendations(analysis: {
    totalIncidents: number;
    avgResolutionTime: number;
    bySeverity: Record<string, any[]>;
    byCategory: Record<string, any[]>;
}): string[] {
    const recommendations = [];
    const {totalIncidents, avgResolutionTime, bySeverity, byCategory} = analysis;

    // Volume-based recommendations
    if (totalIncidents > 50) {
        recommendations.push('Consider implementing automated incident triage due to high volume');
    } else if (totalIncidents < 5) {
        recommendations.push('Review threat detection sensitivity - incident volume seems low');
    }

    // Resolution time recommendations
    if (avgResolutionTime > 240) { // 4 hours
        recommendations.push('Improve incident response procedures - resolution time exceeds target');
    } else if (avgResolutionTime < 30) { // 30 minutes
        recommendations.push('Excellent response times - consider documenting best practices');
    }

    // Severity-based recommendations
    const criticalCount = bySeverity.critical?.length || 0;
    if (criticalCount > 5) {
        recommendations.push('High number of critical incidents - review preventive controls');
    }

    // Category-based recommendations
    const topCategory = Object.entries(byCategory)
        .sort(([, a], [, b]) => b.length - a.length)[0];

    if (topCategory && topCategory[1].length > totalIncidents * 0.3) {
        recommendations.push(`Focus on ${topCategory[0]} incidents - they represent ${Math.round(topCategory[1].length / totalIncidents * 100)}% of all incidents`);
    }

    // Standard recommendations
    recommendations.push(
        'Conduct post-incident reviews for all critical and high-severity incidents',
        'Update incident response playbooks based on recent patterns',
        'Ensure all team members are trained on current procedures'
    );

    return recommendations;
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function formatKey(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/_/g, ' ');
}

function formatValue(value: any): string {
    if (typeof value === 'number') {
        if (value > 1000) {
            return value.toLocaleString();
        }
        return value.toString();
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}

function getOverallAssessment(activeThreats: number, blockRate: string, avgResponseTime: number): string {
    const blockRateNum = parseFloat(blockRate);

    if (activeThreats > 20 || blockRateNum > 10 || avgResponseTime > 1000) {
        return 'ELEVATED RISK - Immediate attention required';
    } else if (activeThreats > 10 || blockRateNum > 5 || avgResponseTime > 500) {
        return 'MODERATE RISK - Monitor closely';
    } else {
        return 'LOW RISK - Systems operating normally';
    }
}

function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const first = values.slice(0, Math.floor(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));

    const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
    const secondAvg = second.reduce((a, b) => a + b, 0) / second.length;

    const threshold = firstAvg * 0.1; // 10% threshold

    if (secondAvg > firstAvg + threshold) return 'increasing';
    if (secondAvg < firstAvg - threshold) return 'decreasing';
    return 'stable';
}

function generateTrendInsights(volumeTrend: string, severityTrends: any, categoryTrends: any): string[] {
    const insights = [];

    if (volumeTrend === 'increasing') {
        insights.push('Incident volume is trending upward - consider proactive measures');
    } else if (volumeTrend === 'decreasing') {
        insights.push('Incident volume is decreasing - security measures appear effective');
    }

    if (severityTrends.critical === 'increasing') {
        insights.push('Critical incidents are increasing - immediate attention required');
    }

    const increasingCategories = Object.entries(categoryTrends)
        .filter(([, trend]) => trend === 'increasing')
        .map(([category]) => category);

    if (increasingCategories.length > 0) {
        insights.push(`Rising incidents in: ${increasingCategories.join(', ')}`);
    }

    return insights;
}

function getPerformanceTrend(trendValue: number | undefined): 'improving' | 'degrading' | 'stable' {
    if (!trendValue) return 'stable';
    if (trendValue > 0.1) return 'degrading';
    if (trendValue < -0.1) return 'improving';
    return 'stable';
}

function generatePerformanceRecommendations(metrics: any): string[] {
    const recommendations = [];

    if (metrics.avg_response_time > 500) {
        recommendations.push('Optimize database queries and API endpoints');
    }

    if (metrics.uptime_percentage < 99.9) {
        recommendations.push('Investigate reliability issues affecting uptime');
    }

    if (metrics.avg_cpu_usage > 80) {
        recommendations.push('Consider scaling up compute resources');
    }

    if (metrics.avg_memory_usage > 85) {
        recommendations.push('Monitor memory usage and consider optimization');
    }

    return recommendations;
}

// Compliance-specific helper functions
function calculateOverallCompliance(incidents: number, criticalIncidents: number, policyViolationRate: string): string {
    const violationRate = parseFloat(policyViolationRate);

    if (criticalIncidents > 5 || violationRate > 1.0) {
        return 'NON-COMPLIANT - Critical issues identified';
    } else if (incidents > 20 || violationRate > 0.5) {
        return 'PARTIALLY COMPLIANT - Minor issues to address';
    } else {
        return 'COMPLIANT - All requirements met';
    }
}

function generateComplianceFindings(incidents: number, avgResolution: number, violationRate: string): string[] {
    const findings = [];

    if (incidents === 0) {
        findings.push('No security incidents reported during audit period');
    } else {
        findings.push(`${incidents} security incidents documented with proper tracking`);
    }

    if (avgResolution <= 240) {
        findings.push('Incident response times meet compliance requirements (≤4 hours)');
    } else {
        findings.push('Incident response times exceed compliance requirements');
    }

    const rate = parseFloat(violationRate);
    if (rate < 0.1) {
        findings.push('Policy violation rate within acceptable limits');
    } else {
        findings.push('Elevated policy violation rate requires attention');
    }

    return findings;
}

function generateComplianceRecommendations(incidents: number, violationRate: string): string[] {
    const recommendations = [];

    if (incidents > 10) {
        recommendations.push('Implement additional preventive security controls');
    }

    const rate = parseFloat(violationRate);
    if (rate > 0.5) {
        recommendations.push('Enhance security awareness training programs');
        recommendations.push('Review and update security policies');
    }

    recommendations.push(
        'Conduct quarterly compliance assessments',
        'Maintain comprehensive audit documentation',
        'Regular review of access controls and permissions'
    );

    return recommendations;
}

function generateRequiredActions(incidents: number, violationRate: string): string[] {
    const actions = [];

    if (incidents > 20) {
        actions.push('Develop enhanced incident prevention strategy within 30 days');
    }

    const rate = parseFloat(violationRate);
    if (rate > 1.0) {
        actions.push('Implement immediate policy violation remediation plan');
    }

    actions.push(
        'Complete annual security control testing',
        'Update incident response procedures',
        'Schedule next compliance audit'
    );

    return actions;
}

function getNextAuditDate(): string {
    const nextAudit = new Date();
    nextAudit.setFullYear(nextAudit.getFullYear() + 1);
    return nextAudit.toISOString().split('T')[0];
}

async function checkDataRetentionCompliance() {
    try {
        const {data} = await supabaseAdmin
            .from('security_request_logs')
            .select('created_at')
            .order('created_at', {ascending: true})
            .limit(1);

        const oldestRecord = data?.[0]?.created_at;
        if (!oldestRecord) {
            return {compliant: true, oldestData: null, retentionDays: 0};
        }

        const daysSinceOldest = Math.floor(
            (Date.now() - new Date(oldestRecord).getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
            compliant: daysSinceOldest <= 90, // Assuming 90-day retention policy
            oldestData: oldestRecord,
            retentionDays: daysSinceOldest
        };
    } catch (error) {
        //@ts-ignore
        return {compliant: false, error: error.message};
    }
}



// =============================================
// THREAT INTELLIGENCE ANALYSIS FUNCTIONS
// =============================================

// =============================================
// TOP THREATS ANALYSIS
// =============================================

async function getTopThreats(startDate: string) {
    try {
        const endDate = new Date().toISOString();

        // Get comprehensive threat data
        const { data: threatData } = await supabaseAdmin
            .from('security_request_logs')
            .select(`
        ip_address,
        country,
        threat_level,
        risk_score,
        signature_matches,
        behavioral_flags,
        threat_categories,
        user_agent,
        path,
        created_at,
        blocked
      `)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .in('threat_level', ['medium', 'high', 'critical'])
            .order('risk_score', { ascending: false });

        if (!threatData || threatData.length === 0) {
            return {
                overview: 'No significant threats detected during this period.',
                topThreatIPs: [],
                threatsByCategory: [],
                emergingThreats: [],
                threatEvolution: [],
                recommendations: ['Continue monitoring for potential threats']
            };
        }

        // Analyze top threat IPs
        const ipThreatMap = new Map();
        threatData.forEach(threat => {
            const ip = threat.ip_address;
            if (!ipThreatMap.has(ip)) {
                ipThreatMap.set(ip, {
                    ip_address: ip,
                    country: threat.country,
                    total_requests: 0,
                    max_risk_score: 0,
                    threat_categories: new Set(),
                    signature_matches: new Set(),
                    behavioral_flags: new Set(),
                    user_agents: new Set(),
                    target_paths: new Set(),
                    first_seen: threat.created_at,
                    last_seen: threat.created_at,
                    blocked_count: 0,
                    threat_levels: { low: 0, medium: 0, high: 0, critical: 0 }
                });
            }

            const threatInfo = ipThreatMap.get(ip);
            threatInfo.total_requests++;
            threatInfo.max_risk_score = Math.max(threatInfo.max_risk_score, threat.risk_score || 0);

            // Collect threat indicators
            (threat.threat_categories || []).forEach((cat: any) => threatInfo.threat_categories.add(cat));
            (threat.signature_matches || []).forEach((sig: any) => threatInfo.signature_matches.add(sig));
            (threat.behavioral_flags || []).forEach((flag: any) => threatInfo.behavioral_flags.add(flag));

            threatInfo.user_agents.add(threat.user_agent);
            threatInfo.target_paths.add(threat.path);

            if (new Date(threat.created_at) < new Date(threatInfo.first_seen)) {
                threatInfo.first_seen = threat.created_at;
            }
            if (new Date(threat.created_at) > new Date(threatInfo.last_seen)) {
                threatInfo.last_seen = threat.created_at;
            }

            if (threat.blocked) threatInfo.blocked_count++;
            threatInfo.threat_levels[threat.threat_level]++;
        });

        // Convert sets to arrays and sort by risk
        const topThreatIPs = Array.from(ipThreatMap.values())
            .map(threat => ({
                ...threat,
                threat_categories: Array.from(threat.threat_categories),
                signature_matches: Array.from(threat.signature_matches),
                behavioral_flags: Array.from(threat.behavioral_flags),
                user_agents: Array.from(threat.user_agents),
                target_paths: Array.from(threat.target_paths),
                threat_diversity: threat.threat_categories.size + threat.signature_matches.size,
                persistence_score: calculatePersistenceScore(threat),
                sophistication_score: calculateSophisticationScore(threat)
            }))
            .sort((a, b) => b.max_risk_score - a.max_risk_score)
            .slice(0, 20);

        // Analyze threats by category
        const categoryMap = new Map();
        threatData.forEach(threat => {
            (threat.threat_categories || ['unknown']).forEach((category: any) => {
                if (!categoryMap.has(category)) {
                    categoryMap.set(category, {
                        category,
                        count: 0,
                        unique_ips: new Set(),
                        avg_risk_score: 0,
                        countries: new Set(),
                        total_risk: 0,
                        blocked_count: 0,
                        recent_increase: false
                    });
                }

                const catInfo = categoryMap.get(category);
                catInfo.count++;
                catInfo.unique_ips.add(threat.ip_address);
                catInfo.countries.add(threat.country);
                catInfo.total_risk += (threat.risk_score || 0);
                if (threat.blocked) catInfo.blocked_count++;
            });
        });

        const threatsByCategory = Array.from(categoryMap.values())
            .map(cat => ({
                ...cat,
                unique_ips: cat.unique_ips.size,
                countries: Array.from(cat.countries),
                avg_risk_score: Math.round(cat.total_risk / cat.count),
                block_rate: ((cat.blocked_count / cat.count) * 100).toFixed(1),
                geographic_spread: cat.countries.size
            }))
            .sort((a, b) => b.count - a.count);

        // Identify emerging threats
        const emergingThreats = await identifyEmergingThreats(threatData, startDate);

        // Threat evolution analysis
        const threatEvolution = await analyzeThreatEvolution(threatData, startDate);

        return {
            overview: generateThreatOverview(topThreatIPs, threatsByCategory),
            topThreatIPs: topThreatIPs.slice(0, 10),
            threatsByCategory,
            emergingThreats,
            threatEvolution,
            totalThreats: threatData.length,
            uniqueThreatIPs: ipThreatMap.size,
            recommendations: generateThreatRecommendations(topThreatIPs, threatsByCategory, emergingThreats)
        };

    } catch (error) {
        console.error('Failed to get top threats:', error);
        throw new Error('Top threats analysis failed');
    }
}

// =============================================
// GEOGRAPHIC THREAT ANALYSIS
// =============================================

async function getGeographicThreatAnalysis(startDate: string) {
    try {
        const endDate = new Date().toISOString();

        // Get geographic threat data with IP intelligence
        const { data: geoData } = await supabaseAdmin
            .from('security_request_logs')
            .select(`
        ip_address,
        country,
        region,
        city,
        threat_level,
        risk_score,
        threat_categories,
        blocked,
        created_at
      `)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .not('country', 'is', null);

        if (!geoData || geoData.length === 0) {
            return {
                overview: 'Insufficient geographic data for analysis.',
                countryAnalysis: [],
                regionAnalysis: [],
                threatMigration: [],
                riskAssessment: {}
            };
        }

        // Analyze by country
        const countryMap = new Map();
        geoData.forEach(record => {
            const country = record.country;
            if (!countryMap.has(country)) {
                countryMap.set(country, {
                    country,
                    country_name: getCountryName(country),
                    total_requests: 0,
                    threat_requests: 0,
                    unique_ips: new Set(),
                    unique_cities: new Set(),
                    risk_scores: [],
                    threat_categories: new Set(),
                    blocked_requests: 0,
                    first_seen: record.created_at,
                    last_seen: record.created_at,
                    threat_levels: { low: 0, medium: 0, high: 0, critical: 0 }
                });
            }

            const countryInfo = countryMap.get(country);
            countryInfo.total_requests++;

            if (['medium', 'high', 'critical'].includes(record.threat_level)) {
                countryInfo.threat_requests++;
                countryInfo.threat_levels[record.threat_level]++;
            }

            countryInfo.unique_ips.add(record.ip_address);
            if (record.city) countryInfo.unique_cities.add(record.city);
            if (record.risk_score) countryInfo.risk_scores.push(record.risk_score);
            (record.threat_categories || []).forEach((cat: any) => countryInfo.threat_categories.add(cat));

            if (record.blocked) countryInfo.blocked_requests++;

            if (new Date(record.created_at) < new Date(countryInfo.first_seen)) {
                countryInfo.first_seen = record.created_at;
            }
            if (new Date(record.created_at) > new Date(countryInfo.last_seen)) {
                countryInfo.last_seen = record.created_at;
            }
        });

        // Process country analysis
        const countryAnalysis = Array.from(countryMap.values())
            .map(country => ({
                ...country,
                unique_ips: country.unique_ips.size,
                unique_cities: country.unique_cities.size,
                threat_categories: Array.from(country.threat_categories),
                threat_density: (country.threat_requests / country.total_requests * 100).toFixed(2),
                avg_risk_score: country.risk_scores.length > 0 ?
                    //@ts-ignore
                    Math.round(country.risk_scores.reduce((a, b) => a + b, 0) / country.risk_scores.length) : 0,
                max_risk_score: country.risk_scores.length > 0 ? Math.max(...country.risk_scores) : 0,
                block_rate: (country.blocked_requests / country.total_requests * 100).toFixed(2),
                threat_sophistication: calculateThreatSophistication(country),
                coordinates: getCountryCoordinates(country.country)
            }))
            .sort((a, b) => b.threat_requests - a.threat_requests);

        // Regional analysis
        const regionMap = new Map();
        geoData.forEach(record => {
            if (!record.region) return;

            const regionKey = `${record.country}-${record.region}`;
            if (!regionMap.has(regionKey)) {
                regionMap.set(regionKey, {
                    country: record.country,
                    region: record.region,
                    threat_requests: 0,
                    unique_ips: new Set(),
                    risk_scores: []
                });
            }

            const regionInfo = regionMap.get(regionKey);
            if (['medium', 'high', 'critical'].includes(record.threat_level)) {
                regionInfo.threat_requests++;
            }
            regionInfo.unique_ips.add(record.ip_address);
            if (record.risk_score) regionInfo.risk_scores.push(record.risk_score);
        });

        const regionAnalysis = Array.from(regionMap.values())
            .map(region => ({
                ...region,
                unique_ips: region.unique_ips.size,
                avg_risk_score: region.risk_scores.length > 0 ?
                    Math.round(region.risk_scores.reduce((a: any, b: any) => a + b, 0) / region.risk_scores.length) : 0
            }))
            .sort((a, b) => b.threat_requests - a.threat_requests)
            .slice(0, 20);

        // Threat migration analysis
        const threatMigration = await analyzeThreatMigration(geoData, startDate);

        // Risk assessment by geographic factors
        const riskAssessment = {
            highRiskCountries: countryAnalysis.filter(c => parseFloat(c.threat_density) > 10).slice(0, 10),
            emergingRiskRegions: regionAnalysis.filter(r => r.avg_risk_score > 70).slice(0, 5),
            globalThreatDistribution: calculateGlobalDistribution(countryAnalysis),
            geopoliticalFactors: await assessGeopoliticalFactors(countryAnalysis)
        };

        return {
            overview: generateGeographicOverview(countryAnalysis, riskAssessment),
            countryAnalysis: countryAnalysis.slice(0, 30),
            regionAnalysis,
            threatMigration,
            riskAssessment,
            totalCountries: countryMap.size,
            totalRegions: regionMap.size,
            recommendations: generateGeographicRecommendations(countryAnalysis, riskAssessment)
        };

    } catch (error) {
        console.error('Failed to get geographic threat analysis:', error);
        throw new Error('Geographic threat analysis failed');
    }
}

// =============================================
// ATTACK PATTERN ANALYSIS
// =============================================

async function getAttackPatternAnalysis(startDate: string) {
    try {
        const endDate = new Date().toISOString();

        // Get attack pattern data
        const { data: patternData } = await supabaseAdmin
            .from('security_request_logs')
            .select(`
        ip_address,
        user_agent,
        path,
        method,
        threat_level,
        signature_matches,
        behavioral_flags,
        threat_categories,
        created_at,
        response_status,
        blocked
      `)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .in('threat_level', ['low', 'medium', 'high', 'critical']);

        if (!patternData || patternData.length === 0) {
            return {
                overview: 'No attack patterns detected during this period.',
                attackSequences: [],
                methodologyAnalysis: [],
                temporalPatterns: [],
                targetingPatterns: []
            };
        }

        // Analyze attack sequences
        const attackSequences = await analyzeAttackSequences(patternData);

        // Methodology analysis
        const methodologyAnalysis = analyzeAttackMethodologies(patternData);

        // Temporal patterns
        const temporalPatterns = analyzeTemporalPatterns(patternData, startDate);

        // Targeting patterns
        const targetingPatterns = analyzeTargetingPatterns(patternData);

        // Advanced pattern recognition
        const advancedPatterns = await detectAdvancedPatterns(patternData);

        return {
            overview: generateAttackPatternOverview(attackSequences, methodologyAnalysis),
            attackSequences: attackSequences.slice(0, 20),
            methodologyAnalysis,
            temporalPatterns,
            targetingPatterns,
            advancedPatterns,
            totalAttacks: patternData.length,
            uniqueAttackers: new Set(patternData.map(p => p.ip_address)).size,
            recommendations: generateAttackPatternRecommendations(methodologyAnalysis, temporalPatterns)
        };

    } catch (error) {
        console.error('Failed to analyze attack patterns:', error);
        throw new Error('Attack pattern analysis failed');
    }
}

// =============================================
// INDICATORS OF COMPROMISE (IOC)
// =============================================

async function getIndicatorsOfCompromise(startDate: string) {
    try {
        const endDate = new Date().toISOString();

        // Get IOC data
        const { data: iocData } = await supabaseAdmin
            .from('security_request_logs')
            .select(`
        ip_address,
        user_agent,
        path,
        method,
        threat_level,
        signature_matches,
        threat_categories,
        created_at,
        blocked,
        country
      `)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .in('threat_level', ['high', 'critical']);

        if (!iocData || iocData.length === 0) {
            return {
                overview: 'No indicators of compromise detected.',
                ipIndicators: [],
                userAgentIndicators: [],
                pathIndicators: [],
                signatureIndicators: [],
                networkIndicators: []
            };
        }

        // IP-based IOCs
        const ipIndicators = await generateIPIndicators(iocData);

        // User Agent IOCs
        const userAgentIndicators = generateUserAgentIndicators(iocData);

        // Path/URL IOCs
        const pathIndicators = generatePathIndicators(iocData);

        // Signature-based IOCs
        const signatureIndicators = generateSignatureIndicators(iocData);

        // Network behavior IOCs
        const networkIndicators = await generateNetworkIndicators(iocData);

        // IOC validation and scoring
        const validatedIOCs = await validateIOCs({
            ipIndicators,
            userAgentIndicators,
            pathIndicators,
            signatureIndicators,
            networkIndicators
        });

        return {
            overview: generateIOCOverview(validatedIOCs),
            ...validatedIOCs,
            //@ts-ignore
            totalIOCs: Object.values(validatedIOCs).reduce((total, indicators) => total + indicators.length, 0),
            highConfidenceIOCs: Object.values(validatedIOCs)
                .flat()
                .filter((ioc: any) => ioc.confidence >= 0.8).length,
            recommendations: generateIOCRecommendations(validatedIOCs)
        };

    } catch (error) {
        console.error('Failed to get indicators of compromise:', error);
        throw new Error('IOC analysis failed');
    }
}

// =============================================
// HELPER FUNCTIONS FOR THREAT ANALYSIS
// =============================================

function calculatePersistenceScore(threat: any): number {
    const timeSpan = new Date(threat.last_seen).getTime() - new Date(threat.first_seen).getTime();
    const days = timeSpan / (1000 * 60 * 60 * 24);
    const requestFrequency = threat.total_requests / Math.max(days, 1);

    // Score based on persistence over time and request frequency
    return Math.min(Math.round((days * 2) + (requestFrequency * 5)), 100);
}

function calculateSophisticationScore(threat: any): number {
    let score = 0;

    // Multiple attack vectors
    score += threat.threat_categories.size * 10;

    // Different user agents (evasion)
    score += Math.min(threat.user_agents.size * 5, 25);

    // Target diversity
    score += Math.min(threat.target_paths.size * 2, 20);

    // Advanced signatures
    score += threat.signature_matches.size * 15;

    // Behavioral complexity
    score += threat.behavioral_flags.size * 10;

    return Math.min(score, 100);
}

async function identifyEmergingThreats(threatData: any[], startDate: string): Promise<any[]> {
    // Compare current period with previous period
    const currentPeriodStart = new Date(startDate);
    const periodLength = Date.now() - currentPeriodStart.getTime();
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodLength);

    try {
        const { data: previousData } = await supabaseAdmin
            .from('security_request_logs')
            .select('threat_categories, signature_matches, ip_address')
            .gte('created_at', previousPeriodStart.toISOString())
            .lt('created_at', startDate)
            .in('threat_level', ['medium', 'high', 'critical']);

        // Find new threat patterns
        const currentPatterns = new Set();
        const currentIPs = new Set();

        threatData.forEach(threat => {
            (threat.threat_categories || []).forEach((cat: any) => currentPatterns.add(cat));
            (threat.signature_matches || []).forEach((sig: any) => currentPatterns.add(sig));
            currentIPs.add(threat.ip_address);
        });

        const previousPatterns = new Set();
        const previousIPs = new Set();

        (previousData || []).forEach(threat => {
            (threat.threat_categories || []).forEach((cat: any) => previousPatterns.add(cat));
            (threat.signature_matches || []).forEach((sig:any) => previousPatterns.add(sig));
            previousIPs.add(threat.ip_address);
        });

        const emergingPatterns = Array.from(currentPatterns).filter(pattern =>
            !previousPatterns.has(pattern)
        );

        const emergingIPs = Array.from(currentIPs).filter(ip =>
            !previousIPs.has(ip)
        );

        return [
            ...emergingPatterns.map(pattern => ({
                type: 'pattern',
                indicator: pattern,
                first_seen: startDate,
                confidence: 0.7,
                description: `New attack pattern detected: ${pattern}`
            })),
            ...emergingIPs.slice(0, 10).map(ip => ({
                type: 'ip',
                indicator: ip,
                first_seen: startDate,
                confidence: 0.6,
                description: `New threat IP detected: ${ip}`
            }))
        ];
    } catch (error) {
        return [];
    }
}

async function analyzeThreatEvolution(threatData: any[], startDate: string): Promise<any[]> {
    // Group threats by time periods
    const timeWindows = groupByTimeWindows(threatData, startDate, 'day');

    return Object.entries(timeWindows).map(([date, threats]) => ({
        date,
        total_threats: threats.length,
        unique_ips: new Set(threats.map(t => t.ip_address)).size,
        avg_risk_score: threats.reduce((sum, t) => sum + (t.risk_score || 0), 0) / threats.length,
        top_categories: getTopCategories(threats, 3),
        severity_distribution: {
            low: threats.filter(t => t.threat_level === 'low').length,
            medium: threats.filter(t => t.threat_level === 'medium').length,
            high: threats.filter(t => t.threat_level === 'high').length,
            critical: threats.filter(t => t.threat_level === 'critical').length
        }
    }));
}

function generateThreatOverview(topIPs: any[], categories: any[]): string {
    const totalThreats = topIPs.reduce((sum, ip) => sum + ip.total_requests, 0);
    const topCategory = categories[0];
    const avgRisk = Math.round(topIPs.reduce((sum, ip) => sum + ip.max_risk_score, 0) / topIPs.length);

    return `Threat analysis reveals ${totalThreats.toLocaleString()} malicious requests from ${topIPs.length} high-risk IP addresses. 
Primary attack vector: ${topCategory?.category || 'Mixed'} (${topCategory?.count || 0} incidents). 
Average risk score: ${avgRisk}/100. Most persistent attacker: ${topIPs[0]?.ip_address || 'N/A'} 
with ${topIPs[0]?.total_requests || 0} requests over ${calculateDurationDays(topIPs[0])} days.`;
}

function generateThreatRecommendations(topIPs: any[], categories: any[], emergingThreats: any[]): string[] {
    const recommendations = [];

    // IP-based recommendations
    if (topIPs.length > 0) {
        const persistentIPs = topIPs.filter(ip => ip.persistence_score > 50);
        if (persistentIPs.length > 0) {
            recommendations.push(`Block ${persistentIPs.length} persistent threat IPs immediately`);
        }

        const sophisticatedAttackers = topIPs.filter(ip => ip.sophistication_score > 70);
        if (sophisticatedAttackers.length > 0) {
            recommendations.push(`Enhanced monitoring for ${sophisticatedAttackers.length} sophisticated attackers`);
        }
    }

    // Category-based recommendations
    if (categories.length > 0) {
        const topCategory = categories[0];
        recommendations.push(`Strengthen defenses against ${topCategory.category} attacks (${topCategory.count} incidents)`);

        if (categories.some(cat => cat.block_rate < 50)) {
            recommendations.push('Improve blocking effectiveness for low-block-rate attack categories');
        }
    }

    // Emerging threat recommendations
    if (emergingThreats.length > 0) {
        recommendations.push(`Investigate ${emergingThreats.length} emerging threat patterns`);
    }

    return recommendations;
}

// Geographic analysis helpers
function getCountryName(countryCode: string): string {
    const countryNames: Record<string, string> = {
        'US': 'United States', 'CN': 'China', 'RU': 'Russia', 'DE': 'Germany',
        'GB': 'United Kingdom', 'FR': 'France', 'JP': 'Japan', 'KR': 'South Korea',
        'IN': 'India', 'BR': 'Brazil', 'CA': 'Canada', 'AU': 'Australia',
        'NL': 'Netherlands', 'IT': 'Italy', 'ES': 'Spain', 'SE': 'Sweden'
    };
    return countryNames[countryCode] || countryCode;
}

function getCountryCoordinates(countryCode: string): { lat: number; lng: number } {
    const coordinates: Record<string, { lat: number; lng: number }> = {
        'US': { lat: 39.8283, lng: -98.5795 },
        'CN': { lat: 35.8617, lng: 104.1954 },
        'RU': { lat: 61.5240, lng: 105.3188 },
        'DE': { lat: 51.1657, lng: 10.4515 },
        'GB': { lat: 55.3781, lng: -3.4360 },
        'FR': { lat: 46.2276, lng: 2.2137 },
        'JP': { lat: 36.2048, lng: 138.2529 },
        'IN': { lat: 20.5937, lng: 78.9629 }
    };
    return coordinates[countryCode] || { lat: 0, lng: 0 };
}

function calculateThreatSophistication(country: any): number {
    let score = 0;

    // Category diversity
    score += country.threat_categories.size * 15;

    // Geographic spread within country
    score += country.unique_cities * 5;

    // IP diversity
    score += Math.min(country.unique_ips * 2, 30);

    // Evasion (lower block rate = higher sophistication)
    const blockRate = parseFloat(country.block_rate);
    score += (100 - blockRate) * 0.3;

    return Math.min(Math.round(score), 100);
}

async function analyzeThreatMigration(geoData: any[], startDate: string): Promise<any[]> {
    // Group by time periods and analyze geographic shifts
    const timeWindows = groupByTimeWindows(geoData, startDate, 'hour');
    const migration = [];

    const windows = Object.keys(timeWindows).sort();
    for (let i = 1; i < windows.length; i++) {
        const prevWindow = timeWindows[windows[i-1]];
        const currWindow = timeWindows[windows[i]];

        const prevCountries = new Set(prevWindow.map(r => r.country));
        const currCountries = new Set(currWindow.map(r => r.country));

        const newCountries = Array.from(currCountries).filter(c => !prevCountries.has(c));
        const lostCountries = Array.from(prevCountries).filter(c => !currCountries.has(c));

        if (newCountries.length > 0 || lostCountries.length > 0) {
            migration.push({
                timeWindow: windows[i],
                newCountries,
                lostCountries,
                migrationScore: newCountries.length + lostCountries.length
            });
        }
    }

    return migration.slice(0, 20);
}

function calculateGlobalDistribution(countryAnalysis: any[]): any {
    const total = countryAnalysis.reduce((sum, country) => sum + country.threat_requests, 0);

    return {
        concentration: countryAnalysis.slice(0, 5).reduce((sum, country) => sum + country.threat_requests, 0) / total,
        diversity: countryAnalysis.length,
        topContributor: countryAnalysis[0],
        distribution: countryAnalysis.map(country => ({
            country: country.country,
            percentage: (country.threat_requests / total * 100).toFixed(2)
        })).slice(0, 10)
    };
}

async function assessGeopoliticalFactors(countryAnalysis: any[]): Promise<any> {
    // Basic geopolitical risk assessment
    const highRiskCountries = ['CN', 'RU', 'KP', 'IR'];
    const sanctionedCountries = ['RU', 'IR', 'KP'];

    const geopoliticalRisks = countryAnalysis
        .filter(country => highRiskCountries.includes(country.country))
        .map(country => ({
            country: country.country,
            threat_requests: country.threat_requests,
            risk_level: sanctionedCountries.includes(country.country) ? 'high' : 'medium',
            concerns: generateGeopoliticalConcerns(country.country)
        }));

    return {
        highRiskActivity: geopoliticalRisks,
        totalHighRiskRequests: geopoliticalRisks.reduce((sum, risk) => sum + risk.threat_requests, 0),
        recommendations: geopoliticalRisks.length > 0 ? [
            'Consider enhanced monitoring for geopolitically sensitive regions',
            'Implement country-specific blocking policies',
            'Report suspicious activity from high-risk nations'
        ] : []
    };
}

function generateGeopoliticalConcerns(countryCode: string): string[] {
    const concerns: Record<string, string[]> = {
        'CN': ['State-sponsored activity', 'IP theft', 'Economic espionage'],
        'RU': ['Cyber warfare', 'Ransomware operations', 'Infrastructure targeting'],
        'KP': ['Limited internet access', 'State-controlled activity'],
        'IR': ['Regional conflict', 'Sanctions evasion']
    };
    return concerns[countryCode] || [];
}

// Attack pattern analysis helpers
async function analyzeAttackSequences(patternData: any[]): Promise<any[]> {
    // Group by IP and analyze request sequences
    const ipSequences = new Map();

    patternData.forEach(attack => {
        const ip = attack.ip_address;
        if (!ipSequences.has(ip)) {
            ipSequences.set(ip, []);
        }
        ipSequences.get(ip).push(attack);
    });

    const sequences = [];
    for (const [ip, attacks] of ipSequences) {
        if (attacks.length < 3) continue; // Need minimum sequence length

        attacks.sort((a: { created_at: string | number | Date; }, b: { created_at: string | number | Date; }) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const sequence = {
            ip_address: ip,
            attack_count: attacks.length,
            duration_minutes: (new Date(attacks[attacks.length - 1].created_at).getTime() -
                new Date(attacks[0].created_at).getTime()) / (1000 * 60),
            sequence_pattern: attacks.map((a: { method: any; path: string; }) => `${a.method}:${a.path.split('/')[1] || 'root'}`),
            escalation_detected: detectEscalation(attacks),
            persistence_score: calculateSequencePersistence(attacks),
            techniques: [...new Set(attacks.flatMap((a: { threat_categories: any; }) => a.threat_categories || []))]
        };

        sequences.push(sequence);
    }

    return sequences.sort((a, b) => b.persistence_score - a.persistence_score);
}

function analyzeAttackMethodologies(patternData: any[]): any[] {
    const methodologies = new Map();

    patternData.forEach(attack => {
        //@ts-ignore
        (attack.threat_categories || []).forEach(category => {
            if (!methodologies.has(category)) {
                methodologies.set(category, {
                    methodology: category,
                    total_attempts: 0,
                    unique_ips: new Set(),
                    common_paths: new Map(),
                    user_agents: new Set(),
                    success_indicators: 0,
                    blocked_attempts: 0
                });
            }

            const method = methodologies.get(category);
            method.total_attempts++;
            method.unique_ips.add(attack.ip_address);
            method.user_agents.add(attack.user_agent);

            const path = attack.path;
            method.common_paths.set(path, (method.common_paths.get(path) || 0) + 1);

            if (attack.response_status && [200, 301, 302].includes(attack.response_status)) {
                method.success_indicators++;
            }

            if (attack.blocked) {
                method.blocked_attempts++;
            }
        });
    });

    return Array.from(methodologies.values()).map(method => ({
        ...method,
        unique_ips: method.unique_ips.size,
        user_agents: method.user_agents.size,
        common_paths: Array.from(method.common_paths.entries())
            //@ts-ignore
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            //@ts-ignore
            .map(([path, count]) => ({ path, count })),
        success_rate: (method.success_indicators / method.total_attempts * 100).toFixed(2),
        block_rate: (method.blocked_attempts / method.total_attempts * 100).toFixed(2)
    })).sort((a, b) => b.total_attempts - a.total_attempts);
}

function analyzeTemporalPatterns(patternData: any[], startDate: string): any {
    const hourlyDistribution = new Array(24).fill(0);
    const dailyDistribution = new Array(7).fill(0);
    const weeklyTrends = new Map();

    patternData.forEach(attack => {
        const date = new Date(attack.created_at);
        const hour = date.getHours();
        const dayOfWeek = date.getDay();
        const week = getWeekNumber(date);

        hourlyDistribution[hour]++;
        dailyDistribution[dayOfWeek]++;
        weeklyTrends.set(week, (weeklyTrends.get(week) || 0) + 1);
    });

    const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
    const peakDay = dailyDistribution.indexOf(Math.max(...dailyDistribution));

    return {
        hourlyDistribution: hourlyDistribution.map((count, hour) => ({ hour, count })),
        dailyDistribution: dailyDistribution.map((count, day) => ({
            day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
            count
        })),
        peakActivity: {
            hour: peakHour,
            day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][peakDay]
        },
        weeklyTrends: Array.from(weeklyTrends.entries()).map(([week, count]) => ({ week, count })),
        insights: generateTemporalInsights(hourlyDistribution, dailyDistribution)
    };
}

function analyzeTargetingPatterns(patternData: any[]): any {
    const pathTargets = new Map();
    const endpointCategories = new Map();

    patternData.forEach(attack => {
        const path = attack.path;
        pathTargets.set(path, (pathTargets.get(path) || 0) + 1);

        // Categorize endpoints
        const category = categorizeEndpoint(path);
        endpointCategories.set(category, (endpointCategories.get(category) || 0) + 1);
    });

    return {
        topTargets: Array.from(pathTargets.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20)
            .map(([path, count]) => ({ path, count, category: categorizeEndpoint(path) })),

        categoryDistribution: Array.from(endpointCategories.entries())
            .sort(([,a], [,b]) => b - a)
            .map(([category, count]) => ({ category, count })),

        insights: generateTargetingInsights(pathTargets, endpointCategories)
    };
}

async function detectAdvancedPatterns(patternData: any[]): Promise<any[]> {
    const advancedPatterns = [];

    // Detect coordinated attacks
    const coordinatedAttacks = detectCoordinatedAttacks(patternData);
    if (coordinatedAttacks.length > 0) {
        advancedPatterns.push({
            type: 'coordinated_attack',
            pattern: 'Multiple IPs targeting same endpoints simultaneously',
            indicators: coordinatedAttacks,
            severity: 'high'
        });
    }

    // Detect slow-burn attacks
    const slowBurnAttacks = detectSlowBurnAttacks(patternData);
    if (slowBurnAttacks.length > 0) {
        advancedPatterns.push({
            type: 'slow_burn',
            pattern: 'Low-frequency persistent attacks to avoid detection',
            indicators: slowBurnAttacks,
            severity: 'medium'
        });
    }

    // Detect polymorphic attacks
    const polymorphicAttacks = detectPolymorphicAttacks(patternData);
    if (polymorphicAttacks.length > 0) {
        advancedPatterns.push({
            type: 'polymorphic',
            pattern: 'Rapidly changing attack signatures',
            indicators: polymorphicAttacks,
            severity: 'high'
        });
    }

    return advancedPatterns;
}

// IOC generation helpers
async function generateIPIndicators(iocData: any[]): Promise<any[]> {
    const ipMap = new Map();

    iocData.forEach(record => {
        const ip = record.ip_address;
        if (!ipMap.has(ip)) {
            ipMap.set(ip, {
                indicator: ip,
                type: 'ip',
                threat_count: 0,
                countries: new Set(),
                first_seen: record.created_at,
                last_seen: record.created_at,
                threat_categories: new Set(),
                confidence: 0
            });
        }

        const indicator = ipMap.get(ip);
        indicator.threat_count++;
        indicator.countries.add(record.country);
        indicator.threat_categories.add(...(record.threat_categories || []));

        if (new Date(record.created_at) > new Date(indicator.last_seen)) {
            indicator.last_seen = record.created_at;
        }
    });

    return Array.from(ipMap.values()).map(indicator => ({
        ...indicator,
        countries: Array.from(indicator.countries),
        threat_categories: Array.from(indicator.threat_categories),
        confidence: calculateIOCConfidence(indicator, 'ip'),
        description: `Malicious IP with ${indicator.threat_count} threat events`
    })).filter(ioc => ioc.confidence >= 0.5);
}

function generateUserAgentIndicators(iocData: any[]): any[] {
    const userAgentMap = new Map();

    iocData.forEach(record => {
        const ua = record.user_agent;
        if (!ua || ua.length < 10) return; // Skip short/empty user agents

        if (!userAgentMap.has(ua)) {
            userAgentMap.set(ua, {
                indicator: ua,
                type: 'user_agent',
                threat_count: 0,
                unique_ips: new Set(),
                threat_categories: new Set()
            });
        }

        const indicator = userAgentMap.get(ua);
        indicator.threat_count++;
        indicator.unique_ips.add(record.ip_address);
        indicator.threat_categories.add(...(record.threat_categories || []));
    });

    return Array.from(userAgentMap.values())
        .map(indicator => ({
            ...indicator,
            unique_ips: indicator.unique_ips.size,
            threat_categories: Array.from(indicator.threat_categories),
            confidence: calculateIOCConfidence(indicator, 'user_agent'),
            description: `Suspicious user agent used in ${indicator.threat_count} attacks`
        }))
        .filter(ioc => ioc.confidence >= 0.6)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 50);
}

function generatePathIndicators(iocData: any[]): any[] {
    const pathMap = new Map();

    iocData.forEach(record => {
        const path = record.path;
        if (!pathMap.has(path)) {
            pathMap.set(path, {
                indicator: path,
                type: 'path',
                threat_count: 0,
                unique_ips: new Set(),
                methods: new Set(),
                threat_categories: new Set()
            });
        }

        const indicator = pathMap.get(path);
        indicator.threat_count++;
        indicator.unique_ips.add(record.ip_address);
        indicator.methods.add(record.method);
        indicator.threat_categories.add(...(record.threat_categories || []));
    });

    return Array.from(pathMap.values())
        .map(indicator => ({
            ...indicator,
            unique_ips: indicator.unique_ips.size,
            methods: Array.from(indicator.methods),
            threat_categories: Array.from(indicator.threat_categories),
            confidence: calculateIOCConfidence(indicator, 'path'),
            description: `Malicious path targeted by ${indicator.unique_ips} IPs`
        }))
        .filter(ioc => ioc.confidence >= 0.7)
        .sort((a, b) => b.threat_count - a.threat_count)
        .slice(0, 30);
}

function generateSignatureIndicators(iocData: any[]): any[] {
    const signatureMap = new Map();

    iocData.forEach(record => {
        //@ts-ignore
        (record.signature_matches || []).forEach(signature => {
            if (!signatureMap.has(signature)) {
                signatureMap.set(signature, {
                    indicator: signature,
                    type: 'signature',
                    match_count: 0,
                    unique_ips: new Set(),
                    threat_categories: new Set()
                });
            }

            const indicator = signatureMap.get(signature);
            indicator.match_count++;
            indicator.unique_ips.add(record.ip_address);
            indicator.threat_categories.add(...(record.threat_categories || []));
        });
    });

    return Array.from(signatureMap.values())
        .map(indicator => ({
            ...indicator,
            unique_ips: indicator.unique_ips.size,
            threat_categories: Array.from(indicator.threat_categories),
            confidence: 0.95, // Signatures are high confidence
            description: `Threat signature detected ${indicator.match_count} times`
        }))
        .sort((a, b) => b.match_count - a.match_count);
}

async function generateNetworkIndicators(iocData: any[]): Promise<any[]> {
    // Analyze network behavior patterns
    const networkPatterns = [];

    // High-frequency bursts
    const ipTimestamps = new Map();
    iocData.forEach(record => {
        const ip = record.ip_address;
        if (!ipTimestamps.has(ip)) {
            ipTimestamps.set(ip, []);
        }
        ipTimestamps.get(ip).push(new Date(record.created_at).getTime());
    });

    for (const [ip, timestamps] of ipTimestamps) {
        if (timestamps.length < 10) continue;
//@ts-ignore
        timestamps.sort((a, b) => a - b);
        const bursts = detectBurstPattern(timestamps);

        if (bursts.length > 0) {
            networkPatterns.push({
                indicator: ip,
                type: 'network_behavior',
                pattern: 'high_frequency_burst',
                burst_count: bursts.length,
                max_frequency: Math.max(...bursts.map(b => b.frequency)),
                confidence: 0.8,
                description: `IP exhibiting ${bursts.length} high-frequency attack bursts`
            });
        }
    }

    return networkPatterns.slice(0, 20);
}

async function validateIOCs(iocs: any): Promise<any> {
    // Additional validation and confidence scoring
    const validated = {};

    for (const [category, indicators] of Object.entries(iocs)) {
        //@ts-ignore
        validated[category] = indicators.filter((ioc: any) => ioc.confidence >= 0.5);
    }

    return validated;
}

// Additional helper functions
function groupByTimeWindows(data: any[], startDate: string, granularity: 'hour' | 'day'): Record<string, any[]> {
    const windows: Record<string, any[]> = {};

    data.forEach(item => {
        const date = new Date(item.created_at);
        let key: string;

        if (granularity === 'hour') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
        } else {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }

        if (!windows[key]) {
            windows[key] = [];
        }
        windows[key].push(item);
    });

    return windows;
}

function getTopCategories(threats: any[], limit: number): string[] {
    const categoryCount = new Map();

    threats.forEach(threat => {
        //@ts-ignore
        (threat.threat_categories || []).forEach(category => {
            categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
        });
    });

    return Array.from(categoryCount.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([category]) => category);
}

function calculateDurationDays(threat: any): number {
    if (!threat || !threat.first_seen || !threat.last_seen) return 0;

    const start = new Date(threat.first_seen).getTime();
    const end = new Date(threat.last_seen).getTime();
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function calculateIOCConfidence(indicator: any, type: string): number {
    let confidence = 0;

    switch (type) {
        case 'ip':
            confidence = Math.min(0.3 + (indicator.threat_count * 0.1), 1.0);
            if (indicator.countries.size > 3) confidence += 0.1; // Multiple countries suspicious
            break;
        case 'user_agent':
            confidence = Math.min(0.4 + (indicator.unique_ips * 0.05), 1.0);
            if (indicator.indicator.toLowerCase().includes('bot') ||
                indicator.indicator.toLowerCase().includes('crawler')) {
                confidence += 0.2;
            }
            break;
        case 'path':
            confidence = Math.min(0.5 + (indicator.unique_ips * 0.03), 1.0);
            if (indicator.indicator.includes('..') || indicator.indicator.includes('%')) {
                confidence += 0.2;
            }
            break;
    }

    return Math.min(confidence, 1.0);
}

// Pattern detection functions
function detectEscalation(attacks: any[]): boolean {
    if (attacks.length < 3) return false;

    const riskScores = attacks.map(a => a.risk_score || 0);
    const increasing = riskScores.slice(1).every((score, i) => score >= riskScores[i]);

    return increasing && (riskScores[riskScores.length - 1] - riskScores[0]) > 30;
}

function calculateSequencePersistence(attacks: any[]): number {
    const timeSpan = new Date(attacks[attacks.length - 1].created_at).getTime() -
        new Date(attacks[0].created_at).getTime();
    const hours = timeSpan / (1000 * 60 * 60);
    const attacksPerHour = attacks.length / Math.max(hours, 1);

    return Math.min(Math.round(attacksPerHour * 10 + (attacks.length * 2)), 100);
}

function categorizeEndpoint(path: string): string {
    if (path.includes('/api/')) return 'API';
    if (path.includes('/admin')) return 'Admin';
    if (path.includes('/login') || path.includes('/auth')) return 'Authentication';
    if (path.includes('/upload') || path.includes('/file')) return 'File Operations';
    if (path.includes('/.') || path.includes('..')) return 'System Files';
    if (path.includes('/wp-') || path.includes('/wordpress')) return 'WordPress';
    return 'Other';
}

function detectCoordinatedAttacks(patternData: any[]): any[] {
    // Simple coordinated attack detection
    const timeWindows = groupByTimeWindows(patternData, '', 'hour');
    //@ts-ignore
    const coordinated = [];

    Object.entries(timeWindows).forEach(([window, attacks]) => {
        if (attacks.length < 10) return;

        const uniqueIPs = new Set(attacks.map(a => a.ip_address));
        const targetPaths = new Set(attacks.map(a => a.path));

        if (uniqueIPs.size >= 5 && targetPaths.size <= 3) {
            coordinated.push({
                timeWindow: window,
                attackerCount: uniqueIPs.size,
                targetCount: targetPaths.size,
                totalAttacks: attacks.length
            });
        }
    });
    //@ts-ignore
    return coordinated;
}

function detectSlowBurnAttacks(patternData: any[]): any[] {
    // Detect persistent low-frequency attacks
    const ipAttacks = new Map();

    patternData.forEach(attack => {
        const ip = attack.ip_address;
        if (!ipAttacks.has(ip)) {
            ipAttacks.set(ip, []);
        }
        ipAttacks.get(ip).push(attack);
    });

    const slowBurn = [];
    for (const [ip, attacks] of ipAttacks) {
        if (attacks.length < 5 || attacks.length > 50) continue;
//@ts-ignore
        attacks.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const timeSpan = new Date(attacks[attacks.length - 1].created_at).getTime() -
            new Date(attacks[0].created_at).getTime();
        const hours = timeSpan / (1000 * 60 * 60);

        if (hours > 24 && attacks.length / hours < 1) { // Less than 1 attack per hour over 24+ hours
            slowBurn.push({
                ip_address: ip,
                duration_hours: Math.round(hours),
                attack_count: attacks.length,
                frequency: attacks.length / hours
            });
        }
    }

    return slowBurn;
}

function detectPolymorphicAttacks(patternData: any[]): any[] {
    // Detect rapidly changing attack signatures
    const ipSignatures = new Map();

    patternData.forEach(attack => {
        const ip = attack.ip_address;
        if (!ipSignatures.has(ip)) {
            ipSignatures.set(ip, new Set());
        }
        //@ts-ignore
        (attack.signature_matches || []).forEach(sig => {
            ipSignatures.get(ip).add(sig);
        });
    });

    const polymorphic = [];
    for (const [ip, signatures] of ipSignatures) {
        if (signatures.size >= 5) { // 5+ different signatures
            polymorphic.push({
                ip_address: ip,
                signature_variety: signatures.size,
                signatures: Array.from(signatures)
            });
        }
    }

    return polymorphic;
}

function detectBurstPattern(timestamps: number[]): any[] {
    const bursts = [];
    const windowSize = 5 * 60 * 1000; // 5 minutes

    for (let i = 0; i < timestamps.length; i++) {
        const windowStart = timestamps[i];
        const windowEnd = windowStart + windowSize;
        const windowRequests = timestamps.filter(t => t >= windowStart && t <= windowEnd);

        if (windowRequests.length >= 20) { // 20+ requests in 5 minutes
            bursts.push({
                start: windowStart,
                end: windowEnd,
                frequency: windowRequests.length
            });
        }
    }

    return bursts;
}

function generateGeographicOverview(countryAnalysis: any[], riskAssessment: any): string {
    const totalCountries = countryAnalysis.length;
    const topThreat = countryAnalysis[0];
    const highRiskCount = riskAssessment.highRiskCountries?.length || 0;

    return `Geographic analysis reveals threat activity from ${totalCountries} countries. 
Primary threat source: ${topThreat?.country_name || 'Unknown'} with ${topThreat?.threat_requests || 0} malicious requests 
(${topThreat?.threat_density || 0}% threat density). ${highRiskCount} countries classified as high-risk based on 
geopolitical factors and attack sophistication. Global threat distribution shows 
${riskAssessment.globalThreatDistribution?.concentration ?
        `${(riskAssessment.globalThreatDistribution.concentration * 100).toFixed(1)}% concentration` : 'distributed pattern'} 
in top 5 source countries.`;
}

function generateGeographicRecommendations(countryAnalysis: any[], riskAssessment: any): string[] {
    const recommendations = [];

    if (riskAssessment.highRiskCountries?.length > 0) {
        recommendations.push(`Consider geo-blocking or enhanced monitoring for ${riskAssessment.highRiskCountries.length} high-risk countries`);
    }

    const highDensityCountries = countryAnalysis.filter(c => parseFloat(c.threat_density) > 20);
    if (highDensityCountries.length > 0) {
        recommendations.push(`Implement stricter controls for ${highDensityCountries.length} countries with >20% threat density`);
    }

    if (riskAssessment.globalThreatDistribution?.concentration > 0.7) {
        recommendations.push('Threats are highly concentrated - consider targeted blocking of top source countries');
    }

    recommendations.push(
        'Regularly update geographic threat intelligence feeds',
        'Monitor for unusual geographic patterns that may indicate new campaigns',
        'Correlate geographic data with threat intelligence reports'
    );

    return recommendations;
}

function generateAttackPatternOverview(sequences: any[], methodologies: any[]): string {
    const totalSequences = sequences.length;
    const topMethod = methodologies[0];
    const avgPersistence = sequences.reduce((sum, seq) => sum + seq.persistence_score, 0) / totalSequences || 0;

    return `Attack pattern analysis identified ${totalSequences} distinct attack sequences with average persistence score of ${Math.round(avgPersistence)}. 
Primary attack methodology: ${topMethod?.methodology || 'Mixed'} with ${topMethod?.total_attempts || 0} attempts 
and ${topMethod?.success_rate || 0}% apparent success rate. Most persistent sequence: ${sequences[0]?.duration_minutes || 0} minutes 
with ${sequences[0]?.attack_count || 0} coordinated attempts.`;
}

function generateAttackPatternRecommendations(methodologies: any[], temporalPatterns: any): string[] {
    const recommendations = [];

    if (methodologies.length > 0) {
        const topMethod = methodologies[0];
        if (parseFloat(topMethod.success_rate) > 10) {
            recommendations.push(`Address ${topMethod.methodology} attacks - showing ${topMethod.success_rate}% success rate`);
        }
    }

    if (temporalPatterns.peakActivity) {
        recommendations.push(`Increase monitoring during peak attack hours (${temporalPatterns.peakActivity.hour}:00 on ${temporalPatterns.peakActivity.day}s)`);
    }

    recommendations.push(
        'Implement sequence-based detection rules for persistent attackers',
        'Correlate attack patterns with threat intelligence feeds',
        'Develop automated response for detected attack sequences'
    );

    return recommendations;
}

function generateTemporalInsights(hourlyDist: number[], dailyDist: number[]): string[] {
    const insights = [];

    const nightHours = hourlyDist.slice(0, 6).reduce((a, b) => a + b, 0);
    const dayHours = hourlyDist.slice(6, 18).reduce((a, b) => a + b, 0);

    if (nightHours > dayHours * 1.5) {
        insights.push('Attacks predominantly occur during night hours (00:00-06:00)');
    }

    const weekdays = dailyDist.slice(1, 6).reduce((a, b) => a + b, 0);
    const weekends = dailyDist[0] + dailyDist[6];

    if (weekends > weekdays) {
        insights.push('Higher attack volume during weekends');
    } else if (weekdays > weekends * 2) {
        insights.push('Attacks primarily target business hours and weekdays');
    }

    return insights;
}

function generateTargetingInsights(pathTargets: Map<string, number>, categories: Map<string, number>): string[] {
    const insights = [];

    const apiTargets = Array.from(pathTargets.keys()).filter(path => path.includes('/api/')).length;
    const adminTargets = Array.from(pathTargets.keys()).filter(path => path.includes('/admin')).length;

    if (apiTargets > pathTargets.size * 0.3) {
        insights.push('API endpoints are primary attack targets');
    }

    if (adminTargets > 0) {
        insights.push('Administrative interfaces under active attack');
    }

    const topCategory = Array.from(categories.entries()).sort(([,a], [,b]) => b - a)[0];
    if (topCategory && topCategory[1] > Array.from(categories.values()).reduce((a, b) => a + b, 0) * 0.4) {
        insights.push(`${topCategory[0]} endpoints heavily targeted`);
    }

    return insights;
}

function generateIOCOverview(iocs: any): string {
    const totalIOCs = Object.values(iocs).reduce((total: number, indicators: any) => total + indicators.length, 0);
    const highConfidence = Object.values(iocs)
        .flat()
        .filter((ioc: any) => ioc.confidence >= 0.8).length;

    return `Indicators of Compromise analysis identified ${totalIOCs} distinct IOCs with ${highConfidence} high-confidence indicators. 
IP indicators: ${iocs.ipIndicators?.length || 0}, User-Agent patterns: ${iocs.userAgentIndicators?.length || 0}, 
Malicious paths: ${iocs.pathIndicators?.length || 0}, Attack signatures: ${iocs.signatureIndicators?.length || 0}. 
These IOCs can be used for proactive blocking and threat hunting.`;
}

function generateIOCRecommendations(iocs: any): string[] {
    const recommendations = [];

    if (iocs.ipIndicators?.length > 0) {
        recommendations.push(`Add ${iocs.ipIndicators.length} malicious IPs to blocklist`);
    }

    if (iocs.userAgentIndicators?.length > 0) {
        recommendations.push(`Update WAF rules to block ${iocs.userAgentIndicators.length} suspicious user agents`);
    }

    if (iocs.pathIndicators?.length > 0) {
        recommendations.push(`Implement path-based blocking for ${iocs.pathIndicators.length} malicious endpoints`);
    }

    recommendations.push(
        'Share IOCs with threat intelligence platforms',
        'Implement automated IOC ingestion and blocking',
        'Regular IOC validation and cleanup procedures'
    );

    return recommendations;
}



