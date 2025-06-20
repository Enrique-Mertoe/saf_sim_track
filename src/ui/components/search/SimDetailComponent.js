import React, {useEffect, useState} from 'react';
import {
    Archive,
    Box,
    Building2,
    Calendar,
    DollarSign,
    ExternalLink,
    Eye,
    Loader2,
    Smartphone,
    UserCheck,
    UserPlus,
    UserX,
    X
} from 'lucide-react';
import SimController from "@/controllers/SimController";
import UserController from "@/controllers/UserController";
import TeamController from "@/controllers/TeamController";
import BatchController from "@/controllers/BatchController";

// Mock data loading functions
const loadSIMDetails = async (simId) => SimController.byId(simId);

const loadUserDetails = async (userId) => UserController.byId(userId);

const loadTeamDetails = async (teamId) => TeamController.byId(teamId);

const loadBatchDetails = async (batchId) => BatchController.byBatchId(batchId);

const loadLotDetails = async (lotNumber) => {
    // await new Promise(resolve => setTimeout(resolve, 500));
    // return {
    //     lot_number: lotNumber,
    //     quantity: 50,
    //     batch_id: "BATCH_2024_001",
    //     position_in_batch: 1,
    //     status: "DISTRIBUTED",
    //     assigned_sims: 45,
    //     sold_sims: 42,
    //     activated_sims: 38
    // };
    if (!lotNumber)
        return null;

    return await SimController.lotDetails(lotNumber);
};

const loadAssignedUser = async (userId) => UserController.byId(userId);

const loadBatchSIMs = async (batchId) => {
    // await new Promise(resolve => setTimeout(resolve, 1200));
    // return [
    //     {id: "sim-1", serial_number: "89254021374259301001", status: "ACTIVATED", lot: "LOT_A_001"},
    //     {id: "sim-2", serial_number: "89254021374259301002", status: "PENDING", lot: "LOT_A_001"},
    //     {id: "sim-3", serial_number: "89254021374259301003", status: "ACTIVATED", lot: "LOT_A_002"},
    //     {id: "sim-4", serial_number: "89254021374259301004", status: "ACTIVATED", lot: "LOT_A_001"},
    //     {id: "sim-5", serial_number: "89254021374259301005", status: "INACTIVE", lot: "LOT_A_003"}
    // ];
    return await SimController.byBatch(batchId);
};

const loadLotSIMs = async (lotNumber) => {
    await new Promise(resolve => setTimeout(resolve, 900));
    return [
        {id: "sim-1", serial_number: "89254021374259301001", status: "ACTIVATED"},
        {id: "sim-2", serial_number: "89254021374259301002", status: "PENDING"},
        {id: "sim-4", serial_number: "89254021374259301004", status: "ACTIVATED"},
        {id: "sim-6", serial_number: "89254021374259301006", status: "ACTIVATED"},
        {id: "sim-7", serial_number: "89254021374259301007", status: "INACTIVE"}
    ];
};

// Helper components
const LoadingSpinner = ({size = 20}) => (
    <Loader2 size={size} className="animate-spin text-blue-500"/>
);

