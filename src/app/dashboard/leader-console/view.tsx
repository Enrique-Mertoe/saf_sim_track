"use client"
import React, {useEffect, useMemo, useState} from 'react';
import {
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Filter,
    Loader2,
    Package,
    Search,
    UserPlus,
    Users,
    XCircle
} from 'lucide-react';
import {createSupabaseClient} from "@/lib/supabase/client";
import {SIMCard, User, UserRole} from "@/models";
import alert from "@/ui/alert";
import useApp from "@/ui/provider/AppProvider";
import {now} from "@/helper";
import {useDialog} from "@/app/_providers/dialog";
import MaterialSelect from "@/ui/components/MaterialSelect";

// Enums
const SIMStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    PENDING: "PENDING",
    SOLD: "SOLD",
};

const supabase = createSupabaseClient();

const SimManagementPage = () => {
    const {user} = useApp();
    const [simCards, setSimCards] = useState<SIMCard[]>([]);
    const [staffMembers, setStaffMembers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSims, setSelectedSims] = useState<string[]>([]);
    const [expandedMembers, setExpandedMembers] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedMember, setSelectedMember] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all'); // all, sold, unsold
    const [isLoading, setIsLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);
    const [rangeSelection, setRangeSelection] = useState({
        start: "",
        end: ""
    });

    const dialog = useDialog()

    const itemsPerPage = 50;

    // Load data on initial render
    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    // Fetch all data
    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Fetch staff members
            const {data: staffData, error: staffError} = await supabase
                .from('users')
                .select('*')
                .eq('role', UserRole.STAFF)
                .eq('team_id', user.team_id);

            if (staffError) throw staffError;
            setStaffMembers(staffData || []);

            // Fetch all SIM cards
            const {data: simData, error: simError} = await supabase
                .from('sim_cards')
                .select('*');

            if (simError) throw simError;
            setSimCards(simData || []);

        } catch (error) {
            console.error("Error fetching data:", error);
            alert.error("Failed to load data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate stats
    const stats = useMemo(() => {
        const assigned = simCards.filter(sim => sim.assigned_to_user_id !== null);
        const unassigned = simCards.filter(sim => sim.assigned_to_user_id === null);
        const sold = simCards.filter(sim => sim.status === SIMStatus.SOLD);

        return {
            total: simCards.length,
            assigned: assigned.length,
            unassigned: unassigned.length,
            sold: sold.length
        };
    }, [simCards]);

    // Group assigned SIMs by team member
    const assignedByMember = useMemo(() => {
        const grouped = {};
        const assignedSims = simCards.filter(sim => sim.assigned_to_user_id !== null);

        // Group by staff member
        assignedSims.forEach(sim => {
            const staffMember = staffMembers.find(staff => staff.id === sim.assigned_to_user_id);
            const memberName = staffMember ? `${staffMember.full_name}` : 'Unknown';
//@ts-ignore
            if (!grouped[sim.assigned_to_user_id]) {
                //@ts-ignore
                grouped[sim.assigned_to_user_id] = {
                    name: memberName,
                    total: 0,
                    sold: 0,
                    sims: []
                };
            }
            //@ts-ignore
            grouped[sim.assigned_to_user_id].total++;
            //@ts-ignore
            if (sim.status === SIMStatus.SOLD) grouped[sim.assigned_to_user_id].sold++;
            //@ts-ignore
            grouped[sim.assigned_to_user_id].sims.push(sim);
        });

        return grouped;
    }, [simCards, staffMembers]);

    // Filter unassigned SIMs
    const filteredUnassigned = useMemo(() => {
        return simCards
            .filter(sim => sim.assigned_to_user_id === null)
            .filter(sim => sim.serial_number.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [simCards, searchTerm]);

    // Paginate unassigned SIMs
    const paginatedUnassigned = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredUnassigned.slice(start, start + itemsPerPage);
    }, [filteredUnassigned, currentPage]);

    const totalPages = Math.ceil(filteredUnassigned.length / itemsPerPage);

    // Filter assigned SIMs for expanded view
    //@ts-ignore
    const getFilteredAssignedSims = (sims) => {
        if (filterStatus === 'all') return sims;
        //@ts-ignore
        if (filterStatus === 'sold') return sims.filter(sim => sim.status === SIMStatus.SOLD);
        //@ts-ignore
        return sims.filter(sim => sim.status !== SIMStatus.SOLD);
    };

    const handleSelectSim = (simId: string) => {
        if (selectedSims.includes(simId)) {
            setSelectedSims(selectedSims.filter(id => id !== simId));
        } else {
            setSelectedSims([...selectedSims, simId]);
        }
    };

    const handleSelectRange = (startIndex: number, endIndex: number) => {
        const newSelected = [...selectedSims];
        for (let i = startIndex; i <= endIndex; i++) {
            if (paginatedUnassigned[i] && !newSelected.includes(paginatedUnassigned[i].id)) {
                newSelected.push(paginatedUnassigned[i].id);
            }
        }
        setSelectedSims(newSelected);
    };

    // Select SIMs by range
    const selectSimsByRange = () => {
        if (!rangeSelection.start || !rangeSelection.end) {
            alert.info("Please enter both start and end serial numbers");
            return;
        }

        const matchingSims = simCards
            .filter(sim =>
                sim.assigned_to_user_id === null &&
                sim.serial_number >= rangeSelection.start &&
                sim.serial_number <= rangeSelection.end
            )
            .map(sim => sim.id);

        setSelectedSims([...new Set([...selectedSims, ...matchingSims])]);
        setRangeSelection({start: "", end: ""});
    };

    // Select all SIMs matching the search query
    const selectSimsBySearch = () => {
        if (!searchTerm.trim()) {
            alert.info("Please enter a search term first");
            return;
        }

        const matchingSims = filteredUnassigned.map(sim => sim.id);
        setSelectedSims([...new Set([...selectedSims, ...matchingSims])]);
    };

    const handleAssign = async () => {
        if (!selectedMember || selectedSims.length === 0) {
            alert.info("Please select both staff member and SIM cards");
            return;
        }

        setIsAssigning(true);
        try {
            const {error} = await supabase
                .from('sim_cards')
                .update({
                    sold_by_user_id: selectedMember,
                    assigned_on: now()
                })
                .in('id', selectedSims);

            if (error) throw error;

            alert.success(`Successfully assigned ${selectedSims.length} SIM cards`);
            setSelectedSims([]);
            setSelectedMember('');
            setShowAssignModal(false);
            fetchData(); // Refresh data
        } catch (error) {
            console.error("Error assigning SIMs:", error);
            alert.error("Failed to assign SIM cards. Please try again.");
        } finally {
            setIsAssigning(false);
        }
    };

    const toggleMemberExpansion = (memberId: string) => {
        const newExpanded = new Set(expandedMembers);
        if (newExpanded.has(memberId)) {
            newExpanded.delete(memberId);
        } else {
            newExpanded.add(memberId);
        }
        setExpandedMembers(newExpanded);
    };

    const clearSelections = () => {
        setSelectedSims([]);
        setRangeSelection({start: "", end: ""});
        setSearchTerm("");
    };

    function showDialog() {
        const d = dialog.create({
            content: <>
                <div className="bg-white rounded-lg p-6 w-full">
                    <h3 className="text-lg font-semibold mb-4">Assign SIMs to Team Member</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        You're about to assign {selectedSims.length} SIM cards.
                    </p>
                    <MaterialSelect
                        className={"mb-4"}
                        options={staffMembers}
                        valueKey={"id"}
                        displayKey={"full_name"}
                        onChange={v => setSelectedMember(v)}
                    />
                    <div className="flex space-x-3">
                        <button
                            onClick={() => {
                                d.dismiss()
                                setSelectedMember('');
                            }}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            disabled={isAssigning}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={!selectedMember || isAssigning}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                        >
                            {isAssigning ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                    Assigning...
                                </>
                            ) : (
                                'Assign SIMs'
                            )}
                        </button>
                    </div>
                </div>
            </>

        })
    }


    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600"/>
                    <span className="text-gray-600">Loading SIM data...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">SIM Card Management</h1>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center">
                                <Package className="h-8 w-8 text-green-600"/>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-600">Total SIMs</p>
                                    <p className="text-2xl font-bold text-green-900">{stats.total}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center">
                                <Users className="h-8 w-8 text-green-600"/>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-600">Assigned</p>
                                    <p className="text-2xl font-bold text-green-900">{stats.assigned}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-orange-50 rounded-lg p-4">
                            <div className="flex items-center">
                                <Package className="h-8 w-8 text-orange-600"/>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-orange-600">Unassigned</p>
                                    <p className="text-2xl font-bold text-orange-900">{stats.unassigned}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center">
                                <CheckCircle className="h-8 w-8 text-purple-600"/>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-purple-600">Sold</p>
                                    <p className="text-2xl font-bold text-purple-900">{stats.sold}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Assigned SIMs */}
                    <div className="bg-white sticky top-0 rounded-lg shadow-sm">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Assigned SIMs</h2>
                                <div className="flex items-center space-x-2">
                                    <Filter className="h-4 w-4 text-gray-500"/>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="text-sm border border-gray-300 rounded px-2 py-1"
                                    >
                                        <option value="all">All</option>
                                        <option value="sold">Sold Only</option>
                                        <option value="unsold">Unsold Only</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {Object.entries(assignedByMember).length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300"/>
                                    <p>No SIMs assigned yet</p>
                                </div>
                            ) : (
                                Object.entries(assignedByMember).map(([memberId, data]: any) => (
                                    <div key={memberId} className="border-b border-gray-100 last:border-b-0">
                                        <div
                                            className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                                            onClick={() => toggleMemberExpansion(memberId)}
                                        >
                                            <div className="flex items-center">
                                                {expandedMembers.has(memberId) ?
                                                    <ChevronDown className="h-4 w-4 text-gray-500"/> :
                                                    <ChevronRight className="h-4 w-4 text-gray-500"/>
                                                }
                                                <div className="ml-2">
                                                    <p className="font-medium text-gray-900">{data.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {data.total} total • {data.sold} sold
                                                        • {data.total - data.sold} unsold
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {data.total}
                        </span>
                                                <span
                                                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {data.sold}
                        </span>
                                            </div>
                                        </div>

                                        {expandedMembers.has(memberId) && (
                                            <div className="px-4 pb-4">
                                                <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                                                    {getFilteredAssignedSims(data.sims).map((sim: any) => (
                                                        <div key={sim.id}
                                                             className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-sm">
                                                            <span className="font-mono">{sim.serial_number}</span>
                                                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">
                                  {sim.assigned_on ? new Date(sim.assigned_on).toLocaleDateString() : 'N/A'}
                                </span>
                                                                {sim.status === SIMStatus.SOLD ?
                                                                    <CheckCircle className="h-4 w-4 text-green-500"/> :
                                                                    <XCircle className="h-4 w-4 text-gray-400"/>
                                                                }
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Unassigned SIMs */}
                    <div className="bg-white rounded-lg shadow-sm">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Unassigned SIMs</h2>
                                {selectedSims.length > 0 && (
                                    <button
                                        onClick={() => showDialog()}
                                        className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <UserPlus className="h-4 w-4 mr-1"/>
                                        Assign ({selectedSims.length})
                                    </button>
                                )}
                            </div>

                            <div className="mt-3 space-y-2">
                                <div className="flex space-x-2">
                                    <div className="relative flex-1">
                                        <Search
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                        <input
                                            type="text"
                                            placeholder="Search SIM serials..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                    <button
                                        onClick={selectSimsBySearch}
                                        className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                    >
                                        Select All
                                    </button>
                                </div>

                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Start serial"
                                        value={rangeSelection.start}
                                        onChange={(e) => setRangeSelection(prev => ({...prev, start: e.target.value}))}
                                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="End serial"
                                        value={rangeSelection.end}
                                        onChange={(e) => setRangeSelection(prev => ({...prev, end: e.target.value}))}
                                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                                    />
                                    <button
                                        onClick={selectSimsByRange}
                                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                                    >
                                        Range
                                    </button>
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleSelectRange(0, Math.min(9, paginatedUnassigned.length - 1))}
                                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    >
                                        Select 10
                                    </button>
                                    <button
                                        onClick={clearSelections}
                                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {paginatedUnassigned.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-300"/>
                                    <p>No unassigned SIMs found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-1 p-4">
                                    {paginatedUnassigned.map((sim, index) => (
                                        <div
                                            key={sim.id}
                                            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                                selectedSims.includes(sim.id)
                                                    ? 'bg-green-100 border border-green-300'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => handleSelectSim(sim.id)}
                                        >
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSims.includes(sim.id)}
                                                    onChange={() => {
                                                    }}
                                                    className="mr-3 h-4 w-4 text-green-600 rounded"
                                                />
                                                <span className="font-mono text-sm">{sim.serial_number}</span>
                                            </div>
                                            <span
                                                className="text-xs text-gray-500">#{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUnassigned.length)} of {filteredUnassigned.length}
                                </p>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                                    >
                                        Prev
                                    </button>
                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                        const page = i + Math.max(1, currentPage - 2);
                                        if (page > totalPages) return null;
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 py-1 text-sm rounded ${
                                                    currentPage === page
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimManagementPage;