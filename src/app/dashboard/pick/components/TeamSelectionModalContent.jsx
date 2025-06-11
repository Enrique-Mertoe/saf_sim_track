import React, {useEffect, useRef, useState} from 'react';

const TeamSelectionModalContent = ({teams, setSelectedTeam, onClose, resolve, reject, serials = []}) => {
    // Add state for search term and selected teams
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [view, setView] = useState('selection'); // 'selection', 'ranges', or 'box-assignment'
    const [teamRanges, setTeamRanges] = useState({});
    const [remainingCount, setRemainingCount] = useState(0);
    const [defaultCount, setDefaultCount] = useState(0);
    const [vCount, sVC] = useState(0);
    const [teamsWithErrors, setTeamsWithErrors] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null); // Track which dropdown is active
    const [availableSerials, setAvailableSerials] = useState([]);
    const [usedSerials, setUsedSerials] = useState(new Set());
    const [teamRangeErrors, setTeamRangeErrors] = useState({});
    const [successfulRanges, setSuccessfulRanges] = useState({});
    const [boxMode, setBoxMode] = useState(true); // Enable box mode by default
    const [totalBoxes, setTotalBoxes] = useState(0);
    const [teamBoxes, setTeamBoxes] = useState({}); // Track boxes per team
    const [availableBoxes, setAvailableBoxes] = useState([]); // All available boxes
    const [selectedBoxes, setSelectedBoxes] = useState([]); // Currently selected boxes
    const [selectedTeamForBoxes, setSelectedTeamForBoxes] = useState(null); // Selected team for box assignment
    const [boxAssignments, setBoxAssignments] = useState({}); // Map of box number to team ID
    const [teamSearchTerm, setTeamSearchTerm] = useState(''); // Search term for teams in box assignment view
    const [boxSearchTerm, setBoxSearchTerm] = useState(''); // Search term for boxes
    const dropdownRef = useRef(null); // Reference to the active dropdown

    // Initialize available serials and sort them
    useEffect(() => {
        if (serials.length > 0) {
            const sorted = [...serials].sort((a, b) => {
                const numA = parseInt(a.value);
                const numB = parseInt(b.value);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                }
                return a.value.localeCompare(b.value);
            });
            setAvailableSerials(sorted);

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
                    startRange: sorted[startIdx].value,
                    endRange: sorted[endIdx].value,
                    count: endIdx - startIdx + 1,
                    serials: sorted.slice(startIdx, endIdx + 1)
                });
            }
            setAvailableBoxes(boxes);

            // Initialize empty box assignments
            const initialAssignments = {};
            boxes.forEach(box => {
                initialAssignments[box.boxNumber] = null;
            });
            setBoxAssignments(initialAssignments);
        }
    }, [serials]);

    // Effect to automatically divide SIMs equally when view changes to ranges
    useEffect(() => {
        if (view === 'ranges' && defaultCount > 0 && selectedTeams.length > 1) {
            // Automatically divide SIMs equally when entering the ranges view
            divideEqually(defaultCount);
        }
    }, [view, defaultCount, selectedTeams.length]);

    // Effect to handle clicks outside the dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };

        // Add event listener when a dropdown is active
        if (activeDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Clean up the event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdown]);

    // Filter teams based on search term
    const filteredTeams = teams.filter(team => {
        const teamNameMatch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
        const leaderNameMatch = (team.leader || '').toLowerCase().includes(searchTerm.toLowerCase());
        return teamNameMatch || leaderNameMatch;
    });

    const handleCancel = () => {
        onClose();
        reject(new Error("Team selection cancelled"));
    };

    const handleTeamSelect = (teamId) => {
        // Toggle team selection
        if (selectedTeams.includes(teamId)) {
            setSelectedTeams(selectedTeams.filter(id => id !== teamId));
        } else {
            setSelectedTeams([...selectedTeams, teamId]);
        }
    };

    const handleContinue = () => {
        if (selectedTeams.length === 0) {
            alert("Please select at least one team");
            return;
        }

        // If only one team is selected, skip the range selection step
        if (selectedTeams.length === 1) {
            setSelectedTeam(selectedTeams[0]);
            onClose();
            resolve(selectedTeams[0]);
            return;
        }

        // Initialize ranges for each selected team
        const initialRanges = {};
        selectedTeams.forEach(teamId => {
            initialRanges[teamId] = {
                startRange: '',
                endRange: '',
                count: 0
            };
        });
        setTeamRanges(initialRanges);

        // Calculate default count based on available serials
        const totalSerials = availableSerials.length;
        const defaultValue = totalSerials > 0 ? totalSerials : 100; // Use 100 as fallback if no serials
        setDefaultCount(defaultValue);
        sVC(Math.floor(defaultValue / selectedTeams.length));
        setRemainingCount(defaultValue); // Set the input value as well

        // Switch to box assignment view if box mode is enabled, otherwise to ranges view
        if (boxMode) {
            setView('box-assignment');
        } else {
            setView('ranges');
        }
    };

    const handleConfirm = () => {
        // Reset previous errors
        setTeamsWithErrors([]);
        setTeamRangeErrors({});

        // Validate ranges before confirming
        const teamsWithMissingRanges = [];
        const rangeErrors = {};
        const overlapErrors = {};
        const invalidSerialErrors = {};

        // Check each team for missing ranges and validate ranges
        selectedTeams.forEach(teamId => {
            const range = teamRanges[teamId];
            if (!range || !range.startRange || !range.endRange) {
                teamsWithMissingRanges.push(teamId);
            } else {
                // Validate that start and end serials exist in availableSerials
                const startIdx = availableSerials.findIndex(s => s.value === range.startRange);
                const endIdx = availableSerials.findIndex(s => s.value === range.endRange);

                if (startIdx === -1 || endIdx === -1) {
                    invalidSerialErrors[teamId] = 'One or both serials are invalid';
                    return;
                }

                // Validate that start is less than or equal to end
                if (startIdx > endIdx) {
                    rangeErrors[teamId] = 'Start range cannot be greater than end range';
                    return;
                }

                // Check for overlaps with other teams
                for (const otherTeamId of selectedTeams) {
                    if (otherTeamId === teamId) continue;

                    const otherRange = teamRanges[otherTeamId];
                    if (!otherRange || !otherRange.startRange || !otherRange.endRange) continue;

                    const otherStartIdx = availableSerials.findIndex(s => s.value === otherRange.startRange);
                    const otherEndIdx = availableSerials.findIndex(s => s.value === otherRange.endRange);

                    if (otherStartIdx === -1 || otherEndIdx === -1) continue;

                    // Check for overlap
                    const hasOverlap = (
                        (startIdx <= otherEndIdx && endIdx >= otherStartIdx) ||
                        (otherStartIdx <= endIdx && otherEndIdx >= startIdx)
                    );

                    if (hasOverlap) {
                        const otherTeam = teams.find(t => t.id === otherTeamId);
                        overlapErrors[teamId] = `Range overlaps with ${otherTeam?.name || 'another team'}`;
                        break;
                    }
                }
            }
        });

        // Handle missing ranges
        if (teamsWithMissingRanges.length > 0) {
            // Set the teams with errors to highlight them
            setTeamsWithErrors(teamsWithMissingRanges);

            // Create a more specific error message
            const teamNames = teamsWithMissingRanges.map(teamId => {
                const team = teams.find(t => t.id === teamId);
                return team ? team.name : 'Unknown Team';
            }).join(', ');

            alert(`Please fill in all ranges for the following teams: ${teamNames}`);
            return;
        }

        // Handle range errors
        if (Object.keys(rangeErrors).length > 0) {
            setTeamRangeErrors(rangeErrors);

            const errorTeams = Object.keys(rangeErrors).map(teamId => {
                const team = teams.find(t => t.id === teamId);
                return `${team?.name || 'Unknown Team'}: ${rangeErrors[teamId]}`;
            }).join('\n');

            alert(`Please fix the following range errors:\n${errorTeams}`);
            return;
        }

        // Handle invalid serial errors
        if (Object.keys(invalidSerialErrors).length > 0) {
            setTeamRangeErrors(invalidSerialErrors);

            const errorTeams = Object.keys(invalidSerialErrors).map(teamId => {
                const team = teams.find(t => t.id === teamId);
                return `${team?.name || 'Unknown Team'}: ${invalidSerialErrors[teamId]}`;
            }).join('\n');

            alert(`Please fix the following serial errors:\n${errorTeams}`);
            return;
        }

        // Handle overlap errors
        if (Object.keys(overlapErrors).length > 0) {
            setTeamRangeErrors(overlapErrors);

            const errorTeams = Object.keys(overlapErrors).map(teamId => {
                const team = teams.find(t => t.id === teamId);
                return `${team?.name || 'Unknown Team'}: ${overlapErrors[teamId]}`;
            }).join('\n');

            alert(`Please fix the following overlap errors:\n${errorTeams}`);
            return;
        }

        // Return selected teams with their ranges
        const result = {
            teams: selectedTeams,
            ranges: teamRanges
        };

        setSelectedTeam(selectedTeams[0]); // For backward compatibility
        onClose();
        resolve(result);
    };

    // Helper function to get unused serials for suggestions
    const getUnusedSerials = () => {
        return availableSerials.filter(serial => !usedSerials.has(serial.value));
    };

    // Helper function to generate range suggestions
    const generateSuggestions = (input, teamId, field) => {
        if (!input || input.length < 2) return [];

        // Get all serials that match the input, including used ones for display purposes
        const inputLower = input.toLowerCase();
        const teamIndex = selectedTeams.indexOf(teamId);
        const currentRange = teamRanges[teamId] || {};

        // First, get all matching serials regardless of usage
        let allMatchingSerials = availableSerials
            .filter(serial => serial.value && serial.value.toLowerCase().includes(inputLower))
            .map(serial => {
                // Calculate priority based on various factors
                let priority = 10; // Default priority
                let isUsed = usedSerials.has(serial.value);
                const assignment = isUsed ? getSerialAssignment(serial.value) : {assigned: false};

                // Exact match gets highest priority
                if (serial.value.toLowerCase() === inputLower) {
                    priority = 1;
                }
                // Matches at the end get high priority
                else if (serial.value.toLowerCase().endsWith(inputLower)) {
                    priority = 2;
                }
                // Matches at the beginning get medium priority
                else if (serial.value.toLowerCase().startsWith(inputLower)) {
                    priority = 3;
                }

                // For start range field, consider team position
                if (field === 'startRange') {
                    // If not the first team, prioritize serials that come after previous team's end range
                    if (teamIndex > 0) {
                        const prevTeamId = selectedTeams[teamIndex - 1];
                        const prevRange = teamRanges[prevTeamId] || {};

                        if (prevRange.endRange) {
                            const prevEndIdx = availableSerials.findIndex(s => s.value === prevRange.endRange);
                            const serialIdx = availableSerials.findIndex(s => s.value === serial.value);

                            if (prevEndIdx !== -1 && serialIdx !== -1 && serialIdx > prevEndIdx) {
                                // Boost priority for serials that come right after the previous team's end range
                                priority -= 1;
                            }
                        }
                    }
                }
                // For end range field, consider the start range and count
                else if (field === 'endRange' && currentRange.startRange) {
                    const startIdx = availableSerials.findIndex(s => s.value === currentRange.startRange);
                    const serialIdx = availableSerials.findIndex(s => s.value === serial.value);

                    if (startIdx !== -1 && serialIdx !== -1) {
                        // Ensure end range is after start range
                        if (serialIdx >= startIdx) {
                            // If count is set, prioritize serials that would match the count
                            if (currentRange.count > 0) {
                                const idealEndIdx = startIdx + currentRange.count - 1;
                                const distance = Math.abs(serialIdx - idealEndIdx);

                                // Boost priority for serials close to the ideal end range
                                if (distance === 0) {
                                    priority -= 2; // Perfect match for count
                                } else if (distance <= 2) {
                                    priority -= 1; // Close to ideal count
                                }
                            }
                        }
                    }
                }

                // If the serial is already assigned to this team, it's still usable
                if (assignment.assigned && assignment.teamId === teamId) {
                    isUsed = false;
                }

                return {
                    value: serial.value,
                    priority,
                    isUsed,
                    assignment
                };
            })
            .sort((a, b) => {
                // Unused serials come first
                if (a.isUsed !== b.isUsed) {
                    return a.isUsed ? 1 : -1;
                }

                // Sort by priority for unused serials
                if (!a.isUsed && !b.isUsed && a.priority !== b.priority) {
                    return a.priority - b.priority;
                }

                // Then by numeric value if possible
                const numA = parseInt(a.value);
                const numB = parseInt(b.value);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                }

                // Fallback to string comparison
                return a.value.localeCompare(b.value);
            })
            .slice(0, 8); // Show more suggestions to include some used ones

        return allMatchingSerials;
    };

    // Function to update used serials based on current ranges
    const updateUsedSerials = (ranges) => {
        const used = new Set();
        Object.values(ranges).forEach(range => {
            if (range.startRange && range.endRange) {
                const startIdx = availableSerials.findIndex(s => s.value === range.startRange);
                const endIdx = availableSerials.findIndex(s => s.value === range.endRange);
                if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
                    for (let i = startIdx; i <= endIdx; i++) {
                        used.add(availableSerials[i].value);
                    }
                }
            }
        });
        setUsedSerials(used);
    };

    // Function to get next available serial after a given position
    const getNextAvailableSerial = (afterSerial) => {
        const currentIdx = availableSerials.findIndex(s => s.value === afterSerial);
        if (currentIdx === -1) return null;

        for (let i = currentIdx + 1; i < availableSerials.length; i++) {
            if (!usedSerials.has(availableSerials[i].value)) {
                return availableSerials[i].value;
            }
        }
        return null;
    };

    // Function to propagate changes to subsequent teams
    const propagateRangeChanges = (changedTeamId, newRanges) => {
        const teamOrder = selectedTeams;
        const changedTeamIndex = teamOrder.indexOf(changedTeamId);

        if (changedTeamIndex === -1) return newRanges;

        // Update used serials first
        updateUsedSerials(newRanges);

        // Propagate changes to subsequent teams
        const updatedRanges = {...newRanges};

        for (let i = changedTeamIndex + 1; i < teamOrder.length; i++) {
            const teamId = teamOrder[i];
            const prevTeamId = teamOrder[i - 1];
            const prevRange = updatedRanges[prevTeamId];

            if (prevRange && prevRange.endRange) {
                const nextStart = getNextAvailableSerial(prevRange.endRange);
                if (nextStart) {
                    const currentRange = updatedRanges[teamId] || {};
                    const currentCount = currentRange.count || 0;

                    updatedRanges[teamId] = {
                        ...currentRange,
                        startRange: nextStart,
                        endRange: currentCount > 0 ? calculateEndRange(nextStart, currentCount) : currentRange.endRange || ''
                    };
                } else {
                    // No more serials available for this team
                    updatedRanges[teamId] = {
                        startRange: '',
                        endRange: '',
                        count: 0
                    };
                }
            }
        }

        return updatedRanges;
    };

    // Function to calculate end range based on start and count
    const calculateEndRange = (startSerial, count) => {
        const startIdx = availableSerials.findIndex(s => s.value === startSerial);
        if (startIdx === -1 || count <= 0) return '';

        const endIdx = startIdx + count - 1;
        if (endIdx >= availableSerials.length) return '';

        return availableSerials[endIdx].value;
    };

    // Function to calculate end range for a box (always 99 SIMs after start)
    const calculateBoxEndRange = (startSerial) => {
        const startIdx = availableSerials.findIndex(s => s.value === startSerial);
        if (startIdx === -1) return '';

        // A box contains 100 SIMs, so end index is start + 99
        const endIdx = Math.min(startIdx + 99, availableSerials.length - 1);
        return availableSerials[endIdx].value;
    };

    // Function to check if a team can have more serials assigned
    const canTeamHaveSerials = (teamId) => {
        const teamIndex = selectedTeams.indexOf(teamId);
        if (teamIndex === 0) return true; // First team can always be assigned

        // Check if previous team has valid ranges
        const prevTeamId = selectedTeams[teamIndex - 1];
        const prevRange = teamRanges[prevTeamId];

        return prevRange && prevRange.startRange && prevRange.endRange;
    };

    // Function to get remaining available serials count
    const getRemainingSerials = () => {
        return availableSerials.length - usedSerials.size;
    };

    // Function to check if a serial is assigned to a team and which team
    const getSerialAssignment = (serialValue) => {
        for (const teamId of selectedTeams) {
            const range = teamRanges[teamId];
            if (!range || !range.startRange || !range.endRange) continue;

            const startIdx = availableSerials.findIndex(s => s.value === range.startRange);
            const endIdx = availableSerials.findIndex(s => s.value === range.endRange);
            const serialIdx = availableSerials.findIndex(s => s.value === serialValue);

            if (startIdx !== -1 && endIdx !== -1 && serialIdx !== -1 &&
                serialIdx >= startIdx && serialIdx <= endIdx) {
                const team = teams.find(t => t.id === teamId);
                return {
                    assigned: true,
                    teamId,
                    teamName: team?.name || 'Unknown Team'
                };
            }
        }

        return {assigned: false};
    };

    // Function to handle range input changes
    const handleRangeChange = (teamId, field, value) => {
        // Clear errors when user starts typing
        if (teamsWithErrors.includes(teamId) && value) {
            const currentRanges = teamRanges[teamId] || {};
            const otherField = field === 'startRange' ? 'endRange' : 'startRange';
            const otherValue = currentRanges[otherField];

            // Only remove from error list if both fields are now filled
            if (value && otherValue) {
                setTeamsWithErrors(prev => prev.filter(id => id !== teamId));
            }
        }

        // Clear range errors
        if (teamRangeErrors[teamId]) {
            setTeamRangeErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[teamId];
                return newErrors;
            });
        }

        // Clear success state when changing a value
        setSuccessfulRanges(prev => {
            const newSuccessful = {...prev};
            if (newSuccessful[teamId]) {
                newSuccessful[teamId] = {
                    ...newSuccessful[teamId],
                    [field]: false
                };
            }
            return newSuccessful;
        });

        const newRanges = {
            ...teamRanges,
            [teamId]: {
                ...teamRanges[teamId],
                [field]: value
            }
        };

        // Special handling for box mode
        if (boxMode && field === 'startRange') {
            // Update box information for this team
            updateTeamBoxes(teamId, value);

            // In box mode, when start range is set, automatically calculate end range
            if (value) {
                const boxEndRange = calculateBoxEndRange(value);
                if (boxEndRange) {
                    newRanges[teamId].endRange = boxEndRange;

                    // Calculate count
                    const startIdx = availableSerials.findIndex(s => s.value === value);
                    const endIdx = availableSerials.findIndex(s => s.value === boxEndRange);
                    if (startIdx !== -1 && endIdx !== -1) {
                        newRanges[teamId].count = Math.max(0, endIdx - startIdx + 1);
                    }

                    // Set success state for both ranges
                    setSuccessfulRanges(prev => ({
                        ...prev,
                        [teamId]: {
                            ...(prev[teamId] || {}),
                            startRange: true,
                            endRange: true
                        }
                    }));

                    // Show success briefly then fade out
                    setTimeout(() => {
                        setSuccessfulRanges(prev => {
                            if (!prev[teamId]) return prev;
                            return {
                                ...prev,
                                [teamId]: {
                                    ...prev[teamId],
                                    startRange: false,
                                    endRange: false
                                }
                            };
                        });
                    }, 2000);
                }
            }
        } else {
            // Original logic for non-box mode or end range changes
            // Calculate count if both start and end are set
            if (field === 'endRange' && newRanges[teamId].startRange && value) {
                const startIdx = availableSerials.findIndex(s => s.value === newRanges[teamId].startRange);
                const endIdx = availableSerials.findIndex(s => s.value === value);
                if (startIdx !== -1 && endIdx !== -1) {
                    newRanges[teamId].count = Math.max(0, endIdx - startIdx + 1);

                    // Set success state for end range
                    setSuccessfulRanges(prev => ({
                        ...prev,
                        [teamId]: {
                            ...(prev[teamId] || {}),
                            endRange: true
                        }
                    }));

                    // Show success briefly then fade out
                    setTimeout(() => {
                        setSuccessfulRanges(prev => {
                            if (!prev[teamId]) return prev;
                            return {
                                ...prev,
                                [teamId]: {
                                    ...prev[teamId],
                                    endRange: false
                                }
                            };
                        });
                    }, 2000);
                }
            } else if (field === 'startRange' && newRanges[teamId].endRange && value) {
                const startIdx = availableSerials.findIndex(s => s.value === value);
                const endIdx = availableSerials.findIndex(s => s.value === newRanges[teamId].endRange);
                if (startIdx !== -1 && endIdx !== -1) {
                    newRanges[teamId].count = Math.max(0, endIdx - startIdx + 1);

                    // Set success state for start range
                    setSuccessfulRanges(prev => ({
                        ...prev,
                        [teamId]: {
                            ...(prev[teamId] || {}),
                            startRange: true
                        }
                    }));

                    // Show success briefly then fade out
                    setTimeout(() => {
                        setSuccessfulRanges(prev => {
                            if (!prev[teamId]) return prev;
                            return {
                                ...prev,
                                [teamId]: {
                                    ...prev[teamId],
                                    startRange: false
                                }
                            };
                        });
                    }, 2000);
                }
            }
        }

        // If a valid serial is selected from dropdown, mark it as successful
        if (value && availableSerials.some(s => s.value === value)) {
            setSuccessfulRanges(prev => ({
                ...prev,
                [teamId]: {
                    ...(prev[teamId] || {}),
                    [field]: true
                }
            }));

            // Show success briefly then fade out
            setTimeout(() => {
                setSuccessfulRanges(prev => {
                    if (!prev[teamId]) return prev;
                    return {
                        ...prev,
                        [teamId]: {
                            ...prev[teamId],
                            [field]: false
                        }
                    };
                });
            }, 2000);
        }

        // Propagate changes to subsequent teams if this affects the sequence
        const finalRanges = propagateRangeChanges(teamId, newRanges);
        setTeamRanges(finalRanges);
    };

    // Function to set count and auto-calculate end range
    const handleCountChange = (teamId, count) => {
        const currentRange = teamRanges[teamId] || {};
        const startRange = currentRange.startRange;

        if (!startRange) return;

        const countNum = parseInt(count);
        if (isNaN(countNum) || countNum <= 0) {
            setTeamRanges(prev => ({
                ...prev,
                [teamId]: {
                    ...prev[teamId],
                    count: 0,
                    endRange: ''
                }
            }));
            return;
        }

        if (boxMode) {
            // In box mode, count represents number of boxes
            const startIdx = availableSerials.findIndex(s => s.value === startRange);
            if (startIdx === -1) return;

            // Calculate which box this start range belongs to
            const boxIndex = Math.floor(startIdx / 100);

            // Calculate end range based on box count
            const endBoxIndex = boxIndex + countNum - 1;
            const endSerialIndex = Math.min((endBoxIndex + 1) * 100 - 1, availableSerials.length - 1);
            const endRange = availableSerials[endSerialIndex].value;

            // Update boxes for this team
            const boxes = [];
            for (let i = 0; i < countNum; i++) {
                const boxStartIdx = boxIndex * 100 + (i * 100);

                if (boxStartIdx < availableSerials.length) {
                    const boxEndIdx = Math.min(boxStartIdx + 99, availableSerials.length - 1);

                    boxes.push({
                        boxNumber: boxIndex + i + 1,
                        startRange: availableSerials[boxStartIdx].value,
                        endRange: availableSerials[boxEndIdx].value,
                        count: boxEndIdx - boxStartIdx + 1
                    });
                }
            }

            setTeamBoxes(prev => ({
                ...prev,
                [teamId]: {
                    boxCount: countNum,
                    boxes: boxes
                }
            }));

            const newRanges = {
                ...teamRanges,
                [teamId]: {
                    ...currentRange,
                    endRange: endRange,
                    count: endSerialIndex - startIdx + 1
                }
            };

            // Propagate changes to subsequent teams
            const finalRanges = propagateRangeChanges(teamId, newRanges);
            setTeamRanges(finalRanges);
        } else {
            // Original logic for non-box mode
            const endRange = calculateEndRange(startRange, countNum);

            const newRanges = {
                ...teamRanges,
                [teamId]: {
                    ...currentRange,
                    endRange: endRange,
                    count: countNum
                }
            };

            // Propagate changes to subsequent teams
            const finalRanges = propagateRangeChanges(teamId, newRanges);
            setTeamRanges(finalRanges);
        }
    };

    // Function to handle box count change
    const handleBoxCountChange = (teamId, boxCount) => {
        if (!boxMode) return;

        const currentRange = teamRanges[teamId] || {};
        const startRange = currentRange.startRange;

        if (!startRange) return;

        const boxCountNum = parseInt(boxCount);
        if (isNaN(boxCountNum) || boxCountNum <= 0) {
            setTeamBoxes(prev => ({
                ...prev,
                [teamId]: {
                    ...prev[teamId],
                    boxCount: 0,
                    boxes: []
                }
            }));
            return;
        }

        // Call handleCountChange with box count
        handleCountChange(teamId, boxCountNum);
    };

    // Function to divide SIMs equally among teams
    const divideEqually = (totalCount) => {
        if (!totalCount || selectedTeams.length === 0) return;

        // If we have actual serials, use them for the ranges
        if (availableSerials.length > 0) {
            if (boxMode) {
                // Box-based distribution
                const boxesPerTeam = Math.floor(totalBoxes / selectedTeams.length);
                const remainderBoxes = totalBoxes % selectedTeams.length;

                const newRanges = {};
                const newTeamBoxes = {};
                let startBoxIndex = 0;

                selectedTeams.forEach((teamId, index) => {
                    // Last team gets the remainder boxes
                    const teamBoxCount = index === selectedTeams.length - 1 ?
                        boxesPerTeam + remainderBoxes : boxesPerTeam;

                    if (teamBoxCount === 0 || startBoxIndex >= totalBoxes) {
                        newRanges[teamId] = {
                            startRange: '',
                            endRange: '',
                            count: 0
                        };
                        newTeamBoxes[teamId] = {
                            boxCount: 0,
                            boxes: []
                        };
                        return;
                    }

                    // Calculate start and end indices based on boxes
                    const startSerialIndex = startBoxIndex * 100;
                    const endBoxIndex = startBoxIndex + teamBoxCount - 1;
                    const endSerialIndex = Math.min((endBoxIndex + 1) * 100 - 1, availableSerials.length - 1);

                    // Create box information for this team
                    const boxes = [];
                    for (let i = startBoxIndex; i <= endBoxIndex; i++) {
                        const boxStartIdx = i * 100;
                        const boxEndIdx = Math.min(boxStartIdx + 99, availableSerials.length - 1);

                        if (boxStartIdx < availableSerials.length) {
                            boxes.push({
                                boxNumber: i + 1,
                                startRange: availableSerials[boxStartIdx].value,
                                endRange: availableSerials[boxEndIdx].value,
                                count: boxEndIdx - boxStartIdx + 1
                            });
                        }
                    }

                    newRanges[teamId] = {
                        startRange: availableSerials[startSerialIndex].value,
                        endRange: availableSerials[endSerialIndex].value,
                        count: endSerialIndex - startSerialIndex + 1
                    };

                    newTeamBoxes[teamId] = {
                        boxCount: teamBoxCount,
                        boxes: boxes
                    };

                    startBoxIndex = endBoxIndex + 1;
                });

                setTeamRanges(newRanges);
                setTeamBoxes(newTeamBoxes);
                updateUsedSerials(newRanges);
                return;
            } else {
                // Original SIM-based distribution
                const countPerTeam = Math.floor(availableSerials.length / selectedTeams.length);
                const remainder = availableSerials.length % selectedTeams.length;

                const newRanges = {};
                let startIndex = 0;

                selectedTeams.forEach((teamId, index) => {
                    // Last team gets the remainder
                    const teamCount = index === selectedTeams.length - 1 ?
                        countPerTeam + remainder : countPerTeam;

                    if (teamCount === 0 || startIndex >= availableSerials.length) {
                        newRanges[teamId] = {
                            startRange: '',
                            endRange: '',
                            count: 0
                        };
                        return;
                    }

                    const endIndex = Math.min(startIndex + teamCount - 1, availableSerials.length - 1);

                    newRanges[teamId] = {
                        startRange: availableSerials[startIndex].value,
                        endRange: availableSerials[endIndex].value,
                        count: endIndex - startIndex + 1
                    };

                    startIndex = endIndex + 1;
                });

                setTeamRanges(newRanges);
                updateUsedSerials(newRanges);
                return;
            }
        }

        // Fallback to the original implementation if no serials are available
        const countPerTeam = Math.floor(totalCount / selectedTeams.length);
        const remainder = totalCount % selectedTeams.length;

        let startNum = 1; // Starting from 1 for simplicity

        const newRanges = {};
        selectedTeams.forEach((teamId, index) => {
            // Last team gets the remainder
            const teamCount = index === selectedTeams.length - 1 ?
                countPerTeam + remainder : countPerTeam;

            const endNum = startNum + teamCount - 1;

            newRanges[teamId] = {
                startRange: startNum.toString(),
                endRange: endNum.toString(),
                count: teamCount
            };

            startNum = endNum + 1;
        });

        setTeamRanges(newRanges);
    };

    // Function to update box information when a team's start range changes
    const updateTeamBoxes = (teamId, startRange) => {
        if (!boxMode || !startRange) return;

        const startIdx = availableSerials.findIndex(s => s.value === startRange);
        if (startIdx === -1) return;

        // Calculate which box this start range belongs to
        const boxIndex = Math.floor(startIdx / 100);

        // Create box information for this team
        const boxes = [];
        const currentTeamBoxes = teamBoxes[teamId] || { boxCount: 1, boxes: [] };
        const boxCount = currentTeamBoxes.boxCount || 1;

        for (let i = 0; i < boxCount; i++) {
            const boxStartIdx = boxIndex * 100 + (i * 100);

            if (boxStartIdx < availableSerials.length) {
                const boxEndIdx = Math.min(boxStartIdx + 99, availableSerials.length - 1);

                boxes.push({
                    boxNumber: boxIndex + i + 1,
                    startRange: availableSerials[boxStartIdx].value,
                    endRange: availableSerials[boxEndIdx].value,
                    count: boxEndIdx - boxStartIdx + 1
                });
            }
        }

        setTeamBoxes(prev => ({
            ...prev,
            [teamId]: {
                ...currentTeamBoxes,
                boxes: boxes
            }
        }));

        // Update the team's overall range based on the boxes
        if (boxes.length > 0) {
            const firstBox = boxes[0];
            const lastBox = boxes[boxes.length - 1];

            setTeamRanges(prev => ({
                ...prev,
                [teamId]: {
                    ...prev[teamId],
                    startRange: firstBox.startRange,
                    endRange: lastBox.endRange,
                    count: lastBox.endRange ? 
                        availableSerials.findIndex(s => s.value === lastBox.endRange) - 
                        availableSerials.findIndex(s => s.value === firstBox.startRange) + 1 : 0
                }
            }));
        }
    };

    // Function to handle box selection
    const handleBoxSelect = (boxNumber) => {
        setSelectedBoxes(prev => {
            if (prev.includes(boxNumber)) {
                return prev.filter(num => num !== boxNumber);
            } else {
                return [...prev, boxNumber];
            }
        });
    };

    // Function to handle team selection for box assignment
    const handleTeamSelectForBoxes = (teamId) => {
        setSelectedTeamForBoxes(teamId === selectedTeamForBoxes ? null : teamId);
    };

    // Function to assign selected boxes to selected team
    const handleAssignBoxes = () => {
        if (!selectedTeamForBoxes || selectedBoxes.length === 0) {
            alert("Please select both boxes and a team");
            return;
        }

        const newBoxAssignments = { ...boxAssignments };
        selectedBoxes.forEach(boxNumber => {
            newBoxAssignments[boxNumber] = selectedTeamForBoxes;
        });
        setBoxAssignments(newBoxAssignments);

        // Update team boxes
        updateTeamBoxesFromAssignments(newBoxAssignments);

        // Clear selected boxes
        setSelectedBoxes([]);
    };

    // Function to update team boxes based on box assignments
    const updateTeamBoxesFromAssignments = (assignments) => {
        const newTeamBoxes = {};

        // Group boxes by team
        Object.entries(assignments).forEach(([boxNumber, teamId]) => {
            if (!teamId) return; // Skip unassigned boxes

            const box = availableBoxes.find(b => b.boxNumber === parseInt(boxNumber));
            if (!box) return;

            if (!newTeamBoxes[teamId]) {
                newTeamBoxes[teamId] = {
                    boxCount: 0,
                    boxes: []
                };
            }

            newTeamBoxes[teamId].boxes.push(box);
            newTeamBoxes[teamId].boxCount = newTeamBoxes[teamId].boxes.length;
        });

        // Update team ranges based on assigned boxes
        const newTeamRanges = { ...teamRanges };
        Object.entries(newTeamBoxes).forEach(([teamId, teamBoxData]) => {
            if (teamBoxData.boxes.length === 0) {
                newTeamRanges[teamId] = {
                    startRange: '',
                    endRange: '',
                    count: 0
                };
                return;
            }

            // Sort boxes by box number
            const sortedBoxes = [...teamBoxData.boxes].sort((a, b) => a.boxNumber - b.boxNumber);

            newTeamRanges[teamId] = {
                startRange: sortedBoxes[0].startRange,
                endRange: sortedBoxes[sortedBoxes.length - 1].endRange,
                count: sortedBoxes.reduce((total, box) => total + box.count, 0)
            };
        });

        setTeamBoxes(newTeamBoxes);
        setTeamRanges(newTeamRanges);
    };

    // Function to handle drag start for a box
    const handleDragStart = (e, boxNumber) => {
        e.dataTransfer.setData('boxNumber', boxNumber.toString());
    };

    // Function to handle drag over for a team
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // Function to handle drop on a team
    const handleDrop = (e, teamId) => {
        e.preventDefault();
        const boxNumber = parseInt(e.dataTransfer.getData('boxNumber'));

        // Update box assignment
        const newBoxAssignments = { ...boxAssignments };
        newBoxAssignments[boxNumber] = teamId;
        setBoxAssignments(newBoxAssignments);

        // Update team boxes
        updateTeamBoxesFromAssignments(newBoxAssignments);
    };

    // Function to handle box assignment confirmation
    const handleBoxAssignmentConfirm = () => {
        // Check if any team has no boxes assigned
        const teamsWithNoBoxes = selectedTeams.filter(teamId => 
            !Object.values(boxAssignments).includes(teamId)
        );

        if (teamsWithNoBoxes.length > 0) {
            const teamNames = teamsWithNoBoxes.map(teamId => {
                const team = teams.find(t => t.id === teamId);
                return team ? team.name : 'Unknown Team';
            }).join(', ');

            if (!confirm(`The following teams have no boxes assigned: ${teamNames}. Continue anyway?`)) {
                return;
            }
        }

        // Return selected teams with their ranges
        const result = {
            teams: selectedTeams,
            ranges: teamRanges,
            boxAssignments: boxAssignments
        };

        setSelectedTeam(selectedTeams[0]); // For backward compatibility
        onClose();
        resolve(result);
    };

    // Filter teams for box assignment view
    const filteredTeamsForBoxes = teams.filter(team => {
        if (!selectedTeams.includes(team.id)) return false;

        const teamNameMatch = team.name.toLowerCase().includes(teamSearchTerm.toLowerCase());
        const leaderNameMatch = (team.leader || '').toLowerCase().includes(teamSearchTerm.toLowerCase());
        return teamNameMatch || leaderNameMatch;
    });

    // Filter boxes for box assignment view
    const filteredBoxes = availableBoxes.filter(box => {
        const boxNumberMatch = box.boxNumber.toString().includes(boxSearchTerm);
        const startRangeMatch = box.startRange.includes(boxSearchTerm);
        const endRangeMatch = box.endRange.includes(boxSearchTerm);
        return boxNumberMatch || startRangeMatch || endRangeMatch;
    });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-full w-full">
            {view === 'selection' ? (
                // Team Selection View
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Teams</h2>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Please select one or more teams to assign these SIM cards to:
                    </p>

                    {/* Search input */}
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none"
                                 stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="block w-full p-2 pl-10 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                            placeholder="Search by team or leader name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                onClick={() => setSearchTerm('')}
                            >
                                <svg
                                    className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                          d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Selected teams count */}
                    {selectedTeams.length > 0 && (
                        <div className="mb-4 p-2 bg-green-50 text-green-700 rounded-md">
                            {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''} selected
                        </div>
                    )}

                    <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                        {filteredTeams.length > 0 ? (
                            filteredTeams.map(team => (
                                <div
                                    key={team.id}
                                    className={`p-3 border rounded-lg cursor-pointer ${
                                        selectedTeams.includes(team.id)
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-700'
                                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                    onClick={() => handleTeamSelect(team.id)}
                                >
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{team.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Leader: {team.leader || 'No leader'}</p>
                                        </div>
                                        {selectedTeams.includes(team.id) ? (
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor"
                                                 viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                      d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor"
                                                 viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                      d="M9 5l7 7-7 7"></path>
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : searchTerm ? (
                            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                No teams found matching "{searchTerm}"
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                No teams available. Please create a team first.
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={handleContinue}
                            className={`px-4 py-1 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                                selectedTeams.length > 0
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-gray-400 cursor-not-allowed'
                            }`}
                            disabled={selectedTeams.length === 0}
                        >
                            Continue
                        </button>
                        <button
                            onClick={handleCancel}
                            className="px-4 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                </>
            ) : view === 'box-assignment' ? (
                // Box Assignment View
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Boxes to Teams</h2>
                        <button
                            onClick={() => setView('selection')}
                            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Assign boxes to teams by selecting boxes and a team, then clicking "Assign". You can also drag boxes to teams.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Boxes Column */}
                        <div className="border border-gray-200 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-md font-medium text-gray-800">Available Boxes</h3>
                                <div className="text-xs text-gray-500">
                                    {selectedBoxes.length} selected / {availableBoxes.length} total
                                </div>
                            </div>

                            {/* Box Search */}
                            <div className="relative mb-2">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" 
                                         viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    className="block w-full p-2 pl-10 text-sm border border-gray-300 rounded-lg"
                                    placeholder="Search boxes..."
                                    value={boxSearchTerm}
                                    onChange={(e) => setBoxSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Box List */}
                            <div className="max-h-60 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-1">
                                    {filteredBoxes.map(box => {
                                        const isSelected = selectedBoxes.includes(box.boxNumber);
                                        const isAssigned = boxAssignments[box.boxNumber] !== null;
                                        const assignedTeam = isAssigned ? 
                                            teams.find(t => t.id === boxAssignments[box.boxNumber]) : null;

                                        return (
                                            <div
                                                key={box.boxNumber}
                                                className={`p-2 border rounded cursor-pointer ${
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : isAssigned
                                                            ? 'border-green-500 bg-green-50'
                                                            : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                                onClick={() => !isAssigned && handleBoxSelect(box.boxNumber)}
                                                draggable={!isAssigned}
                                                onDragStart={(e) => handleDragStart(e, box.boxNumber)}
                                            >
                                                <div className="text-xs font-medium">Box {box.boxNumber}</div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    Start: {box.startRange.substring(0, 8)}...
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    End: {box.endRange.substring(0, 8)}...
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {box.count} SIMs
                                                </div>
                                                {isAssigned && (
                                                    <div className="mt-1 text-xs text-green-600 font-medium truncate">
                                                        Assigned to: {assignedTeam?.name || 'Unknown'}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Teams Column */}
                        <div className="border border-gray-200 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-md font-medium text-gray-800">Teams</h3>
                                <div className="text-xs text-gray-500">
                                    {selectedTeams.length} teams
                                </div>
                            </div>

                            {/* Team Search */}
                            <div className="relative mb-2">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" 
                                         viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    className="block w-full p-2 pl-10 text-sm border border-gray-300 rounded-lg"
                                    placeholder="Search teams..."
                                    value={teamSearchTerm}
                                    onChange={(e) => setTeamSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Team List */}
                            <div className="max-h-60 overflow-y-auto">
                                {filteredTeamsForBoxes.map(team => {
                                    const isSelected = team.id === selectedTeamForBoxes;
                                    const assignedBoxCount = Object.values(boxAssignments).filter(
                                        teamId => teamId === team.id
                                    ).length;

                                    return (
                                        <div
                                            key={team.id}
                                            className={`p-3 border rounded-lg mb-2 cursor-pointer ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                            onClick={() => handleTeamSelectForBoxes(team.id)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, team.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-sm font-medium">{team.name}</h4>
                                                    <p className="text-xs text-gray-500">Leader: {team.leader || 'No leader'}</p>
                                                </div>
                                                <div className="text-xs font-medium text-blue-600">
                                                    {assignedBoxCount} boxes
                                                </div>
                                            </div>

                                            {/* Show assigned boxes */}
                                            {assignedBoxCount > 0 && (
                                                <div className="mt-2 pt-2 border-t border-gray-200">
                                                    <div className="text-xs font-medium mb-1">Assigned Boxes:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {Object.entries(boxAssignments)
                                                            .filter(([_, teamId]) => teamId === team.id)
                                                            .map(([boxNumber]) => (
                                                                <span 
                                                                    key={boxNumber}
                                                                    className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                                                                >
                                                                    Box {boxNumber}
                                                                </span>
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Assignment Controls */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleAssignBoxes}
                                className={`px-4 py-1 text-sm font-medium rounded-md ${
                                    selectedBoxes.length > 0 && selectedTeamForBoxes
                                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                                }`}
                                disabled={selectedBoxes.length === 0 || !selectedTeamForBoxes}
                            >
                                Assign Selected Boxes
                            </button>
                            <span className="text-sm text-gray-500">
                                {selectedBoxes.length} boxes selected
                            </span>
                        </div>
                        <div>
                            <button
                                onClick={() => {
                                    // Reset all assignments
                                    const resetAssignments = {};
                                    Object.keys(boxAssignments).forEach(boxNumber => {
                                        resetAssignments[boxNumber] = null;
                                    });
                                    setBoxAssignments(resetAssignments);
                                    setTeamBoxes({});

                                    // Reset team ranges
                                    const resetRanges = {};
                                    selectedTeams.forEach(teamId => {
                                        resetRanges[teamId] = {
                                            startRange: '',
                                            endRange: '',
                                            count: 0
                                        };
                                    });
                                    setTeamRanges(resetRanges);
                                }}
                                className="px-4 py-1 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                            >
                                Reset All
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={handleBoxAssignmentConfirm}
                            className="px-4 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Confirm & Upload
                        </button>
                        <button
                            onClick={() => setView('selection')}
                            className="px-4 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Back
                        </button>
                    </div>
                </>
            ) : (
                // Range Selection View
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Set Serial Number Ranges</h2>
                        <button
                            onClick={() => setView('selection')}
                            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Set serial number ranges for each selected team:
                    </p>

                    {/* Distribution mode selection and divide equally option */}
                    <div className="mb-4 p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-700">Distribution Mode</label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setBoxMode(true)}
                                    className={`px-3 py-1 text-xs font-medium rounded ${
                                        boxMode 
                                            ? 'text-white bg-green-600 hover:bg-green-700' 
                                            : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                                    }`}
                                >
                                    Box Mode
                                </button>
                                <button
                                    onClick={() => setBoxMode(false)}
                                    className={`px-3 py-1 text-xs font-medium rounded ${
                                        !boxMode 
                                            ? 'text-white bg-green-600 hover:bg-green-700' 
                                            : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                                    }`}
                                >
                                    Individual Mode
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">
                                {boxMode ? 'Divide boxes equally among teams' : 'Divide SIMs equally among teams'}
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center space-x-1">
                                    {vCount ? <span
                                        className="text-sm text-blue-500 px-3 py-1 bg-blue-200 rounded-full">
                                        {boxMode ? `${Math.floor(vCount / 100)} boxes` : `${vCount} SIMs`} each
                                    </span> : null}
                                </div>

                                <button
                                    onClick={() => divideEqually(remainingCount)}
                                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                    disabled={!remainingCount || remainingCount <= 0}
                                >
                                    Divide
                                </button>
                            </div>
                        </div>

                        {availableSerials.length > 0 && (
                            <div className="text-xs text-gray-500">
                                {boxMode ? (
                                    <>
                                        Available boxes: {Math.ceil(getRemainingSerials() / 100)} | 
                                        Total boxes: {totalBoxes} | 
                                        Total SIMs: {availableSerials.length}
                                    </>
                                ) : (
                                    <>
                                        Available serials: {getRemainingSerials()} | 
                                        Total: {availableSerials.length}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Team ranges */}
                    <div className="space-y-4 max-h-60 overflow-y-auto mb-4">
                        {selectedTeams.map((teamId, index) => {
                            const team = teams.find(t => t.id === teamId);
                            const range = teamRanges[teamId] || {startRange: '', endRange: '', count: 0};
                            const hasError = teamsWithErrors.includes(teamId);
                            const rangeError = teamRangeErrors[teamId];
                            const canAssign = canTeamHaveSerials(teamId);
                            const isDisabled = !canAssign && getRemainingSerials() === 0 && !range.startRange;

                            return (
                                <div key={teamId} className={`p-3 border rounded-lg ${
                                    hasError || rangeError
                                        ? 'border-red-500 bg-red-50'
                                        : isDisabled
                                            ? 'border-gray-300 bg-gray-100'
                                            : 'border-gray-200'
                                }`}>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                                        {team?.name}
                                        {hasError && (
                                            <span className="ml-2 text-xs text-red-600 font-medium">
                                                Please fill in all ranges
                                            </span>
                                        )}
                                        {rangeError && (
                                            <span className="ml-2 text-xs text-red-600 font-medium">
                                                {rangeError}
                                            </span>
                                        )}
                                        {isDisabled && (
                                            <span className="ml-2 text-xs text-orange-600 font-medium">
                                                No more serials to assign
                                            </span>
                                        )}
                                    </h3>

                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <div className="relative">
                                            <label className="block text-xs text-gray-500 mb-1">Start Range</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={range.startRange}
                                                    onChange={(e) => handleRangeChange(teamId, 'startRange', e.target.value)}
                                                    onFocus={() => setActiveDropdown(`${teamId}-start`)}
                                                    placeholder="e.g., 89253000"
                                                    className={`w-full p-2 text-sm border rounded ${
                                                        hasError && !range.startRange
                                                            ? 'border-red-500 bg-red-50'
                                                            : successfulRanges[teamId]?.startRange
                                                                ? 'border-green-500 pr-8'
                                                                : isDisabled
                                                                    ? 'border-gray-300 bg-gray-100'
                                                                    : 'border-gray-300'
                                                    }`}
                                                    disabled={isDisabled}
                                                />
                                                {successfulRanges[teamId]?.startRange && (
                                                    <div
                                                        className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-green-500">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor"
                                                             viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Suggestions dropdown for start range */}
                                            {range.startRange && range.startRange.length >= 2 && activeDropdown === `${teamId}-start` && (
                                                <div
                                                    ref={activeDropdown === `${teamId}-start` ? dropdownRef : null}
                                                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto"
                                                >
                                                    {generateSuggestions(range.startRange, teamId, 'startRange').length > 0 ? (
                                                        <>
                                                            <div
                                                                className="px-3 py-1 text-xs text-gray-500 border-b border-gray-200">
                                                                Select a starting serial number
                                                            </div>
                                                            {generateSuggestions(range.startRange, teamId, 'startRange').map((suggestion, idx) => {
                                                                // Check if this would be a good suggestion (e.g., after previous team's end)
                                                                let isRecommended = false;
                                                                if (index > 0) {
                                                                    const prevTeamId = selectedTeams[index - 1];
                                                                    const prevRange = teamRanges[prevTeamId] || {};
                                                                    if (prevRange.endRange) {
                                                                        const prevEndIdx = availableSerials.findIndex(s => s.value === prevRange.endRange);
                                                                        const suggestionIdx = availableSerials.findIndex(s => s.value === suggestion.value);
                                                                        isRecommended = prevEndIdx !== -1 && suggestionIdx !== -1 && suggestionIdx === prevEndIdx + 1;
                                                                    }
                                                                }

                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className={`px-3 py-2 text-sm flex justify-between items-center ${
                                                                            suggestion.isUsed
                                                                                ? 'bg-gray-100 text-gray-500'
                                                                                : isRecommended
                                                                                    ? 'bg-green-50 cursor-pointer hover:bg-green-100'
                                                                                    : 'cursor-pointer hover:bg-gray-100'
                                                                        }`}
                                                                        onClick={() => {
                                                                            if (!suggestion.isUsed) {
                                                                                handleRangeChange(teamId, 'startRange', suggestion.value);
                                                                                setActiveDropdown(null);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <span>{suggestion.value}</span>
                                                                        <div className="flex items-center space-x-2">
                                                                            {suggestion.isUsed ? (
                                                                                <span
                                                                                    className="text-xs text-orange-600 font-medium">
                                                                                    Assigned to {suggestion.assignment.teamName}
                                                                                </span>
                                                                            ) : isRecommended && (
                                                                                <span
                                                                                    className="text-xs text-green-600 font-medium">
                                                                                    Recommended
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </>
                                                    ) : (
                                                        <div className="px-3 py-2 text-sm text-gray-500">
                                                            No matching serials found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <label className="block text-xs text-gray-500 mb-1">End Range</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={range.endRange}
                                                    onChange={(e) => handleRangeChange(teamId, 'endRange', e.target.value)}
                                                    onFocus={() => setActiveDropdown(`${teamId}-end`)}
                                                    placeholder="e.g., 89253999"
                                                    className={`w-full p-2 text-sm border rounded ${
                                                        hasError && !range.endRange
                                                            ? 'border-red-500 bg-red-50'
                                                            : successfulRanges[teamId]?.endRange
                                                                ? 'border-green-500 pr-8'
                                                                : isDisabled
                                                                    ? 'border-gray-300 bg-gray-100'
                                                                    : 'border-gray-300'
                                                    }`}
                                                    disabled={isDisabled}
                                                />
                                                {successfulRanges[teamId]?.endRange && (
                                                    <div
                                                        className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-green-500">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor"
                                                             viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Suggestions dropdown for end range */}
                                            {range.endRange && range.endRange.length >= 2 && activeDropdown === `${teamId}-end` && (
                                                <div
                                                    ref={activeDropdown === `${teamId}-end` ? dropdownRef : null}
                                                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto"
                                                >
                                                    {generateSuggestions(range.endRange, teamId, 'endRange').length > 0 ? (
                                                        <>
                                                            <div
                                                                className="px-3 py-1 text-xs text-gray-500 border-b border-gray-200">
                                                                Select an ending serial number
                                                            </div>
                                                            {generateSuggestions(range.endRange, teamId, 'endRange').map((suggestion, idx) => {
                                                                // Check if this would be a good suggestion based on count
                                                                let isRecommended = false;
                                                                let countInfo = '';

                                                                if (range.startRange) {
                                                                    const startIdx = availableSerials.findIndex(s => s.value === range.startRange);
                                                                    const suggestionIdx = availableSerials.findIndex(s => s.value === suggestion.value);

                                                                    if (startIdx !== -1 && suggestionIdx !== -1 && suggestionIdx >= startIdx) {
                                                                        const resultingCount = suggestionIdx - startIdx + 1;
                                                                        countInfo = `${resultingCount} SIMs`;

                                                                        // If count is set, check if this suggestion matches it
                                                                        if (range.count > 0) {
                                                                            const idealEndIdx = startIdx + range.count - 1;
                                                                            isRecommended = suggestionIdx === idealEndIdx;
                                                                        }
                                                                    }
                                                                }

                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className={`px-3 py-2 text-sm flex justify-between items-center ${
                                                                            suggestion.isUsed
                                                                                ? 'bg-gray-100 text-gray-500'
                                                                                : isRecommended
                                                                                    ? 'bg-green-50 cursor-pointer hover:bg-green-100'
                                                                                    : 'cursor-pointer hover:bg-gray-100'
                                                                        }`}
                                                                        onClick={() => {
                                                                            if (!suggestion.isUsed) {
                                                                                handleRangeChange(teamId, 'endRange', suggestion.value);
                                                                                setActiveDropdown(null);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <span>{suggestion.value}</span>
                                                                        <div className="flex items-center space-x-2">
                                                                            {suggestion.isUsed ? (
                                                                                <span
                                                                                    className="text-xs text-orange-600 font-medium">
                                                                                    Assigned to {suggestion.assignment.teamName}
                                                                                </span>
                                                                            ) : (
                                                                                <>
                                                                                    {countInfo && (
                                                                                        <span
                                                                                            className="text-xs text-gray-500">
                                                                                            {countInfo}
                                                                                        </span>
                                                                                    )}
                                                                                    {isRecommended && (
                                                                                        <span
                                                                                            className="text-xs text-green-600 font-medium">
                                                                                            Matches count
                                                                                        </span>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </>
                                                    ) : (
                                                        <div className="px-3 py-2 text-sm text-gray-500">
                                                            No matching serials found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {boxMode ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs text-gray-500">Box Count:</label>
                                                    <input
                                                        type="number"
                                                        value={(teamBoxes[teamId]?.boxCount) || ''}
                                                        onChange={(e) => {
                                                            const newBoxCount = parseInt(e.target.value);
                                                            // Store the value temporarily without applying it
                                                            const tempBoxCount = !isNaN(newBoxCount) && newBoxCount > 0 ? newBoxCount : 0;

                                                            // Update the box count in the state
                                                            handleBoxCountChange(teamId, tempBoxCount);
                                                        }}
                                                        placeholder="0"
                                                        className={`w-20 p-1 text-sm border rounded ${
                                                            !range.startRange ? 'border-gray-300 bg-gray-100' : 'border-gray-300'
                                                        }`}
                                                        disabled={isDisabled || !range.startRange}
                                                    />
                                                    <button
                                                        onClick={() => handleBoxCountChange(teamId, teamBoxes[teamId]?.boxCount || 1)}
                                                        className={`px-2 py-1 text-xs rounded ${
                                                            !range.startRange || isDisabled
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                        }`}
                                                        disabled={!range.startRange || isDisabled}
                                                    >
                                                        Update Boxes
                                                    </button>
                                                </div>

                                                {range.count > 0 && (
                                                    <span className="text-xs text-green-600 font-medium">
                                                        {teamBoxes[teamId]?.boxCount || 0} Boxes ({range.count} SIMs)
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs text-gray-500">Count:</label>
                                                    <input
                                                        type="number"
                                                        value={range.count || ''}
                                                        onChange={(e) => {
                                                            const newCount = parseInt(e.target.value);
                                                            // Store the value temporarily without applying it
                                                            const tempCount = !isNaN(newCount) && newCount > 0 ? newCount : 0;

                                                            // Update the count in the state
                                                            handleCountChange(teamId, tempCount);
                                                        }}
                                                        placeholder="0"
                                                        className={`w-20 p-1 text-sm border rounded ${
                                                            !range.startRange ? 'border-gray-300 bg-gray-100' : 'border-gray-300'
                                                        }`}
                                                        disabled={isDisabled || !range.startRange}
                                                    />
                                                    <button
                                                        onClick={() => handleCountChange(teamId, range.count)}
                                                        className={`px-2 py-1 text-xs rounded ${
                                                            !range.startRange || !range.count || isDisabled
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                        }`}
                                                        disabled={!range.startRange || !range.count || isDisabled}
                                                    >
                                                        Auto-set End
                                                    </button>
                                                </div>

                                                {range.count > 0 && (
                                                    <span className="text-xs text-green-600 font-medium">
                                                        {range.count} SIMs
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Preview of what will happen when count is changed */}
                                        {range.startRange && range.count > 0 && (
                                            <div
                                                className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                                                <div className="flex justify-between">
                                                    <span>Preview:</span>
                                                    <span className="font-medium">
                                                        {(() => {
                                                            const startIdx = availableSerials.findIndex(s => s.value === range.startRange);
                                                            if (startIdx === -1) return 'Invalid start range';

                                                            const endIdx = startIdx + range.count - 1;
                                                            if (endIdx >= availableSerials.length) return 'Not enough serials available';

                                                            const endRange = availableSerials[endIdx].value;
                                                            return `End: ${endRange}`;
                                                        })()}
                                                    </span>
                                                </div>

                                                {/* Show impact on next team if applicable */}
                                                {index < selectedTeams.length - 1 && (
                                                    <div className="mt-1 text-xs">
                                                        {(() => {
                                                            const startIdx = availableSerials.findIndex(s => s.value === range.startRange);
                                                            if (startIdx === -1) return null;

                                                            const endIdx = startIdx + range.count - 1;

                                                            // Check if there are no serials left for remaining teams
                                                            if (endIdx >= availableSerials.length - 1) {
                                                                // Get all remaining teams that won't have serials
                                                                const affectedTeams = [];
                                                                for (let i = index + 1; i < selectedTeams.length; i++) {
                                                                    const teamId = selectedTeams[i];
                                                                    const team = teams.find(t => t.id === teamId);
                                                                    if (team) {
                                                                        affectedTeams.push(team.name);
                                                                    }
                                                                }

                                                                if (affectedTeams.length === 0) return null;

                                                                const teamsText = affectedTeams.length === 1 
                                                                    ? affectedTeams[0] 
                                                                    : `${affectedTeams.slice(0, -1).join(', ')} and ${affectedTeams[affectedTeams.length - 1]}`;

                                                                return (
                                                                    <span className="text-orange-600">
                                                                        No serials will be left for {teamsText}
                                                                    </span>
                                                                );
                                                            }

                                                            // If there are serials left, show where the next team will start
                                                            const nextStartIdx = endIdx + 1;
                                                            if (nextStartIdx < availableSerials.length) {
                                                                const nextTeamId = selectedTeams[index + 1];
                                                                const nextTeam = teams.find(t => t.id === nextTeamId);
                                                                const nextStart = availableSerials[nextStartIdx].value;
                                                                return (
                                                                    <span className="text-blue-600">
                                                                        Next team will start at: {nextStart}
                                                                    </span>
                                                                );
                                                            }

                                                            return null;
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Box details in box mode */}
                                        {boxMode && teamBoxes[teamId]?.boxes && teamBoxes[teamId].boxes.length > 0 && (
                                            <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                                                <div className="font-medium mb-1">Box Details:</div>
                                                <div className="max-h-32 overflow-y-auto">
                                                    {teamBoxes[teamId].boxes.map((box, boxIdx) => (
                                                        <div key={boxIdx} className="mb-1 pb-1 border-b border-gray-200 last:border-b-0">
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Box {box.boxNumber}:</span>
                                                                <span>{box.count} SIMs</span>
                                                            </div>
                                                            <div className="flex justify-between text-gray-500">
                                                                <span>Start: {box.startRange}</span>
                                                                <span>End: {box.endRange}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={handleConfirm}
                            className="px-4 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Confirm & Upload
                        </button>
                        <button
                            onClick={() => setView('selection')}
                            className="px-4 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Back
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
export default TeamSelectionModalContent
