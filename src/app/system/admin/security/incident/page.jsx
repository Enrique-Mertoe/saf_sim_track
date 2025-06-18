"use client"
import React, {useState} from 'react';
import {AlertTriangle, Bell, Brain} from 'lucide-react';
import {IncidentManagementDashboard} from "../incident";
import {AnomalyDetectionDashboard} from "../analystics";
import AlertManagementCenter from "../alertmanagement";


// =============================================
// MAIN ENTERPRISE SECURITY TABS
// =============================================

export default function EnterpriseSecurityAdvanced() {
    const [activeTab, setActiveTab] = useState('incidents');

    const tabs = [
        { id: 'incidents', label: 'Incident Management', icon: AlertTriangle },
        { id: 'anomalies', label: 'ML Anomaly Detection', icon: Brain },
        { id: 'alerts', label: 'Alert Management', icon: Bell }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <div className="bg-white border-b border-gray-200">
                <div className="px-6 py-4">
                    <nav className="flex space-x-8">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 py-2 px-3 border-b-2 font-medium text-sm ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {activeTab === 'incidents' && <IncidentManagementDashboard />}
                {activeTab === 'anomalies' && <AnomalyDetectionDashboard />}
                {activeTab === 'alerts' && <AlertManagementCenter />}
            </div>
        </div>
    );
}