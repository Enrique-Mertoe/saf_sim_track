"use client"
import React, {useEffect, useState} from 'react';
import {simCardTransferService, teamService} from "@/services";
import useApp from "@/ui/provider/AppProvider";
import {SimCardTransfer, Team, TransferStatus} from "@/models";
import {AlertTriangle, ArrowLeftRight, Check, Info, RefreshCw, Search, X} from 'lucide-react';
import {useSupabaseSignal} from "@/lib/supabase/event";
import alert from "@/ui/alert";

const AdminTransfersPage = () => {
    const {user} = useApp();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [transfers, setTransfers] = useState<SimCardTransfer[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
    const [selectedTransfer, setSelectedTransfer] = useState<SimCardTransfer | null>(null);
    const [rejectReason, setRejectReason] = useState<string>('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    // Setup Supabase realtime for transfers
    const transferSignal = useSupabaseSignal('sim_card_transfers', {autoConnect: true});

    function showDialog(props: any) {
        if (props.type == "success")
            alert.success(props.message);
        if (props.type == "rejected")
            alert.error(props.message);
    }

    // Fetch transfers
    useEffect(() => {
        const fetchTransfers = async () => {
            if (!user) return;

            try {
                setIsLoading(true);
                const {data, error} = await simCardTransferService.getTransferRequests({
                    pageSize: 100
                });

                if (error) throw error;
                setTransfers(data || []);
            } catch (err) {
                console.error('Error fetching transfers:', err);
                setError('Failed to load transfer requests');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransfers();
    }, [user]);

    // Fetch teams
    useEffect(() => {
        const fetchTeams = async () => {
            if (!user) return;
            console.log("teams", "teams")
            try {
                const {data, error} = await teamService.getAllTeams(user);
                if (error) throw error;
                setTeams(data || []);
            } catch (err) {
                console.error('Error fetching teams:', err);
                setError('Failed to load teams');
            }
        };

        fetchTeams().then();
    }, [user]);

    // Setup realtime updates for transfers
    useEffect(() => {
        if (!transferSignal || !user) return;

        // Handle new transfers
        const handleInsert = (payload: any) => {
            if (payload.new) {
                setTransfers(prev => [payload.new, ...prev]);
            }
        };

        // Handle updated transfers
        const handleUpdate = (payload: any) => {
            if (payload.new) {
                setTransfers(prev =>
                    prev.map(transfer => transfer.id === payload.new.id ? payload.new : transfer)
                );
            }
        };

        // Subscribe to events
        transferSignal.onInsert(handleInsert);
        transferSignal.onUpdate(handleUpdate);

        // Cleanup
        return () => {
            transferSignal.off('INSERT', handleInsert);
            transferSignal.off('UPDATE', handleUpdate);
        };
    }, [transferSignal, user]);

    // Handle transfer approval
    const handleApproveTransfer = async (transferId: string) => {
        if (!user) return;

        try {
            setIsLoading(true);

            const {data, error} = await simCardTransferService.approveTransferRequest(transferId, user.id);

            if (error) throw error;

            // Create notification for requester
            if (data) {
                await simCardTransferService.createTransferNotification(
                    data,
                    data.requested_by_id,
                    'approved'
                );
            }

            // Show success message
            showDialog({
                title: 'Transfer Request Approved',
                message: 'The transfer request has been approved and SIM cards have been transferred.',
                type: 'success'
            });

            // Update transfers list
            setTransfers(prev =>
                prev.map(transfer => transfer.id === transferId ? {
                    ...transfer,
                    status: TransferStatus.APPROVED
                } : transfer)
            );

        } catch (err) {
            console.error('Error approving transfer request:', err);
            setError('Failed to approve transfer request');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle transfer rejection
    const handleRejectTransfer = async () => {
        if (!user || !selectedTransfer) return;

        try {
            setIsLoading(true);

            const {data, error} = await simCardTransferService.rejectTransferRequest(
                selectedTransfer.id,
                user.id,
                rejectReason
            );

            if (error) throw error;

            // Create notification for requester
            if (data) {
                await simCardTransferService.createTransferNotification(
                    data,
                    data.requested_by_id,
                    'rejected'
                );
            }

            // Show success message
            showDialog({
                title: 'Transfer Request Rejected',
                message: 'The transfer request has been rejected.',
                type: 'success'
            });

            // Update transfers list
            setTransfers(prev =>
                prev.map(transfer => transfer.id === selectedTransfer.id ? {
                    ...transfer,
                    status: TransferStatus.REJECTED
                } : transfer)
            );

            // Close modal and reset form
            setShowRejectModal(false);
            setRejectReason('');
            setSelectedTransfer(null);

        } catch (err) {
            console.error('Error rejecting transfer request:', err);
            setError('Failed to reject transfer request');
        } finally {
            setIsLoading(false);
        }
    };

    // Open reject modal
    const openRejectModal = (transfer: SimCardTransfer) => {
        setSelectedTransfer(transfer);
        setRejectReason('');
        setShowRejectModal(true);
    };

    // Filter transfers based on active tab and search term
    const filteredTransfers = transfers.filter(transfer => {
        // Filter by tab
        if (activeTab === 'pending' && transfer.status !== TransferStatus.PENDING) {
            return false;
        }

        // Filter by search term
        if (searchTerm) {
            const sourceTeam = teams.find(team => team.id === transfer.source_team_id);
            const destinationTeam = teams.find(team => team.id === transfer.destination_team_id);
            const sourceTeamName = sourceTeam ? sourceTeam.name : '';
            const destinationTeamName = destinationTeam ? destinationTeam.name : '';

            return (
                transfer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sourceTeamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                destinationTeamName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return true;
    });

    // Get team name by ID
    const getTeamName = (teamId: string) => {
        const team = teams.find(team => team.id === teamId);
        return team ? team.name : 'Unknown Team';
    };

    // Get status badge color
    const getStatusBadgeColor = (status: TransferStatus) => {
        switch (status) {
            case TransferStatus.PENDING:
                return 'bg-yellow-100 text-yellow-800';
            case TransferStatus.APPROVED:
                return 'bg-green-100 text-green-800';
            case TransferStatus.REJECTED:
                return 'bg-red-100 text-red-800';
            case TransferStatus.CANCELLED:
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // View transfer details
    const viewTransferDetails = (transfer: SimCardTransfer) => {
        showDialog({
            title: 'Transfer Request Details',
            message: (
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">From Team</p>
                        <p className="text-base">{getTeamName(transfer.source_team_id)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">To Team</p>
                        <p className="text-base">{getTeamName(transfer.destination_team_id)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">SIM Cards</p>
                        <p className="text-base">{Array.isArray(transfer.sim_cards) ? transfer.sim_cards.length : 0} cards</p>
                    </div>
                    {transfer.reason && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Reason</p>
                            <p className="text-base">{transfer.reason}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <p className="text-base">{transfer.status}</p>
                    </div>
                    {transfer.notes && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Notes</p>
                            <p className="text-base">{transfer.notes}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-medium text-gray-500">Requested On</p>
                        <p className="text-base">{new Date(transfer.created_at).toLocaleString()}</p>
                    </div>
                    {transfer.approval_date && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Processed On</p>
                            <p className="text-base">{new Date(transfer.approval_date).toLocaleString()}</p>
                        </div>
                    )}
                </div>
            ),
            type: 'info'
        });
    };

    return (
        <>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">SIM Card Transfer Requests</h1>
                        <p className="text-gray-600">Manage transfer requests between teams</p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div
                            className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2"/>
                            <span>{error}</span>
                            <button
                                className="ml-auto text-red-500 hover:text-red-700"
                                onClick={() => setError(null)}
                            >
                                <X className="w-4 h-4"/>
                            </button>
                        </div>
                    )}

                    {/* Transfer Requests List */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div
                            className="border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <h2 className="text-lg font-semibold text-gray-900">Transfer Requests</h2>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
                                    <input
                                        type="text"
                                        placeholder="Search requests..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm"
                                    />
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setActiveTab('pending')}
                                        className={`px-3 py-1 text-sm rounded-md ${
                                            activeTab === 'pending'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Pending
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('all')}
                                        className={`px-3 py-1 text-sm rounded-md ${
                                            activeTab === 'all'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        All
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin"/>
                                </div>
                            ) : filteredTransfers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 text-gray-300"/>
                                    <p>No transfer requests found</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredTransfers.map(transfer => (
                                        <div key={transfer.id}
                                             className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <ArrowLeftRight className="w-4 h-4 text-blue-500"/>
                                                        <span className="font-medium text-gray-900">
                              Transfer from {getTeamName(transfer.source_team_id)} to {getTeamName(transfer.destination_team_id)}
                            </span>
                                                        <span
                                                            className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusBadgeColor(transfer.status)}`}>
                              {transfer.status}
                            </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        {Array.isArray(transfer.sim_cards) ? transfer.sim_cards.length : 0} SIM
                                                        cards
                                                    </p>
                                                    {transfer.reason && (
                                                        <p className="text-sm text-gray-600">Reason: {transfer.reason}</p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Requested
                                                        on {new Date(transfer.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>

                                                <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => viewTransferDetails(transfer)}
                                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                                    >
                            <span className="flex items-center">
                              <Info className="w-4 h-4 mr-1"/>
                              Details
                            </span>
                                                    </button>

                                                    {transfer.status === TransferStatus.PENDING && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveTransfer(transfer.id)}
                                                                className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                                            >
                                <span className="flex items-center">
                                  <Check className="w-4 h-4 mr-1"/>
                                  Approve
                                </span>
                                                            </button>

                                                            <button
                                                                onClick={() => openRejectModal(transfer)}
                                                                className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                            >
                                <span className="flex items-center">
                                  <X className="w-4 h-4 mr-1"/>
                                  Reject
                                </span>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Transfer Request</h3>
                        <p className="text-gray-600 mb-4">Please provide a reason for rejecting this transfer
                            request.</p>

                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                            rows={3}
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectTransfer}
                                disabled={!rejectReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminTransfersPage;