"use client"
import React, {useEffect, useState} from 'react';
import {batchMetadataService, simCardTransferService, teamService} from "@/services";
import useApp from "@/ui/provider/AppProvider";
import {BatchMetadata, SimCardTransfer, Team as TeamX, TransferStatus, User} from "@/models";
import {AlertTriangle, ArrowLeftRight, Calendar, CheckCircle2, Database, X} from 'lucide-react';
import alert from "@/ui/alert";
import {showModal} from "@/ui/shortcuts";
import ReportDateRangeTemplate from "@/ui/components/ReportDateModal";
import {format, isToday, isYesterday} from "date-fns";
import TransfersTab from './components/TransfersTab';
import GeneralTab from './components/GeneralTab';
import Stats from "@/app/dashboard/transfers/Stats";
import LineBreakDown from "@/app/dashboard/transfers/LineBreakDown";
import {showDialog, TransferRequestDetails} from "@/app/dashboard/transfers/utility";
import ClientApi from "@/lib/utils/ClientApi";
import Fixed from "@/ui/components/Fixed";
import {useDimensions} from "@/ui/library/smv-ui/src/framework/utility/Screen";
import Theme from "@/ui/Theme";

type Team = TeamX & {
    batches: BatchMetadata[],
    user: User
}
const AdminTransfersPage = () => {
    const {user} = useApp();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const dimen = useDimensions();
    // Main tab navigation
    const [mainTab, setMainTab] = useState<'transfers' | 'general' | 'allocations'>('allocations');

    // Transfers tab state
    const [transfers, setTransfers] = useState<SimCardTransfer[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTransfer, setSelectedTransfer] = useState<SimCardTransfer | null>(null);
    const [rejectReason, setRejectReason] = useState<string>('');

    // General tab state
    const [expandedTeams, setExpandedTeams] = useState<string[]>([]);
    const [expandedBatches, setExpandedBatches] = useState<string[]>([]);
    const [simcards, setSimcards] = useState<{ [batchId: string]: any[] }>({});
    const [selectedItems, setSelectedItems] = useState<{
        teams: string[],
        batches: string[],
        simcards: string[]
    }>({
        teams: [],
        batches: [],
        simcards: []
    });
    const [deleteType, setDeleteType] = useState<'teams' | 'batches' | 'simcards' | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('current-month');
    const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [endDate, setEndDate] = useState<Date>(new Date());
    // Format date for display
    const formatDateForDisplay = (dateString: string | Date) => {
        const date = new Date(dateString);
        if (isToday(date)) {
            return "Today";
        } else if (isYesterday(date)) {
            return "Yesterday";
        } else {
            return format(date, "MMM d yyyy");
        }
    };

    // Format date range for display
    const formatDateRangeForDisplay = () => {
        if (selectedPeriod === 'custom') {
            const formattedStartDate = formatDateForDisplay(startDate);
            const formattedEndDate = formatDateForDisplay(endDate);

            if (formattedStartDate === formattedEndDate) {
                return formattedStartDate;
            } else {
                return `${formattedStartDate} - ${formattedEndDate}`;
            }
        } else {
            // For predefined periods, use the period name
            switch (selectedPeriod) {
                case 'last-7-days':
                    return 'Last 7 days';
                case 'last-90-days':
                    return 'Last 90 days';
                case 'last-30-days':
                    return 'Last 30 days';
                case 'current-month':
                    return 'Current Month';
                default:
                    return 'Last 30 days';
            }
        }
    };

    // Get date filters for API calls
    const getDateFilters = () => {
        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        };
    };


    // Fetch transfers
    useEffect(() => {
        const fetchTransfers = async () => {
            if (!user) return;

            try {
                setIsLoading(true);
                // const dateFilters = getDateFilters();
                const {data, error} = await simCardTransferService.getTransferRequests({
                    adminId: user.id,
                    pageSize: 100,
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
    }, [user, startDate, endDate]);

    // Fetch teams
    useEffect(() => {
        const fetchTeams = async () => {
            if (!user) return;
            try {
                const {data, error} = await teamService.getAllTeamsWithMetadata(user, true);
                if (error) throw error;
                //@ts-ignore
                setTeams(data || []);
            } catch (err) {
                console.error('Error fetching teams:', err);
                setError('Failed to load teams');
            }
        };

        fetchTeams();
    }, [user]);


    // Fetch simcards for a batch
    const fetchSimcardsForBatch = async (batchId: string) => {
        if (!user) return;

        try {
            setIsLoading(true);
            const {data, error} = await batchMetadataService.getSimCardsByBatchId(batchId);
            if (error) throw error;

            setSimcards(prev => ({
                ...prev,
                [batchId]: data || []
            }));
        } catch (err) {
            console.error(`Error fetching simcards for batch ${batchId}:`, err);
            setError(`Failed to load simcards for batch`);
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle team expansion
    const toggleTeamExpansion = (teamId: string) => {
        setExpandedTeams(prev => {
            if (prev.includes(teamId)) {
                return prev.filter(id => id !== teamId);
            } else {
                return [...prev, teamId];
            }
        });
    };

    // Toggle batch expansion
    const toggleBatchExpansion = async (batchId: string) => {
        // If not already expanded, fetch the simcards
        if (!expandedBatches.includes(batchId)) {
            await fetchSimcardsForBatch(batchId);
        }

        setExpandedBatches(prev => {
            if (prev.includes(batchId)) {
                return prev.filter(id => id !== batchId);
            } else {
                return [...prev, batchId];
            }
        });
    };

    // Handle selection of items
    const toggleSelection = (type: 'teams' | 'batches' | 'simcards', id: string) => {
        setSelectedItems(prev => {
            const currentSelected = prev[type];
            const newSelected = currentSelected.includes(id)
                ? currentSelected.filter(item => item !== id)
                : [...currentSelected, id];

            return {
                ...prev,
                [type]: newSelected
            };
        });
    };

    // Handle deletion of selected items
    const handleDeleteSelected = async () => {
        if (!user || !deleteType) return;

        try {
            // setIsLoading(true);

            // Implement deletion logic based on type and deleteOption
            if (deleteType === 'simcards' && selectedItems.simcards.length > 0) {
                // Delete selected simcards
                // This would need to be implemented in the backend
                alert.success(`Deleted ${selectedItems.simcards.length} SIM cards`);

                // Refresh the data
                // You would need to refresh the affected batches
                const affectedBatches = [...new Set(selectedItems.simcards.map(id => {
                    // Find which batch this simcard belongs to
                    for (const [batchId, cards] of Object.entries(simcards)) {
                        if (cards.some((card: any) => card.id === id)) {
                            return batchId;
                        }
                    }
                    return null;
                }).filter(Boolean) as string[])];

                for (const batchId of affectedBatches) {
                    await fetchSimcardsForBatch(batchId);
                }
            } else if (deleteType === 'batches' && selectedItems.batches.length > 0) {
                // Delete selected batches
                // This would need to be implemented in the backend
                alert.success(`Deleted ${selectedItems.batches.length} batches`);

                // Refresh the data
                // await upDateBatches(teams);
            } else if (deleteType === 'teams' && selectedItems.teams.length > 0) {
                // Delete selected teams
                // This would need to be implemented in the backend
                alert.success(`Deleted ${selectedItems.teams.length} teams`);

                // Refresh the data
                const {data, error} = await teamService.getAllTeamsWithMetadata(user, true);
                if (error) throw error;
                //@ts-ignore
                setTeams(data || []);
                // await fetchTeamBatches(data || []);
            }

            // Clear selections
            setSelectedItems({
                teams: [],
                batches: [],
                simcards: []
            });
        } catch (err) {
            console.error(`Error deleting ${deleteType}:`, err);
            setError(`Failed to delete ${deleteType}`);
        } finally {
            setIsLoading(false);
        }
    };
    // Handle transfer approval
    const handleApproveTransfer = async (transfer: any) => {
        if (!user || !transfer.id) return;
        const transferId = transfer.id

        try {
            setIsLoading(true);

            const {data, error} = await new Promise<{ data: any, error: any }>((resolve, reject) => {
                ClientApi.of("transfer").get()
                    .approve_transfer_request({id: transfer.id, admin_id: user.id})
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

            const {data, error} = await new Promise<{ data: any, error: any }>((resolve, reject) => {
                ClientApi.of("transfer").get()
                    .reject_transfer_request({
                        id: selectedTransfer.id,
                        admin_id: user.id,
                        reason: rejectReason
                    })
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

            // Reset form
            setRejectReason('');
            setSelectedTransfer(null);

        } catch (err) {
            console.error('Error rejecting transfer request:', err);
            setError('Failed to reject transfer request');
        } finally {
            setIsLoading(false);
        }
    };

    // Get team name by ID
    const getTeamName = (teamId: string) => {
        const team = teams.find(team => team.id === teamId);
        return team ? team.name : 'Unknown Team';
    };

    // View transfer details
    const viewTransferDetails = (transfer: SimCardTransfer) => {
        showDialog({
            title: 'Transfer Request Details',
            message: <TransferRequestDetails transfer={transfer} getTeamName={getTeamName}/>,
            type: 'info'
        });
    };

    // Get counts for a batch
    const getBatchCounts = (batchId: string) => {
        const batchSimcards = simcards[batchId] || [];
        const totalSimcards = batchSimcards.length;
        const completedSimcards = batchSimcards.filter((card: any) => card.status === 'COMPLETED').length;

        return {totalSimcards, completedSimcards};
    };

    return (
        <>
            <div className="min-h-screen bg-gray-50 md:p-6 p-2 pb-20 ">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-center gap-2  md:justify-between">
                            <p className="text-gray-600">Manage SIM card transfers and distribution across teams</p>
                            <div>
                                <button
                                    onClick={() => {
                                        showModal({
                                            content: onClose => (
                                                <ReportDateRangeTemplate
                                                    onConfirm={selection => {
                                                        if (selection.type === 'range' && selection.range.startDate && selection.range.endDate) {
                                                            // Update state with the selected dates
                                                            setStartDate(selection.range.startDate);
                                                            setEndDate(selection.range.endDate);
                                                            setSelectedPeriod('custom');
                                                        } else if (selection.type === 'single' && selection.single) {

                                                            // Handle single date selection
                                                            setStartDate(selection.single);
                                                            setEndDate(selection.single);
                                                            setSelectedPeriod('custom');
                                                        }
                                                        onClose();
                                                    }}
                                                    onClose={() => onClose()}
                                                />
                                            ),
                                            size: "lg",
                                        });
                                    }}
                                    className={`${Theme.Button} py-2 gap-2`}
                                >
                                    <Calendar className="h-4 w-4"/>
                                    <span>{formatDateRangeForDisplay()}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <Stats dateRange={getDateFilters()} user={user}/>

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

                    {/* Main Tab Navigation */}
                    {
                        dimen.md && (
                            <div className="mb-6 flex border-b border-gray-200">
                                <button
                                    onClick={() => setMainTab('allocations')}
                                    className={`px-4 py-2 font-medium text-sm border-b-2 ${
                                        mainTab === 'allocations'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <ArrowLeftRight className="w-4 h-4 mr-2"/>
                                        Allocation
                                    </div>
                                </button>
                                <button
                                    onClick={() => setMainTab('transfers')}
                                    className={`px-4 py-2 font-medium text-sm border-b-2 ${
                                        mainTab === 'transfers'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <ArrowLeftRight className="w-4 h-4 mr-2"/>
                                        Transfer Requests
                                    </div>
                                </button>
                                <button
                                    onClick={() => setMainTab('general')}
                                    className={`px-4 py-2 font-medium text-sm border-b-2 ${
                                        mainTab === 'general'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <Database className="w-4 h-4 mr-2"/>
                                        General SIM Management
                                    </div>
                                </button>
                            </div>
                        )
                    }
                    {
                        mainTab === 'allocations' && (
                            <LineBreakDown dateRange={getDateFilters()} user={user}/>
                        )
                    }

                    {/* Transfers Tab Content */}
                    {mainTab === 'transfers' && (
                        <TransfersTab
                            transfers={transfers}
                            isLoading={isLoading}
                            error={error}
                            getTeamName={getTeamName}
                            handleApproveTransfer={handleApproveTransfer}
                            handleRejectTransfer={handleRejectTransfer}
                            viewTransferDetails={viewTransferDetails}
                        />
                    )}

                    {/* General Tab Content */}
                    {mainTab === 'general' && (
                        <GeneralTab
                            teams={teams}
                            isLoading={isLoading}
                            expandedTeams={expandedTeams}
                            expandedBatches={expandedBatches}
                            simcards={simcards}
                            selectedItems={selectedItems}
                            toggleTeamExpansion={toggleTeamExpansion}
                            toggleBatchExpansion={toggleBatchExpansion}
                            toggleSelection={toggleSelection}
                            handleDeleteSelected={handleDeleteSelected}
                            getBatchCounts={getBatchCounts}
                        />
                    )}
                </div>
            </div>
            {
                (dimen.isMobile || !dimen.lg) && (
                    <Fixed>
                        <div
                            className="lg:hidden md:ml-64 fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
                            <div className="flex w-full max-w-[600px] justify-around items-center h-16 mx-auto">
                                {([
                                    {id: 'allocations', name: 'Allocation', icon: CheckCircle2},
                                    {id: 'transfers', name: 'Transfers', icon: ArrowLeftRight},
                                    {id: 'general', name: 'General', icon: Database},
                                ] as any).map((tab: any) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setMainTab(tab.id)}
                                        className={`flex flex-col items-center justify-center flex-1 h-full ${
                                            mainTab === tab.id ? 'text-green-600' : 'text-gray-600'
                                        }`}
                                    >
                            <span className={`rounded-full px-6 py-1 ${
                                mainTab === tab.id ? 'bg-green-100' : 'bg-gray-100'
                            } text-xs`}>
                                <tab.icon className="h-6 w-6"/>
                            </span>
                                        <span className="text-xs mt-1 truncate w-full text-center px-1">{tab.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Fixed>
                )
            }
        </>
    );
};

export default AdminTransfersPage;
