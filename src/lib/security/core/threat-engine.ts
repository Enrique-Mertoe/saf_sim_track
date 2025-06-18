
// =============================================
// CORE THREAT DETECTION ENGINE
// =============================================

// lib/security/core/threat-engine.ts
import {BehavioralContext, BehavioralRule, IncomingRequest, SignatureRule, ThreatLevel} from '@/types/security/core';

export interface ThreatDetectionResult {
    threatLevel: ThreatLevel;
    riskScore: number;
    confidenceScore: number;
    signatureMatches: string[];
    behavioralFlags: string[];
    anomalyScore: number;
    shouldBlock: boolean;
    reason: string;
}

export class ThreatDetectionEngine {
    private signatureRules: SignatureRule[] = [
        {
            id: 'sql-injection-basic',
            pattern: /('|(\\')|(;)|(\\)|(select|union|insert|delete|drop|update)\s)/i,
            category: 'sql_injection',
            severity: 'high',
            confidence: 0.9
        },
        {
            id: 'xss-attempt',
            pattern: /(<script>|<\/script>|javascript:|onerror=|onload=|eval\()/i,
            category: 'xss',
            severity: 'high',
            confidence: 0.85
        },
        {
            id: 'path-traversal',
            pattern: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/i,
            category: 'path_traversal',
            severity: 'medium',
            confidence: 0.8
        },
        {
            id: 'reconnaissance-files',
            pattern: /\.(env|config|backup|old|bak|temp|git|svn)$/i,
            category: 'reconnaissance',
            severity: 'medium',
            confidence: 0.7
        },
        {
            id: 'admin-probing',
            pattern: /\/(admin|phpmyadmin|wp-admin|api\/v\d+\/swagger|\.well-known)/i,
            category: 'reconnaissance',
            severity: 'low',
            confidence: 0.6
        },
        {
            id: 'malicious-user-agents',
            pattern: /(sqlmap|nikto|nmap|masscan|zap|burp|nessus)/i,
            category: 'scanner',
            severity: 'high',
            confidence: 0.95
        }
    ];

    private behavioralRules: BehavioralRule[] = [
        {
            id: 'high-frequency-requests',
            check: (context) => context.requestsInLastMinute > 50,
            severity: 'high',
            confidence: 0.8
        },
        {
            id: 'multiple-404s',
            check: (context) => context.recentErrors404 > 10,
            severity: 'medium',
            confidence: 0.7
        },
        {
            id: 'geographic-anomaly',
            check: (context) => context.countryHops > 3,
            severity: 'low',
            confidence: 0.6
        }
    ];

    async analyzeRequest(request: IncomingRequest): Promise<ThreatDetectionResult> {
        const signatureMatches: string[] = [];
        const behavioralFlags: string[] = [];
        let maxSeverity: ThreatLevel = 'safe';
        let totalConfidence = 0;
        let riskScore = 0;

        // Signature-based detection
        const fullRequestString = `${request.path} ${request.userAgent} ${JSON.stringify(request.queryParams)}`;

        for (const rule of this.signatureRules) {
            if (rule.pattern.test(fullRequestString)) {
                signatureMatches.push(rule.id);

                // Update threat level
                if (this.severityToLevel(rule.severity) > this.severityToLevel(maxSeverity)) {
                    maxSeverity = this.severityToLevel(rule.severity);
                }

                totalConfidence += rule.confidence;
                riskScore += this.severityToScore(rule.severity);
            }
        }

        // Behavioral analysis
        const behavioralContext = await this.getBehavioralContext(request.ipAddress);

        for (const rule of this.behavioralRules) {
            if (rule.check(behavioralContext)) {
                behavioralFlags.push(rule.id);

                if (this.severityToLevel(rule.severity) > this.severityToLevel(maxSeverity)) {
                    maxSeverity = this.severityToLevel(rule.severity);
                }

                totalConfidence += rule.confidence;
                riskScore += this.severityToScore(rule.severity);
            }
        }

        // IP reputation check
        const ipReputation = await this.getIPReputation(request.ipAddress);
        riskScore += (100 - ipReputation.score) / 2;

        // Anomaly detection
        const anomalyScore = await this.calculateAnomalyScore(request);

        // Final risk calculation
        riskScore = Math.min(riskScore + (anomalyScore * 20), 100);
        const confidenceScore = Math.min(totalConfidence / Math.max(signatureMatches.length + behavioralFlags.length, 1), 1);

        // Auto-blocking decision
        const shouldBlock = riskScore >= 80 || maxSeverity === 'critical' ||
            (signatureMatches.length >= 2 && maxSeverity === 'high');

        return {
            threatLevel: maxSeverity,
            riskScore: Math.round(riskScore),
            confidenceScore: Math.round(confidenceScore * 100) / 100,
            signatureMatches,
            behavioralFlags,
            anomalyScore,
            shouldBlock,
            reason: this.generateThreatReason(signatureMatches, behavioralFlags, riskScore)
        };
    }

    private severityToLevel(severity: string): ThreatLevel {
        switch (severity) {
            case 'critical': return 'critical';
            case 'high': return 'high';
            case 'medium': return 'medium';
            case 'low': return 'low';
            default: return 'safe';
        }
    }

    private severityToScore(severity: string): number {
        switch (severity) {
            case 'critical': return 40;
            case 'high': return 30;
            case 'medium': return 20;
            case 'low': return 10;
            default: return 0;
        }
    }

    private async getBehavioralContext(ipAddress: string): Promise<BehavioralContext> {
        // Implementation would query recent request patterns for this IP
        return {
            requestsInLastMinute: 5, // Placeholder - implement actual query
            recentErrors404: 2,
            countryHops: 1,
            userAgentVariations: 1
        };
    }

    private async getIPReputation(ipAddress: string): Promise<{ score: number }> {
        // Implementation would check IP reputation databases
        return { score: 50 }; // Placeholder
    }

    private async calculateAnomalyScore(request: IncomingRequest): Promise<number> {
        // ML-based anomaly detection would go here
        return 0.1; // Placeholder
    }

    private generateThreatReason(signatures: string[], behavioral: string[], riskScore: number): string {
        if (signatures.length === 0 && behavioral.length === 0) {
            return 'No threats detected';
        }

        const reasons = [];
        if (signatures.length > 0) {
            reasons.push(`Matched ${signatures.length} threat signature(s)`);
        }
        if (behavioral.length > 0) {
            reasons.push(`Triggered ${behavioral.length} behavioral flag(s)`);
        }
        reasons.push(`Risk score: ${riskScore}/100`);

        return reasons.join(', ');
    }
}

export const threatEngine = new ThreatDetectionEngine();
