import React, {useEffect, useState} from "react";
import {AlertTriangle} from "lucide-react";
import {IncidentDetailModal} from "@/app/system/admin/security/components";
import {SecurityIncident} from "@/types/security/core";

export const IncidentManagementDashboard = () => {
    const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
    const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
    const [filters, setFilters] = useState({
        status: 'all',
        severity: 'all',
        assignedTo: 'all',
        timeRange: '7d'
    });
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Fetch incidents
    useEffect(() => {
        fetchIncidents();
    }, [filters]);

    const fetchIncidents = async () => {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== 'all') params.append(key, value);
            });

            const response = await fetch(`/api/system/security/incidents?${params}`);
            const data = await response.json();
            setIncidents(data.incidents || []);
        } catch (error) {
            console.error('Failed to fetch incidents:', error);
        }
    };

    const updateIncidentStatus = async (incidentId: string, status: string) => {
        try {
            await fetch(`/api/system/security/incidents/${incidentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            fetchIncidents();
        } catch (error) {
            console.error('Failed to update incident:', error);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-red-100 text-red-800';
            case 'investigating': return 'bg-yellow-100 text-yellow-800';
            case 'contained': return 'bg-blue-100 text-blue-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header and Filters */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
    <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
    <AlertTriangle className="w-6 h-6 text-orange-600" />
        Security Incident Management
    </h2>
    <button
    onClick={() => setShowCreateForm(true)}
    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
        >
        Create Incident
    </button>
    </div>

    {/* Filter Bar */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <select
        value={filters.status}
    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
    className="border border-gray-300 rounded-lg px-3 py-2"
    >
    <option value="all">All Statuses</option>
    <option value="open">Open</option>
        <option value="investigating">Investigating</option>
        <option value="contained">Contained</option>
        <option value="resolved">Resolved</option>
        </select>

        <select
    value={filters.severity}
    onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
    className="border border-gray-300 rounded-lg px-3 py-2"
    >
    <option value="all">All Severities</option>
    <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
        </select>

        <select className="border border-gray-300 rounded-lg px-3 py-2">
    <option value="all">All Assignees</option>
    <option value="me">Assigned to Me</option>
    <option value="unassigned">Unassigned</option>
        </select>

        <select
    value={filters.timeRange}
    onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
    className="border border-gray-300 rounded-lg px-3 py-2"
    >
    <option value="24h">Last 24 Hours</option>
    <option value="7d">Last 7 Days</option>
    <option value="30d">Last 30 Days</option>
    <option value="90d">Last 90 Days</option>
    </select>
    </div>
    </div>

    {/* Incidents Table */}
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
    <table className="w-full">
    <thead className="bg-gray-50 border-b">
    <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Incident
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Severity
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Status
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Assigned To
    </th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Detected
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        MTTR
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Actions
        </th>
        </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
        {incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50">
            <td className="px-6 py-4">
            <div>
                <p className="font-medium text-gray-900">{incident.title}</p>
                <p className="text-sm text-gray-500 truncate max-w-xs">
                {incident.description}
                </p>
                </div>
                </td>
                <td className="px-6 py-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
        {incident.severity.toUpperCase()}
        </span>
        </td>
        <td className="px-6 py-4">
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
    {incident.status.replace('_', ' ').toUpperCase()}
    </span>
    </td>
    <td className="px-6 py-4 text-sm text-gray-900">
        {incident.assignedTo || 'Unassigned'}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
        {new Date(incident.detectedAt).toLocaleString()}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
        {incident.mttrMinutes ? `${incident.mttrMinutes}m` : '-'}
        </td>
        <td className="px-6 py-4">
    <div className="flex items-center gap-2">
    <button
        onClick={() => setSelectedIncident(incident)}
    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
        View
        </button>
        <select
    value={incident.status}
    onChange={(e) => updateIncidentStatus(incident.id, e.target.value)}
    className="text-xs border border-gray-300 rounded px-2 py-1"
    >
    <option value="open">Open</option>
        <option value="investigating">Investigating</option>
        <option value="contained">Contained</option>
        <option value="resolved">Resolved</option>
        </select>
        </div>
        </td>
        </tr>
))}
    </tbody>
    </table>
    </div>
    </div>

    {/* Incident Detail Modal */}
    {selectedIncident && (
        <IncidentDetailModal
            incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onUpdate={fetchIncidents}
        />
    )}
    </div>
);
};