const StatusBadge = ({status, type = "default"}) => {
    const variants = {
        success: "bg-green-100 text-green-800 border-green-200",
        warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
        error: "bg-red-100 text-red-800 border-red-200",
        info: "bg-blue-100 text-blue-800 border-blue-200",
        default: "bg-gray-100 text-gray-800 border-gray-200"
    };

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${variants[type]}`}>
      {status}
    </span>
    );
};

// SIM Cards List Modal Component
const SIMsListModal = ({title, sims, onClose}) => {
    const getStatusColor = (status) => {
        const colors = {
            'ACTIVATED': 'success',
            'PENDING': 'warning',
            'INACTIVE': 'error'
        };
        return colors[status] || 'default';
    };

    return (
        <div className="fixed inset-0 bg-white/80 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-smv max-w-2xl w-full max-h-[80vh] overflow-hidden mx-4">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X size={16}/>
                    </button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                        {sims.items.map((sim, index) => (
                            <div key={sim.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="font-mono text-sm font-medium">{sim.serial_number}</div>
                                    {sim.lot && <div className="text-xs text-gray-500">Lot: {sim.lot}</div>}
                                </div>
                                <StatusBadge status={sim.status} type={getStatusColor(sim.status)}/>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 flex flex-col items-center border-t border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-600">
                        Showing {sims.limit} of {sims.total} SIM cards
                    </div>
                </div>
            </div>
        </div>
    );
};

// Enhanced SIM Detail Component
const SIMDetailComponent = ({simId}) => {
    const [sim, setSim] = useState(null);
    const [soldBy, setSoldBy] = useState(undefined);
    const [team, setTeam] = useState(null);
    const [batch, setBatch] = useState(null);
    const [lot, setLot] = useState(null);
    const [assignedUser, setAssignedUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showBatchSIMs, setShowBatchSIMs] = useState(false);
    const [showLotSIMs, setShowLotSIMs] = useState(false);
    const [batchSIMs, setBatchSIMs] = useState([]);
    const [lotSIMs, setLotSIMs] = useState([]);
    const [loadingBatchSIMs, setLoadingBatchSIMs] = useState(false);
    const [loadingLotSIMs, setLoadingLotSIMs] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const simData = await loadSIMDetails(simId);
            setSim(simData);
            setLoading(false);

            // Load related data
            loadUserDetails(simData.sold_by_user_id).then(setSoldBy);
            loadTeamDetails(simData.team_id).then(setTeam);
            loadBatchDetails(simData.batch_id).then(setBatch);
            //@ts-ignore
            loadLotDetails(simData.lot).then(setLot);

            if (simData.assigned_to_user_id) {
                loadAssignedUser(simData.assigned_to_user_id).then(setAssignedUser);
            }
        };
        loadData();
    }, [simId]);

    const handleViewBatchSIMs = async () => {
        setLoadingBatchSIMs(true);
        const sims = await loadBatchSIMs(sim.batch_id);
        setBatchSIMs(sims);
        setLoadingBatchSIMs(false);
        setShowBatchSIMs(true);
    };

    const handleViewLotSIMs = async () => {
        setLoadingLotSIMs(true);
        const sims = await loadLotSIMs(sim.lot);
        setLotSIMs(sims);
        setLoadingLotSIMs(false);
        setShowLotSIMs(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <LoadingSpinner size={32}/>
                    <p className="text-gray-500 mt-3">Loading SIM details...</p>
                </div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        const colors = {
            'ACTIVATED': 'text-green-600 bg-green-100',
            'PENDING': 'text-yellow-600 bg-yellow-100',
            'INACTIVE': 'text-red-600 bg-red-100',
            'MATCHED': 'text-blue-600 bg-blue-100',
            'QUALITY': 'text-purple-600 bg-purple-100'
        };
        return colors[status] || 'text-gray-600 bg-gray-100';
    };
    const getMatchDisplay = (status) => {
        const colors = {
            'Y': 'MATCHED',
            'N': 'UNMATCH',
        };
        return colors[status] || 'No';
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start space-x-4">
                    <div
                        className="w-10 text-white h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                             className="lucide lucide-card-sim-icon lucide-card-sim">
                            <path d="M12 14v4"/>
                            <path
                                d="M14.172 2a2 2 0 0 1 1.414.586l3.828 3.828A2 2 0 0 1 20 7.828V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
                            <path d="M8 14h8"/>
                            <rect x="8" y="10" width="8" height="8" rx="1"/>
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                            SIM #{sim.serial_number.slice(-6)}
                        </h3>
                        <p className="text-gray-500 font-mono text-sm">{sim.serial_number}</p>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(sim.status)}`}>
                           {sim.status}
                          </span>
                            <span
                                className={`px-3 py-1 capitalize text-xs font-medium rounded-full ${getStatusColor(sim.match)}`}>
                                {getMatchDisplay(sim.match)}
                          </span>
                            <span
                                className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(sim.quality)}`}>
                                {sim.quality}
                              </span>
                        </div>
                    </div>
                </div>

                {/* Assignment Information */}
                {sim.assigned_to_user_id && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <div className="flex items-center space-x-2 mb-3">
                            <UserPlus size={16} className="text-blue-600"/>
                            <span className="text-sm font-medium text-blue-900">Assignment Information</span>
                        </div>
                        {assignedUser ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <UserCheck size={16} className="text-blue-600"/>
                                    </div>
                                    <div>
                                        <div className="font-medium text-blue-900">{assignedUser.full_name}</div>
                                        <div
                                            className="text-sm text-blue-700">{assignedUser.role.replace('_', ' ')}</div>
                                        <div className="text-sm text-blue-600">{assignedUser.phone_number}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-blue-700">Assigned on</div>
                                    <div className="text-sm font-medium text-blue-900">
                                        {new Date(sim.assigned_on).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <LoadingSpinner size={16}/>
                                <span className="text-blue-600">Loading assignment details...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Batch and Lot Information */}
                <div className="flex gap-2">
                    {/* Batch Information */}
                    <div className="border flex-1 border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                                <Archive size={16} className="text-gray-500"/>
                                <span className="text-sm font-medium text-gray-700">Batch Information</span>
                            </div>
                            {batch && (
                                <button
                                    onClick={handleViewBatchSIMs}
                                    disabled={loadingBatchSIMs}
                                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                                >
                                    {loadingBatchSIMs ? (
                                        <LoadingSpinner size={12}/>
                                    ) : (
                                        <>
                                            <Eye size={12}/>
                                            <span>View All</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        {batch ? (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Batch ID:</span>
                                    <span className="font-medium font-mono">{batch.batch_id}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Total Quantity:</span>
                                    <span
                                        className="font-medium text-blue-600">{batch.quantity.toLocaleString()} SIMs</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Order Number:</span>
                                    <span className="font-medium">{batch.order_number}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Created:</span>
                                    <span
                                        className="font-medium">{new Date(batch.date_created).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Collection Point:</span>
                                    <span className="font-medium">{batch.collection_point}</span>
                                </div>
                                <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                                    <div className="font-medium text-gray-700 mb-1">Lots in Batch:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {batch.lot_numbers.map(lot => (
                                            <span key={lot} className="px-2 py-1 bg-white border rounded text-gray-600">
                              {lot}
                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <LoadingSpinner size={16}/>
                                <span className="text-gray-500">Loading batch details...</span>
                            </div>
                        )}
                    </div>

                    {
                        lot && (
                            <>
                                {/* Lot/Box Information */}
                                <div className="border flex-1 border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <Box size={16} className="text-gray-500"/>
                                            <span className="text-sm font-medium text-gray-700">Lot/Box Information</span>
                                        </div>
                                        {lot && (
                                            <button
                                                onClick={handleViewLotSIMs}
                                                disabled={loadingLotSIMs}
                                                className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-xs font-medium"
                                            >
                                                {loadingLotSIMs ? (
                                                    <LoadingSpinner size={12}/>
                                                ) : (
                                                    <>
                                                        <Eye size={12}/>
                                                        <span>View All</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    {lot ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Lot Number:</span>
                                                <span className="font-medium font-mono">{lot.lot_number}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Box Quantity:</span>
                                                <span className="font-medium text-green-600">{lot.quantity} SIMs</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Position:</span>
                                                <span className="font-medium">#{lot.position_in_batch} in batch</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Status:</span>
                                                <StatusBadge
                                                    status={lot.status}
                                                    type={lot.status === 'DISTRIBUTED' ? 'success' : 'default'}
                                                />
                                            </div>
                                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                                <div className="text-center p-2 bg-blue-50 rounded">
                                                    <div className="font-medium text-blue-600">{lot.assigned_sims}</div>
                                                    <div className="text-blue-500">Assigned</div>
                                                </div>
                                                <div className="text-center p-2 bg-green-50 rounded">
                                                    <div className="font-medium text-green-600">{lot.sold_sims}</div>
                                                    <div className="text-green-500">Sold</div>
                                                </div>
                                                <div className="text-center p-2 bg-purple-50 rounded">
                                                    <div className="font-medium text-purple-600">{lot.activated_sims}</div>
                                                    <div className="text-purple-500">Activated</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <LoadingSpinner size={16}/>
                                            <span className="text-gray-500">Loading lot details...</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )
                    }
                </div>

                {/* SIM Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                            <Smartphone size={16} className="text-gray-500"/>
                            <span className="text-sm font-medium text-gray-700">Customer Details</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">MSISDN:</span>
                                <span className="font-medium">{sim.customer_msisdn}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">ID Number:</span>
                                <span className="font-medium">{sim.customer_id_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Agent MSISDN:</span>
                                <span className="font-medium">{sim.agent_msisdn}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                            <Calendar size={16} className="text-gray-500"/>
                            <span className="text-sm font-medium text-gray-700">Timeline</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Sale Date:</span>
                                <span className="font-medium">{new Date(sim.registered_on).toLocaleDateString()}</span>
                            </div>
                            {sim.activation_date && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Activated:</span>
                                    <span
                                        className="font-medium">{new Date(sim.activation_date).toLocaleDateString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500">Location:</span>
                                <span className="font-medium">{sim.sale_location}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Information */}
                {sim.registered_on && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-2">
                        <div className="flex items-center space-x-2 mb-3">
                            <DollarSign size={16} className="text-gray-500"/>
                            <span className="text-sm font-medium text-gray-700">Financial Activity</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex gap-2">
                                <span className="text-gray-500">Top-up Amount:</span>
                                {
                                    sim.top_up_amount ? (

                                        <span className="font-medium text-green-600">KES {sim.top_up_amount}</span>
                                    ) : (
                                        <span className="font-medium text-danger-600">No top up</span>)}
                            </div>
                            <div className="flex gap-2">
                                <span className="text-gray-500">usage:</span>
                                <span className="font-medium">{sim.usage}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Related Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sold By */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-3">Sold By</h5>
                        {soldBy ? (
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <UserCheck size={16} className="text-blue-600"/>
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">{soldBy.full_name}</div>
                                    <div className="text-sm text-gray-500">{soldBy.role.replace('_', ' ')}</div>
                                    <div className="text-sm text-gray-500">{soldBy.phone_number}</div>
                                </div>
                            </div>
                        ) : soldBy === undefined ? (
                            <div className="flex items-center space-x-2">
                                <LoadingSpinner size={16}/>
                                <span className="text-gray-500">Loading...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-x-2">
                                <span className={"bg-red-100 p-3 rounded-full text-red-500"}>
                                    <UserX size={24}/>
                                </span>
                                <span className="text-red-500">Unavailable</span>
                            </div>
                        )}
                    </div>

                    {/* Team */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-3">Team</h5>
                        {team ? (
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Building2 size={16} className="text-green-600"/>
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">{team.name}</div>
                                    <div className="text-sm text-gray-500">{team.region} • {team.territory}</div>
                                    {team.van_number_plate && (
                                        <div className="text-sm text-gray-500">Van: {team.van_number_plate}</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <LoadingSpinner size={16}/>
                                <span className="text-gray-500">Loading...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex hidden space-x-3 pt-4 border-t border-gray-200">
                    <button
                        className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                        <Eye size={16}/>
                        <span>View Full Details</span>
                    </button>
                    <button
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        <ExternalLink size={16}/>
                        <span>Open in SIM Management</span>
                    </button>
                </div>
            </div>

            {/* Modals */}
            {showBatchSIMs && (
                <SIMsListModal
                    title={`All SIMs in Batch ${sim.batch_id}`}
                    sims={batchSIMs}
                    onClose={() => setShowBatchSIMs(false)}
                />
            )}

            {showLotSIMs && (
                <SIMsListModal
                    title={`All SIMs in Lot ${sim.lot}`}
                    sims={lotSIMs}
                    onClose={() => setShowLotSIMs(false)}
                />
            )}
        </>
    );
};

export default SIMDetailComponent;