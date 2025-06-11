import {showModal} from "@/ui/shortcuts";
import {X} from "lucide-react";
import React from "react";

export function showDialog(props:any) {
    showModal({
        content: (onClose) => {
            // Define type-based styling
            const getTypeStyles = (type:any) => {
                switch (type) {
                    case 'success':
                        return {
                            headerBg: 'bg-green-50 dark:bg-green-900/20',
                            iconColor: 'text-green-600 dark:text-green-400',
                            icon: '✓',
                            borderColor: 'border-green-200 dark:border-green-800'
                        };
                    case 'error':
                        return {
                            headerBg: 'bg-red-50 dark:bg-red-900/20',
                            iconColor: 'text-red-600 dark:text-red-400',
                            icon: '✕',
                            borderColor: 'border-red-200 dark:border-red-800'
                        };
                    case 'info':
                        return {
                            headerBg: 'bg-blue-50 dark:bg-blue-900/20',
                            iconColor: 'text-blue-600 dark:text-blue-400',
                            icon: 'ℹ',
                            borderColor: 'border-blue-200 dark:border-blue-800'
                        };
                    default:
                        return {
                            headerBg: 'bg-gray-50 dark:bg-gray-800',
                            iconColor: 'text-gray-600 dark:text-gray-400',
                            icon: 'ℹ',
                            borderColor: 'border-gray-200 dark:border-gray-700'
                        };
                }
            };

            const typeStyles = getTypeStyles(props.type);

            return (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 ">
                    {/* Header */}
                    <div className={`${typeStyles.headerBg} ${typeStyles.borderColor} border-b px-6 py-4 rounded-t-lg`}>
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
            <div className={`${typeStyles.iconColor} text-xl font-bold`}>
            {typeStyles.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {props.title}
                </h3>
                </div>
                <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
            <X width={20} height={20} />
            </button>
            </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
                {typeof props.message === 'string' ? (
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {props.message}
                            </p>
                    ) : (
                        <div className="text-gray-700 dark:text-gray-300">
                            {props.message}
                            </div>
                    )}
                </div>

            {/* Footer - only show for simple dialogs */}
            {typeof props.message === 'string' && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-end">
                <button
                    onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                    OK
                    </button>
                    </div>
                    </div>
            )}
            </div>
        );
        }
    });
}

// Enhanced Transfer Request Details component
export function TransferRequestDetails({ transfer, getTeamName }:any) {
    const getStatusBadge = (status:any) => {
        const statusStyles = {
            'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
            'approved': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            'rejected': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
            'completed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                //@ts-ignore
                statusStyles[status] || statusStyles.pending}`}>
        {status}
        </span>
    );
    };

    return (
        <div className="space-y-6">
            {/* Transfer Overview */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
    <div className="grid grid-cols-1 gap-4">
    <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
    {getStatusBadge(transfer.status)}
    </div>
    <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">SIM Cards</span>
    <span className="text-sm font-semibold text-gray-900 dark:text-white">
        {Array.isArray(transfer.sim_cards) ? transfer.sim_cards.length : 0} cards
    </span>
    </div>
    </div>
    </div>

    {/* Team Transfer Details */}
    <div className="space-y-4">
    <div className="flex items-center space-x-4">
    <div className="flex-1">
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">FROM TEAM</p>
    <p className="text-base font-semibold text-blue-900 dark:text-blue-100">
        {getTeamName(transfer.source_team_id)}
    </p>
    </div>
    </div>
    <div className="flex-shrink-0">
    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        </div>
        </div>
        <div className="flex-1">
    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
    <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">TO TEAM</p>
    <p className="text-base font-semibold text-green-900 dark:text-green-100">
        {getTeamName(transfer.destination_team_id)}
    </p>
    </div>
    </div>
    </div>
    </div>

    {/* Additional Details */}
    <div className="space-y-4">
        {transfer.reason && (
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Reason</p>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 rounded-md p-3">
                {transfer.reason}
                </p>
                </div>
)}

    {transfer.notes && (
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</p>
            <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 rounded-md p-3">
        {transfer.notes}
        </p>
        </div>
    )}

    {/* Timestamps */}
    <div className="grid grid-cols-1 gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
    <div className="flex justify-between items-center">
    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Requested On</span>
    <span className="text-sm text-gray-900 dark:text-white">
        {new Date(transfer.created_at).toLocaleString()}
        </span>
        </div>
    {transfer.approval_date && (
        <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Processed On</span>
    <span className="text-sm text-gray-900 dark:text-white">
        {new Date(transfer.approval_date).toLocaleString()}
        </span>
        </div>
    )}
    </div>
    </div>
    </div>
);
}