"use client"
// =============================================
// ALERT MANAGEMENT SYSTEM
// =============================================

import {AlertTriangle, Clock, ExternalLink, Settings} from "lucide-react";
import {useEffect, useState} from "react";

const AlertManagementCenter = () => {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [alertRules, setAlertRules] = useState<any[]>([]);
    const [integrations, setIntegrations] = useState({
        slack: { enabled: false, webhookUrl: '', configured: false },
        email: { enabled: true, recipients: ['security@company.com'], configured: true },
        pagerduty: { enabled: false, apiKey: '', configured: false },
        webhooks: { enabled: false, urls: [], configured: false }
    });

    useEffect(() => {
        fetchAlerts();
        fetchAlertRules();
        fetchIntegrations();
    }, []);

    const fetchAlerts = async () => {
        try {
            const response = await fetch('/api/system/security/alerts');
            const data = await response.json();
            setAlerts(data.alerts || []);
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        }
    };

    const fetchAlertRules = async () => {
        try {
            const response = await fetch('/api/system/security/alerts/rules');
            const data = await response.json();
            setAlertRules(data.rules || []);
        } catch (error) {
            console.error('Failed to fetch alert rules:', error);
        }
    };

    const fetchIntegrations = async () => {
        try {
            const response = await fetch('/api/system/security/alerts/integrations');
            const data = await response.json();
            setIntegrations(data.integrations || integrations);
        } catch (error) {
            console.error('Failed to fetch integrations:', error);
        }
    };

    const acknowledgeAlert = async (alertId: string) => {
        try {
            await fetch(`/api/system/security/alerts/${alertId}/acknowledge`, { method: 'POST' });
            fetchAlerts();
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
        }
    };

    const testIntegration = async (type: string) => {
        try {
            await fetch(`/api/system/security/alerts/integrations/${type}/test`, { method: 'POST' });
            // Show success message
        } catch (error) {
            console.error(`Failed to test ${type} integration:`, error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Alert Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div className="bg-white rounded-xl border shadow-sm p-6">
    <div className="flex items-center gap-3">
    <div className="p-3 bg-red-100 rounded-xl">
    <AlertTriangle className="w-6 h-6 text-red-600" />
    </div>
    <div>
    <p className="text-sm text-gray-600">Active Alerts</p>
    <p className="text-2xl font-bold text-gray-900">
        {
            //@ts-ignore
            alerts.filter(a => a.status === 'active').length}
        </p>
        </div>
        </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
    <div className="flex items-center gap-3">
    <div className="p-3 bg-yellow-100 rounded-xl">
    <Clock className="w-6 h-6 text-yellow-600" />
    </div>
    <div>
    <p className="text-sm text-gray-600">Acknowledged</p>
        <p className="text-2xl font-bold text-gray-900">
        {
            //@ts-ignore
            alerts.filter(a => a.status === 'acknowledged').length}
        </p>
        </div>
        </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
    <div className="flex items-center gap-3">
    <div className="p-3 bg-green-100 rounded-xl">
    <Settings className="w-6 h-6 text-green-600" />
    </div>
    <div>
    <p className="text-sm text-gray-600">Alert Rules</p>
    <p className="text-2xl font-bold text-gray-900">{alertRules.length}</p>
        </div>
        </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
    <div className="flex items-center gap-3">
    <div className="p-3 bg-blue-100 rounded-xl">
    <ExternalLink className="w-6 h-6 text-blue-600" />
    </div>
    <div>
    <p className="text-sm text-gray-600">Integrations</p>
        <p className="text-2xl font-bold text-gray-900">
        {Object.values(integrations).filter(i => i.configured).length}
        </p>
        </div>
        </div>
        </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <div className="bg-white rounded-xl border shadow-sm">
    <div className="p-6 border-b">
    <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
    </div>
    <div className="max-h-96 overflow-y-auto">
        {
            //@ts-ignore
            alerts.filter(a => a.status === 'active').map((alert) => (
                <div key={alert.id} className="p-4 border-b border-gray-100 last:border-b-0">
            <div className="flex items-start justify-between">
            <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
                alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
            }`}>
        {alert.severity.toUpperCase()}
        </span>
        <span className="text-xs text-gray-500">
        {new Date(alert.createdAt).toLocaleString()}
        </span>
        </div>
        <h4 className="font-medium text-gray-900 mb-1">{alert.title}</h4>
        <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
        <div className="flex items-center gap-2">
    <button
        onClick={() => acknowledgeAlert(alert.id)}
    className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
        >
        Acknowledge
        </button>
        <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50">
        View Details
    </button>
    </div>
    </div>
    </div>
    </div>
))}
    </div>
    </div>

    {/* Integration Status */}
    <div className="bg-white rounded-xl border shadow-sm">
    <div className="p-6 border-b">
    <h3 className="text-lg font-semibold text-gray-900">Notification Integrations</h3>
    </div>
    <div className="p-6 space-y-4">
    {Object.entries(integrations).map(([type, config]) => (
            <div key={type} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${config.configured ? 'bg-green-500' : 'bg-gray-300'}`}></div>
    <div>
    <p className="font-medium text-gray-900 capitalize">{type}</p>
        <p className="text-sm text-gray-500">
        {config.configured ? 'Configured' : 'Not configured'}
        </p>
        </div>
        </div>
        <div className="flex items-center gap-2">
    <button
        onClick={() => testIntegration(type)}
    disabled={!config.configured}
    className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
        >
        Test
        </button>
        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
        Configure
        </button>
        </div>
        </div>
))}
    </div>
    </div>
    </div>

    {/* Alert Rules Configuration */}
    <div className="bg-white rounded-xl border shadow-sm">
    <div className="p-6 border-b">
    <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold text-gray-900">Alert Rules</h3>
    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
        Create Rule
    </button>
    </div>
    </div>
    <div className="overflow-x-auto">
    <table className="w-full">
    <thead className="bg-gray-50 border-b">
    <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule Name</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Triggered</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
        {alertRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 font-medium text-gray-900">{rule.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                {rule.description}
                </td>
                <td className="px-6 py-4">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
                rule.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    rule.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
            }`}>
        {rule.severity.toUpperCase()}
        </span>
        </td>
        <td className="px-6 py-4">
    <span className={`px-2 py-1 rounded text-xs font-medium ${
        rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
    }`}>
    {rule.enabled ? 'Enabled' : 'Disabled'}
    </span>
    </td>
    <td className="px-6 py-4 text-sm text-gray-500">
        {rule.lastTriggered ? new Date(rule.lastTriggered).toLocaleString() : 'Never'}
        </td>
        <td className="px-6 py-4">
    <div className="flex items-center gap-2">
    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
        Edit
        </button>
        <button className="text-red-600 hover:text-red-700 text-sm font-medium">
        Delete
        </button>
        </div>
        </td>
        </tr>
))}
    </tbody>
    </table>
    </div>
    </div>
    </div>
);
};


export default AlertManagementCenter