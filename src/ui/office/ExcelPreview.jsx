import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Download, FileSpreadsheet, Grid3X3} from 'lucide-react';
import Theme from "@/ui/Theme";

// Main ExcelPreview Component
const ExcelPreview = ({
                          data = [],
                          config = {},
                          onDownload,
                          onCellClick,
                          onSheetChange,
                          className = ""
                      }) => {
    const defaultConfig = {
        showDownloadButton: true,
        showCellAddress: true,
        showSheetInfo: true,
        maxHeight: "24rem", // max-h-96
        cellWidth: "8rem", // min-w-32
        theme: {
            primary: "blue",
            headerBg: "gray-100",
            cellBorder: "gray-300",
            selectedCell: "blue-100",
            selectedBorder: "blue-400"
        },
        styling: {
            enableCellColors: false,
            enableTabColors: false,
            enableHeaderColors: false,
            enableBorders: true,
            enableHover: true
        },
        title: "Excel Preview",
    };

    const mergedConfig = {...defaultConfig, ...config};
    const {theme, styling} = mergedConfig;

    const [activeSheet, setActiveSheet] = useState(0);
    const [selectedCell, setSelectedCell] = useState(null);

    // Pagination state
    const [visibleRowsCount, setVisibleRowsCount] = useState(50); // Initial number of rows to display
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const scrollContainerRef = useRef(null);

    // Calculate how many rows should be visible based on container height
    const calculateVisibleRows = useCallback(() => {
        if (!scrollContainerRef.current) return 50; // Default if ref not available

        const containerHeight = scrollContainerRef.current.clientHeight;
        const rowHeight = 32; // 8 * 4 = 32px (h-8 class)
        const visibleRows = Math.ceil(containerHeight / rowHeight) * 2; // Double the visible rows for smoother scrolling

        return Math.max(visibleRows, 20); // Ensure at least 20 rows
    }, []);

    // Handle scroll event to load more rows when near bottom
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current || isLoadingMore) return;

        const {scrollTop, scrollHeight, clientHeight} = scrollContainerRef.current;
        const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 500;

        if (scrolledToBottom) {
            // console.log("bt,m", scrolledToBottom)
            const currentSheet = data[activeSheet];
            if (!currentSheet) return;

            // If we haven't loaded all rows yet
            if (visibleRowsCount < currentSheet.data.length) {
                setIsLoadingMore(true);

                // Use requestAnimationFrame for better performance
                requestAnimationFrame(() => {
                    // Calculate how many more rows to load based on container height
                    const increment = calculateVisibleRows();
                    // Update visible rows count, but don't exceed total rows
                    setVisibleRowsCount(prev => Math.min(prev + increment, currentSheet.data.length));
                    setIsLoadingMore(false);
                });
            }
        }
    }, [activeSheet, data, isLoadingMore, calculateVisibleRows]);

    // Initialize pagination and set up scroll listener
    useEffect(() => {
        // Calculate initial visible rows based on container size
        const initializeVisibleRows = () => {
            if (scrollContainerRef.current) {
                const initialRows = calculateVisibleRows();
                setVisibleRowsCount(initialRows);
            }
        };

        // Initial calculation
        initializeVisibleRows();

        // Recalculate on window resize for responsive behavior
        window.addEventListener('resize', initializeVisibleRows);

        // Set up scroll event listener
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
        }

        // Clean up event listeners
        return () => {
            window.removeEventListener('resize', initializeVisibleRows);
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, [calculateVisibleRows, handleScroll]);

    // Initialize visible rows when data changes
    useEffect(() => {
        if (scrollContainerRef.current && data && data.length > 0) {
            const initialRows = calculateVisibleRows();
            setVisibleRowsCount(initialRows);
        }
    }, [data, calculateVisibleRows]);

    // We handle pagination reset in handleSheetChange, so no separate useEffect needed

    const getColumnLetter = (index) => {
        let result = '';
        while (index >= 0) {
            result = String.fromCharCode(65 + (index % 26)) + result;
            index = Math.floor(index / 26) - 1;
        }
        return result;
    };

    const getCellAddress = (rowIndex, colIndex) => {
        return `${getColumnLetter(colIndex)}${rowIndex + 1}`;
    };

    const handleCellClick = (rowIndex, colIndex, cellData) => {
        setSelectedCell({row: rowIndex, col: colIndex});
        if (onCellClick) {
            onCellClick(rowIndex, colIndex, cellData, getCellAddress(rowIndex, colIndex));
        }
    };

    const handleSheetChange = (sheetIndex) => {
        setActiveSheet(sheetIndex);
        setSelectedCell(null);

        // Reset pagination when changing sheets
        if (scrollContainerRef.current) {
            const initialRows = calculateVisibleRows();
            setVisibleRowsCount(initialRows);
            scrollContainerRef.current.scrollTop = 0; // Scroll back to top
        }

        if (onSheetChange) {
            onSheetChange(sheetIndex, data[sheetIndex]);
        }
    };

    const handleDownload = () => {
        if (onDownload) {
            onDownload(data, activeSheet);
        } else {
            alert('Download functionality not implemented');
        }
    };

    const getCellStyle = (cell, rowIndex, colIndex, sheet) => {
        let baseClasses = `h-8 border-r border-b px-2 text-sm cursor-cell transition-colors whitespace-nowrap ${styling.enableBorders ? `border-${theme.cellBorder}` : 'border-transparent'}`;

        // Selection styling
        if (selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex) {
            baseClasses += ` bg-${theme.selectedCell} border-${theme.selectedBorder}`;
        } else {
            // Custom cell colors
            if (styling.enableCellColors && cell && typeof cell === 'object' && cell.style) {
                baseClasses += ` ${cell.style}`;
            } else if (sheet.hasHeaders && rowIndex === 0) {
                // Header styling
                if (styling.enableHeaderColors && sheet.headerStyle) {
                    baseClasses += ` ${sheet.headerStyle}`;
                } else {
                    baseClasses += ` bg-gray-50 font-semibold text-gray-800`;
                }
            } else {
                baseClasses += ` bg-white text-gray-700`;
                if (styling.enableHover) {
                    baseClasses += ` hover:bg-gray-50`;
                }
            }
        }

        // Custom cell width
        baseClasses += ` ${mergedConfig.cellWidth}`;

        return baseClasses;
    };

    const getTabStyle = (sheet, index, isActive) => {
        let baseClasses = 'px-4 py-1  text-sm font-medium rounded-t-sm transition-colors whitespace-nowrap ';

        if (isActive) {
            baseClasses += ` bg-white text-gray-900 border-t border-l border-r border-${theme.cellBorder}`;
        } else {
            if (styling.enableTabColors && sheet.tabStyle) {
                baseClasses += ` ${sheet.tabStyle}`;
            } else {
                baseClasses += ` bg-gray-200 text-gray-600 hover:bg-gray-300`;
            }
        }

        return baseClasses;
    };

    const getCellContent = (cell) => {
        if (cell && typeof cell === 'object') {
            return cell.value || cell.content || '';
        }
        return cell || '';
    };

    if (!data || data.length === 0) {
        return (
            <div className={`w-full max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-8 text-center ${className}`}>
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
                <p className="text-gray-500">No data available for preview</p>
            </div>
        );
    }

    const currentSheet = data[activeSheet];
    if (!currentSheet) return null;

    return (
        <div className={`w-full max-w-7xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden ${className}`}>
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <FileSpreadsheet className={`w-5 h-5 text-${theme.primary}-600`}/>
                        <h2 className="text-lg font-semibold text-gray-800">{mergedConfig.title}</h2>
                    </div>
                    {mergedConfig.showDownloadButton && (
                        <button
                            onClick={handleDownload}
                            className={`flex items-center space-x-2 bg-${theme.primary}-600 hover:bg-${theme.primary}-700 text-white px-4 py-1 rounded-full transition-colors`}
                        >
                            <Download className="w-4 h-4"/>
                            <span>Download Excel</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Sheet Tabs */}
            {data.length > 1 && (
                <div className={`bg-gray-100 border-b border-gray-200 overflow-x-auto ${Theme.Scrollbar}`}>
                    <div className="flex space-x-1 px-2 py-1 min-w-max">
                        {data.map((sheet, index) => (
                            <button
                                key={index}
                                onClick={() => handleSheetChange(index)}
                                className={getTabStyle(sheet, index, activeSheet === index)}
                            >
                                {sheet.name || `Sheet ${index + 1}`}
                            </button>
                        ))}
                    </div>
                    <div className="h-2"></div>
                </div>
            )}

            {/* Cell Address Bar */}
            {mergedConfig.showCellAddress && (
                <div className="bg-white border-b border-gray-200 px-4 py-2">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Grid3X3 className="w-4 h-4 text-gray-500"/>
                            <span className="text-sm font-mono text-gray-600">
                {selectedCell ? getCellAddress(selectedCell.row, selectedCell.col) : 'A1'}
              </span>
                        </div>
                        <div className="flex-1 bg-gray-50 border border-gray-300 rounded px-3 py-1">
              <span className="text-sm text-gray-700">
                {selectedCell && currentSheet.data[selectedCell.row] && currentSheet.data[selectedCell.row][selectedCell.col]
                    ? getCellContent(currentSheet.data[selectedCell.row][selectedCell.col])
                    : 'Select a cell to view content'}
              </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Excel Grid */}
            <div className="relative">
                <div
                    ref={scrollContainerRef}
                    className={`overflow-auto border ${styling.enableBorders ? `border-${theme.cellBorder}` : 'border-transparent'}`}
                    style={{maxHeight: mergedConfig.maxHeight}}
                >
                    <table className="border-collapse">
                        {/* Column Headers */}
                        <thead className="sticky top-0 z-10">
                        <tr>
                            <th className={`sticky left-0 z-20 w-12 h-8 bg-${theme.headerBg} border-r border-b ${styling.enableBorders ? `border-${theme.cellBorder}` : 'border-transparent'} text-xs font-medium text-gray-600`}></th>
                            {currentSheet.data[0] && currentSheet.data[0].map((_, colIndex) => (
                                <th
                                    key={colIndex}
                                    className={`h-8 bg-${theme.headerBg} border-r border-b ${styling.enableBorders ? `border-${theme.cellBorder}` : 'border-transparent'} text-xs font-medium text-gray-600 px-2 ${mergedConfig.cellWidth} whitespace-nowrap`}
                                >
                                    {getColumnLetter(colIndex)}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {/* Only render visible rows for better performance */}
                        {currentSheet.data.slice(0, visibleRowsCount).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                <td className={`sticky left-0 z-10 min-w-12 h-8 bg-${theme.headerBg} border-r border-b ${styling.enableBorders ? `border-${theme.cellBorder}` : 'border-transparent'} text-xs font-medium text-gray-600 text-center`}>
                                    {rowIndex + 1}
                                </td>
                                {row.map((cell, colIndex) => (
                                    <td
                                        key={colIndex}
                                        onClick={() => handleCellClick(rowIndex, colIndex, cell)}
                                        className={getCellStyle(cell, rowIndex, colIndex, currentSheet)}
                                    >
                                        {getCellContent(cell)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sheet Info */}
            {mergedConfig.showSheetInfo && (
                <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Sheet: {currentSheet.name || `Sheet ${activeSheet + 1}`} |
              Rows: {currentSheet.data.length} |
              Columns: {currentSheet.data[0]?.length || 0}
            </span>
                        <span>
              {selectedCell && `Selected: ${getCellAddress(selectedCell.row, selectedCell.col)}`}
            </span>
                    </div>
                </div>
            )}
        </div>
    );
};


export default ExcelPreview;
