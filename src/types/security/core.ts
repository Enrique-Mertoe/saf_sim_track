// =============================================
// TYPES DEFINITIONS
// =============================================

// types/security/core.ts
export type ThreatLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEventLog {
    ipAddress: string;
    userAgent?: string;
    referer?: string;
    origin?: string;
    method: string;
    path: string;
    queryParams?: Record<string, any>;
    headers?: Record<string, string>;
    country?: string;
    region?: string;
    city?: string;
    threatLevel: ThreatLevel;
    threatCategories?: string[];
    riskScore: number;
    confidenceScore: number;
    signatureMatches?: string[];
    behavioralFlags?: string[];
    anomalyScore: number;
    responseStatus?: number;
    responseTimeMs?: number;
    blocked: boolean;
    sessionId?: string;
    userId?: string;
}

export interface SecurityMetrics {
    totalRequests: number;
    blockedRequests: number;
    suspiciousIPs: number;
    activeThreats: number;
    uniqueCountries: number;
    avgResponseTime: number;
    uptime: number;
    incidentsToday: number;
}

export interface IncomingRequest {
    ipAddress: string;
    userAgent: string;
    path: string;
    method: string;
    queryParams: Record<string, any>;
    headers: Record<string, string>;
    country: string;
    region?: string;
    city?: string;
}

export interface SignatureRule {
    id: string;
    pattern: RegExp;
    category: string;
    severity: string;
    confidence: number;
}

export interface BehavioralRule {
    id: string;
    check: (context: BehavioralContext) => boolean;
    severity: string;
    confidence: number;
}

export interface BehavioralContext {
    requestsInLastMinute: number;
    recentErrors404: number;
    countryHops: number;
    userAgentVariations: number;
}

// interface SecurityMetrics {
//     totalRequests: number;
//     blockedRequests: number;
//     suspiciousIPs: number;
//     activeThreats: number;
//     uniqueCountries: number;
//     avgResponseTime: number;
//     uptime: number;
//     incidentsToday: number;
// }

export interface ThreatEvent {
    id: string;
    ipAddress: string;
    country: string;
    path: string;
    method: string;
    userAgent: string;
    threatLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    timestamp: string;
    blocked: boolean;
    signatureMatches: string[];
    behavioralFlags: string[];
}

export interface GeographicThreat {
    country: string;
    countryName: string;
    totalRequests: number;
    threatRequests: number;
    uniqueIPs: number;
    avgRiskScore: number;
    lat: number;
    lng: number;
}

export interface ThreatTimeline {
    timestamp: string;
    totalRequests: number;
    highThreats: number;
    criticalThreats: number;
    blockedRequests: number;
    uniqueIPs: number;
    avgResponseTime: number;
}

export interface TopAttacker {
    ipAddress: string;
    totalRequests: number;
    threatRequests: number;
    maxRiskScore: number;
    countries: string[];
    lastSeen: string;
    isBlocked: boolean;
    reputation: number;
}


export interface SecurityIncident {
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
    category: string;
    attackVector: string;
    affectedSystems: string[];
    impactAssessment: string;
    detectedAt: string;
    startedAt?: string;
    resolvedAt?: string;
    assignedTo?: string;
    escalatedTo?: string;
    team: string;
    mttrMinutes?: number;
    falsePositive: boolean;
    relatedIncidents: string[];
    sourceIPs: string[];
    affectedEndpoints: string[];
    containmentActions: string[];
    mitigationSteps: string[];
    lessonsLearned?: string;
    timeline: IncidentEvent[];
}

export interface IncidentEvent {
    id: string;
    incidentId: string;
    eventType: string;
    description: string;
    actor: string;
    occurredAt: string;
    automated: boolean;
    metadata?: Record<string, any>;
}
