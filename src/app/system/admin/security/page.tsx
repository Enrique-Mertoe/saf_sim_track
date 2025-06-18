"use client"
import React, {useCallback, useEffect, useState} from 'react';
import {
    Activity,
    AlertTriangle,
    Ban,
    Bell,
    CheckCircle,
    Clock,
    Download,
    Filter,
    Globe,
    RefreshCw,
    Settings,
    Shield,
    TrendingUp,
    Users,
    Zap
} from 'lucide-react';
import {Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {GeographicThreat, SecurityMetrics, ThreatEvent, ThreatTimeline, TopAttacker} from '@/types/security/core';

// Types


// Custom hooks for data fetching
const useSecurityData = (refreshInterval = 10000) => {
    const [data, setData] = useState<{
        metrics: SecurityMetrics | null;
        recentEvents: ThreatEvent[];
        geographicThreats: GeographicThreat[];
        threatTimeline: ThreatTimeline[];
        topAttackers: TopAttacker[];
        loading: boolean;
        error: string | null;
    }>({
        metrics: null,
        recentEvents: [],
        geographicThreats: [],
        threatTimeline: [],
        topAttackers: [],
        loading: true,
        error: null
    });

    const fetchData = useCallback(async () => {
        try {
            setData(prev => ({ ...prev, loading: true, error: null }));

            const [metricsRes, eventsRes, geoRes, timelineRes, attackersRes] = await Promise.all([
                fetch('/api/system/security/analytics/metrics'),
                fetch('/api/system/security/monitoring/realtime?limit=100'),
                fetch('/api/system/security/analytics/geographic'),
                fetch('/api/system/security/analytics/timeline?hours=24'),
                fetch('/api/system/security/analytics/threats/top-attackers')
            ]);

            const [metrics, events, geo, timeline, attackers] = await Promise.all([
                metricsRes.json(),
                eventsRes.json(),
                geoRes.json(),
                timelineRes.json(),
                attackersRes.json()
            ]);

            setData({
                metrics: metrics.data,
                recentEvents: events.data || [],
                geographicThreats: geo.data || [],
                threatTimeline: timeline.data || [],
                topAttackers: attackers.data || [],
                loading: false,
                error: null
            });
        } catch (error) {
            console.error('Failed to fetch security data:', error);
            setData(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to load security data'
            }));
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, refreshInterval);
        return () => clearInterval(interval);
    }, [fetchData, refreshInterval]);

    return { ...data, refetch: fetchData };
};

// Enhanced Metric Card Component
const MetricCard = ({
                        icon: Icon,
                        title,
                        value,
                        change,
                        trend = 'neutral',
                        color = 'blue',
                        subtitle,
                        onClick
                    }: {
    icon: any;
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: string;
    subtitle?: string;
    onClick?: () => void;
}) => {
    const trendColors = {
        up: trend === 'up' && title.includes('Blocked') ? 'text-green-600' : 'text-red-600',
        down: trend === 'down' && title.includes('Blocked') ? 'text-green-600' : 'text-red-600',
        neutral: 'text-gray-600'
    };

    return (
        <div
            className={`bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-all duration-200 ${
            onClick ? 'cursor-pointer hover:border-blue-300' : ''
        }`}
    onClick={onClick}
    >
    <div className="flex items-center justify-between mb-4">
    <div className={`p-3 rounded-xl bg-${color}-100`}>
    <Icon className={`w-6 h-6 text-${color}-600`} />
    </div>
    {change && (
        <div className={`text-sm font-medium ${trendColors[trend]}`}>
        {change}
        </div>
    )}
    </div>
    <div>
    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        </div>
    );
    };

// Threat Level Badge
    const ThreatLevelBadge = ({ level, size = 'sm' }: { level: string; size?: 'xs' | 'sm' | 'md' }) => {
        const colors = {
            safe: 'bg-green-100 text-green-800 border-green-200',
            low: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            medium: 'bg-orange-100 text-orange-800 border-orange-200',
            high: 'bg-red-100 text-red-800 border-red-200',
            critical: 'bg-purple-100 text-purple-800 border-purple-200'
        };

        const sizes = {
            xs: 'px-2 py-0.5 text-xs',
            sm: 'px-2 py-1 text-xs',
            md: 'px-3 py-1.5 text-sm'
        };

        return (
            //@ts-ignore
            <span className={`inline-flex items-center rounded-full border font-medium ${colors[level]} ${sizes[size]}`}>
        {level.toUpperCase()}
        </span>
    );
    };

