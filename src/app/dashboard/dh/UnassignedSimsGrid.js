import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Check, ChevronLeft, ChevronRight, Clock, X} from 'lucide-react';

const UnassignedSimsGrid = ({
                                simCards,
                                selectedStaff,
                                searchTerm,
                                filterSimCards,
                                SIMStatus,
                                itemsPerPage = 12,
                                onAssign
                            }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSims, setSelectedSims] = useState(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [dragEnd, setDragEnd] = useState(null);
    const [dragSelectionBox, setDragSelectionBox] = useState(null);

    const gridRef = useRef(null);
    const cardRefs = useRef(new Map());
    const dragTimeoutRef = useRef(null);
    const isMouseDownRef = useRef(false);

    // Filter unassigned SIM cards
    const filteredSims = useMemo(() => {
        return simCards.filter(sim => {
            const isUnassigned = sim.status !== SIMStatus.ASSIGNED;
            const otherFiltersMatch = filterSimCards([sim], {
                staffFilter: selectedStaff,
                searchFilter: searchTerm
            }).length > 0;
            return isUnassigned && otherFiltersMatch;
        });
    }, [simCards, selectedStaff, searchTerm, filterSimCards, SIMStatus]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredSims.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSims = filteredSims.slice(startIndex, endIndex);

    // Reset to first page when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [selectedStaff, searchTerm]);

    // Cancel drag selection and reset all drag states
    const cancelDragSelection = useCallback(() => {
        if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
            dragTimeoutRef.current = null;
        }

        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        setDragSelectionBox(null);
        isMouseDownRef.current = false;

        // Remove event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('contextmenu', handleContextMenu);

        // Remove drag-related classes
        if (gridRef.current) {
            gridRef.current.style.cursor = '';
        }
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    }, []);

    // Handle individual sim selection
    const toggleSimSelection = useCallback((simId) => {
        // Don't toggle selection if we're in the middle of dragging
        if (isDragging) return;

        setSelectedSims(prev => {
            const newSet = new Set(prev);
            if (newSet.has(simId)) {
                newSet.delete(simId);
            } else {
                newSet.add(simId);
            }
            return newSet;
        });
    }, [isDragging]);

    // Clear all selections
    const clearSelection = useCallback(() => {
        setSelectedSims(new Set());
    }, []);

    // Handle assign button click
    const handleAssign = useCallback(() => {
        if (selectedSims.size > 0 && onAssign) {
            const selectedSimsArray = Array.from(selectedSims);
            onAssign(selectedSimsArray);
            clearSelection();
        }
    }, [selectedSims, onAssign, clearSelection]);

    // Get rectangle coordinates with bounds checking
    const getRectFromPoints = useCallback((start, end) => {
        if (!start || !end) return null;

        return {
            left: Math.min(start.x, end.x),
            top: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y)
        };
    }, []);

    // Check if element intersects with selection rectangle
    const isElementInSelection = useCallback((element, selectionRect) => {
        if (!element || !selectionRect || !gridRef.current) return false;

        try {
            const elementRect = element.getBoundingClientRect();
            const gridRect = gridRef.current.getBoundingClientRect();

            // Convert to grid-relative coordinates
            const relativeElementRect = {
                left: elementRect.left - gridRect.left,
                top: elementRect.top - gridRect.top,
                right: elementRect.right - gridRect.left,
                bottom: elementRect.bottom - gridRect.top
            };

            return !(
                relativeElementRect.right < selectionRect.left ||
                relativeElementRect.left > selectionRect.left + selectionRect.width ||
                relativeElementRect.bottom < selectionRect.top ||
                relativeElementRect.top > selectionRect.top + selectionRect.height
            );
        } catch (error) {
            console.warn('Error in isElementInSelection:', error);
            return false;
        }
    }, []);

    // Handle context menu to prevent right-click issues during drag
    const handleContextMenu = useCallback((e) => {
        if (isDragging) {
            e.preventDefault();
            cancelDragSelection();
        }
    }, [isDragging, cancelDragSelection]);

    // Handle mouse down for drag selection
    const handleMouseDown = useCallback((e) => {
        // Only handle left mouse button
        if (e.button !== 0) return;

        // Don't start drag on interactive elements
        if (e.target.closest('.sim-card') || e.target.closest('button') || e.target.closest('select')) return;

        if (!gridRef.current) return;

        try {
            const gridRect = gridRef.current.getBoundingClientRect();
            const startPoint = {
                x: Math.max(0, Math.min(e.clientX - gridRect.left, gridRect.width)),
                y: Math.max(0, Math.min(e.clientY - gridRect.top, gridRect.height))
            };

            isMouseDownRef.current = true;
            setIsDragging(true);
            setDragStart(startPoint);
            setDragEnd(startPoint);
            setDragSelectionBox(getRectFromPoints(startPoint, startPoint));

            // Set cursor and prevent text selection
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'crosshair';

            // Safety timeout - cancel drag after 30 seconds
            dragTimeoutRef.current = setTimeout(() => {
                console.warn('Drag selection timeout - auto-cancelling');
                cancelDragSelection();
            }, 30000);

            e.preventDefault();
            e.stopPropagation();
        } catch (error) {
            console.error('Error in handleMouseDown:', error);
            cancelDragSelection();
        }
    }, [getRectFromPoints, cancelDragSelection]);

    // Handle mouse move for drag selection
    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !dragStart || !isMouseDownRef.current || !gridRef.current) return;

        try {
            const gridRect = gridRef.current.getBoundingClientRect();
            const currentPoint = {
                x: Math.max(0, Math.min(e.clientX - gridRect.left, gridRect.width)),
                y: Math.max(0, Math.min(e.clientY - gridRect.top, gridRect.height))
            };

            setDragEnd(currentPoint);
            const selectionRect = getRectFromPoints(dragStart, currentPoint);
            setDragSelectionBox(selectionRect);
        } catch (error) {
            console.error('Error in handleMouseMove:', error);
            cancelDragSelection();
        }
    }, [isDragging, dragStart, getRectFromPoints, cancelDragSelection]);

    // Handle mouse up for drag selection
    const handleMouseUp = useCallback((e) => {
        if (!isDragging || !dragSelectionBox || !isMouseDownRef.current) {
            cancelDragSelection();
            return;
        }

        try {
            // Only process if it was a meaningful drag (minimum size)
            if (dragSelectionBox.width > 5 || dragSelectionBox.height > 5) {
                // Find all sim cards that intersect with the selection rectangle
                const newSelection = new Set(selectedSims);

                cardRefs.current.forEach((element, simId) => {
                    if (isElementInSelection(element, dragSelectionBox)) {
                        newSelection.add(simId);
                    }
                });

                setSelectedSims(newSelection);
            }
        } catch (error) {
            console.error('Error in handleMouseUp:', error);
        } finally {
            cancelDragSelection();
        }
    }, [isDragging, dragSelectionBox, selectedSims, isElementInSelection, cancelDragSelection]);

    // Handle escape key and other keyboard events
    const handleKeyDown = useCallback((e) => {
        switch (e.key) {
            case 'Escape':
                if (isDragging) {
                    e.preventDefault();
                    cancelDragSelection();
                } else if (selectedSims.size > 0) {
                    clearSelection();
                }
                break;
            case 'a':
            case 'A':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    // Select all visible sims
                    const allVisibleSimIds = new Set(currentSims.map(sim => sim.id));
                    setSelectedSims(allVisibleSimIds);
                }
                break;
            default:
                break;
        }
    }, [isDragging, selectedSims.size, cancelDragSelection, clearSelection, currentSims]);

    // Handle window blur/focus to prevent stuck drag states
    const handleWindowBlur = useCallback(() => {
        if (isDragging) {
            cancelDragSelection();
        }
    }, [isDragging, cancelDragSelection]);

    const handleVisibilityChange = useCallback(() => {
        if (document.hidden && isDragging) {
            cancelDragSelection();
        }
    }, [isDragging, cancelDragSelection]);

    // Add event listeners
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove, { passive: false });
            document.addEventListener('mouseup', handleMouseUp, { passive: false });
            document.addEventListener('contextmenu', handleContextMenu, { passive: false });
        }

        // Always listen for keyboard events and window events
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('blur', handleWindowBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('blur', handleWindowBlur);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isDragging, handleMouseMove, handleMouseUp, handleContextMenu, handleKeyDown, handleWindowBlur, handleVisibilityChange]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cancelDragSelection();
        };
    }, [cancelDragSelection]);

    const handlePageChange = (page) => {
        // Cancel any ongoing drag before changing pages
        if (isDragging) {
            cancelDragSelection();
        }
        setCurrentPage(page);
    };

    const handlePreviousPage = () => {
        if (isDragging) {
            cancelDragSelection();
        }
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        if (isDragging) {
            cancelDragSelection();
        }
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (filteredSims.length === 0) {
        return (
            <div className="text-center px-6  py-12">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"/>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Unassigned SIMs</h3>
                <p className="text-gray-500 dark:text-gray-400">All SIM cards have been assigned or there are no matches for your current filters.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Selection Controls */}
            {selectedSims.size > 0 && (
                <div className="px-6">
                    <div className="bg-blue-50   dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400"/>
                                    <span className="font-medium text-blue-900 dark:text-blue-100">
                                    {selectedSims.size} SIM{selectedSims.size !== 1 ? 's' : ''} selected
                                </span>
                                </div>
                                <button
                                    onClick={clearSelection}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                >
                                    <X className="w-3 h-3"/>
                                    Clear selection
                                </button>
                            </div>
                            <button
                                onClick={handleAssign}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                            >
                                Assign Selected ({selectedSims.size})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Info */}
            <div className="flex px-6 justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredSims.length)} of {filteredSims.length} unassigned SIMs
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Items per page:</span>
                    <select
                        value={itemsPerPage}
                        className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm"
                        onChange={(e) => {
                            const newItemsPerPage = parseInt(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value={8}>8</option>
                        <option value={12}>12</option>
                        <option value={16}>16</option>
                        <option value={24}>24</option>
                    </select>
                </div>
            </div>

            {/* Help Text */}
            {!isDragging && (
                <div className="px-6">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        💡 Tip: Drag to select multiple SIMs, press Escape to cancel selection, or Ctrl+A to select all visible SIMs
                    </p>
                </div>
            )}

            {/* SIM Cards Grid */}
            <div
                ref={gridRef}
                className="relative p-6 select-none"
                onMouseDown={handleMouseDown}
                style={{
                    userSelect: 'none',
                    cursor: isDragging ? 'crosshair' : 'default'
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentSims.map((sim) => {
                        const isSelected = selectedSims.has(sim.id);
                        return (
                            <div
                                key={sim.id}
                                ref={el => {
                                    if (el) {
                                        cardRefs.current.set(sim.id, el);
                                    } else {
                                        cardRefs.current.delete(sim.id);
                                    }
                                }}
                                className={`sim-card bg-white dark:bg-gray-700 border-2 rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer ${
                                    isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-600'
                                } ${isDragging ? 'pointer-events-none' : ''}`}
                                onClick={() => toggleSimSelection(sim.id)}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                        isSelected
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'border-gray-300 dark:border-gray-500'
                                    }`}>
                                        {isSelected && <Check className="w-3 h-3 text-white"/>}
                                    </div>
                                    <Clock className="w-4 h-4 text-orange-500"/>
                                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                        {sim.serial_number}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400">
                                        Unassigned
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Drag Selection Overlay */}
                {isDragging && dragSelectionBox && (
                    <div
                        className="absolute pointer-events-none bg-blue-200/30 dark:bg-blue-400/20 border border-blue-400 dark:border-blue-300 border-dashed"
                        style={{
                            left: dragSelectionBox.left,
                            top: dragSelectionBox.top,
                            width: dragSelectionBox.width,
                            height: dragSelectionBox.height,
                            zIndex: 1000
                        }}
                    />
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4"/>
                            Previous
                        </button>

                        <div className="flex items-center gap-1">
                            {getPageNumbers().map((page, index) => (
                                page === '...' ? (
                                    <span key={index} className="px-3 py-2 text-gray-500 dark:text-gray-400">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={index}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                            currentPage === page
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}
                        </div>

                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                            <ChevronRight className="w-4 h-4"/>
                        </button>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnassignedSimsGrid;