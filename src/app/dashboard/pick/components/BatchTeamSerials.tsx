import React, {useEffect, useState} from 'react';
import {SIMCard, User} from '@/models';
import simService from '@/services/simService';
import {ArrowDownUp, ArrowLeft, ArrowRight, ArrowRightLeft, Hash, Layers3, Package, Search} from "lucide-react";
import Theme from "@/ui/Theme";

interface BatchTeamSerialsProps {
    teamId: string;
    teamName: string;
    batchId: string;
    user: User;
    onClose: () => void;
}

interface Box {
    lot: string;
    startSerial: string;
    endSerial: string;
    serials: string[];
    cards?: SIMCard[];
    count: number;
    isLoading: boolean;
}

const BatchTeamSerials: React.FC<BatchTeamSerialsProps> = ({
                                                               teamId,
                                                               teamName,
                                                               batchId,
                                                               user,
                                                               onClose
                                                           }) => {
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBox, setSelectedBox] = useState<Box | null>(null);
    const [serialsPage, setSerialsPage] = useState<number>(1);
    const [isRightPanelVisible, setIsRightPanelVisible] = useState<boolean>(false);
    const serialsPerPage = 50;

    useEffect(() => {
        const fetchBoxes = async () => {
            if (!user) return;

            setIsLoading(true);
            setError(null);

            try {
                // Get all SIM cards for this team and batch
                // const {batch} = await batchMetadataService.batchInfo(batchId,[
                //     ["batch_id",batchId]
                // ])
                const simCards = await new Promise((resolve: (e: SIMCard[]) => void) => {
                    const chunks: SIMCard[] = [];
                    simService.streamChunks(user, (chunk, end) => {
                            chunks.push(...chunk)
                            if (end) {
                                resolve(chunks)
                            }
                        },
                        {
                            filters: [["batch_id", batchId]]
                        }
                    )
                });

                // Filter by team_id
                const teamSimCards = simCards.filter((card: any) => card.team_id === teamId);

                // Group by lot
                const lotGroups: { [key: string]: SIMCard[] } = {};

                teamSimCards.forEach((card: any) => {
                    const lot = card.lot || 'Unknown';
                    const serial = card.serial_number;

                    if (!lotGroups[lot]) {
                        lotGroups[lot] = [];
                    }

                    lotGroups[lot].push(card);
                });

                // Create boxes
                const boxesData = Object.entries(lotGroups).map(([lot, serials]) => {
                    // Sort serials for determining start and end
                    const sortedSerials = [...(serials.map(s=>s.serial_number))].sort();

                    return {
                        lot,
                        startSerial: sortedSerials[0] || '',
                        endSerial: sortedSerials[sortedSerials.length - 1] || '',
                        serials: [], // Will be loaded on demand
                        cards:serials,
                        count: serials.length, // Add count of serials in the box
                        isLoading: false
                    };
                });

                setBoxes(boxesData);
            } catch (err) {
                console.error('Error fetching boxes:', err);
                setError('Failed to load boxes for this team and batch');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBoxes();
    }, [teamId, batchId, user]);

    const handleBoxClick = async (box: Box) => {
        // Find the box in the current boxes array to get the latest state
        const currentBoxIndex = boxes.findIndex(b => b.lot === box.lot);
        if (currentBoxIndex === -1) return;

        const currentBox = boxes[currentBoxIndex];

        // If serials are already loaded, just update selection
        if (currentBox.serials.length > 0) {
            setSelectedBox(currentBox);
            setSerialsPage(1); // Reset to first page when selecting a new box
            setIsRightPanelVisible(true);
            return;
        }

        // Clone the boxes array to update the selected box
        const updatedBoxes = [...boxes];

        // Mark as loading
        updatedBoxes[currentBoxIndex] = {
            ...updatedBoxes[currentBoxIndex],
            isLoading: true
        };

        setBoxes(updatedBoxes);

        try {
            // Get all SIM cards for this team, batch, and lot
            // const simCards = await simService.getInBatched(user, "batch_id", [batchId]);
            const simCards = await new Promise((resolve: (e: SIMCard[]) => void) => {
                const chunks: SIMCard[] = [];
                simService.streamChunks(user, (chunk, end) => {
                        chunks.push(...chunk)
                        if (end) {
                            resolve(chunks)
                        }
                    },
                    {
                        filters: [["batch_id", batchId]]
                    }
                )
            });

            // Filter by team_id and lot
            const boxSimCards = simCards.filter(
                (card: any) => card.team_id === teamId && card.lot === box.lot
            );

            // Extract serials
            const serials = boxSimCards.map((card: any) => card.serial_number);

            // Sort serials
            const sortedSerials = [...serials].sort();

            // Update the box with serials
            updatedBoxes[currentBoxIndex] = {
                ...updatedBoxes[currentBoxIndex],
                serials: sortedSerials,
                cards:boxSimCards,
                count: sortedSerials.length, // Update count with actual loaded serials count
                isLoading: false
            };

            setBoxes(updatedBoxes);
            setSelectedBox(updatedBoxes[currentBoxIndex]);
            setSerialsPage(1); // Reset to first page when selecting a new box
            setIsRightPanelVisible(true);
        } catch (err) {
            console.error('Error fetching serials for box:', err);

            // Update the box to show error state
            updatedBoxes[currentBoxIndex] = {
                ...updatedBoxes[currentBoxIndex],
                isLoading: false
            };

            setBoxes(updatedBoxes);
        }
    };

    // Calculate pagination for serials
    const getPaginatedSerials = () => {
        if (!selectedBox) return [];

        const startIndex = (serialsPage - 1) * serialsPerPage;
        const endIndex = startIndex + serialsPerPage;

        return selectedBox.serials.slice(startIndex, endIndex);
    };

    const totalPages = selectedBox
        ? Math.ceil(selectedBox.serials.length / serialsPerPage)
        : 0;

    const totalSerials = boxes.reduce((sum, box) => sum + box.count, 0);

    return (
        <div className="bg-gradient-to-br from-slate-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative flex flex-col rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm max-h-[85vh] overflow-hidden">
            {/* Enhanced Header */}
            <div className="relative px-8 py-2 bg-gradient-to-r from-green-800 via-green-600 to-green-800 text-white">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Layers3 size={14} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white drop-shadow-sm">
                                {teamName}
                            </h2>
                            <div className="flex items-center gap-2 mt-1 text-blue-100">
                                <Hash size={10} />
                                <span className="text-sm font-medium">Batch {batchId}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="group p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
                    >
                        <svg className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* Stats Bar */}
                {!isLoading && (
                    <div className="mt-6 flex gap-6 text-sm">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/15 rounded-lg backdrop-blur-sm">
                            <Package size={16} />
                            <span className="font-medium">{boxes.length} Boxes</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/15 rounded-lg backdrop-blur-sm">
                            <Hash size={16} />
                            <span className="font-medium">{totalSerials.toLocaleString()} Serials</span>
                        </div>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex-1 flex justify-center items-center py-16">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4">
                            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Loading inventory...</p>
                        <p className="text-sm text-gray-500 mt-1">Fetching box data</p>
                    </div>
                </div>
            ) : error ? (
                <div className="flex-1 flex justify-center items-center py-16">
                    <div className="text-center max-w-md mx-auto px-6">
                        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <p className="text-lg font-medium text-red-600 mb-2">Unable to Load Data</p>
                        <p className="text-gray-500">{error}</p>
                    </div>
                </div>
            ) : boxes.length === 0 ? (
                <div className="flex-1 flex justify-center items-center py-16">
                    <div className="text-center max-w-md mx-auto px-6">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium text-gray-600 mb-2">No Inventory Found</p>
                        <p className="text-gray-500">No boxes found for this team and batch combination.</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden">
                    {/* Enhanced Left Panel - Box Listing */}
                    <div className={`flex flex-col transition-all duration-500 ease-out ${isRightPanelVisible ? 'w-full md:w-1/2' : 'w-full'}`}>
                        <div className="px-6 py-4 bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                                        <Package className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory Boxes</h3>
                                        <p className="text-sm text-gray-500">{boxes.length} boxes available</p>
                                    </div>
                                </div>
                                {selectedBox && !isRightPanelVisible && (
                                    <button
                                        onClick={() => setIsRightPanelVisible(true)}
                                        className="md:hidden flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                    >
                                        <span>View Serials</span>
                                        <ArrowRight size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className={`flex-1 overflow-y-auto p-6 ${Theme.Scrollbar}`}>
                            <div className="grid gap-4">
                                {boxes.map((box, index) => (
                                    <div
                                        key={box.lot}
                                        onClick={() => handleBoxClick(box)}
                                        className={`group relative py-2 px-6 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                                            selectedBox?.lot === box.lot
                                                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg'
                                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-200 hover:bg-gray-50 dark:hover:bg-gray-750'
                                        }`}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`p-2 rounded-lg ${selectedBox?.lot === box.lot ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-100'}`}>
                                                        <Package className={`w-5 h-5 ${selectedBox?.lot === box.lot ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'}`} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                            Lot {box.lot}
                                                        </h4>
                                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Hash size={12} />
                                                            {box.count.toLocaleString()} Lines
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                                            {box.startSerial}
                                                        </div>
                                                        <ArrowRightLeft className="text-gray-400 hidden sm:block" size={16} />
                                                        <ArrowDownUp className="text-gray-400 sm:hidden" size={16} />
                                                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                                            {box.endSerial}
                                                        </div>
                                                    </div>
                                                    <span className={"bg-amber-50 text-amber-500"}>
                                                        {box.cards?.filter(serial => serial.assigned_to_user_id!=null).length.toLocaleString()} assigned
                                                    </span>
                                                </div>
                                            </div>

                                            {box.isLoading && (
                                                <div className="ml-4">
                                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Hover effect overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Right Panel - Serials Listing */}
                    {isRightPanelVisible && (
                        <>
                            <div
                                onClick={() => {
                                    setIsRightPanelVisible(false);
                                    setTimeout(() => setSelectedBox(null), 300);
                                }}
                                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                            />
                            <div className={`absolute md:relative z-50 md:z-0 right-0 top-0 bottom-0 min-h-full w-full md:w-1/2 bg-white dark:bg-gray-800 md:border-l border-gray-200/50 dark:border-gray-700/50 flex flex-col transition-all duration-500 ease-out transform ${
                                isRightPanelVisible ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
                            }`}>
                                <div className="px-6 py-2 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200/50 dark:border-gray-700/50">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => {
                                                setIsRightPanelVisible(false);
                                                setTimeout(() => setSelectedBox(null), 300);
                                            }}
                                            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-colors"
                                        >
                                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                                        </button>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <Hash size={18} />
                                                {selectedBox ? `Box ${selectedBox.lot}` : 'Serial Numbers'}
                                            </h3>
                                            {selectedBox && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {selectedBox.serials.length.toLocaleString()} serial numbers
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {selectedBox ? (
                                    <>
                                        {selectedBox.isLoading ? (
                                            <div className="flex-1 flex justify-center items-center">
                                                <div className="text-center">
                                                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mb-3">
                                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                    <p className="text-gray-600 dark:text-gray-300 font-medium">Loading serials...</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className={`flex-grow overflow-y-auto ${Theme.Scrollbar}`}>
                                                    <div className="p-6">
                                                        <div className="grid gap-2">
                                                            {getPaginatedSerials().map((serial, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="group p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                                                                    style={{ animationDelay: `${index * 25}ms` }}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                                        <code className="text-sm font-mono text-gray-700 dark:text-gray-200 font-medium">
                                                                            {serial}
                                                                        </code>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Enhanced Pagination */}
                                                {totalPages > 1 && (
                                                    <div className="px-6 py-4 bg-gray-50/80 dark:bg-gray-800/80 border-t border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                                                        <div className="flex justify-between items-center">
                                                            <button
                                                                onClick={() => setSerialsPage(Math.max(1, serialsPage - 1))}
                                                                disabled={serialsPage === 1}
                                                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                                                            >
                                                                <ArrowLeft size={16} />
                                                                Previous
                                                            </button>

                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                                                    Page {serialsPage} of {totalPages}
                                                                </span>
                                                            </div>

                                                            <button
                                                                onClick={() => setSerialsPage(Math.min(totalPages, serialsPage + 1))}
                                                                disabled={serialsPage === totalPages}
                                                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                                                            >
                                                                Next
                                                                <ArrowRight size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex-1 flex justify-center items-center">
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Search className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium">Select a box to view serials</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default BatchTeamSerials;