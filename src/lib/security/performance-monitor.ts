import {supabaseAdmin} from '@/lib/security/supabase-client';

// =============================================
// PERFORMANCE MONITORING SYSTEM
// =============================================

// lib/security/performance-monitor.ts
export class PerformanceMonitor {
    private metrics = new Map<string, number[]>();
    private readonly maxMetrics = 1000; // Keep last 1000 measurements

    recordMetric(name: string, value: number): void {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }

        const values = this.metrics.get(name)!;
        values.push(value);

        // Keep only the last N measurements
        if (values.length > this.maxMetrics) {
            values.shift();
        }
    }

    getAverageMetric(name: string, lastN?: number): number {
        const values = this.metrics.get(name);
        if (!values || values.length === 0) return 0;

        const subset = lastN ? values.slice(-lastN) : values;
        return subset.reduce((sum, val) => sum + val, 0) / subset.length;
    }

    getPercentile(name: string, percentile: number): number {
        const values = this.metrics.get(name);
        if (!values || values.length === 0) return 0;

        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    getMetricTrend(name: string, windowSize: number = 100): 'up' | 'down' | 'stable' {
        const values = this.metrics.get(name);
        if (!values || values.length < windowSize * 2) return 'stable';

        const recent = values.slice(-windowSize);
        const previous = values.slice(-windowSize * 2, -windowSize);

        const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
        const previousAvg = previous.reduce((sum, val) => sum + val, 0) / previous.length;

        const threshold = previousAvg * 0.05; // 5% threshold

        if (recentAvg > previousAvg + threshold) return 'up';
        if (recentAvg < previousAvg - threshold) return 'down';
        return 'stable';
    }

    async persistMetrics(): Promise<void> {
        try {
            const timestamp = new Date().toISOString();
            const metricsData = [];

            for (const [name, values] of this.metrics.entries()) {
                if (values.length === 0) continue;

                metricsData.push({
                    metric_name: name,
                    avg_value: this.getAverageMetric(name),
                    p95_value: this.getPercentile(name, 95),
                    p99_value: this.getPercentile(name, 99),
                    sample_count: values.length,
                    recorded_at: timestamp
                });
            }

            if (metricsData.length > 0) {
                const { error } = await supabaseAdmin
                    .from('performance_metrics')
                    .insert(metricsData);

                if (error) throw error;
            }
        } catch (error) {
            console.error('Failed to persist metrics:', error);
        }
    }

    getSystemHealth(): {
        overall: 'healthy' | 'warning' | 'critical';
        metrics: Record<string, any>;
    } {
        const health = {
            overall: 'healthy' as const,
            metrics: {} as Record<string, any>
        };

        // Check response time
        const avgResponseTime = this.getAverageMetric('response_time_ms', 100);
        if (avgResponseTime > 1000) {
            //@ts-ignore
            health.overall = 'critical';
            health.metrics.response_time = { value: avgResponseTime, status: 'critical' };
        } else if (avgResponseTime > 500) {
            //@ts-ignore
            health.overall = 'warning';
            health.metrics.response_time = { value: avgResponseTime, status: 'warning' };
        } else {
            health.metrics.response_time = { value: avgResponseTime, status: 'healthy' };
        }

        // Check error rate
        const errorRate = this.getAverageMetric('error_rate', 100);
        if (errorRate > 0.05) { // 5% error rate
            //@ts-ignore
            health.overall = 'critical';
            health.metrics.error_rate = { value: errorRate, status: 'critical' };
        } else if (errorRate > 0.01) { // 1% error rate
            //@ts-ignore
            if (health.overall !== 'critical') health.overall = 'warning';
            health.metrics.error_rate = { value: errorRate, status: 'warning' };
        } else {
            health.metrics.error_rate = { value: errorRate, status: 'healthy' };
        }

        // Check threat detection latency
        const detectionLatency = this.getAverageMetric('threat_detection_ms', 100);
        if (detectionLatency > 100) {
            //@ts-ignore
            if (health.overall === 'healthy') health.overall = 'warning';
            health.metrics.detection_latency = { value: detectionLatency, status: 'warning' };
        } else {
            health.metrics.detection_latency = { value: detectionLatency, status: 'healthy' };
        }

        return health;
    }
}

export const performanceMonitor = new PerformanceMonitor();
