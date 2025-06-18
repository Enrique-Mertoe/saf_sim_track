// lib/security/supabase-client.ts
import {createClient} from '@supabase/supabase-js';
import {
    GeographicThreat,
    SecurityEventLog,
    SecurityMetrics,
    ThreatEvent,
    ThreatLevel,
    ThreatTimeline,
    TopAttacker
} from '@/types/security/core';

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Enhanced client with retry logic and caching
class SupabaseSecurityClient {
    private client = supabaseAdmin;
    private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

    async queryWithCache<T>(
        key: string,
        queryFn: () => Promise<T>,
        ttlMs: number = 30000
    ): Promise<T> {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return cached.data;
        }

        try {
            const data = await queryFn();
            this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
            return data;
        } catch (error) {
            console.error(`Query failed for key ${key}:`, error);
            throw error;
        }
    }

    async logSecurityEvent(event: SecurityEventLog): Promise<void> {
        const { error } = await this.client
            .from('security_request_logs')
            .insert({
                ip_address: event.ipAddress,
                user_agent: event.userAgent,
                referer: event.referer,
                method: event.method,
                path: event.path,
                query_params: event.queryParams,
                headers: event.headers,
                country: event.country,
                region: event.region,
                city: event.city,
                threat_level: event.threatLevel,
                threat_categories: event.threatCategories,
                risk_score: event.riskScore,
                confidence_score: event.confidenceScore,
                signature_matches: event.signatureMatches,
                behavioral_flags: event.behavioralFlags,
                anomaly_score: event.anomalyScore,
                response_status: event.responseStatus,
                response_time_ms: event.responseTimeMs,
                blocked: event.blocked,
                session_id: event.sessionId,
                user_id: event.userId
            });

        if (error) {
            console.error('Failed to log security event:', error);
            throw error;
        }
    }

    async getSecurityMetrics(): Promise<SecurityMetrics> {
        return this.queryWithCache('security-metrics', async () => {
            const { data, error } = await this.client.rpc('get_comprehensive_security_metrics');
            if (error) throw error;
            return data[0];
        }, 10000); // Cache for 10 seconds
    }

    async getRecentEvents(limit: number = 100): Promise<ThreatEvent[]> {
        const { data, error } = await this.client
            .from('security_request_logs')
            .select(`
        id,
        ip_address,
        country,
        path,
        method,
        user_agent,
        threat_level,
        risk_score,
        signature_matches,
        behavioral_flags,
        blocked,
        created_at
      `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return data.map(event => ({
            id: event.id.toString(),
            ipAddress: event.ip_address,
            country: event.country || 'Unknown',
            path: event.path,
            method: event.method,
            userAgent: event.user_agent || 'Unknown',
            threatLevel: event.threat_level as ThreatLevel,
            riskScore: event.risk_score || 0,
            timestamp: event.created_at,
            blocked: event.blocked || false,
            signatureMatches: event.signature_matches || [],
            behavioralFlags: event.behavioral_flags || []
        }));
    }

    async getGeographicThreats(): Promise<GeographicThreat[]> {
        return this.queryWithCache('geographic-threats', async () => {
            const { data, error } = await this.client.rpc('get_geographic_threat_distribution');
            if (error) throw error;
            return data;
        }, 60000); // Cache for 1 minute
    }

    async getThreatTimeline(hours: number = 24): Promise<ThreatTimeline[]> {
        return this.queryWithCache(`threat-timeline-${hours}h`, async () => {
            const { data, error } = await this.client.rpc('get_threat_timeline', { hours_back: hours });
            if (error) throw error;
            return data;
        }, 30000); // Cache for 30 seconds
    }

    async getTopAttackers(limit: number = 20): Promise<TopAttacker[]> {
        return this.queryWithCache('top-attackers', async () => {
            const { data, error } = await this.client.rpc('get_top_attacking_ips', { limit_count: limit });
            if (error) throw error;
            return data;
        }, 30000);
    }
}

export const securityClient = new SupabaseSecurityClient();
