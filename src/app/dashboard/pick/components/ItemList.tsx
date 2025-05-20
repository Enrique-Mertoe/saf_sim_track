import { useState, useEffect, SetStateAction} from 'react';
import {AnimatePresence} from 'framer-motion';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {SerialItem} from "@/app/dashboard/pick/components/SerialItem";

const PaginatedSerialGrid = ({
                               serialNumbers,
                               editSerial,
                               removeSerial,
                               selectedTeam,
                               teams,
                               onCheckComplete,
                               onUploadComplete,
                               updateSerialStatus
                             }: any) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9); // 3x3 grid by default

  // Calculate total pages
  const totalPages = Math.ceil(serialNumbers.length / itemsPerPage);

  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = serialNumbers.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber: any) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e:any) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Reset to page 1 if serialNumbers changes significantly
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTeam]);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages are less than maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);

      // Calculate middle pages to show
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = Math.min(maxPagesToShow - 1, totalPages - 1);
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - (maxPagesToShow - 2));
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }

      // Always include last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Display SerialItems grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence>
          {currentItems.map((serial:any) => (
            <SerialItem
              key={serial.id}
              serial={serial}
              editSerial={editSerial}
              removeSerial={removeSerial}
              selectedTeam={selectedTeam}
              teams={teams}
              onCheckComplete={onCheckComplete}
              onUploadComplete={onUploadComplete}
              updateSerialStatus={updateSerialStatus}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
        <div className="flex items-center">
          <span className="text-sm text-gray-600">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, serialNumbers.length)} of {serialNumbers.length} items
          </span>
          <div className="ml-4">
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value={6}>6 per page</option>
              <option value={9}>9 per page</option>
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <ChevronLeft size={16} />
          </button>

          {getPageNumbers().map((number, index) => (
            <button
              key={index}
              onClick={() => number !== '...' ? goToPage(number) : null}
              className={`px-3 py-1 rounded-md ${
                number === currentPage 
                  ? 'bg-blue-500 text-white' 
                  : number === '...' 
                    ? 'cursor-default'
                    : 'hover:bg-gray-100'
              }`}
            >
              {number}
            </button>
          ))}

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaginatedSerialGrid;