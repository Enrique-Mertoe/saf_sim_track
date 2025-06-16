import React, {useEffect, useState} from 'react';
import {groupSerialsByLot} from "@/app/dashboard/pick/utility";
import {SmartPagination} from "@/ui/components/SmartPagination";
import Theme from "@/ui/Theme";

const SimCardRangeSelectionModal = ({simCards, onClose, resolve, reject}) => {
    // Add state for selected SIM cards and box mode
    const [selectedSimCards, setSelectedSimCards] = useState([]);
    const [boxMode, setBoxMode] = useState(true); // Enable box mode by default
    const [totalBoxes, setTotalBoxes] = useState(0);
    const [availableBoxes, setAvailableBoxes] = useState([]); // All available boxes
    const [selectedBoxes, setSelectedBoxes] = useState([]); // Currently selected boxes
    const [boxAssignments, setBoxAssignments] = useState({}); // Map of box number to selection status
    const [boxSearchTerm, setBoxSearchTerm] = useState(''); // Search term for boxes
    const [simSearchTerm, setSimSearchTerm] = useState(''); // Search term for individual SIM cards
    const [selectedSimSearchTerm, setSelectedSimSearchTerm] = useState(''); // Search term for selected SIM cards
    const [view, setView] = useState('box-selection'); // 'box-selection' or 'individual-selection'

    // Pagination for selected SIM cards
    const [selectedSimCardsPage, setSelectedSimCardsPage] = useState(1);
    const [selectedSimCardsPerPage, setSelectedSimCardsPerPage] = useState(10);

    // Pagination for individual selection
    const [individualSelectionPage, setIndividualSelectionPage] = useState(1);
    const [individualSelectionPerPage, setIndividualSelectionPerPage] = useState(10);


    const [isVisible, setIsVisible] = useState(false);
    const [contentVisible, setContentVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => setContentVisible(true), 150);
        return () => clearTimeout(timer);
    }, []);

    // Initialize available SIM cards and group them by lot
    useEffect(() => {
        if (simCards.length > 0) {
            // Convert simCards to the format expected by groupSerialsByLot
            const serialsWithLot = simCards.map((sim) => ({
                value: sim.serial_number,
                lot: sim.lot || 'unknown', // Use 'unknown' as fallback if lot is not available
                id: sim.id
            }));

            // Group SIM cards by lot
            const boxes = groupSerialsByLot(serialsWithLot);
            setTotalBoxes(boxes.length);
            setAvailableBoxes(boxes);

            // Initialize empty box assignments
            const initialAssignments = {};
            boxes.forEach(box => {
                //@ts-ignore
                initialAssignments[box.boxNumber] = false;
            });
            setBoxAssignments(initialAssignments);
        }
    }, [simCards]);

    // Filter boxes based on search term
    const filteredBoxes = availableBoxes.filter(box => {
        if (!boxSearchTerm) return true;

        return (
            (box.boxNumber && box.boxNumber.toString().includes(boxSearchTerm)) ||
            (box.lot && box.lot.toString().toLowerCase().includes(boxSearchTerm.toLowerCase())) ||
            box.startRange.includes(boxSearchTerm) ||
            box.endRange.includes(boxSearchTerm)
        );
    });

    // Filter individual SIM cards based on search term
    const filteredSimCards = simCards.filter(sim => {
        if (!simSearchTerm) return true;
        return sim.serial_number.toLowerCase().includes(simSearchTerm.toLowerCase());
    });

    // Pagination for individual selection
    const totalIndividualSelectionPages = Math.ceil(filteredSimCards.length / individualSelectionPerPage);
    const paginatedIndividualSimCards = filteredSimCards.slice(
        (individualSelectionPage - 1) * individualSelectionPerPage,
        individualSelectionPage * individualSelectionPerPage
    );

    // Handle page change for individual selection
    const handleIndividualSelectionPageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalIndividualSelectionPages) {
            setIndividualSelectionPage(newPage);
        }
    };

    // Toggle box selection
    const toggleBoxSelection = (boxNumber) => {
        setBoxAssignments(prev => ({
            ...prev,
            //@ts-ignore
            [boxNumber]: !prev[boxNumber]
        }));

        setSelectedBoxes((prev) => {
            if (prev.includes(boxNumber)) {
                //@ts-ignore
                return prev.filter(num => num !== boxNumber);
            } else {
                return [...prev, boxNumber];
            }
        });
    };

    // Toggle individual SIM card selection
    const toggleSimCardSelection = (simCardId) => {
        setSelectedSimCards(prev => {
            if (prev.includes(simCardId)) {
                return prev.filter(id => id !== simCardId);
            } else {
                return [...prev, simCardId];
            }
        });
    };

    // Select all boxes
    const selectAllBoxes = () => {
        const allBoxNumbers = availableBoxes.map(box => box.boxNumber);
        const newAssignments = {};

        availableBoxes.forEach(box => {
            newAssignments[box.boxNumber] = true;
        });

        setBoxAssignments(newAssignments);
        setSelectedBoxes(allBoxNumbers);
    };

    // Deselect all boxes
    const deselectAllBoxes = () => {
        const newAssignments = {};

        availableBoxes.forEach(box => {
            newAssignments[box.boxNumber] = false;
        });

        setBoxAssignments(newAssignments);
        setSelectedBoxes([]);
    };

    // Select all SIM cards
    const selectAllSimCards = () => {
        const allSimCardIds = simCards.map(sim => sim.id);
        setSelectedSimCards(allSimCardIds);
    };

    // Deselect all SIM cards
    const deselectAllSimCards = () => {
        setSelectedSimCards([]);
    };

    // Get all selected SIM card IDs (from both box mode and individual selection)
    const getAllSelectedSimCardIds = () => {
        if (view === 'box-selection') {
            // Get SIM cards from selected boxes
            const selectedSimCardIds = [];
            selectedBoxes.forEach(boxNumber => {
                const box = availableBoxes.find(b => b.boxNumber === boxNumber);
                if (box) {
                    // The serials array contains the serial numbers, but we need the IDs
                    // We need to find the original SIM card objects to get their IDs
                    simCards.forEach(sim => {
                        // Check if this SIM card's serial number is in the box's serials array
                        if (box.serials.includes(sim.serial_number)) {
                            selectedSimCardIds.push(sim.id);
                        }
                    });
                }
            });
            return selectedSimCardIds;
        } else {
            // Return individually selected SIM cards
            return selectedSimCards;
        }
    };

    // Get all selected SIM card details (not just IDs)
    const getSelectedSimCardDetails = () => {
        const selectedIds = getAllSelectedSimCardIds();
        return simCards.filter(sim => selectedIds.includes(sim.id));
    };

    const filteredSelectedSimCards = getSelectedSimCardDetails().filter(sim => {
        if (!selectedSimSearchTerm) return true;
        return sim.serial_number.toLowerCase().includes(selectedSimSearchTerm.toLowerCase());
    });

    // Pagination for selected SIM cards
    const totalSelectedSimCardsPages = Math.ceil(filteredSelectedSimCards.length / selectedSimCardsPerPage);
    const paginatedSelectedSimCards = filteredSelectedSimCards.slice(
        (selectedSimCardsPage - 1) * selectedSimCardsPerPage,
        selectedSimCardsPage * selectedSimCardsPerPage
    );

    // Handle page change for selected SIM cards
    const handleSelectedSimCardsPageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalSelectedSimCardsPages) {
            setSelectedSimCardsPage(newPage);
        }
    };

    const handleConfirm = () => {
        const selectedIds = getAllSelectedSimCardIds();

        if (selectedIds.length === 0) {
            alert('Please select at least one SIM card');
            return;
        }

        resolve(selectedIds);
        handleClose();
    };

    // Handle cancel button click
    const handleCancel = () => {
        reject('Selection cancelled');
        onClose();
    };

    const handleClose = () => {
        setContentVisible(false);
        setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 200);
        }, 150);
    };

    return (
        <
        >
            <div
                className={`bg-white rounded-lg shadow-xl max-sm:rounded-none w-full  max-h-[90vh] m-4 overflow-hidden flex flex-col transform transition-all duration-300 ${
                    contentVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`p-6 border-b border-gray-200 transform transition-all duration-500 delay-100 ${
                    contentVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
                }`}>
                    <h2 className="text-xl font-semibold text-gray-900">Select SIM Cards for Transfer</h2>
                    <p className="text-gray-600 mt-1">
                        Choose SIM cards to transfer by selecting entire boxes or individual SIM cards
                    </p>
                </div>

                {/* Selection Mode Tabs */}
                <div className={`flex border-b border-gray-200 transform transition-all duration-500 delay-200 ${
                    contentVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
                }`}>
                    <button
                        onClick={() => setView('box-selection')}
                        className={`flex-1 py-3 px-4 text-center transition-all duration-200 ${
                            view === 'box-selection'
                                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Box Selection
                    </button>
                    <button
                        onClick={() => setView('individual-selection')}
                        className={`flex-1 py-3 px-4 text-center transition-all duration-200 ${
                            view === 'individual-selection'
                                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Individual Selection
                    </button>
                </div>

                <div
                    className={`flex-1 overflow-auto p-6 flex flex-col md:flex-row gap-4 transform transition-all duration-500 delay-300 ${
                        contentVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                    }`}>
                    {/* Left panel - Selection area */}
                    <div className="flex-1 min-w-0">
                        <div className={`transition-all duration-300 ${
                            view === 'box-selection' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'
                        }`}>
                            {view === 'box-selection' && (
                                <div>
                                    <div className="mb-4 flex justify-between items-center">
                                        <div className="relative w-64">
                                            <input
                                                type="text"
                                                placeholder="Search by lot or serial range..."
                                                value={boxSearchTerm}
                                                onChange={(e) => setBoxSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm transition-colors duration-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            />
                                            <svg
                                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors duration-200"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={selectAllBoxes}
                                                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100 transition-colors duration-200 transform hover:scale-105"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                onClick={deselectAllBoxes}
                                                className="px-3 py-1 bg-gray-50 text-gray-600 rounded-md text-sm hover:bg-gray-100 transition-colors duration-200 transform hover:scale-105"
                                            >
                                                Deselect All
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredBoxes.map((box, index) => (
                                            <div
                                                key={box.boxNumber}
                                                className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-md ${
                                                    boxAssignments[box.boxNumber]
                                                        ? 'border-blue-500 bg-blue-50 scale-105 shadow-md'
                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                                                }`}
                                                style={{
                                                    animationDelay: `${index * 50}ms`
                                                }}
                                                onClick={() => toggleBoxSelection(box.boxNumber)}
                                            >
                                                <div className="flex flex-col whitespace-nowrap items-start mb-2">
                                                    <div className="font-medium text-sm">Lot: {box.lot}</div>
                                                    <div
                                                        className={`text-xs rounded-full px-2 py-0.5 transition-colors duration-200 ${
                                                            boxAssignments[box.boxNumber]
                                                                ? 'bg-blue-200 text-blue-900'
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {box.count}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    <div>Start: {box.startRange}</div>
                                                    <div>End: {box.endRange}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {filteredBoxes.length === 0 && (
                                        <div className="text-center py-8 text-gray-500 animate-fade-in">
                                            No boxes match your search
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={`transition-all duration-300 ${
                            view === 'individual-selection' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 absolute'
                        }`}>
                            {view === 'individual-selection' && (
                                <div>
                                    <div className="mb-4 flex justify-between items-center">
                                        <div className="relative w-64">
                                            <input
                                                type="text"
                                                placeholder="Search SIM cards..."
                                                value={simSearchTerm}
                                                onChange={(e) => setSimSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm transition-colors duration-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            />
                                            <svg
                                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={selectAllSimCards}
                                                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100 transition-colors duration-200 transform hover:scale-105"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                onClick={deselectAllSimCards}
                                                className="px-3 py-1 bg-gray-50 text-gray-600 rounded-md text-sm hover:bg-gray-100 transition-colors duration-200 transform hover:scale-105"
                                            >
                                                Deselect All
                                            </button>
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-md overflow-hidden">
                                        <div className="max-h-96 overflow-y-auto">
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
                                                {paginatedIndividualSimCards.map((sim, index) => (
                                                    <tr
                                                        key={sim.id}
                                                        className="hover:bg-gray-50 transition-colors duration-200"
                                                        style={{
                                                            animationDelay: `${index * 50}ms`
                                                        }}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSimCards.includes(sim.id)}
                                                                onChange={() => toggleSimCardSelection(sim.id)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
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
                                        </div>
                                    </div>
                                    <div className="flex p-3 mx-auto items-center justify-center flex-col">
                                        <SmartPagination
                                            design={"modern"}
                                            currentPage={individualSelectionPage}
                                            totalPages={totalIndividualSelectionPages}
                                            onPageChange={handleIndividualSelectionPageChange}
                                        />
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span
                                                className="font-medium">{(individualSelectionPage - 1) * individualSelectionPerPage + 1}</span> to{' '}
                                                <span className="font-medium">
                                                            {Math.min(individualSelectionPage * individualSelectionPerPage, filteredSimCards.length)}
                                                        </span>{' '}
                                                of <span
                                                className="font-medium">{filteredSimCards.length}</span> results
                                            </p>
                                        </div>
                                    </div>
                                    {/* Pagination controls for individual selection */}


                                    {filteredSimCards.length === 0 && (
                                        <div className="text-center py-8 text-gray-500 animate-fade-in">
                                            No SIM cards match your search
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right panel - Selected SIM cards */}
                    <div
                        className="w-full md:w-80 flex-shrink-0 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-4 mt-4 md:mt-0">
                        <div className="mb-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Selected SIM Cards</h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search selected SIMs..."
                                    value={selectedSimSearchTerm}
                                    onChange={(e) => setSelectedSimSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm transition-colors duration-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                                <svg
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                        </div>

                        <div className="border border-gray-200 rounded-md overflow-hidden">
                            <div className="max-h-96 overflow-y-auto">
                                {filteredSelectedSimCards.length > 0 ? (
                                    <ul className="divide-y divide-gray-200">
                                        {paginatedSelectedSimCards.map((sim, index) => (
                                            <li
                                                key={sim.id}
                                                className="px-4 py-3 hover:bg-gray-50 flex justify-between items-center transition-all duration-200 transform hover:translate-x-1"
                                                style={{
                                                    animationDelay: `${index * 30}ms`
                                                }}
                                            >
                                                <span
                                                    className="text-sm font-medium text-gray-900">{sim.serial_number}</span>
                                                <button
                                                    onClick={() => view === 'box-selection'
                                                        ? toggleBoxSelection(availableBoxes.find(box =>
                                                            box.serials.includes(sim.serial_number))?.boxNumber)
                                                        : toggleSimCardSelection(sim.id)
                                                    }
                                                    className="text-red-500 hover:text-red-700 transition-all duration-200 transform hover:scale-110"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor"
                                                         viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round"
                                                              strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-8 text-gray-500 animate-pulse">
                                        No SIM cards selected
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex mx-auto items-center justify-center p-2 flex-col">
                            <SmartPagination
                                design={"rounded"}
                                currentPage={selectedSimCardsPage}
                                totalPages={totalSelectedSimCardsPages}
                                onPageChange={handleSelectedSimCardsPageChange}
                            />
                            <div className={"order-2"}>
                                <p className="text-sm text-gray-700">
                                    Showing <span
                                    className="font-medium">{(selectedSimCardsPage - 1) * selectedSimCardsPerPage + 1}</span> to{' '}
                                    <span className="font-medium">
                                                {Math.min(selectedSimCardsPage * selectedSimCardsPerPage, filteredSelectedSimCards.length)}
                                            </span>{' '}
                                    of <span className="font-medium">{filteredSelectedSimCards.length}</span> results
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className={`p-6 border-t border-gray-200 flex justify-between items-center transform transition-all duration-500 delay-400 ${
                        contentVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                    }`}>
                    <div className="text-sm text-gray-600">
                        {view === 'box-selection'
                            ? `${selectedBoxes.length} lots selected (${getAllSelectedSimCardIds().length} SIM cards)`
                            : `${selectedSimCards.length} SIM cards selected`
                        }
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`${Theme.Button}`}
                        >
                            Confirm Selection
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </>
    );
};
export default SimCardRangeSelectionModal;
