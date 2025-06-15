import React, {useEffect, useState} from 'react';
import {User} from '@/models';
import simService from '@/services/simService';

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
  const serialsPerPage = 50;

  useEffect(() => {
    const fetchBoxes = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        // Get all SIM cards for this team and batch
        const simCards = await simService.getInBatched(user, "batch_id", [batchId]);

        // Filter by team_id
        const teamSimCards = simCards.filter((card: any) => card.team_id === teamId);

        // Group by lot
        const lotGroups: { [key: string]: string[] } = {};

        teamSimCards.forEach((card: any) => {
          const lot = card.lot || 'Unknown';
          const serial = card.serial_number;

          if (!lotGroups[lot]) {
            lotGroups[lot] = [];
          }

          lotGroups[lot].push(serial);
        });

        // Create boxes
        const boxesData = Object.entries(lotGroups).map(([lot, serials]) => {
          // Sort serials for determining start and end
          const sortedSerials = [...serials].sort();

          return {
            lot,
            startSerial: sortedSerials[0] || '',
            endSerial: sortedSerials[sortedSerials.length - 1] || '',
            serials: [], // Will be loaded on demand
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
      const simCards = await simService.getInBatched(user, "batch_id", [batchId]);

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
        count: sortedSerials.length, // Update count with actual loaded serials count
        isLoading: false
      };

      setBoxes(updatedBoxes);
      setSelectedBox(updatedBoxes[currentBoxIndex]);
      setSerialsPage(1); // Reset to first page when selecting a new box
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-h-[80vh] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {teamName} - Batch {batchId}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <span className="inline-block animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full"></span>
          <span className="ml-2 text-gray-600">Loading boxes...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
        </div>
      ) : boxes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No boxes found for this team and batch.</p>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel - Box listing */}
          <div className="w-1/2 pr-4 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Boxes</h3>
            <div className="space-y-2">
              {boxes.map((box) => (
                <div
                  key={box.lot}
                  onClick={() => handleBoxClick(box)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedBox?.lot === box.lot
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-800">Lot: {box.lot}</h4>
                      <div className="text-sm text-gray-500 mt-1">
                        <div>Start: {box.startSerial}</div>
                        <div>End: {box.endSerial}</div>
                        <div>Count: {box.count}</div>
                      </div>
                    </div>
                    {box.isLoading && (
                      <span className="inline-block animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel - Serials listing */}
          <div className="w-1/2 pl-4 border-l border-gray-200 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-700 mb-3">
              {selectedBox ? `Serials for Lot: ${selectedBox.lot}` : 'Select a box to view serials'}
            </h3>

            {selectedBox ? (
              <>
                {selectedBox.isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <span className="inline-block animate-spin h-6 w-6 border-3 border-green-600 border-t-transparent rounded-full"></span>
                    <span className="ml-2 text-gray-600">Loading serials...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-2 mb-4">
                      {getPaginatedSerials().map((serial, index) => (
                        <div 
                          key={index} 
                          className="p-2 border border-gray-200 rounded bg-gray-50 text-sm"
                        >
                          {serial}
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center mt-4">
                        <button
                          onClick={() => setSerialsPage(Math.max(1, serialsPage - 1))}
                          disabled={serialsPage === 1}
                          className="px-3 py-1 bg-green-50 text-green-700 rounded border border-green-300 hover:bg-green-100 disabled:opacity-50"
                        >
                          Previous
                        </button>

                        <span className="text-sm text-gray-600">
                          Page {serialsPage} of {totalPages}
                        </span>

                        <button
                          onClick={() => setSerialsPage(Math.min(totalPages, serialsPage + 1))}
                          disabled={serialsPage === totalPages}
                          className="px-3 py-1 bg-green-50 text-green-700 rounded border border-green-300 hover:bg-green-100 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Select a box from the left to view its serials</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchTeamSerials;
