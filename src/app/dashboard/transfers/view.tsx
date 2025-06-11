"use client"
import React, {useEffect, useState} from 'react';
import {simCardTransferService, teamService} from "@/services";
import useApp from "@/ui/provider/AppProvider";
import {SimCardTransfer, Team, TransferStatus} from "@/models";
import {AlertTriangle, ArrowLeftRight, Check, RefreshCw, Search, X} from 'lucide-react';
import {useSupabaseSignal} from "@/lib/supabase/event";
import ClientApi from "@/lib/utils/ClientApi";
import {showDialog} from "@/app/dashboard/transfers/utility";


const TransfersPage = () => {
    const {user} = useApp();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [transfers, setTransfers] = useState<SimCardTransfer[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [unsoldSimCards, setUnsoldSimCards] = useState<any[]>([]);
    const [selectedSimCards, setSelectedSimCards] = useState<string[]>([]);
    const [destinationTeamId, setDestinationTeamId] = useState<string>('');
    const [reason, setReason] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');


    // Setup Supabase realtime for transfers
    const transferSignal = useSupabaseSignal('sim_card_transfers', {autoConnect: true});

    // Fetch transfers
    useEffect(() => {

        const fetchTransfers = async () => {
            if (!user || !user.team_id) return;

            try {
                setIsLoading(true);
                const {data, error} = await simCardTransferService.getTransferRequests({
                    sourceTeamId: user.team_id,
                    adminId: user.admin_id,
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
            if (!user || !user.admin_id) return;

            try {
                const {data, error} = await teamService.teams(user);
                if (error) throw error;
                // Filter out the current team
                const filteredTeams = (data || []).filter(team => team.id !== user.team_id);
                setTeams(filteredTeams);

                // Set default destination team if available
                if (filteredTeams.length > 0) {
                    setDestinationTeamId(filteredTeams[0].id);
                }
            } catch (err) {
                console.error('Error fetching teams:', err);
                setError('Failed to load teams');
            }
        };

        fetchTeams();
    }, [user]);

    // Fetch unsold SIM cards
    useEffect(() => {
        const fetchUnsoldSimCards = async () => {
            if (!user || !user.team_id) return;

            try {
                const {data, error} = await simCardTransferService.getUnsoldSimCards(user.team_id);
                if (error) throw error;
                setUnsoldSimCards(data || []);
            } catch (err) {
                console.error('Error fetching unsold SIM cards:', err);
                setError('Failed to load unsold SIM cards');
            }
        };

        fetchUnsoldSimCards();
    }, [user]);

    // Setup realtime updates for transfers
    useEffect(() => {
        if (!transferSignal || !user || !user.team_id) return;

        // Handle new transfers
        const handleInsert = (payload: any) => {
            if (payload.new && (payload.new.source_team_id === user.team_id || payload.new.destination_team_id === user.team_id)) {
                setTransfers(prev => [payload.new, ...prev]);
            }
        };

        // Handle updated transfers
        const handleUpdate = (payload: any) => {
            if (payload.new && (payload.new.source_team_id === user.team_id || payload.new.destination_team_id === user.team_id)) {
                setTransfers(prev =>
                    prev.map(transfer => transfer.id === payload.new.id ? payload.new : transfer)
                );
            }
        };

        transferSignal.onInsert(handleInsert);
        transferSignal.onUpdate(handleUpdate);

        // Cleanup
        return () => {
            transferSignal.off('INSERT', handleInsert);
            transferSignal.off('UPDATE', handleUpdate);
        };
    }, [transferSignal, user]);

    const handleSimCardSelection = (simCardId: string) => {
        setSelectedSimCards(prev => {
            if (prev.includes(simCardId)) {
                return prev.filter(id => id !== simCardId);
            } else {
                return [...prev, simCardId];
            }
        });
    };

    // Handle transfer request submission
    const handleSubmitTransfer = async () => {
        if (!user || !user.team_id || !destinationTeamId || selectedSimCards.length === 0) {
            setError('Please select SIM cards and a destination team');
            return;
        }

        try {
            setIsLoading(true);

            const transferData = {
                source_team_id: user.team_id,
                destination_team_id: destinationTeamId,
                requested_by_id: user.id,
                admin_id: user.admin_id,
                sim_cards: selectedSimCards,
                reason: reason
            };

            const {data, error} = await new Promise<{data:any, error:any}>((resolve, reject) => {
                ClientApi.of("transfer").get()
                    .create_transfer_request(transferData)
                    .then(res => {
                        if (res.ok)
                            resolve({error: null, data: res.data})
                        else
                            resolve({error: res.error, data: null})
                    }).catch(err => {
                        resolve({error: err.message, data: null})
                    })
            });

            if (error) throw error;

            // Create notification for admin
            if (user.admin_id && data) {
                await simCardTransferService.createTransferNotification(
                    data,
                    user.admin_id,
                    'created'
                );
            }

            // Reset form
            setSelectedSimCards([]);
            setReason('');

            // Show success message
            showDialog({
                title: 'Transfer Request Submitted',
                message: 'Your transfer request has been submitted and is pending approval.',
                type: 'success'
            });

            // Refresh transfers
            const {data: refreshedTransfers} = await simCardTransferService.getTransferRequests({
                sourceTeamId: user.team_id,
                adminId: user.admin_id,
                pageSize: 100
            });

            setTransfers(refreshedTransfers || []);

        } catch (err) {
            console.error('Error submitting transfer request:', err);
            setError('Failed to submit transfer request');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle transfer cancellation
    const handleCancelTransfer = async (transferId: string) => {
        if (!user) return;

        try {
            setIsLoading(true);

            const {data,error} = await new Promise<{data:any,error:any}>((resolve, reject) => {
                ClientApi.of("transfer").get()
                    .del_transfer_request({id: transferId})
                    .then(res => {
                        if (res.ok)
                            resolve({error:null,data:true})
                    }).catch(err => {
                    resolve({error:err.message,data:null})
                })
            })

            // const {data, error} = await simCardTransferService.cancelTransferRequest(transferId, user.id);

            if (error) throw error;
            showDialog({
                title: 'Transfer Request Cancelled',
                message: 'Your transfer request has been cancelled.',
                type: 'success'
            });

            // Update transfers list
            setTransfers(prev =>
                prev.map(transfer => transfer.id === transferId ? {
                    ...transfer,
                    status: TransferStatus.CANCELLED
                } : transfer)
            );

        } catch (err) {
            console.error('Error cancelling transfer request:', err);
            setError('Failed to cancel transfer request');
        } finally {
            setIsLoading(false);
        }
    };

    // Filter transfers based on active tab and search term
    const filteredTransfers = transfers.filter(transfer => {
        // Filter by tab
        if (activeTab === 'pending' && transfer.status !== TransferStatus.PENDING) {
            return false;
        }

        // Filter by search term
        if (searchTerm) {
            const destinationTeam = teams.find(team => team.id === transfer.destination_team_id);
            const destinationTeamName = destinationTeam ? destinationTeam.name : '';

            return (
                transfer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                destinationTeamName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return true;
    });

    // Filter unsold SIM cards by search term
    const filteredUnsoldSimCards = unsoldSimCards.filter(sim => {
        if (!searchTerm) return true;
        return sim.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
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

    return (
        <>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">SIM Card Transfers</h1>
                        <p className="text-gray-600">Transfer unsold SIM cards to other teams</p>
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

                    {/* Create Transfer Request */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">Create Transfer Request</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Destination Team
                                    </label>
                                    <select
                                        value={destinationTeamId}
                                        onChange={(e) => setDestinationTeamId(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        disabled={isLoading || teams.length === 0}
                                    >
                                        {teams.length === 0 && (
                                            <option value="">No teams available</option>
                                        )}
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>{team.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason for Transfer
                                    </label>
                                    <input
                                        type="text"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="e.g., Team running low on SIM cards"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Unsold SIM Cards to Transfer
                                </label>
                                <div className="relative mb-4">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
                                    <input
                                        type="text"
                                        placeholder="Search by serial number..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm"
                                    />
                                </div>

                                <div className="border border-gray-200 rounded-md overflow-hidden">
                                    <div className="max-h-60 overflow-y-auto">
                                        {filteredUnsoldSimCards.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">
                                                No unsold SIM cards available
                                            </div>
                                        ) : (
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Select
                                                    </th>
                                                    <th scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Serial Number
                                                    </th>
                                                    <th scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredUnsoldSimCards.map(sim => (
                                                    <tr key={sim.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSimCards.includes(sim.id)}
                                                                onChange={() => handleSimCardSelection(sim.id)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {sim.serial_number}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                    className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {sim.status}
                                </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        {selectedSimCards.length} SIM cards selected
                                    </div>
                                    <button
                                        onClick={handleSubmitTransfer}
                                        disabled={isLoading || selectedSimCards.length === 0 || !destinationTeamId}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin"/>
                        Submitting...
                      </span>
                                        ) : (
                                            <span className="flex items-center">
                        <ArrowLeftRight className="w-4 h-4 mr-2"/>
                        Submit Transfer Request
                      </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transfer Requests List */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Transfer Requests</h2>
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

                        <div className="p-6">
                            {filteredTransfers.length === 0 ? (
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
                              Transfer to {getTeamName(transfer.destination_team_id)}
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

                                                {transfer.status === TransferStatus.PENDING && (
                                                    <button
                                                        onClick={() => handleCancelTransfer(transfer.id)}
                                                        className="mt-2 md:mt-0 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                    >
                            <span className="flex items-center">
                              <X className="w-4 h-4 mr-1"/>
                              Cancel
                            </span>
                                                    </button>
                                                )}

                                                {transfer.status === TransferStatus.APPROVED && (
                                                    <div className="mt-2 md:mt-0 flex items-center text-green-600">
                                                        <Check className="w-4 h-4 mr-1"/>
                                                        <span>Approved</span>
                                                    </div>
                                                )}

                                                {transfer.status === TransferStatus.REJECTED && (
                                                    <div className="mt-2 md:mt-0 flex items-center text-red-600">
                                                        <X className="w-4 h-4 mr-1"/>
                                                        <span>Rejected</span>
                                                        {transfer.notes && (
                                                            <span className="ml-2 text-xs text-gray-500">
                                Reason: {transfer.notes}
                              </span>
                                                        )}
                                                    </div>
                                                )}

                                                {transfer.status === TransferStatus.CANCELLED && (
                                                    <div className="mt-2 md:mt-0 flex items-center text-gray-600">
                                                        <X className="w-4 h-4 mr-1"/>
                                                        <span>Cancelled</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TransfersPage;
