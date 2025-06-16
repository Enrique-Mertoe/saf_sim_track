import React from 'react';
import {Camera, ChevronDown, Scan, Upload} from 'lucide-react';
import Dropdown from "../materia_screen/components/Dropdown";

// Updated Scan Button Component
const ScanButton = ({
                        showModal,
                        filteredUnassigned,
                        setSelectedSims,
                        alert,
                        Theme,
                        BarcodeScanner,
                        className = ''
                    }) => {
    const dropdownOptions = [
        {
            key: 'camera',
            value: 'camera',
            label: 'Camera',
            className:"text-sm",
            icon: <Camera className="h-4 w-4" />,
        },
        {
            key: 'file',
            value: 'file',
            className:"text-sm",
            label: 'Upload',
            icon: <Upload className="h-4 w-4" />,
        }
    ];

    const handleScanOptionSelect = (option) => {
        showModal({
            content: onClose => (
                <BarcodeScanner
                    tab={option.value}
                    onClose={(scannedSerials) => {
                        if (scannedSerials && scannedSerials.length > 0) {
                            // Find matching SIM cards in the unassigned list
                            const matchedSimIds = filteredUnassigned
                                .filter(sim => scannedSerials.includes(sim.serial))
                                .map(sim => sim.id);

                            if (matchedSimIds.length > 0) {
                                // Select the matched SIM cards
                                setSelectedSims(prevSelected => {
                                    // Create a new Set with all previously selected SIMs
                                    const newSelection = new Set(prevSelected);

                                    // Add all matched SIMs
                                    matchedSimIds.forEach(id => newSelection.add(id));

                                    // Convert back to array
                                    return Array.from(newSelection);
                                });

                                alert.success(`Selected ${matchedSimIds.length} SIM cards from scan`);
                            } else {
                                alert.warning('No matching SIM cards found for the scanned serials');
                            }
                        }
                        onClose(); // Close the modal
                    }}
                />
            )
        });
    };

    const triggerButton = (
        <button className={`${Theme.Button} ${className}`}>
            <Scan className="h-4 w-4 mr-1" />
            Scan
            <ChevronDown className="h-3 w-3 ml-1" />
        </button>
    );

    return (
        <Dropdown
            trigger={triggerButton}
            options={dropdownOptions}
            onSelect={handleScanOptionSelect}
            position="bottom-right"
            dropdownClassName="min-w-[260px]"
            zIndex={100}
        />
    );
};

export default ScanButton;