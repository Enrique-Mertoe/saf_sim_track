import React, {useState} from 'react';
import {ChevronDown, ChevronRight, Folder, Trash2} from 'lucide-react';
import {BatchMetadata} from '@/models';
import SimCardList from './SimCardList';

interface BatchItemProps {
  batch: BatchMetadata;
  isBatchExpanded: boolean;
  isBatchSelected: boolean;
  toggleSelection: (type: 'teams' | 'batches' | 'simcards', id: string) => void;
  toggleBatchExpansion: (batchId: string) => void;
  simcards: { [batchId: string]: any[] };
  getBatchCounts: (batchId: string) => { totalSimcards: number; completedSimcards: number };
  selectedItems: {
    teams: string[];
    batches: string[];
    simcards: string[];
  };
}

const BatchItem: React.FC<BatchItemProps> = ({
  batch,
  isBatchExpanded,
  isBatchSelected,
  toggleSelection,
  toggleBatchExpansion,
  simcards,
  getBatchCounts,
  selectedItems
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { totalSimcards, completedSimcards } = getBatchCounts(batch.batch_id);

  const handleBatchExpansion = () => {
    setIsLoading(true);
    toggleBatchExpansion(batch.batch_id);
    // Simulate loading for demonstration
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleDeleteBatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Implement delete functionality
    console.log(`Delete batch: ${batch.batch_id}`);
  };

  // Determine progress color based on completion percentage
  const getProgressColor = () => {
    if (totalSimcards === 0) return 'text-gray-600'; // No change if batch is empty
    
    const completionPercentage = (completedSimcards / totalSimcards) * 100;
    
    if (completionPercentage === 0) return 'text-gray-600';
    if (completionPercentage < 30) return 'text-red-600';
    if (completionPercentage < 70) return 'text-orange-600';
    if (completionPercentage < 100) return 'text-blue-600';
    return 'text-green-600';
  };

  const progressColor = getProgressColor();

  return (
    <div className="pl-8">
      {/* Batch Header */}
      <div
        className={`p-4 flex items-center justify-between cursor-pointer ${
          isBatchSelected ? 'bg-blue-50' : 'hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isBatchSelected}
            onChange={() => toggleSelection('batches', batch.batch_id)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={handleBatchExpansion}
            className="flex items-center"
          >
            {isBatchExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-500 mr-2" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500 mr-2" />
            )}
            <Folder className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="font-medium text-gray-900">
              Batch {batch.batch_id.substring(0, 8)}
              {batch.order_number && ` - Order ${batch.order_number}`}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className={`text-sm ${progressColor}`}>
            <span className="font-medium">{completedSimcards}</span>/{totalSimcards} Completed
          </div>
          <button
            onClick={handleDeleteBatch}
            className="p-1 text-red-500 hover:bg-red-50 rounded-full"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SIM Cards List with Loading State */}
      {isBatchExpanded && (
        <div className="border-t border-gray-200 bg-white">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-sm text-gray-500">Loading SIM cards...</p>
            </div>
          ) : (simcards[batch.batch_id] || []).length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No SIM cards found in this batch
            </div>
          ) : (
            <SimCardList 
              simcards={simcards[batch.batch_id] || []} 
              selectedItems={selectedItems}
              toggleSelection={toggleSelection}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default BatchItem;