// Real-time Events Stream
    const RealTimeEventStream = ({ events }: { events: ThreatEvent[] }) => {
        const [selectedEvent, setSelectedEvent] = useState<ThreatEvent | null>(null);

        return (
            <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
                Live Threat Monitor
        <span className="text-sm font-normal text-gray-500">({events.length} events)</span>
        </h3>
        <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
        <Filter className="w-4 h-4 text-gray-600" />
            </button>
            </div>
            </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
        <div className="space-y-1 p-4">
            {events.slice(0, 50).map((event) => (
                    <div
                        key={event.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all"
                onClick={() => setSelectedEvent(event)}
    >
        <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-gray-800 min-w-36">{event.ipAddress}</span>
            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{event.country}</span>
            </div>

            <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-xs text-gray-500 min-w-12">{event.method}</span>
            <span className="text-sm text-blue-600 truncate">{event.path}</span>
            </div>

            <div className="flex items-center gap-2">
        <ThreatLevelBadge level={event.threatLevel} size="xs" />
        <span className="text-sm font-medium text-gray-900">{event.riskScore}</span>
        {event.blocked && <Ban className="w-4 h-4 text-red-500" />}
        </div>
        </div>

        <div className="text-xs text-gray-400 ml-4">
            {new Date(event.timestamp).toLocaleTimeString()}
            </div>
            </div>
    ))}
        </div>
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
            <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Threat Event Details</h3>
        <button
            onClick={() => setSelectedEvent(null)}
            className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
                </div>
                </div>
                <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="text-sm font-medium text-gray-600">IP Address</label>
        <p className="font-mono text-lg">{selectedEvent.ipAddress}</p>
        </div>
        <div>
        <label className="text-sm font-medium text-gray-600">Risk Score</label>
        <p className="text-2xl font-bold text-red-600">{selectedEvent.riskScore}/100</p>
        </div>
        </div>

        <div>
        <label className="text-sm font-medium text-gray-600">Request Details</label>
        <div className="bg-gray-50 rounded-lg p-3 mt-1">
        <p><span className="font-medium">Method:</span> {selectedEvent.method}</p>
        <p><span className="font-medium">Path:</span> {selectedEvent.path}</p>
        <p><span className="font-medium">User Agent:</span> {selectedEvent.userAgent}</p>
        </div>
        </div>

            {selectedEvent.signatureMatches.length > 0 && (
                <div>
                    <label className="text-sm font-medium text-gray-600">Signature Matches</label>
            <div className="flex flex-wrap gap-2 mt-1">
                {selectedEvent.signatureMatches.map((match, idx) => (
                        <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                        {match}
                        </span>
            ))}
                </div>
                </div>
            )}

            <div className="flex gap-3 pt-4">
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Block IP
        </button>
        <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Add to Whitelist
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Create Incident
        </button>
        </div>
        </div>
        </div>
        </div>
        )}
        </div>
    );
    };

