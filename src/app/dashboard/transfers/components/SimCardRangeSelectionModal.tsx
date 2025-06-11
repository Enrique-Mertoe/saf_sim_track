import React, {useEffect, useState} from 'react';

const SimCardRangeSelectionModal = ({ simCards, onClose, resolve, reject }) => {
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

    // Initialize available SIM cards and sort them
    useEffect(() => {
        if (simCards.length > 0) {
            const sorted = [...simCards].sort((a, b) => {
                const numA = parseInt(a.serial_number);
                const numB = parseInt(b.serial_number);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                }
                return a.serial_number.localeCompare(b.serial_number);
            });

            // Calculate total boxes (each box has 100 SIM cards)
            const boxCount = Math.ceil(sorted.length / 100);
            setTotalBoxes(boxCount);

            // Initialize available boxes
            const boxes = [];
            for (let i = 0; i < boxCount; i++) {
                const startIdx = i * 100;
                const endIdx = Math.min(startIdx + 99, sorted.length - 1);

                boxes.push({
                    boxNumber: i + 1,
                    startRange: sorted[startIdx].serial_number,
                    endRange: sorted[endIdx].serial_number,
                    count: endIdx - startIdx + 1,
                    simCards: sorted.slice(startIdx, endIdx + 1)
                });
            }
            setAvailableBoxes(boxes);

            // Initialize empty box assignments
            const initialAssignments = {};
            boxes.forEach(box => {
                initialAssignments[box.boxNumber] = false;
            });
            setBoxAssignments(initialAssignments);
        }
    }, [simCards]);

    // Filter boxes based on search term
    const filteredBoxes = availableBoxes.filter(box => {
        if (!boxSearchTerm) return true;

        return (
            box.boxNumber.toString().includes(boxSearchTerm) ||
            box.startRange.includes(boxSearchTerm) ||
            box.endRange.includes(boxSearchTerm)
        );
    });

    // Filter individual SIM cards based on search term
    const filteredSimCards = simCards.filter(sim => {
        if (!simSearchTerm) return true;
        return sim.serial_number.toLowerCase().includes(simSearchTerm.toLowerCase());
    });

    // Toggle box selection
    const toggleBoxSelection = (boxNumber) => {
        setBoxAssignments(prev => ({
            ...prev,
            [boxNumber]: !prev[boxNumber]
        }));

        setSelectedBoxes(prev => {
            if (prev.includes(boxNumber)) {
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
                    box.simCards.forEach(sim => {
                        selectedSimCardIds.push(sim.id);
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

    // Filter selected SIM cards based on search term
    const filteredSelectedSimCards = getSelectedSimCardDetails().filter(sim => {
        if (!selectedSimSearchTerm) return true;
        return sim.serial_number.toLowerCase().includes(selectedSimSearchTerm.toLowerCase());
    });

    // Handle confirm button click
    const handleConfirm = () => {
        const selectedIds = getAllSelectedSimCardIds();

        if (selectedIds.length === 0) {
            alert('Please select at least one SIM card');
            return;
        }

        resolve(selectedIds);
        onClose();
    };

    // Handle cancel button click
    const handleCancel = () => {
        reject('Selection cancelled');
        onClose();
    };

    return (
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Select SIM Cards for Transfer</h2>
                <p className="text-gray-600 mt-1">
                    Choose SIM cards to transfer by selecting entire boxes or individual SIM cards
                </p>
            </div>

            {/* Selection Mode Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setView('box-selection')}
                    className={`flex-1 py-3 px-4 text-center ${
                        view === 'box-selection'
                            ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Box Selection
                </button>
                <button
                    onClick={() => setView('individual-selection')}
                    className={`flex-1 py-3 px-4 text-center ${
                        view === 'individual-selection'
                            ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Individual Selection
                </button>
            </div>

            <div className="flex-1 overflow-auto p-6 flex flex-col md:flex-row gap-4">
                {/* Left panel - Selection area */}
                <div className="flex-1 min-w-0">
                    {view === 'box-selection' && (
                        <div>
                            <div className="mb-4 flex justify-between items-center">
                                <div className="relative w-64">
                                    <input
                                        type="text"
                                        placeholder="Search boxes..."
                                        value={boxSearchTerm}
                                        onChange={(e) => setBoxSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
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
                                        onClick={selectAllBoxes}
                                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        onClick={deselectAllBoxes}
                                        className="px-3 py-1 bg-gray-50 text-gray-600 rounded-md text-sm hover:bg-gray-100"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredBoxes.map((box) => (
                                    <div
                                        key={box.boxNumber}
                                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                            boxAssignments[box.boxNumber]
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                                        }`}
                                        onClick={() => toggleBoxSelection(box.boxNumber)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium">Box #{box.boxNumber}</div>
                                            <div className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                                                {box.count} SIMs
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
                                <div className="text-center py-8 text-gray-500">
                                    No boxes match your search
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'individual-selection' && (
                        <div>
                            <div className="mb-4 flex justify-between items-center">
                                <div className="relative w-64">
                                    <input
                                        type="text"
                                        placeholder="Search SIM cards..."
                                        value={simSearchTerm}
                                        onChange={(e) => setSimSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
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
                                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        onClick={deselectAllSimCards}
                                        className="px-3 py-1 bg-gray-50 text-gray-600 rounded-md text-sm hover:bg-gray-100"
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
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Select
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Serial Number
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredSimCards.map(sim => (
                                                <tr key={sim.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSimCards.includes(sim.id)}
                                                            onChange={() => toggleSimCardSelection(sim.id)}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {sim.serial_number}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                            {sim.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {filteredSimCards.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No SIM cards match your search
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right panel - Selected SIM cards */}
                <div className="w-full md:w-80 flex-shrink-0 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-4 mt-4 md:mt-0">
                    <div className="mb-3">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Selected SIM Cards</h3>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search selected SIMs..."
                                value={selectedSimSearchTerm}
                                onChange={(e) => setSelectedSimSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
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
                                    {filteredSelectedSimCards.map(sim => (
                                        <li key={sim.id} className="px-4 py-3 hover:bg-gray-50 flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-900">{sim.serial_number}</span>
                                            <button
                                                onClick={() => view === 'box-selection' 
                                                    ? toggleBoxSelection(availableBoxes.find(box => 
                                                        box.simCards.some(s => s.id === sim.id))?.boxNumber)
                                                    : toggleSimCardSelection(sim.id)
                                                }
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                </svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No SIM cards selected
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    {view === 'box-selection' 
                        ? `${selectedBoxes.length} boxes selected (approximately ${selectedBoxes.length * 100} SIM cards)`
                        : `${selectedSimCards.length} SIM cards selected`
                    }
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Confirm Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SimCardRangeSelectionModal;