// Threat Timeline Chart
    const ThreatTimelineChart = ({ data }: { data: ThreatTimeline[] }) => {
        return (
            <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
                24-Hour Threat Timeline
        </h3>
        <div className="flex items-center gap-2">
        <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
            <option>Last 24 hours</option>
        <option>Last 7 days</option>
        <option>Last 30 days</option>
        </select>
        </div>
        </div>

        <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
        <defs>
            <linearGradient id="totalRequests" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
        </linearGradient>
        <linearGradient id="threats" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
        </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
            dataKey="timestamp"
        tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        stroke="#64748b"
        />
        <YAxis stroke="#64748b" />
        <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleString()}
        contentStyle={{
            backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
        />
        <Legend />
        <Area
            type="monotone"
        dataKey="totalRequests"
        stroke="#3b82f6"
        strokeWidth={2}
        fillOpacity={1}
        fill="url(#totalRequests)"
        name="Total Requests"
        />
        <Area
            type="monotone"
        dataKey="highThreats"
        stroke="#f59e0b"
        strokeWidth={2}
        fillOpacity={1}
        fill="url(#threats)"
        name="High Threats"
        />
        <Area
            type="monotone"
        dataKey="criticalThreats"
        stroke="#ef4444"
        strokeWidth={2}
        fillOpacity={1}
        fill="url(#threats)"
        name="Critical Threats"
            />
            </AreaChart>
            </ResponsiveContainer>
            </div>
            </div>
    );
    };

// Geographic Threat Map (simplified visualization)
    const GeographicThreatMap = ({ threats }: { threats: GeographicThreat[] }) => {
        const topThreats = threats.slice(0, 10);

        return (
            <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
                Geographic Threat Distribution
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View Full Map
        </button>
        </div>

        <div className="space-y-3">
            {topThreats.map((threat, idx) => (
                    <div key={threat.country} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-600">
                {idx + 1}
                </div>
                <div>
                <p className="font-medium text-gray-900">{threat.countryName}</p>
                    <p className="text-sm text-gray-500">{threat.uniqueIPs} unique IPs</p>
                    </div>
                    </div>
                    <div className="text-right">
                <p className="font-medium text-gray-900">{threat.threatRequests.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">threats</p>
                    </div>
                    <div className="text-right">
                <p className="font-medium text-red-600">{threat.avgRiskScore.toFixed(1)}</p>
                    <p className="text-sm text-gray-500">risk score</p>
            </div>
            </div>
    ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
        <div>
            <p className="text-2xl font-bold text-gray-900">{threats.length}</p>
            <p className="text-sm text-gray-600">Countries</p>
        </div>
        <div>
        <p className="text-2xl font-bold text-red-600">
            {threats.reduce((sum, t) => sum + t.threatRequests, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Threats</p>
        </div>
        <div>
        <p className="text-2xl font-bold text-orange-600">
            {(threats.reduce((sum, t) => sum + t.avgRiskScore, 0) / threats.length || 0).toFixed(1)}
        </p>
        <p className="text-sm text-gray-600">Avg Risk Score</p>
        </div>
        </div>
        </div>
        </div>
    );
    };

// Top Attackers Table
    const TopAttackersTable = ({ attackers }: { attackers: TopAttacker[] }) => {
        const [selectedAttacker, setSelectedAttacker] = useState<TopAttacker | null>(null);

        const handleBlockIP = async (ip: string) => {
            try {
                await fetch('/api/security/blocking/ip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ip, reason: 'Manual block from dashboard' })
                });
                // Refresh data or show success message
            } catch (error) {
                console.error('Failed to block IP:', error);
            }
        };

        return (
            <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
                Top Threat Sources
        <span className="text-sm font-normal text-gray-500">({attackers.length} active)</span>
        </h3>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
        <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            IP Address
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Requests
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Threat Level
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Countries
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Last Seen
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
            </th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
            {attackers.map((attacker) => (
                    <tr key={attacker.ipAddress} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-gray-900">
                    {attacker.ipAddress}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                    attacker.reputation < 30 ? 'bg-red-500' :
                        attacker.reputation < 60 ? 'bg-orange-500' : 'bg-yellow-500'
                }`}></div>
            </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
        <span className="font-medium">{attacker.threatRequests}</span>
            <span className="text-gray-500">/{attacker.totalRequests}</span>
            </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
        <div className={`w-8 h-2 rounded-full ${
            attacker.maxRiskScore >= 80 ? 'bg-red-500' :
                attacker.maxRiskScore >= 60 ? 'bg-orange-500' :
                    attacker.maxRiskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'
        }`}></div>
        <span className="text-sm font-medium">{attacker.maxRiskScore}</span>
            </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-wrap gap-1">
            {attacker.countries.slice(0, 3).map((country) => (
                    <span key={country} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {country}
                    </span>
    ))}
        {attacker.countries.length > 3 && (
            <span className="text-xs text-gray-500">+{attacker.countries.length - 3}</span>
        )}
        </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {new Date(attacker.lastSeen).toLocaleString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
            {attacker.isBlocked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    <Ban className="w-3 h-3" />
                        Blocked
                        </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                        Active
                        </span>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
            {!attacker.isBlocked ? (
            <button
                onClick={() => handleBlockIP(attacker.ipAddress)}
        className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
            >
            Block
            </button>
    ) : (
            <button className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700">
                Unblock
                </button>
        )}
        <button
            onClick={() => setSelectedAttacker(attacker)}
        className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50"
            >
            Details
            </button>
            </div>
            </td>
            </tr>
    ))}
        </tbody>
        </table>
        </div>
        </div>
    );
    };

// Quick Actions Panel
    const QuickActionsPanel = () => {
        const [emergencyMode, setEmergencyMode] = useState(false);

        const handleEmergencyLockdown = async () => {
            try {
                await fetch('/api/security/emergency/lockdown', { method: 'POST' });
                setEmergencyMode(true);
                // Show success notification
            } catch (error) {
                console.error('Failed to activate emergency lockdown:', error);
            }
        };

        return (
            <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
                Quick Actions
        </h3>

        <div className="space-y-3">
        <button
            onClick={handleEmergencyLockdown}
        disabled={emergencyMode}
        className={`w-full p-4 rounded-lg border-2 border-dashed transition-all ${
            emergencyMode
                ? 'border-red-300 bg-red-50 text-red-400 cursor-not-allowed'
                : 'border-red-300 hover:border-red-500 hover:bg-red-50 text-red-700'
        }`}
    >
        <div className="flex items-center justify-center gap-2">
        <AlertTriangle className="w-5 h-5" />
            {emergencyMode ? 'Emergency Mode Active' : 'Emergency Lockdown'}
            </div>
            </button>

            <button className="w-full p-4 border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg text-blue-700 transition-all">
        <div className="flex items-center justify-center gap-2">
        <Download className="w-5 h-5" />
            Export Security Report
        </div>
        </button>

        <button className="w-full p-4 border-2 border-dashed border-gray-300 hover:border-gray-500 hover:bg-gray-50 rounded-lg text-gray-700 transition-all">
        <div className="flex items-center justify-center gap-2">
        <Settings className="w-5 h-5" />
            Configure Alerts
        </div>
        </button>

        <button className="w-full p-4 border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 rounded-lg text-green-700 transition-all">
        <div className="flex items-center justify-center gap-2">
        <CheckCircle className="w-5 h-5" />
            Update Whitelist
        </div>
        </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-3">System Status</h4>
        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Threat Detection</span>
        <span className="text-sm font-medium text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Auto-blocking</span>
            <span className="text-sm font-medium text-green-600">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Geo-blocking</span>
            <span className="text-sm font-medium text-yellow-600">Partial</span>
            </div>
            </div>
            </div>
            </div>
    );
    };

// Main Dashboard Component
    export default function EnterpriseSecurityDashboard() {
        const {
            metrics,
            recentEvents,
            geographicThreats,
            threatTimeline,
            topAttackers,
            loading,
            error,
            refetch
        } = useSecurityData(5000); // Refresh every 5 seconds

        const [autoRefresh, setAutoRefresh] = useState(true);
        const [timeRange, setTimeRange] = useState('24h');

        if (loading && !metrics) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading security dashboard...</p>
            </div>
            </div>
        );
        }

        if (error) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                    <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                Retry
                </button>
                </div>
                </div>
        );
        }

        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
        <Shield className="w-8 h-8 text-blue-600" />
            Enterprise Security Command Center
        </h1>
        <p className="text-gray-600 mt-1">Real-time threat monitoring and incident response</p>
        </div>

        <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Auto-refresh:</span>
        <button
        onClick={() => setAutoRefresh(!autoRefresh)}
        className={`px-3 py-1 rounded-full text-sm font-medium ${
            autoRefresh
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
        }`}
    >
        {autoRefresh ? 'ON' : 'OFF'}
        </button>
        </div>

        <select
        value={timeRange}
        onChange={(e) => setTimeRange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
        >
        <option value="1h">Last Hour</option>
        <option value="24h">Last 24 Hours</option>
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
        </select>

        <button
        onClick={refetch}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
        <RefreshCw className="w-5 h-5" />
            </button>

            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative">
        <Bell className="w-5 h-5" />
            {metrics && metrics.activeThreats > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            )}
        </button>
        </div>
        </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
            icon={Activity}
        title="Total Requests"
        value={metrics?.totalRequests?.toLocaleString() || '0'}
        change="+12.5%"
        trend="up"
        color="blue"
        subtitle="Last 24 hours"
        />
        <MetricCard
            icon={Ban}
        title="Blocked Requests"
        value={metrics?.blockedRequests?.toLocaleString() || '0'}
        change="+23.1%"
        trend="up"
        color="red"
        subtitle={`${((metrics?.blockedRequests || 0) / (metrics?.totalRequests || 1) * 100).toFixed(1)}% of total`}
        />
        <MetricCard
        icon={AlertTriangle}
        title="Active Threats"
        value={metrics?.activeThreats || 0}
        trend="neutral"
        color="orange"
        subtitle="High severity"
        />
        <MetricCard
            icon={Users}
        title="Suspicious IPs"
        value={metrics?.suspiciousIPs || 0}
        change="-8.2%"
        trend="down"
        color="yellow"
        subtitle="Last hour"
        />
        <MetricCard
            icon={Globe}
        title="Countries"
        value={metrics?.uniqueCountries || 0}
        trend="neutral"
        color="green"
        subtitle="Active sources"
        />
        <MetricCard
            icon={Clock}
        title="Response Time"
        value={`${metrics?.avgResponseTime || 0}ms`}
        change="-15ms"
        trend="down"
        color="blue"
        subtitle="Average"
        />
        <MetricCard
            icon={CheckCircle}
        title="Uptime"
        value={`${metrics?.uptime || 0}%`}
        trend="neutral"
        color="green"
        subtitle="Last 30 days"
        />
        <MetricCard
            icon={AlertTriangle}
        title="Incidents"
        value={metrics?.incidentsToday || 0}
        trend="neutral"
        color="purple"
        subtitle="Today"
            />
            </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Timeline and Map */}
            <div className="lg:col-span-3 space-y-6">
        <ThreatTimelineChart data={threatTimeline} />
        <GeographicThreatMap threats={geographicThreats} />
        </div>

        {/* Right Column - Quick Actions */}
        <div className="lg:col-span-1">
            <QuickActionsPanel />
            </div>
            </div>

        {/* Event Stream and Attackers */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RealTimeEventStream events={recentEvents} />
        <div className="xl:col-span-1">
        <TopAttackersTable attackers={topAttackers.slice(0, 10)} />
        </div>
        </div>
        </div>
        </div>
    );
    }